import { connectDB } from "@/lib/db";
import { Booking, ACTIVE_STATUSES, BookingStatus } from "@/lib/models/booking";
import { Company } from "@/lib/models/company";
import { Conflict } from "@/lib/models/conflict";
import { getSettings } from "@/lib/me";
import {
  slotStarts,
  slotRangeLabel,
  isWorkingDay,
  isValidSlot,
  slotsForHours,
  minBookableStart,
} from "@/lib/slots";
import { reserveSpan } from "@/lib/reservations";
import type { ISettings } from "@/lib/models/settings";

export interface SlotBooking {
  id: string;
  companyId: string;
  companyName: string;
  phone?: string;
  status: BookingStatus;
  note?: string;
  slotsCount?: number; // how many slots this booking spans
  continuation?: boolean; // true when this slot is a later part of a longer booking
}

export interface DaySlot {
  start: number;
  label: string;
  bookings: SlotBooking[];
  full: boolean;
}

export interface DayView {
  date: string;
  isWorkingDay: boolean;
  settings: Pick<ISettings, "startMinutes" | "endMinutes" | "slotMinutes" | "capacityPerSlot" | "workingDays">;
  slots: DaySlot[];
  // Present only when a viewer company is supplied:
  viewerCompanyId?: string;
  viewerBookedToday?: boolean;
  conflictBlocked?: boolean;
  conflictReason?: string; // name of the conflicting company already booked today
}

// Build the full schedule for one day. If `viewerCompanyId` is given, adds
// the conflict/already-booked flags that gate that company from booking.
export async function buildDayView(
  date: string,
  viewerCompanyId?: string,
): Promise<DayView> {
  await connectDB();
  const settings = await getSettings();

  const active = await Booking.find({
    date,
    status: { $in: ACTIVE_STATUSES },
  }).lean();
  // Include rejected/cancelled? No — only active hold slots. For the schedule
  // view we surface active only; history isn't needed here.

  const companyIds = [...new Set(active.map((b) => String(b.companyId)))];
  const companies = await Company.find({ _id: { $in: companyIds } }).lean();
  const companyMap = new Map(
    companies.map((c) => [String(c._id), c]),
  );

  const occ = occupancyBySlot(settings, active);
  const starts = slotStarts(settings);
  const slots: DaySlot[] = starts.map((start) => {
    const bookings: SlotBooking[] = [];
    for (const b of active) {
      const count = b.slotsCount && b.slotsCount > 0 ? b.slotsCount : 1;
      const span = slotSpanStarts(b.slotStart, count, settings.slotMinutes);
      if (!span.includes(start)) continue;
      const c = companyMap.get(String(b.companyId));
      bookings.push({
        id: String(b._id),
        companyId: String(b.companyId),
        companyName: c?.name ?? "شركة محذوفة",
        phone: c?.phone,
        status: b.status as BookingStatus,
        note: b.note,
        slotsCount: count,
        continuation: b.slotStart !== start, // a later part of a longer booking
      });
    }
    return {
      start,
      label: slotRangeLabel(start, settings.slotMinutes),
      bookings,
      full: (occ.get(start) ?? 0) >= settings.capacityPerSlot,
    };
  });

  const view: DayView = {
    date,
    isWorkingDay: isWorkingDay(date, settings),
    settings: {
      startMinutes: settings.startMinutes,
      endMinutes: settings.endMinutes,
      slotMinutes: settings.slotMinutes,
      capacityPerSlot: settings.capacityPerSlot,
      workingDays: settings.workingDays,
    },
    slots,
  };

  if (viewerCompanyId) {
    view.viewerCompanyId = viewerCompanyId;
    view.viewerBookedToday = active.some(
      (b) => String(b.companyId) === viewerCompanyId,
    );

    // Conflict: is any company that already booked today on a no-same-day
    // rule with the viewer's company?
    const rules = await Conflict.find({
      $or: [{ companyA: viewerCompanyId }, { companyB: viewerCompanyId }],
    }).lean();
    const bannedPartners = new Set(
      rules.map((r) =>
        String(r.companyA) === viewerCompanyId
          ? String(r.companyB)
          : String(r.companyA),
      ),
    );
    const clash = companyIds.find((id) => bannedPartners.has(id));
    if (clash) {
      view.conflictBlocked = true;
      view.conflictReason = companyMap.get(clash)?.name ?? "شركة";
    }
  }

  return view;
}

type SlotSettings = Pick<
  ISettings,
  "startMinutes" | "endMinutes" | "slotMinutes" | "capacityPerSlot"
>;
type SpanBooking = { slotStart: number; slotsCount?: number };

/** The slot start-times a booking occupies (its whole span). */
export function slotSpanStarts(
  slotStart: number,
  slotsCount: number,
  slotMinutes: number,
): number[] {
  const n = slotsCount && slotsCount > 0 ? slotsCount : 1;
  return Array.from({ length: n }, (_, i) => slotStart + i * slotMinutes);
}

/** How many bookings occupy each slot start, counting multi-slot spans. */
export function occupancyBySlot(
  settings: SlotSettings,
  activeForDay: SpanBooking[],
): Map<number, number> {
  const m = new Map<number, number>();
  for (const b of activeForDay) {
    for (const s of slotSpanStarts(b.slotStart, b.slotsCount ?? 1, settings.slotMinutes)) {
      m.set(s, (m.get(s) ?? 0) + 1);
    }
  }
  return m;
}

/**
 * The start-times where a booking needing `need` consecutive slots can fit:
 * `need` contiguous slots exist within the working day and each is under
 * capacity. `need = 1` gives the plain free-slot list.
 */
export function feasibleStarts(
  settings: SlotSettings,
  activeForDay: SpanBooking[],
  need: number,
): number[] {
  const all = slotStarts(settings);
  const occ = occupancyBySlot(settings, activeForDay);
  const n = Math.max(1, need);
  const out: number[] = [];
  for (let i = 0; i + n <= all.length; i++) {
    let ok = true;
    for (let k = 0; k < n; k++) {
      if ((occ.get(all[i + k]) ?? 0) >= settings.capacityPerSlot) {
        ok = false;
        break;
      }
    }
    if (ok) out.push(all[i]);
  }
  return out;
}

/**
 * If any company already booked today conflicts (no-same-day rule) with
 * `companyId`, return that company's name; otherwise null.
 */
export async function sameDayConflictName(
  companyId: string,
  otherCompanyIds: string[],
): Promise<string | null> {
  const others = otherCompanyIds.filter((id) => id !== companyId);
  if (others.length === 0) return null;
  const rules = await Conflict.find({
    $or: [{ companyA: companyId }, { companyB: companyId }],
  }).lean();
  const banned = new Set(
    rules.map((r) =>
      String(r.companyA) === companyId ? String(r.companyB) : String(r.companyA),
    ),
  );
  const clashId = others.find((id) => banned.has(id));
  if (!clashId) return null;
  const clash = await Company.findById(clashId).lean();
  return clash?.name ?? "شركة";
}

export interface CreateResult {
  ok: boolean;
  error?: string;
  bookingId?: string;
}

// Validate and create a booking. Enforces: working day, valid slot, slot not
// full, one booking per company per day, and no same-day conflict.
export async function createBooking(params: {
  companyId: string;
  date: string;
  slotStart: number;
  note?: string;
  createdByClerkId: string;
  createdByAdmin: boolean;
}): Promise<CreateResult> {
  const { companyId, date, slotStart, note, createdByClerkId, createdByAdmin } =
    params;
  await connectDB();
  const settings = await getSettings();

  if (!isWorkingDay(date, settings)) {
    return { ok: false, error: "المخزن لا يعمل في هذا اليوم." };
  }
  if (!isValidSlot(slotStart, settings)) {
    return { ok: false, error: "الميعاد المختار غير صالح." };
  }
  if (slotStart < minBookableStart(date)) {
    return { ok: false, error: "لا يمكن الحجز في ميعاد مضى." };
  }

  const company = await Company.findById(companyId).lean();
  if (!company) return { ok: false, error: "الشركة غير موجودة." };
  if (!company.active) return { ok: false, error: "هذه الشركة موقوفة." };

  const need = slotsForHours(company.durationHours ?? 1, settings.slotMinutes);

  const dayActive = await Booking.find({
    date,
    status: { $in: ACTIVE_STATUSES },
  }).lean();

  // One booking per company per day.
  if (dayActive.some((b) => String(b.companyId) === companyId)) {
    return { ok: false, error: "لدى هذه الشركة حجز بالفعل في هذا اليوم." };
  }

  // The whole span (need consecutive slots) must exist and be free.
  if (!feasibleStarts(settings, dayActive, need).includes(slotStart)) {
    return { ok: false, error: "هذا الميعاد غير متاح للمدة المطلوبة." };
  }

  // Same-day conflict.
  const otherCompanyIds = [
    ...new Set(dayActive.map((b) => String(b.companyId))),
  ];
  if (otherCompanyIds.length) {
    const rules = await Conflict.find({
      $or: [{ companyA: companyId }, { companyB: companyId }],
    }).lean();
    const bannedPartners = new Set(
      rules.map((r) =>
        String(r.companyA) === companyId
          ? String(r.companyB)
          : String(r.companyA),
      ),
    );
    const clashId = otherCompanyIds.find((id) => bannedPartners.has(id));
    if (clashId) {
      const clash = await Company.findById(clashId).lean();
      return {
        ok: false,
        error: `لا يمكن الحجز في نفس يوم شركة «${clash?.name ?? ""}».`,
      };
    }
  }

  const created = await Booking.create({
    companyId,
    date,
    slotStart,
    slotsCount: need,
    status: "pending",
    note,
    createdByClerkId,
    createdByAdmin,
  });

  // Atomic claim of the span — closes the double-booking race.
  const span = slotSpanStarts(slotStart, need, settings.slotMinutes);
  const ok = await reserveSpan(date, span, settings.capacityPerSlot, created._id);
  if (!ok) {
    await Booking.deleteOne({ _id: created._id });
    return { ok: false, error: "تم حجز هذا الميعاد للتو، اختر ميعاداً آخر." };
  }

  return { ok: true, bookingId: String(created._id) };
}

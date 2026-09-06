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
} from "@/lib/slots";
import type { ISettings } from "@/lib/models/settings";

export interface SlotBooking {
  id: string;
  companyId: string;
  companyName: string;
  phone?: string;
  status: BookingStatus;
  note?: string;
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

  const starts = slotStarts(settings);
  const slots: DaySlot[] = starts.map((start) => {
    const bookings: SlotBooking[] = active
      .filter((b) => b.slotStart === start)
      .map((b) => {
        const c = companyMap.get(String(b.companyId));
        return {
          id: String(b._id),
          companyId: String(b.companyId),
          companyName: c?.name ?? "شركة محذوفة",
          phone: c?.phone,
          status: b.status as BookingStatus,
          note: b.note,
        };
      });
    return {
      start,
      label: slotRangeLabel(start, settings.slotMinutes),
      bookings,
      full: bookings.length >= settings.capacityPerSlot,
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

  const company = await Company.findById(companyId).lean();
  if (!company) return { ok: false, error: "الشركة غير موجودة." };
  if (!company.active) return { ok: false, error: "هذه الشركة موقوفة." };

  const dayActive = await Booking.find({
    date,
    status: { $in: ACTIVE_STATUSES },
  }).lean();

  // One booking per company per day.
  if (dayActive.some((b) => String(b.companyId) === companyId)) {
    return { ok: false, error: "لدى هذه الشركة حجز بالفعل في هذا اليوم." };
  }

  // Slot capacity.
  const inSlot = dayActive.filter((b) => b.slotStart === slotStart).length;
  if (inSlot >= settings.capacityPerSlot) {
    return { ok: false, error: "هذا الميعاد محجوز بالكامل." };
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
    status: "pending",
    note,
    createdByClerkId,
    createdByAdmin,
  });

  return { ok: true, bookingId: String(created._id) };
}

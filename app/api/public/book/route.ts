import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getSettings } from "@/lib/me";
import { Booking, ACTIVE_STATUSES } from "@/lib/models/booking";
import { Company } from "@/lib/models/company";
import { feasibleStarts, sameDayConflictName, slotSpanStarts } from "@/lib/day";
import { reserveSpan } from "@/lib/reservations";
import { isWorkingDay, minBookableStart, slotsForHours } from "@/lib/slots";
import { clientIp, rateLimit } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

// Public: create a booking from the home-page form. No login.
// Body: { companyId, personName, personPhone, date, slotStart }.
// Rules (from إعدادات المخزن): company active, working day, slot not in the past,
// the full duration free, no same-day conflict, and an atomic slot claim.
export async function POST(req: NextRequest) {
  if (!rateLimit(`book:${clientIp(req)}`, 10, 60_000)) {
    return NextResponse.json(
      { error: "محاولات كثيرة، انتظر دقيقة ثم حاول." },
      { status: 429 },
    );
  }

  const body = await req.json().catch(() => ({}));
  const companyId = String(body.companyId ?? "").trim();
  const personName = String(body.personName ?? "").trim();
  const personPhone = String(body.personPhone ?? "").trim();
  const load = String(body.load ?? "").trim() || undefined;
  const date = String(body.date ?? "").trim();
  const slotStart = Number(body.slotStart);

  if (!companyId || !personName || !personPhone || !date || !Number.isFinite(slotStart)) {
    return NextResponse.json({ error: "من فضلك أكمل كل الحقول." }, { status: 400 });
  }
  if (!/^\d{11}$/.test(personPhone)) {
    return NextResponse.json(
      { error: "رقم الهاتف يجب أن يكون 11 رقماً بالضبط." },
      { status: 400 },
    );
  }

  await connectDB();
  const settings = await getSettings();

  const company = await Company.findById(companyId).lean().catch(() => null);
  if (!company || !company.active) {
    return NextResponse.json({ error: "الشركة غير متاحة." }, { status: 400 });
  }

  if (!isWorkingDay(date, settings)) {
    return NextResponse.json({ error: "المخزن لا يعمل في هذا اليوم." }, { status: 400 });
  }
  if (slotStart < minBookableStart(date)) {
    return NextResponse.json(
      { error: "لا يمكن الحجز في ميعاد مضى، اختر ميعاداً آخر." },
      { status: 400 },
    );
  }

  const need = slotsForHours(company.durationHours ?? 1, settings.slotMinutes);

  const dayActive = await Booking.find({
    date,
    status: { $in: ACTIVE_STATUSES },
  })
    .select("companyId slotStart slotsCount")
    .lean();

  // The whole span (need consecutive slots) must exist and be free.
  if (!feasibleStarts(settings, dayActive, need).includes(slotStart)) {
    return NextResponse.json(
      { error: "هذا الميعاد لم يعد متاحاً للمدة المطلوبة، اختر ميعاداً آخر." },
      { status: 409 },
    );
  }

  // Same-day conflict rule.
  const otherIds = dayActive.map((b) => String(b.companyId));
  const clash = await sameDayConflictName(companyId, otherIds);
  if (clash) {
    return NextResponse.json(
      { error: `لا يمكن الحجز في نفس يوم شركة «${clash}» المتعارضة.` },
      { status: 409 },
    );
  }

  const created = await Booking.create({
    companyId,
    date,
    slotStart,
    slotsCount: need,
    status: "pending",
    personName,
    personPhone,
    load,
    createdByAdmin: false,
  });

  // Atomic claim of every slot in the span — closes the double-booking race.
  const span = slotSpanStarts(slotStart, need, settings.slotMinutes);
  const ok = await reserveSpan(date, span, settings.capacityPerSlot, created._id);
  if (!ok) {
    await Booking.deleteOne({ _id: created._id });
    return NextResponse.json(
      { error: "تم حجز هذا الميعاد للتو، اختر ميعاداً آخر." },
      { status: 409 },
    );
  }

  return NextResponse.json({ id: String(created._id) });
}

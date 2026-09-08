import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getViewer, getSettings } from "@/lib/me";
import { Booking, ACTIVE_STATUSES } from "@/lib/models/booking";
import { Company } from "@/lib/models/company";
import { feasibleStarts, slotSpanStarts } from "@/lib/day";
import { reserveSpan, releaseBooking } from "@/lib/reservations";
import { isWorkingDay, minBookableStart, slotsForHours } from "@/lib/slots";

export const dynamic = "force-dynamic";

// PATCH { action: "confirm" | "reject" | "cancel" | "reschedule" }
// - confirm / reject: admin only (warehouse approval).
// - reschedule: admin only — move the booking to a new date/slot and confirm it.
// - cancel: the owning company or an admin.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const viewer = await getViewer();
  if (!viewer.clerkId) {
    return NextResponse.json({ error: "غير مسجل الدخول" }, { status: 401 });
  }
  const { id } = await params;
  const body = await req.json();
  const { action } = body;

  await connectDB();
  const booking = await Booking.findById(id);
  if (!booking) {
    return NextResponse.json({ error: "الحجز غير موجود" }, { status: 404 });
  }

  if (action === "confirm" || action === "reject") {
    if (!viewer.isAdmin) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    }
    booking.status = action === "confirm" ? "confirmed" : "rejected";
    await booking.save();
    // A rejected booking no longer holds its slots.
    if (action === "reject") await releaseBooking(booking._id);
    return NextResponse.json({ ok: true, status: booking.status });
  }

  if (action === "reschedule") {
    if (!viewer.isAdmin) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    }
    const date = String(body.date ?? "").trim();
    const slotStart = Number(body.slotStart);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(slotStart)) {
      return NextResponse.json({ error: "بيانات غير مكتملة." }, { status: 400 });
    }
    const settings = await getSettings();
    if (!isWorkingDay(date, settings)) {
      return NextResponse.json({ error: "المخزن لا يعمل في هذا اليوم." }, { status: 400 });
    }
    if (slotStart < minBookableStart(date)) {
      return NextResponse.json({ error: "لا يمكن الحجز في ميعاد مضى." }, { status: 400 });
    }
    const company = await Company.findById(booking.companyId).lean();
    const need = slotsForHours(company?.durationHours ?? 1, settings.slotMinutes);
    // The whole span must fit, ignoring this booking's own current slots.
    const dayActive = await Booking.find({
      _id: { $ne: booking._id },
      date,
      status: { $in: ACTIVE_STATUSES },
    })
      .select("slotStart slotsCount")
      .lean();
    if (!feasibleStarts(settings, dayActive, need).includes(slotStart)) {
      return NextResponse.json(
        { error: "هذا الميعاد غير متاح للمدة المطلوبة." },
        { status: 409 },
      );
    }

    // Move the slot claims: release the old span, atomically claim the new one.
    const oldSpan = slotSpanStarts(
      booking.slotStart,
      booking.slotsCount || 1,
      settings.slotMinutes,
    );
    const oldDate = booking.date;
    await releaseBooking(booking._id);
    const newSpan = slotSpanStarts(slotStart, need, settings.slotMinutes);
    const claimed = await reserveSpan(date, newSpan, settings.capacityPerSlot, booking._id);
    if (!claimed) {
      // Restore the previous claim so the booking isn't left unheld.
      await reserveSpan(oldDate, oldSpan, settings.capacityPerSlot, booking._id);
      return NextResponse.json(
        { error: "تم حجز هذا الميعاد للتو، اختر ميعاداً آخر." },
        { status: 409 },
      );
    }

    booking.date = date;
    booking.slotStart = slotStart;
    booking.slotsCount = need;
    booking.rescheduledByAdmin = true;
    booking.status = "confirmed";
    await booking.save();
    return NextResponse.json({ ok: true, status: booking.status });
  }

  if (action === "cancel") {
    // Allowed for the owning company or an admin.
    let owns = false;
    if (viewer.company && String(booking.companyId) === viewer.company.id) {
      owns = true;
    } else if (viewer.isAdmin) {
      owns = true;
    } else {
      // Fallback: does the viewer own the booking's company?
      const c = await Company.findById(booking.companyId).lean();
      owns = c?.ownerClerkId === viewer.clerkId;
    }
    if (!owns) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    }
    booking.status = "cancelled";
    await booking.save();
    await releaseBooking(booking._id);
    return NextResponse.json({ ok: true, status: booking.status });
  }

  return NextResponse.json({ error: "إجراء غير معروف" }, { status: 400 });
}

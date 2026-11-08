import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Booking, ACTIVE_STATUSES } from "@/lib/models/booking";
import { releaseBooking } from "@/lib/reservations";
import { slotHasStarted } from "@/lib/slots";
import { clientIp, rateLimit } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

// Public: cancel a booking, verified by the phone number it was made with.
// Body: { id, phone }. No login — a person can only cancel their own bookings
// because they must present the matching phone number.
export async function POST(req: NextRequest) {
  if (!rateLimit(`cancel:${clientIp(req)}`, 15, 60_000)) {
    return NextResponse.json(
      { error: "محاولات كثيرة، انتظر دقيقة ثم حاول." },
      { status: 429 },
    );
  }
  const body = await req.json().catch(() => ({}));
  const id = String(body.id ?? "").trim();
  const phone = String(body.phone ?? "").trim();

  if (!id || !/^\d{11}$/.test(phone)) {
    return NextResponse.json({ error: "بيانات غير صالحة." }, { status: 400 });
  }

  await connectDB();
  const booking = await Booking.findById(id).catch(() => null);
  if (!booking || booking.personPhone !== phone) {
    return NextResponse.json({ error: "الحجز غير موجود." }, { status: 404 });
  }
  if (!ACTIVE_STATUSES.includes(booking.status)) {
    return NextResponse.json(
      { error: "لا يمكن إلغاء هذا الحجز." },
      { status: 409 },
    );
  }
  if (slotHasStarted(booking.date, booking.slotStart)) {
    return NextResponse.json(
      { error: "لا يمكن إلغاء حجز انتهى ميعاده." },
      { status: 409 },
    );
  }

  booking.status = "cancelled";
  await booking.save();
  await releaseBooking(booking._id);
  return NextResponse.json({ ok: true });
}

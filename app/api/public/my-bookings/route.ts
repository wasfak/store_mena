import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getSettings } from "@/lib/me";
import { Booking } from "@/lib/models/booking";
import { Company } from "@/lib/models/company";
import { dateLabelAr, slotHasStarted, slotRangeLabel } from "@/lib/slots";
import { clientIp, rateLimit } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

// Public: a person's bookings, looked up by the phone number they booked with.
// No login — the حجوزاتي page uses this. GET /api/public/my-bookings?phone=...
export async function GET(req: NextRequest) {
  if (!rateLimit(`mybookings:${clientIp(req)}`, 20, 60_000)) {
    return NextResponse.json(
      { error: "محاولات كثيرة، انتظر دقيقة ثم حاول." },
      { status: 429 },
    );
  }
  const phone = String(req.nextUrl.searchParams.get("phone") ?? "").trim();
  if (!/^\d{11}$/.test(phone)) {
    return NextResponse.json(
      { error: "أدخل رقم هاتف صحيح مكوّن من 11 رقماً." },
      { status: 400 },
    );
  }

  await connectDB();
  const settings = await getSettings();

  const list = await Booking.find({ personPhone: phone })
    .sort({ date: -1, slotStart: 1 })
    .lean();

  const companyIds = [...new Set(list.map((b) => String(b.companyId)))];
  const companies = await Company.find({ _id: { $in: companyIds } }).lean();
  const nameById = new Map(companies.map((c) => [String(c._id), c.name]));

  return NextResponse.json(
    list.map((b) => ({
      id: String(b._id),
      date: b.date,
      dateLabel: dateLabelAr(b.date),
      slotLabel: slotRangeLabel(
        b.slotStart,
        settings.slotMinutes * (b.slotsCount || 1),
      ),
      status: b.status,
      isPast: slotHasStarted(b.date, b.slotStart),
      rescheduledByAdmin: !!b.rescheduledByAdmin,
      companyName: nameById.get(String(b.companyId)) ?? "—",
    })),
  );
}

import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getViewer, getSettings } from "@/lib/me";
import { Booking, ACTIVE_STATUSES } from "@/lib/models/booking";
import { Company } from "@/lib/models/company";
import { addDaysISO, dateLabelAr, slotRangeLabel, todayISO } from "@/lib/slots";

export const dynamic = "force-dynamic";

// How many days ahead the overview covers (3 weeks, today included).
const RANGE_DAYS = 21;

// GET (admin): every active booking (pending/confirmed) over the next 3 weeks,
// grouped by day, for the schedule overview.
export async function GET() {
  const viewer = await getViewer();
  if (!viewer.isAdmin) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  await connectDB();
  const settings = await getSettings();

  const from = todayISO();
  const to = addDaysISO(from, RANGE_DAYS - 1);

  const list = await Booking.find({
    date: { $gte: from, $lte: to },
    status: { $in: ACTIVE_STATUSES },
  })
    .sort({ date: 1, slotStart: 1 })
    .lean();

  const companyIds = [...new Set(list.map((b) => String(b.companyId)))];
  const companies = await Company.find({ _id: { $in: companyIds } }).lean();
  const nameById = new Map(companies.map((c) => [String(c._id), c.name]));

  // Group into { date, dateLabel, bookings[] }.
  const groups = new Map<
    string,
    {
      date: string;
      dateLabel: string;
      bookings: {
        id: string;
        slotLabel: string;
        companyName: string;
        personName: string;
        personPhone: string;
        status: string;
      }[];
    }
  >();

  for (const b of list) {
    if (!groups.has(b.date)) {
      groups.set(b.date, {
        date: b.date,
        dateLabel: dateLabelAr(b.date),
        bookings: [],
      });
    }
    groups.get(b.date)!.bookings.push({
      id: String(b._id),
      slotLabel: slotRangeLabel(
        b.slotStart,
        settings.slotMinutes * (b.slotsCount || 1),
      ),
      companyName: nameById.get(String(b.companyId)) ?? "شركة محذوفة",
      personName: b.personName ?? "—",
      personPhone: b.personPhone ?? "—",
      status: b.status,
    });
  }

  return NextResponse.json([...groups.values()]);
}

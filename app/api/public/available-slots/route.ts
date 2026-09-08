import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getSettings } from "@/lib/me";
import { Booking, ACTIVE_STATUSES } from "@/lib/models/booking";
import { Company } from "@/lib/models/company";
import { feasibleStarts } from "@/lib/day";
import { isWorkingDay, minBookableStart, slotRangeLabel, slotsForHours } from "@/lib/slots";

export const dynamic = "force-dynamic";

// Public: the start-times on one day where the chosen company's booking fits.
// The label spans the company's full duration (e.g. 9:00 ص – 12:00 م for 3h).
// GET /api/public/available-slots?date=YYYY-MM-DD&companyId=...
export async function GET(req: NextRequest) {
  const date = String(req.nextUrl.searchParams.get("date") ?? "").trim();
  const companyId = String(req.nextUrl.searchParams.get("companyId") ?? "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "تاريخ غير صالح." }, { status: 400 });
  }
  if (!companyId) {
    return NextResponse.json({ error: "اختر الشركة أولاً." }, { status: 400 });
  }

  await connectDB();
  const settings = await getSettings();

  const company = await Company.findById(companyId).lean().catch(() => null);
  if (!company || !company.active) {
    return NextResponse.json({ error: "الشركة غير متاحة." }, { status: 400 });
  }
  const need = slotsForHours(company.durationHours ?? 1, settings.slotMinutes);

  if (!isWorkingDay(date, settings)) {
    return NextResponse.json([]);
  }

  const active = await Booking.find({
    date,
    status: { $in: ACTIVE_STATUSES },
  })
    .select("slotStart slotsCount")
    .lean();

  const spanMinutes = settings.slotMinutes * need;
  const minStart = minBookableStart(date); // drop already-started slots today
  const free = feasibleStarts(settings, active, need)
    .filter((start) => start >= minStart)
    .map((start) => ({
      start,
      label: slotRangeLabel(start, spanMinutes),
    }));

  return NextResponse.json(free);
}

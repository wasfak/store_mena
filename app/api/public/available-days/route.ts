import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getSettings } from "@/lib/me";
import { Booking, ACTIVE_STATUSES } from "@/lib/models/booking";
import { Company } from "@/lib/models/company";
import { feasibleStarts } from "@/lib/day";
import { addDaysISO, dateLabelAr, isWorkingDay, minBookableStart, slotsForHours, todayISO } from "@/lib/slots";

export const dynamic = "force-dynamic";

// How far ahead we offer days for booking.
const HORIZON_DAYS = 30;

// Public: upcoming working days that can fit the chosen company's full duration.
// Needs ?companyId= so we know how many consecutive slots to reserve.
export async function GET(req: NextRequest) {
  const companyId = String(req.nextUrl.searchParams.get("companyId") ?? "").trim();
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

  const today = todayISO();
  const candidateDays: string[] = [];
  for (let i = 0; i <= HORIZON_DAYS; i++) {
    const d = addDaysISO(today, i);
    if (isWorkingDay(d, settings)) candidateDays.push(d);
  }

  const active = await Booking.find({
    date: { $in: candidateDays },
    status: { $in: ACTIVE_STATUSES },
  })
    .select("date slotStart slotsCount")
    .lean();

  const available = candidateDays
    .filter((d) => {
      const minStart = minBookableStart(d); // today: only future slots count
      return (
        feasibleStarts(
          settings,
          active.filter((b) => b.date === d),
          need,
        ).some((s) => s >= minStart)
      );
    })
    .map((d) => ({ date: d, label: dateLabelAr(d) }));

  return NextResponse.json(available);
}

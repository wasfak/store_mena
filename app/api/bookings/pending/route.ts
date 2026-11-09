import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getViewer, getSettings } from "@/lib/me";
import { Booking } from "@/lib/models/booking";
import { Company } from "@/lib/models/company";
import { dateLabelAr, slotRangeLabel } from "@/lib/slots";

export const dynamic = "force-dynamic";

// GET (admin): every pending booking with full details, for the طلبات الحجز
// review page. Oldest request first (FIFO).
export async function GET() {
  const viewer = await getViewer();
  if (!viewer.isAdmin) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  await connectDB();
  const settings = await getSettings();

  const list = await Booking.find({ status: "pending" })
    .sort({ date: 1, slotStart: 1, createdAt: 1 })
    .lean();

  const companyIds = [...new Set(list.map((b) => String(b.companyId)))];
  const companies = await Company.find({ _id: { $in: companyIds } }).lean();
  const nameById = new Map(companies.map((c) => [String(c._id), c.name]));

  return NextResponse.json(
    list.map((b) => ({
      id: String(b._id),
      companyId: String(b.companyId),
      companyName: nameById.get(String(b.companyId)) ?? "شركة محذوفة",
      personName: b.personName ?? "—",
      personPhone: b.personPhone ?? "—",
      brand: b.brand ?? "",
      boxes: typeof b.boxes === "number" ? b.boxes : null,
      load: b.load ?? "",
      date: b.date,
      dateLabel: dateLabelAr(b.date),
      slotLabel: slotRangeLabel(
        b.slotStart,
        settings.slotMinutes * (b.slotsCount || 1),
      ),
      createdAt:
        (b as { createdAt?: Date }).createdAt?.toISOString() ?? null,
    })),
  );
}

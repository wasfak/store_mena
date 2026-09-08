import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Company } from "@/lib/models/company";

export const dynamic = "force-dynamic";

// Public: the list of active companies a visitor can pick from when booking.
// No auth — the booking form on the home page uses this.
export async function GET() {
  await connectDB();
  const companies = await Company.find({ active: true }).sort({ name: 1 }).lean();
  return NextResponse.json(
    companies.map((c) => ({
      id: String(c._id),
      name: c.name,
      durationHours: c.durationHours ?? 1,
    })),
  );
}

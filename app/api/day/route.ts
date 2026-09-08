import { NextRequest, NextResponse } from "next/server";
import { getViewer } from "@/lib/me";
import { buildDayView } from "@/lib/day";
import { todayISO } from "@/lib/slots";

export const dynamic = "force-dynamic";

// GET ?date=YYYY-MM-DD — full schedule for a day. When the viewer owns a
// company, the response also carries the conflict / already-booked flags that
// gate that company from booking.
export async function GET(req: NextRequest) {
  const viewer = await getViewer();
  // The day board exposes every booking's company name + phone, so it is
  // admin-only. (The public booking flow uses /api/public/* instead.)
  if (!viewer.isAdmin) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }
  const date = req.nextUrl.searchParams.get("date") || todayISO();
  const view = await buildDayView(date, viewer.company?.id);
  return NextResponse.json({ ...view, isAdmin: viewer.isAdmin });
}

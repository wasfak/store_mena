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
  if (!viewer.clerkId) {
    return NextResponse.json({ error: "غير مسجل الدخول" }, { status: 401 });
  }
  const date = req.nextUrl.searchParams.get("date") || todayISO();
  const view = await buildDayView(date, viewer.company?.id);
  return NextResponse.json({ ...view, isAdmin: viewer.isAdmin });
}

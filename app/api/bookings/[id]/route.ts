import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getViewer } from "@/lib/me";
import { Booking } from "@/lib/models/booking";
import { Company } from "@/lib/models/company";

export const dynamic = "force-dynamic";

// PATCH { action: "confirm" | "reject" | "cancel" }
// - confirm / reject: admin only (warehouse approval).
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
  const { action } = await req.json();

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
    return NextResponse.json({ ok: true, status: booking.status });
  }

  return NextResponse.json({ error: "إجراء غير معروف" }, { status: 400 });
}

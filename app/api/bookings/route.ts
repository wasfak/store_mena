import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getViewer } from "@/lib/me";
import { createBooking } from "@/lib/day";
import { Booking } from "@/lib/models/booking";
import { Company } from "@/lib/models/company";

export const dynamic = "force-dynamic";

// GET ?mine=1 — the viewer company's own bookings (all statuses, newest first).
export async function GET(req: NextRequest) {
  const viewer = await getViewer();
  if (!viewer.clerkId) {
    return NextResponse.json({ error: "غير مسجل الدخول" }, { status: 401 });
  }
  if (!viewer.company) return NextResponse.json([]);
  await connectDB();
  const list = await Booking.find({ companyId: viewer.company.id })
    .sort({ date: -1, slotStart: 1 })
    .lean();
  return NextResponse.json(
    list.map((b) => ({
      id: String(b._id),
      date: b.date,
      slotStart: b.slotStart,
      status: b.status,
      note: b.note,
    })),
  );
}

// POST — create a booking. A company owner books for their own company; an
// admin may book on behalf of any company by passing companyId.
export async function POST(req: NextRequest) {
  const viewer = await getViewer();
  if (!viewer.clerkId) {
    return NextResponse.json({ error: "غير مسجل الدخول" }, { status: 401 });
  }
  const body = await req.json();
  const date = String(body.date ?? "");
  const slotStart = Number(body.slotStart);
  const note = body.note ? String(body.note).trim() : undefined;

  let companyId: string | undefined;
  if (viewer.isAdmin && body.companyId) {
    companyId = String(body.companyId);
    await connectDB();
    const exists = await Company.exists({ _id: companyId });
    if (!exists) {
      return NextResponse.json({ error: "الشركة غير موجودة." }, { status: 400 });
    }
  } else {
    companyId = viewer.company?.id;
  }

  if (!companyId) {
    return NextResponse.json(
      { error: "أنشئ ملف الشركة أولاً قبل الحجز." },
      { status: 400 },
    );
  }
  if (!date || !Number.isFinite(slotStart)) {
    return NextResponse.json({ error: "بيانات غير مكتملة." }, { status: 400 });
  }

  const result = await createBooking({
    companyId,
    date,
    slotStart,
    note,
    createdByClerkId: viewer.clerkId,
    createdByAdmin: viewer.isAdmin,
  });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 409 });
  }
  return NextResponse.json({ id: result.bookingId });
}

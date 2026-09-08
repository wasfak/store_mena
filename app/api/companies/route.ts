import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getViewer } from "@/lib/me";
import { Company } from "@/lib/models/company";

export const dynamic = "force-dynamic";

// GET: admins get all companies; a company owner gets just their own profile.
export async function GET() {
  const viewer = await getViewer();
  if (!viewer.clerkId) {
    return NextResponse.json({ error: "غير مسجل الدخول" }, { status: 401 });
  }
  await connectDB();
  if (viewer.isAdmin) {
    const all = await Company.find().sort({ name: 1 }).lean();
    return NextResponse.json(
      all.map((c) => ({
        id: String(c._id),
        name: c.name,
        phone: c.phone,
        active: c.active,
        durationHours: c.durationHours ?? 1,
        hasOwner: !!c.ownerClerkId,
      })),
    );
  }
  return NextResponse.json(viewer.company ? [viewer.company] : []);
}

// POST: a signed-in user creates/updates their own company profile.
// Admins may create a company without owning it by passing ownerless:true.
export async function POST(req: NextRequest) {
  const viewer = await getViewer();
  if (!viewer.clerkId) {
    return NextResponse.json({ error: "غير مسجل الدخول" }, { status: 401 });
  }
  const body = await req.json();
  const name = String(body.name ?? "").trim();
  const phone = String(body.phone ?? "").trim() || undefined;
  const durationHours =
    body.durationHours != null && Number(body.durationHours) >= 0.5
      ? Number(body.durationHours)
      : 1;
  if (!name) {
    return NextResponse.json({ error: "اسم الشركة مطلوب." }, { status: 400 });
  }
  await connectDB();

  // Admin creating an ownerless company (managed on their behalf).
  if (viewer.isAdmin && body.ownerless) {
    const created = await Company.create({ name, phone, durationHours, active: true });
    return NextResponse.json({ id: String(created._id) });
  }

  // Otherwise upsert the caller's own profile.
  const existing = await Company.findOne({ ownerClerkId: viewer.clerkId });
  if (existing) {
    existing.name = name;
    existing.phone = phone;
    await existing.save();
    return NextResponse.json({ id: String(existing._id) });
  }
  const created = await Company.create({
    name,
    phone,
    ownerClerkId: viewer.clerkId,
    active: true,
  });
  return NextResponse.json({ id: String(created._id) });
}

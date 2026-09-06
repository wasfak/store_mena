import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getViewer } from "@/lib/me";
import { Company } from "@/lib/models/company";

export const dynamic = "force-dynamic";

// PATCH: admin edits a company (name/phone/active).
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const viewer = await getViewer();
  if (!viewer.isAdmin) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }
  const { id } = await params;
  const body = await req.json();
  const update: Record<string, unknown> = {};
  if (typeof body.name === "string" && body.name.trim())
    update.name = body.name.trim();
  if (typeof body.phone === "string") update.phone = body.phone.trim();
  if (typeof body.active === "boolean") update.active = body.active;

  await connectDB();
  const doc = await Company.findByIdAndUpdate(
    id,
    { $set: update },
    { new: true },
  ).lean();
  if (!doc) return NextResponse.json({ error: "غير موجود" }, { status: 404 });
  return NextResponse.json({
    id: String(doc._id),
    name: doc.name,
    phone: doc.phone,
    active: doc.active,
  });
}

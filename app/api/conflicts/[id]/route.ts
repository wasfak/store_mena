import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getViewer } from "@/lib/me";
import { Conflict } from "@/lib/models/conflict";

export const dynamic = "force-dynamic";

// DELETE: admin — remove a conflict rule.
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const viewer = await getViewer();
  if (!viewer.isAdmin) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }
  const { id } = await params;
  await connectDB();
  await Conflict.findByIdAndDelete(id);
  return NextResponse.json({ ok: true });
}

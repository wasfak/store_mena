import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getSettings, getViewer } from "@/lib/me";
import { Settings } from "@/lib/models/settings";

export const dynamic = "force-dynamic";

export async function GET() {
  const s = await getSettings();
  return NextResponse.json(s);
}

export async function PUT(req: NextRequest) {
  const viewer = await getViewer();
  if (!viewer.isAdmin) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }
  const body = await req.json();

  // Sanitize/validate.
  const workingDays = Array.isArray(body.workingDays)
    ? Array.from(
        new Set(
          (body.workingDays as unknown[])
            .map((x) => Number(x))
            .filter((d) => Number.isFinite(d) && d >= 0 && d <= 6),
        ),
      )
    : undefined;
  const startMinutes = clampInt(body.startMinutes, 0, 24 * 60);
  const endMinutes = clampInt(body.endMinutes, 0, 24 * 60);
  const slotMinutes = clampInt(body.slotMinutes, 5, 24 * 60);
  const capacityPerSlot = clampInt(body.capacityPerSlot, 1, 50);

  if (
    startMinutes !== undefined &&
    endMinutes !== undefined &&
    endMinutes <= startMinutes
  ) {
    return NextResponse.json(
      { error: "وقت النهاية يجب أن يكون بعد وقت البداية." },
      { status: 400 },
    );
  }

  await connectDB();
  const update: Record<string, unknown> = {};
  if (workingDays !== undefined) update.workingDays = workingDays;
  if (startMinutes !== undefined) update.startMinutes = startMinutes;
  if (endMinutes !== undefined) update.endMinutes = endMinutes;
  if (slotMinutes !== undefined) update.slotMinutes = slotMinutes;
  if (capacityPerSlot !== undefined) update.capacityPerSlot = capacityPerSlot;

  const s = await Settings.findOneAndUpdate(
    { key: "default" },
    { $set: update },
    { new: true, upsert: true },
  ).lean();
  return NextResponse.json(s);
}

function clampInt(v: unknown, min: number, max: number): number | undefined {
  const n = Number(v);
  if (!Number.isFinite(n)) return undefined;
  return Math.min(max, Math.max(min, Math.round(n)));
}

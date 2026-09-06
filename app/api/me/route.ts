import { NextResponse } from "next/server";
import { getViewer } from "@/lib/me";

export const dynamic = "force-dynamic";

export async function GET() {
  const viewer = await getViewer();
  return NextResponse.json(viewer);
}

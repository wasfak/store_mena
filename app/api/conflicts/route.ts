import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getViewer } from "@/lib/me";
import { Conflict, normalizePair } from "@/lib/models/conflict";
import { Company } from "@/lib/models/company";

export const dynamic = "force-dynamic";

// GET: admin — list all conflict rules with resolved company names.
export async function GET() {
  const viewer = await getViewer();
  if (!viewer.isAdmin) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }
  await connectDB();
  const rules = await Conflict.find().lean();
  const ids = [
    ...new Set(
      rules.flatMap((r) => [String(r.companyA), String(r.companyB)]),
    ),
  ];
  const companies = await Company.find({ _id: { $in: ids } }).lean();
  const nameMap = new Map(companies.map((c) => [String(c._id), c.name]));
  return NextResponse.json(
    rules.map((r) => ({
      id: String(r._id),
      companyA: String(r.companyA),
      companyB: String(r.companyB),
      nameA: nameMap.get(String(r.companyA)) ?? "؟",
      nameB: nameMap.get(String(r.companyB)) ?? "؟",
    })),
  );
}

// POST: admin — add a no-same-day rule between two companies.
export async function POST(req: NextRequest) {
  const viewer = await getViewer();
  if (!viewer.isAdmin) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }
  const body = await req.json();
  const a = String(body.companyA ?? "");
  const b = String(body.companyB ?? "");
  if (!a || !b || a === b) {
    return NextResponse.json(
      { error: "اختر شركتين مختلفتين." },
      { status: 400 },
    );
  }
  const [companyA, companyB] = normalizePair(a, b);
  await connectDB();
  try {
    const created = await Conflict.create({ companyA, companyB });
    return NextResponse.json({ id: String(created._id) });
  } catch {
    // Duplicate pair (unique index).
    return NextResponse.json(
      { error: "هذه القاعدة موجودة بالفعل." },
      { status: 409 },
    );
  }
}

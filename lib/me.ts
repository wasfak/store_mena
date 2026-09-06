import { auth } from "@clerk/nextjs/server";
import { connectDB } from "@/lib/db";
import { currentUserIsAdmin } from "@/lib/admins";
import { Company } from "@/lib/models/company";
import { Settings, DEFAULT_SETTINGS, ISettings } from "@/lib/models/settings";

// Resolve the current viewer: their Clerk id, whether they are a warehouse
// admin, and the Company profile they own (if any). Used by every API route.
export interface Viewer {
  clerkId: string | null;
  isAdmin: boolean;
  company: { id: string; name: string; phone?: string; active: boolean } | null;
}

export async function getViewer(): Promise<Viewer> {
  const { userId } = await auth();
  const isAdmin = await currentUserIsAdmin();
  let company: Viewer["company"] = null;
  if (userId) {
    await connectDB();
    const doc = await Company.findOne({ ownerClerkId: userId }).lean();
    if (doc) {
      company = {
        id: String(doc._id),
        name: doc.name,
        phone: doc.phone,
        active: doc.active,
      };
    }
  }
  return { clerkId: userId ?? null, isAdmin, company };
}

// Load the singleton settings, creating it with defaults on first run.
export async function getSettings(): Promise<ISettings> {
  await connectDB();
  let s = await Settings.findOne({ key: "default" });
  if (!s) {
    s = await Settings.create({ key: "default", ...DEFAULT_SETTINGS });
  }
  return s.toObject() as ISettings;
}

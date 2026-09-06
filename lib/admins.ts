// Admin allowlist. Only these Gmail addresses can see / open the Dashboard and
// Reminders pages (and hit their APIs). Everyone else (signed in or not) is
// treated as a normal user.
//
// Configure via the ADMIN_EMAILS env var, comma/space/semicolon separated, e.g.
//   ADMIN_EMAILS="boss@gmail.com, manager@gmail.com"
//
// Server-only module — it pulls the Clerk user on the server. Never import it
// from a client component.

import { currentUser } from "@clerk/nextjs/server";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(/[,;\s]+/)
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

// Owner allowlist — a STRICTER tier than admin, for pages only the app owner
// should see (currently the "Sold?" / sales-followup page). Configure via the
// OWNER_EMAILS env var (comma/space/semicolon separated); if unset it falls back
// to the owner's gmail so the gate works out of the box.
const OWNER_EMAILS = (process.env.OWNER_EMAILS ?? "wasaserr@gmail.com")
  .split(/[,;\s]+/)
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

/** Is this specific email an admin? Case-insensitive. */
export function isAdminEmail(email: string | null | undefined): boolean {
  return !!email && ADMIN_EMAILS.includes(email.toLowerCase());
}

/** Is this specific email the owner? Case-insensitive. */
export function isOwnerEmail(email: string | null | undefined): boolean {
  return !!email && OWNER_EMAILS.includes(email.toLowerCase());
}

/**
 * The signed-in user's primary email (or first available), or null. Used as the
 * redirect target for a "send to me first" test run of the reminders.
 */
export async function currentUserEmail(): Promise<string | null> {
  try {
    const user = await currentUser();
    if (!user) return null;
    return (
      user.primaryEmailAddress?.emailAddress ??
      user.emailAddresses?.[0]?.emailAddress ??
      null
    );
  } catch {
    return null;
  }
}

/**
 * Whether the currently signed-in Clerk user is an admin. Checks every email on
 * the account (not just the primary), so a matching secondary email still works.
 * Returns false when signed out or when ADMIN_EMAILS is unset.
 */
export async function currentUserIsAdmin(): Promise<boolean> {
  if (ADMIN_EMAILS.length === 0) return false;
  try {
    const user = await currentUser();
    if (!user) return false;
    const emails = [
      user.primaryEmailAddress?.emailAddress,
      ...(user.emailAddresses?.map((e) => e.emailAddress) ?? []),
    ];
    return emails.some((e) => isAdminEmail(e));
  } catch {
    // Fail closed: if the Clerk context is momentarily unavailable (e.g. a Turbopack
    // hot-reload before proxy.ts re-registers, or Clerk is briefly unreachable),
    // treat as non-admin for this render instead of crashing the page.
    return false;
  }
}

/**
 * Whether the currently signed-in Clerk user is the owner. Same email-matching
 * logic as currentUserIsAdmin (checks every email on the account), but against
 * the stricter OWNER_EMAILS allowlist. Fails closed when signed out or on error.
 */
export async function currentUserIsOwner(): Promise<boolean> {
  if (OWNER_EMAILS.length === 0) return false;
  try {
    const user = await currentUser();
    if (!user) return false;
    const emails = [
      user.primaryEmailAddress?.emailAddress,
      ...(user.emailAddresses?.map((e) => e.emailAddress) ?? []),
    ];
    return emails.some((e) => isOwnerEmail(e));
  } catch {
    return false;
  }
}

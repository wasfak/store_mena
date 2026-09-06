import type { ISettings } from "@/lib/models/settings";

// ---- Time formatting -------------------------------------------------------

/** minutes-from-midnight -> "HH:MM" (24h, zero-padded). */
export function minutesToHHMM(m: number): string {
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${String(h).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

/** "HH:MM" -> minutes-from-midnight. Returns 0 on bad input. */
export function hhmmToMinutes(hhmm: string): number {
  const [h, m] = (hhmm || "").split(":").map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return 0;
  return h * 60 + m;
}

/** minutes-from-midnight -> Arabic-friendly 12h label e.g. "9:00 ص". */
export function minutesToLabel(m: number): string {
  const h24 = Math.floor(m / 60);
  const mm = m % 60;
  const period = h24 < 12 ? "ص" : "م";
  let h12 = h24 % 12;
  if (h12 === 0) h12 = 12;
  return `${h12}:${String(mm).padStart(2, "0")} ${period}`;
}

/** Label for a slot as a range, e.g. "9:00 ص – 10:00 ص". */
export function slotRangeLabel(start: number, slotMinutes: number): string {
  return `${minutesToLabel(start)} – ${minutesToLabel(start + slotMinutes)}`;
}

// ---- Slot generation -------------------------------------------------------

/** All slot start-times (minutes) for a working day, given the settings. */
export function slotStarts(settings: Pick<ISettings, "startMinutes" | "endMinutes" | "slotMinutes">): number[] {
  const out: number[] = [];
  const { startMinutes, endMinutes, slotMinutes } = settings;
  if (slotMinutes <= 0) return out;
  for (let t = startMinutes; t + slotMinutes <= endMinutes; t += slotMinutes) {
    out.push(t);
  }
  return out;
}

/** Is `slotStart` a valid slot start for the given settings? */
export function isValidSlot(
  slotStart: number,
  settings: Pick<ISettings, "startMinutes" | "endMinutes" | "slotMinutes">,
): boolean {
  return slotStarts(settings).includes(slotStart);
}

// ---- Dates -----------------------------------------------------------------

/** "YYYY-MM-DD" for a Date in the machine's local time. */
export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Today's date as "YYYY-MM-DD" (local). */
export function todayISO(): string {
  return toISODate(new Date());
}

/** Weekday (0=Sun..6=Sat) for a "YYYY-MM-DD" string, parsed as a local date. */
export function weekdayOf(dateISO: string): number {
  const [y, m, d] = dateISO.split("-").map(Number);
  return new Date(y, m - 1, d).getDay();
}

/** Is this date a working day per settings? */
export function isWorkingDay(dateISO: string, settings: Pick<ISettings, "workingDays">): boolean {
  return settings.workingDays.includes(weekdayOf(dateISO));
}

/** Add days to a "YYYY-MM-DD" string, returning a new "YYYY-MM-DD". */
export function addDaysISO(dateISO: string, days: number): string {
  const [y, m, d] = dateISO.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + days);
  return toISODate(dt);
}

const AR_WEEKDAYS = [
  "الأحد",
  "الإثنين",
  "الثلاثاء",
  "الأربعاء",
  "الخميس",
  "الجمعة",
  "السبت",
];

/** Arabic weekday name for a weekday index 0..6. */
export function weekdayNameAr(wd: number): string {
  return AR_WEEKDAYS[wd] ?? "";
}

/** Arabic-friendly full date label, e.g. "الخميس 4 سبتمبر 2025". */
export function dateLabelAr(dateISO: string): string {
  const [y, m, d] = dateISO.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  const months = [
    "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
    "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
  ];
  return `${weekdayNameAr(dt.getDay())} ${d} ${months[m - 1]} ${y}`;
}

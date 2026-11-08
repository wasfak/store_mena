"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";
import {
  ArrowRight,
  Building2,
  CalendarClock,
  CalendarPlus,
  Clock,
  History,
  Info,
  Phone,
  Search,
  Ticket,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState, Loading, PageHeader } from "@/components/page-header";
import { getJSON, sendJSON } from "@/lib/api";
import type { BookingStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

interface MyBooking {
  id: string;
  date: string;
  dateLabel: string;
  slotLabel: string;
  status: BookingStatus;
  /** the slot's time has already come (computed by the server) */
  isPast: boolean;
  rescheduledByAdmin: boolean;
  companyName: string;
}

const PHONE_KEY = "mena.myphone";
const MONTHS = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
];
const EASE = [0.22, 1, 0.36, 1] as const;

export default function MyBookingsPage() {
  const [phone, setPhone] = useState("");
  const [list, setList] = useState<MyBooking[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  const phoneValid = /^\d{11}$/.test(phone);

  // Prefill the phone from this browser, and auto-load if it's valid.
  useEffect(() => {
    let saved = "";
    try {
      saved = localStorage.getItem(PHONE_KEY) ?? "";
    } catch {
      saved = "";
    }
    if (/^\d{11}$/.test(saved)) {
      setPhone(saved);
      void lookup(saved);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function lookup(p: string) {
    if (!/^\d{11}$/.test(p)) {
      toast.error("أدخل رقم هاتف صحيح مكوّن من 11 رقماً.");
      return;
    }
    setLoading(true);
    try {
      const data = await getJSON<MyBooking[]>(
        `/api/public/my-bookings?phone=${p}`,
      );
      setList(data);
      try {
        localStorage.setItem(PHONE_KEY, p);
      } catch {
        /* ignore storage errors */
      }
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function cancel(id: string) {
    setBusy(id);
    try {
      await sendJSON("/api/public/cancel", "POST", { id, phone });
      toast.success("تم إلغاء الحجز.");
      await lookup(phone);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  // Upcoming: soonest first. Past: most recent first (the API's order).
  const upcoming = (list ?? [])
    .filter((b) => !b.isPast)
    .sort((a, b) => a.date.localeCompare(b.date));
  const past = (list ?? []).filter((b) => b.isPast);

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <PageHeader
        icon={Ticket}
        eyebrow="بدون تسجيل دخول"
        title="حجوزاتي"
        description="أدخل رقم هاتفك الذي حجزت به لعرض حجوزاتك — بدون تسجيل دخول."
      />

      {/* search */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: EASE, delay: 0.2 }}
        className="glass border-beam rounded-3xl p-4 sm:p-5"
      >
        <label className="mb-2 block text-sm font-medium">رقم الهاتف</label>
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Phone className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              dir="ltr"
              inputMode="numeric"
              value={phone}
              onChange={(e) =>
                setPhone(e.target.value.replace(/\D/g, "").slice(0, 11))
              }
              placeholder="01xxxxxxxxx"
              onKeyDown={(e) => {
                if (e.key === "Enter" && phoneValid) lookup(phone);
              }}
              className="h-12 pl-11 font-mono text-lg tracking-wider"
            />
            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 font-mono text-xs text-muted-foreground">
              {phone.length}/11
            </span>
          </div>
          <Button
            size="lg"
            className="h-12 rounded-xl px-6"
            disabled={!phoneValid || loading}
            onClick={() => lookup(phone)}
          >
            <Search className="size-4" /> عرض الحجوزات
          </Button>
        </div>
      </motion.div>

      {loading ? (
        <Loading />
      ) : list === null ? null : list.length === 0 ? (
        <EmptyState
          icon={CalendarPlus}
          title="لا توجد حجوزات بهذا الرقم."
          hint="تأكد من الرقم، أو احجز ميعادك الأول الآن."
        />
      ) : (
        <div className="space-y-10">
          <p className="text-sm text-muted-foreground">
            <span className="font-mono text-foreground">{list.length}</span> حجز مرتبط بهذا الرقم
          </p>

          <BookingSection title="الحجوزات القادمة" count={upcoming.length} icon={CalendarClock}>
            {upcoming.length === 0 ? (
              <motion.li
                key="none"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="rounded-3xl border border-dashed border-border px-5 py-6 text-sm text-muted-foreground"
              >
                لا توجد حجوزات قادمة.{" "}
                <Link href="/" className="font-medium text-brand-1 hover:underline">
                  احجز ميعاداً جديداً
                </Link>
              </motion.li>
            ) : (
              upcoming.map((b, i) => (
                <BookingTicket
                  key={b.id}
                  b={b}
                  index={i}
                  busy={busy === b.id}
                  onCancel={() => cancel(b.id)}
                />
              ))
            )}
          </BookingSection>

          {past.length > 0 && (
            <BookingSection title="حجوزات سابقة" count={past.length} icon={History} muted>
              {past.map((b, i) => (
                <BookingTicket key={b.id} b={b} index={i} />
              ))}
            </BookingSection>
          )}
        </div>
      )}

      <Link
        href="/"
        className="group inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        احجز ميعاداً جديداً
        <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
      </Link>
    </div>
  );
}

function BookingSection({
  title,
  count,
  icon: Icon,
  muted,
  children,
}: {
  title: string;
  count: number;
  icon: React.ComponentType<{ className?: string }>;
  muted?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2.5">
        <Icon className={cn("size-4", muted ? "text-muted-foreground" : "text-brand-1")} />
        <h2 className={cn("font-display text-base font-semibold", muted && "text-muted-foreground")}>
          {title}
        </h2>
        <span className="rounded-full bg-foreground/5 px-2 py-0.5 font-mono text-xs text-muted-foreground">
          {count}
        </span>
        <span className="h-px flex-1 bg-border" />
      </div>
      <ul className="space-y-4">
        <AnimatePresence initial={false}>{children}</AnimatePresence>
      </ul>
    </section>
  );
}

function BookingTicket({
  b,
  index,
  busy,
  onCancel,
}: {
  b: MyBooking;
  index: number;
  busy?: boolean;
  /** only upcoming tickets get a cancel action */
  onCancel?: () => void;
}) {
  const active = b.status === "pending" || b.status === "confirmed";
  const canCancel = !!onCancel && active && !b.isPast;
  const [, m, d] = b.date.split("-").map(Number);

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 24, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.6, ease: EASE, delay: Math.min(index * 0.07, 0.5) }}
      className={cn(
        "glass group relative flex overflow-hidden rounded-3xl",
        b.isPast ? "opacity-60 saturate-50" : !active && "opacity-70",
      )}
    >
      {/* date stub */}
      <div className="relative flex w-24 shrink-0 flex-col items-center justify-center gap-0.5 border-r border-dashed border-border px-2 py-5 sm:w-28">
        <span
          className={cn(
            "absolute inset-y-0 left-0 w-1",
            b.isPast ? "bg-muted-foreground/30" : "bg-brand-gradient",
          )}
        />
        <span
          className={cn(
            "font-mono text-4xl font-bold leading-none",
            b.isPast ? "text-muted-foreground" : "text-gradient",
          )}
        >
          {String(d).padStart(2, "0")}
        </span>
        <span className="text-xs font-medium text-muted-foreground">{MONTHS[m - 1]}</span>
        {/* ticket notches */}
        <span className="absolute -right-2.5 -top-2.5 size-5 rounded-full bg-background" />
        <span className="absolute -bottom-2.5 -right-2.5 size-5 rounded-full bg-background" />
      </div>

      {/* details */}
      <div className="flex flex-1 flex-wrap items-center justify-between gap-4 p-5">
        <div className="min-w-0 space-y-1.5">
          <p className="font-display text-base font-semibold">{b.dateLabel}</p>
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="size-3.5 text-brand-1" />
            الميعاد: <span className="tabular-nums text-foreground" dir="rtl">{b.slotLabel}</span>
          </p>
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Building2 className="size-3.5 text-brand-1" />
            الشركة: <span className="text-foreground">{b.companyName}</span>
          </p>
          {b.rescheduledByAdmin && (
            <p className="inline-flex items-center gap-1.5 rounded-full border border-sky-500/40 bg-sky-500/10 px-2.5 py-1 text-xs text-sky-700 dark:text-sky-300">
              <Info className="size-3.5" />
              تم تعديل الميعاد من قبل إدارة المخزن
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {b.isPast && (
            <span className="inline-flex h-6 items-center gap-1 rounded-full border border-border bg-muted px-2.5 text-xs font-medium text-muted-foreground">
              <History className="size-3" />
              انتهى
            </span>
          )}
          <StatusBadge status={b.status} />
          {canCancel && (
            <Button
              variant="outline"
              size="sm"
              disabled={busy}
              onClick={onCancel}
              className="hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-500"
            >
              <X className="size-4" /> إلغاء
            </Button>
          )}
        </div>
      </div>
    </motion.li>
  );
}

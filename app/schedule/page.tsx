"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { Show, SignInButton } from "@clerk/nextjs";
import {
  Building2,
  CalendarDays,
  CalendarOff,
  CalendarRange,
  Check,
  Clock,
  LockKeyhole,
  Phone,
  User,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { DateNav } from "@/components/date-nav";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState, Loading, PageHeader } from "@/components/page-header";
import { getJSON, sendJSON } from "@/lib/api";
import { todayISO } from "@/lib/slots";
import type { BookingStatus, DayViewDTO } from "@/lib/types";
import { cn } from "@/lib/utils";

interface UpcomingBooking {
  id: string;
  slotLabel: string;
  companyName: string;
  personName: string;
  personPhone: string;
  status: BookingStatus;
}
interface UpcomingDay {
  date: string;
  dateLabel: string;
  bookings: UpcomingBooking[];
}

const EASE = [0.22, 1, 0.36, 1] as const;

export default function SchedulePage() {
  const [date, setDate] = useState(todayISO());
  const [day, setDay] = useState<DayViewDTO | null>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  const [upcoming, setUpcoming] = useState<UpcomingDay[] | null>(null);

  const load = useCallback(async (d: string) => {
    setLoading(true);
    try {
      setDay(await getJSON<DayViewDTO>(`/api/day?date=${d}`));
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadUpcoming = useCallback(async () => {
    try {
      setUpcoming(await getJSON<UpcomingDay[]>("/api/schedule/upcoming"));
    } catch (e) {
      toast.error((e as Error).message);
    }
  }, []);

  useEffect(() => {
    load(date);
  }, [date, load]);

  useEffect(() => {
    loadUpcoming();
  }, [loadUpcoming]);

  async function act(id: string, action: "confirm" | "reject" | "cancel") {
    setBusy(id);
    try {
      await sendJSON(`/api/bookings/${id}`, "PATCH", { action });
      toast.success(
        action === "confirm" ? "تم التأكيد." : action === "reject" ? "تم الرفض." : "تم الإلغاء.",
      );
      await Promise.all([load(date), loadUpcoming()]);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  const admin = day?.isAdmin;
  const totalBookings =
    day?.slots.reduce((n, s) => n + s.bookings.length, 0) ?? 0;
  const busySlots = day?.slots.filter((s) => s.bookings.length > 0).length ?? 0;
  const freeSlots = (day?.slots.length ?? 0) - busySlots;

  return (
    <div className="space-y-8">
      <Show when="signed-out">
        <div className="mx-auto max-w-md">
          <EmptyState
            icon={LockKeyhole}
            title="جدول عمل المخزن"
            hint="سجّل الدخول لعرض الجدول."
          />
          <div className="mt-4 flex justify-center">
            <SignInButton>
              <Button size="lg">تسجيل الدخول</Button>
            </SignInButton>
          </div>
        </div>
      </Show>

      <Show when="signed-in">
        <PageHeader
          icon={CalendarDays}
          eyebrow="لوحة المخزن"
          title="جدول عمل المخزن"
          description="كل الحجوزات موزعة على خانات اليوم — أكّد أو ألغِ مباشرة."
        />

        <Tabs defaultValue="day" className="mt-8">
          <TabsList>
            <TabsTrigger value="day">جدول اليوم</TabsTrigger>
            <TabsTrigger value="upcoming">الأسابيع الثلاثة القادمة</TabsTrigger>
          </TabsList>

          {/* ---- Daily board ---- */}
          <TabsContent value="day" className="mt-4 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <DateNav date={date} onChange={setDate} />
              {day && day.isWorkingDay && (
                <div className="flex flex-wrap gap-2">
                  <StatPill label="حجز" value={totalBookings} tone="brand" />
                  <StatPill label="خانة مشغولة" value={busySlots} />
                  <StatPill label="خانة متاحة" value={freeSlots} tone="ok" />
                </div>
              )}
            </div>

            {loading || !day ? (
              <Loading />
            ) : !day.isWorkingDay ? (
              <EmptyState icon={CalendarOff} title="المخزن لا يعمل في هذا اليوم." />
            ) : (
              <ol className="relative space-y-3">
                {/* timeline spine */}
                <span
                  aria-hidden="true"
                  className="absolute bottom-4 left-[7px] top-4 w-px bg-gradient-to-b from-brand-1/60 via-border to-transparent sm:left-[163px]"
                />
                {day.slots.map((slot, i) => {
                  const taken = slot.bookings.length > 0;
                  return (
                    <motion.li
                      key={slot.start}
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, ease: EASE, delay: Math.min(i * 0.04, 0.6) }}
                      className="relative flex flex-col gap-3 pl-8 sm:flex-row sm:items-start sm:gap-6 sm:pl-0"
                    >
                      <div className="flex items-center gap-2 whitespace-nowrap pt-3 text-sm font-semibold tabular-nums sm:w-[132px] sm:shrink-0 sm:justify-end">
                        <Clock className="size-3.5 text-muted-foreground sm:hidden" />
                        <span dir="rtl">{slot.label}</span>
                      </div>
                      {/* node */}
                      <span
                        aria-hidden="true"
                        className={cn(
                          "absolute left-0 top-4 size-[15px] rounded-full border-2 sm:static sm:mt-4 sm:shrink-0",
                          taken
                            ? "bg-brand-gradient border-transparent shadow-[0_0_12px] shadow-brand-2/60"
                            : "border-border bg-background",
                        )}
                      />

                      <div className="flex-1 space-y-2">
                        {!taken ? (
                          <div className="rounded-2xl border border-dashed border-border px-4 py-3 text-sm text-muted-foreground">
                            متاح
                          </div>
                        ) : (
                          slot.bookings.map((b) =>
                            b.continuation ? (
                              <div
                                key={b.id + "-cont"}
                                className="flex items-center gap-2 rounded-2xl border border-dashed border-brand-1/30 bg-brand-1/5 px-4 py-2.5 text-xs text-muted-foreground"
                              >
                                <span className="font-medium text-foreground">{b.companyName}</span>
                                <span>— استكمال حجز ({b.slotsCount} خانات)</span>
                              </div>
                            ) : (
                              <div
                                key={b.id}
                                className="glass flex flex-wrap items-center justify-between gap-3 rounded-2xl px-4 py-3"
                              >
                                <div className="flex min-w-0 items-center gap-3">
                                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-1/12 text-brand-1">
                                    <Building2 className="size-4" />
                                  </span>
                                  <div className="min-w-0 space-y-0.5">
                                    <div className="font-semibold">
                                      {b.companyName}
                                      {b.slotsCount && b.slotsCount > 1 && (
                                        <span className="ml-1.5 rounded-full bg-foreground/5 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                                          {b.slotsCount} خانات
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                                      {b.phone && (
                                        <span className="flex items-center gap-1 font-mono" dir="ltr">
                                          <Phone className="size-3" /> {b.phone}
                                        </span>
                                      )}
                                      {b.note && <span>{b.note}</span>}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <StatusBadge status={b.status} />
                                  {admin && (
                                    <div className="flex items-center gap-1">
                                      {b.status !== "confirmed" && (
                                        <IconAction
                                          label="تأكيد"
                                          tone="ok"
                                          disabled={busy === b.id}
                                          onClick={() => act(b.id, "confirm")}
                                        >
                                          <Check className="size-4" />
                                        </IconAction>
                                      )}
                                      <IconAction
                                        label="إلغاء"
                                        tone="danger"
                                        disabled={busy === b.id}
                                        onClick={() => act(b.id, "cancel")}
                                      >
                                        <X className="size-4" />
                                      </IconAction>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ),
                          )
                        )}
                      </div>
                    </motion.li>
                  );
                })}
              </ol>
            )}
          </TabsContent>

          {/* ---- Next 3 weeks overview ---- */}
          <TabsContent value="upcoming" className="mt-4 space-y-4">
            {upcoming === null ? (
              <Loading />
            ) : upcoming.length === 0 ? (
              <EmptyState
                icon={CalendarRange}
                title="لا توجد حجوزات خلال الأسابيع الثلاثة القادمة."
              />
            ) : (
              <div className="grid gap-5 lg:grid-cols-2">
                {upcoming.map((d, i) => (
                  <motion.section
                    key={d.date}
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.55, ease: EASE, delay: Math.min(i * 0.06, 0.6) }}
                    className="glass rounded-3xl p-5"
                  >
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <h2 className="font-display text-base font-semibold">{d.dateLabel}</h2>
                      <span className="bg-brand-gradient rounded-full px-2.5 py-0.5 text-xs font-semibold text-white">
                        {d.bookings.length} حجز
                      </span>
                    </div>
                    <div className="space-y-2">
                      {d.bookings.map((b) => (
                        <div
                          key={b.id}
                          className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-background/40 px-4 py-3"
                        >
                          <div className="space-y-0.5 text-sm">
                            <div className="flex items-center gap-2 font-semibold">
                              <span className="tabular-nums" dir="rtl">{b.slotLabel}</span>
                              <span className="text-muted-foreground">·</span>
                              <span>{b.companyName}</span>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <User className="size-3" /> {b.personName}
                              </span>
                              <span dir="ltr" className="flex items-center gap-1 font-mono">
                                <Phone className="size-3" /> {b.personPhone}
                              </span>
                            </div>
                          </div>
                          <StatusBadge status={b.status} />
                        </div>
                      ))}
                    </div>
                  </motion.section>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </Show>
    </div>
  );
}

function StatPill({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "brand" | "ok";
}) {
  return (
    <div className="glass flex items-baseline gap-1.5 rounded-2xl px-3.5 py-2">
      <span
        className={cn(
          "font-mono text-lg font-bold",
          tone === "brand" && "text-gradient",
          tone === "ok" && "text-emerald-400",
        )}
      >
        {value}
      </span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

function IconAction({
  label,
  tone,
  disabled,
  onClick,
  children,
}: {
  label: string;
  tone: "ok" | "danger";
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "grid size-9 place-items-center rounded-xl border transition-all hover:scale-105 active:scale-95 disabled:pointer-events-none disabled:opacity-40",
        tone === "ok"
          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white"
          : "border-red-500/30 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white",
      )}
    >
      {children}
    </button>
  );
}

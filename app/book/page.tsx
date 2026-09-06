"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Show, SignInButton } from "@clerk/nextjs";
import { AlertTriangle, CheckCircle2, Lock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { DateNav } from "@/components/date-nav";
import { CompanyProfileForm } from "@/components/company-profile-form";
import { StatusBadge } from "@/components/status-badge";
import { getJSON, sendJSON } from "@/lib/api";
import { todayISO, weekdayNameAr, weekdayOf } from "@/lib/slots";
import type { DayViewDTO, Viewer } from "@/lib/types";

export default function BookPage() {
  const [viewer, setViewer] = useState<Viewer | null>(null);
  const [date, setDate] = useState(todayISO());
  const [day, setDay] = useState<DayViewDTO | null>(null);
  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState<number | null>(null);

  const loadViewer = useCallback(async () => {
    try {
      setViewer(await getJSON<Viewer>("/api/me"));
    } catch {
      setViewer({ clerkId: null, isAdmin: false, company: null });
    }
  }, []);

  const loadDay = useCallback(async (d: string) => {
    setLoading(true);
    try {
      setDay(await getJSON<DayViewDTO>(`/api/day?date=${d}`));
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadViewer();
  }, [loadViewer]);

  useEffect(() => {
    if (viewer?.company) loadDay(date);
  }, [viewer, date, loadDay]);

  async function book(slotStart: number) {
    setBooking(slotStart);
    try {
      await sendJSON("/api/bookings", "POST", { date, slotStart });
      toast.success("تم إرسال طلب الحجز، بانتظار تأكيد المخزن.");
      await loadDay(date);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBooking(null);
    }
  }

  if (viewer === null) {
    return <Loading />;
  }

  if (!viewer.clerkId) {
    return (
      <SignedOut />
    );
  }

  // Signed in but no company profile yet → gate with the profile form.
  if (!viewer.company) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">احجز ميعاد</h1>
        <CompanyProfileForm onSaved={() => loadViewer()} />
      </div>
    );
  }

  if (!viewer.company.active) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">احجز ميعاد</h1>
        <Card className="max-w-md border-red-500/40">
          <CardContent className="pt-6 text-sm text-red-600 dark:text-red-300">
            حساب شركتك موقوف حالياً. تواصل مع إدارة المخزن.
          </CardContent>
        </Card>
      </div>
    );
  }

  const dayBlockedReason =
    day && !day.isWorkingDay
      ? `المخزن لا يعمل يوم ${weekdayNameAr(weekdayOf(date))}.`
      : day?.viewerBookedToday
        ? "لديك حجز بالفعل في هذا اليوم."
        : day?.conflictBlocked
          ? `لا يمكن الحجز اليوم لوجود حجز لشركة «${day.conflictReason}» المتعارضة معك.`
          : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">احجز ميعاد</h1>
        <span className="text-sm text-muted-foreground">
          الشركة: <span className="font-medium text-foreground">{viewer.company.name}</span>
        </span>
      </div>

      <DateNav date={date} onChange={setDate} />

      {dayBlockedReason && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-300">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {dayBlockedReason}
        </div>
      )}

      {loading || !day ? (
        <Loading />
      ) : !day.isWorkingDay ? null : day.slots.length === 0 ? (
        <p className="text-muted-foreground">لا توجد مواعيد معرّفة لهذا اليوم.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {day.slots.map((slot) => {
            const mine = slot.bookings.some(
              (b) => b.companyId === day.viewerCompanyId,
            );
            const canBook =
              !dayBlockedReason && !slot.full && !mine;
            return (
              <Card
                key={slot.start}
                className={mine ? "border-emerald-500/50" : slot.full ? "opacity-70" : ""}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{slot.label}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {slot.bookings.length === 0 ? (
                    <p className="text-sm text-muted-foreground">متاح</p>
                  ) : (
                    <ul className="space-y-1 text-sm">
                      {slot.bookings.map((b) => (
                        <li key={b.id} className="flex items-center justify-between gap-2">
                          <span className={b.companyId === day.viewerCompanyId ? "font-semibold" : ""}>
                            {b.companyId === day.viewerCompanyId ? "شركتك" : "محجوز"}
                          </span>
                          <StatusBadge status={b.status} />
                        </li>
                      ))}
                    </ul>
                  )}

                  {mine ? (
                    <div className="flex items-center gap-1 text-sm text-emerald-600 dark:text-emerald-300">
                      <CheckCircle2 className="h-4 w-4" /> حجزك في هذا الميعاد
                    </div>
                  ) : slot.full ? (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Lock className="h-4 w-4" /> مكتمل
                    </div>
                  ) : (
                    <Button
                      className="w-full"
                      disabled={!canBook || booking === slot.start}
                      onClick={() => book(slot.start)}
                    >
                      {booking === slot.start ? "جارٍ الحجز…" : "احجز"}
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Loading() {
  return (
    <div className="flex items-center gap-2 text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin" /> جارٍ التحميل…
    </div>
  );
}

function SignedOut() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">احجز ميعاد</h1>
      <p className="text-muted-foreground">سجّل الدخول أولاً لحجز ميعاد.</p>
      <Show when="signed-out">
        <SignInButton>
          <Button>تسجيل الدخول</Button>
        </SignInButton>
      </Show>
    </div>
  );
}

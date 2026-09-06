"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Show, SignInButton } from "@clerk/nextjs";
import { Loader2, Check, X, Phone, CalendarOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DateNav } from "@/components/date-nav";
import { StatusBadge } from "@/components/status-badge";
import { getJSON, sendJSON } from "@/lib/api";
import { todayISO } from "@/lib/slots";
import type { DayViewDTO } from "@/lib/types";

export default function SchedulePage() {
  const [date, setDate] = useState(todayISO());
  const [day, setDay] = useState<DayViewDTO | null>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

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

  useEffect(() => {
    load(date);
  }, [date, load]);

  async function act(id: string, action: "confirm" | "reject" | "cancel") {
    setBusy(id);
    try {
      await sendJSON(`/api/bookings/${id}`, "PATCH", { action });
      toast.success(
        action === "confirm" ? "تم التأكيد." : action === "reject" ? "تم الرفض." : "تم الإلغاء.",
      );
      await load(date);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  const admin = day?.isAdmin;
  const totalBookings =
    day?.slots.reduce((n, s) => n + s.bookings.length, 0) ?? 0;

  return (
    <div className="space-y-6">
      <Show when="signed-out">
        <div className="space-y-4">
          <h1 className="text-2xl font-bold">جدول اليوم</h1>
          <p className="text-muted-foreground">سجّل الدخول لعرض الجدول.</p>
          <SignInButton>
            <Button>تسجيل الدخول</Button>
          </SignInButton>
        </div>
      </Show>

      <Show when="signed-in">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold">جدول عمل المخزن</h1>
          {day && (
            <span className="text-sm text-muted-foreground">
              {totalBookings} حجز في هذا اليوم
            </span>
          )}
        </div>

        <DateNav date={date} onChange={setDate} />

        {loading || !day ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> جارٍ التحميل…
          </div>
        ) : !day.isWorkingDay ? (
          <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 p-4 text-muted-foreground">
            <CalendarOff className="h-5 w-5" /> المخزن لا يعمل في هذا اليوم.
          </div>
        ) : (
          <div className="space-y-3">
            {day.slots.map((slot) => (
              <Card key={slot.start}>
                <CardContent className="py-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                    <div className="w-40 shrink-0 font-semibold">{slot.label}</div>
                    <div className="flex-1 space-y-2">
                      {slot.bookings.length === 0 ? (
                        <span className="text-sm text-muted-foreground">— متاح —</span>
                      ) : (
                        slot.bookings.map((b) => (
                          <div
                            key={b.id}
                            className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border bg-background/60 p-2"
                          >
                            <div className="space-y-0.5">
                              <div className="font-medium">{b.companyName}</div>
                              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                {b.phone && (
                                  <span className="flex items-center gap-1">
                                    <Phone className="h-3 w-3" /> {b.phone}
                                  </span>
                                )}
                                {b.note && <span>{b.note}</span>}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <StatusBadge status={b.status} />
                              {admin && (
                                <div className="flex items-center gap-1">
                                  {b.status !== "confirmed" && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      disabled={busy === b.id}
                                      onClick={() => act(b.id, "confirm")}
                                      className="text-emerald-600"
                                    >
                                      <Check className="h-4 w-4" />
                                    </Button>
                                  )}
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={busy === b.id}
                                    onClick={() => act(b.id, "cancel")}
                                    className="text-red-600"
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </Show>
    </div>
  );
}

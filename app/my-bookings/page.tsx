"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/status-badge";
import { getJSON, sendJSON } from "@/lib/api";
import type { BookingStatus } from "@/lib/types";

interface MyBooking {
  id: string;
  date: string;
  dateLabel: string;
  slotLabel: string;
  status: BookingStatus;
  rescheduledByAdmin: boolean;
  companyName: string;
}

const PHONE_KEY = "mena.myphone";

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

  const now = new Date();

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <h1 className="text-2xl font-bold">حجوزاتي</h1>
      <p className="text-sm text-muted-foreground">
        أدخل رقم هاتفك الذي حجزت به لعرض حجوزاتك — بدون تسجيل دخول.
      </p>

      <div className="flex items-end gap-2">
        <div className="flex-1 space-y-1.5">
          <label className="text-sm font-medium">رقم الهاتف</label>
          <Input
            dir="auto"
            inputMode="numeric"
            value={phone}
            onChange={(e) =>
              setPhone(e.target.value.replace(/\D/g, "").slice(0, 11))
            }
            placeholder="01xxxxxxxxx"
            onKeyDown={(e) => {
              if (e.key === "Enter" && phoneValid) lookup(phone);
            }}
          />
        </div>
        <Button disabled={!phoneValid || loading} onClick={() => lookup(phone)}>
          <Search className="mr-1 h-4 w-4" /> عرض
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> جارٍ التحميل…
        </div>
      ) : list === null ? null : list.length === 0 ? (
        <p className="text-muted-foreground">لا توجد حجوزات بهذا الرقم.</p>
      ) : (
        <div className="space-y-3">
          {list.map((b) => {
            const active = b.status === "pending" || b.status === "confirmed";
            const isPast = new Date(`${b.date}T23:59:59`) < now;
            return (
              <Card key={b.id}>
                <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
                  <div className="space-y-1">
                    <div className="font-semibold">{b.dateLabel}</div>
                    <div className="text-sm text-muted-foreground">
                      الميعاد: {b.slotLabel}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      الشركة: {b.companyName}
                    </div>
                    {b.rescheduledByAdmin && (
                      <div className="inline-flex items-center gap-1 rounded-md border border-blue-500/40 bg-blue-500/10 px-2 py-0.5 text-xs text-blue-700 dark:text-blue-300">
                        تم تعديل الميعاد من قبل إدارة المخزن
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={b.status} />
                    {active && !isPast && (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={busy === b.id}
                        onClick={() => cancel(b.id)}
                      >
                        <X className="mr-1 h-4 w-4" /> إلغاء
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

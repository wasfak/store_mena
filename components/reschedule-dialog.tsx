"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CalendarClock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { MonthCalendar } from "@/components/ui/month-calendar";
import { cn } from "@/lib/utils";
import { getJSON, sendJSON } from "@/lib/api";

interface DayOpt {
  date: string;
  label: string;
}
interface SlotOpt {
  start: number;
  label: string;
}

// Admin action: move a booking to a new date + slot, chosen from the store's
// live availability. On save the booking is rescheduled and confirmed.
export function RescheduleDialog({
  bookingId,
  companyId,
  onDone,
}: {
  bookingId: string;
  companyId: string;
  onDone: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [days, setDays] = useState<DayOpt[]>([]);
  const [loadingDays, setLoadingDays] = useState(false);

  const [date, setDate] = useState("");
  const [slots, setSlots] = useState<SlotOpt[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotStart, setSlotStart] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  // Load available days when the dialog opens.
  useEffect(() => {
    if (!open) return;
    setDate("");
    setSlots([]);
    setSlotStart(null);
    setLoadingDays(true);
    getJSON<DayOpt[]>(`/api/public/available-days?companyId=${companyId}`)
      .then(setDays)
      .catch((e) => toast.error((e as Error).message))
      .finally(() => setLoadingDays(false));
  }, [open, companyId]);

  // Load slots when a day is picked.
  useEffect(() => {
    if (!date) {
      setSlots([]);
      setSlotStart(null);
      return;
    }
    let cancelled = false;
    setSlotsLoading(true);
    setSlotStart(null);
    getJSON<SlotOpt[]>(
      `/api/public/available-slots?date=${date}&companyId=${companyId}`,
    )
      .then((s) => !cancelled && setSlots(s))
      .catch((e) => !cancelled && toast.error((e as Error).message))
      .finally(() => !cancelled && setSlotsLoading(false));
    return () => {
      cancelled = true;
    };
  }, [date, companyId]);

  async function save() {
    if (!date || slotStart === null) {
      toast.error("اختر اليوم والميعاد.");
      return;
    }
    setSaving(true);
    try {
      await sendJSON(`/api/bookings/${bookingId}`, "PATCH", {
        action: "reschedule",
        date,
        slotStart,
      });
      toast.success("تم تعديل الميعاد وإرساله للعميل.");
      setOpen(false);
      onDone();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="flex-1">
          <CalendarClock className="mr-1 h-4 w-4" /> تعديل الميعاد
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>تعديل ميعاد الحجز</DialogTitle>
          <DialogDescription>
            اختر يوماً وميعاداً جديداً — سيُرسل للعميل ويظهر في حجوزاته.
          </DialogDescription>
        </DialogHeader>

        {loadingDays ? (
          <div className="flex items-center gap-2 py-6 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> جارٍ التحميل…
          </div>
        ) : days.length === 0 ? (
          <p className="py-4 text-sm text-muted-foreground">
            لا توجد مواعيد متاحة حالياً.
          </p>
        ) : (
          <div className="space-y-3">
            <MonthCalendar
              availableDates={days.map((d) => d.date)}
              value={date}
              onSelect={setDate}
            />

            {!date ? (
              <p className="text-sm text-muted-foreground">
                اختر يوماً من التقويم لعرض المواعيد المتاحة.
              </p>
            ) : slotsLoading ? (
              <div className="flex items-center gap-2 py-1 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> جارٍ تحميل المواعيد…
              </div>
            ) : slots.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                لا توجد مواعيد متاحة في هذا اليوم.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {slots.map((s) => (
                  <button
                    key={s.start}
                    type="button"
                    onClick={() => setSlotStart(s.start)}
                    className={cn(
                      "rounded-lg border px-2 py-2 text-sm transition-colors",
                      slotStart === s.start
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border hover:border-primary/50 hover:bg-accent",
                    )}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button
            onClick={save}
            disabled={!date || slotStart === null || saving}
          >
            {saving ? "جارٍ الحفظ…" : "حفظ وإرسال"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

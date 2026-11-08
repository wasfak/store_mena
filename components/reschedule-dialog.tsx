"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CalendarClock } from "lucide-react";
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
import { SlotPicker } from "@/components/slot-picker";
import { Loading } from "@/components/page-header";
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
          <CalendarClock className="size-4" /> تعديل الميعاد
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-lg">تعديل ميعاد الحجز</DialogTitle>
          <DialogDescription>
            اختر يوماً وميعاداً جديداً — سيُرسل للعميل ويظهر في حجوزاته.
          </DialogDescription>
        </DialogHeader>

        {loadingDays ? (
          <Loading />
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
              <Loading label="جارٍ تحميل المواعيد…" />
            ) : slots.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                لا توجد مواعيد متاحة في هذا اليوم.
              </p>
            ) : (
              <SlotPicker slots={slots} value={slotStart} onChange={setSlotStart} />
            )}
          </div>
        )}

        <DialogFooter>
          <Button
            onClick={save}
            disabled={!date || slotStart === null || saving}
            className="w-full sm:w-auto"
          >
            {saving ? "جارٍ الحفظ" : "حفظ وإرسال"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

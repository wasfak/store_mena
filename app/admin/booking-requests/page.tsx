"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";
import { Boxes, Building2, CalendarDays, Check, Clock, Inbox, Package, PartyPopper, Phone, Tag, User, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RescheduleDialog } from "@/components/reschedule-dialog";
import { EmptyState, Loading, PageHeader } from "@/components/page-header";
import { getJSON, sendJSON } from "@/lib/api";

interface PendingBooking {
  id: string;
  companyId: string;
  companyName: string;
  personName: string;
  personPhone: string;
  brand: string;
  boxes: number | null;
  load: string;
  date: string;
  dateLabel: string;
  slotLabel: string;
  createdAt: string | null;
}

const EASE = [0.22, 1, 0.36, 1] as const;

export default function BookingRequestsPage() {
  const [list, setList] = useState<PendingBooking[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setList(await getJSON<PendingBooking[]>("/api/bookings/pending"));
    } catch (e) {
      toast.error((e as Error).message);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function act(id: string, action: "confirm" | "reject") {
    setBusy(id);
    try {
      await sendJSON(`/api/bookings/${id}`, "PATCH", { action });
      toast.success(action === "confirm" ? "تم تأكيد الحجز." : "تم رفض الحجز.");
      await load();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        icon={Inbox}
        eyebrow="الإدارة"
        title="طلبات الحجز"
        description="الحجوزات الجديدة التي تنتظر مراجعتك. أكّد أو ارفض كل طلب."
        actions={
          list && list.length > 0 ? (
            <span className="glass inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex size-2 rounded-full bg-amber-400" />
              </span>
              <span className="font-mono font-bold">{list.length}</span> بانتظار التأكيد
            </span>
          ) : null
        }
      />

      {list === null ? (
        <Loading />
      ) : list.length === 0 ? (
        <EmptyState
          icon={PartyPopper}
          title="لا توجد طلبات حجز معلّقة."
          hint="كل الطلبات تمت مراجعتها — أي حجز جديد سيظهر هنا."
        />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <AnimatePresence initial={false}>
            {list.map((b, i) => (
              <motion.li
                key={b.id}
                layout
                initial={{ opacity: 0, y: 24, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9, filter: "blur(8px)" }}
                transition={{ duration: 0.55, ease: EASE, delay: Math.min(i * 0.06, 0.5) }}
                className="glass relative overflow-hidden rounded-3xl"
              >
                <div className="bg-brand-gradient h-1" />
                <div className="space-y-4 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="flex items-center gap-2 font-display font-semibold">
                        <CalendarDays className="size-4 text-brand-1" />
                        {b.dateLabel}
                      </p>
                      <p className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="size-3.5" />
                        الميعاد: <span className="tabular-nums text-foreground" dir="rtl">{b.slotLabel}</span>
                      </p>
                    </div>
                    <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-2.5 py-1 text-[11px] font-medium text-amber-600 dark:text-amber-300">
                      جديد
                    </span>
                  </div>

                  <dl className="space-y-2 rounded-2xl border border-border bg-background/40 p-3.5 text-sm">
                    <InfoRow icon={Building2} label="الشركة" value={b.companyName} />
                    <InfoRow icon={User} label="الاسم" value={b.personName} />
                    <InfoRow icon={Phone} label="الهاتف" value={b.personPhone} mono />
                    {b.brand && <InfoRow icon={Tag} label="الماركة" value={b.brand} />}
                    {b.boxes != null && (
                      <InfoRow icon={Boxes} label="عدد الصناديق" value={String(b.boxes)} mono />
                    )}
                    {b.load && <InfoRow icon={Package} label="الحمولة" value={b.load} />}
                  </dl>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      className="flex-1"
                      disabled={busy === b.id}
                      onClick={() => act(b.id, "confirm")}
                    >
                      <Check className="size-4" /> تأكيد
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-500"
                      disabled={busy === b.id}
                      onClick={() => act(b.id, "reject")}
                    >
                      <X className="size-4" /> رفض
                    </Button>
                    <RescheduleDialog bookingId={b.id} companyId={b.companyId} onDone={load} />
                  </div>
                </div>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
  mono,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="size-4 shrink-0 text-muted-foreground" />
      <dt className="text-muted-foreground">{label}:</dt>
      <dd className={mono ? "font-mono font-medium" : "font-medium"} dir={mono ? "ltr" : undefined}>
        {value}
      </dd>
    </div>
  );
}

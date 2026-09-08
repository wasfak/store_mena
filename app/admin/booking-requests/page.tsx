"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Check, Loader2, Phone, User, Building2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RescheduleDialog } from "@/components/reschedule-dialog";
import { getJSON, sendJSON } from "@/lib/api";

interface PendingBooking {
  id: string;
  companyId: string;
  companyName: string;
  personName: string;
  personPhone: string;
  date: string;
  dateLabel: string;
  slotLabel: string;
  createdAt: string | null;
}

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
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold">طلبات الحجز</h1>
        {list && list.length > 0 && (
          <Badge variant="outline" className="border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300">
            {list.length} بانتظار التأكيد
          </Badge>
        )}
      </div>
      <p className="text-sm text-muted-foreground">
        الحجوزات الجديدة التي تنتظر مراجعتك. أكّد أو ارفض كل طلب.
      </p>

      {list === null ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> جارٍ التحميل…
        </div>
      ) : list.length === 0 ? (
        <p className="text-muted-foreground">لا توجد طلبات حجز معلّقة.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {list.map((b) => (
            <Card key={b.id}>
              <CardContent className="space-y-3 py-4">
                <div className="space-y-1">
                  <div className="font-semibold">{b.dateLabel}</div>
                  <div className="text-sm text-muted-foreground">
                    الميعاد: {b.slotLabel}
                  </div>
                </div>

                <div className="space-y-1.5 border-t border-border pt-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">الشركة:</span>
                    <span className="font-medium">{b.companyName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">الاسم:</span>
                    <span className="font-medium">{b.personName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">الهاتف:</span>
                    <span dir="ltr" className="font-medium">{b.personPhone}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  <Button
                    size="sm"
                    className="flex-1"
                    disabled={busy === b.id}
                    onClick={() => act(b.id, "confirm")}
                  >
                    <Check className="mr-1 h-4 w-4" /> تأكيد
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    disabled={busy === b.id}
                    onClick={() => act(b.id, "reject")}
                  >
                    <X className="mr-1 h-4 w-4" /> رفض
                  </Button>
                  <RescheduleDialog
                    bookingId={b.id}
                    companyId={b.companyId}
                    onDone={load}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

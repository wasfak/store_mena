"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Show, SignInButton } from "@clerk/nextjs";
import { Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CompanyProfileForm } from "@/components/company-profile-form";
import { StatusBadge } from "@/components/status-badge";
import { getJSON, sendJSON } from "@/lib/api";
import { dateLabelAr, minutesToLabel } from "@/lib/slots";
import type { MyBookingDTO, Viewer } from "@/lib/types";

export default function MyBookingsPage() {
  const [viewer, setViewer] = useState<Viewer | null>(null);
  const [list, setList] = useState<MyBookingDTO[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const loadViewer = useCallback(async () => {
    try {
      setViewer(await getJSON<Viewer>("/api/me"));
    } catch {
      setViewer({ clerkId: null, isAdmin: false, company: null });
    }
  }, []);

  const loadList = useCallback(async () => {
    try {
      setList(await getJSON<MyBookingDTO[]>("/api/bookings?mine=1"));
    } catch (e) {
      toast.error((e as Error).message);
    }
  }, []);

  useEffect(() => {
    loadViewer();
  }, [loadViewer]);
  useEffect(() => {
    if (viewer?.company) loadList();
  }, [viewer, loadList]);

  async function cancel(id: string) {
    setBusy(id);
    try {
      await sendJSON(`/api/bookings/${id}`, "PATCH", { action: "cancel" });
      toast.success("تم إلغاء الحجز.");
      await loadList();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  if (viewer === null)
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> جارٍ التحميل…
      </div>
    );

  if (!viewer.clerkId)
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">حجوزاتي</h1>
        <p className="text-muted-foreground">سجّل الدخول لعرض حجوزاتك.</p>
        <Show when="signed-out">
          <SignInButton>
            <Button>تسجيل الدخول</Button>
          </SignInButton>
        </Show>
      </div>
    );

  if (!viewer.company)
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">حجوزاتي</h1>
        <CompanyProfileForm onSaved={() => loadViewer()} />
      </div>
    );

  const now = new Date();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">حجوزاتي</h1>
        <span className="text-sm text-muted-foreground">
          الشركة: <span className="font-medium text-foreground">{viewer.company.name}</span>
        </span>
      </div>

      {list === null ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> جارٍ التحميل…
        </div>
      ) : list.length === 0 ? (
        <p className="text-muted-foreground">لا توجد حجوزات بعد.</p>
      ) : (
        <div className="space-y-3">
          {list.map((b) => {
            const active = b.status === "pending" || b.status === "confirmed";
            const isPast = new Date(`${b.date}T23:59:59`) < now;
            return (
              <Card key={b.id}>
                <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
                  <div className="space-y-1">
                    <div className="font-semibold">{dateLabelAr(b.date)}</div>
                    <div className="text-sm text-muted-foreground">
                      الميعاد: {minutesToLabel(b.slotStart)}
                      {b.note ? ` — ${b.note}` : ""}
                    </div>
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

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { CalendarCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Combobox } from "@/components/ui/combobox";
import { MonthCalendar } from "@/components/ui/month-calendar";
import { cn } from "@/lib/utils";
import { getJSON, sendJSON } from "@/lib/api";

interface CompanyOpt {
  id: string;
  name: string;
}
interface DayOpt {
  date: string;
  label: string;
}
interface SlotOpt {
  start: number;
  label: string;
}

export default function Home() {
  const [companies, setCompanies] = useState<CompanyOpt[]>([]);
  const [days, setDays] = useState<DayOpt[]>([]);
  const [daysLoading, setDaysLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  const [companyName, setCompanyName] = useState("");
  const [personName, setPersonName] = useState("");
  const [personPhone, setPersonPhone] = useState("");
  const [cargo, setCargo] = useState("");
  const [date, setDate] = useState("");

  const [slots, setSlots] = useState<SlotOpt[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotStart, setSlotStart] = useState<number | null>(null);

  const [submitting, setSubmitting] = useState(false);

  const companyNames = useMemo(() => companies.map((c) => c.name), [companies]);
  const companyId = useMemo(
    () => companies.find((c) => c.name === companyName)?.id ?? "",
    [companies, companyName],
  );
  const availableDates = useMemo(() => days.map((d) => d.date), [days]);

  const loadCompanies = useCallback(async () => {
    setLoading(true);
    try {
      setCompanies(await getJSON<CompanyOpt[]>("/api/public/companies"));
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadDays = useCallback(async (cid: string) => {
    if (!cid) {
      setDays([]);
      return;
    }
    setDaysLoading(true);
    try {
      setDays(
        await getJSON<DayOpt[]>(`/api/public/available-days?companyId=${cid}`),
      );
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setDaysLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCompanies();
  }, [loadCompanies]);

  // The available days depend on the chosen company (its duration). Reset the
  // day/slot picks and reload days whenever the company changes.
  useEffect(() => {
    setDate("");
    setSlots([]);
    setSlotStart(null);
    loadDays(companyId);
  }, [companyId, loadDays]);

  // Load the free slots whenever a day is picked on the calendar.
  useEffect(() => {
    if (!date || !companyId) {
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
      .then((s) => {
        if (!cancelled) setSlots(s);
      })
      .catch((e) => {
        if (!cancelled) toast.error((e as Error).message);
      })
      .finally(() => {
        if (!cancelled) setSlotsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [date, companyId]);

  const phoneValid = /^\d{11}$/.test(personPhone);
  const canSubmit =
    !!companyId &&
    !!personName.trim() &&
    phoneValid &&
    !!date &&
    slotStart !== null;

  async function submit() {
    if (!canSubmit) {
      toast.error("من فضلك أكمل كل الحقول.");
      return;
    }
    setSubmitting(true);
    try {
      await sendJSON("/api/public/book", "POST", {
        companyId,
        personName: personName.trim(),
        personPhone: personPhone.trim(),
        load: cargo.trim(),
        date,
        slotStart,
      });
      toast.success("تم إرسال طلب الحجز بنجاح.");
      // Clearing the company resets date/slots/days via the company-change effect.
      setCompanyName("");
      setPersonName("");
      setPersonPhone("");
      setCargo("");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold tracking-tight">حجز ميعاد المخزن</h1>
        <p className="text-muted-foreground">
          اختر شركتك، أدخل اسمك ورقم هاتفك، ثم اختر ميعاداً متاحاً من التقويم.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarCheck className="h-5 w-5 text-primary" />
            بيانات الحجز
          </CardTitle>
          <CardDescription>كل الحقول مطلوبة.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="flex items-center gap-2 py-6 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> جارٍ التحميل…
            </div>
          ) : (
            <>
              <Field label="الشركة">
                <Combobox
                  value={companyName}
                  onChange={setCompanyName}
                  options={companyNames}
                  placeholder="اختر الشركة"
                  filterPlaceholder="ابحث عن الشركة…"
                />
              </Field>

              <Field label="الاسم">
                <Input
                  dir="auto"
                  value={personName}
                  onChange={(e) => setPersonName(e.target.value)}
                  placeholder="أدخل اسمك"
                />
              </Field>

              <Field label="رقم الهاتف">
                <Input
                  dir="auto"
                  inputMode="numeric"
                  value={personPhone}
                  onChange={(e) =>
                    setPersonPhone(e.target.value.replace(/\D/g, "").slice(0, 11))
                  }
                  placeholder="01xxxxxxxxx"
                  aria-invalid={personPhone.length > 0 && !phoneValid}
                />
                {personPhone.length > 0 && !phoneValid && (
                  <p className="text-xs text-red-600 dark:text-red-400">
                    رقم الهاتف يجب أن يكون 11 رقماً بالضبط.
                  </p>
                )}
              </Field>

              <Field label="الحمولة">
                <Input
                  dir="auto"
                  value={cargo}
                  onChange={(e) => setCargo(e.target.value)}
                  placeholder="تفاصيل الحمولة"
                />
              </Field>

              <Field label="الميعاد المتاح">
                {!companyId ? (
                  <p className="rounded-lg border border-dashed border-border px-3 py-3 text-sm text-muted-foreground">
                    اختر الشركة أولاً لعرض المواعيد المتاحة.
                  </p>
                ) : daysLoading ? (
                  <div className="flex items-center gap-2 py-1 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" /> جارٍ تحميل الأيام…
                  </div>
                ) : days.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-border px-3 py-3 text-sm text-muted-foreground">
                    لا توجد مواعيد متاحة لهذه الشركة حالياً.
                  </p>
                ) : (
                  <div className="space-y-3">
                    <MonthCalendar
                      availableDates={availableDates}
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
              </Field>

              <Button
                className="w-full"
                disabled={!canSubmit || submitting}
                onClick={submit}
              >
                {submitting ? "جارٍ الحجز…" : "احجز الميعاد"}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium">{label}</label>
      {children}
    </div>
  );
}

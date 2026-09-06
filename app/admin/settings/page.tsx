"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { getJSON, sendJSON } from "@/lib/api";
import { minutesToHHMM, hhmmToMinutes, weekdayNameAr, slotStarts, slotRangeLabel } from "@/lib/slots";
import type { SettingsDTO } from "@/lib/types";

// Order the day checkboxes Sat..Fri visually is optional; keep 0..6 (Sun..Sat).
const DAYS = [0, 1, 2, 3, 4, 5, 6];

export default function SettingsPage() {
  const [s, setS] = useState<SettingsDTO | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getJSON<SettingsDTO>("/api/settings").then(setS).catch((e) => toast.error(e.message));
  }, []);

  if (!s)
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> جارٍ التحميل…
      </div>
    );

  function toggleDay(d: number) {
    setS((prev) =>
      prev
        ? {
            ...prev,
            workingDays: prev.workingDays.includes(d)
              ? prev.workingDays.filter((x) => x !== d)
              : [...prev.workingDays, d].sort((a, b) => a - b),
          }
        : prev,
    );
  }

  async function save() {
    if (!s) return;
    if (s.endMinutes <= s.startMinutes) {
      toast.error("وقت النهاية يجب أن يكون بعد وقت البداية.");
      return;
    }
    setSaving(true);
    try {
      const saved = await sendJSON<SettingsDTO>("/api/settings", "PUT", s);
      setS(saved);
      toast.success("تم حفظ الإعدادات.");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  const preview = slotStarts(s);

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">إعدادات المخزن</h1>

      <Card>
        <CardHeader>
          <CardTitle>أيام العمل</CardTitle>
          <CardDescription>حدّد الأيام التي يستقبل فيها المخزن الشركات.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          {DAYS.map((d) => (
            <label key={d} className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={s.workingDays.includes(d)}
                onCheckedChange={() => toggleDay(d)}
              />
              {weekdayNameAr(d)}
            </label>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>ساعات العمل والخانات</CardTitle>
          <CardDescription>يُقسَّم اليوم إلى خانات متساوية حسب المدة.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="بداية العمل">
            <Input
              type="time"
              value={minutesToHHMM(s.startMinutes)}
              onChange={(e) => setS({ ...s, startMinutes: hhmmToMinutes(e.target.value) })}
            />
          </Field>
          <Field label="نهاية العمل">
            <Input
              type="time"
              value={minutesToHHMM(s.endMinutes)}
              onChange={(e) => setS({ ...s, endMinutes: hhmmToMinutes(e.target.value) })}
            />
          </Field>
          <Field label="مدة الخانة (دقيقة)">
            <Input
              type="number"
              min={5}
              step={5}
              value={s.slotMinutes}
              onChange={(e) => setS({ ...s, slotMinutes: Number(e.target.value) })}
            />
          </Field>
          <Field label="عدد الشركات لكل خانة">
            <Input
              type="number"
              min={1}
              value={s.capacityPerSlot}
              onChange={(e) => setS({ ...s, capacityPerSlot: Number(e.target.value) })}
            />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>معاينة الخانات ({preview.length})</CardTitle>
          <CardDescription>هذه المواعيد التي ستظهر للشركات في كل يوم عمل.</CardDescription>
        </CardHeader>
        <CardContent>
          {preview.length === 0 ? (
            <p className="text-sm text-red-600">لا توجد خانات — راجع الأوقات والمدة.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {preview.map((start) => (
                <span
                  key={start}
                  className="rounded-md border border-border bg-muted/40 px-2 py-1 text-xs"
                >
                  {slotRangeLabel(start, s.slotMinutes)}
                </span>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Button onClick={save} disabled={saving}>
        {saving ? "جارٍ الحفظ…" : "حفظ الإعدادات"}
      </Button>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium">{label}</label>
      {children}
    </div>
  );
}

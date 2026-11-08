"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Save, Settings } from "lucide-react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { getJSON, sendJSON } from "@/lib/api";
import { minutesToHHMM, hhmmToMinutes, weekdayNameAr, slotStarts, slotRangeLabel } from "@/lib/slots";
import type { SettingsDTO } from "@/lib/types";
import { Loading, PageHeader } from "@/components/page-header";
import { cn } from "@/lib/utils";

// Order the day checkboxes Sat..Fri visually is optional; keep 0..6 (Sun..Sat).
const DAYS = [0, 1, 2, 3, 4, 5, 6];

export default function SettingsPage() {
  const [s, setS] = useState<SettingsDTO | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getJSON<SettingsDTO>("/api/settings").then(setS).catch((e) => toast.error(e.message));
  }, []);

  if (!s) return <Loading />;

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
    <div className="max-w-3xl space-y-6">
      <PageHeader
        icon={Settings}
        eyebrow="الإدارة"
        title="إعدادات المخزن"
        description="أيام العمل وساعاته وطريقة تقسيم اليوم إلى خانات."
        className="mb-8"
      />

      <Card>
        <CardHeader>
          <CardTitle>أيام العمل</CardTitle>
          <CardDescription>حدّد الأيام التي يستقبل فيها المخزن الشركات.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {DAYS.map((d) => {
            const on = s.workingDays.includes(d);
            return (
              <label
                key={d}
                className={cn(
                  "flex cursor-pointer items-center gap-2 rounded-full border px-4 py-2 text-sm transition-all duration-300",
                  on
                    ? "border-brand-1/50 bg-brand-1/10 text-foreground shadow-[0_0_20px_-6px] shadow-brand-1/50"
                    : "border-border bg-background/40 text-muted-foreground hover:text-foreground",
                )}
              >
                <Checkbox checked={on} onCheckedChange={() => toggleDay(d)} />
                {weekdayNameAr(d)}
              </label>
            );
          })}
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
              {preview.map((start, i) => (
                <motion.span
                  key={start}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: Math.min(i * 0.02, 0.5) }}
                  className="rounded-xl border border-border bg-background/40 px-2.5 py-1.5 text-xs tabular-nums"
                  dir="rtl"
                >
                  {slotRangeLabel(start, s.slotMinutes)}
                </motion.span>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="sticky bottom-4 z-10 flex justify-end">
        <Button size="lg" onClick={save} disabled={saving} className="shine rounded-2xl px-7">
          <Save className="size-4" />
          {saving ? "جارٍ الحفظ" : "حفظ الإعدادات"}
        </Button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium">{label}</label>
      {children}
    </div>
  );
}

"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { sendJSON } from "@/lib/api";

// Create/edit the caller's own company profile. Used as a gate on /book when
// the user hasn't set one up yet, and standalone on /my-bookings.
export function CompanyProfileForm({
  initialName = "",
  initialPhone = "",
  onSaved,
  title = "بيانات الشركة",
  description = "أدخل اسم شركتك ورقم التواصل قبل حجز المواعيد.",
}: {
  initialName?: string;
  initialPhone?: string;
  onSaved?: (id: string) => void;
  title?: string;
  description?: string;
}) {
  const [name, setName] = useState(initialName);
  const [phone, setPhone] = useState(initialPhone);
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!name.trim()) {
      toast.error("اسم الشركة مطلوب.");
      return;
    }
    setSaving(true);
    try {
      const res = await sendJSON<{ id: string }>("/api/companies", "POST", {
        name,
        phone,
      });
      toast.success("تم حفظ بيانات الشركة.");
      onSaved?.(res.id);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="max-w-md">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1">
          <label className="text-sm font-medium">اسم الشركة</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="مثال: شركة النور للأدوية" />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">رقم التواصل</label>
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="01xxxxxxxxx" inputMode="tel" />
        </div>
        <Button onClick={save} disabled={saving}>
          {saving ? "جارٍ الحفظ…" : "حفظ"}
        </Button>
      </CardContent>
    </Card>
  );
}

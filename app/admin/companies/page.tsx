"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { Building2, Plus } from "lucide-react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getJSON, sendJSON } from "@/lib/api";
import type { CompanyDTO } from "@/lib/types";
import { EmptyState, Loading, PageHeader } from "@/components/page-header";

export default function CompaniesPage() {
  const [list, setList] = useState<CompanyDTO[] | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [dur, setDur] = useState("1");
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    try {
      setList(await getJSON<CompanyDTO[]>("/api/companies"));
    } catch (e) {
      toast.error((e as Error).message);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function add() {
    if (!name.trim()) {
      toast.error("اسم الشركة مطلوب.");
      return;
    }
    setAdding(true);
    try {
      await sendJSON("/api/companies", "POST", {
        name,
        phone,
        durationHours: Number(dur) || 1,
        ownerless: true,
      });
      toast.success("تمت إضافة الشركة.");
      setName("");
      setPhone("");
      setDur("1");
      await load();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setAdding(false);
    }
  }

  async function toggleActive(c: CompanyDTO) {
    try {
      await sendJSON(`/api/companies/${c.id}`, "PATCH", { active: !c.active });
      await load();
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  async function updateDuration(c: CompanyDTO, value: number) {
    if (!(value >= 0.5)) {
      toast.error("المدة يجب ألا تقل عن نصف ساعة.");
      return;
    }
    try {
      await sendJSON(`/api/companies/${c.id}`, "PATCH", { durationHours: value });
      toast.success("تم تحديث المدة.");
      await load();
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        icon={Building2}
        eyebrow="الإدارة"
        title="الشركات"
        description="الشركات المسموح لها بالحجز، ومدة الحجز التلقائية لكل شركة."
      />

      <Card className="border-beam max-w-3xl">
        <CardHeader>
          <CardTitle>إضافة شركة</CardTitle>
          <CardDescription>
            شركات يديرها المخزن (بدون حساب خاص). «المدة» هي عدد الساعات التي يحجزها
            المخزن للشركة تلقائياً — الشركة الكبيرة تأخذ مواعيد متتالية تغطي هذه المدة.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-3">
          <div className="w-full space-y-1.5 sm:w-auto">
            <label className="block text-sm font-medium">اسم الشركة</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="w-full sm:w-56" />
          </div>
          <div className="w-full space-y-1.5 sm:w-auto">
            <label className="block text-sm font-medium">رقم التواصل</label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full sm:w-44" inputMode="tel" />
          </div>
          <div className="w-full space-y-1.5 sm:w-auto">
            <label className="block text-sm font-medium">المدة (ساعات)</label>
            <Input
              type="number"
              min={0.5}
              step={0.5}
              value={dur}
              onChange={(e) => setDur(e.target.value)}
              className="w-full sm:w-28"
            />
          </div>
          <Button onClick={add} disabled={adding} className="h-10 w-full px-5 sm:w-auto">
            <Plus className="size-4" /> إضافة
          </Button>
        </CardContent>
      </Card>

      {list === null ? (
        <Loading />
      ) : list.length === 0 ? (
        <EmptyState icon={Building2} title="لا توجد شركات بعد." hint="أضف أول شركة من النموذج بالأعلى." />
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="glass overflow-x-auto rounded-3xl"
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الشركة</TableHead>
                <TableHead>رقم التواصل</TableHead>
                <TableHead>المدة (ساعات)</TableHead>
                <TableHead>النوع</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead className="text-left">إجراء</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">
                    <span className="flex items-center gap-3">
                      <span className="bg-brand-gradient grid size-8 shrink-0 place-items-center rounded-lg font-display text-xs font-bold text-white">
                        {c.name.trim().charAt(0)}
                      </span>
                      {c.name}
                    </span>
                  </TableCell>
                  <TableCell className="font-mono" dir="ltr">{c.phone || "—"}</TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min={0.5}
                      step={0.5}
                      defaultValue={c.durationHours ?? 1}
                      className="w-20"
                      onBlur={(e) => {
                        const v = Number(e.target.value);
                        if (v !== (c.durationHours ?? 1)) updateDuration(c, v);
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{c.hasOwner ? "لها حساب" : "يديرها المخزن"}</Badge>
                  </TableCell>
                  <TableCell>
                    {c.active ? (
                      <Badge variant="outline" className="border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                        نشطة
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-300">
                        موقوفة
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-left">
                    <Button variant="outline" size="sm" onClick={() => toggleActive(c)}>
                      {c.active ? "إيقاف" : "تفعيل"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </motion.div>
      )}
    </div>
  );
}

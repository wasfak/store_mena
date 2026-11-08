"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Ban, ShieldBan } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getJSON, sendJSON } from "@/lib/api";
import type { CompanyDTO, ConflictDTO } from "@/lib/types";
import { EmptyState, Loading, PageHeader } from "@/components/page-header";

export default function ConflictsPage() {
  const [companies, setCompanies] = useState<CompanyDTO[]>([]);
  const [rules, setRules] = useState<ConflictDTO[] | null>(null);
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    try {
      const [c, r] = await Promise.all([
        getJSON<CompanyDTO[]>("/api/companies"),
        getJSON<ConflictDTO[]>("/api/conflicts"),
      ]);
      setCompanies(c);
      setRules(r);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function add() {
    if (!a || !b || a === b) {
      toast.error("اختر شركتين مختلفتين.");
      return;
    }
    setAdding(true);
    try {
      await sendJSON("/api/conflicts", "POST", { companyA: a, companyB: b });
      toast.success("تمت إضافة قاعدة المنع.");
      setA("");
      setB("");
      await load();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setAdding(false);
    }
  }

  async function remove(id: string) {
    try {
      await sendJSON(`/api/conflicts/${id}`, "DELETE");
      await load();
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        icon={ShieldBan}
        eyebrow="الإدارة"
        title="قواعد التعارض"
        description="حدّد أزواج الشركات الممنوع حضورها في نفس اليوم. عند حجز إحداها في يوم، يمنع النظام الأخرى من الحجز في نفس اليوم تلقائياً."
      />

      <Card className="border-beam max-w-3xl">
        <CardHeader>
          <CardTitle>إضافة قاعدة منع</CardTitle>
          <CardDescription>الشركتان لا يجتمعان في يوم واحد.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-3">
          <CompanySelect label="الشركة الأولى" value={a} onChange={setA} companies={companies} exclude={b} />
          <span className="mx-auto mb-1 grid size-8 place-items-center rounded-full bg-red-500/10 text-red-500 sm:mx-0">
            <Ban className="size-4" />
          </span>
          <CompanySelect label="الشركة الثانية" value={b} onChange={setB} companies={companies} exclude={a} />
          <Button onClick={add} disabled={adding} className="h-10 w-full px-5 sm:w-auto">
            <Plus className="size-4" /> إضافة
          </Button>
        </CardContent>
      </Card>

      {rules === null ? (
        <Loading />
      ) : rules.length === 0 ? (
        <EmptyState icon={ShieldBan} title="لا توجد قواعد تعارض بعد." />
      ) : (
        <ul className="grid gap-3 lg:grid-cols-2">
          <AnimatePresence initial={false}>
            {rules.map((r, i) => (
              <motion.li
                key={r.id}
                layout
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.94 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: Math.min(i * 0.05, 0.4) }}
                className="glass group flex items-center justify-between gap-3 rounded-2xl p-3 ps-4"
              >
                <div className="flex min-w-0 flex-wrap items-center gap-2.5">
                  <span className="rounded-xl border border-border bg-background/50 px-3 py-1.5 font-medium">{r.nameA}</span>
                  <span className="relative grid size-8 place-items-center rounded-full bg-red-500/10 text-red-500" title="لا يجتمع مع">
                    <Ban className="size-4" />
                  </span>
                  <span className="rounded-xl border border-border bg-background/50 px-3 py-1.5 font-medium">{r.nameB}</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => remove(r.id)}
                  aria-label="حذف القاعدة"
                  className="text-muted-foreground hover:bg-red-500/10 hover:text-red-500"
                >
                  <Trash2 className="size-4" />
                </Button>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </div>
  );
}

function CompanySelect({
  label,
  value,
  onChange,
  companies,
  exclude,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  companies: CompanyDTO[];
  exclude?: string;
}) {
  return (
    <div className="w-full space-y-1.5 sm:w-auto">
      <label className="block text-sm font-medium">{label}</label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-full sm:w-56">
          <SelectValue placeholder="اختر شركة" />
        </SelectTrigger>
        <SelectContent>
          {companies
            .filter((c) => c.id !== exclude)
            .map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
        </SelectContent>
      </Select>
    </div>
  );
}

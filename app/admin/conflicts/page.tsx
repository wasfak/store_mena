"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getJSON, sendJSON } from "@/lib/api";
import type { CompanyDTO, ConflictDTO } from "@/lib/types";

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
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">قواعد التعارض</h1>
        <p className="max-w-2xl text-muted-foreground">
          حدّد أزواج الشركات الممنوع حضورها في نفس اليوم. عند حجز إحداها في يوم،
          يمنع النظام الأخرى من الحجز في نفس اليوم تلقائياً.
        </p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>إضافة قاعدة منع</CardTitle>
          <CardDescription>الشركتان لا يجتمعان في يوم واحد.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-3">
          <CompanySelect label="الشركة الأولى" value={a} onChange={setA} companies={companies} exclude={b} />
          <span className="pb-2 text-muted-foreground">×</span>
          <CompanySelect label="الشركة الثانية" value={b} onChange={setB} companies={companies} exclude={a} />
          <Button onClick={add} disabled={adding}>
            <Plus className="mr-1 h-4 w-4" /> إضافة
          </Button>
        </CardContent>
      </Card>

      {rules === null ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> جارٍ التحميل…
        </div>
      ) : rules.length === 0 ? (
        <p className="text-muted-foreground">لا توجد قواعد تعارض بعد.</p>
      ) : (
        <div className="space-y-2">
          {rules.map((r) => (
            <div
              key={r.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-3"
            >
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <Ban className="h-4 w-4 text-red-500" />
                <span className="font-medium">{r.nameA}</span>
                <span className="text-muted-foreground">لا يجتمع مع</span>
                <span className="font-medium">{r.nameB}</span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => remove(r.id)}>
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </div>
          ))}
        </div>
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
    <div className="space-y-1">
      <label className="text-sm font-medium">{label}</label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-56">
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

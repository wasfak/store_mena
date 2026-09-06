"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getJSON, sendJSON } from "@/lib/api";
import type { CompanyDTO } from "@/lib/types";

export default function CompaniesPage() {
  const [list, setList] = useState<CompanyDTO[] | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
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
      await sendJSON("/api/companies", "POST", { name, phone, ownerless: true });
      toast.success("تمت إضافة الشركة.");
      setName("");
      setPhone("");
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

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">الشركات</h1>

      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>إضافة شركة</CardTitle>
          <CardDescription>
            شركات يديرها المخزن (بدون حساب خاص). الشركات التي تسجّل بنفسها تظهر
            هنا تلقائياً.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <label className="text-sm font-medium">اسم الشركة</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="w-56" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">رقم التواصل</label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="w-44" inputMode="tel" />
          </div>
          <Button onClick={add} disabled={adding}>
            <Plus className="mr-1 h-4 w-4" /> إضافة
          </Button>
        </CardContent>
      </Card>

      {list === null ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> جارٍ التحميل…
        </div>
      ) : list.length === 0 ? (
        <p className="text-muted-foreground">لا توجد شركات بعد.</p>
      ) : (
        <div className="rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الشركة</TableHead>
                <TableHead>رقم التواصل</TableHead>
                <TableHead>النوع</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead className="text-left">إجراء</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell>{c.phone || "—"}</TableCell>
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
        </div>
      )}
    </div>
  );
}

"use client";

import { ChevronRight, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addDaysISO, dateLabelAr, todayISO } from "@/lib/slots";

// Prev / date-picker / next / today control for day-based pages. LTR: the
// "previous day" chevron points left, "next" points right.
export function DateNav({
  date,
  onChange,
}: {
  date: string;
  onChange: (d: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="outline" size="icon" onClick={() => onChange(addDaysISO(date, -1))} aria-label="اليوم السابق">
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <Button variant="outline" size="icon" onClick={() => onChange(addDaysISO(date, 1))} aria-label="اليوم التالي">
        <ChevronRight className="h-4 w-4" />
      </Button>
      <Input
        type="date"
        value={date}
        onChange={(e) => e.target.value && onChange(e.target.value)}
        className="w-40"
      />
      <Button variant="ghost" onClick={() => onChange(todayISO())}>
        اليوم
      </Button>
      <span className="text-lg font-semibold">{dateLabelAr(date)}</span>
    </div>
  );
}

"use client";

import { AnimatePresence, motion } from "motion/react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
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
  const isToday = date === todayISO();
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="glass flex items-center gap-1 rounded-2xl p-1">
        <button
          type="button"
          onClick={() => onChange(addDaysISO(date, -1))}
          aria-label="اليوم السابق"
          className="grid size-9 place-items-center rounded-xl transition-colors hover:bg-foreground/5"
        >
          <ChevronLeft className="size-4" />
        </button>
        <label className="relative flex h-9 items-center gap-2 rounded-xl px-2 text-sm transition-colors hover:bg-foreground/5">
          <CalendarDays className="size-4 text-brand-1" />
          <input
            type="date"
            value={date}
            onChange={(e) => e.target.value && onChange(e.target.value)}
            className="w-32 bg-transparent font-mono text-sm outline-none"
          />
        </label>
        <button
          type="button"
          onClick={() => onChange(addDaysISO(date, 1))}
          aria-label="اليوم التالي"
          className="grid size-9 place-items-center rounded-xl transition-colors hover:bg-foreground/5"
        >
          <ChevronRight className="size-4" />
        </button>
        <button
          type="button"
          onClick={() => onChange(todayISO())}
          disabled={isToday}
          className="h-9 rounded-xl px-3 text-sm font-medium transition-colors hover:bg-foreground/5 disabled:text-brand-1 disabled:opacity-100"
        >
          اليوم
        </button>
      </div>
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={date}
          initial={{ opacity: 0, y: 8, filter: "blur(6px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: -8, filter: "blur(6px)" }}
          transition={{ duration: 0.3 }}
          className="font-display text-xl font-semibold"
        >
          {dateLabelAr(date)}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}

"use client";

import * as React from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["أحد", "إثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة", "سبت"];
const MONTHS = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
];

function iso(y: number, m: number, d: number): string {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

// A month calendar. Only dates present in `availableDates` are clickable; every
// other day is shown dimmed and disabled. Month navigation is clamped to the
// range spanned by the available dates. Months slide in the direction you move,
// and the selection glides between days.
export function MonthCalendar({
  availableDates,
  value,
  onSelect,
}: {
  availableDates: string[];
  value: string;
  onSelect: (date: string) => void;
}) {
  const avail = React.useMemo(() => new Set(availableDates), [availableDates]);
  const layoutGroup = React.useId();

  // Navigation bounds (first & last available month), falling back to now.
  const { minYM, maxYM } = React.useMemo(() => {
    const sorted = [...availableDates].sort();
    const now = new Date();
    const nowYM = { y: now.getFullYear(), m: now.getMonth() };
    if (sorted.length === 0) return { minYM: nowYM, maxYM: nowYM };
    const parse = (s: string) => {
      const [y, m] = s.split("-").map(Number);
      return { y, m: m - 1 };
    };
    return { minYM: parse(sorted[0]), maxYM: parse(sorted[sorted.length - 1]) };
  }, [availableDates]);

  const [view, setView] = React.useState(() => minYM);
  const [dir, setDir] = React.useState(0);

  // Keep the view inside bounds if the available set changes.
  React.useEffect(() => {
    setView((v) => {
      if (v.y * 12 + v.m < minYM.y * 12 + minYM.m) return minYM;
      if (v.y * 12 + v.m > maxYM.y * 12 + maxYM.m) return maxYM;
      return v;
    });
  }, [minYM, maxYM]);

  const viewIndex = view.y * 12 + view.m;
  const canPrev = viewIndex > minYM.y * 12 + minYM.m;
  const canNext = viewIndex < maxYM.y * 12 + maxYM.m;

  const step = (delta: number) => {
    setDir(delta);
    setView((v) => {
      const idx = v.y * 12 + v.m + delta;
      return { y: Math.floor(idx / 12), m: ((idx % 12) + 12) % 12 };
    });
  };

  const firstWeekday = new Date(view.y, view.m, 1).getDay();
  const daysInMonth = new Date(view.y, view.m + 1, 0).getDate();
  const now = new Date();
  const today = iso(now.getFullYear(), now.getMonth(), now.getDate());

  const cells: (number | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  const availableThisMonth = cells.filter(
    (d) => d !== null && avail.has(iso(view.y, view.m, d)),
  ).length;

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-background/40 p-3 sm:p-4">
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          disabled={!canPrev}
          onClick={() => step(-1)}
          className="grid size-9 place-items-center rounded-xl text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground disabled:pointer-events-none disabled:opacity-25"
          aria-label="الشهر السابق"
        >
          <ChevronLeft className="size-4" />
        </button>
        <div className="text-center">
          <AnimatePresence mode="wait" initial={false}>
            <motion.p
              key={`${view.y}-${view.m}`}
              initial={{ opacity: 0, y: dir >= 0 ? 8 : -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: dir >= 0 ? -8 : 8 }}
              transition={{ duration: 0.25 }}
              className="font-display text-base font-semibold"
            >
              {MONTHS[view.m]} <span className="font-mono text-muted-foreground">{view.y}</span>
            </motion.p>
          </AnimatePresence>
          <p className="text-[11px] text-muted-foreground">
            {availableThisMonth > 0 ? `${availableThisMonth} يوم متاح` : "لا أيام متاحة"}
          </p>
        </div>
        <button
          type="button"
          disabled={!canNext}
          onClick={() => step(1)}
          className="grid size-9 place-items-center rounded-xl text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground disabled:pointer-events-none disabled:opacity-25"
          aria-label="الشهر التالي"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-muted-foreground">
        {WEEKDAYS.map((w) => (
          <div key={w} className="py-1.5">
            {w}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={`${view.y}-${view.m}`}
          initial={{ opacity: 0, x: dir >= 0 ? 24 : -24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: dir >= 0 ? -24 : 24 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          className="grid grid-cols-7 gap-1"
        >
          {cells.map((day, i) => {
            if (day === null) return <div key={`b${i}`} />;
            const ds = iso(view.y, view.m, day);
            const enabled = avail.has(ds);
            const selected = ds === value;
            const isToday = ds === today;
            return (
              <button
                key={ds}
                type="button"
                disabled={!enabled}
                onClick={() => onSelect(ds)}
                className={cn(
                  "relative flex h-10 items-center justify-center rounded-xl font-mono text-sm transition-colors",
                  selected
                    ? "font-bold text-white"
                    : enabled
                      ? "cursor-pointer font-semibold text-foreground hover:bg-brand-1/10"
                      : "text-muted-foreground/35",
                  isToday && !selected && "ring-1 ring-inset ring-brand-1/50",
                )}
              >
                {selected && (
                  <motion.span
                    layoutId={`cal-sel-${layoutGroup}`}
                    className="bg-brand-gradient absolute inset-0 rounded-xl shadow-lg shadow-brand-2/40"
                    transition={{ type: "spring", stiffness: 420, damping: 32 }}
                  />
                )}
                <span className="relative">{day}</span>
                {enabled && !selected && (
                  <span className="absolute bottom-1 size-1 rounded-full bg-brand-1 shadow-[0_0_6px] shadow-brand-1" />
                )}
              </button>
            );
          })}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

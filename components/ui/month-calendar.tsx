"use client";

import * as React from "react";
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

// A minimal month calendar. Only dates present in `availableDates` are clickable;
// every other day is shown dimmed and disabled. Month navigation is clamped to
// the range spanned by the available dates.
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

  const step = (delta: number) =>
    setView((v) => {
      const idx = v.y * 12 + v.m + delta;
      return { y: Math.floor(idx / 12), m: ((idx % 12) + 12) % 12 };
    });

  const firstWeekday = new Date(view.y, view.m, 1).getDay();
  const daysInMonth = new Date(view.y, view.m + 1, 0).getDate();
  const today = iso(
    new Date().getFullYear(),
    new Date().getMonth(),
    new Date().getDate(),
  );

  const cells: (number | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <div className="rounded-lg border border-border p-3">
      <div className="mb-2 flex items-center justify-between">
        <button
          type="button"
          disabled={!canPrev}
          onClick={() => step(-1)}
          className="rounded-md p-1 text-muted-foreground hover:bg-accent disabled:opacity-30"
          aria-label="الشهر السابق"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
        <span className="text-sm font-semibold">
          {MONTHS[view.m]} {view.y}
        </span>
        <button
          type="button"
          disabled={!canNext}
          onClick={() => step(1)}
          className="rounded-md p-1 text-muted-foreground hover:bg-accent disabled:opacity-30"
          aria-label="الشهر التالي"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-muted-foreground">
        {WEEKDAYS.map((w) => (
          <div key={w} className="py-1">
            {w}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
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
                "flex h-9 items-center justify-center rounded-md text-sm transition-colors",
                selected
                  ? "bg-primary font-semibold text-primary-foreground"
                  : enabled
                    ? "cursor-pointer font-medium hover:bg-accent"
                    : "text-muted-foreground/40",
                isToday && !selected && "ring-1 ring-primary/40",
              )}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

"use client";

import { motion } from "motion/react";
import { Clock } from "lucide-react";

import { cn } from "@/lib/utils";

interface SlotOpt {
  start: number;
  label: string;
}

/** Time-slot chips: stagger in, selection glides between them. */
export function SlotPicker({
  slots,
  value,
  onChange,
}: {
  slots: SlotOpt[];
  value: number | null;
  onChange: (start: number) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {slots.map((s, i) => {
        const selected = value === s.start;
        return (
          <motion.button
            key={s.start}
            type="button"
            onClick={() => onChange(s.start)}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1], delay: Math.min(i * 0.02, 0.18) }}
            whileTap={{ scale: 0.96 }}
            className={cn(
              "relative flex items-center justify-center gap-1.5 whitespace-nowrap rounded-xl border px-1.5 py-2.5 text-[13px] tabular-nums transition-colors sm:px-2 sm:text-sm",
              selected
                ? "border-transparent font-semibold text-white"
                : "border-border bg-background/40 hover:border-brand-1/50 hover:bg-brand-1/5",
            )}
          >
            {selected && (
              <span className="bg-brand-gradient absolute inset-0 rounded-xl shadow-lg shadow-brand-2/40" />
            )}
            <Clock className={cn("relative hidden size-3.5 shrink-0 min-[400px]:block", selected ? "text-white" : "text-muted-foreground")} />
            <span className="relative" dir="rtl">
              {s.label}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}

"use client";

import { motion } from "motion/react";
import type { LucideIcon } from "lucide-react";

import { WordsReveal } from "@/components/fx/words-reveal";
import { cn } from "@/lib/utils";

const EASE = [0.22, 1, 0.36, 1] as const;

/** Shared page title block: gradient icon tile, eyebrow, kinetic title, description. */
export function PageHeader({
  icon: Icon,
  eyebrow,
  title,
  description,
  actions,
  className,
}: {
  icon: LucideIcon;
  eyebrow?: string;
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-end justify-between gap-6", className)}>
      <div className="flex items-start gap-4">
        <motion.span
          initial={{ opacity: 0, scale: 0.6, rotate: -12 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 18 }}
          className="bg-brand-gradient relative grid size-14 shrink-0 place-items-center rounded-2xl text-white shadow-xl shadow-brand-2/30"
        >
          <Icon className="size-6" />
          <span className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/25" />
        </motion.span>
        <div>
          {eyebrow && (
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: EASE }}
              className="text-xs font-medium text-brand-1"
            >
              {eyebrow}
            </motion.p>
          )}
          <h1 className="font-display mt-1 text-3xl font-bold leading-[1.3] sm:text-4xl">
            <WordsReveal text={title} delay={0.05} />
          </h1>
          {description && (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: EASE, delay: 0.25 }}
              className="mt-2 max-w-2xl leading-7 text-muted-foreground"
            >
              {description}
            </motion.p>
          )}
        </div>
      </div>
      {actions && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: EASE, delay: 0.3 }}
        >
          {actions}
        </motion.div>
      )}
    </div>
  );
}

/** Animated loading line used across pages. */
export function Loading({ label = "جارٍ التحميل…" }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 py-6 text-sm text-muted-foreground">
      <span className="relative flex size-5">
        <span className="absolute inset-0 animate-spin rounded-full border-2 border-brand-1/20 border-t-brand-1" />
      </span>
      {label}
    </div>
  );
}

/** Friendly empty state with a glowing icon. */
export function EmptyState({
  icon: Icon,
  title,
  hint,
}: {
  icon: LucideIcon;
  title: string;
  hint?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: EASE }}
      className="glass flex flex-col items-center gap-3 rounded-3xl px-6 py-14 text-center"
    >
      <span className="relative grid size-16 place-items-center rounded-2xl bg-foreground/5">
        <span className="bg-brand-gradient absolute inset-0 -z-10 rounded-2xl opacity-30 blur-xl" />
        <Icon className="size-7 text-brand-1" />
      </span>
      <p className="font-display text-lg font-semibold">{title}</p>
      {hint && <p className="max-w-sm text-sm leading-6 text-muted-foreground">{hint}</p>}
    </motion.div>
  );
}

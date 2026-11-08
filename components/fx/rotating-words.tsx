"use client";

import * as React from "react";
import { AnimatePresence, motion } from "motion/react";

import { cn } from "@/lib/utils";

/** Cycles through phrases with a blur/slide swap; width animates smoothly. */
export function RotatingWords({
  words,
  interval = 2600,
  className,
}: {
  words: string[];
  interval?: number;
  className?: string;
}) {
  const [index, setIndex] = React.useState(0);

  React.useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % words.length), interval);
    return () => clearInterval(id);
  }, [words.length, interval]);

  return (
    <motion.span
      layout
      transition={{ layout: { type: "spring", stiffness: 200, damping: 26 } }}
      className={cn("relative inline-flex justify-center whitespace-nowrap", className)}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={words[index]}
          className="text-gradient inline-block py-[0.12em]"
          initial={{ y: "70%", opacity: 0, filter: "blur(14px)", rotateX: -60 }}
          animate={{ y: "0%", opacity: 1, filter: "blur(0px)", rotateX: 0 }}
          exit={{ y: "-70%", opacity: 0, filter: "blur(14px)", rotateX: 60 }}
          transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
        >
          {words[index]}
        </motion.span>
      </AnimatePresence>
      <span className="sr-only" aria-live="polite">
        {words[index]}
      </span>
    </motion.span>
  );
}

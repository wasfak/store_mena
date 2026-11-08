"use client";

import { motion } from "motion/react";

import { cn } from "@/lib/utils";

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Blur-to-sharp, word-by-word reveal. Splits on words only — splitting Arabic
 * into letters would break the cursive joins.
 */
export function WordsReveal({
  text,
  className,
  wordClassName,
  delay = 0,
  stagger = 0.07,
  inView = false,
}: {
  text: string;
  className?: string;
  wordClassName?: string;
  delay?: number;
  stagger?: number;
  /** animate when scrolled into view instead of on mount */
  inView?: boolean;
}) {
  const words = text.split(" ");
  const target = { opacity: 1, y: 0, filter: "blur(0px)" };
  // dir="auto": the words are inline-blocks (bidi-neutral), so the span must
  // carry the text's own direction or Arabic words would be laid out LTR.
  return (
    <span dir="auto" className={className}>
      {words.map((w, i) => (
        <span key={i}>
          {i > 0 && " "}
          <motion.span
            className={cn("inline-block will-change-transform", wordClassName)}
            initial={{ opacity: 0, y: "0.45em", filter: "blur(12px)" }}
            animate={inView ? undefined : target}
            whileInView={inView ? target : undefined}
            viewport={{ once: true, margin: "-10% 0px" }}
            transition={{ duration: 0.9, ease: EASE, delay: delay + i * stagger }}
          >
            {w}
          </motion.span>
        </span>
      ))}
    </span>
  );
}

/** Generic fade-up-on-scroll wrapper for blocks. */
export function Reveal({
  children,
  className,
  delay = 0,
  y = 28,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  y?: number;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y, filter: "blur(8px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "-12% 0px" }}
      transition={{ duration: 0.9, ease: EASE, delay }}
    >
      {children}
    </motion.div>
  );
}

"use client";

import { motion } from "motion/react";

// Re-mounts on every navigation, so each page glides in. (No blur here: a
// lingering `filter` would become the containing block for fixed children.)
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Glass card with a soft light that follows the pointer, plus a brighter
 * rim-light on the border under the cursor. Pointer position is written to
 * CSS variables — no React re-renders while moving.
 */
export function SpotlightCard({
  children,
  className,
  contentClassName,
  ...rest
}: React.HTMLAttributes<HTMLDivElement> & { contentClassName?: string }) {
  const ref = React.useRef<HTMLDivElement>(null);

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--x", `${e.clientX - r.left}px`);
    el.style.setProperty("--y", `${e.clientY - r.top}px`);
  };

  return (
    <div
      ref={ref}
      onPointerMove={onMove}
      className={cn(
        "group/spot glass relative overflow-hidden rounded-3xl",
        className,
      )}
      {...rest}
    >
      {/* interior glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover/spot:opacity-100"
        style={{
          background:
            "radial-gradient(420px circle at var(--x, 50%) var(--y, 50%), color-mix(in oklch, var(--brand-1) 13%, transparent), transparent 60%)",
        }}
      />
      {/* rim light */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-500 group-hover/spot:opacity-100"
        style={{
          padding: 1,
          background:
            "radial-gradient(260px circle at var(--x, 50%) var(--y, 50%), color-mix(in oklch, var(--brand-2) 80%, transparent), transparent 70%)",
          WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
          WebkitMaskComposite: "xor",
          mask: "linear-gradient(#000 0 0) content-box exclude, linear-gradient(#000 0 0)",
        }}
      />
      <div className={cn("relative", contentClassName)}>{children}</div>
    </div>
  );
}

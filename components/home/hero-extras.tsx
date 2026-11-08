"use client";

import * as React from "react";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  type MotionValue,
} from "motion/react";
import { Box, Package, PackageCheck, Truck } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

/* ───────── floating parcels with pointer parallax ───────── */

const PARCELS: Array<{
  icon: LucideIcon;
  left: string;
  top: string;
  size: number;
  depth: number;
  rotate: number;
  float: string;
}> = [
  { icon: Package, left: "4%", top: "22%", size: 54, depth: 36, rotate: -14, float: "float-slow" },
  { icon: Box, left: "44%", top: "8%", size: 40, depth: 22, rotate: 10, float: "float-med" },
  { icon: Truck, left: "90%", top: "14%", size: 50, depth: 30, rotate: 8, float: "float-fast" },
  { icon: PackageCheck, left: "48%", top: "62%", size: 44, depth: 40, rotate: -8, float: "float-med" },
  { icon: Box, left: "2%", top: "70%", size: 36, depth: 18, rotate: 18, float: "float-fast" },
  { icon: Package, left: "93%", top: "58%", size: 42, depth: 26, rotate: -18, float: "float-slow" },
];

export function FloatingParcels({ className }: { className?: string }) {
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 60, damping: 18 });
  const sy = useSpring(my, { stiffness: 60, damping: 18 });

  React.useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return;
    const onMove = (e: PointerEvent) => {
      mx.set(e.clientX / window.innerWidth - 0.5);
      my.set(e.clientY / window.innerHeight - 0.5);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [mx, my]);

  return (
    <div aria-hidden="true" className={cn("pointer-events-none absolute inset-0", className)}>
      {PARCELS.map((p, i) => (
        <Parcel key={i} {...p} mx={sx} my={sy} index={i} />
      ))}
    </div>
  );
}

function Parcel({
  icon: Icon,
  left,
  top,
  size,
  depth,
  rotate,
  float,
  mx,
  my,
  index,
}: (typeof PARCELS)[number] & { mx: MotionValue<number>; my: MotionValue<number>; index: number }) {
  const x = useTransform(mx, [-0.5, 0.5], [depth, -depth]);
  const y = useTransform(my, [-0.5, 0.5], [depth, -depth]);
  return (
    <motion.div
      className="absolute"
      style={{ left, top, x, y }}
      initial={{ opacity: 0, scale: 0.4 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 120, damping: 14, delay: 0.6 + index * 0.12 }}
    >
      <div
        className={cn(
          float,
          "grid place-items-center rounded-2xl border border-white/10 bg-card/40 text-brand-1/80 shadow-xl shadow-black/10",
        )}
        style={{ width: size, height: size, rotate: `${rotate}deg` }}
      >
        <Icon style={{ width: size * 0.46, height: size * 0.46 }} />
      </div>
    </motion.div>
  );
}

/* ───────── live clock with rolling digits ───────── */

function subscribe(cb: () => void) {
  const id = setInterval(cb, 1000);
  return () => clearInterval(id);
}
const getSecond = () => Math.floor(Date.now() / 1000);
const getServerSecond = () => 0;
const pad = (n: number) => String(n).padStart(2, "0");
const dayFmt = new Intl.DateTimeFormat("ar-EG-u-nu-latn", {
  weekday: "long",
  day: "numeric",
  month: "long",
});

export function LiveClock({ className }: { className?: string }) {
  const sec = React.useSyncExternalStore(subscribe, getSecond, getServerSecond);
  const d = sec ? new Date(sec * 1000) : null;
  const time = d ? `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}` : "--:--:--";

  return (
    <div className={cn("glass inline-flex items-center gap-3 rounded-2xl px-4 py-2.5", className)}>
      <span className="relative flex size-2.5">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-brand-1 opacity-60" />
        <span className="relative inline-flex size-2.5 rounded-full bg-brand-1" />
      </span>
      <span className="text-xs text-muted-foreground">الآن</span>
      <span dir="ltr" className="inline-flex font-mono text-lg font-bold tabular-nums">
        {time.split("").map((ch, i) => (
          <RollingChar key={i} ch={ch} />
        ))}
      </span>
      {d && <span className="hidden text-xs text-muted-foreground sm:inline">{dayFmt.format(d)}</span>}
    </div>
  );
}

function RollingChar({ ch }: { ch: string }) {
  if (ch === ":") return <span className="px-px text-muted-foreground">:</span>;
  return (
    <span className="relative inline-block h-[1.4em] w-[0.62em] overflow-hidden text-center">
      <AnimatePresence initial={false}>
        <motion.span
          key={ch}
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: "0%", opacity: 1 }}
          exit={{ y: "-100%", opacity: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0 leading-[1.4em]"
        >
          {ch}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

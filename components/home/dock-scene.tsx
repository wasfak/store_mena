"use client";

import * as React from "react";
import { useAnimate } from "motion/react";

// Looping mini-movie: a truck drives up to the warehouse, the roller door
// lifts, parcels slide inside, the door drops and the truck backs out. One
// small inline SVG driven by a motion timeline — no images, no libraries.
export function DockScene({ className }: { className?: string }) {
  const [scope, animate] = useAnimate<SVGSVGElement>();

  React.useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let alive = true;
    const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

    (async () => {
      await wait(900);
      while (alive && scope.current) {
        await animate("#truck", { x: [-190, 0] }, { duration: 2.1, ease: [0.22, 1, 0.36, 1] });
        if (!alive) break;
        await animate("#beacon", { opacity: [0, 1, 0.2, 1] }, { duration: 0.6 });
        await animate("#door", { scaleY: 0.08 }, { duration: 0.7, ease: "easeInOut" });
        for (const id of ["#p1", "#p2", "#p3"]) {
          if (!alive) break;
          await animate(id, { x: [0, 92], y: [0, -6, 0], opacity: [1, 1, 0] }, { duration: 0.55, ease: "easeInOut" });
        }
        if (!alive) break;
        animate("#count", { scale: [1, 1.35, 1] }, { duration: 0.5 });
        await animate("#door", { scaleY: 1 }, { duration: 0.7, ease: "easeInOut" });
        animate("#beacon", { opacity: 0 }, { duration: 0.3 });
        await animate("#truck", { x: -190 }, { duration: 1.7, ease: [0.55, 0, 0.75, 0.2] });
        await animate(["#p1", "#p2", "#p3"].join(","), { x: 0, y: 0, opacity: 1 }, { duration: 0 });
        await wait(500);
      }
    })();

    return () => {
      alive = false;
    };
  }, [animate, scope]);

  return (
    <svg
      ref={scope}
      viewBox="0 0 420 170"
      className={className}
      role="img"
      aria-label="شاحنة تصل إلى المخزن"
    >
      <defs>
        <linearGradient id="dock-brand" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" style={{ stopColor: "var(--brand-1)" }} />
          <stop offset="55%" style={{ stopColor: "var(--brand-2)" }} />
          <stop offset="100%" style={{ stopColor: "var(--brand-3)" }} />
        </linearGradient>
        <linearGradient id="dock-glass" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.16" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.04" />
        </linearGradient>
      </defs>

      {/* road */}
      <line x1="0" y1="150" x2="420" y2="150" stroke="currentColor" strokeOpacity="0.25" strokeWidth="1.5" />
      <line
        x1="0"
        y1="160"
        x2="420"
        y2="160"
        stroke="currentColor"
        strokeOpacity="0.18"
        strokeWidth="2"
        strokeDasharray="14 12"
      />

      {/* warehouse */}
      <g>
        <polygon points="262,52 340,22 418,52" fill="url(#dock-brand)" opacity="0.9" />
        <rect x="266" y="52" width="148" height="98" rx="4" fill="url(#dock-glass)" stroke="currentColor" strokeOpacity="0.3" />
        <rect x="300" y="32" width="80" height="16" rx="8" fill="url(#dock-brand)" />
        <text x="340" y="44" textAnchor="middle" fontSize="10" fontWeight="800" fill="white" fontFamily="var(--font-alexandria)">
          مخزن
        </text>
        {/* doorway (dark interior) */}
        <rect x="286" y="78" width="78" height="72" rx="3" fill="currentColor" fillOpacity="0.12" />
        {/* inside stack + counter */}
        <g opacity="0.85">
          <rect x="374" y="128" width="16" height="16" rx="2" fill="url(#dock-brand)" />
          <rect x="392" y="128" width="16" height="16" rx="2" fill="url(#dock-brand)" opacity="0.8" />
          <rect x="383" y="110" width="16" height="16" rx="2" fill="url(#dock-brand)" opacity="0.65" />
        </g>
        <g id="count" style={{ transformBox: "fill-box", transformOrigin: "center" }}>
          <circle cx="398" cy="66" r="9" fill="url(#dock-brand)" />
          <text x="398" y="70" textAnchor="middle" fontSize="10" fontWeight="700" fill="white">
            ✓
          </text>
        </g>
        {/* roller door */}
        <g id="door" style={{ transformBox: "fill-box", transformOrigin: "top" }}>
          <rect x="286" y="78" width="78" height="72" rx="3" fill="currentColor" fillOpacity="0.22" />
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <line
              key={i}
              x1="290"
              x2="360"
              y1={88 + i * 11}
              y2={88 + i * 11}
              stroke="currentColor"
              strokeOpacity="0.25"
            />
          ))}
        </g>
        {/* dock light */}
        <circle id="beacon" cx="280" cy="72" r="4" fill="var(--brand-1)" opacity="0">
          <animate attributeName="r" values="4;5.5;4" dur="1s" repeatCount="indefinite" />
        </circle>
      </g>

      {/* truck (cargo box faces the warehouse) */}
      <g id="truck" style={{ transform: "translateX(-190px)" }}>
        {/* parcels riding in the cargo box */}
        <g>
          <rect id="p1" x="226" y="104" width="18" height="18" rx="3" fill="url(#dock-brand)" />
          <rect id="p2" x="226" y="124" width="18" height="18" rx="3" fill="url(#dock-brand)" opacity="0.85" />
          <rect id="p3" x="206" y="124" width="18" height="18" rx="3" fill="url(#dock-brand)" opacity="0.7" />
        </g>
        {/* cargo box */}
        <rect
          x="160"
          y="92"
          width="104"
          height="52"
          rx="6"
          fill="url(#dock-glass)"
          stroke="currentColor"
          strokeOpacity="0.45"
          strokeWidth="1.5"
        />
        <rect x="160" y="92" width="104" height="5" rx="2" fill="url(#dock-brand)" />
        {/* cab */}
        <path
          d="M118 144 V112 Q118 104 126 104 H146 L158 118 V144 Z"
          fill="url(#dock-brand)"
        />
        <path d="M128 109 H144 L152 119 H128 Z" fill="white" fillOpacity="0.55" />
        <rect x="114" y="134" width="8" height="6" rx="2" fill="var(--brand-1)" />
        {/* wheels */}
        {[136, 186, 236].map((cx) => (
          <g key={cx}>
            <circle cx={cx} cy="146" r="9" fill="currentColor" fillOpacity="0.85" />
            <circle cx={cx} cy="146" r="3.5" fill="var(--brand-1)" />
          </g>
        ))}
      </g>
    </svg>
  );
}

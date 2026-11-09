"use client";

import { useEffect, useRef, useState } from "react";
import { Warehouse } from "lucide-react";

// Animated "WaSfY" wordmark, tuned to the site's "sunset" brand
// (amber → coral → fuchsia). A small warehouse mark ties it to the product,
// the gradient drifts, and the letters scramble into place every few seconds.

const CYCLES_PER_LETTER = 3;
const SHUFFLE_TIME = 30; // ms per scramble tick
const CHARS = "!@#$%^&*():{};|,.<>/?ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

function scrambledAt(target: string, pos: number) {
  return target
    .split("")
    .map((char, index) =>
      pos / CYCLES_PER_LETTER > index
        ? char
        : CHARS[Math.floor(Math.random() * CHARS.length)],
    )
    .join("");
}

function useScrambledText(initial: string) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [text, setText] = useState(initial);

  const stop = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
    setText(initial);
  };

  const scramble = () => {
    let pos = 0;
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setText(scrambledAt(initial, pos));
      pos++;
      if (pos >= initial.length * CYCLES_PER_LETTER) stop();
    }, SHUFFLE_TIME);
  };

  // clean up on unmount
  useEffect(() => () => stop(), []); // eslint-disable-line react-hooks/exhaustive-deps

  return { text, scramble };
}

// Brand "sunset" gradient, straight from the design tokens (--brand-1/2/3),
// so the logo always matches the rest of the UI in both light and dark.
const brandGradient =
  "linear-gradient(110deg, var(--brand-1), var(--brand-2) 50%, var(--brand-3))";

export function BrandLogo({
  text = "WaSfY",
  className,
}: {
  text?: string;
  className?: string;
}) {
  const { text: displayText, scramble } = useScrambledText(text);

  // re-scramble on mount and every 5s
  useEffect(() => {
    scramble();
    const id = setInterval(scramble, 5000);
    return () => clearInterval(id);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <span
      className={
        "group/logo relative inline-flex select-none items-center gap-2 " +
        (className ?? "")
      }
    >
      {/* warehouse mark */}
      <span
        aria-hidden="true"
        className="grid size-7 shrink-0 place-items-center rounded-xl text-white shadow-sm shadow-brand-2/30 transition-transform duration-500 group-hover/logo:rotate-6"
        style={{ backgroundImage: brandGradient, backgroundSize: "180% 100%" }}
      >
        <Warehouse className="size-4" />
      </span>

      {/* wordmark */}
      <span className="relative inline-block font-mono text-lg font-bold tracking-widest sm:text-xl">
        <span
          className="bg-clip-text text-transparent"
          style={{
            backgroundImage: brandGradient,
            backgroundSize: "200% 200%",
            animation: "brand-gradient-move 5s ease-in-out infinite",
          }}
        >
          {displayText}
        </span>

        {/* blurred glow duplicate behind it */}
        <span
          aria-hidden="true"
          className="absolute inset-0 bg-clip-text text-transparent blur-md"
          style={{
            backgroundImage: brandGradient,
            backgroundSize: "200% 200%",
            animation: "brand-glow-pulse 5s ease-in-out infinite",
          }}
        >
          {displayText}
        </span>
      </span>
    </span>
  );
}

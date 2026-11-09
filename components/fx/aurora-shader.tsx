"use client";

import { cn } from "@/lib/utils";

// Soft "aurora" glow behind the hero.
//
// This used to be a WebGL fragment shader rendered at half resolution and
// upscaled. On some GPUs/drivers that upscale produced a grey horizontal band
// (a framebuffer smear) across the hero — a hardware artifact, not a layout
// bug. It's now pure CSS: a few large, blurred, brand-coloured blobs that drift
// slowly. No WebGL, so it can't band on any machine, it costs almost nothing,
// and the colours come from the brand tokens so it follows light/dark on its own.
export function AuroraShader({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn("pointer-events-none size-full overflow-hidden", className)}
    >
      <div className="float-slow absolute -left-[6%] top-[2%] h-[440px] w-[560px] rounded-full bg-brand-1/30 blur-3xl" />
      <div className="float-med absolute right-[2%] -top-[6%] h-[400px] w-[520px] rounded-full bg-brand-2/25 blur-3xl" />
      <div className="float-fast absolute left-1/3 top-[20%] h-[380px] w-[600px] rounded-full bg-brand-3/20 blur-3xl" />
    </div>
  );
}

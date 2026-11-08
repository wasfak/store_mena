import { cn } from "@/lib/utils";

/**
 * Infinite CSS marquee: the content is rendered twice and the track slides by
 * exactly half its width, so the loop is seamless. Pure CSS, pauses on hover.
 */
export function Marquee({
  children,
  reverse = false,
  duration = 40,
  className,
}: {
  children: React.ReactNode;
  reverse?: boolean;
  duration?: number;
  className?: string;
}) {
  return (
    <div dir="ltr" className={cn("marquee mask-fade-x flex overflow-hidden", className)}>
      <div
        className="marquee-track flex w-max shrink-0"
        data-reverse={reverse}
        style={{ "--marquee-duration": `${duration}s` } as React.CSSProperties}
      >
        <div className="flex shrink-0 items-center gap-4 pe-4">{children}</div>
        <div className="flex shrink-0 items-center gap-4 pe-4" aria-hidden="true">
          {children}
        </div>
      </div>
    </div>
  );
}

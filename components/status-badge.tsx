import { Badge } from "@/components/ui/badge";
import type { BookingStatus } from "@/lib/models/booking";
import { cn } from "@/lib/utils";

const MAP: Record<BookingStatus, { label: string; className: string; dot: string; pulse?: boolean }> = {
  pending: {
    label: "بانتظار التأكيد",
    className: "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300",
    dot: "bg-amber-400",
    pulse: true,
  },
  confirmed: {
    label: "تم تأكيد الحجز",
    className: "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    dot: "bg-emerald-400",
  },
  rejected: {
    label: "مرفوض",
    className: "border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-300",
    dot: "bg-red-400",
  },
  cancelled: {
    label: "ملغي",
    className: "border-neutral-500/40 bg-neutral-500/10 text-neutral-600 dark:text-neutral-400",
    dot: "bg-neutral-400",
  },
};

export function StatusBadge({ status }: { status: BookingStatus }) {
  const s = MAP[status];
  return (
    <Badge variant="outline" className={s.className}>
      <span className="relative flex size-1.5">
        {s.pulse && (
          <span className={cn("absolute inline-flex size-full animate-ping rounded-full opacity-75", s.dot)} />
        )}
        <span className={cn("relative inline-flex size-1.5 rounded-full shadow-[0_0_6px] shadow-current", s.dot)} />
      </span>
      {s.label}
    </Badge>
  );
}

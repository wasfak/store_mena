import { Badge } from "@/components/ui/badge";
import type { BookingStatus } from "@/lib/models/booking";

const MAP: Record<BookingStatus, { label: string; className: string }> = {
  pending: {
    label: "بانتظار التأكيد",
    className:
      "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  },
  confirmed: {
    label: "مؤكد",
    className:
      "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  },
  rejected: {
    label: "مرفوض",
    className:
      "border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-300",
  },
  cancelled: {
    label: "ملغي",
    className:
      "border-neutral-500/40 bg-neutral-500/10 text-neutral-600 dark:text-neutral-400",
  },
};

export function StatusBadge({ status }: { status: BookingStatus }) {
  const s = MAP[status];
  return (
    <Badge variant="outline" className={s.className}>
      {s.label}
    </Badge>
  );
}

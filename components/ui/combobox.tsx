"use client";

import * as React from "react";
import { Popover as PopoverPrimitive } from "radix-ui";
import { ChevronDown, Check } from "lucide-react";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

// A simple type-to-filter select: a Popover with a filter box + scrollable list.
// Themed to match the app's Select. Value is the chosen option string ("" = none).
export function Combobox({
  value,
  onChange,
  options,
  placeholder = "Select…",
  filterPlaceholder = "Type to filter…",
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder?: string;
  filterPlaceholder?: string;
  className?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [q, setQ] = React.useState("");

  const filtered = React.useMemo(() => {
    const t = q.trim().toLowerCase();
    return t ? options.filter((o) => o.toLowerCase().includes(t)) : options;
  }, [q, options]);

  return (
    <PopoverPrimitive.Root
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) setQ("");
      }}
    >
      <PopoverPrimitive.Trigger asChild>
        <button
          type="button"
          className={cn(
            "group/cb flex h-10 w-full items-center justify-between gap-1.5 rounded-xl border border-input bg-background/50 py-2 pr-2.5 pl-3.5 text-sm outline-none transition-[border-color,box-shadow,background-color] duration-300 focus-visible:border-brand-1/70 focus-visible:ring-4 focus-visible:ring-brand-1/15 data-[state=open]:border-brand-1/70 data-[state=open]:ring-4 data-[state=open]:ring-brand-1/15 dark:bg-white/[0.04] dark:hover:bg-white/[0.07]",
            className,
          )}
        >
          <span
            dir="auto"
            className={cn("truncate", !value && "text-muted-foreground")}
          >
            {value || placeholder}
          </span>
          <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform duration-300 group-data-[state=open]/cb:rotate-180" />
        </button>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="start"
          sideOffset={4}
          className="z-50 w-(--radix-popover-trigger-width) min-w-52 rounded-2xl bg-popover p-1.5 text-popover-foreground shadow-2xl ring-1 ring-foreground/10 backdrop-blur-xl data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95"
        >
          <Input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={filterPlaceholder}
            className="mb-1.5 h-9"
            dir="auto"
          />
          <div className="max-h-60 overflow-auto">
            {filtered.length === 0 ? (
              <p className="px-2 py-4 text-center text-sm text-muted-foreground">
                لا توجد نتائج
              </p>
            ) : (
              filtered.map((o) => (
                <button
                  key={o}
                  type="button"
                  dir="auto"
                  onClick={() => {
                    onChange(o);
                    setOpen(false);
                    setQ("");
                  }}
                  className={cn(
                    "flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
                    o === value && "bg-brand-1/10 text-foreground",
                  )}
                >
                  <span className="truncate">{o}</span>
                  {o === value && <Check className="size-4 shrink-0 text-brand-1" />}
                </button>
              ))
            )}
          </div>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}

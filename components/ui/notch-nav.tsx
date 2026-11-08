"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";
import { motion } from "motion/react";
import {
  Ban,
  Building2,
  CalendarDays,
  CalendarPlus,
  ClipboardList,
  Home,
  Inbox,
  Settings,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";

import { BrandLogo } from "@/components/ui/brand-logo";
import { ThemeToggle } from "@/components/theme";
import { cn } from "@/lib/utils";

type IconName =
  | "home"
  | "book"
  | "mybookings"
  | "schedule"
  | "settings"
  | "companies"
  | "conflicts"
  | "requests";

type Item = {
  value: string;
  label: string;
  href: string;
  icon?: IconName;
};

const ICONS: Record<IconName, LucideIcon> = {
  home: Home,
  book: CalendarPlus,
  mybookings: ClipboardList,
  schedule: CalendarDays,
  settings: Settings,
  companies: Building2,
  conflicts: Ban,
  requests: Inbox,
};

// Floating glass navbar with the animated notch: the active pill and the
// notch underneath glide between items via shared-layout animation.
export function NotchNav({
  items,
  ariaLabel = "التنقل الرئيسي",
  className,
}: {
  items: Item[];
  defaultValue?: string;
  ariaLabel?: string;
  className?: string;
}) {
  const pathname = usePathname();
  const itemRefs = React.useRef<Array<HTMLAnchorElement | null>>([]);

  const active =
    items.find(
      (i) => i.href === pathname || (i.href !== "/" && pathname?.startsWith(i.href + "/")),
    )?.value ?? "";
  const activeIndex = Math.max(
    0,
    items.findIndex((i) => i.value === active),
  );

  const focusItem = (index: number) => {
    itemRefs.current[Math.max(0, Math.min(items.length - 1, index))]?.focus();
  };

  return (
    <div className="glass flex w-full items-center gap-2 rounded-full py-1.5 ps-4 pe-1.5 sm:gap-4 sm:ps-5">
      <Link href="/" className="shrink-0" aria-label="الرئيسية">
        <BrandLogo />
      </Link>

      <nav
        aria-label={ariaLabel}
        className={cn(
          "flex min-w-0 flex-1 justify-start overflow-x-auto md:justify-center [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          className,
        )}
      >
        <ul
          role="menubar"
          className="flex items-center gap-0.5 p-1"
          onKeyDown={(e) => {
            if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) return;
            e.preventDefault();
            if (e.key === "ArrowRight") focusItem(activeIndex + 1);
            if (e.key === "ArrowLeft") focusItem(activeIndex - 1);
            if (e.key === "Home") focusItem(0);
            if (e.key === "End") focusItem(items.length - 1);
          }}
        >
          {items.map((item, idx) => {
            const isActive = item.value === active;
            const Icon = item.icon ? ICONS[item.icon] : undefined;
            return (
              <li key={item.value} role="none" className="relative">
                <Link
                  ref={(el) => {
                    itemRefs.current[idx] = el;
                  }}
                  href={item.href}
                  prefetch={false}
                  role="menuitem"
                  aria-label={item.label}
                  title={item.label}
                  aria-current={isActive ? "page" : undefined}
                  tabIndex={isActive || (!active && idx === 0) ? 0 : -1}
                  className={cn(
                    "relative z-10 inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium outline-none transition-colors duration-300",
                    "focus-visible:ring-2 focus-visible:ring-ring",
                    isActive ? "text-foreground" : "text-foreground/60 hover:text-foreground",
                  )}
                >
                  {Icon && <Icon className="size-4 shrink-0" aria-hidden="true" />}
                  <span className="hidden whitespace-nowrap xl:inline">{item.label}</span>
                </Link>

                {isActive && (
                  <>
                    <motion.span
                      layoutId="notch-pill"
                      aria-hidden="true"
                      className="absolute inset-0 rounded-full bg-foreground/[0.07] ring-1 ring-foreground/10 dark:bg-white/[0.08]"
                      transition={{ type: "spring", stiffness: 420, damping: 34 }}
                    />
                    <motion.span
                      layoutId="notch-mark"
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-x-2 -bottom-[5px] h-[7px] text-brand-1"
                      transition={{ type: "spring", stiffness: 420, damping: 34 }}
                    >
                      <svg
                        width="100%"
                        height="100%"
                        viewBox="0 0 100 20"
                        preserveAspectRatio="none"
                        className="block drop-shadow-[0_0_6px_var(--brand-1)]"
                      >
                        <path
                          d="M 2 1 H 98 Q 99 1 99 2 V 10 H 88 Q 87.2 10 86.6 11.4 L 84.8 18 H 15.2 L 13.4 11.4 Q 12.8 10 12 10 H 2 Q 1 10 1 9 V 2 Q 1 1 2 1 Z"
                          fill="currentColor"
                        />
                      </svg>
                    </motion.span>
                  </>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="flex shrink-0 items-center gap-2">
        <ThemeToggle />
        <Show when="signed-out">
          <SignInButton>
            <button className="hidden h-9 rounded-full px-3 text-sm font-medium text-foreground/70 transition-colors hover:text-foreground sm:inline-flex sm:items-center">
              تسجيل الدخول
            </button>
          </SignInButton>
          <SignUpButton>
            <button className="shine bg-brand-gradient h-9 cursor-pointer rounded-full px-4 text-sm font-semibold text-white shadow-lg shadow-brand-2/30">
              دخول
            </button>
          </SignUpButton>
        </Show>
        <Show when="signed-in">
          <div className="grid size-9 place-items-center">
            <UserButton />
          </div>
        </Show>
      </div>
    </div>
  );
}

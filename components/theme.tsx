"use client";
import * as React from "react";
import { ThemeProvider as NextThemes, useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemes attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
      {children}
    </NextThemes>
  );
}

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  return (
    <button
      type="button"
      aria-label="تبديل المظهر"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className="relative grid size-9 shrink-0 place-items-center overflow-hidden rounded-full border border-border bg-background/40 text-foreground/80 outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
    >
      <Sun className="size-4 transition-all duration-500 dark:-rotate-90 dark:scale-0 dark:opacity-0" />
      <Moon className="absolute size-4 rotate-90 scale-0 opacity-0 transition-all duration-500 dark:rotate-0 dark:scale-100 dark:opacity-100" />
    </button>
  );
}

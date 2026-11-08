import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { ThemeProvider } from "@/components/theme";
import { NotchNav } from "@/components/ui/notch-nav";
import { Toaster } from "@/components/ui/sonner";

// Arabic fonts are bundled with the app (fontsource) instead of fetched from
// Google Fonts at startup, which isn't reachable on every network.
import "@fontsource-variable/alexandria/index.css";
import "@fontsource-variable/readex-pro/index.css";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { currentUserIsAdmin } from "@/lib/admins";

type NavIcon =
  | "home"
  | "book"
  | "mybookings"
  | "schedule"
  | "settings"
  | "companies"
  | "conflicts"
  | "requests";

const navItems: Array<{
  value: string;
  label: string;
  href: string;
  icon: NavIcon;
  adminOnly?: boolean;
}> = [
  { value: "home", label: "احجز ميعاد", href: "/", icon: "book" },
  {
    value: "mybookings",
    label: "حجوزاتي",
    href: "/my-bookings",
    icon: "mybookings",
  },
  {
    value: "requests",
    label: "طلبات الحجز",
    href: "/admin/booking-requests",
    icon: "requests",
    adminOnly: true,
  },
  {
    value: "schedule",
    label: "جدول العمل اليومى للمخزن",
    href: "/schedule",
    icon: "schedule",
    adminOnly: true,
  },
  {
    value: "settings",
    label: "الإعدادات",
    href: "/admin/settings",
    icon: "settings",
    adminOnly: true,
  },
  {
    value: "companies",
    label: "الشركات",
    href: "/admin/companies",
    icon: "companies",
    adminOnly: true,
  },
  {
    value: "conflicts",
    label: "التعارضات",
    href: "/admin/conflicts",
    icon: "conflicts",
    adminOnly: true,
  },
];

export const metadata: Metadata = {
  title: "مواعيد المخزن",
  description: "حجز وتنظيم مواعيد تنزيل بضاعة الشركات في المخزن",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const admin = await currentUserIsAdmin();
  const items = navItems.filter((n) => admin || !n.adminOnly);
  return (
    <html
      lang="ar"
      dir="ltr"
      suppressHydrationWarning
      className={`${GeistSans.variable} ${GeistMono.variable} h-full antialiased`}
    >
      <body
        suppressHydrationWarning
        className="min-h-full flex flex-col bg-background text-foreground"
      >
        <ClerkProvider>
          <ThemeProvider>
            {/* ambient backdrop: warm glows + fading grid + film grain */}
            <div
              aria-hidden="true"
              className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
            >
              <div className="absolute -top-40 -left-32 h-[560px] w-[760px] rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklch,var(--brand-1)_22%,transparent),transparent)]" />
              <div className="absolute -top-24 -right-40 h-[520px] w-[720px] rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklch,var(--brand-3)_18%,transparent),transparent)]" />
              <div className="absolute bottom-[-20%] left-1/3 h-[480px] w-[680px] rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklch,var(--brand-2)_10%,transparent),transparent)]" />
              <div className="bg-grid absolute inset-0" />
            </div>
            <div className="grain-overlay" aria-hidden="true" />

            <header className="sticky top-3 z-50 mt-3 px-3 sm:top-4 sm:mt-4 sm:px-6">
              <div className="mx-auto w-full max-w-7xl">
                <NotchNav
                  items={items}
                  defaultValue="home"
                  ariaLabel="التنقل الرئيسي"
                />
              </div>
            </header>
            <main className="flex-1 mx-auto w-full max-w-7xl px-4 pb-16 pt-10 sm:px-6 sm:pt-14">
              {children}
            </main>
            <footer className="mx-auto w-full max-w-7xl border-t border-border px-4 py-6 text-center text-xs text-muted-foreground sm:px-6">
              مواعيد المخزن — نظام حجز مواعيد تنزيل البضاعة
            </footer>
            <Toaster position="top-right" richColors />
          </ThemeProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}

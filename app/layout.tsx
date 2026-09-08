import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { ThemeProvider } from "@/components/theme";
import { NotchNav } from "@/components/ui/notch-nav";
import { Toaster } from "@/components/ui/sonner";

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
            <header className="border-b border-border bg-card/90 backdrop-blur">
              <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
                <NotchNav
                  items={items}
                  defaultValue="home"
                  ariaLabel="التنقل الرئيسي"
                />
              </div>
            </header>
            <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
              {children}
            </main>
            <Toaster position="top-right" richColors />
          </ThemeProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}

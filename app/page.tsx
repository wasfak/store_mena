import Link from "next/link";
import { CalendarPlus, ClipboardList, CalendarDays, Settings } from "lucide-react";
import { Show } from "@clerk/nextjs";
import { SignInButton } from "@clerk/nextjs";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { currentUserIsAdmin } from "@/lib/admins";

export const dynamic = "force-dynamic";

export default async function Home() {
  const admin = await currentUserIsAdmin();

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h1 className="text-3xl font-bold tracking-tight">مواعيد المخزن</h1>
        <p className="max-w-2xl text-muted-foreground">
          نظام حجز مواعيد تنزيل بضاعة الشركات في المخزن. تحجز كل شركة ميعاداً
          متاحاً، ويؤكده المخزن، فيظهر الميعاد محجوزاً لباقي الشركات — مع منع
          الشركات المتعارضة من الحضور في نفس اليوم، وجدول عمل يومي واضح للمتابعة.
        </p>
        <Show when="signed-out">
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="mb-3 text-sm text-muted-foreground">
              سجّل الدخول أولاً لتتمكن من حجز المواعيد ومتابعة الجدول.
            </p>
            <SignInButton>
              <Button>تسجيل الدخول</Button>
            </SignInButton>
          </div>
        </Show>
      </section>

      <Show when="signed-in">
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <HomeCard
            href="/book"
            title="احجز ميعاد"
            desc="اختر يوماً وميعاداً متاحاً لتنزيل بضاعتك."
            icon={<CalendarPlus className="h-6 w-6" />}
          />
          <HomeCard
            href="/my-bookings"
            title="حجوزاتي"
            desc="تابع حالة حجوزاتك وألغِ ما تريد."
            icon={<ClipboardList className="h-6 w-6" />}
          />
          <HomeCard
            href="/schedule"
            title="جدول اليوم"
            desc="جدول عمل المخزن اليومي حسب الحجوزات."
            icon={<CalendarDays className="h-6 w-6" />}
          />
          {admin && (
            <HomeCard
              href="/admin/settings"
              title="إعدادات المخزن"
              desc="ساعات العمل، الأيام، مدة الخانة، والتعارضات."
              icon={<Settings className="h-6 w-6" />}
            />
          )}
        </section>
      </Show>
    </div>
  );
}

function HomeCard({
  href,
  title,
  desc,
  icon,
}: {
  href: string;
  title: string;
  desc: string;
  icon: React.ReactNode;
}) {
  return (
    <Link href={href} className="block">
      <Card className="h-full transition-colors hover:border-primary/50 hover:bg-accent/40">
        <CardHeader>
          <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
            {icon}
          </div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{desc}</CardDescription>
        </CardHeader>
        <CardContent />
      </Card>
    </Link>
  );
}

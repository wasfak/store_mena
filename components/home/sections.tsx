"use client";

import * as React from "react";
import {
  animate,
  motion,
  useInView,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "motion/react";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  CalendarDays,
  PhoneOff,
  Timer,
  UserRound,
  Workflow,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Magnetic } from "@/components/fx/magnetic";
import { Marquee } from "@/components/fx/marquee";
import { SpotlightCard } from "@/components/fx/spotlight-card";
import { WordsReveal } from "@/components/fx/words-reveal";

const EASE = [0.22, 1, 0.36, 1] as const;

function SectionTitle({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <motion.span
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, ease: EASE }}
        className="inline-flex items-center gap-2 rounded-full border border-border bg-background/50 px-3.5 py-1 text-xs font-medium text-muted-foreground"
      >
        <span className="bg-brand-gradient size-1.5 rounded-full" />
        {eyebrow}
      </motion.span>
      <h2 className="font-display mt-4 text-[clamp(1.8rem,4vw,3rem)] font-bold leading-[1.3]">
        <WordsReveal text={title} inView stagger={0.06} />
      </h2>
      {subtitle && (
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: EASE, delay: 0.2 }}
          className="mt-3 leading-8 text-muted-foreground"
        >
          {subtitle}
        </motion.p>
      )}
    </div>
  );
}

/* ───────── companies marquee ───────── */

export function CompaniesMarquee({ names }: { names: string[] }) {
  if (names.length < 3) return null;
  // Repeat short lists so the strip is always wider than the screen.
  const items = Array.from(
    { length: Math.max(1, Math.ceil(12 / names.length)) },
    () => names,
  ).flat();
  const half = Math.ceil(items.length / 2);
  return (
    <section aria-label="الشركات" className="relative">
      <p className="mb-5 text-center text-sm text-muted-foreground">
        شركات تنزّل بضاعتها في مخزننا
      </p>
      <div className="space-y-3">
        <Marquee duration={Math.max(30, items.length * 3)}>
          {items.slice(0, half).map((n, i) => (
            <CompanyChip key={i} name={n} />
          ))}
        </Marquee>
        <Marquee duration={Math.max(34, items.length * 3.4)} reverse>
          {items
            .slice(half)
            .concat(items.slice(0, half))
            .slice(0, half)
            .map((n, i) => (
              <CompanyChip key={i} name={n} />
            ))}
        </Marquee>
      </div>
    </section>
  );
}

function CompanyChip({ name }: { name: string }) {
  return (
    <span className="inline-flex items-center gap-2.5 whitespace-nowrap rounded-full border border-border bg-card/50 py-1.5 ps-1.5 pe-4 text-sm font-medium shadow-sm">
      <span className="bg-brand-gradient grid size-7 place-items-center rounded-full font-display text-xs font-bold text-white">
        {name.trim().charAt(0)}
      </span>
      <span dir="auto">{name}</span>
    </span>
  );
}

/* ───────── animated counters ───────── */

export function StatsStrip({ companies }: { companies: number }) {
  const stats: Array<{
    icon: LucideIcon;
    value?: number;
    from?: number;
    text?: string;
    label: string;
  }> = [
    { icon: Building2, value: companies, label: "شركة مسجلة" },
    { icon: Workflow, value: 4, label: "خطوات فقط للحجز" },
    { icon: PhoneOff, value: 0, from: 30, label: "مكالمات مطلوبة" },
    { icon: Timer, text: "24/7", label: "الحجز متاح أونلاين" },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {stats.map((s, i) => (
        <motion.div
          key={s.label}
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10% 0px" }}
          transition={{ duration: 0.7, ease: EASE, delay: i * 0.08 }}
        >
          <SpotlightCard className="h-full p-5 sm:p-6">
            <s.icon className="size-5 text-brand-1" />
            <p className="font-display mt-4 text-4xl font-bold sm:text-5xl">
              <span className="text-gradient font-mono">
                {s.text ?? <Counter to={s.value ?? 0} from={s.from ?? 0} />}
              </span>
            </p>
            <p className="mt-1 text-sm text-muted-foreground">{s.label}</p>
          </SpotlightCard>
        </motion.div>
      ))}
    </div>
  );
}

function Counter({ to, from = 0 }: { to: number; from?: number }) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });
  const n = useMotionValue(from);
  const text = useTransform(n, (v) => Math.round(v).toString());
  React.useEffect(() => {
    if (!inView) return;
    const c = animate(n, to, { duration: 1.8, ease: [0.16, 1, 0.3, 1] });
    return () => c.stop();
  }, [inView, n, to]);
  return <motion.span ref={ref}>{text}</motion.span>;
}

/* ───────── how it works (beam draws as you scroll) ───────── */

const STEPS: Array<{ icon: LucideIcon; title: string; body: string }> = [
  {
    icon: Building2,
    title: "اختر شركتك",
    body: "ابحث عن شركتك في القائمة — المدة تُحسب تلقائياً حسب حجم الشركة.",
  },
  {
    icon: UserRound,
    title: "اكتب بياناتك",
    body: "اسمك ورقم هاتفك وتفاصيل الحمولة، عشان نجهّز لك المكان.",
  },
  {
    icon: CalendarDays,
    title: "اختر اليوم والميعاد",
    body: "تظهر لك الأيام والخانات المتاحة فقط — بدون تعارض مع أي شركة.",
  },
  {
    icon: BadgeCheck,
    title: "تأكيد المخزن",
    body: "الإدارة تراجع الطلب وتؤكده، وتتابع حالته من صفحة «حجوزاتي».",
  },
];

export function HowItWorks() {
  const ref = React.useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 80%", "end 55%"],
  });
  const progress = useSpring(scrollYProgress, { stiffness: 110, damping: 28 });

  return (
    <section>
      <SectionTitle
        eyebrow="إزاي بيشتغل"
        title="من الطلب لتسليم في أربع خطوات"
        subtitle="نظام واحد بيرتّب مواعيد كل الشركات — من غير زحمة على باب المخزن."
      />
      <div ref={ref} className="relative mt-14">
        <div
          aria-hidden="true"
          className="absolute inset-x-[12.5%] top-[36px] hidden h-px bg-border lg:block"
        >
          <motion.div
            style={{ scaleX: progress }}
            className="bg-brand-gradient h-full origin-left shadow-[0_0_12px] shadow-brand-2/60"
          />
        </div>
        <ol className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <Step key={s.title} {...s} index={i} progress={progress} />
          ))}
        </ol>
      </div>
    </section>
  );
}

function Step({
  icon: Icon,
  title,
  body,
  index,
  progress,
}: (typeof STEPS)[number] & { index: number; progress: MotionValue<number> }) {
  const at = index / (STEPS.length - 1);
  const lit = useTransform(progress, [Math.max(0, at - 0.15), at], [0, 1]);
  const scale = useTransform(lit, [0, 1], [0.9, 1]);
  return (
    <motion.li
      initial={{ opacity: 0, y: 36 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-12% 0px" }}
      transition={{ duration: 0.8, ease: EASE, delay: index * 0.1 }}
      className="flex flex-col items-center text-center"
    >
      <motion.div style={{ scale }} className="relative z-10">
        <div className="glass grid size-[72px] place-items-center rounded-full">
          <Icon className="size-6" />
        </div>
        <motion.div
          aria-hidden="true"
          style={{ opacity: lit }}
          className="bg-brand-gradient absolute inset-0 -z-10 rounded-full blur-xl"
        />
        <motion.div
          aria-hidden="true"
          style={{ opacity: lit }}
          className="absolute inset-0 rounded-full ring-2 ring-brand-1/70"
        />
        <span className="bg-brand-gradient absolute -right-1 -top-1 grid size-6 place-items-center rounded-full font-mono text-[11px] font-bold text-white shadow-lg">
          {index + 1}
        </span>
      </motion.div>
      <SpotlightCard className="mt-6 h-full w-full p-5">
        <h3 className="font-display text-lg font-semibold">{title}</h3>
        <p className="mt-2 text-sm leading-7 text-muted-foreground">{body}</p>
      </SpotlightCard>
    </motion.li>
  );
}

/* ───────── closing CTA ───────── */

export function FinalCta({ onBook }: { onBook: () => void }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 30, scale: 0.98 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-10% 0px" }}
      transition={{ duration: 0.9, ease: EASE }}
      className="border-beam relative overflow-hidden rounded-[40px] border border-border bg-card/40 px-6 py-16 text-center sm:px-12 sm:py-20"
    >
      <div aria-hidden="true" className="absolute inset-0 -z-10">
        <div className="absolute -top-24 left-1/4 size-80 rounded-full bg-brand-1/25 blur-3xl" />
        <div className="absolute -bottom-24 right-1/4 size-80 rounded-full bg-brand-3/25 blur-3xl" />
        <div className="bg-grid absolute inset-0" />
      </div>
      <h2 className="font-display text-[clamp(1.9rem,4.6vw,3.6rem)] font-bold leading-[1.3]">
        <WordsReveal text="جاهز تحجز ميعادك؟" inView />
      </h2>
      <p className="mx-auto mt-3 max-w-md leading-8 text-muted-foreground">
        دقيقة واحدة، وميعادك محجوز في المخزن.
      </p>
      <div className="mt-9 flex justify-center">
        <Magnetic>
          <button
            type="button"
            onClick={onBook}
            className="shine group inline-flex h-14 items-center gap-2 rounded-full bg-foreground px-8 text-base font-semibold text-background shadow-2xl transition-transform active:scale-95"
          >
            احجز الآن
            <ArrowRight className="size-5 transition-transform duration-300 group-hover:translate-x-1" />
          </button>
        </Magnetic>
      </div>
    </motion.section>
  );
}

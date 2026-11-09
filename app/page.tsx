"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";
import {
  ArrowRight,
  Boxes,
  Building2,
  CalendarCheck,
  CalendarDays,
  Check,
  CircleAlert,
  Clock,
  Phone,
  Plus,
  Tag,
  Truck,
  UserRound,
  Warehouse,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Combobox } from "@/components/ui/combobox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MonthCalendar } from "@/components/ui/month-calendar";
import { SlotPicker } from "@/components/slot-picker";
import { Loading } from "@/components/page-header";
import { AuroraShader } from "@/components/fx/aurora-shader";
import { RotatingWords } from "@/components/fx/rotating-words";
import { WordsReveal } from "@/components/fx/words-reveal";
import { fireConfetti } from "@/components/fx/confetti";
import { DockScene } from "@/components/home/dock-scene";
import { FloatingParcels, LiveClock } from "@/components/home/hero-extras";
import { FinalCta, HowItWorks } from "@/components/home/sections";
import { cn } from "@/lib/utils";
import { getJSON, sendJSON } from "@/lib/api";

interface CompanyOpt {
  id: string;
  name: string;
}
interface DayOpt {
  date: string;
  label: string;
}
interface SlotOpt {
  start: number;
  label: string;
}
interface BookedSummary {
  company: string;
  person: string;
  dateLabel: string;
  slotLabel: string;
}

const EASE = [0.22, 1, 0.36, 1] as const;

// نوع السيارة — fixed options the person picks from when booking.
const VEHICLE_TYPES = ["تريله", "1/2 نقل", "1/4 نقل", "فان", "اخري"] as const;

export default function Home() {
  const [companies, setCompanies] = useState<CompanyOpt[]>([]);
  const [days, setDays] = useState<DayOpt[]>([]);
  const [daysLoading, setDaysLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  const [companyName, setCompanyName] = useState("");
  const [personName, setPersonName] = useState("");
  const [personPhone, setPersonPhone] = useState("");
  const [cargo, setCargo] = useState("");
  const [brand, setBrand] = useState("");
  const [boxes, setBoxes] = useState("");
  const [date, setDate] = useState("");

  const [slots, setSlots] = useState<SlotOpt[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotStart, setSlotStart] = useState<number | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [booked, setBooked] = useState<BookedSummary | null>(null);
  const submitRef = useRef<HTMLButtonElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const scrollToBooking = () =>
    cardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  const companyNames = useMemo(() => companies.map((c) => c.name), [companies]);
  const companyId = useMemo(
    () => companies.find((c) => c.name === companyName)?.id ?? "",
    [companies, companyName],
  );
  const availableDates = useMemo(() => days.map((d) => d.date), [days]);

  const loadCompanies = useCallback(async () => {
    // `loading` starts true, so no synchronous setState here — the only updates
    // happen after the await, which keeps this safe to call from a mount effect.
    try {
      setCompanies(await getJSON<CompanyOpt[]>("/api/public/companies"));
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadDays = useCallback(async (cid: string) => {
    if (!cid) {
      setDays([]);
      return;
    }
    setDaysLoading(true);
    try {
      setDays(
        await getJSON<DayOpt[]>(`/api/public/available-days?companyId=${cid}`),
      );
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setDaysLoading(false);
    }
  }, []);

  // Fetch the free slots for a chosen day. Called from the calendar's onSelect
  // (an event handler), not an effect — so no setState runs synchronously
  // inside an effect body (which React 19 warns about).
  const loadSlots = useCallback(async (d: string, cid: string) => {
    if (!d || !cid) {
      setSlots([]);
      setSlotStart(null);
      return;
    }
    setSlotsLoading(true);
    setSlotStart(null);
    try {
      setSlots(
        await getJSON<SlotOpt[]>(
          `/api/public/available-slots?date=${d}&companyId=${cid}`,
        ),
      );
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSlotsLoading(false);
    }
  }, []);

  // Changing the company resets the day/slot picks and (re)loads that company's
  // available days. Driven by the company picker's onChange, not an effect.
  const changeCompany = useCallback(
    (name: string) => {
      setCompanyName(name);
      setDate("");
      setSlots([]);
      setSlotStart(null);
      const cid = companies.find((c) => c.name === name)?.id ?? "";
      loadDays(cid);
    },
    [companies, loadDays],
  );

  useEffect(() => {
    loadCompanies();
  }, [loadCompanies]);

  const phoneValid = /^\d{11}$/.test(personPhone);
  // Every field above the calendar must be filled before we reveal the dates.
  const infoComplete =
    !!companyId &&
    !!personName.trim() &&
    phoneValid &&
    !!cargo.trim() &&
    !!brand.trim() &&
    !!boxes;
  const canSubmit = infoComplete && !!date && slotStart !== null;

  const steps: Array<{
    label: string;
    hint: string;
    done: boolean;
    icon: LucideIcon;
  }> = [
    {
      label: "اختر شركتك",
      hint: "من قائمة الشركات المسجلة",
      done: !!companyId,
      icon: Building2,
    },
    {
      label: "بياناتك",
      hint: "الاسم ورقم الهاتف",
      done: !!personName.trim() && phoneValid,
      icon: UserRound,
    },
    {
      label: "اختر اليوم",
      hint: "الأيام المتاحة فقط",
      done: !!date,
      icon: CalendarDays,
    },
    {
      label: "اختر الميعاد",
      hint: "واحجز على طول",
      done: slotStart !== null,
      icon: Clock,
    },
  ];
  const doneCount = steps.filter((s) => s.done).length;

  async function submit() {
    if (!canSubmit) {
      toast.error("من فضلك أكمل كل الحقول.");
      return;
    }
    setSubmitting(true);
    try {
      await sendJSON("/api/public/book", "POST", {
        companyId,
        personName: personName.trim(),
        personPhone: personPhone.trim(),
        load: cargo.trim(),
        brand: brand.trim(),
        boxes: boxes ? Number(boxes) : undefined,
        date,
        slotStart,
      });
      toast.success("تم إرسال طلب الحجز بنجاح.");
      const rect = submitRef.current?.getBoundingClientRect();
      setBooked({
        company: companyName,
        person: personName.trim(),
        dateLabel: days.find((d) => d.date === date)?.label ?? date,
        slotLabel: slots.find((s) => s.start === slotStart)?.label ?? "",
      });
      fireConfetti(
        rect ? { x: rect.left + rect.width / 2, y: rect.top } : undefined,
      );
      // Reset the whole form for the next booking.
      setCompanyName("");
      setPersonName("");
      setPersonPhone("");
      setCargo("");
      setBrand("");
      setBoxes("");
      setDate("");
      setSlots([]);
      setSlotStart(null);
      setDays([]);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative">
      {/* aurora behind the hero, full-bleed */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-[-10rem] -z-10 h-[820px] w-screen -translate-x-1/2 overflow-hidden"
      >
        <AuroraShader className="absolute inset-0" />
        <FloatingParcels className="hidden md:block" />
        <div className="absolute inset-x-0 bottom-0 h-72 bg-gradient-to-b from-transparent to-background" />
      </div>

      <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,540px)] lg:grid-rows-[auto_1fr] lg:gap-x-14 lg:gap-y-10">
        {/* ── hero copy ── */}
        <div className="pt-2 lg:col-start-1 lg:row-start-1">
          <motion.span
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EASE }}
            className="glass inline-flex items-center gap-2.5 rounded-full py-1.5 ps-1.5 pe-4 text-xs font-medium sm:text-sm"
          >
            <span className="bg-brand-gradient grid size-6 place-items-center rounded-full text-white">
              <Warehouse className="size-3.5" />
            </span>
            نظام مواعيد المخزن
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-emerald-400" />
            </span>
          </motion.span>

          <h1 className="font-display mt-6 text-[clamp(2.4rem,5.4vw,4.4rem)] font-bold leading-[1.25]">
            <WordsReveal text="احجز ميعاد" delay={0.1} />
            <br />
            <span className="[perspective:600px]">
              <RotatingWords
                words={[
                  "تسليم بضاعتك",
                  "في ثواني",
                  "بدون انتظار",
                  "بدون مكالمات",
                ]}
              />
            </span>
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: EASE, delay: 0.45 }}
            className="mt-5 max-w-xl text-base leading-8 text-muted-foreground sm:text-lg"
          >
            اختر شركتك واليوم المناسب، وخذ ميعادك في المخزن فورًا — بدون مكالمات
            ولا انتظار على الباب.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EASE, delay: 0.55 }}
            className="mt-6"
          >
            <LiveClock />
          </motion.div>
        </div>

        {/* ── booking card ── */}
        <motion.div
          ref={cardRef}
          id="booking"
          initial={{ opacity: 0, y: 30, scale: 0.97, filter: "blur(14px)" }}
          animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
          transition={{ duration: 1, ease: EASE, delay: 0.3 }}
          onPointerMove={(e) => {
            const el = cardRef.current;
            if (!el) return;
            const r = el.getBoundingClientRect();
            el.style.setProperty("--mx", `${e.clientX - r.left}px`);
            el.style.setProperty("--my", `${e.clientY - r.top}px`);
          }}
          className="group/card glass border-beam scroll-mt-28 rounded-[32px] p-5 sm:p-7 lg:col-start-2 lg:row-span-2 lg:row-start-1"
        >
          {/* cursor spotlight */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -z-10 rounded-[inherit] opacity-0 transition-opacity duration-500 group-hover/card:opacity-100"
            style={{
              background:
                "radial-gradient(520px circle at var(--mx, 50%) var(--my, 30%), color-mix(in oklch, var(--brand-1) 12%, transparent), transparent 60%)",
            }}
          />
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-2xl bg-brand-1/12 text-brand-1">
              <CalendarCheck className="size-5" />
            </span>
            <div className="flex-1">
              <h2 className="font-display text-lg font-semibold">
                بيانات الحجز
              </h2>
              <p className="text-xs text-muted-foreground">كل الحقول مطلوبة.</p>
            </div>
            {!booked && (
              <div
                className="flex items-center gap-1.5"
                aria-label={`${doneCount} من ${steps.length}`}
              >
                {steps.map((s) => (
                  <span
                    key={s.label}
                    className={cn(
                      "h-1.5 rounded-full transition-all duration-500",
                      s.done
                        ? "bg-brand-gradient w-5"
                        : "w-1.5 bg-foreground/15",
                    )}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="mt-6">
            <AnimatePresence mode="wait" initial={false}>
              {booked ? (
                <BookedView
                  key="booked"
                  summary={booked}
                  onAgain={() => setBooked(null)}
                />
              ) : loading ? (
                <motion.div key="loading" exit={{ opacity: 0 }}>
                  <Loading />
                </motion.div>
              ) : (
                <motion.div
                  key="form"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12, filter: "blur(8px)" }}
                  transition={{ duration: 0.45, ease: EASE }}
                  className="space-y-5"
                >
                  <Field label="الشركة" icon={Building2}>
                    <Combobox
                      value={companyName}
                      onChange={changeCompany}
                      options={companyNames}
                      placeholder="اختر الشركة"
                      filterPlaceholder="ابحث عن الشركة…"
                    />
                  </Field>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <Field label="الاسم" icon={UserRound}>
                      <Input
                        dir="auto"
                        value={personName}
                        onChange={(e) => setPersonName(e.target.value)}
                        placeholder="أدخل اسمك"
                      />
                    </Field>

                    <Field label="رقم الهاتف" icon={Phone}>
                      <Input
                        dir="auto"
                        inputMode="numeric"
                        value={personPhone}
                        onChange={(e) =>
                          setPersonPhone(
                            e.target.value.replace(/\D/g, "").slice(0, 11),
                          )
                        }
                        placeholder="01xxxxxxxxx"
                        aria-invalid={personPhone.length > 0 && !phoneValid}
                        className="font-mono"
                      />
                      <AnimatePresence initial={false}>
                        {personPhone.length > 0 && !phoneValid && (
                          <motion.p
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="flex items-center gap-1.5 overflow-hidden text-xs text-red-600 dark:text-red-400"
                          >
                            <CircleAlert className="size-3.5 shrink-0" />
                            رقم الهاتف يجب أن يكون 11 رقماً بالضبط.
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </Field>
                  </div>

                  <Field label="نوع السيارة" icon={Truck}>
                    <Select value={cargo} onValueChange={setCargo}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="اختر نوع السيارة" />
                      </SelectTrigger>
                      <SelectContent>
                        {VEHICLE_TYPES.map((t) => (
                          <SelectItem key={t} value={t}>
                            {t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <Field label="الشركات المراد تسليمها" icon={Tag}>
                      <Input
                        dir="auto"
                        value={brand}
                        onChange={(e) => setBrand(e.target.value)}
                        placeholder="اكتب أسماء الشركات"
                      />
                    </Field>

                    <Field label="عدد الصناديق" icon={Boxes}>
                      <Input
                        dir="auto"
                        inputMode="numeric"
                        value={boxes}
                        onChange={(e) =>
                          setBoxes(e.target.value.replace(/\D/g, "").slice(0, 5))
                        }
                        placeholder="مثال: 12"
                        className="font-mono"
                      />
                    </Field>
                  </div>

                  <Field label="الميعاد المتاح" icon={CalendarDays}>
                    {!infoComplete ? (
                      <Hint>
                        أكمل كل البيانات بالأعلى أولاً (الشركة، الاسم، رقم
                        الهاتف، نوع السيارة، الشركات المراد تسليمها، وعدد
                        الصناديق) لعرض المواعيد المتاحة.
                      </Hint>
                    ) : daysLoading ? (
                      <Loading label="جارٍ تحميل الأيام…" />
                    ) : days.length === 0 ? (
                      <Hint>لا توجد مواعيد متاحة لهذه الشركة حالياً.</Hint>
                    ) : (
                      <div className="space-y-4">
                        <MonthCalendar
                          availableDates={availableDates}
                          value={date}
                          onSelect={(d) => {
                            setDate(d);
                            loadSlots(d, companyId);
                          }}
                        />

                        {!date ? (
                          <p className="text-sm text-muted-foreground">
                            اختر يوماً من التقويم لعرض المواعيد المتاحة.
                          </p>
                        ) : slotsLoading ? (
                          <Loading label="جارٍ تحميل المواعيد…" />
                        ) : slots.length === 0 ? (
                          <p className="text-sm text-muted-foreground">
                            لا توجد مواعيد متاحة في هذا اليوم.
                          </p>
                        ) : (
                          <SlotPicker
                            slots={slots}
                            value={slotStart}
                            onChange={setSlotStart}
                          />
                        )}
                      </div>
                    )}
                  </Field>

                  <Button
                    ref={submitRef}
                    size="lg"
                    className={cn(
                      "group h-13 w-full rounded-2xl text-base",
                      canSubmit && "shine",
                    )}
                    disabled={!canSubmit || submitting}
                    onClick={submit}
                  >
                    {submitting ? (
                      <>
                        <span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        جارٍ الحجز
                      </>
                    ) : (
                      <>
                        احجز الميعاد
                        <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" />
                      </>
                    )}
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* ── live steps + dock scene (below the form on phones) ── */}
        <div className="lg:col-start-1 lg:row-start-2">
          {/* live stepper */}
          <motion.ol
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: EASE, delay: 0.6 }}
            className="max-w-md space-y-1"
          >
            {steps.map((s, i) => {
              const isCurrent =
                !booked && !s.done && steps.slice(0, i).every((p) => p.done);
              return (
                <li
                  key={s.label}
                  className="relative flex items-center gap-4 py-2"
                >
                  {i < steps.length - 1 && (
                    <span className="absolute left-[19px] top-[46px] h-[calc(100%-36px)] w-px bg-border">
                      <motion.span
                        className="bg-brand-gradient absolute inset-x-0 top-0 h-full origin-top"
                        animate={{ scaleY: s.done ? 1 : 0 }}
                        transition={{ duration: 0.5, ease: EASE }}
                      />
                    </span>
                  )}
                  <span
                    className={cn(
                      "relative grid size-10 shrink-0 place-items-center rounded-full border transition-all duration-500",
                      s.done
                        ? "bg-brand-gradient border-transparent text-white shadow-lg shadow-brand-2/30"
                        : isCurrent
                          ? "border-brand-1/60 bg-brand-1/10 text-brand-1"
                          : "border-border bg-background/40 text-muted-foreground",
                    )}
                  >
                    {isCurrent && (
                      <span className="absolute inset-0 animate-ping rounded-full border border-brand-1/40" />
                    )}
                    <AnimatePresence mode="wait" initial={false}>
                      <motion.span
                        key={s.done ? "done" : "todo"}
                        initial={{ scale: 0.4, opacity: 0, rotate: -40 }}
                        animate={{ scale: 1, opacity: 1, rotate: 0 }}
                        exit={{ scale: 0.4, opacity: 0 }}
                        transition={{
                          type: "spring",
                          stiffness: 400,
                          damping: 20,
                        }}
                      >
                        {s.done ? (
                          <Check className="size-4" />
                        ) : (
                          <s.icon className="size-4" />
                        )}
                      </motion.span>
                    </AnimatePresence>
                  </span>
                  <div>
                    <p
                      className={cn(
                        "text-sm font-semibold transition-colors",
                        s.done || isCurrent
                          ? "text-foreground"
                          : "text-muted-foreground",
                      )}
                    >
                      {s.label}
                    </p>
                    <p className="text-xs text-muted-foreground">{s.hint}</p>
                  </div>
                </li>
              );
            })}
          </motion.ol>

          {/* the dock: a looping truck-to-warehouse scene */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.85, duration: 0.8, ease: EASE }}
            className="mt-8 max-w-md"
          >
            <div className="glass overflow-hidden rounded-3xl px-3 pt-3">
              <DockScene className="block w-full text-foreground" />
            </div>
            <Link
              href="/my-bookings"
              className="group mt-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              عندك حجز بالفعل؟ تابع حجوزاتك
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </motion.div>
        </div>
      </div>

      <div className="mt-28 space-y-28 sm:mt-36 sm:space-y-36">
        <HowItWorks />
        <FinalCta onBook={scrollToBooking} />
      </div>
    </div>
  );
}

function Field({
  label,
  icon: Icon,
  children,
}: {
  label: string;
  icon: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label className="flex items-center gap-2 text-sm font-medium">
        <Icon className="size-3.5 text-brand-1" />
        {label}
      </label>
      {children}
    </div>
  );
}

function Hint({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-2xl border border-dashed border-border bg-background/30 px-4 py-4 text-sm text-muted-foreground">
      {children}
    </p>
  );
}

function BookedView({
  summary,
  onAgain,
}: {
  summary: BookedSummary;
  onAgain: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, filter: "blur(10px)" }}
      animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
      exit={{ opacity: 0, scale: 0.96, filter: "blur(10px)" }}
      transition={{ duration: 0.6, ease: EASE }}
      className="py-4 text-center"
    >
      <div className="relative mx-auto size-24">
        <motion.div
          aria-hidden="true"
          className="absolute inset-0 rounded-full bg-emerald-400/20"
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{ scale: [0.4, 1.35, 1], opacity: [0, 0.8, 0.5] }}
          transition={{ duration: 1.1, ease: EASE }}
        />
        <svg
          viewBox="0 0 100 100"
          className="relative size-full"
          aria-hidden="true"
        >
          <motion.circle
            cx="50"
            cy="50"
            r="44"
            fill="none"
            strokeWidth="4"
            strokeLinecap="round"
            className="stroke-emerald-400"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.8, ease: EASE }}
          />
          <motion.path
            d="M31 52 L44 65 L70 37"
            fill="none"
            strokeWidth="6"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="stroke-emerald-400"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.5, ease: EASE, delay: 0.6 }}
          />
        </svg>
      </div>

      <h3 className="font-display mt-6 text-2xl font-bold">
        تم إرسال طلب الحجز
      </h3>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        طلبك الآن بانتظار تأكيد إدارة المخزن.
      </p>

      {/* ticket */}
      <div className="relative mx-auto mt-7 max-w-sm overflow-hidden rounded-2xl border border-border bg-background/50 text-start">
        <div className="bg-brand-gradient h-1.5" />
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 p-5 text-sm">
          <TicketRow label="الشركة" value={summary.company} />
          <TicketRow label="الاسم" value={summary.person} />
          <TicketRow label="اليوم" value={summary.dateLabel} />
          <TicketRow label="الميعاد" value={summary.slotLabel} />
        </dl>
      </div>

      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <Button variant="outline" onClick={onAgain}>
          <Plus className="size-4" />
          حجز جديد
        </Button>
        <Button asChild>
          <Link href="/my-bookings">
            متابعة حجوزاتي
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </div>
    </motion.div>
  );
}

function TicketRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] text-muted-foreground">{label}</dt>
      <dd className="truncate font-semibold tabular-nums" dir="auto">
        {value}
      </dd>
    </div>
  );
}

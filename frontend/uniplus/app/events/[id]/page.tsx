'use client';

import { use, useEffect, useState } from 'react';
import Link from "next/link";
import { useRouter } from 'next/navigation';
import Navbar from "../../components/navbar";
import { TagAccent } from "../../components/shared/Tag";
import { events } from "../../../lib/events/events-data";
import { useAlert } from "../../components/ui/AlertProvider";
import { ChevronDown, Check, Lock } from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

/* ---------- Motion variants ---------- */
const pageVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { when: "beforeChildren", duration: 0.25 } },
};
const fadeUp = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 260, damping: 26 } },
};
const staggerRow = { animate: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } } };
const cardHover = { whileHover: { y: -4, scale: 1.01 }, whileTap: { scale: 0.99 } };

/* ---------- Types ---------- */
type EventSession = {
  date: string;
  startTime: string;
  endTime: string;
  location?: string;
  address2?: string;
};

type EventWithOptionals = (typeof events)[number] & {
  available?: number;
  capacity?: number;
  startDate?: string;
  endDate?: string;
  location?: string;
  address2?: string;
  image?: string;
  schedule?: EventSession[];
};

// Next.js 15: params is a Promise in client components
type Params = { params: Promise<{ id: string }> };

/* ---------- Helpers ---------- */
function formatDateGB(s: string) {
  try {
    const d = new Date(s);
    return new Intl.DateTimeFormat("en-GB", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      timeZone: "UTC",
    }).format(d);
  } catch {
    return s;
  }
}

function dateKey(d: string) {
  return new Date(d + "T00:00:00Z").getTime();
}

function groupConsecutiveSessions(sessions: EventSession[]) {
  if (!sessions?.length) return [];
  const sorted = [...sessions].sort((a, b) => dateKey(a.date) - dateKey(b.date));
  return sorted.map((s) => ({
    start: s.date,
    end: s.date,
    startTime: s.startTime,
    endTime: s.endTime,
    items: [s],
  }));
}

/* ---------- HostPill ---------- */
function HostPill({ label }: { label: string }) {
  const normalized = label.toLowerCase();
  let bg = "#E8EEFF";
  let color = "#1F2A44";

  if (normalized === "organizer") {
    bg = "#F3E8FF";
  } else if (normalized === "student") {
    bg = "#E0F2FE";
  } else if (normalized === "professor") {
    bg = "#C7D2FE";
  }

  return (
    <motion.span
      className="inline-flex items-center rounded-md border border-black/10 px-3 py-1 text-xs font-semibold"
      style={{ backgroundColor: bg, color }}
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
    >
      {label}
    </motion.span>
  );
}

/* ---------- ScheduleList ---------- */
function ScheduleList({
  schedule,
  fallbackLocation,
  fallbackAddress2,
}: {
  schedule: EventSession[];
  fallbackLocation: string;
  fallbackAddress2: string;
}) {
  const [open, setOpen] = useState(true);
  if (!schedule?.length) return null;
  const groups = groupConsecutiveSessions(schedule);

  return (
    <section className="mt-6 rounded-2xl bg-white p-6 shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between"
      >
        <h3 className="text-lg font-bold text-[#0B1220]">Schedule &amp; Location</h3>
        <ChevronDown
          className={`h-5 w-5 text-[#0B1220]/60 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 28 }}
            className="overflow-hidden"
          >
            <motion.div className="mt-4 space-y-3" variants={staggerRow} initial="initial" animate="animate">
              {groups.map((g, idx) => {
                const dateLabel = formatDateGB(g.start);
                const loc = g.items[0].location ?? fallbackLocation;
                const addr2 = g.items[0].address2 ?? fallbackAddress2;
                return (
                  <motion.div
                    key={`${g.start}-${idx}`}
                    className="rounded-xl border border-black/10 bg-gray-50 p-4"
                    variants={fadeUp}
                  >
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="inline-flex h-6 items-center rounded-md bg-white px-2 text-xs font-semibold text-[#0B1220]">
                        Day {idx + 1}
                      </span>
                      <span className="text-sm font-semibold text-[#0B1220]">{dateLabel}</span>
                      <span className="text-sm text-[#0B1220]/80">
                        — {g.startTime}–{g.endTime}
                      </span>
                    </div>

                    <div className="mt-2 text-sm text-[#0B1220]/80">
                      <div className="font-medium text-[#0B1220]">{loc}</div>
                      {addr2 && <div>{addr2}</div>}
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

/* ---------- RegisterCTA ---------- */
function RegisterCTA({
  disabled,
  success,
  onClick,
}: {
  disabled: boolean;
  success: boolean;
  onClick: () => void;
}) {
  const reduce = useReducedMotion();
  const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number }>>([]);
  const [denied, setDenied] = useState(false);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (disabled && !success) {
      setDenied(true);
      setTimeout(() => setDenied(false), 450);
      return;
    }
    if (success) return;

    const id = Date.now();
    setRipples((r) => [...r, { id, x, y }]);
    onClick();
    setTimeout(() => setRipples((r) => r.filter((it) => it.id !== id)), 600);
  };

  const base =
    "relative inline-flex w-full items-center justify-center rounded-lg px-4 py-3 text-center text-sm font-semibold outline-none group";
  const idle = "bg-[#6366F1] text-white hover:bg-[#4F46E5] transition-colors";
  const disabledCls = "bg-[#C7CBE0] text-[#3A3F55] cursor-not-allowed";
  const successCls = "bg-emerald-500 text-white";

  const label = disabled ? "Closed" : success ? "Registered" : "Register";

  return (
    <motion.button
      type="button"
      aria-disabled={disabled}
      onClick={handleClick}
      disabled={success}
      className={[base, disabled ? disabledCls : success ? successCls : idle].join(" ")}
      initial={false}
      animate={disabled && !success && denied ? { x: [0, -6, 6, -4, 4, 0] } : { x: 0 }}
      transition={{
        x:
          disabled && !success && denied
            ? { duration: 0.45, ease: "easeInOut", times: [0, 0.15, 0.35, 0.55, 0.8, 1] }
            : { type: "spring", stiffness: 280, damping: 22 },
      }}
    >
      {disabled && !success && (
        <div className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 opacity-0 transition group-hover:opacity-100">
          <div className="rounded-md bg-black/80 px-2 py-1 text-[11px] text-white shadow">
            Registration closed
          </div>
          <div className="mx-auto h-0 w-0 border-l-4 border-r-4 border-t-8 border-l-transparent border-r-transparent border-t-black/80" />
        </div>
      )}

      {!disabled &&
        ripples.map((r) => (
          <motion.span
            key={r.id}
            className="pointer-events-none absolute rounded-full bg-white/40"
            style={{
              left: r.x,
              top: r.y,
              width: 12,
              height: 12,
              transform: "translate(-50%, -50%)",
            }}
            initial={{ scale: 0, opacity: 0.6 }}
            animate={{ scale: 7, opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        ))}

      {success && (
        <>
          <motion.span
            className="absolute inset-0 rounded-lg"
            initial={{ boxShadow: "0 0 0px rgba(16,185,129,0)" }}
            animate={{ boxShadow: "0 0 28px rgba(16,185,129,.45)" }}
          />
          <motion.span
            className="mr-2 inline-flex"
            initial={{ scale: 0.4, opacity: 0, rotate: -45 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 16 }}
          >
            <Check className="h-5 w-5" />
          </motion.span>
        </>
      )}

      <span className="relative z-10 inline-flex items-center gap-2">
        {disabled && !success ? <Lock className="h-4 w-4" /> : null}
        {label}
      </span>
    </motion.button>
  );
}

/* ---------- Event Detail Page ---------- */
export default function EventDetailPage({ params }: Params) {
  // ✅ unwrap params Promise on the client
  const { id } = use(params);
  const numericId = Number(id);
  const event = events.find((e) => e.id === numericId) as EventWithOptionals | undefined;

  if (!event) {
    return (
      <div className="min-h-screen bg-[#E8ECFF]">
        <Navbar />
        <div className="flex items-center justify-center h-screen">
          <div className="text-xl text-gray-900">Event not found</div>
        </div>
      </div>
    );
  }

  const toast = useAlert();
  const [registered, setRegistered] = useState(false);

  const hostLabel = event.host?.[0] ?? "Student";
  const available = event.available ?? 0;
  const capacity = event.capacity ?? 100;
  const isClosed = available <= 0;
  const legacyStart = event.startDate ?? "2025-10-07";
  const legacyEnd = event.endDate ?? "2025-10-12";
  const location = event.location ?? "Room 203, Building 15, Faculty of Engineer";
  const address2 = event.address2 ?? "Kasetsart University";
  const image =
    event.image ??
    "https://images.unsplash.com/photo-1604908176997-431651c0d2dc?q=80&w=1200&auto=format&fit=crop";

  /* ---- Related (tag-based) ---- */
  const currentTags = new Set(event.tags ?? []);
  const relatedByTags = events
    .map((e) => {
      const overlap = (e.tags ?? []).filter((t) => currentTags.has(t)).length;
      return { e, overlap };
    })
    .filter(({ e, overlap }) => e.id !== numericId && overlap > 0)
    .sort(
      (a, b) => b.overlap - a.overlap || (b.e.popularity ?? 0) - (a.e.popularity ?? 0)
    )
    .slice(0, 6)
    .map(({ e }) => e);

  const related = relatedByTags.length
    ? relatedByTags
    : events.filter((e) => e.id !== numericId).slice(0, 6);

  const handleRegister = () => {
    if (registered || isClosed) return;
    setRegistered(true);
    toast({
      text: "You have successfully registered for this event!",
      variant: "success",
      duration: 2500,
    });
  };

  const schedule = event.schedule ?? [];

  return (
    <motion.div className="min-h-screen bg-[#E8ECFF]" variants={pageVariants} initial="initial" animate="animate">
      <Navbar />

      <main className="mx-auto max-w-6xl px-4 py-10">
        {/* Hero Image */}
        <div className="mx-auto w-[420px] max-w-full overflow-hidden rounded-xl bg-white shadow-sm">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <motion.img
            src={image}
            alt={event.title}
            className="h-[420px] w-full object-cover"
            initial={{ scale: 1.02 }}
            animate={{ scale: 1 }}
            whileHover={{ scale: 1.03 }}
            transition={{ type: "spring", stiffness: 220, damping: 24 }}
          />
        </div>

        {/* Title */}
        <motion.h1
          className="mt-8 text-5xl font-extrabold tracking-tight text-[#0B1220]"
          variants={fadeUp}
        >
          {event.title}
        </motion.h1>

        {/* Tags */}
        <motion.div className="mt-3 flex flex-wrap gap-2" variants={staggerRow}>
          <HostPill label={hostLabel} />
          {(event.tags ?? []).slice(0, 3).map((t) => (
            <motion.span
              key={t}
              className="inline-flex items-center rounded-md border border-black/10 bg-white px-3 py-1 text-xs font-semibold text-[#0B1220]"
            >
              {t}
            </motion.span>
          ))}
        </motion.div>

        {/* About */}
        <motion.section className="mt-6 rounded-2xl bg-white p-6 shadow-sm" variants={fadeUp}>
          <div className="flex flex-wrap items-end gap-2">
            <h2 className="text-xl font-bold text-[#0B1220]">About this event</h2>
            <p className="text-x1 text-[#0B1220]/70">
              Organized by <span className="font-semibold">Test Account</span>
            </p>
          </div>

          <div className="mt-5 grid gap-6 md:grid-cols-2">
            <div>
              <p className="text-sm font-semibold text-[#0B1220]">Registration Period</p>
              <p className="mt-1 text-sm text-[#0B1220]">
                {formatDateGB(legacyStart)} - {formatDateGB(legacyEnd)}
              </p>
            </div>

            <div>
              <p className="text-sm font-semibold text-[#0B1220]">Available Spot</p>
              <p className="mt-1 text-sm">
                <span className={isClosed ? "font-bold text-[#E11D48]" : "font-bold text-[#0B1220]"}>
                  {available}
                </span>
                <span className="text-[#0B1220]">/{capacity}</span>
              </p>
            </div>
          </div>

          <div className="mt-6">
            <p className="text-sm font-semibold text-[#0B1220]">Location</p>
            <p className="mt-1 text-sm font-semibold text-[#0B1220]">{location}</p>
            <p className="text-sm text-[#0B1220]">{address2}</p>
          </div>

          <div className="mt-6">
            <p className="text-sm font-semibold text-[#0B1220]">Description</p>
            <p className="mt-2 text-sm text-[#0B1220]">
              {event.excerpt ??
                "Lorem Ipsum is simply dummy text of the printing and typesetting industry."}
            </p>
          </div>
        </motion.section>

        {/* Schedule */}
        {schedule.length > 0 && (
          <ScheduleList schedule={schedule} fallbackLocation={location} fallbackAddress2={address2} />
        )}

        {/* Register */}
        <div className="mt-6">
          <RegisterCTA disabled={isClosed} success={registered} onClick={handleRegister} />
        </div>

        {/* Related */}
        <section className="mt-12">
          <h3 className="text-xl font-semibold text-[#0B1220]">Related Events</h3>
          <motion.div
            className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
            variants={staggerRow}
          >
            {related.map((r) => (
              <Link key={r.id} href={`/events/${r.id}`}>
                <RelatedCard item={r as EventWithOptionals} />
              </Link>
            ))}
          </motion.div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-black/10 bg-white/60 py-10">
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-xs text-gray-500">
            © {new Date().getFullYear()} UniPLUS
          </div>
        </div>
      </footer>
    </motion.div>
  );
}

/* ---------- Related card ---------- */
function RelatedCard({ item }: { item: EventWithOptionals }) {
  const img = item.image 
    ? (item.image.startsWith('http') ? item.image : `http://localhost:8000${item.image}`)
    : "https://images.unsplash.com/photo-1604908176997-431651c0d2dc?q=80&w=1200&auto=format&fit=crop";

  const available = item.available ?? 20 + ((item.id * 37) % 120);
  const capacity = item.capacity ?? 100;

  const hostLabel = item.host?.[0];
  const tagLabel = (item.tags ?? [])[0];

  return (
    <motion.div
      className="block rounded-xl bg-white shadow-sm transition hover:shadow-md cursor-pointer"
      variants={fadeUp}
      {...cardHover}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <motion.img
        src={img}
        alt={item.title}
        className="h-40 w-full rounded-t-xl object-cover"
        whileHover={{ scale: 1.03 }}
        transition={{ type: "spring", stiffness: 240, damping: 22 }}
      />
      <div className="p-4">
        <h4 className="font-medium text-[#0B1220]">{item.title}</h4>
        <div className="mt-2">
          {hostLabel ? (
            <HostPill label={hostLabel} />
          ) : tagLabel ? (
            <TagAccent label={tagLabel} />
          ) : null}
        </div>
        <p className="mt-1 text-sm text-gray-600">
          Available: {available}/{capacity}
        </p>
      </div>
    </motion.div>
  );
}
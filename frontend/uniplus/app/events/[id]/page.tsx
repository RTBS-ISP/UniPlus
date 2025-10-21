"use client";

import { use, useState } from "react";
import Link from "next/link";
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

const staggerRow = {
  animate: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
};

const cardHover = {
  whileHover: { y: -4, scale: 1.01 },
  whileTap: { scale: 0.99 },
};

const pressable = { whileTap: { scale: 0.98 } };

/* ---------- Types ---------- */
type EventSession = {
  date: string;      // "YYYY-MM-DD"
  startTime: string; // "HH:mm"
  endTime: string;   // "HH:mm"
  /** Per-day location overrides */
  location?: string;
  address2?: string;
};

type EventWithOptionals = (typeof events)[number] & {
  available?: number;
  capacity?: number;
  startDate?: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  address2?: string;
  image?: string;
  schedule?: EventSession[];
};

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

/* ---------- Host pill ---------- */
function HostPill({ label }: { label: string }) {
  const normalized = label.toLowerCase();
  let bg = "#E8EEFF";
  let color = "#1F2A44";

  if (normalized === "organizer") {
    bg = "#F3E8FF";
    color = "#1F1F1F";
  } else if (normalized === "student") {
    bg = "#E0F2FE";
    color = "#1F1F1F";
  } else if (normalized === "professor") {
    bg = "#C7D2FE";
    color = "#1F1F1F";
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

function dateKey(d: string) {
  return new Date(d + "T00:00:00Z").getTime();
}

/** Group consecutive days that share identical times for compact display */
function groupConsecutiveSessions(sessions: EventSession[]) {
  if (!sessions?.length) return [];
  const sorted = [...sessions].sort((a, b) => dateKey(a.date) - dateKey(b.date));

  const groups: Array<{
    start: string;
    end: string;
    startTime: string;
    endTime: string;
    items: EventSession[];
  }> = [];

  let cur = {
    start: sorted[0].date,
    end: sorted[0].date,
    startTime: sorted[0].startTime,
    endTime: sorted[0].endTime,
    items: [sorted[0]],
  };

  for (let i = 1; i < sorted.length; i++) {
    const prev = cur.items[cur.items.length - 1];
    const s = sorted[i];
    const prevDay = dateKey(prev.date);
    const thisDay = dateKey(s.date);
    const isConsecutive = thisDay - prevDay === 24 * 60 * 60 * 1000;
    const sameTime = s.startTime === cur.startTime && s.endTime === cur.endTime;

    if (isConsecutive && sameTime) {
      cur.end = s.date;
      cur.items.push(s);
    } else {
      groups.push(cur);
      cur = {
        start: s.date,
        end: s.date,
        startTime: s.startTime,
        endTime: s.endTime,
        items: [s],
      };
    }
  }
  groups.push(cur);
  return groups;
}

/* ---------- Optional compact date summary (kept for reuse elsewhere) ---------- */
function EventDateSummary({ schedule }: { schedule: EventSession[] }) {
  if (!schedule?.length) return null;

  const sorted = [...schedule].sort((a, b) => dateKey(a.date) - dateKey(b.date));
  const first = sorted[0].date;
  const last = sorted[sorted.length - 1].date;

  if (sorted.length === 1) {
    return <span className="text-[#0B1220]">{formatDateGB(first)}</span>;
  }

  const visibleDates = sorted.slice(0, 3);
  const hiddenDates = sorted.slice(3);

  return (
    <div className="text-[#0B1220]">
      {/* Range summary */}
      <p className="font-medium">
        {formatDateGB(first)} – {formatDateGB(last)}
      </p>

      {/* Visible bullets */}
      <ul className="list-disc list-inside mt-1 text-sm text-[#0B1220]/90 space-y-0.5">
        {visibleDates.map((s) => (
          <li key={s.date}>{formatDateGB(s.date)}</li>
        ))}

        {hiddenDates.length > 0 && (
          <li className="relative group text-[#0B1220]/60 hover:text-[#0B1220] transition">
            + {hiddenDates.length} more
            {/* Hover reveal card */}
            <div
              className="pointer-events-none absolute left-1/2 z-50 mt-2 w-[min(260px,90vw)]
                         -translate-x-1/2 rounded-xl border border-gray-200 bg-white/95 p-3
                         shadow-lg backdrop-blur opacity-0 scale-95 transition-all duration-150
                         group-hover:opacity-100 group-hover:scale-100"
            >
              <ul className="list-disc list-inside space-y-0.5 text-sm text-[#0B1220]/80">
                {hiddenDates.map((s) => (
                  <li key={s.date}>{formatDateGB(s.date)}</li>
                ))}
              </ul>
            </div>
          </li>
        )}
      </ul>
    </div>
  );
}

/* ---------- Schedule panel with per-day locations ---------- */
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
                const sameDay = g.start === g.end;
                const dateLabel = sameDay
                  ? formatDateGB(g.start)
                  : `${formatDateGB(g.start)} – ${formatDateGB(g.end)}`;

                const firstLoc = g.items[0].location ?? fallbackLocation;
                const firstAddr2 = g.items[0].address2 ?? fallbackAddress2;
                const mixedLocations = g.items.some(
                  (it) =>
                    (it.location ?? fallbackLocation) !== firstLoc ||
                    (it.address2 ?? fallbackAddress2) !== firstAddr2
                );

                return (
                  <motion.div
                    key={`${g.start}-${g.end}-${idx}`}
                    className="rounded-xl border border-black/10 bg-gray-50 p-4"
                    variants={fadeUp}
                  >
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="inline-flex h-6 items-center rounded-md bg-white px-2 text-xs font-semibold text-[#0B1220]">
                        {sameDay ? `Day ${idx + 1}` : `Days ${idx + 1}–${idx + g.items.length}`}
                      </span>
                      <span className="text-sm font-semibold text-[#0B1220]">{dateLabel}</span>
                      <span className="text-sm text-[#0B1220]/80">
                        — {g.startTime}–{g.endTime}
                      </span>
                    </div>

                    {/* Location(s) */}
                    {!mixedLocations ? (
                      <div className="mt-2 text-sm text-[#0B1220]/80">
                        <div className="font-medium text-[#0B1220]">{firstLoc}</div>
                        {firstAddr2 && <div>{firstAddr2}</div>}
                      </div>
                    ) : (
                      <ul className="mt-3 space-y-1 text-sm">
                        {g.items.map((it) => {
                          const loc = it.location ?? fallbackLocation;
                          const addr2 = it.address2 ?? fallbackAddress2;
                          return (
                            <li
                              key={`${it.date}-${it.startTime}-${it.endTime}`}
                              className="rounded-md bg-white/80 px-3 py-2 text-[#0B1220]/85"
                            >
                              <div className="font-semibold">{formatDateGB(it.date)}</div>
                              <div className="text-xs">
                                {it.startTime}–{it.endTime}
                              </div>
                              <div className="mt-0.5 text-[#0B1220]">{loc}</div>
                              {addr2 && <div className="text-[#0B1220]/70">{addr2}</div>}
                            </li>
                          );
                        })}
                      </ul>
                    )}
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

/* ---------- Juicy Register Button (with Closed UX) ---------- */
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
  const [denied, setDenied] = useState(false); // shake when trying to click a closed button

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = (e.currentTarget as HTMLButtonElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (disabled && !success) {
      // trigger a quick "nope" shake
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
      disabled={success} // still prevent click when success; closed handled via denied shake
      className={[base, disabled ? disabledCls : success ? successCls : idle].join(" ")}
      initial={false}
      animate={
        disabled && !success && denied
          ? { x: [0, -6, 6, -4, 4, 0] } // multi-keyframe shake
          : { x: 0 }
      }
      /** use tween only for the shake; keep spring for normal interactions */
      transition={{
        x:
          disabled && !success && denied
            ? { duration: 0.45, ease: "easeInOut", times: [0, 0.15, 0.35, 0.55, 0.8, 1] }
            : { type: "spring", stiffness: 280, damping: 22 },
      }}
      whileHover={
        disabled || success || reduce ? undefined : { y: -1, scale: 1.01 }
      }
      whileTap={
        disabled || success || reduce ? undefined : { scale: 0.98 }
      }
      title={disabled ? "Registration closed" : undefined}
    >
      {/* CLOSED: animated hatch overlay + tooltip */}
      {disabled && !success && (
        <>
          {/* Diagonal safety stripes */}
          <motion.span
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-lg opacity-30"
            style={{
              backgroundImage:
                "repeating-linear-gradient(135deg, #000 0 8px, transparent 8px 16px)",
            }}
            initial={{ opacity: 0.18, backgroundPositionX: 0 }}
            animate={
              reduce
                ? { opacity: 0.18 }
                : {
                    opacity: 0.22,
                    backgroundPositionX: ["0px", "16px"],
                    transition: { repeat: Infinity, duration: 2, ease: "linear" },
                  }
            }
          />

          {/* Hover tooltip */}
          <div className="pointer-events-none absolute -top-9 left-1/2 z-10 -translate-x-1/2 opacity-0 transition group-hover:opacity-100">
            <div className="rounded-md bg-black/80 px-2 py-1 text-[11px] text-white shadow">
              Registration closed
            </div>
            <div className="mx-auto h-0 w-0 border-l-4 border-r-4 border-t-8 border-l-transparent border-r-transparent border-t-black/80" />
          </div>
        </>
      )}

      {/* Hover sheen (interactive & success) */}
      {!disabled && (
        <motion.span aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-lg">
          <motion.span
            className="absolute -inset-y-4 -left-1/3 h-[220%] w-1/3 rotate-12 opacity-0"
            style={{
              background:
                "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,.45) 50%, rgba(255,255,255,0) 100%)",
            }}
            whileHover={
              reduce
                ? undefined
                : {
                    x: ["0%", "220%"],
                    opacity: [0, 1, 0],
                    transition: { duration: 0.9, ease: "easeOut" },
                  }
            }
          />
        </motion.span>
      )}

      {/* Subtle hover glow (only when interactive) */}
      {!disabled && (
        <motion.span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-lg"
          initial={{ boxShadow: "0 0 0px rgba(99,102,241,0)" }}
          whileHover={reduce ? undefined : { boxShadow: "0 0 24px rgba(99,102,241,.35)" }}
          transition={{ duration: 0.2 }}
        />
      )}

      {/* Click ripples (interactive) */}
      {!reduce &&
        !disabled &&
        ripples.map((r) => (
          <motion.span
            key={r.id}
            aria-hidden
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

      {/* Success glow + check + tiny confetti */}
      {success && (
        <>
          <motion.span
            aria-hidden
            className="absolute inset-0 rounded-lg"
            initial={{ boxShadow: "0 0 0px rgba(16,185,129,0)" }}
            animate={{ boxShadow: "0 0 28px rgba(16,185,129,.45)" }}
            transition={{ duration: 0.25 }}
          />
          <motion.span
            className="mr-2 inline-flex"
            initial={{ scale: 0.4, opacity: 0, rotate: -45 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 16 }}
          >
            <Check className="h-5 w-5" />
          </motion.span>

          {!reduce && (
            <motion.span aria-hidden className="pointer-events-none absolute inset-0 overflow-visible" initial={false}>
              {[...Array(12)].map((_, i) => (
                <motion.span
                  key={i}
                  className="absolute h-1.5 w-1.5 rounded-sm bg-white/90"
                  initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
                  animate={{
                    x: (Math.random() - 0.5) * 140,
                    y: -40 - Math.random() * 80,
                    opacity: 0,
                    rotate: Math.random() * 180,
                  }}
                  transition={{ duration: 0.85 + Math.random() * 0.35, ease: "easeOut" }}
                  style={{ left: "50%", top: "50%" }}
                />
              ))}
            </motion.span>
          )}
        </>
      )}

      {/* Label */}
      <span className="relative z-10 inline-flex items-center gap-2">
        {disabled && !success ? <Lock className="h-4 w-4" /> : null}
        {label}
      </span>

      {/* Subtle inner highlight */}
      <span className="pointer-events-none absolute inset-0 rounded-lg shadow-[inset_0_1px_0_0_rgba(255,255,255,0.15)]" />
    </motion.button>
  );
}

/* ---------- Page ---------- */
export default function EventDetailPage({ params }: Params) {
  const { id } = use(params);
  const numericId = Number(id);

  const event = events.find((e) => e.id === numericId) as EventWithOptionals | undefined;

  if (!event) {
    return (
      <div className="min-h-screen bg-[#E8ECFF]">
        <Navbar />
        <main className="mx-auto max-w-6xl px-4 py-16">
          <p className="text-lg font-medium">Event not found.</p>
        </main>
      </div>
    );
  }

  const toast = useAlert();
  const [registered, setRegistered] = useState(false);

  /* Derived / fallbacks to match your design */
  const hostLabel = event.host?.[0] ?? "Student";
  const available = event.available ?? 0; // show 0/100 -> Closed
  const capacity = event.capacity ?? 100;
  const isClosed = available <= 0;

  // Legacy single-date fields (kept as fallback if no schedule array provided)
  const legacyStart = event.startDate ?? "2025-10-07";
  const legacyEnd = event.endDate ?? "2025-10-12";

  const location = event.location ?? "Room 203, Building 15, Faculty of Engineer";
  const address2 = event.address2 ?? "Kasetsart University";

  const image =
    event.image ??
    "https://images.unsplash.com/photo-1604908176997-431651c0d2dc?q=80&w=1200&auto=format&fit=crop";

  const related = events.filter((e) => e.id !== numericId).slice(0, 6);

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
        {/* Hero image */}
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
        <motion.h1 className="mt-8 text-5xl font-extrabold tracking-tight text-[#0B1220]" variants={fadeUp} initial="initial" animate="animate">
          {event.title}
        </motion.h1>

        {/* Tags */}
        <motion.div className="mt-3 flex flex-wrap gap-2" variants={staggerRow} initial="initial" animate="animate">
          {/* host pill with dynamic color */}
          <HostPill label={hostLabel} />

          {/* normal tags */}
          {(event.tags ?? []).slice(0, 3).map((t) => (
            <motion.span
              key={t}
              className="inline-flex items-center rounded-md border border-black/10 bg-white px-3 py-1 text-xs font-semibold text-[#0B1220]"
              variants={fadeUp}
            >
              {t}
            </motion.span>
          ))}
        </motion.div>

        {/* About card */}
        <motion.section className="mt-6 rounded-2xl bg-white p-6 shadow-sm" variants={fadeUp} initial="initial" animate="animate">
          <div className="flex flex-wrap items-end gap-2">
            <h2 className="text-xl font-bold text-[#0B1220]">About this event</h2>
            <p className="text-x1 text-[#0B1220]/70">
              Organized by <span className="font-semibold">Test Account</span>
            </p>
          </div>

          {/* Top info grid — now 2 columns */}
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
                <span className={isClosed ? "font-bold text-[#E11D48]" : "font-bold text-[#0B1220]"}>{available}</span>
                <span className="text-[#0B1220]">/{capacity}</span>
              </p>
            </div>
          </div>

          {/* Location */}
          <div className="mt-6">
            <p className="text-sm font-semibold text-[#0B1220]">Location</p>
            <p className="mt-1 text-sm font-semibold text-[#0B1220]">{location}</p>
            <p className="text-sm text-[#0B1220]">{address2}</p>
          </div>

          {/* Description */}
          <div className="mt-6">
            <p className="text-sm font-semibold text-[#0B1220]">Description</p>
            <p className="mt-2 text-sm text-[#0B1220]">
              {event.excerpt ??
                "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s."}
            </p>
          </div>
        </motion.section>

        {/* Detailed Schedule (collapsible) with per-day locations */}
        {schedule.length > 0 && <ScheduleList schedule={schedule} fallbackLocation={location} fallbackAddress2={address2} />}

        {/* Register / Closed button (amped up) */}
        <div className="mt-6">
          <RegisterCTA disabled={isClosed} success={registered} onClick={handleRegister} />
        </div>

        {/* Related */}
        <section className="mt-12">
          <h3 className="text-xl font-semibold text-[#0B1220]">Related Events</h3>

          <motion.div
            className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
            variants={staggerRow}
            initial="initial"
            animate="animate"
          >
            {related.map((r) => (
              <Link key={r.id} href={`/events/${r.id}`}>
                <RelatedCard item={r} />
              </Link>
            ))}
          </motion.div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-black/10 bg-white/60 py-10">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-4 md:grid-cols-4">
          <div>
            <p className="text-sm text-gray-700">Site name</p>
            <div className="mt-3 flex items-center gap-3 text-gray-500">
              <div className="h-5 w-5 rounded-full border" />
              <div className="h-5 w-5 rounded-full border" />
              <div className="h-5 w-5 rounded-full border" />
              <div className="h-5 w-5 rounded-full border" />
            </div>
          </div>
          {["Topic", "Topic", "Topic"].map((t, i) => (
            <div key={i}>
              <p className="text-sm font-medium text-gray-800">{t}</p>
              <ul className="mt-3 space-y-1 text-sm text-gray-600">
                <li>
                  <a href="#" className="hover:underline">
                    Page
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:underline">
                    Page
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:underline">
                    Page
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:underline">
                    Page
                  </a>
                </li>
              </ul>
            </div>
          ))}
        </div>
        <div className="mx-auto mt-8 max-w-6xl px-4 text-xs text-gray-500">© {new Date().getFullYear()} UniPLUS</div>
      </footer>
    </motion.div>
  );
}

/* ---------- Related card ---------- */
function RelatedCard({ item }: { item: EventWithOptionals }) {
  const img =
    item.image ??
    "https://images.unsplash.com/photo-1604908176997-431651c0d2dc?q=80&w=1200&auto=format&fit=crop";

  const available = item.available ?? 20 + ((item.id * 37) % 120);
  const capacity = item.capacity ?? 100;
  const badge = item.host?.[0] ?? item.tags?.[0] ?? "Organizer";

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
          <TagAccent label={badge} />
        </div>
        <p className="mt-1 text-sm text-gray-600">
          Available: {available}/{capacity}
        </p>
      </div>
    </motion.div>
  );
}

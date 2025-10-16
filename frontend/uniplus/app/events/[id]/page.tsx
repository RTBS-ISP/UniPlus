"use client";

import { use, useState } from "react";
import Link from "next/link";
import Navbar from "../../components/navbar";
import { TagAccent } from "../../components/shared/Tag";
import { events } from "../../../lib/events/events-data";
import { useAlert } from "../../components/ui/AlertProvider";
import { ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/* ---------- Types ---------- */
type EventSession = {
  date: string;      // "YYYY-MM-DD"
  startTime: string; // "HH:mm"
  endTime: string;   // "HH:mm"
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
  schedule?: EventSession[]; // ← multiple-day schedule
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

/* ---------- Small components ---------- */
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


function ScheduleList({ schedule }: { schedule: EventSession[] }) {
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
            <div className="mt-4 space-y-3">
              {groups.map((g, idx) => {
                const sameDay = g.start === g.end;
                const dateLabel = sameDay
                  ? formatDateGB(g.start)
                  : `${formatDateGB(g.start)} – ${formatDateGB(g.end)}`;

                return (
                  <div
                    key={`${g.start}-${g.end}-${idx}`}
                    className="rounded-xl border border-black/10 bg-gray-50 p-4"
                  >
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="inline-flex h-6 items-center rounded-md bg-white px-2 text-xs font-semibold text-[#0B1220]">
                        {sameDay
                          ? `Day ${idx + 1}`
                          : `Days ${idx + 1}–${idx + g.items.length}`}
                      </span>
                      <span className="text-sm font-semibold text-[#0B1220]">{dateLabel}</span>
                      <span className="text-sm text-[#0B1220]/80">
                        — {g.startTime}–{g.endTime}
                      </span>
                    </div>

                    {/* If you support per-day locations later, render them here. */}
                    {/* <div className="mt-2 text-sm text-[#0B1220]/80">{g.items[0].location}</div> */}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

/* ---------- Page ---------- */
export default function EventDetailPage({ params }: Params) {
  const { id } = use(params);
  const numericId = Number(id);

  const event = events.find((e) => e.id === numericId) as
    | EventWithOptionals
    | undefined;

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
  const legacyEventDate = event.endDate ?? "2025-10-13";

  const location =
    event.location ?? "Room 203, Building 15, Faculty of Engineer";
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
    <div className="min-h-screen bg-[#E8ECFF]">
      <Navbar />

      <main className="mx-auto max-w-6xl px-4 py-10">
        {/* Hero image */}
        <div className="mx-auto w-[420px] max-w-full overflow-hidden rounded-xl bg-white shadow-sm">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image}
            alt={event.title}
            className="h-[420px] w-full object-cover"
          />
        </div>

        {/* Title */}
        <h1 className="mt-8 text-5xl font-extrabold tracking-tight text-[#0B1220]">
          {event.title}
        </h1>

        {/* Tags */}
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="inline-flex items-center rounded-md border border-black/10 bg-white px-3 py-1 text-xs font-semibold text-[#0B1220]">
            {hostLabel}
          </span>
          {(event.tags ?? []).slice(0, 3).map((t) => (
            <span
              key={t}
              className="inline-flex items-center rounded-md border border-black/10 bg-white px-3 py-1 text-xs font-semibold text-[#0B1220]"
            >
              {t}
            </span>
          ))}
        </div>

        {/* About card */}
        <section className="mt-6 rounded-2xl bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <h2 className="text-xl font-bold text-[#0B1220]">About this event</h2>
            <p className="text-sm text-[#0B1220]/70">
              Organized by <span className="font-semibold">Test Account</span>
            </p>
          </div>

          {/* Top info grid */}
          <div className="mt-5 grid gap-6 md:grid-cols-3">
            <div>
              <p className="text-sm font-semibold text-[#0B1220]">
                Registration Period
              </p>
              <p className="mt-1 text-sm text-[#0B1220]">
                {formatDateGB(legacyStart)} - {formatDateGB(legacyEnd)}
              </p>
            </div>

            <div>
              <p className="text-sm font-semibold text-[#0B1220]">Available Spot</p>
              <p className="mt-1 text-sm">
                <span
                  className={
                    isClosed
                      ? "font-bold text-[#E11D48]"
                      : "font-bold text-[#0B1220]"
                  }
                >
                  {available}
                </span>
                <span className="text-[#0B1220]">/{capacity}</span>
              </p>
            </div>

            <div>
              <p className="text-sm font-semibold text-[#0B1220]">
                Event Date{schedule.length > 1 ? "s" : ""}
              </p>
              <div className="mt-1 text-sm">
                {schedule.length > 0 ? (
                  <EventDateSummary schedule={schedule} />
                ) : (
                  <span className="text-[#0B1220]">{formatDateGB(legacyEventDate)}</span>
                )}
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="mt-6">
            <p className="text-sm font-semibold text-[#0B1220]">Location</p>
            <p className="mt-1 text-sm font-semibold text-[#0B1220]">
              {location}
            </p>
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
        </section>

        {/* Detailed Schedule (collapsible) */}
        {schedule.length > 0 && <ScheduleList schedule={schedule} />}

        {/* Register / Closed button */}
        <button
          onClick={handleRegister}
          disabled={registered || isClosed}
          className={`mt-6 block w-full rounded-lg px-4 py-3 text-center text-sm font-semibold
            ${
              isClosed || registered
                ? "bg-[#C7CBE0] text-[#3A3F55] cursor-default"
                : "bg-[#6366F1] text-white hover:bg-[#4F46E5] transition-colors"
            }`}
        >
          {isClosed ? "Closed" : registered ? "Registered" : "Register"}
        </button>

        {/* Related */}
        <section className="mt-12">
          <h3 className="text-xl font-semibold text-[#0B1220]">Related Events</h3>
          <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((r) => (
              <RelatedCard key={r.id} item={r} />
            ))}
          </div>
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
                <li><a href="#" className="hover:underline">Page</a></li>
                <li><a href="#" className="hover:underline">Page</a></li>
                <li><a href="#" className="hover:underline">Page</a></li>
                <li><a href="#" className="hover:underline">Page</a></li>
              </ul>
            </div>
          ))}
        </div>
        <div className="mx-auto mt-8 max-w-6xl px-4 text-xs text-gray-500">
          © {new Date().getFullYear()} UniPLUS
        </div>
      </footer>
    </div>
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
    <Link
      href={`/events/${item.id}`}
      className="block rounded-xl bg-white shadow-sm transition hover:shadow-md"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={img} alt={item.title} className="h-40 w-full rounded-t-xl object-cover" />
      <div className="p-4">
        <h4 className="font-medium text-[#0B1220]">{item.title}</h4>
        <div className="mt-2">
          <TagAccent label={badge} />
        </div>
        <p className="mt-1 text-sm text-gray-600">
          Available: {available}/{capacity}
        </p>
      </div>
    </Link>
  );
}

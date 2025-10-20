'use client';

import { use, useEffect, useState } from 'react';
import Link from "next/link";
import { useRouter } from 'next/navigation';
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
function dateKey(d: string) {
  return new Date(d + "T00:00:00Z").getTime();
}

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
      <p className="font-medium">
        {formatDateGB(first)} – {formatDateGB(last)}
      </p>

      <ul className="list-disc list-inside mt-1 text-sm text-[#0B1220]/90 space-y-0.5">
        {visibleDates.map((s) => (
          <li key={s.date}>{formatDateGB(s.date)}</li>
        ))}

        {hiddenDates.length > 0 && (
          <li className="relative group text-[#0B1220]/60 hover:text-[#0B1220] transition">
            + {hiddenDates.length} more
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
  const [event, setEvent] = useState<EventWithOptionals | null>(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [message, setMessage] = useState('');
  const router = useRouter();
  const toast = useAlert();

  useEffect(() => {
    fetchEventDetail();
  }, [id]);

  const fetchEventDetail = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/events/${id}`, { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setEvent(data);
      }
    } catch (error) {
      console.error('Error fetching event:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    setRegistering(true);
    setMessage('');
    try {
      const csrfRes = await fetch('http://localhost:8000/api/set-csrf-token', { credentials: 'include' });
      const { csrftoken } = await csrfRes.json();

      const response = await fetch(`http://localhost:8000/api/events/${id}/register`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'X-CSRFToken': csrftoken },
      });

      const result = await response.json();
      if (response.ok) {
        const ticketMessage = result.tickets_count > 1 
          ? `✅ Successfully registered! You received ${result.tickets_count} tickets (one for each day). Redirecting...`
          : '✅ Successfully registered! Redirecting...';
        setMessage(ticketMessage);
        toast({ text: ticketMessage, variant: "success" });
        setTimeout(() => router.push('/my-ticket'), 2000);
      } else {
        setMessage(result.error || 'Registration failed');
        toast({ text: result.error || 'Registration failed', variant: "error" });
      }
    } catch (error) {
      console.error('Registration error:', error);
      setMessage('❌ Failed to register. Please try again.');
      toast({ text: '❌ Failed to register. Please try again.', variant: "error" });
    } finally {
      setRegistering(false);
    }
  };

  const numericId = Number(id);
  const related = events.filter((e) => e.id !== numericId).slice(0, 6);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
        <Navbar />
        <div className="flex items-center justify-center h-screen">
          <div className="text-xl text-gray-900">Loading event...</div>
        </div>
      </div>
    );
  }

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

  const available = event.available ?? 0;
  const capacity = event.capacity ?? 100;
  const isClosed = available <= 0;
  const schedule = event.schedule ?? [];

  const image = event.image ?? "https://images.unsplash.com/photo-1604908176997-431651c0d2dc?q=80&w=1200&auto=format&fit=crop";
  const location = event.location ?? "Room 203, Building 15, Faculty of Engineering";
  const address2 = event.address2 ?? "Kasetsart University";

  return (
    <div className="min-h-screen bg-[#E8ECFF]">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <div className="mx-auto w-[420px] max-w-full overflow-hidden rounded-xl bg-white shadow-sm">
          <img src={image} alt={event.title} className="h-[420px] w-full object-cover" />
        </div>

        <h1 className="mt-8 text-5xl font-extrabold tracking-tight text-[#0B1220]">{event.title}</h1>

        <section className="mt-6 rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-[#0B1220]">About this event</h2>

          <div className="mt-6">
            <p className="text-sm font-semibold text-[#0B1220]">Description</p>
            <p className="mt-2 text-sm text-[#0B1220]">{event.excerpt ?? "No description available."}</p>
          </div>
        </section>

        {schedule.length > 0 && <ScheduleList schedule={schedule} />}

        <button
          onClick={handleRegister}
          disabled={registering || isClosed}
          className={`mt-6 block w-full rounded-lg px-4 py-3 text-center text-sm font-semibold ${
            isClosed
              ? "bg-[#C7CBE0] text-[#3A3F55] cursor-default"
              : "bg-[#6366F1] text-white hover:bg-[#4F46E5] transition-colors"
          }`}
        >
          {isClosed ? "Closed" : registering ? "Registering..." : "Register"}
        </button>

        {message && <p className="mt-3 text-center text-sm text-[#0B1220]">{message}</p>}

        <section className="mt-12">
          <h3 className="text-xl font-semibold text-[#0B1220]">Related Events</h3>
          <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((r) => (
              <RelatedCard key={r.id} item={r} />
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-black/10 bg-white/60 py-10">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-4 md:grid-cols-4">
          <div>
            <p className="text-sm text-gray-700">Site name</p>
          </div>
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

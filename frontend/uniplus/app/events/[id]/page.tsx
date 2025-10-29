'use client';

import { useEffect, useState } from 'react';
import Link from "next/link";
import { useRouter } from 'next/navigation';
import Navbar from "../../components/navbar";
import { TagAccent } from "../../components/shared/Tag";
import { useAlert } from "../../components/ui/AlertProvider";
import { ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/* ---------- Types ---------- */
type EventSession = {
  date: string;
  startTime: string;
  endTime: string;
};

type EventWithOptionals = {
  id: number;
  title: string;
  excerpt?: string;
  image?: string;
  available?: number;
  capacity?: number;
  startDate?: string;
  endDate?: string;
  location?: string;
  address2?: string;
  host?: string[];
  tags?: string[] | string;
  schedule?: EventSession[];
  is_registered?: boolean;
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
  const [id, setId] = useState<string>("");
  const [event, setEvent] = useState<EventWithOptionals | null>(null);
  const [relatedEvents, setRelatedEvents] = useState<EventWithOptionals[]>([]);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [message, setMessage] = useState('');
  const [csrfToken, setCsrfToken] = useState('');
  const [isRegistered, setIsRegistered] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const toast = useAlert();

  // Unwrap params
  useEffect(() => {
    params?.then((p) => {
      setId(p.id);
    });
  }, [params]);

  // Fetch CSRF token on mount
  useEffect(() => {
    const fetchCsrfToken = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/set-csrf-token', {
          credentials: 'include'
        });
        
        if (response.ok) {
          const data = await response.json();
          setCsrfToken(data.csrftoken);
          console.log('CSRF token fetched successfully');
        }
      } catch (error) {
        console.error('Error fetching CSRF token:', error);
      }
    };

    fetchCsrfToken();
  }, []);

  // Fetch event detail when id changes
  useEffect(() => {
    if (!id) return;
    fetchEventDetail();
    fetchRelatedEvents();
  }, [id]);

  const fetchEventDetail = async () => {
    try {
      setLoading(true);
      setError('');
      
      // REMOVED trailing slash
      const response = await fetch(`http://localhost:8000/api/events/${id}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch event');
      }

      const data = await response.json();
      console.log('Event data:', data);
      
      setEvent({
        id: data.id,
        title: data.event_title || data.title,
        excerpt: data.event_description || data.excerpt,
        image: data.event_image || data.image,
        available: data.available,
        capacity: data.max_attendee || data.capacity,
        startDate: data.start_date_register || data.startDate,
        endDate: data.end_date_register || data.endDate,
        location: data.event_address || data.location,
        address2: data.address2,
        host: data.host || [data.organizer_username || 'Unknown'],
        tags: data.tags,
        schedule: data.schedule,
        is_registered: data.is_registered || false
      });
      
      setIsRegistered(data.is_registered || false);
    } catch (error) {
      console.error('Error fetching event:', error);
      setError('Failed to load event');
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatedEvents = async () => {
    try {
      // REMOVED trailing slash
      const response = await fetch('http://localhost:8000/api/events', {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        const filtered = data
          .filter((e: any) => e.id !== Number(id))
          .slice(0, 6)
          .map((e: any) => ({
            id: e.id,
            title: e.event_title || e.title,
            excerpt: e.event_description || e.excerpt,
            image: e.event_image || e.image,
            available: e.available,
            capacity: e.max_attendee || e.capacity,
            host: e.host || [e.organizer_username || 'Unknown'],
            tags: e.tags
          }));
        
        setRelatedEvents(filtered);
      }
    } catch (error) {
      console.error('Error fetching related events:', error);
    }
  };

  const handleRegister = async () => {
    if (!csrfToken) {
      setError('Please wait, loading...');
      toast({
        text: 'Please wait, loading...',
        variant: 'error',
        duration: 2000,
      });
      return;
    }

    if (isRegistered) {
      toast({
        text: 'You are already registered for this event',
        variant: 'info',
        duration: 2000,
      });
      return;
    }

    if (!event) return;

    setRegistering(true);
    setError('');
    setMessage('');

    try {
      // REMOVED trailing slash
      const response = await fetch(`http://localhost:8000/api/events/${id}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken,
        },
        credentials: 'include',
      });

      const data = await response.json();
      console.log('Registration response:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      // Success!
      setIsRegistered(true);
      setMessage('Successfully registered! Check your tickets.');
      
      toast({
        text: 'You have successfully registered for this event!',
        variant: 'success',
        duration: 3000,
      });

      // Refresh event data to update capacity
      await fetchEventDetail();

    } catch (error: any) {
      console.error('Error registering for event:', error);
      const errorMessage = error.message || 'Failed to register for event';
      setError(errorMessage);
      
      toast({
        text: errorMessage,
        variant: 'error',
        duration: 3000,
      });
    } finally {
      setRegistering(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#E8ECFF]">
        <Navbar />
        <div className="flex items-center justify-center h-screen">
          <div className="text-xl text-gray-900">Loading event...</div>
        </div>
      </div>
    );
  }

  if (error && !event) {
    return (
      <div className="min-h-screen bg-[#E8ECFF]">
        <Navbar />
        <div className="flex items-center justify-center h-screen">
          <div className="text-xl text-red-600">{error}</div>
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
  const hostLabel = event.host?.[0] ?? "Student";

  const image = event.image
    ? (event.image.startsWith('http') ? event.image : `http://localhost:8000${event.image}`)
    : "https://images.unsplash.com/photo-1604908176997-431651c0d2dc?q=80&w=1200&auto=format&fit=crop";

  const location = event.location ?? "TBD";
  const address2 = event.address2 ?? "TBD";

  return (
    <div className="min-h-screen bg-[#E8ECFF]">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-10">
        {/* Hero image */}
        <div className="mx-auto w-[420px] max-w-full overflow-hidden rounded-xl bg-white shadow-sm">
          <div className="relative w-full" style={{ aspectRatio: '1/1' }}>
            <img
              src={image}
              alt={event.title}
              className="absolute inset-0 w-full h-full"
              style={{ objectFit: 'cover' }}
              loading="eager"
              onError={(e) => {
                e.currentTarget.src = "https://images.unsplash.com/photo-1604908176997-431651c0d2dc?q=80&w=1200&auto=format&fit=crop";
              }}
            />
          </div>
        </div>

        {/* Title */}
        <h1 className="mt-8 text-5xl font-extrabold tracking-tight text-[#0B1220]">
          {event.title}
        </h1>

        {/* Tags */}
        <div className="mt-3 flex flex-wrap gap-2">
          {(() => {
            const rawTags = event.tags;
            let tagsArray: string[] = [];

            if (!rawTags) {
              tagsArray = [];
            } else if (Array.isArray(rawTags)) {
              tagsArray = rawTags;
            } else if (typeof rawTags === 'string') {
              try {
                const parsed = JSON.parse(rawTags);
                if (Array.isArray(parsed)) {
                  tagsArray = parsed;
                } else {
                  throw new Error('Not array');
                }
              } catch {
                const commaSplit = rawTags.split(',').map(t => t.trim()).filter(Boolean);
                tagsArray = commaSplit.length > 1
                  ? commaSplit
                  : [rawTags.trim()];
              }
            }

            const validTags = tagsArray
              .filter((tag): tag is string => Boolean(tag && typeof tag === 'string' && tag.trim()))
              .slice(0, 3);

            return validTags.map((tag, idx) => (
              <span
                key={`tag-${idx}-${tag}`}
                className="inline-flex items-center rounded-md border border-black/10 bg-white px-3 py-1 text-xs font-semibold text-[#0B1220]"
              >
                {tag}
              </span>
            ));
          })()}
        </div>

        {/* About card */}
        <section className="mt-6 rounded-2xl bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <h2 className="text-xl font-bold text-[#0B1220]">About this event</h2>
            <p className="text-sm text-[#0B1220]/70">
              Organized by <span className="font-semibold">{hostLabel}</span>
            </p>
          </div>

          {/* Top info grid */}
          <div className="mt-5 grid gap-6 md:grid-cols-3">
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
                  <span className="text-[#0B1220]">TBD</span>
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
              {event.excerpt ?? "No description available."}
            </p>
          </div>
        </section>

        {/* Schedule */}
        {schedule.length > 0 && <ScheduleList schedule={schedule} />}

        {/* Error message */}
        {error && (
          <div className="mt-4 rounded-lg bg-red-100 p-4 text-red-700">
            {error}
          </div>
        )}

        {/* Register button */}
        <button
          onClick={handleRegister}
          disabled={registering || isClosed || isRegistered}
          className={`mt-6 block w-full rounded-lg px-4 py-3 text-center text-sm font-semibold transition-colors
            ${isRegistered
              ? "bg-green-500 text-white cursor-default"
              : isClosed
              ? "bg-[#C7CBE0] text-[#3A3F55] cursor-not-allowed"
              : registering
              ? "bg-gray-400 text-white cursor-wait"
              : "bg-[#6366F1] text-white hover:bg-[#4F46E5]"
            }`}
        >
          {isRegistered
            ? "✓ Registered"
            : isClosed
            ? "Closed"
            : registering
            ? "Registering..."
            : "Register"}
        </button>

        {message && (
          <p className="mt-3 text-center text-sm text-green-600 font-medium">{message}</p>
        )}

        {isRegistered && (
          <p className="mt-3 text-center text-sm text-green-600 font-medium">
            Check your tickets in{' '}
            <Link href="/my-ticket" className="underline">
              My Tickets
            </Link>
          </p>
        )}

        {/* Related events */}
        {relatedEvents.length > 0 && (
          <section className="mt-12">
            <h3 className="text-xl font-semibold text-[#0B1220]">Related Events</h3>
            <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {relatedEvents.map((r) => (
                <RelatedCard key={r.id} item={r} />
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-black/10 bg-white/60 py-10">
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-xs text-gray-500">
            © {new Date().getFullYear()} UniPLUS
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ---------- Related card ---------- */
function RelatedCard({ item }: { item: EventWithOptionals }) {
  const img = item.image
    ? (item.image.startsWith('http') ? item.image : `http://localhost:8000${item.image}`)
    : "https://images.unsplash.com/photo-1604908176997-431651c0d2dc?q=80&w=1200&auto=format&fit=crop";

  const available = item.available ?? 0;
  const capacity = item.capacity ?? 100;
  const badge = item.host?.[0] ?? (Array.isArray(item.tags) ? item.tags[0] : "Organizer");

  return (
    <Link
      href={`/events/${item.id}`}
      className="block rounded-xl bg-white shadow-sm transition hover:shadow-md"
    >
      <div className="relative w-full overflow-hidden rounded-t-xl" style={{ aspectRatio: '2/1' }}>
        <img
          src={img}
          alt={item.title}
          className="absolute inset-0 w-full h-full"
          style={{ objectFit: 'cover' }}
          loading="lazy"
          onError={(e) => {
            e.currentTarget.src = "https://images.unsplash.com/photo-1604908176997-431651c0d2dc?q=80&w=1200&auto=format&fit=crop";
          }}
        />
      </div>
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
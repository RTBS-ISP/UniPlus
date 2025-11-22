"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "../../components/navbar";
import { ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

import { useAlert } from "../../components/ui/AlertProvider";

import { HostPill } from "../../components/event_id/HostPill";
import { ScheduleList } from "../../components/event_id/ScheduleList";
import { RegisterCTA } from "../../components/event_id/RegisterCTA";
import { CommentsRatingsSection } from "../../components/event_id/CommentsRatingsSection";
import { RelatedCard, RelatedEvent } from "../../components/event_id/RelatedCard";
import { EventFeedbackSection } from "../../components/event_id/EventFeedbackSection";

import {
  EventSession,
  formatDateGB,
  getImageUrl,
} from "../../components/event_id/utils";

import {
  pageVariants,
  fadeUp,
  staggerRow,
} from "../../components/event_id/motionConfig";

type EventDetail = {
  id: number;
  title: string;
  event_title: string;
  event_description: string;
  excerpt: string;
  organizer_username: string;
  organizer_role: string;
  host: string[];
  start_date_register: string;
  end_date_register: string;
  event_start_date: string;
  event_end_date: string;
  max_attendee: number;
  capacity: number;
  current_attendees: number;
  available: number;
  event_address: string;
  location: string;
  address2?: string;
  is_online: boolean;
  event_meeting_link: string;
  tags: string[];
  event_image: string | null;
  image: string | null;
  is_registered: boolean;
  schedule: EventSession[];
};

type Params = {
  params: Promise<{ id: string }>;
};

export default function EventDetailPage({ params }: Params) {
  const { id } = use(params);
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [relatedEvents, setRelatedEvents] = useState<RelatedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [registering, setRegistering] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [isOwner, setIsOwner] = useState(false);

  const toast = useAlert();

  /** Check ownership **/
  useEffect(() => {
    async function checkOwnership(username?: string) {
      try {
        const res = await fetch("http://localhost:8000/api/user", {
          credentials: "include",
        });
        if (!res.ok) return;

        const user = await res.json();
        setIsOwner(username === user.username);
      } catch (err) {
        console.error("Error checking ownership:", err);
      }
    }

    if (event?.organizer_username) {
      checkOwnership(event.organizer_username);
    }
  }, [event?.organizer_username]);

  /** Fetch event detail **/
  useEffect(() => {
    async function fetchEventDetail() {
      try {
        setLoading(true);

        const response = await fetch(
          `http://localhost:8000/api/events/${id}`,
          { credentials: "include" }
        );

        if (!response.ok) throw new Error("Event not found");

        const data = await response.json();
        setEvent(data);
        setRegistered(data.is_registered || false);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load event");
      } finally {
        setLoading(false);
      }
    }

    fetchEventDetail();
  }, [id]);

  /** Fetch related events **/
  useEffect(() => {
    async function fetchRelated() {
      if (!event) return;

      try {
        const response = await fetch("http://localhost:8000/api/events");
        if (!response.ok) throw new Error("Failed to fetch related events");

        const data = await response.json();
        const tags = new Set(event.tags);

        const relatedByTags = data
          .map((e: any) => ({
            e,
            overlap: (e.tags ?? []).filter((t: string) => tags.has(t)).length,
          }))
          .filter(({ e, overlap }: any) => e.id !== event.id && overlap > 0)
          .sort((a: any, b: any) => b.overlap - a.overlap)
          .slice(0, 6)
          .map(({ e }: any) => ({
            id: e.id,
            title: e.event_title,
            host: [e.organizer_role || "Organizer"],
            tags: e.tags,
            image: e.event_image,
            available: e.max_attendee - e.attendee_count,
            capacity: e.max_attendee,
          }));

        const fallback = data
          .filter((e: any) => e.id !== event.id)
          .slice(0, 6)
          .map((e: any) => ({
            id: e.id,
            title: e.event_title,
            host: [e.organizer_role],
            tags: e.tags,
            image: e.event_image,
            available: e.max_attendee - e.attendee_count,
            capacity: e.max_attendee,
          }));

        setRelatedEvents(
          relatedByTags.length ? relatedByTags : fallback
        );
      } catch (err) {
        console.error("Error fetching related events:", err);
      }
    }

    fetchRelated();
  }, [event]);

  /** Register **/
  const handleRegister = async () => {
    if (!event || registered) return;

    try {
      setRegistering(true);

      const tokenMatch = document.cookie.match(/csrftoken=([^;]+)/);
      const csrfToken = tokenMatch ? tokenMatch[1] : "";

      const res = await fetch(
        `http://localhost:8000/api/events/${id}/register`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": csrfToken,
          },
        }
      );

      const data = await res.json();

      if (res.ok) {
        setRegistered(true);
        toast({
          text: data.message || "You have successfully registered!",
          variant: "success",
        });

        /** Refresh event data **/
        const refreshed = await fetch(
          `http://localhost:8000/api/events/${id}`,
          { credentials: "include" }
        );

        if (refreshed.ok) {
          setEvent(await refreshed.json());
        }
      } else {
        toast({
          text: data.error || "Failed to register",
          variant: "error",
        });
      }
    } catch (err) {
      toast({ text: "Network error", variant: "error" });
    } finally {
      setRegistering(false);
    }
  };

  /** Loading **/
  if (loading) {
    return (
      <div className="min-h-screen bg-[#E8ECFF]">
        <Navbar />
        <main className="mx-auto max-w-6xl px-4 py-16 text-center">
          <div className="h-12 w-12 mx-auto animate-spin rounded-full border-4 border-[#6366F1] border-r-transparent" />
          <p className="mt-4 text-gray-600">Loading event...</p>
        </main>
      </div>
    );
  }

  /** Error **/
  if (error || !event) {
    return (
      <div className="min-h-screen bg-[#E8ECFF]">
        <Navbar />
        <main className="mx-auto max-w-6xl px-4 py-16">
          <p className="text-lg text-red-600">{error || "Event not found"}</p>
          <Link href="/events" className="text-[#6366F1] underline mt-4 block">
            ← Back to events
          </Link>
        </main>
      </div>
    );
  }

  /** Derived Values **/
  const hostLabel =
    event.organizer_role
      ? event.organizer_role.charAt(0).toUpperCase() +
        event.organizer_role.slice(1).toLowerCase()
      : "Organizer";

  const available = event.available ?? 0;
  const capacity = event.capacity ?? 100;
  const isClosed = available <= 0;
  const location = event.location || event.event_address || "TBA";
  const address2 = event.address2 ?? "";
  const schedule = event.schedule ?? [];

  const hasEventEnded =
    new Date(event.event_end_date) < new Date();

  const image = getImageUrl(event.image || event.event_image);

  const visibleTags = event.tags.slice(0, 5);
  const hiddenTags = event.tags.slice(5);

  /** Page Render **/
  return (
    <motion.div
      className="min-h-screen bg-[#E8ECFF]"
      variants={pageVariants}
      initial="initial"
      animate="animate"
    >
      <Navbar />

      <main className="mx-auto max-w-6xl px-4 py-10">

        {/* Hero */}
        <div className="mx-auto w-[420px] max-w-full overflow-hidden rounded-xl bg-white shadow-sm">
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
          className="mt-8 text-5xl font-extrabold text-[#0B1220]"
          variants={fadeUp}
        >
          {event.title}
        </motion.h1>

        {/* Tags */}
        <motion.div className="mt-3 flex flex-wrap gap-2" variants={staggerRow}>
          <HostPill label={hostLabel} />

          {visibleTags.map((t) => (
            <motion.span
              key={t}
              className="inline-flex items-center rounded-md border border-black/10 bg-white px-3 py-1 text-xs font-semibold text-[#0B1220]"
            >
              {t}
            </motion.span>
          ))}

          {hiddenTags.length > 0 && (
            <span className="relative group">
              <button className="inline-flex items-center rounded-md border border-black/10 bg-white px-3 py-1 text-xs font-semibold text-[#0B1220]">
                +{hiddenTags.length}
              </button>

              <div className="pointer-events-none absolute left-1/2 z-50 mt-2 w-[min(420px,90vw)]
                -translate-x-1/2 rounded-xl border border-gray-200 bg-white/95 p-3
                shadow-lg backdrop-blur opacity-0 scale-95 transition-all duration-150
                group-hover:opacity-100 group-hover:scale-100"
              >
                <div className="flex flex-wrap gap-2">
                  {hiddenTags.map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center rounded-md border border-black/10 bg-white px-3 py-1 text-xs font-semibold text-[#0B1220]"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </span>
          )}
        </motion.div>

        {/* About */}
        <motion.section
          className="mt-6 rounded-2xl bg-white p-6 shadow-sm"
          variants={fadeUp}
        >
          <div className="flex flex-wrap items-end gap-2">
            <h2 className="text-xl font-bold text-[#0B1220]">About this event</h2>
            <p className="text-base text-[#0B1220]/70">
              Organized by{" "}
              <Link 
                href={`/profile/${event.organizer_username}`}
                className="font-semibold text-[#6366F1] hover:text-[#4F46E5] hover:underline transition-colors"
              >
                {event.organizer_username}
              </Link>
            </p>
          </div>

          <div className="mt-5 grid gap-6 md:grid-cols-2">
            <div>
              <p className="text-sm font-semibold text-[#0B1220]">
                Registration Period
              </p>
              <p className="mt-1 text-sm text-[#0B1220]">
                {formatDateGB(event.start_date_register)} -{" "}
                {formatDateGB(event.end_date_register)}
              </p>
            </div>

            <div>
              <p className="text-sm font-semibold text-[#0B1220]">
                Available Spot
              </p>
              <p className="mt-1 text-sm">
                <span className={isClosed ? "text-[#E11D48]" : "text-[#0B1220] font-bold"}>
                  {available}
                </span>
                <span className="text-[#0B1220]">/{capacity}</span>
              </p>
            </div>
          </div>

          <div className="mt-6">
            <p className="text-sm font-semibold text-[#0B1220]">
              Description
            </p>
            <p className="mt-2 text-sm text-[#0B1220] whitespace-pre-wrap">
              {event.event_description ||
                event.excerpt ||
                "No description available."}
            </p>
          </div>
        </motion.section>

        {/* Schedule */}
        {schedule.length > 0 && (
          <ScheduleList
            schedule={schedule}
            fallbackLocation={location}
            fallbackAddress2={address2}
          />
        )}

        {/* Register */}
        <div className="mt-6">
          {isOwner ? (
            <div className="flex justify-end">
              <Link
                href={`/events/${id}/dashboard`}
                className="inline-flex items-center rounded-lg bg-[#6366F1] px-4 py-3 text-white text-sm font-semibold hover:bg-[#4F46E5]"
              >
                Event Dashboard <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </div>
          ) : (
            <RegisterCTA
              disabled={isClosed}
              success={registered}
              onClick={handleRegister}
              loading={registering}
            />
          )}
        </div>

        {/* Feedback (new section) */}
        <EventFeedbackSection
          eventId={Number(id)}
          isRegistered={registered}
          hasEventEnded={hasEventEnded}
        />

        {/* Comments / Ratings */}
        <CommentsRatingsSection
          eventId={Number(id)}
          isRegistered={registered}
        />

        {/* Related Events */}
        {relatedEvents.length > 0 && (
          <section className="mt-12">
            <h3 className="text-xl font-semibold text-[#0B1220]">
              Related Events
            </h3>

            <motion.div
              className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
              variants={staggerRow}
            >
              {relatedEvents.map((r) => (
                <Link href={`/events/${r.id}`} key={r.id}>
                  <RelatedCard item={r} />
                </Link>
              ))}
            </motion.div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-black/10 bg-white/60 py-10">
        <div className="mx-auto max-w-6xl px-4 text-xs text-gray-500">
          © {new Date().getFullYear()} UniPLUS
        </div>
      </footer>
    </motion.div>
  );
}

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
import { EventSession, formatDateGB, getImageUrl } from "../../components/event_id/utils";
import { pageVariants, fadeUp, staggerRow } from "../../components/event_id/motionConfig";

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

type Params = { params: Promise<{ id: string }> };

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

  // Fetch current logged-in user to compare with event board owner
  useEffect(() => {
    async function checkOwnership(organizerUsername?: string) {
      try {
        const res = await fetch("http://localhost:8000/api/user", {
          credentials: "include",
        });
        if (!res.ok) return;
        const user = await res.json();
        if (organizerUsername && user.username === organizerUsername) {
          setIsOwner(true);
        } else {
          setIsOwner(false);
        }
      } catch (err) {
        console.error("Error checking ownership:", err);
      }
    }

    if (event?.organizer_username) {
      checkOwnership(event.organizer_username);
    }
  }, [event?.organizer_username]);

  // Fetch event detail
  useEffect(() => {
    async function fetchEventDetail() {
      try {
        setLoading(true);
        const response = await fetch(`http://localhost:8000/api/events/${id}`, {
          credentials: "include",
        });
        if (!response.ok) throw new Error("Event not found");
        const data = await response.json();

        setEvent(data);
        setRegistered(data.is_registered || false);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load event");
        console.error("Error fetching event:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchEventDetail();
  }, [id]);

  // Fetch related events
  useEffect(() => {
    async function fetchRelatedEvents() {
      if (!event) return;

      try {
        const response = await fetch("http://localhost:8000/api/events");
        if (!response.ok) throw new Error("Failed to fetch related events");
        const data = await response.json();

        const currentTags = new Set(event.tags ?? []);

        const relatedByTags = data
          .map((e: any) => {
            const overlap = (e.tags ?? []).filter((t: string) => currentTags.has(t)).length;
            return { e, overlap };
          })
          .filter(({ e, overlap }: any) => e.id !== event.id && overlap > 0)
          .sort(
            (a: any, b: any) =>
              b.overlap - a.overlap || (b.e.attendee_count ?? 0) - (a.e.attendee_count ?? 0)
          )
          .slice(0, 6)
          .map(({ e }: any) => ({
            id: e.id,
            title: e.event_title,
            host: [e.organizer_role || "Organizer"],
            tags: e.tags || [],
            image: e.event_image,
            available: e.max_attendee ? e.max_attendee - e.attendee_count : 0,
            capacity: e.max_attendee || 100,
          }));

        const related = relatedByTags.length
          ? relatedByTags
          : data
              .filter((e: any) => e.id !== event.id)
              .slice(0, 6)
              .map((e: any) => ({
                id: e.id,
                title: e.event_title,
                host: [e.organizer_role || "Organizer"],
                tags: e.tags || [],
                image: e.event_image,
                available: e.max_attendee ? e.max_attendee - e.attendee_count : 0,
                capacity: e.max_attendee || 100,
              }));

        setRelatedEvents(related);
      } catch (err) {
        console.error("Error fetching related events:", err);
      }
    }

    fetchRelatedEvents();
  }, [event]);

  const handleRegister = async () => {
    if (registered || !event) return;

    try {
      setRegistering(true);
      function getCSRFToken() {
        const match = document.cookie.match(/csrftoken=([^;]+)/);
        return match ? match[1] : null;
      }

      const csrfToken = getCSRFToken();

      const response = await fetch(`http://localhost:8000/api/events/${id}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": csrfToken || "",
        },
        credentials: "include",
      });

      const data = await response.json();

      if (response.ok) {
        setRegistered(true);
        toast({
          text: data.message || "You have successfully registered for this event!",
          variant: "success",
          duration: 2500,
        });

        const eventResponse = await fetch(`http://localhost:8000/api/events/${id}`, {
          credentials: "include",
        });
        if (eventResponse.ok) {
          const updatedEvent = await eventResponse.json();
          setEvent(updatedEvent);
        }
      } else {
        toast({
          text: data.error || "Failed to register for event",
          variant: "error",
          duration: 2500,
        });
      }
    } catch (err) {
      console.error("Registration error:", err);
      toast({
        text: "An error occurred. Please try again.",
        variant: "error",
        duration: 2500,
      });
    } finally {
      setRegistering(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#E8ECFF]">
        <Navbar />
        <main className="mx-auto max-w-6xl px-4 py-16">
          <div className="flex items-center justify-center">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-solid border-[#6366F1] border-r-transparent"></div>
          </div>
          <p className="mt-4 text-center text-gray-600">Loading event...</p>
        </main>
      </div>
    );
  }

  // Error state
  if (error || !event) {
    return (
      <div className="min-h-screen bg-[#E8ECFF]">
        <Navbar />
        <main className="mx-auto max-w-6xl px-4 py-16">
          <p className="text-lg font-medium text-red-600">
            {error || "Event not found."}
          </p>
          <Link href="/events" className="mt-4 inline-block text-[#6366F1] hover:underline">
            ← Back to events
          </Link>
        </main>
      </div>
    );
  }

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
  const image = getImageUrl(event.image || event.event_image);
  const tagList = event.tags ?? [];
  const visibleTags = tagList.slice(0, 5);
  const hiddenTags = tagList.slice(5);

  return (
    <motion.div
      className="min-h-screen bg-[#E8ECFF]"
      variants={pageVariants}
      initial="initial"
      animate="animate"
    >
      <Navbar />

      <main className="mx-auto max-w-6xl px-4 py-10">
        {/* Hero Image */}
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
          className="mt-8 text-5xl font-extrabold tracking-tight text-[#0B1220]"
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
            <span className="relative group inline-block">
              <button
                type="button"
                className="inline-flex items-center rounded-md border border-black/10 bg-white px-3 py-1 text-xs font-semibold text-[#0B1220]"
              >
                +{hiddenTags.length}
              </button>

              <div
                className="pointer-events-none absolute left-1/2 z-50 mt-2 w-[min(420px,90vw)]
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
        <motion.section className="mt-6 rounded-2xl bg-white p-6 shadow-sm" variants={fadeUp}>
          <div className="flex flex-wrap items-end gap-2">
            <h2 className="text-xl font-bold text-[#0B1220]">About this event</h2>
            <p className="text-x1 text-[#0B1220]/70">
              Organized by <span className="font-semibold">{event.organizer_username}</span>
            </p>
          </div>

          <div className="mt-5 grid gap-6 md:grid-cols-2">
            <div>
              <p className="text-sm font-semibold text-[#0B1220]">Registration Period</p>
              <p className="mt-1 text-sm text-[#0B1220]">
                {formatDateGB(event.start_date_register)} -{" "}
                {formatDateGB(event.end_date_register)}
              </p>
            </div>

            <div>
              <p className="text-sm font-semibold text-[#0B1220]">Available Spot</p>
              <p className="mt-1 text-sm">
                <span
                  className={
                    isClosed ? "font-bold text-[#E11D48]" : "font-bold text-[#0B1220]"
                  }
                >
                  {available}
                </span>
                <span className="text-[#0B1220]">/{capacity}</span>
              </p>
            </div>
          </div>

          <div className="mt-6">
            <p className="text-sm font-semibold text-[#0B1220]">Description</p>
            <p className="mt-2 text-sm text-[#0B1220] whitespace-pre-wrap">
              {event.event_description || event.excerpt || "No description available."}
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
                className="inline-flex items-center rounded-lg bg-[#6366F1] px-4 py-3 text-sm font-semibold text-white hover:bg-[#4F46E5] transition-colors"
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

        {/* Comments and Ratings Section */}
        <CommentsRatingsSection eventId={Number(id)} isRegistered={registered} />

        {/* Related */}
        {relatedEvents.length > 0 && (
          <section className="mt-12">
            <h3 className="text-xl font-semibold text-[#0B1220]">Related Events</h3>
            <motion.div
              className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
              variants={staggerRow}
            >
              {relatedEvents.map((r) => (
                <Link key={r.id} href={`/events/${r.id}`}>
                  <RelatedCard item={r} />
                </Link>
              ))}
            </motion.div>
          </section>
        )}
      </main>

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

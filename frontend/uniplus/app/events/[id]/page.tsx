'use client';

import { use, useEffect, useState } from 'react';
import Link from "next/link";
import { useRouter } from 'next/navigation';
import Navbar from "../../components/navbar";
import { TagAccent } from "../../components/shared/Tag";
import { useAlert } from "../../components/ui/AlertProvider";
import { ChevronDown, Star, MessageCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/* ---------- Types ---------- */
type EventSession = {
  date: string;
  startTime: string;
  endTime: string;
};

type Comment = {
  id: number;
  user_id: number;
  user_name: string;
  user_profile_pic: string;
  content: string;
  content_created_at: string;
  content_updated_at: string;
};

type Rating = {
  id: number;
  user_id: number;
  user_name: string;
  rates: number;
  liked_date: string;
};

type EventCommentsResponse = {
  comments: Comment[];
  average_rating: number | null;
  total_ratings: number;
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
  tags?: string[];
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

/* ---------- Rating Stars Component ---------- */
function StarRating({ 
  rating, 
  onRatingChange,
  interactive = false,
  size = "md" 
}: { 
  rating: number;
  onRatingChange?: (rating: number) => void;
  interactive?: boolean;
  size?: "sm" | "md" | "lg";
}) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6"
  };

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => interactive && onRatingChange && onRatingChange(star)}
          disabled={!interactive}
          className={`${
            interactive 
              ? "cursor-pointer hover:scale-110 transition-transform" 
              : "cursor-default"
          } ${
            star <= rating 
              ? "text-yellow-400 fill-yellow-400" 
              : "text-gray-300"
          }`}
        >
          <Star className={sizeClasses[size]} />
        </button>
      ))}
    </div>
  );
}

/* ---------- Comments and Ratings Section ---------- */
function CommentsRatingsSection({ 
  eventId,
  isRegistered 
}: { 
  eventId: number;
  isRegistered: boolean;
}) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [averageRating, setAverageRating] = useState<number | null>(null);
  const [totalRatings, setTotalRatings] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [userRating, setUserRating] = useState(0);
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [showRatingForm, setShowRatingForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toast = useAlert();

  useEffect(() => {
    console.log(`Fetching comments for event ${eventId}`);
    fetchCommentsAndRatings();
  }, [eventId]);

  const fetchCommentsAndRatings = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log(`Making API call for event ${eventId}`);
      
      const response = await fetch(`http://localhost:8000/api/events/${eventId}/comments`, {
        credentials: 'include'
      });
      
      console.log(`Response status for event ${eventId}:`, response.status);
      
      if (response.ok) {
        const data: EventCommentsResponse = await response.json();
        console.log(`API response for event ${eventId}:`, data);
        
        setComments(data.comments || []);
        setAverageRating(data.average_rating);
        setTotalRatings(data.total_ratings || 0);
        
        console.log(`Set comments for event ${eventId}:`, data.comments?.length || 0);
      } else {
        const errorText = await response.text();
        console.error(`Failed to fetch comments for event ${eventId}:`, response.status, errorText);
        setError(`Failed to load comments: ${response.status}`);
        
        // Set empty state as fallback
        setComments([]);
        setAverageRating(null);
        setTotalRatings(0);
      }
    } catch (error) {
      console.error(`Error fetching comments for event ${eventId}:`, error);
      setError('Network error: Unable to fetch comments');
      
      // Set empty state as fallback
      setComments([]);
      setAverageRating(null);
      setTotalRatings(0);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!commentText.trim()) {
      toast({ text: "Please enter a comment", variant: "error" });
      return;
    }

    setSubmitting(true);
    try {
      const csrfRes = await fetch('http://localhost:8000/api/set-csrf-token', { 
        credentials: 'include' 
      });
      const { csrftoken } = await csrfRes.json();

      console.log(`Submitting comment for event ${eventId}:`, commentText);
      
      const response = await fetch(`http://localhost:8000/api/events/${eventId}/comments`, {
        method: 'POST',
        credentials: 'include',
        headers: { 
          'X-CSRFToken': csrftoken,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content: commentText.trim() })
      });

      const result = await response.json();
      console.log(`Comment submission response for event ${eventId}:`, result);
      
      if (response.ok) {
        toast({ text: "Comment submitted successfully", variant: "success" });
        setCommentText('');
        setShowCommentForm(false);
        // Refresh comments immediately after successful submission
        await fetchCommentsAndRatings();
      } else {
        const errorMsg = result.error || "Failed to submit comment";
        toast({ text: errorMsg, variant: "error" });
        setError(errorMsg);
      }
    } catch (error) {
      console.error('Error submitting comment:', error);
      const errorMsg = "Failed to submit comment - network error";
      toast({ text: errorMsg, variant: "error" });
      setError(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  // ... rest of your component code remains the same
  const handleSubmitRating = async (rating: number) => {
    setSubmitting(true);
    try {
      const csrfRes = await fetch('http://localhost:8000/api/set-csrf-token', { 
        credentials: 'include' 
      });
      const { csrftoken } = await csrfRes.json();

      const response = await fetch(`http://localhost:8000/api/events/${eventId}/ratings`, {
        method: 'POST',
        credentials: 'include',
        headers: { 
          'X-CSRFToken': csrftoken,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ rates: rating })
      });

      const result = await response.json();
      if (response.ok) {
        toast({ text: "Rating submitted successfully", variant: "success" });
        setShowRatingForm(false);
        fetchCommentsAndRatings();
      } else {
        toast({ text: result.error || "Failed to submit rating", variant: "error" });
      }
    } catch (error) {
      console.error('Error submitting rating:', error);
      toast({ text: "Failed to submit rating", variant: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <section className="mt-6 rounded-2xl bg-white p-6 shadow-sm">
        <div className="text-center text-gray-600">Loading comments...</div>
      </section>
    );
  }

  return (
    <section className="mt-6 rounded-2xl bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-[#0B1220]">Comments & Ratings</h3>
        
        {/* Overall Rating Summary */}
        {averageRating !== null && (
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="flex items-center gap-2">
                <StarRating rating={Math.round(averageRating)} size="md" />
                <span className="text-lg font-bold text-[#0B1220]">
                  {averageRating.toFixed(1)}
                </span>
              </div>
              <p className="text-sm text-gray-600">
                {totalRatings} rating{totalRatings !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons for Registered Users */}
      {isRegistered && (
        <div className="flex gap-3 mb-6">
          <button
            onClick={() => {
              setShowCommentForm(!showCommentForm);
              setShowRatingForm(false);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-[#0B1220] hover:bg-gray-50 transition-colors"
          >
            <MessageCircle className="h-4 w-4" />
            {showCommentForm ? 'Cancel Comment' : 'Write Comment'}
          </button>
          
          <button
            onClick={() => {
              setShowRatingForm(!showRatingForm);
              setShowCommentForm(false);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-[#0B1220] hover:bg-gray-50 transition-colors"
          >
            <Star className="h-4 w-4" />
            {showRatingForm ? 'Cancel Rating' : 'Add Rating'}
          </button>
        </div>
      )}

      {/* Comment Form */}
      <AnimatePresence>
        {showCommentForm && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mb-6"
          >
            <div className="border border-gray-200 rounded-lg p-4">
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Share your thoughts about this event..."
                className="w-full h-24 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-[#6366F1] focus:border-transparent text-black"
                disabled={submitting}
              />
              <div className="flex justify-end gap-2 mt-3">
                <button
                  onClick={() => setShowCommentForm(false)}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitComment}
                  disabled={submitting || !commentText.trim()}
                  className="px-4 py-2 bg-[#6366F1] text-white text-sm font-medium rounded-lg hover:bg-[#4F46E5] transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit Comment'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Rating Form */}
      <AnimatePresence>
        {showRatingForm && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mb-6"
          >
            <div className="border border-gray-200 rounded-lg p-4">
              <p className="text-sm font-medium text-[#0B1220] mb-3">Rate this event</p>
              <div className="flex items-center gap-4">
                <StarRating 
                  rating={userRating} 
                  onRatingChange={setUserRating}
                  interactive={true}
                  size="lg"
                />
                <span className="text-sm text-gray-600">
                  {userRating > 0 ? `${userRating} star${userRating !== 1 ? 's' : ''}` : 'Select rating'}
                </span>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button
                  onClick={() => setShowRatingForm(false)}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleSubmitRating(userRating)}
                  disabled={submitting || userRating === 0}
                  className="px-4 py-2 bg-[#6366F1] text-white text-sm font-medium rounded-lg hover:bg-[#4F46E5] transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit Rating'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Comments List */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <MessageCircle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>No comments yet.</p>
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="border-b border-gray-100 pb-4 last:border-0">
              <div className="flex items-start gap-3">
                <img
                  src={comment.user_profile_pic || "/images/default-avatar.png"}
                  alt={comment.user_name}
                  className="h-10 w-10 rounded-full object-cover"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-[#0B1220]">{comment.user_name}</h4>
                    <span className="text-xs text-gray-500">
                      {new Date(comment.content_created_at).toLocaleDateString('en-GB')}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-[#0B1220]">{comment.content}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Not Registered Message */}
      {!isRegistered && comments.length === 0 && averageRating === null && (
        <div className="text-center py-8 text-gray-500">
          <p>Attend this event to see and leave comments and ratings</p>
        </div>
      )}
    </section>
  );
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
  const [relatedEvents, setRelatedEvents] = useState<EventWithOptionals[]>([]);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [message, setMessage] = useState('');
  const [isRegistered, setIsRegistered] = useState(false);
  const router = useRouter();
  const toast = useAlert();

  useEffect(() => {
    fetchEventDetail();
    fetchRelatedEvents();
  }, [id]);

  const fetchEventDetail = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/events/${id}`, { 
        credentials: 'include' 
      });
      if (response.ok) {
        const data = await response.json();
        setEvent(data);
        setIsRegistered(data.is_registered || false);
      } else {
        console.error('Failed to fetch event:', response.status);
      }
    } catch (error) {
      console.error('Error fetching event:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatedEvents = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/events/', { 
        credentials: 'include' 
      });
      if (response.ok) {
        const data = await response.json();
        const filtered = Array.isArray(data) 
          ? data.filter((e: EventWithOptionals) => e.id !== Number(id)).slice(0, 6)
          : [];
        setRelatedEvents(filtered);
      }
    } catch (error) {
      console.error('Error fetching related events:', error);
    }
  };

  const handleRegister = async () => {
    setRegistering(true);
    setMessage('');
    try {
      const csrfRes = await fetch('http://localhost:8000/api/set-csrf-token', { 
        credentials: 'include' 
      });
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
        setIsRegistered(true);
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

  // IMAGE FIX: Ensure proper image URL handling
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
          <img 
            src={image} 
            alt={event.title} 
            className="h-[420px] w-full object-cover"
            onError={(e) => {
              console.error('Image failed to load:', image);
              e.currentTarget.src = "https://images.unsplash.com/photo-1604908176997-431651c0d2dc?q=80&w=1200&auto=format&fit=crop";
            }}
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

        {/* Detailed Schedule (collapsible) */}
        {schedule.length > 0 && <ScheduleList schedule={schedule} />}

        {/* Comments and Ratings Section */}
        <CommentsRatingsSection eventId={Number(id)} isRegistered={isRegistered} />

        {/* Register button */}
        <button
          onClick={handleRegister}
          disabled={registering || isClosed || isRegistered}
          className={`mt-6 block w-full rounded-lg px-4 py-3 text-center text-sm font-semibold
            ${
              isClosed || isRegistered
                ? "bg-[#C7CBE0] text-[#3A3F55] cursor-default"
                : "bg-[#6366F1] text-white hover:bg-[#4F46E5] transition-colors"
            }`}
        >
          {isRegistered ? "Already Registered" : isClosed ? "Closed" : registering ? "Registering..." : "Register"}
        </button>

        {message && (
          <p className="mt-3 text-center text-sm text-[#0B1220]">{message}</p>
        )}

        {/* Related Events */}
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
  // IMAGE FIX: Ensure proper image URL handling for related cards
  const img = item.image 
    ? (item.image.startsWith('http') ? item.image : `http://localhost:8000${item.image}`)
    : "https://images.unsplash.com/photo-1604908176997-431651c0d2dc?q=80&w=1200&auto=format&fit=crop";

  const available = item.available ?? 0;
  const capacity = item.capacity ?? 100;
  const badge = item.host?.[0] ?? item.tags?.[0] ?? "Organizer";

  return (
    <Link
      href={`/events/${item.id}`}
      className="block rounded-xl bg-white shadow-sm transition hover:shadow-md"
    >
      <img 
        src={img} 
        alt={item.title} 
        className="h-40 w-full rounded-t-xl object-cover"
        onError={(e) => {
          e.currentTarget.src = "https://images.unsplash.com/photo-1604908176997-431651c0d2dc?q=80&w=1200&auto=format&fit=crop";
        }}
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
    </Link>
  );
}
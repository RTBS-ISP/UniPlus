'use client';

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from 'next/navigation';
import Navbar from "../../components/navbar";
import { TagAccent } from "../../components/shared/Tag";
import { useAlert } from "../../components/ui/AlertProvider";
import { ChevronDown, Check, Lock, ChevronRight, Star, MessageCircle } from "lucide-react";
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

type EventDetail = {
  id: number;
  title: string;
  event_title: string;
  event_description: string;
  excerpt: string;
  organizer_username: string;
  organier_role: string;
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
  return null;
}

// Helper function to get full image URL
const getImageUrl = (imagePath: string | null) => {
  if (!imagePath) return "https://images.unsplash.com/photo-1604908176997-431651c0d2dc?q=80&w=1200&auto=format&fit=crop";
    
  // If a full URL already returned
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
    
  // Otherwise, prefix with backend URL
  return `http://localhost:8000${imagePath.startsWith('/') ? '' : '/'}${imagePath}`;
};

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
/* ---------- RegisterCTA ---------- */
function RegisterCTA({
  disabled,
  success,
  onClick,
  loading,
}: {
  disabled: boolean;
  success: boolean;
  onClick: () => void;
  loading: boolean;
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
    if (success || loading) return;

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
  const label = loading ? "Registering..." : disabled ? "Closed" : success ? "Registered" : "Register";

  return (
    <motion.button
      type="button"
      aria-disabled={disabled}
      onClick={handleClick}
      disabled={success || loading}
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
/* ---------- Event Detail Page ---------- */
export default function EventDetailPage({ params }: Params) {
  const { id } = use(params);
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [relatedEvents, setRelatedEvents] = useState<any[]>([]);
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
          credentials: 'include'
        });
        if (!response.ok) throw new Error('Event not found');
        const data = await response.json();
        
        console.log(data)
        setEvent(data);
        setRegistered(data.is_registered || false);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load event');
        console.error('Error fetching event:', err);
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
        const response = await fetch('http://localhost:8000/api/events');
        if (!response.ok) throw new Error('Failed to fetch related events');
        const data = await response.json();
        
        const currentTags = new Set(event.tags ?? []);
        
        // Find events with overlapping tags
        const relatedByTags = data
          .map((e: any) => {
            const overlap = (e.tags ?? []).filter((t: string) => currentTags.has(t)).length;
            return { e, overlap };
          })
          .filter(({ e, overlap }: any) => e.id !== event.id && overlap > 0)
          .sort((a: any, b: any) => 
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
        
        // Fallback to first 6 events if no tag overlap
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
        console.error('Error fetching related events:', err);
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
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken || '',
        },
        credentials: 'include',
      });

      const data = await response.json();

      if (response.ok) {
        setRegistered(true);
        toast({
          text: data.message || "You have successfully registered for this event!",
          variant: "success",
          duration: 2500,
        });
        
        // Refresh event data to get updated available spots
        const eventResponse = await fetch(`http://localhost:8000/api/events/${id}`, {
          credentials: 'include'
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
      console.error('Registration error:', err);
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
          <p className="text-lg font-medium text-red-600">{error || "Event not found."}</p>
          <Link href="/events" className="mt-4 inline-block text-[#6366F1] hover:underline">
            ← Back to events
          </Link>
        </main>
      </div>
    );
  }

  const hostLabel = event.organizer_role ? event.organizer_role.charAt(0).toUpperCase() + event.organizer_role.slice(1).toLowerCase(): "Organizer"
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
    <div className="min-h-screen bg-[#E8ECFF]">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-10">
        {/* Hero image */}
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
        <h1 className="mt-8 text-5xl font-extrabold tracking-tight text-[#0B1220]">
          {event.title}
        </h1>

        {/* Tags */}
        <motion.div className="mt-3 flex flex-wrap gap-2" variants={staggerRow}>
          <HostPill label={hostLabel} />
          {/* General tags */}
          {visibleTags.map((t) => (
            <motion.span
              key={t}
              className="inline-flex items-center rounded-md border border-black/10 bg-white px-3 py-1 text-xs font-semibold text-[#0B1220]"
            >
              {t}
            </motion.span>
          ))}

          {/* +N hovercard */}
          {hiddenTags.length > 0 && (
            <span className="relative group inline-block">
              <button
                type="button"
                className="inline-flex items-center rounded-md bg-[#E8EEFF] px-2 py-1 text-xs font-semibold text-[#1F2A44]"
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
                {formatDateGB(event.start_date_register)} - {formatDateGB(event.end_date_register)}
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
                  <span className="text-[#0B1220]">TBD</span>
                )}
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="mt-6">
            <p className="text-sm font-semibold text-[#0B1220]">Description</p>
            <p className="mt-2 text-sm text-[#0B1220] whitespace-pre-wrap">
              {event.event_description || event.excerpt || "No description available."}
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
function RelatedCard({ item }: { item: any }) {
  const img = getImageUrl(item.image);

  const available = item.available ?? 0;
  const capacity = item.capacity ?? 100;
  const badge = item.host?.[0] ?? (Array.isArray(item.tags) ? item.tags[0] : "Organizer");

  return (
    <Link
      href={`/events/${item.id}`}
      className="block rounded-xl bg-white shadow-sm transition hover:shadow-md"
    >
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
          {hostLabel && <HostPill label={hostLabel} />}
          {!hostLabel && tagLabel && (
            <span className="inline-flex items-center rounded-md border border-black/10 bg-white px-3 py-1 text-xs font-semibold text-[#0B1220]">
              {tagLabel}
            </span>
          )}
        </div>
        <p className="mt-1 text-sm text-gray-600">
          Available: {available}/{capacity}
        </p>
      </div>
    </Link>
  );
}
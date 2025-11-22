import { useEffect, useState } from "react";
import { MessageCircle, Star } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useAlert } from "../../components/ui/AlertProvider"; 

type Comment = {
  id: number;
  user_id: number;
  user_name: string;
  user_profile_pic: string;
  content: string;
  content_created_at: string;
  content_updated_at: string;
};

type EventCommentsResponse = {
  comments: Comment[];
  average_rating: number | null;
  total_ratings: number;
};

function StarRating({
  rating,
  onRatingChange,
  interactive = false,
  size = "md",
}: {
  rating: number;
  onRatingChange?: (rating: number) => void;
  interactive?: boolean;
  size?: "sm" | "md" | "lg";
}) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
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
            interactive ? "cursor-pointer hover:scale-110 transition-transform" : "cursor-default"
          } ${
            star <= rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
          }`}
        >
          <Star className={sizeClasses[size]} />
        </button>
      ))}
    </div>
  );
}

// Helper to get profile picture URL with fallback
const getProfilePicUrl = (profilePic: string | null | undefined) => {
  if (!profilePic) return "/images/logo.png";

  if (profilePic.startsWith("http://") || profilePic.startsWith("https://")) {
    return profilePic;
  }

  if (profilePic === "/images/logo.png") {
    return profilePic;
  }

  return `http://localhost:8000${profilePic.startsWith("/") ? "" : "/"}${profilePic}`;
};

export function CommentsRatingsSection({
  eventId,
  isRegistered,
}: {
  eventId: number;
  isRegistered: boolean;
}) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [averageRating, setAverageRating] = useState<number | null>(null);
  const [totalRatings, setTotalRatings] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [userRating, setUserRating] = useState(0);
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [showRatingForm, setShowRatingForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toast = useAlert();

  useEffect(() => {
    fetchCommentsAndRatings();
  }, [eventId]);

  const fetchCommentsAndRatings = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `http://localhost:8000/api/events/${eventId}/comments`,
        { credentials: "include" }
      );

      if (response.ok) {
        const data: EventCommentsResponse = await response.json();

        setComments(data.comments || []);
        setAverageRating(data.average_rating);
        setTotalRatings(data.total_ratings || 0);
      } else {
        const errorText = await response.text();
        setError(`Failed to load comments: ${response.status}`);
        setComments([]);
        setAverageRating(null);
        setTotalRatings(0);
        console.error("Failed to fetch comments:", response.status, errorText);
      }
    } catch (err) {
      console.error("Error fetching comments:", err);
      setError("Network error: Unable to fetch comments");
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
      const csrfRes = await fetch("http://localhost:8000/api/set-csrf-token", {
        credentials: "include",
      });
      const { csrftoken } = await csrfRes.json();

      const response = await fetch(
        `http://localhost:8000/api/events/${eventId}/comments`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "X-CSRFToken": csrftoken,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ content: commentText.trim() }),
        }
      );

      const result = await response.json();
      if (response.ok) {
        toast({ text: "Comment submitted successfully", variant: "success" });
        setCommentText("");
        setShowCommentForm(false);
        await fetchCommentsAndRatings();
      } else {
        const errorMsg = result.error || "Failed to submit comment";
        toast({ text: errorMsg, variant: "error" });
        setError(errorMsg);
      }
    } catch (err) {
      console.error("Error submitting comment:", err);
      const errorMsg = "Failed to submit comment - network error";
      toast({ text: errorMsg, variant: "error" });
      setError(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitRating = async (rating: number) => {
    setSubmitting(true);
    try {
      const csrfRes = await fetch("http://localhost:8000/api/set-csrf-token", {
        credentials: "include",
      });
      const { csrftoken } = await csrfRes.json();

      const response = await fetch(
        `http://localhost:8000/api/events/${eventId}/ratings`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "X-CSRFToken": csrftoken,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ rates: rating }),
        }
      );

      const result = await response.json();
      if (response.ok) {
        toast({ text: "Rating submitted successfully", variant: "success" });
        setShowRatingForm(false);
        fetchCommentsAndRatings();
      } else {
        toast({
          text: result.error || "Failed to submit rating",
          variant: "error",
        });
      }
    } catch (err) {
      console.error("Error submitting rating:", err);
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
                {totalRatings} rating{totalRatings !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
        )}
      </div>

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
            {showCommentForm ? "Cancel Comment" : "Write Comment"}
          </button>

          <button
            onClick={() => {
              setShowRatingForm(!showRatingForm);
              setShowCommentForm(false);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-[#0B1220] hover:bg-gray-50 transition-colors"
          >
            <Star className="h-4 w-4" />
            {showRatingForm ? "Cancel Rating" : "Add Rating"}
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
                  {submitting ? "Submitting..." : "Submit Comment"}
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
              <p className="text-sm font-medium text-[#0B1220] mb-3">
                Rate this event
              </p>
              <div className="flex items-center gap-4">
                <StarRating
                  rating={userRating}
                  onRatingChange={setUserRating}
                  interactive={true}
                  size="lg"
                />
                <span className="text-sm text-gray-600">
                  {userRating > 0
                    ? `${userRating} star${userRating !== 1 ? "s" : ""}`
                    : "Select rating"}
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
                  {submitting ? "Submitting..." : "Submit Rating"}
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
                  src={getProfilePicUrl(comment.user_profile_pic)}
                  alt={comment.user_name}
                  className="h-10 w-10 rounded-full object-cover"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-[#0B1220]">{comment.user_name}</h4>
                    <span className="text-xs text-gray-500">
                      {new Date(comment.content_created_at).toLocaleDateString("en-GB")}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-[#0B1220]">{comment.content}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {!isRegistered && comments.length === 0 && averageRating === null && (
        <div className="text-center py-8 text-gray-500">
          <p>Attend this event to see and leave comments and ratings</p>
        </div>
      )}
    </section>
  );
}

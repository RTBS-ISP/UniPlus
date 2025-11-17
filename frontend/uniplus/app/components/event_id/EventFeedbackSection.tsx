"use client";

import { useState, useEffect } from "react";
import { Star } from "lucide-react";
import { motion } from "framer-motion";
import { useAlert } from "../ui/AlertProvider";

type FeedbackProps = {
  eventId: number;
  isRegistered: boolean;
  hasEventEnded: boolean;
};

type StarPickerProps = {
  rating: number;
  onChange: (value: number) => void;
};

function StarPicker({ rating, onChange }: StarPickerProps) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((val) => (
        <motion.button
          key={val}
          type="button"
          onClick={() => onChange(val)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className={`${
            val <= rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
          } cursor-pointer transition-colors`}
        >
          <Star className="h-5 w-5" />
        </motion.button>
      ))}
    </div>
  );
}

export function EventFeedbackSection({
  eventId,
  isRegistered,
  hasEventEnded,
}: FeedbackProps) {
  const toast = useAlert();
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);

  // Load existing feedback (keeps UI locked after refresh)
  useEffect(() => {
    if (!isRegistered || !hasEventEnded) return;

    (async () => {
      try {
        const res = await fetch(
          `http://localhost:8000/api/events/${eventId}/feedback/me`,
          { credentials: "include" }
        );

        if (res.ok) {
          const data = await res.json();
          setRating(data.rating || 0);
          setFeedback(data.comment || "");
          setAlreadySubmitted(true);
        }
      } catch (err) {
        console.error("Error loading existing feedback:", err);
      }
    })();
  }, [eventId, isRegistered, hasEventEnded]);

  // No section if not eligible
  if (!isRegistered || !hasEventEnded) return null;

  const handleSubmit = async () => {
    if (!rating) {
      toast({
        text: "Please give a rating before submitting feedback.",
        variant: "error",
      });
      return;
    }

    setSubmitting(true);
    try {
      // get CSRF token
      const csrfRes = await fetch("http://localhost:8000/api/set-csrf-token", {
        credentials: "include",
      });
      const { csrftoken } = await csrfRes.json();

      const res = await fetch(
        `http://localhost:8000/api/events/${eventId}/feedback`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": csrftoken,
          },
          body: JSON.stringify({
            rating,
            comment: feedback.trim(),
          }),
        }
      );

      const data = await res.json();

      if (res.ok) {
        toast({ text: "Thank you for your feedback!", variant: "success" });
        setAlreadySubmitted(true);
      } else {
        // If backend says "already submitted", also lock UI
        if (data.error?.includes("already submitted")) {
          setAlreadySubmitted(true);
        }

        toast({
          text: data.error || "Failed to submit feedback",
          variant: "error",
        });
      }
    } catch (err) {
      console.error("Error submitting feedback:", err);
      toast({
        text: "Network error while submitting feedback",
        variant: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.section
      className="mt-6 rounded-2xl bg-white p-6 shadow-sm"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 26 }}
      layout
    >
      <div className="flex items-center justify-between mb-4">
        <motion.h3
          className="text-lg font-bold text-[#0B1220]"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.05 }}
        >
          Event Feedback
        </motion.h3>

        {alreadySubmitted && (
          <motion.span
            className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            Feedback submitted
          </motion.span>
        )}
      </div>

      <p className="text-sm text-[#0B1220]/70 mb-4">
        Share your overall experience for this event. Your feedback helps
        organizers improve future activities.
      </p>

      <div className="space-y-4">
        {/* Rating */}
        <div>
          <p className="text-sm font-semibold text-[#0B1220] mb-2">
            Your rating
          </p>
          <StarPicker rating={rating} onChange={setRating} />
        </div>

        {/* Comment */}
        <div>
          <p className="text-sm font-semibold text-[#0B1220] mb-2">
            Your feedback (optional)
          </p>
          <textarea
            className="w-full h-24 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-[#6366F1] focus:border-transparent text-black"
            placeholder="What did you like? What could be improved?"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            disabled={submitting || alreadySubmitted}
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={submitting || alreadySubmitted}
            onClick={() => {
              if (submitting || alreadySubmitted) return;
              setRating(0);
              setFeedback("");
            }}
          >
            Clear
          </button>

          <motion.button
            type="button"
            className="px-4 py-2 bg-[#6366F1] text-white text-sm font-medium rounded-lg hover:bg-[#4F46E5] transition-colors disabled:opacity-50"
            whileHover={!submitting && !alreadySubmitted ? { y: -1 } : {}}
            whileTap={!submitting && !alreadySubmitted ? { scale: 0.97 } : {}}
            disabled={submitting || alreadySubmitted}
            onClick={handleSubmit}
          >
            {alreadySubmitted
              ? "Feedback sent"
              : submitting
              ? "Submitting..."
              : "Submit feedback"}
          </motion.button>
        </div>
      </div>
    </motion.section>
  );
}

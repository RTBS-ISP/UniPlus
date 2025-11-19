"use client";

import { Star, User, FileDown, MessageCircle } from "lucide-react";
import type { EventFeedback } from "./FeedbackPanel";
import { useAlert } from "@/app/components/ui/AlertProvider";

type Props = {
  feedbacks: EventFeedback[];
  onExport?: () => void;
  aiSummary?: string;
  aiSummaryLoading?: boolean;
};

export function FeedbackSummarySidebar({
  feedbacks,
  onExport,
  aiSummary,
  aiSummaryLoading,
}: Props) {
  const showAlert = useAlert();

  const total = feedbacks.length;
  const avg =
    total > 0 ? feedbacks.reduce((sum, f) => sum + f.rating, 0) / total : 0;

  const ratingCounts = [1, 2, 3, 4, 5].map((r) => ({
    rating: r,
    count: feedbacks.filter((f) => f.rating === r).length,
  }));

  /* ------------------------------
    Comment + Anonymous stats
  ------------------------------ */

  const anonymousCount = feedbacks.filter((f) => f.anonymous).length;
  const anonymousPercent =
    total > 0 ? Math.round((anonymousCount / total) * 100) : 0;

  const commentsWithText = feedbacks.filter(
    (f) => f.comment && f.comment.trim().length > 0
  );
  const hasComments = commentsWithText.length > 0;

  const commentsCount = commentsWithText.length;
  const commentsPercent =
    total > 0 ? Math.round((commentsCount / total) * 100) : 0;

  const avgCommentLength =
    commentsCount > 0
      ? Math.round(
          commentsWithText.reduce(
            (sum, f) => sum + (f.comment?.length || 0),
            0
          ) / commentsCount
        )
      : 0;

  let commentLengthLabel = "No written comments yet.";
  if (commentsCount > 0) {
    if (avgCommentLength < 40) commentLengthLabel = "Most comments are short.";
    else if (avgCommentLength < 120)
      commentLengthLabel = "Most comments are medium length.";
    else commentLengthLabel = "Most comments are quite detailed.";
  }

  /* ------------------------------
      Highlight comment logic
  ------------------------------ */

  const strongPositive = commentsWithText
    .filter((f) => f.rating >= 4 && f.comment!.trim().length >= 30)
    .sort((a, b) => {
      const ratingDiff = b.rating - a.rating;
      if (ratingDiff !== 0) return ratingDiff;
      return b.comment!.length - a.comment!.length;
    })[0];

  const strongNegative = commentsWithText
    .filter((f) => f.rating <= 2 && f.comment!.trim().length >= 30)
    .sort((a, b) => {
      const ratingDiff = a.rating - b.rating;
      if (ratingDiff !== 0) return ratingDiff;
      return b.comment!.length - a.comment!.length;
    })[0];

  const detailedHighlight = commentsWithText
    .filter(
      (f) => f.id !== strongPositive?.id && f.id !== strongNegative?.id
    )
    .slice()
    .sort((a, b) => (b.comment!.length || 0) - (a.comment!.length || 0))[0];

  const topComments = [
    strongPositive,
    strongNegative,
    detailedHighlight,
  ].filter(Boolean) as EventFeedback[];

  const hasAISummary = !!aiSummary && aiSummary.trim().length > 0;

  return (
    <aside className="lg:sticky lg:top-24 h-fit rounded-lg bg-white shadow-sm p-6 border border-gray-100 space-y-5">
      {/* Header */}
      <div>
        <h2 className="text-base font-semibold text-gray-900">
          Feedback summary
        </h2>
        <p className="text-xs text-gray-500 mt-1">
          Short overview you can reuse in your event report.
        </p>
      </div>

      {/* Rating + Total */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-md bg-indigo-50 px-3 py-2 flex flex-col gap-1">
          <span className="text-[11px] uppercase tracking-wide text-indigo-600 font-semibold">
            Average rating
          </span>
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
            <span className="text-base font-bold text-gray-900">
              {avg.toFixed(1)}/5
            </span>
          </div>
        </div>

        <div className="rounded-md bg-slate-50 px-3 py-2 flex flex-col gap-1">
          <span className="text-[11px] uppercase tracking-wide text-slate-600 font-semibold">
            Total feedback
          </span>
          <div className="flex items-center gap-1 text-gray-900">
            <User className="w-4 h-4" />
            <span className="text-base font-bold">{total}</span>
          </div>
        </div>
      </div>

      {/* FULL-WIDTH Anonymous responses */}
      <div className="rounded-md bg-emerald-50 px-3 py-2 flex flex-col gap-1">
        <span className="text-[11px] uppercase tracking-wide text-emerald-700 font-semibold">
          Anonymous responses
        </span>
        <div className="flex items-baseline justify-between">
          <span className="text-sm text-gray-900">
            {anonymousCount} of {total || 0} feedbacks
          </span>
          <span className="text-base font-bold text-emerald-700">
            {isNaN(anonymousPercent) ? 0 : anonymousPercent}%
          </span>
        </div>
      </div>

      {/* FULL-WIDTH Comment coverage */}
      <div className="rounded-md bg-slate-50 px-3 py-2 flex flex-col gap-1">
        <span className="text-[11px] uppercase tracking-wide text-slate-700 font-semibold">
          Comment coverage
        </span>
        <div className="flex items-baseline justify-between">
          <span className="text-sm text-gray-900">
            {commentsCount} of {total || 0} feedbacks
          </span>
          <span className="text-base font-bold text-slate-700">
            {commentsPercent}%
          </span>
        </div>

        <p className="text-[11px] text-gray-500">{commentLengthLabel}</p>
      </div>

      {/* Rating distribution */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-gray-700">
          Rating distribution
        </p>

        <div className="space-y-1">
          {ratingCounts
            .slice()
            .reverse()
            .map(({ rating, count }) => {
              const pct = total > 0 ? (count / total) * 100 : 0;
              return (
                <div key={rating} className="flex items-center gap-2 text-xs">
                  <span className="w-6 text-right text-gray-600">
                    {rating}★
                  </span>
                  <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-indigo-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-8 text-right text-gray-500">{count}</span>
                </div>
              );
            })}
        </div>
      </div>

      {/* AI summary */}
      <div className="space-y-1">
        <p className="text-xs font-semibold text-gray-700 flex items-center gap-1">
          <MessageCircle className="w-3 h-3" />
          Summary note
        </p>

        <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-wrap">
          {!hasComments
            ? "No written feedback yet. Once attendees leave comments, an AI summary will appear here."
            : aiSummaryLoading
            ? "Generating AI summary from attendee feedback..."
            : hasAISummary
            ? aiSummary
            : "AI summary unavailable."}
        </p>
      </div>

      {/* Highlighted comments */}
      {topComments.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs font-semibold text-gray-700">
            Highlighted comments
          </p>

          <ul className="space-y-2">
            {topComments.map((fb) => (
              <li
                key={fb.id}
                className="rounded-md bg-slate-50 px-3 py-2 text-xs text-gray-700 whitespace-pre-wrap line-clamp-3"
              >
                {fb.comment}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Export */}
      <button
        type="button"
        onClick={() => {
          onExport?.();
          showAlert({
            text: "Feedback report saved successfully.",
            variant: "success",
          });
        }}
        className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-md bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors disabled:opacity-60"
      >
        <FileDown className="w-4 h-4" />
        Save full report
      </button>
    </aside>
  );
}

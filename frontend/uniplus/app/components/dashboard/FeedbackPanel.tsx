"use client";

import { Star } from "lucide-react";

export type EventFeedback = {
  id: number;
  rating: number;
  comment?: string | null;
  created_at: string;
  user_name: string;
  user_email: string | null;
};

export function FeedbackPanel({ feedbacks }: { feedbacks: EventFeedback[] }) {
  const total = feedbacks.length;
  const avg =
    total > 0 ? feedbacks.reduce((sum, f) => sum + f.rating, 0) / total : 0;

  return (
    <>
      {/* Overview card */}
      <div className="rounded-lg shadow-sm p-8 mb-8 bg-white">
        <div className="text-xl font-bold text-gray-900 mb-2">
          Feedback overview
        </div>

        {total === 0 ? (
          <p className="text-sm text-gray-600">
            No feedback has been submitted for this event yet.
          </p>
        ) : (
          <p className="text-sm text-gray-700 flex flex-wrap items-center gap-2">
            <span>
              {total} feedback entr{total === 1 ? "y" : "ies"}
            </span>
            <span>·</span>
            <span className="inline-flex items-center gap-1">
              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
              <span className="font-semibold">
                {avg.toFixed(1)}/5 average rating
              </span>
            </span>
          </p>
        )}
      </div>

      {/* List card */}
      <div className="rounded-lg shadow-sm p-8 bg-white">
        <div className="flex justify-between items-center mb-4">
          <div className="text-gray-800 text-2xl font-bold">Event Feedback</div>
        </div>

        {total === 0 ? (
          <p className="text-sm text-gray-600">
            No feedback yet. Once attendees submit their feedback, it will
            appear here.
          </p>
        ) : (
          <ul className="divide-y divide-gray-200">
            {feedbacks.map((fb) => (
              <li key={fb.id} className="py-4 flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <div>
                    {/* show name exactly how backend sends it */}
                    <div className="text-sm font-semibold text-gray-900">
                      {fb.user_name}
                    </div>

                    {/* only show email if not anonymous */}
                    {fb.user_email && (
                      <div className="text-xs text-gray-500">
                        {fb.user_email}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1 text-yellow-500">
                    <Star className="w-4 h-4 fill-yellow-400" />
                    <span className="text-sm font-semibold text-gray-800">
                      {fb.rating}/5
                    </span>
                  </div>
                </div>

                {fb.comment && fb.comment.trim() && (
                  <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">
                    {fb.comment}
                  </p>
                )}

                <div className="text-xs text-gray-400 mt-1">
                  {new Date(fb.created_at).toLocaleString()}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}

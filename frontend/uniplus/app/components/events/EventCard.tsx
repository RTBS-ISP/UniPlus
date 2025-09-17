import { ChevronRight } from "lucide-react";
import { Tag, TagAccent, TagCounter } from "../shared/Tag";

export type EventItem = {
  id: number;
  title: string;
  host: string[];
  tags: string[];
  excerpt: string;
  date: string;
  createdAt: string;
  popularity: number;

  // optional extra fields used by detail pages / dataset
  available?: number;
  startDate?: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  image?: string;
};

export default function EventCard({ item }: { item: EventItem }) {
  const hostBadge = item.host?.[0] ?? "Organizer";

  // Filter tags (remove accidental "Attendees")
  const audience = item.tags.filter((t) => t.toLowerCase() !== "attendees");
  const extra = Math.max(0, audience.length - 4);
  const visibleTags = audience.slice(0, 4);
  const hiddenTags = audience.slice(4);

  return (
    <div
      className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm
                 transition-transform duration-300 hover:-translate-y-1 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="text-xl text-black font-semibold leading-tight">{item.title}</h3>

          {/* Host + Attendees in one row */}
          <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-gray-500">
            <span className="font-medium">Host</span>
            <TagAccent label={hostBadge} />

            <span className="ml-4 font-medium">Attendees</span>
            {visibleTags.map((t, i) => (
              <Tag key={i} label={t} />
            ))}

            {/* +N with hover/focus tooltip of hidden tags */}
            {extra > 0 && (
              <span className="relative group inline-block">
                <button
                  type="button"
                  aria-haspopup="true"
                  aria-label={`Show ${extra} more attendee tags`}
                  className="focus:outline-none"
                >
                  <TagCounter count={extra} />
                </button>

                {/* Wider hovercard */}
                <div
                  className="pointer-events-none absolute left-1/2 z-50 mt-2
                             w-[min(480px,90vw)] -translate-x-1/2
                             rounded-xl border border-gray-200 bg-white/95 p-3 shadow-lg backdrop-blur
                             opacity-0 scale-95 transition-all duration-150
                             group-hover:opacity-100 group-hover:scale-100
                             group-focus-within:opacity-100 group-focus-within:scale-100"
                  role="dialog"
                >
                  <div className="flex flex-wrap gap-2">
                    {hiddenTags.map((t, i) => (
                      <Tag key={i} label={t} />
                    ))}
                  </div>
                </div>
              </span>
            )}
          </div>

          {/* Excerpt */}
          <p className="mt-3 max-w-[62ch] break-words text-sm text-gray-600">
            {item.excerpt}
          </p>
        </div>

        {/* More button with hover animation */}
        <button
          className="mt-1 inline-flex items-center gap-1 rounded-full bg-black px-3 py-1.5
                     text-xs font-medium text-white transition-transform duration-200
                     hover:scale-105 hover:shadow-lg hover:bg-gray-800 active:scale-95"
          onClick={() => (window.location.href = `/events/${item.id}`)}
        >
          More <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

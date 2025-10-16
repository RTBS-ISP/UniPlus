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
  available?: number;
  startDate?: string;
  endDate?: string;
  location?: string;
  image?: string;
  hostRole?: string; 
};

export default function EventCard({ item }: { item: EventItem }) {
  const hostName = item.host?.[0] ?? "Organizer";
  const hostRole = item.hostRole ?? "Organizer"; 
  // Filter and limit tags to 5
  const visibleTags = item.tags.slice(0, 5);
  const hiddenTags = item.tags.slice(5);
  const hiddenCount = hiddenTags.length;

  return (
    <div
      className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm
                 transition-transform duration-300 hover:-translate-y-1 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h3 className="text-xl text-black font-semibold leading-tight">{item.title}</h3>

          {/* Host + Role, then Tags in separate rows */}
          <div className="mt-2 space-y-2">
            {/* Host Row */}
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-gray-500">
              <span className="font-medium">Host:</span>
              <TagAccent label={hostName} />
              <span className="font-medium">Role:</span>
              <TagAccent label={hostRole} />
            </div>

            {/* Tags Row */}
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-gray-500">
              <span className="font-medium">Tags:</span>
              {visibleTags.map((t, i) => (
                <Tag key={i} label={t} />
              ))}

              {/* Hidden tags in a circle with hover tooltip */}
              {hiddenCount > 0 && (
                <div className="relative group inline-block">
                  <button
                    type="button"
                    aria-label={`Show ${hiddenCount} more tags`}
                    className="w-7 h-7 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-xs font-bold hover:bg-indigo-200 transition-colors focus:outline-none"
                  >
                    +{hiddenCount}
                  </button>

                  {/* Hover tooltip */}
                  <div
                    className="pointer-events-none absolute left-1/2 z-50 mt-2
                               w-[min(320px,90vw)] -translate-x-1/2
                               rounded-xl border border-gray-200 bg-white/95 p-3 shadow-lg backdrop-blur
                               opacity-0 scale-95 transition-all duration-150
                               group-hover:opacity-100 group-hover:scale-100"
                    role="tooltip"
                  >
                    <div className="flex flex-wrap gap-2">
                      {hiddenTags.map((t, i) => (
                        <Tag key={i} label={t} />
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Excerpt */}
          <p className="mt-3 max-w-[62ch] break-words text-sm text-gray-600">
            {item.excerpt}
          </p>
        </div>

        {/* More button */}
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
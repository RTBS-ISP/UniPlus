import { ChevronRight } from "lucide-react";
import { Tag, TagAccent, TagCounter } from "../shared/Tag";

export type EventItem = {
  id: number;
  title: string;
  host: string[];
  tags: string[];
  excerpt: string;
  date: string;       // ISO yyyy-mm-dd
  createdAt: string;  // ISO
  popularity: number; // mocked metric
};

export default function EventCard({ item }: { item: EventItem }) {
  const extra = Math.max(0, item.tags.length - 4);
  const visibleTags = item.tags.slice(0, 4);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <h3 className="text-lg font-semibold break-words [overflow-wrap:anywhere]">
        {item.title}
      </h3>

      {/* Fixed two-slot layout: Host | Attendees */}
      <div className="mt-1 flex flex-wrap items-center gap-x-6 gap-y-2">
        {/* Host slot */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-700">Host</span>
          {item.host.length > 0 ? (
            item.host.map((h, i) => <TagAccent key={i} label={h} />)
          ) : (
            <span className="text-xs text-gray-400">—</span>
          )}
        </div>

        {/* Attendees slot */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-700">Attendees</span>
          {visibleTags.map((t, i) => (
            <Tag key={i} label={t} />
          ))}
          {extra > 0 && <TagCounter count={extra} />}
        </div>
      </div>

      <p className="mt-3 text-sm text-gray-600 break-words [overflow-wrap:anywhere]">
        {item.excerpt}
      </p>

      <div className="mt-3 flex justify-end">
        <button className="inline-flex items-center gap-1 rounded-full bg-black px-3 py-1.5 text-xs font-medium text-white">
          More <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

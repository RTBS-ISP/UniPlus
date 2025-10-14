// app/components/events/EventCard.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronRight } from "lucide-react";

// ---------- Types ----------
export type EventItem = {
  id: number;
  title: string;
  host: string[];
  tags: string[];
  excerpt: string;
  date: string;        // ISO "YYYY-MM-DD" (registration/main date) | can be ""
  createdAt: string;
  popularity: number;
  category?: string;
  startDate?: string;  // ISO "YYYY-MM-DD"
  endDate?: string;    // ISO "YYYY-MM-DD"
  location?: string;
};

// ---------- Helpers ----------
function formatMDY(dateStr?: string): string {
  if (!dateStr) return "--/--/----";
  const m = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return dateStr;
  const [, y, mo, d] = m;
  return `${mo}/${d}/${y}`;
}

const KNOWN_CATEGORIES = [
  "Technology",
  "Design",
  "Health",
  "Sports",
  "Arts",
  "Networking",
  "Business",
  "Science",
  "Club",
  "Campus",
];

function inferCategory(tags: string[] = []): string | undefined {
  return tags.find((t) => KNOWN_CATEGORIES.includes(t));
}

function isValidISODate(d?: string) {
  return !!(d && /^\d{4}-\d{2}-\d{2}$/.test(d));
}

// ---------- Pills ----------
function BluePill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-md bg-[#E8EEFF] px-2 py-1 text-xs font-semibold text-[#1F2A44]">
      {children}
    </span>
  );
}

function HostPill({ label }: { label: string }) {
  const normalized = label.toLowerCase();

  // soft palette (your version)
  let bg = "#E8EEFF";
  let color = "#1F2A44";

  if (normalized === "organizer") {
    bg = "#F3E8FF"; // soft purple
    color = "#1F1F1F";
  } else if (normalized === "student") {
    bg = "#E0F2FE"; // soft sky
    color = "#1F1F1F";
  } else if (normalized === "university") {
    bg = "#C7D2FE"; // soft indigo
    color = "#1F1F1F";
  }

  return (
    <span
      className="inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold"
      style={{ backgroundColor: bg, color }}
    >
      {label}
    </span>
  );
}

// ---------- Component ----------
export default function EventCard({ item }: { item: EventItem }) {
  const hostBadge = item.host?.[0] ?? "Organizer";

  // Stable “Registration end X days” (only show if valid date)
  const daysLeft = useMemo(() => {
    if (!isValidISODate(item.date)) return undefined;
    const ms =
      new Date(item.date + "T00:00:00Z").getTime() - Date.now();
    return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
  }, [item.date]);

  // Ensure order Host -> Category -> Tag
  const derivedCategory = item.category ?? inferCategory(item.tags);
  const tagList = useMemo(
    () => (item.tags || []).filter((t) => t !== derivedCategory),
    [item.tags, derivedCategory]
  );

  // -------- Dynamic tag fitting (fit one line, rest into +N) --------------
  // pills area the user sees
  const pillsRef = useRef<HTMLDivElement>(null);
  // hidden measurer with identical styles to compute widths
  const measureRef = useRef<HTMLDivElement>(null);

  const [visibleCount, setVisibleCount] = useState<number>(tagList.length);

  useEffect(() => {
    function recalc() {
      const pillsWrap = pillsRef.current;
      const measure = measureRef.current;
      if (!pillsWrap || !measure) return;

      const containerWidth = pillsWrap.clientWidth;
      if (containerWidth <= 0) {
        setVisibleCount(tagList.length);
        return;
      }

      // all tag pill widths (in same styling as visible)
      const tagSpans = Array.from(
        measure.querySelectorAll<HTMLElement>('[data-role="pill"]')
      );
      const widths = tagSpans.map((el) => el.offsetWidth);

      // width for +N with the largest possible text (“+99”) as a safe max
      const plusSpan = measure.querySelector<HTMLElement>('[data-role="plus"]');
      const plusWidthBase = plusSpan ? plusSpan.offsetWidth : 40;

      const GAP = 8; // tailwind gap-2 (0.5rem) between pills
      let used = 0;
      let count = 0;

      for (let i = 0; i < widths.length; i++) {
        const w = widths[i] + (i > 0 ? GAP : 0);
        // if there will be hidden items, reserve space for +N
        const remaining = widths.length - (i + 1);
        const reserve = remaining > 0 ? GAP + plusWidthBase : 0;

        if (used + w + reserve <= containerWidth) {
          used += w;
          count++;
        } else {
          break;
        }
      }

      // Edge case: first tag doesn't fit -> show none, only +N
      setVisibleCount(count);
    }

    // initial + next frame (ensure layout settled)
    recalc();
    const t = setTimeout(recalc, 0);

    // observe container size
    const ro = new ResizeObserver(recalc);
    if (pillsRef.current) ro.observe(pillsRef.current);
    window.addEventListener("resize", recalc);

    return () => {
      clearTimeout(t);
      ro.disconnect();
      window.removeEventListener("resize", recalc);
    };
  }, [tagList]);

  const visibleTags = tagList.slice(0, visibleCount);
  const hiddenTags = tagList.slice(visibleCount);

  return (
    <div
      className="rounded-2xl border border-[#6CA8FF] bg-white p-5 shadow-sm
                 transition-transform duration-300 hover:-translate-y-1 hover:shadow-lg"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <h3 className="text-xl font-semibold text-[#0B1220]">{item.title}</h3>
        {typeof daysLeft === "number" && (
          <span className="text-xs text-[#0B1220]/70">
            Registration end {daysLeft} days
          </span>
        )}
      </div>

      {/* Meta rows */}
      <div className="mt-3 space-y-2">
        {/* Host / Category / Tag */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px]">
          {/* Host */}
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[#0B1220]/80">Host</span>
            <HostPill label={hostBadge} />
          </div>

          {/* Category */}
          {derivedCategory && (
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[#0B1220]/80">Category</span>
              <BluePill>{derivedCategory}</BluePill>
            </div>
          )}

          {/* Tag (auto-fit one line; rest behind +N) */}
          {tagList.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[#0B1220]/80">Tag</span>

              {/* visible pills */}
              <div ref={pillsRef} className="flex flex-wrap gap-2">
                {visibleTags.map((t) => (
                  <BluePill key={t}>{t}</BluePill>
                ))}

                {hiddenTags.length > 0 && (
                  <span className="relative group inline-block">
                    <button
                      type="button"
                      className="inline-flex items-center rounded-md bg-[#E8EEFF] px-2 py-1 text-xs font-semibold text-[#1F2A44]"
                    >
                      +{hiddenTags.length}
                    </button>

                    {/* hovercard */}
                    <div
                      className="pointer-events-none absolute left-1/2 z-50 mt-2 w-[min(420px,90vw)]
                                 -translate-x-1/2 rounded-xl border border-gray-200 bg-white/95 p-3
                                 shadow-lg backdrop-blur opacity-0 scale-95 transition-all duration-150
                                 group-hover:opacity-100 group-hover:scale-100"
                    >
                      <div className="flex flex-wrap gap-2">
                        {hiddenTags.map((t) => (
                          <BluePill key={t}>{t}</BluePill>
                        ))}
                      </div>
                    </div>
                  </span>
                )}
              </div>

              {/* hidden measurer (same styles) */}
              <div
                ref={measureRef}
                className="invisible absolute left-[-9999px] top-0 -z-10 flex flex-wrap gap-2"
                aria-hidden
              >
                {tagList.map((t) => (
                  <span
                    key={t}
                    data-role="pill"
                    className="inline-flex items-center rounded-md bg-[#E8EEFF] px-2 py-1 text-xs font-semibold text-[#1F2A44]"
                  >
                    {t}
                  </span>
                ))}
                <span
                  data-role="plus"
                  className="inline-flex items-center rounded-md bg-[#E8EEFF] px-2 py-1 text-xs font-semibold text-[#1F2A44]"
                >
                  +99
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Date */}
        {(item.startDate || item.endDate) && (
          <div className="flex flex-wrap items-center gap-2 text-[13px]">
            <span className="font-semibold text-[#0B1220]/80">Date</span>
            <BluePill>{formatMDY(item.startDate)}</BluePill>
            <BluePill>{formatMDY(item.endDate)}</BluePill>
          </div>
        )}

        {/* Location */}
        {item.location && (
          <div className="flex items-center gap-2 text-[13px]">
            <span className="font-semibold text-[#0B1220]/80">Location</span>
            <span className="text-[#0B1220]/80">{item.location}</span>
          </div>
        )}
      </div>

      {/* Description */}
      {item.excerpt && (
        <p className="mt-3 max-w-[70ch] text-sm leading-6 text-[#0B1220]/80">
          {item.excerpt}
        </p>
      )}

      {/* Button */}
      <div className="mt-4 flex justify-end">
        <button
          data-role="more"
          className="event-card-more inline-flex items-center gap-1 rounded-full bg-[#6366F1] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#4F46E5] transition"
          onClick={() => (window.location.href = `/events/${item.id}`)}
        >
          Detail <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

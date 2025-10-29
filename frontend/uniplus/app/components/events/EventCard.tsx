"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronRight } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

// ---------- Types ----------
export type EventItem = {
  id: number;
  title: string;
  host: string[];
  tags: string[];
  excerpt: string;
  date: string;
  createdAt: string;
  popularity: number;
  category?: string;
  startDate?: string;
  endDate?: string;
  location?: string;
};

// ---------- Helpers ----------
function formatMDY(dateStr?: string): string {
  if (!dateStr) return "--/--/----";
  const m = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return dateStr;
  const [, y, mo, d] = m;
  return `${d}/${mo}/${y}`;
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
  let bg = "#E8EEFF";
  let color = "#1F2A44";

  if (normalized === "organizer") {
    bg = "#F3E8FF";
    color = "#1F1F1F";
  } else if (normalized === "student") {
    bg = "#E0F2FE";
    color = "#1F1F1F";
  } else if (normalized === "professor") {
    bg = "#C7D2FE";
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

// ---------- Main Component ----------
// NEW: optional index/stagger props to cascade cards from parent lists
export default function EventCard({
  item,
  index = 0,
  stagger = 0.06,
}: {
  item: EventItem;
  index?: number;
  stagger?: number;
}) {
  const shouldReduce = useReducedMotion();
  const hostBadge = item.host?.[0] ?? "Organizer";

  const daysLeft = useMemo(() => {
    if (!isValidISODate(item.date)) return undefined;
    const ms = new Date(item.date + "T00:00:00Z").getTime() - Date.now();
    return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
  }, [item.date]);

  const derivedCategory = item.category ?? inferCategory(item.tags);
  const tagList = useMemo(
    () => (item.tags || []).filter((t) => t !== derivedCategory),
    [item.tags, derivedCategory]
  );

  // --- dynamic tag fitting ---
  const MAX_VISIBLE_TAGS = 2;
  const visibleTags = tagList.slice(0, MAX_VISIBLE_TAGS);
  const hiddenTags = tagList.slice(MAX_VISIBLE_TAGS);

  // --- motion: entrance + hover ---
  const entranceDelay = shouldReduce ? 0 : index * stagger;
  const entranceInitial = shouldReduce
    ? { opacity: 0 }
    : { opacity: 0, y: 10, scale: 0.98 };
  const entranceWhileInView = shouldReduce
    ? { opacity: 1 }
    : { opacity: 1, y: 0, scale: 1 };

  const cardHover = shouldReduce ? {} : { scale: 1.015, y: -4 };
  const transition = shouldReduce
    ? { duration: 0 }
    : {
        type: "spring",
        stiffness: 320,
        damping: 22,
        mass: 0.6,
        delay: entranceDelay,
      };

  return (
    <motion.div
      initial={entranceInitial}
      whileInView={entranceWhileInView}
      viewport={{ once: true, amount: 0.25 }}
      whileHover={cardHover}
      transition={transition}
      className="group rounded-2xl border border-[#6CA8FF] bg-white p-5 shadow-sm hover:shadow-lg
                 [backface-visibility:hidden] [transform-style:preserve-3d]"
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

          {/* Tag */}
          {tagList.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[#0B1220]/80">Tag</span>

              {/* visible pills */}
              <div className="flex flex-wrap gap-2">
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

      {/* Animated Detail Button */}
      <div className="mt-4 flex justify-end">
        <MotionDetailButton id={item.id} />
      </div>
    </motion.div>
  );
}

// ---------- Animated Button ----------
function MotionDetailButton({ id }: { id: number }) {
  const shouldReduce = useReducedMotion();
  const [hovered, setHovered] = useState(false);

  const spring = shouldReduce
    ? { duration: 0 }
    : { type: "spring", stiffness: 500, damping: 32, mass: 0.6 };

  return (
    <motion.button
      type="button"
      onClick={() => (window.location.href = `/events/${id}`)}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      className="inline-flex items-center rounded-full bg-[#6366F1] text-xs font-semibold text-white
                 shadow-sm focus:outline-none hover:bg-[#4F46E5]"
      style={{ paddingLeft: 12, paddingRight: 12, paddingTop: 6, paddingBottom: 6, gap: 4 }}
      whileHover={
        shouldReduce
          ? {}
          : {
              paddingLeft: 16,
              paddingRight: 20,
              gap: 10,
              boxShadow: "0 8px 22px rgba(99,102,241,0.35)",
              scale: 1.02,
            }
      }
      whileTap={shouldReduce ? {} : { scale: 0.98 }}
      transition={spring}
      aria-label="View detail"
    >
      <span>Detail</span>
      <motion.span
        animate={shouldReduce ? { x: 0 } : { x: hovered ? 6 : 0 }}
        transition={spring}
        className="ml-0.5 inline-flex"
      >
        <ChevronRight className="h-4 w-4" />
      </motion.span>
    </motion.button>
  );
}

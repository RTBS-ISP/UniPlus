"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { EventSession, formatDateGB, groupConsecutiveSessions } from "./utils";
import { fadeUp, staggerRow } from "./motionConfig";


export function ScheduleList({
  schedule,
  fallbackLocation,
  fallbackAddress2,
}: {
  schedule: EventSession[];
  fallbackLocation: string;
  fallbackAddress2: string;
}) {
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
            <motion.div
              className="mt-4 space-y-3"
              variants={staggerRow}
              initial="initial"
              animate="animate"
            >
              {groups.map((g, idx) => {
                const dateLabel = formatDateGB(g.start);
                const day = g.items[0];
                const isOnline = day.is_online;
                const loc = day.location ?? fallbackLocation;
                const addr2 = day.address2 ?? fallbackAddress2;

                return (
                  <motion.div
                    key={`${g.start}-${idx}`}
                    className="rounded-xl border border-black/10 bg-gray-50 p-4"
                    variants={fadeUp}
                  >
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="inline-flex h-6 items-center rounded-md bg-white px-2 text-xs font-semibold text-[#0B1220]">
                        Day {idx + 1}
                      </span>
                      <span className="text-sm font-semibold text-[#0B1220]">{dateLabel}</span>
                      <span className="text-sm text-[#0B1220]/80">
                        — {g.startTime}–{g.endTime}
                      </span>
                    </div>

                    <div className="mt-2 text-sm text-[#0B1220]/80">
                      {isOnline ? (
                        <div className="space-y-1">
                          <div className="font-medium text-[#0B1220]">Online Event</div>
                          <div className="text-xs text-[#0B1220]/60 italic">
                            Meeting link will be available after registration
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="font-medium text-[#0B1220]">
                            {loc || "Location not specified"}
                          </div>
                          {addr2 && <div>{addr2}</div>}
                        </>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

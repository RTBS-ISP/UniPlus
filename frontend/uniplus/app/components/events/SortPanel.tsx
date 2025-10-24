"use client";

import { LayoutGroup, motion, useReducedMotion } from "framer-motion";
import React from "react";

const MotionButton = ({
  active,
  children,
  onClick,
}: {
  active?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}) => {
  const reduce = useReducedMotion();

  return (
    <motion.button
      onClick={onClick}
      aria-pressed={active}
      whileHover={active ? undefined : { scale: reduce ? 1 : 1.02 }}
      whileTap={active ? undefined : { scale: reduce ? 1 : 0.98 }}
      transition={
        reduce ? { duration: 0 } : { type: "spring", stiffness: 500, damping: 30, mass: 0.6 }
      }
      className={[
        "relative w-full overflow-hidden rounded-full px-3 py-2 text-sm shadow-sm transition font-medium",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-200",
        active ? "border border-[#6366F1] text-white" : "border border-indigo-200 bg-white text-indigo-700 hover:bg-indigo-50",
      ].join(" ")}
    >
      {/* Animated active background “pill” */}
      {active && (
        <motion.span
          layoutId="sort-active-pill"
          className="absolute inset-0 rounded-full bg-[#6366F1]"
          transition={
            reduce ? { duration: 0 } : { type: "spring", stiffness: 500, damping: 34, mass: 0.7 }
          }
          aria-hidden
        />
      )}
      <span className="relative z-10">{children}</span>
    </motion.button>
  );
};

export default function SortPanel({
  value,
  onChange,
}: {
  value: "recent" | "popular" | "upcoming";
  onChange: (v: "recent" | "popular" | "upcoming") => void;
}) {
  const reduce = useReducedMotion();

  // Slide-in + stagger like FilterPanel
  const containerVars = {
    hidden: { opacity: 0, y: reduce ? 0 : 6 },
    show: {
      opacity: 1,
      y: 0,
      transition: { when: "beforeChildren", staggerChildren: reduce ? 0 : 0.06 },
    },
  };
  const itemVars = {
    hidden: { opacity: 0, y: reduce ? 0 : 6, scale: reduce ? 1 : 0.98 },
    show: { opacity: 1, y: 0, scale: 1 },
  };

  return (
    <motion.div
      variants={containerVars}
      initial="hidden"
      animate="show"
      className="rounded-2xl border border-indigo-100 bg-white p-5 shadow-sm"
    >
      <h3 className="text-base font-semibold text-indigo-900">Sort</h3>

      <LayoutGroup id="sort-options">
        <div className="mt-4 space-y-2">
          <motion.div variants={itemVars}>
            <MotionButton active={value === "recent"} onClick={() => onChange("recent")}>
              Most Recent
            </MotionButton>
          </motion.div>

          <motion.div variants={itemVars}>
            <MotionButton active={value === "popular"} onClick={() => onChange("popular")}>
              Popular
            </MotionButton>
          </motion.div>

          <motion.div variants={itemVars}>
            <MotionButton active={value === "upcoming"} onClick={() => onChange("upcoming")}>
              Upcoming
            </MotionButton>
          </motion.div>
        </div>
      </LayoutGroup>
    </motion.div>
  );
}

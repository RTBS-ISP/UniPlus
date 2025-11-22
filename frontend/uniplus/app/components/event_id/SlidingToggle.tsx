"use client";

import { motion } from "framer-motion";
import React from "react";

interface SlidingToggleProps {
  options: string[];
  value: string;
  onChange: (val: string) => void;
}

export function SlidingToggle({ options, value, onChange }: SlidingToggleProps) {
  return (
    <div className="relative inline-flex rounded-xl bg-neutral-200 px-1 py-1 text-xs font-semibold text-neutral-600">
      {options.map((option) => {
        const isActive = option === value;

        return (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className={`
              relative z-10 rounded-lg px-4 py-1.5 transition
              ${isActive ? "text-white" : "text-neutral-700"}
            `}
          >
            {option}
            {isActive && (
              <motion.div
                layoutId="sliding-pill"
                className="absolute inset-0 -z-10 rounded-lg bg-[#6366F1]"
                transition={{ type: "spring", stiffness: 260, damping: 26 }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}

"use client";

import { motion } from "framer-motion";

interface AnonToggleProps {
  value: boolean;
  onChange: (val: boolean) => void;
}

export function AnonToggle({ value, onChange }: AnonToggleProps) {
  return (
    <div className="relative inline-flex rounded-xl bg-neutral-200 px-1 py-1 w-[160px] text-xs font-semibold text-neutral-700">
      {/* Public button */}
      <button
        type="button"
        onClick={() => onChange(false)}
        className="relative z-10 w-1/2 px-3 py-1.5"
      >
        Public
        {!value && (
          <motion.div
            layoutId="anon-pill"
            className="absolute inset-0 -z-10 rounded-lg bg-[#6366F1]"
            transition={{ type: "spring", stiffness: 260, damping: 26 }}
          />
        )}
      </button>

      {/* Anonymous button */}
      <button
        type="button"
        onClick={() => onChange(true)}
        className="relative z-10 w-1/2 px-3 py-1.5"
      >
        Anonymous
        {value && (
          <motion.div
            layoutId="anon-pill"
            className="absolute inset-0 -z-10 rounded-lg bg-[#6366F1]"
            transition={{ type: "spring", stiffness: 260, damping: 26 }}
          />
        )}
      </button>
    </div>
  );
}

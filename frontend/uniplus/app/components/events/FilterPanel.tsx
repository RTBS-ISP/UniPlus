"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { CATEGORIES } from "../../../lib/events/categories";

export type FilterValues = {
  category: string; // '' = Any
  host: string;     // '' = Any
  dateFrom: string; // YYYY-MM-DD
  dateTo: string;   // YYYY-MM-DD
  location: string;
};

type Props = {
  value?: Partial<FilterValues>;
  onChange: (v: FilterValues) => void;
  onClear?: () => void;
  categories?: string[];
  hosts: string[];
};

const defaults: FilterValues = {
  category: "",
  host: "",
  dateFrom: "",
  dateTo: "",
  location: "",
};

export default function FilterPanel({
  value,
  onChange,
  onClear,
  categories,
  hosts,
}: Props) {
  const [form, setForm] = useState<FilterValues>({ ...defaults, ...(value || {}) });
  const reduce = useReducedMotion();

  useEffect(() => {
    setForm({ ...defaults, ...(value || {}) });
  }, [value?.category, value?.host, value?.dateFrom, value?.dateTo, value?.location]);

  const update = <K extends keyof FilterValues>(k: K, v: FilterValues[K]) => {
    const next = { ...form, [k]: v };
    setForm(next);
    onChange(next);
  };

  const isDirty =
    form.category !== "" ||
    form.host !== "" ||
    form.location.trim() !== "" ||
    form.dateFrom !== "" ||
    form.dateTo !== "";

  const [justCleared, setJustCleared] = useState(false);

  const clearAll = () => {
    if (!isDirty) return;
    setForm(defaults);
    onChange(defaults);
    onClear?.();

    // micro “Cleared” feedback
    setJustCleared(true);
    window.setTimeout(() => setJustCleared(false), 800);
  };

  // Build category list
  const categoryList = useMemo(() => {
    return Array.from(new Set([...(CATEGORIES || []), ...(categories || [])])).sort();
  }, [categories]);

  // Shared input styles
  const field =
    "w-full rounded-full border border-gray-300 px-3 py-2 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-indigo-200";

  // Motion variants
  const containerVars = {
    hidden: { opacity: 0, y: reduce ? 0 : 6 },
    show: {
      opacity: 1,
      y: 0,
      transition: { when: "beforeChildren", staggerChildren: reduce ? 0 : 0.05 },
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
      className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
    >
      <h3 className="text-base font-semibold text-black">Filter</h3>

      <div className="mt-4 space-y-4">
        {/* Category */}
        <motion.div variants={itemVars}>
          <label className="mb-1 block text-sm text-gray-700">Category</label>
          <select
            value={form.category}
            onChange={(e) => update("category", e.target.value)}
            className={field}
          >
            <option value="">Any</option>
            {categoryList.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </motion.div>

        {/* Host */}
        <motion.div variants={itemVars}>
          <label className="mb-1 block text-sm text-gray-700">Host</label>
          <select
            value={form.host}
            onChange={(e) => update("host", e.target.value)}
            className={field}
          >
            <option value="">Any</option>
            {hosts.map((h) => (
              <option key={h} value={h}>{h}</option>
            ))}
          </select>
        </motion.div>

        {/* Date range */}
        <motion.div variants={itemVars}>
          <label className="mb-1 block text-sm text-gray-700">Date</label>

          <div className="ml-2 space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-10 shrink-0 text-sm text-gray-500">Start</span>
              <input
                type="date"
                value={form.dateFrom}
                onChange={(e) => update("dateFrom", e.target.value)}
                className={field + " flex-1"}
                max={form.dateTo || undefined}
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="w-10 shrink-0 text-sm text-gray-500">End</span>
              <input
                type="date"
                value={form.dateTo}
                onChange={(e) => update("dateTo", e.target.value)}
                className={field + " flex-1"}
                min={form.dateFrom || undefined}
              />
            </div>
          </div>
        </motion.div>

        {/* Location */}
        <motion.div variants={itemVars}>
          <label className="mb-1 block text-sm text-gray-700">Location</label>
          <input
            value={form.location}
            onChange={(e) => update("location", e.target.value)}
            className={field}
            placeholder=""
          />
        </motion.div>

        {/* Actions */}
        <motion.div variants={itemVars} className="pt-1">
          {/* Fancy Clear button */}
          <motion.button
            type="button"
            onClick={clearAll}
            aria-label="Clear all filters"
            disabled={!isDirty}
            whileHover={reduce || !isDirty ? undefined : { scale: 1.02 }}
            whileTap={reduce || !isDirty ? undefined : { scale: 0.985 }}
            className={[
              "relative w-full overflow-hidden rounded-full px-3 py-2 text-sm font-medium transition",
              "border",
              isDirty
                ? "border-indigo-200 bg-white text-indigo-700"
                : "border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-200",
            ].join(" ")}
          >
            {/* Sweep background */}
            <motion.span
              aria-hidden
              initial={false}
              animate={
                reduce || !isDirty
                  ? { scaleX: 0 }
                  : { scaleX: [0, 1] }
              }
              transition={
                reduce || !isDirty
                  ? { duration: 0 }
                  : { duration: 0.45, ease: [0.22, 1, 0.36, 1] }
              }
              className="pointer-events-none absolute inset-0 origin-left rounded-full"
              style={{
                background:
                  "linear-gradient(90deg, rgba(99,102,241,0.12) 0%, rgba(99,102,241,0.18) 100%)",
              }}
            />

            {/* Label swap on success */}
            <span className="relative z-10 inline-flex w-full items-center justify-center gap-2">
              <AnimatePresence mode="wait" initial={false}>
                {justCleared ? (
                  <motion.span
                    key="cleared"
                    initial={{ opacity: 0, y: reduce ? 0 : 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: reduce ? 0 : -6 }}
                    transition={{ duration: reduce ? 0 : 0.18 }}
                    className="inline-flex items-center gap-2 text-indigo-700"
                  >
                    {/* Check icon */}
                    <svg
                      className="h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                    Cleared
                  </motion.span>
                ) : (
                  <motion.span
                    key="clear"
                    initial={{ opacity: 0, y: reduce ? 0 : 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: reduce ? 0 : -6 }}
                    transition={{ duration: reduce ? 0 : 0.18 }}
                    className="inline-flex items-center gap-2"
                  >
                    {/* X icon with hover spin */}
                    <motion.svg
                      className="h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      animate={reduce || !isDirty ? { rotate: 0 } : undefined}
                      whileHover={reduce || !isDirty ? undefined : { rotate: 90 }}
                      transition={{ type: "spring", stiffness: 300, damping: 18 }}
                    >
                      <path d="M18 6L6 18M6 6l12 12" />
                    </motion.svg>
                    Clear
                  </motion.span>
                )}
              </AnimatePresence>
            </span>
          </motion.button>
        </motion.div>
      </div>
    </motion.div>
  );
}

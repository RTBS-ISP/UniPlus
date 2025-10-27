"use client";

import { useEffect, useState } from "react";

export type FilterValues = {
  category: string; 
  host: string;     
  dateFrom: string; 
  dateTo: string;   
  location: string;
};

type Props = {
  value?: Partial<FilterValues>;
  onChange: (v: FilterValues) => void;
  onClear?: () => void;
  categories: string[];
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

  useEffect(() => {
    setForm({ ...defaults, ...(value || {}) });
  }, [value?.category, value?.host, value?.dateFrom, value?.dateTo, value?.location]);

  const update = <K extends keyof FilterValues>(k: K, v: FilterValues[K]) => {
    const next = { ...form, [k]: v };
    setForm(next);
    onChange(next);
  };

  const clearAll = () => {
    setForm(defaults);
    onChange(defaults);
    onClear?.();
  };

  const field =
    "w-full rounded-full border border-gray-300 px-3 py-2 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-indigo-200";

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <h3 className="text-base font-semibold text-black">Filter</h3>

      <div className="mt-4 space-y-4">
        {/* Category (dropdown) */}
        <div>
          <label className="mb-1 block text-sm text-gray-700">Category</label>
          <select
            value={form.category}
            onChange={(e) => update("category", e.target.value)}
            className={field}
          >
            <option value="">Any</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Host (dropdown) */}
        <div>
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
        </div>

        {/* Date range */}
        <div>
          <label className="mb-1 block text-sm text-gray-700">Date</label>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="date"
              value={form.dateFrom}
              onChange={(e) => update("dateFrom", e.target.value)}
              className={field}
            />
            <input
              type="date"
              value={form.dateTo}
              onChange={(e) => update("dateTo", e.target.value)}
              className={field}
            />
          </div>
        </div>

        {/* Location */}
        <div>
          <label className="mb-1 block text-sm text-gray-700">Location</label>
          <input
            value={form.location}
            onChange={(e) => update("location", e.target.value)}
            className={field}
            placeholder=""
          />
        </div>

        {/* Actions */}
        <div className="pt-1">
          <button
            type="button"
            onClick={clearAll}
            className="w-full rounded-full border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition"
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";

export type DaySlot = {
  date: string;
  startTime: string;
  endTime: string;
};

type Props = {
  value?: DaySlot[];
  onChange?: (days: DaySlot[]) => void;
  minDays?: number;
  maxDays?: number;
};

const emptyDay: DaySlot = { date: "", startTime: "", endTime: "" };

export default function EventScheduleDays({ value, onChange, minDays = 1, maxDays }: Props) {
  const [days, setDays] = useState<DaySlot[]>(() =>
    value && value.length ? value : Array.from({ length: minDays }, () => ({ ...emptyDay }))
  );

  useEffect(() => {
    if (value) {
      const same = JSON.stringify(value) === JSON.stringify(days);
      if (!same) setDays(value);
    }
  }, [value]);

  useEffect(() => {
    onChange?.(days);
  }, [JSON.stringify(days)]);

  const canAdd = useMemo(() => (maxDays ? days.length < maxDays : true), [days.length, maxDays]);
  const canRemove = (idx: number) => days.length > minDays && idx >= 0 && idx < days.length;

  const updateField = (idx: number, field: keyof DaySlot, val: string) => {
    setDays((prev) => prev.map((d, i) => (i === idx ? { ...d, [field]: val } : d)));
  };

  const addDay = () => canAdd && setDays((prev) => [...prev, { ...emptyDay }]);
  const removeDay = (idx: number) => canRemove(idx) && setDays((prev) => prev.filter((_, i) => i !== idx));

  return (
    <section className="w-full rounded-2xl border border-gray-200 bg-gray-50 p-6 shadow-sm">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Schedule & Location</h2>
        <button
          type="button"
          onClick={addDay}
          disabled={!canAdd}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-40"
        >
          <PlusIcon className="h-4 w-4" />
          Add Day
        </button>
      </div>

      <div className="space-y-6">
        {days.map((d, idx) => (
          <div key={idx} className="rounded-xl border border-gray-200 bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">Day {idx + 1}</h3>
              <button
                type="button"
                onClick={() => removeDay(idx)}
                disabled={!canRemove(idx)}
                className="inline-flex items-center gap-1 text-sm font-medium text-red-500 hover:text-red-400 disabled:opacity-40"
              >
                <TrashIcon className="h-4 w-4" />
                Remove
              </button>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={d.date}
                  onChange={(e) => updateField(idx, "date", e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Start Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  value={d.startTime}
                  onChange={(e) => updateField(idx, "startTime", e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  End Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  value={d.endTime}
                  onChange={(e) => updateField(idx, "endTime", e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none"
                  required
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// --- Simple icons ---
function PlusIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
function TrashIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";

export type DaySlot = {
  date: string;
  startTime: string;
  endTime: string;
  isOnline: boolean;
  address: string;
  meetingLink: string;
};

type Props = {
  value?: DaySlot[];
  onChange?: (days: DaySlot[]) => void;
  minDays?: number;
  maxDays?: number;
};

const emptyDay: DaySlot = {
  date: "",
  startTime: "",
  endTime: "",
  isOnline: false,
  address: "",
  meetingLink: "",
};

export default function EventScheduleDays({
  value,
  onChange,
  minDays = 1,
  maxDays,
}: Props) {
  const [days, setDays] = useState<DaySlot[]>(() =>
    value && value.length
      ? value
      : Array.from({ length: minDays }, () => ({ ...emptyDay }))
  );

  // sync in value from parent
  useEffect(() => {
    if (value) {
      const same = JSON.stringify(value) === JSON.stringify(days);
      if (!same) setDays(value);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(value)]);

  // push out to parent
  useEffect(() => {
    onChange?.(days);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(days)]);

  const canAdd = useMemo(
    () => (maxDays ? days.length < maxDays : true),
    [days.length, maxDays]
  );
  const canRemove = (idx: number) =>
    days.length > minDays && idx >= 0 && idx < days.length;

  const patchDay = (idx: number, patch: Partial<DaySlot>) => {
    setDays((prev) => prev.map((d, i) => (i === idx ? { ...d, ...patch } : d)));
  };

  const addDay = () => canAdd && setDays((prev) => [...prev, { ...emptyDay }]);
  const removeDay = (idx: number) =>
    canRemove(idx) && setDays((prev) => prev.filter((_, i) => i !== idx));

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
                className="inline-flex items-center gap-1 text-sm font-medium text-red-500 hover:text-red-400 disabled:opacity-0"
              >
                <TrashIcon className="h-4 w-4" />
                Remove
              </button>
            </div>

            {/* Date & times */}
            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={d.date}
                  onChange={(e) => patchDay(idx, { date: e.target.value })}
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
                  onChange={(e) => patchDay(idx, { startTime: e.target.value })}
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
                  onChange={(e) => patchDay(idx, { endTime: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none"
                  required
                />
              </div>
            </div>

            {/* Location per day */}
            <div className="mt-5 grid gap-4">
              <div className="flex items-center gap-3 rounded-xl bg-gray-50 p-3">
                <input
                  id={`isOnline-${idx}`}
                  type="checkbox"
                  checked={d.isOnline}
                  onChange={(e) => patchDay(idx, { isOnline: e.target.checked })}
                  className="h-5 w-5 rounded text-indigo-600 focus:ring-2 focus:ring-indigo-500"
                />
                <label
                  htmlFor={`isOnline-${idx}`}
                  className="text-sm font-medium text-gray-800"
                >
                  This day is online
                </label>
              </div>

              {d.isOnline ? (
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Meeting Link <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="url"
                    value={d.meetingLink}
                    onChange={(e) => patchDay(idx, { meetingLink: e.target.value })}
                    placeholder="https://zoom.us/j/..."
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none"
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Share a Zoom/Google Meet/Teams link.
                  </p>
                </div>
              ) : (
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Event Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={d.address}
                    onChange={(e) => patchDay(idx, { address: e.target.value })}
                    placeholder="123 Main St, City, Country"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none"
                    required
                  />
                </div>
              )}
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

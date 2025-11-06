"use client";

import { Calendar, ChevronDown } from "lucide-react";
import type { ScheduleDay } from "@/lib/dashboard/types";

export function DateSelector({
  days,
  selected,
  onChange,
}: {
  days: ScheduleDay[];
  selected: string;
  onChange: (d: string) => void;
}) {
  return (
    <div className="flex items-center justify-between mb-6 pb-6 border-b border-gray-200">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-indigo-100 rounded-lg">
          <Calendar size={24} className="text-indigo-500" />
        </div>
        <div>
          <h2 className="text-gray-800 text-lg font-bold">Event Date</h2>
          <p className="text-gray-600 text-sm">Select a date to view attendance</p>
        </div>
      </div>

      <div className="relative">
        <select
          value={selected}
          onChange={(e) => onChange(e.target.value)}
          className="
            appearance-none
            px-4 py-2 pr-10
            rounded-lg
            bg-white
            text-gray-800
            border border-gray-300
            shadow-sm
            focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500
            min-w-[220px]
          "
        >
          {days.map((d) => (
            <option key={d.date} value={d.date}>
              {d.label}
            </option>
          ))}
        </select>

        <ChevronDown
          size={18}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
        />
      </div>
    </div>
  );
}

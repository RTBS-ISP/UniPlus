"use client";

import React from "react";
import type { TableView } from "@/lib/dashboard/types";

export function ViewToggle({ view, onChange }: { view: TableView; onChange: (v: TableView) => void }) {
  return (
    <div className="flex gap-2 items-center">
      <button
        onClick={() => onChange("approval")}
        className={`px-6 py-2 rounded-lg font-bold text-sm transition-colors ${
          view === "approval" ? "bg-indigo-500 text-white shadow-md"
                              : "bg-white text-gray-700 border-2 border-gray-300 hover:bg-gray-50"
        }`}
      >
        Approval View
      </button>
      <button
        onClick={() => onChange("attendance")}
        className={`px-6 py-2 rounded-lg font-bold text-sm transition-colors ${
          view === "attendance" ? "bg-indigo-500 text-white shadow-md"
                                : "bg-white text-gray-700 border-2 border-gray-300 hover:bg-gray-50"
        }`}
      >
        Attendance View
      </button>
    </div>
  );
}

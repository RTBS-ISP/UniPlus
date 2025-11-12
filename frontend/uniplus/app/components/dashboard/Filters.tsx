"use client";

import React from "react";

export function Filters({
  view,
  counts,
  active,
  onChange,
}: {
  view: "attendance" | "approval";
  counts: {
    all: number;
    present?: number;
    pending?: number;
    approved?: number;
    pending_approval?: number;
    rejected?: number;
  };
  active: string;
  onChange: (v: string) => void;
}) {
  if (view === "attendance") {
    return (
      <div className="flex flex-row gap-2 mb-4">
        <button
          onClick={() => onChange("all")}
          className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
            active === "all"
              ? "bg-indigo-500 text-white"
              : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
          }`}
        >
          All ({counts.all})
        </button>
        <button
          onClick={() => onChange("present")}
          className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
            active === "present"
              ? "bg-lime-500 text-white"
              : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
          }`}
        >
          Present ({counts.present || 0})
        </button>
        <button
          onClick={() => onChange("pending")}
          className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
            active === "pending"
              ? "bg-yellow-400 text-white"
              : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
          }`}
        >
          Pending ({counts.pending || 0})
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-row gap-2 mb-4">
      <button
        onClick={() => onChange("all")}
        className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
          active === "all"
            ? "bg-indigo-500 text-white"
            : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
        }`}
      >
        All ({counts.all})
      </button>
      <button
        onClick={() => onChange("approved")}
        className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
          active === "approved"
            ? "bg-lime-500 text-white"
            : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
        }`}
      >
        Approved ({counts.approved || 0})
      </button>
      <button
        onClick={() => onChange("pending")}
        className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
          active === "pending"
            ? "bg-yellow-400 text-white"
            : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
        }`}
      >
        Pending ({counts.pending_approval || 0})
      </button>
      <button
        onClick={() => onChange("rejected")}
        className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
          active === "rejected"
            ? "bg-red-400 text-white"
            : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
        }`}
      >
        Rejected ({counts.rejected || 0})
      </button>
    </div>
  );
}

"use client";

import React from "react";

export function BulkActions({
  anySelected,
  totalSelected,
  onSelectAll,
  onApprove,
  onReject,
  busy,
}: {
  anySelected: boolean;
  totalSelected: number;
  onSelectAll: () => void;
  onApprove: () => void;
  onReject: () => void;
  busy: boolean;
}) {
  return (
    <div className="flex gap-3 mb-4">
      <button
        onClick={onSelectAll}
        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
      >
        {anySelected ? "Deselect All" : "Select All"}
      </button>
      {anySelected && (
        <>
          <button
            onClick={onApprove}
            disabled={busy}
            className="px-4 py-2 bg-lime-500 text-white rounded-lg font-semibold hover:bg-lime-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {busy ? "Processing..." : `Approve Selected (${totalSelected})`}
          </button>
          <button
            onClick={onReject}
            disabled={busy}
            className="px-4 py-2 bg-red-400 text-white rounded-lg font-semibold hover:bg-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {busy ? "Processing..." : `Reject Selected (${totalSelected})`}
          </button>
        </>
      )}
    </div>
  );
}

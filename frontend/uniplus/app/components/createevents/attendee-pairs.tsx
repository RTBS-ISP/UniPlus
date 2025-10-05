"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

type Pair = { faculty: string; year: string };

export type AttendeePairsProps = {
  value: string;                          // JSON: [{ faculty, year }]
  onChange: (next: string) => void;
  onDuplicateAttempt?: (pair: Pair) => void; // notified AFTER render
  facultyOptions: string[];
  yearOptions: Array<string | number>;
  maxPairs?: number;
  name?: string;
  title?: string;
};

function parsePairs(v: unknown): Pair[] {
  try {
    const s = typeof v === "string" ? v : "[]";
    const arr = JSON.parse(s);
    if (!Array.isArray(arr)) return [];
    return arr.map((x) => ({
      faculty: String(x?.faculty ?? "").trim(),
      year: String(x?.year ?? "").trim(),
    })); // keep blanks
  } catch {
    return [];
  }
}
const stringify = (arr: Pair[]) => JSON.stringify(arr);
const keyOf = (p: Pair) => `${p.faculty}::${p.year}`.toLowerCase();

export default function AttendeePairs({
  value,
  onChange,
  onDuplicateAttempt,
  facultyOptions,
  yearOptions,
  maxPairs = 50,
  name,
  title = "Attendee (Faculty × Year)",
}: AttendeePairsProps) {
  const [rows, setRows] = useState<Pair[]>(() => parsePairs(value));
  const lastValueRef = useRef<string>(typeof value === "string" ? value : "[]");

  // hold dup to notify parent AFTER commit (avoids setState-in-render)
  const [lastDup, setLastDup] = useState<Pair | null>(null);

  // emit local -> parent only when changed vs last prop value
  useEffect(() => {
    const next = stringify(rows);
    if (next !== lastValueRef.current) onChange(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows]);

  // sync from parent only when prop actually changed externally
  useEffect(() => {
    const incoming = typeof value === "string" ? value : "[]";
    if (incoming !== lastValueRef.current) {
      lastValueRef.current = incoming;
      const external = parsePairs(incoming);
      const extStr = stringify(external);
      const curStr = stringify(rows);
      if (extStr !== curStr) setRows(external);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  // notify parent after commit
  useEffect(() => {
    if (!lastDup) return;
    const p = lastDup;
    setLastDup(null);
    onDuplicateAttempt?.(p); // why: show single bottom error
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastDup]);

  const completeCount = useMemo(() => rows.filter((r) => r.faculty && r.year).length, [rows]);
  const canAdd = rows.length < maxPairs;

  const isDuplicateCandidate = (idx: number, candidate: Pair) => {
    if (!candidate.faculty || !candidate.year) return false;
    const candKey = keyOf(candidate);
    for (let i = 0; i < rows.length; i++) {
      if (i === idx) continue;
      const r = rows[i];
      if (r.faculty && r.year && keyOf(r) === candKey) return true;
    }
    return false;
  };

  const updateRow = (idx: number, patch: Partial<Pair>) => {
    setRows((rs) => {
      const current = rs[idx] ?? { faculty: "", year: "" };
      const candidate: Pair = { ...current, ...patch };

      if (isDuplicateCandidate(idx, candidate)) {
        // remove the dup row and notify later
        setLastDup(candidate);
        return rs.filter((_, i) => i !== idx);
      }

      const next = rs.slice();
      next[idx] = candidate;
      return next;
    });
  };

  const addRow = () => {
    if (!canAdd) return;
    setRows((rs) => [...rs, { faculty: "", year: "" }]);
  };

  const removeRow = (idx: number) => {
    setRows((rs) => rs.filter((_, i) => i !== idx));
  };

  return (
    <div className="rounded-xl border-2 border-gray-200 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h4 className="font-semibold text-black">{title}</h4>
        <div className="text-xs text-gray-500">
          {completeCount} complete / {rows.length} total{maxPairs ? ` • max ${maxPairs}` : ""}
        </div>
      </div>

      <div className="space-y-3">
        {rows.map((row, idx) => (
          <div key={idx} className="grid grid-cols-1 md:grid-cols-[1fr_140px_auto] gap-3 items-center">
            <select
              value={row.faculty}
              onChange={(e) => updateRow(idx, { faculty: e.target.value })}
              className="px-3 py-2 rounded-lg border-2 border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none text-black"
            >
              <option value="">{row.faculty ? "Clear faculty…" : "Select faculty…"}</option>
              {facultyOptions.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>

            <select
              value={row.year}
              onChange={(e) => updateRow(idx, { year: e.target.value })}
              className="px-3 py-2 rounded-lg border-2 border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none text-black"
            >
              <option value="">{row.year ? "Clear year…" : "Select year…"}</option>
              {yearOptions.map((y) => {
                const val = String(y);
                return (
                  <option key={val} value={val}>
                    Year {val}
                  </option>
                );
              })}
            </select>

            <button
              type="button"
              onClick={() => removeRow(idx)}
              className="justify-self-start md:justify-self-auto px-3 py-2 rounded-lg border text-sm hover:bg-gray-50"
              aria-label={`Remove row ${idx + 1}`}
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={addRow}
          disabled={!canAdd}
          className="px-4 py-2 rounded-lg border-2 border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Add pair
        </button>
        <button
          type="button"
          onClick={() => setRows([])}
          className="px-4 py-2 rounded-lg border-2 border-gray-200 hover:bg-gray-50"
        >
          Clear all
        </button>
      </div>

      {name && <input type="hidden" name={name} value={stringify(rows)} readOnly />}
    </div>
  );
}

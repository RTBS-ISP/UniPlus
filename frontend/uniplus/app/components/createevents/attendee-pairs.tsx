"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

type Pair = { faculty: string; year: string };

export type AttendeePairsProps = {
  value: string; // JSON string: [{ faculty, year }]
  onChange: (next: string) => void;
  facultyOptions: string[];
  yearOptions: Array<string | number>;
  maxPairs?: number;
  name?: string;
  title?: string;
};

function parsePairs(v: string): Pair[] {
  try {
    const arr = JSON.parse(v);
    if (!Array.isArray(arr)) return [];
    const seen = new Set<string>();
    const out: Pair[] = [];
    for (const x of arr) {
      const faculty = String(x?.faculty ?? "").trim();
      const year = String(x?.year ?? "").trim();
      if (!faculty || !year) continue;
      const key = `${faculty}::${year}`.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ faculty, year });
    }
    return out;
  } catch {
    return [];
  }
}

function stringifyPairs(arr: Pair[]): string {
  return JSON.stringify(arr);
}

function keyOf(p: Pair) {
  return `${p.faculty}::${p.year}`.toLowerCase();
}

export default function AttendeePairs({
  value,
  onChange,
  facultyOptions,
  yearOptions,
  maxPairs = 50,
  name,
  title = "Attendee (Faculty × Year)",
}: AttendeePairsProps) {
  // initialize from external value
  const [rows, setRows] = useState<Pair[]>(() => parsePairs(value));

  const completePairs = useMemo(() => rows.filter((r) => r.faculty && r.year), [rows]);

  // --- FIX 1: stable onChange via ref; emit only on real change
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    const next = stringifyPairs(completePairs);
    if (next !== value) {
      onChangeRef.current(next); // why: avoid infinite loop by skipping identical values
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [completePairs, value]);

  // keep in sync if parent changes externally
  useEffect(() => {
    const external = parsePairs(value);
    const externalStr = stringifyPairs(external);
    const currentStr = stringifyPairs(completePairs);
    if (externalStr !== currentStr) {
      setRows(external);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const dupKeys = useMemo(() => {
    const seen = new Set<string>();
    const dups = new Set<string>();
    for (const r of completePairs) {
      const k = keyOf(r);
      if (seen.has(k)) dups.add(k);
      else seen.add(k);
    }
    return dups;
  }, [completePairs]);

  const canAdd = rows.length < maxPairs;

  const updateRow = (idx: number, patch: Partial<Pair>) => {
    setRows((rs) => {
      const next = rs.slice();
      next[idx] = { ...next[idx], ...patch };
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
          {completePairs.length} pair(s){maxPairs ? ` • max ${maxPairs}` : ""}
        </div>
      </div>

      <div className="space-y-3">
        {rows.map((row, idx) => {
          const k = keyOf(row);
          const isDup = row.faculty && row.year && dupKeys.has(k);
          return (
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

              {isDup && (
                <div className="md:col-span-3 text-xs text-red-600">
                  Duplicate pair: {row.faculty} × Year {row.year}
                </div>
              )}
            </div>
          );
        })}
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

      {name && <input type="hidden" name={name} value={stringifyPairs(completePairs)} readOnly />}
    </div>
  );
}



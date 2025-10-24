"use client";

import { useEffect, useMemo, useState } from "react";

/* ---------- Types ---------- */
export type DaySlot = {
  date: string;        // YYYY-MM-DD
  startTime: string;   // HH:mm
  endTime: string;     // HH:mm
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

/* ---------- Helpers ---------- */
const todayStr = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};
/** current local time as HH:mm (zero-padded) */
const nowTimeStr = () => {
  const d = new Date();
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
};

const cmpDate = (a = "", b = "") => (a < b ? -1 : a > b ? 1 : 0);
/* HH:mm strings compare lexicographically */
const cmpTime = (a = "", b = "") => (a < b ? -1 : a > b ? 1 : 0);
const maxDate = (a: string, b: string) => (cmpDate(a, b) >= 0 ? a : b);
const maxTime = (a?: string, b?: string) => (!a ? b : !b ? a : (a >= b ? a : b));
const minTime = (a?: string, b?: string) => (!a ? b : !b ? a : (a <= b ? a : b));

/** Add minutes safely and wrap around 24h */
const addMinutes = (time: string, minutes: number) => {
  const [hh, mm] = time.split(":").map(Number);
  const total = hh * 60 + mm + minutes;
  const h = Math.floor(total / 60) % 24;
  const m = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
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

  // sync from parent
  useEffect(() => {
    if (!value) return;
    if (JSON.stringify(value) !== JSON.stringify(days)) setDays(value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(value)]);

  // push out
  useEffect(() => {
    onChange?.(days);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(days)]);

  const today = todayStr();

  /* ---- Date bounds ---- */
  const minDateForIndex = (i: number): string => {
    let min = today;
    if (i > 0 && days[i - 1]?.date) min = maxDate(min, days[i - 1].date);
    return min;
  };
  const maxDateForIndex = (i: number): string | undefined => {
    if (i < days.length - 1 && days[i + 1]?.date) return days[i + 1].date;
    return undefined;
  };

  /* ---- Neighbor times if SAME DATE ---- */
  const prevEndIfSameDate = (i: number): string | undefined => {
    const cur = days[i];
    const prev = days[i - 1];
    if (cur?.date && prev?.date && cur.date === prev.date) return prev.endTime || undefined;
    return undefined;
  };
  const nextStartIfSameDate = (i: number): string | undefined => {
    const cur = days[i];
    const next = days[i + 1];
    if (cur?.date && next?.date && cur.date === next.date) return next.startTime || undefined;
    return undefined;
  };

  /* ---- Clamp helpers ---- */
  const clampDate = (i: number, val: string) => {
    if (!val) return "";
    const min = minDateForIndex(i);
    const max = maxDateForIndex(i);
    if (cmpDate(val, min) < 0) val = min;
    if (max && cmpDate(val, max) > 0) val = max;
    return val;
  };

  /* ---- Time change handlers ---- */
  const patchDay = (i: number, patch: Partial<DaySlot>) =>
    setDays((prev) => prev.map((d, idx) => (idx === i ? { ...d, ...patch } : d)));

  const handleStartChange = (i: number, raw: string) => {
    if (!raw) return patchDay(i, { startTime: "" });
    if (!days[i]?.date) return; // no time without date

    const isToday = days[i].date === today;
    const now = isToday ? nowTimeStr() : undefined;

    const prevEnd = prevEndIfSameDate(i);
    const nextStart = nextStartIfSameDate(i);

    let newStart = raw;
    if (prevEnd && cmpTime(newStart, prevEnd) < 0) newStart = prevEnd;
    if (now && cmpTime(newStart, now) < 0) newStart = now;

    let newEnd = days[i].endTime;

    if (newEnd) {
      // cap end to nextStart if it exceeds neighbor
      if (nextStart && cmpTime(newEnd, nextStart) > 0) newEnd = nextStart;

      // ensure end ≥ start (+1 min minimum)
      if (cmpTime(newEnd, newStart) <= 0) newEnd = addMinutes(newStart, 1);

      // ensure not before 'now' when today (+1 min)
      const minValidEnd = [addMinutes(newStart, 1), now].filter(Boolean).reduce(maxTime, undefined);
      if (minValidEnd && cmpTime(newEnd, minValidEnd) < 0) {
        // if minValidEnd is a time (string), it's safe to pass to addMinutes
        newEnd = typeof minValidEnd === "string" ? minValidEnd : newEnd;
      }
    }

    patchDay(i, { startTime: newStart, endTime: newEnd ?? days[i].endTime });
  };

  const handleEndChange = (i: number, raw: string) => {
    if (!raw) return patchDay(i, { endTime: "" });
    if (!days[i]?.date) return;

    const isToday = days[i].date === today;
    const now = isToday ? nowTimeStr() : undefined;

    const prevEnd = prevEndIfSameDate(i);
    const nextStart = nextStartIfSameDate(i);
    const curStart = days[i].startTime;

    let newEnd = raw;

    // Compute minimum acceptable end: > start (start+1), ≥ prevEnd, ≥ now(if today)
    const startPlus1 = curStart ? addMinutes(curStart, 1) : undefined;
    const minEnd = [startPlus1, prevEnd, now].filter(Boolean).reduce(maxTime, undefined);
    if (minEnd && cmpTime(newEnd, minEnd) < 0) newEnd = minEnd;

    // end ≤ next.start if same date with next
    if (nextStart && cmpTime(newEnd, nextStart) > 0) newEnd = nextStart;

    // guard again in case nextStart == curStart (conflict) → try keep > start
    if (curStart && cmpTime(newEnd, curStart) <= 0) newEnd = addMinutes(curStart, 1);

    patchDay(i, { endTime: newEnd });
  };

  /* ---- Stabilize after any date/time change ---- */
  const sig = days.map((d) => `${d.date}|${d.startTime}|${d.endTime}`).join("||");
  useEffect(() => {
    setDays((prev) => {
      const now = nowTimeStr(); // computed once per stabilization pass
      let changed = false;
      const next = prev.map((slot, i) => {
        let { date, startTime, endTime } = slot;

        // Dates: no past, non-decreasing across neighbors
        if (date) {
          if (cmpDate(date, today) < 0) { date = today; changed = true; }
          if (i > 0 && prev[i - 1]?.date && cmpDate(date, prev[i - 1].date) < 0) {
            date = prev[i - 1].date; changed = true;
          }
          if (i < prev.length - 1 && prev[i + 1]?.date && cmpDate(date, prev[i + 1].date) > 0) {
            date = prev[i + 1].date; changed = true;
          }
        } else {
          if (startTime || endTime) { startTime = ""; endTime = ""; changed = true; }
        }

        if (date) {
          const isToday = date === today;
          const pEnd = i > 0 && prev[i - 1]?.date === date ? prev[i - 1].endTime : undefined;
          const nStart = i < prev.length - 1 && prev[i + 1]?.date === date ? prev[i + 1].startTime : undefined;

          // enforce start ≥ prev.end if same date
          if (pEnd && startTime && cmpTime(startTime, pEnd) < 0) { startTime = pEnd; changed = true; }
          // enforce start ≥ now if date is today
          if (isToday && startTime && cmpTime(startTime, now) < 0) { startTime = now; changed = true; }

          // compute required minimum end = max(start+1, now(if today), prevEnd)
          const startPlus1 = startTime ? addMinutes(startTime, 1) : undefined;
          const reqMinEnd = [startPlus1, isToday ? now : undefined, pEnd]
            .filter(Boolean)
            .reduce(maxTime, undefined);

          // enforce end ≥ required minimum
          if (reqMinEnd && endTime && cmpTime(endTime, reqMinEnd) < 0) {
            endTime = reqMinEnd; changed = true;
          }
          // enforce end ≤ next.start if same date
          if (nStart && endTime && cmpTime(endTime, nStart) > 0) {
            endTime = nStart; changed = true;
          }
          // final guard: ensure end > start if both exist
          if (startTime && endTime && cmpTime(endTime, startTime) <= 0) {
            endTime = addMinutes(startTime, 1); changed = true;
          }
        }

        if (date !== slot.date || startTime !== slot.startTime || endTime !== slot.endTime) {
          return { ...slot, date, startTime, endTime };
        }
        return slot;
      });
      return changed ? next : prev;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig]);

  /* ---- UI helpers ---- */
  const canAdd = useMemo(
    () => (maxDays ? days.length < maxDays : true),
    [days.length, maxDays]
  );
  const canRemove = (i: number) => days.length > minDays && i >= 0 && i < days.length;

  const addDay = () => canAdd && setDays((prev) => [...prev, { ...emptyDay }]);
  const removeDay = (i: number) =>
    canRemove(i) && setDays((prev) => prev.filter((_, idx) => idx !== i));

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
          <PlusIcon className="h-4 w-4" /> Add Day
        </button>
      </div>

      <div className="space-y-6">
        {days.map((d, i) => {
          const dateMin = minDateForIndex(i);
          const dateMax = maxDateForIndex(i);
          const hasDate = !!d.date;

          const prevEnd = hasDate ? prevEndIfSameDate(i) : undefined;
          const nextStart = hasDate ? nextStartIfSameDate(i) : undefined;

          const isToday = hasDate && d.date === today;
          const now = isToday ? nowTimeStr() : undefined;

          // START: min = max(prev.end, now(if today)); no max
          const startMin = hasDate ? [prevEnd, now].filter(Boolean).reduce(maxTime, undefined) : undefined;
          const startDisabled = !hasDate;

          // END: min = max(start+1, prevEnd, now(if today)); max = next.start if same-date with next
          const startPlus1 = hasDate && d.startTime ? addMinutes(d.startTime, 1) : undefined;
          const endMin = hasDate
            ? [startPlus1, prevEnd, now].filter(Boolean).reduce(maxTime, undefined)
            : undefined;
          const endMax = hasDate ? nextStart : undefined;
          const endDisabled =
            !hasDate || (endMin && endMax && cmpTime(endMin, endMax) > 0);

          return (
            <div key={i} className="rounded-xl border border-gray-200 bg-white p-5">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800">Day {i + 1}</h3>
                <button
                  type="button"
                  onClick={() => removeDay(i)}
                  disabled={!canRemove(i)}
                  className="inline-flex items-center gap-1 text-sm font-medium text-red-500 hover:text-red-400 disabled:opacity-0"
                >
                  <TrashIcon className="h-4 w-4" /> Remove
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
                    onChange={(e) => patchDay(i, { date: clampDate(i, e.target.value) })}
                    min={dateMin}
                    max={dateMax}
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
                    step="60"
                    value={d.startTime}
                    onChange={(e) => handleStartChange(i, e.target.value)}
                    min={startMin}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none disabled:opacity-50"
                    required
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    End Time <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    step="60"
                    value={d.endTime}
                    onChange={(e) => handleEndChange(i, e.target.value)}
                    min={endMin}
                    max={endMax}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none disabled:opacity-50"
                    required
                  />
                </div>
              </div>

              {/* Location per day */}
              <div className="mt-5 grid gap-4">
                <div className="flex items-center gap-3 rounded-xl bg-gray-50 p-3">
                  <input
                    id={`isOnline-${i}`}
                    type="checkbox"
                    checked={d.isOnline}
                    onChange={(e) => patchDay(i, { isOnline: e.target.checked })}
                    className="h-5 w-5 rounded text-indigo-600 focus:ring-2 focus:ring-indigo-500"
                  />
                  <label htmlFor={`isOnline-${i}`} className="text-sm font-medium text-gray-800">
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
                      onChange={(e) => patchDay(i, { meetingLink: e.target.value })}
                      placeholder="https://zoom.us/j/..."
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none"
                      required
                    />
                  </div>
                ) : (
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Event Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={d.address}
                      onChange={(e) => patchDay(i, { address: e.target.value })}
                      placeholder="Room 203, Building 15, Campus"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none"
                      required
                    />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* --- Simple icons --- */
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

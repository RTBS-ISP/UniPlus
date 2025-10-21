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

/* ---------- Helpers (match detail page formats) ---------- */
function formatDateGB(s: string) {
  try {
    const d = new Date(s);
    return new Intl.DateTimeFormat("en-GB", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      timeZone: "UTC",
    }).format(d);
  } catch {
    return s;
  }
}
const dateKey = (d: string) => new Date(d + "T00:00:00Z").getTime();

/** group consecutive days sharing identical time window & mode */
function groupConsecutiveDays(sessions: DaySlot[]) {
  const valid = sessions.filter((s) => s.date && s.startTime && s.endTime);
  if (!valid.length) return [];
  const sorted = [...valid].sort((a, b) => dateKey(a.date) - dateKey(b.date));

  type Group = {
    start: string;
    end: string;
    startTime: string;
    endTime: string;
    isOnline: boolean;
    items: DaySlot[];
  };

  const groups: Group[] = [];
  let cur: Group = {
    start: sorted[0].date,
    end: sorted[0].date,
    startTime: sorted[0].startTime,
    endTime: sorted[0].endTime,
    isOnline: sorted[0].isOnline,
    items: [sorted[0]],
  };

  for (let i = 1; i < sorted.length; i++) {
    const s = sorted[i];
    const prevDay = dateKey(cur.end);
    const thisDay = dateKey(s.date);
    const isConsecutive = thisDay - prevDay === 24 * 60 * 60 * 1000;
    const sameWindow =
      s.startTime === cur.startTime &&
      s.endTime === cur.endTime &&
      s.isOnline === cur.isOnline;

    if (isConsecutive && sameWindow) {
      cur.end = s.date;
      cur.items.push(s);
    } else {
      groups.push(cur);
      cur = {
        start: s.date,
        end: s.date,
        startTime: s.startTime,
        endTime: s.endTime,
        isOnline: s.isOnline,
        items: [s],
      };
    }
  }
  groups.push(cur);
  return groups;
}

/* ---------- Component ---------- */
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
    if (!value) return;
    const same = JSON.stringify(value) === JSON.stringify(days);
    if (!same) setDays(value);
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

  // live preview data
  const groups = useMemo(() => groupConsecutiveDays(days), [days]);

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

      {/* Form (left) + Live preview (right) */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* LEFT: form list */}
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
                      placeholder="Room 203, Building 15, Campus"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none"
                      required
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* RIGHT: live preview */}
        <aside className="md:sticky md:top-6 h-fit space-y-3">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h4 className="mb-3 text-lg font-semibold text-gray-800">Preview</h4>

            {groups.length === 0 ? (
              <p className="text-sm text-gray-500">Fill in dates to see a preview.</p>
            ) : (
              <div className="space-y-3">
                {groups.map((g, idx) => {
                  const sameDay = g.start === g.end;
                  const dateLabel = sameDay
                    ? formatDateGB(g.start)
                    : `${formatDateGB(g.start)} – ${formatDateGB(g.end)}`;

                  // Check if all items share exact same location/link
                  const first = g.items[0];
                  const allSameLocation = g.items.every((it) =>
                    g.isOnline
                      ? it.meetingLink === first.meetingLink
                      : it.address === first.address
                  );

                  return (
                    <div
                      key={`${g.start}-${g.end}-${idx}`}
                      className="rounded-xl border border-gray-100 bg-gray-50 p-4"
                    >
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="inline-flex h-6 items-center rounded-md bg-white px-2 text-xs font-semibold text-[#0B1220]">
                          {sameDay ? `Day ${idx + 1}` : `Days ${idx + 1}–${idx + g.items.length}`}
                        </span>
                        <span className="text-sm font-semibold text-[#0B1220]">{dateLabel}</span>
                        <span className="text-sm text-[#0B1220]/80">
                          — {g.startTime}–{g.endTime}
                        </span>
                        <span className="ml-auto text-xs rounded bg-white px-2 py-0.5 text-[#0B1220]/70">
                          {g.isOnline ? "Online" : "On campus"}
                        </span>
                      </div>

                      {/* Location(s) */}
                      {!g.isOnline ? (
                        allSameLocation ? (
                          <div className="mt-2 text-sm text-[#0B1220]/80">
                            <div className="font-medium text-[#0B1220]">{first.address || "—"}</div>
                          </div>
                        ) : (
                          <ul className="mt-3 space-y-1 text-sm">
                            {g.items.map((it) => (
                              <li
                                key={`${it.date}-${it.startTime}-${it.endTime}`}
                                className="rounded-md bg-white/80 px-3 py-2 text-[#0B1220]/85"
                              >
                                <div className="font-semibold">{formatDateGB(it.date)}</div>
                                <div className="text-xs">{it.startTime}–{it.endTime}</div>
                                <div className="mt-0.5 text-[#0B1220]">{it.address || "—"}</div>
                              </li>
                            ))}
                          </ul>
                        )
                      ) : (
                        <div className="mt-2 text-sm text-[#0B1220]/80">
                          {allSameLocation ? (
                            <>
                              <div className="font-medium text-[#0B1220]">Meeting link</div>
                              <div className="break-all">{first.meetingLink || "—"}</div>
                            </>
                          ) : (
                            <ul className="mt-2 space-y-1">
                              {g.items.map((it) => (
                                <li
                                  key={`${it.date}-${it.startTime}-${it.endTime}-online`}
                                  className="rounded-md bg-white/80 px-3 py-2 text-[#0B1220]/85"
                                >
                                  <div className="font-semibold">{formatDateGB(it.date)}</div>
                                  <div className="text-xs">{it.startTime}–{it.endTime}</div>
                                  <div className="mt-0.5 break-all text-[#0B1220]">
                                    {it.meetingLink || "—"}
                                  </div>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </aside>
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

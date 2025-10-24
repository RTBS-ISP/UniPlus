"use client";

import { useMemo } from "react";
import type { DaySlot } from "./EventScheduleDays";

/** Format "YYYY-MM-DD" -> "dd-mm-yyyy" (blank-safe) */
function fmtDMY(iso?: string) {
  if (!iso) return "";
  const parts = iso.split("-");
  if (parts.length !== 3) return iso ?? "";
  const [y, m, d] = parts;
  return `${d}-${m}-${y}`;
}

function buildWhereLabel(d: DaySlot) {
  const datePart = d.date ? fmtDMY(d.date) : "Date TBD";
  if (d.isOnline) {
    return `${datePart} • Online${d.meetingLink ? " • Link provided" : " • Link TBD"}`;
  }
  const addr = (d.address || "").trim();
  return `${datePart} • ${addr ? addr : "Location TBD"}`;
}

export default function LiveSummaryCard({
  scheduleDays,
  category,
  registrationStartDate,
  registrationEndDate,
  maxAttendee,
  tags,
  imagePreview,
}: {
  scheduleDays: DaySlot[];
  category: string;
  registrationStartDate: string;
  registrationEndDate: string;
  maxAttendee: string;
  tags: string[];
  imagePreview?: string;
}) {
  const summary = useMemo(() => {
    const first = scheduleDays.find((d) => d.date && d.startTime);
    const last = [...scheduleDays].reverse().find((d) => d.date && d.endTime);

    const when =
      first && last
        ? `${fmtDMY(first.date!)} • ${first.startTime} → ${fmtDMY(last.date!)} • ${last.endTime}`
        : "TBD";

    const whereList = scheduleDays
      .filter((d) => d.date && (d.isOnline || (d.address && d.address.trim())))
      .map((d) => buildWhereLabel(d));

    if (whereList.length === 0) {
      const dated = scheduleDays.filter((d) => d.date);
      if (dated.length) {
        dated.forEach((d) => whereList.push(`${fmtDMY(d.date!)} • Location TBD`));
      } else {
        whereList.push("Location TBD");
      }
    }

    const capacity = maxAttendee ? `${maxAttendee} people` : "Unlimited";

    return {
      when,
      whereList,
      capacity,
      tags: tags.length ? tags.join(", ") : "—",
    };
  }, [scheduleDays, maxAttendee, tags]);

  const hasMultipleWhere = summary.whereList.length > 1;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sticky top-30">
      <h3 className="text-base font-semibold text-gray-900">Live Summary</h3>

      <dl className="mt-4 space-y-4">
        <div>
          <dt className="text-xs uppercase tracking-wide text-gray-500">When</dt>
          <dd className="text-sm text-gray-900 max-w-full break-words">
            {summary.when || "TBD"}
          </dd>
        </div>

        <div>
          <dt className="text-xs uppercase tracking-wide text-gray-500">Where</dt>
          <dd className="text-sm text-gray-900 max-w-full overflow-hidden">
            {hasMultipleWhere ? (
              <ul className="mt-1 list-disc pl-5 space-y-1 pr-2">
                {summary.whereList.map((w, i) => (
                  <li
                    key={i}
                    title={w}
                    className="
                      max-w-full break-words break-all whitespace-normal 
                      [overflow-wrap:anywhere] line-clamp-3 overflow-hidden text-ellipsis"
                    style={{
                      display: "-webkit-box",
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {w}
                  </li>
                ))}
              </ul>
            ) : (
              <span
                title={summary.whereList[0]}
                className="
                  max-w-full break-words break-all whitespace-normal 
                  [overflow-wrap:anywhere] line-clamp-3 overflow-hidden text-ellipsis"
                style={{
                  display: "-webkit-box",
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {summary.whereList[0]}
              </span>
            )}
          </dd>
        </div>

        <div>
          <dt className="text-xs uppercase tracking-wide text-gray-500">Category</dt>
          <dd className="text-sm text-gray-900">{category || "—"}</dd>
        </div>

        <div>
          <dt className="text-xs uppercase tracking-wide text-gray-500">Capacity</dt>
          <dd className="text-sm text-gray-900">{summary.capacity || "Unlimited"}</dd>
        </div>

        <div>
          <dt className="text-xs uppercase tracking-wide text-gray-500">Tags</dt>
          <dd className="text-sm text-gray-900">{summary.tags !== "—" ? summary.tags : "—"}</dd>
        </div>

        <hr className="border-gray-200" />

        <div>
          <dt className="text-xs uppercase tracking-wide text-gray-500">Registration Period</dt>
          <dd className="text-sm text-gray-900">
            {registrationStartDate && registrationEndDate
              ? `${new Date(registrationStartDate).toLocaleString()} — ${new Date(
                  registrationEndDate
                ).toLocaleString()}`
              : "Not specified"}
          </dd>
        </div>

        {imagePreview && (
          <div className="pt-2">
            <dt className="text-xs uppercase tracking-wide text-gray-500">Event Image</dt>
            <img
              src={imagePreview}
              alt="Preview"
              className="mt-2 h-24 w-full rounded-md object-cover border border-gray-200"
            />
          </div>
        )}
      </dl>
    </div>
  );
}

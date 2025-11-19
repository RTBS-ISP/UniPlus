"use client";

import React from "react";
import { CheckCircle, XCircle } from "lucide-react";
import type { Attendee, TableView } from "@/lib/dashboard/types";
import { formatDate, formatDateTime, getCheckinTimeForDate } from "@/lib/utils/formatDate";

export function AttendeeTable({
  view,
  data,
  selected,
  toggle,
  onApprove,
  onReject,
  onCheckIn,
}: {
  view: TableView;
  data: Attendee[];
  selected: string[];
  toggle: (id: string) => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onCheckIn: (id: string) => void;
}) {
  const isApproval = view === "approval";
  const isAttendance = view === "attendance";

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="w-full">
        <thead>
          <tr className="bg-indigo-500 text-white">
            {isApproval && <th className="px-6 py-3 text-center font-bold text-sm">Select</th>}
            <th className="px-6 py-3 text-left font-bold text-sm">TICKET ID</th>
            <th className="px-6 py-3 text-left font-bold text-sm">NAME</th>
            <th className="px-6 py-3 text-left font-bold text-sm">EMAIL</th>
            <th className="px-6 py-3 text-center font-bold text-sm">STATUS</th>
            <th className="px-6 py-3 text-left font-bold text-sm">REGISTERED</th>
            {isAttendance ? (
              <th className="px-6 py-3 text-left font-bold text-sm">CHECKED IN</th>
            ) : (
              <th className="px-6 py-3 text-left font-bold text-sm">APPROVAL</th>
            )}
          </tr>
        </thead>

        <tbody className="bg-white">
          {data.length > 0 ? (
            data.map((a) => (
              <tr
                key={a.ticketId}
                className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
              >
                {isApproval && (
                  <td className="px-6 py-4 text-center">
                    <input
                      type="checkbox"
                      checked={selected.includes(a.ticketId)}
                      onChange={() => toggle(a.ticketId)}
                      className="w-4 h-4 cursor-pointer"
                    />
                  </td>
                )}

                {/* ✅ Display the friendly ticket ID, but use real ticketId for functionality */}
                <td className="px-6 py-4 text-gray-800 font-medium group relative">
                  <span>{a.displayTicketId || a.ticketId}</span>
                  
                  {/* Tooltip showing full QR code on hover */}
                  {a.displayTicketId && (
                    <div className="hidden group-hover:block absolute z-10 bottom-full left-0 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap shadow-lg">
                      Full QR: {a.ticketId}
                      <div className="absolute top-full left-4 -mt-1 border-4 border-transparent border-t-gray-900"></div>
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 text-gray-800 font-medium">{a.name}</td>
                <td className="px-6 py-4 text-gray-800">{a.email}</td>

                <td className="px-6 py-4 text-center">
                  {isAttendance ? (
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                        a.status === "present"
                          ? "bg-lime-500 text-white"
                          : "bg-yellow-400 text-white"
                      }`}
                    >
                      {a.status === "present" ? "Present" : "Pending"}
                    </span>
                  ) : (
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                        a.approvalStatus === "approved"
                          ? "bg-lime-500 text-white"
                          : a.approvalStatus === "rejected"
                          ? "bg-red-400 text-white"
                          : "bg-yellow-400 text-white"
                      }`}
                    >
                      {a.approvalStatus === "approved"
                        ? "Approved"
                        : a.approvalStatus === "rejected"
                        ? "Rejected"
                        : "Pending"}
                    </span>
                  )}
                </td>

                <td className="px-6 py-4 text-gray-800">
                  {a.registered ? formatDateTime(a.registered) : "—"}
                </td>

                {isAttendance ? (
                  <td className="px-6 py-4 text-gray-800">
                    {(() => {
                      const checkinTime = getCheckinTimeForDate(a.checkedInDates, a.eventDate);
                      
                      if (!checkinTime) {
                        return (
                          <button
                            onClick={() => onCheckIn(a.ticketId)}
                            className="px-3 py-1 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 text-sm"
                          >
                            Check In
                          </button>
                        );
                      }
                      
                      return formatDateTime(checkinTime);
                    })()}
                  </td>
                ) : (
                  <td className="px-6 py-4 text-gray-800">
                    {a.approvalStatus === "pending" ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => onApprove(a.ticketId)}
                          className="p-2 bg-lime-500 hover:bg-lime-600 rounded-lg transition-colors"
                          title="Approve"
                        >
                          <CheckCircle size={20} className="text-white" />
                        </button>
                        <button
                          onClick={() => onReject(a.ticketId)}
                          className="p-2 bg-red-400 hover:bg-red-500 rounded-lg transition-colors"
                          title="Reject"
                        >
                          <XCircle size={20} className="text-white" />
                        </button>
                      </div>
                    ) : (
                      <span className="text-gray-800">
                         {a.approvalStatus === "approved" && a.approvedAt
                            ? formatDateTime(a.approvedAt)
                            : a.approvalStatus === "rejected" && a.rejectedAt
                            ? formatDateTime(a.rejectedAt)
                            : formatDateTime(a.registered)}
                      </span>
                    )}
                  </td>
                )}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={isApproval ? 7 : 6} className="px-6 py-8 text-center text-gray-500">
                No data found matching your search.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

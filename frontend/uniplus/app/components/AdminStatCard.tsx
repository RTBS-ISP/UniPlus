"use client";

import React from "react";
import { Calendar, CheckCircle, Clock, XCircle } from "lucide-react";

interface Statistics {
  total_events: number;
  approved_events: number;
  pending_events: number;
  rejected_events: number;
}

export function AdminStatCards({ stats }: { stats: Statistics | null }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
      {/* Total Events */}
      <div className="bg-indigo-500 rounded-lg p-6 flex flex-col shadow-md">
        <Calendar size={32} className="text-white font-extrabold mb-3" />
        <div className="flex text-white text-3xl font-extrabold mb-1">
          {stats?.total_events || 0}
        </div>
        <div className="text-white font-extrabold">Total Events</div>
      </div>

      {/* Approved Events */}
      <div className="bg-lime-500 rounded-lg p-6 flex flex-col shadow-md">
        <CheckCircle size={32} className="text-white font-extrabold mb-3" />
        <div className="flex text-white text-3xl font-extrabold mb-1">
          {stats?.approved_events || 0}
        </div>
        <div className="text-white font-extrabold">Approved</div>
      </div>

      {/* Pending Events */}
      <div className="bg-yellow-400 rounded-lg p-6 flex flex-col shadow-md">
        <Clock size={32} className="text-white font-extrabold mb-3" />
        <div className="flex text-white text-3xl font-extrabold mb-1">
          {stats?.pending_events || 0}
        </div>
        <div className="text-white font-extrabold">Pending</div>
      </div>

      {/* Rejected Events */}
      <div className="bg-red-400 rounded-lg p-6 flex flex-col shadow-md">
        <XCircle size={32} className="text-white font-extrabold mb-3" />
        <div className="flex text-white text-3xl font-extrabold mb-1">
          {stats?.rejected_events || 0}
        </div>
        <div className="text-white font-extrabold">Rejected</div>
      </div>
    </div>
  );
}
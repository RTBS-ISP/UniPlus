"use client";

import React from "react";
import { Clock, User, UserCheck, XCircle } from "lucide-react";
import type { Statistics } from "@/lib/dashboard/types";

export function AttendanceStatCards({
  total,
  present,
  pending,
  rate,
}: {
  total: number;
  present: number;
  pending: number;
  rate: number;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div className="bg-indigo-500 rounded-lg p-6 flex flex-col shadow-md">
        <User size={32} className="font-extrabold mb-3" />
        <div className="flex text-white text-3xl font-extrabold mb-1">{total}</div>
        <div className="text-white font-extrabold">Total Registered</div>
      </div>
      <div className="bg-lime-500 rounded-lg p-6 flex flex-col shadow-md">
        <UserCheck size={32} className="font-extrabold mb-3" />
        <div className="flex text-white text-3xl font-extrabold mb-1">{present}</div>
        <div className="text-white font-extrabold">Checked In</div>
      </div>
      <div className="bg-yellow-400 rounded-lg p-6 flex flex-col shadow-md">
        <Clock size={32} className="font-extrabold mb-3" />
        <div className="flex text-white text-3xl font-extrabold mb-1">{pending}</div>
        <div className="text-white font-extrabold">Pending Check-In</div>
      </div>
      <div className="bg-pink-400 rounded-lg p-6 flex flex-col shadow-md">
        <div className="text-white text-3xl font-bold">{rate.toFixed(0)}%</div>
        <div className="text-white mt-2 font-extrabold">Attendance Rate</div>
        <div className="w-full bg-gray-300 h-2 rounded-full mt-3">
          <div
            className="h-2 bg-white rounded-full transition-all duration-500 ease-out"
            style={{ width: `${rate}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export function ApprovalStatCards({ stats }: { stats: Statistics | null }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div className="bg-indigo-500 rounded-lg p-6 flex flex-col shadow-md">
        <User size={32} className="font-extrabold mb-3" />
        <div className="flex text-white text-3xl font-extrabold mb-1">
          {stats?.total_registered || 0}
        </div>
        <div className="text-white font-extrabold">Total Registered</div>
      </div>
      <div className="bg-lime-500 rounded-lg p-6 flex flex-col shadow-md">
        <UserCheck size={32} className="font-extrabold mb-3" />
        <div className="flex text-white text-3xl font-extrabold mb-1">
          {stats?.approved || 0}
        </div>
        <div className="text-white font-extrabold">Approved</div>
      </div>
      <div className="bg-yellow-400 rounded-lg p-6 flex flex-col shadow-md">
        <Clock size={32} className="font-extrabold mb-3" />
        <div className="flex text-white text-3xl font-extrabold mb-1">
          {stats?.pending_approval || 0}
        </div>
        <div className="text-white font-extrabold">Pending Approval</div>
      </div>
      <div className="bg-red-400 rounded-lg p-6 flex flex-col shadow-md">
        <XCircle size={32} className="font-extrabold mb-3" />
        <div className="flex text-white text-3xl font-extrabold mb-1">
          {stats?.rejected || 0}
        </div>
        <div className="text-white font-extrabold">Rejected</div>
      </div>
    </div>
  );
}

"use client";

import React, { useState } from "react";
import { QrCode, UserCheck, Camera, X } from "lucide-react";
import { QRScanner } from "./QRScanner";

export function QRCheckIn({ onSubmit }: { onSubmit: (val: string) => void }) {
  const [val, setVal] = useState("");
  const [cameraOn, setCameraOn] = useState(false);

  const handle = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const ticket = val.trim();
    if (ticket) onSubmit(ticket);
    setVal("");
  };

  return (
    <div className="rounded-lg shadow-sm p-8 mb-8 bg-white w-full">
      <div className="flex flex-row items-center w-full mb-2 gap-3">
        <div className="p-3 bg-indigo-100 rounded-lg">
          <QrCode size={42} className="text-indigo-500" />
        </div>
        <div className="flex flex-col w-full">
          <div className="text-gray-800 text-3xl font-extrabold w-full">QR Code Scanner</div>
          <div className="text-gray-400 text-base font-medium w-full">
            Scan attendee tickets or paste the Ticket ID to check in
          </div>
        </div>
      </div>

      {/* Camera Toggle Button */}
      <button
        type="button"
        onClick={() => setCameraOn(!cameraOn)}
        className="flex items-center gap-2 px-4 py-2 mb-4 text-indigo-600 border border-indigo-300 rounded-lg hover:bg-indigo-50 transition"
      >
        {cameraOn ? <X size={18} /> : <Camera size={18} />}
        {cameraOn ? "Close Camera" : "Use Camera Scan"}
      </button>

      {/* Camera Scanner */}
      {cameraOn && (
        <div className="mb-6">
          <QRScanner
            onScan={(ticketId) => {
              onSubmit(ticketId);
              setCameraOn(false);
            }}
          />
        </div>
      )}

      {/* Manual Input */}
      <form className="flex gap-3" onSubmit={handle}>
        <input
          name="ticket"
          type="text"
          value={val}
          onChange={(e) => setVal(e.target.value)}
          placeholder="Scan QR code or enter Ticket ID (e.g., T123456)"
          className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition text-gray-800 placeholder-gray-400"
        />
        <button
          type="submit"
          className="inline-flex items-center justify-center w-full px-4 py-1 text-base font-bold leading-6 text-white bg-indigo-500 border border-transparent rounded-lg md:w-auto hover:bg-indigo-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <UserCheck className="mr-1" /> Check In
        </button>
      </form>
    </div>
  );
}

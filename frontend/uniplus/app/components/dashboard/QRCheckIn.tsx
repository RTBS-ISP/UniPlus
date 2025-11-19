"use client";

import React, { useState } from "react";
import { QrCode, UserCheck, Camera, X, Copy } from "lucide-react";
import { QRScanner } from "./QRScanner";

export function QRCheckIn({ onSubmit }: { onSubmit: (val: string) => void }) {
  const [val, setVal] = useState("");
  const [cameraOn, setCameraOn] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handle = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const ticket = val.trim();
    if (ticket && !isSubmitting) {
      setIsSubmitting(true);
      try {
        await onSubmit(ticket);
        setVal(""); 
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleScan = async (ticketId: string) => {
    if (!isSubmitting) {
      setIsSubmitting(true);
      try {
        await onSubmit(ticketId);
        setCameraOn(false); 
      } finally {
        setIsSubmitting(false);
      }
    }
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
            Scan QR codes in the tickets or enter the Ticket ID manually to check in
          </div>
        </div>
      </div>

      {/* Camera Toggle Button */}
      <button
        type="button"
        onClick={() => setCameraOn(!cameraOn)}
        disabled={isSubmitting}
        className="flex items-center gap-2 px-4 py-2 mb-4 text-indigo-600 border border-indigo-300 rounded-lg hover:bg-indigo-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {cameraOn ? <X size={18} /> : <Camera size={18} />}
        {cameraOn ? "Close Camera" : "Use Camera Scan"}
      </button>

      {/* Camera Scanner */}
      {cameraOn && (
        <div className="mb-6">
          <QRScanner onScan={handleScan} />
        </div>
      )}

      {/* Manual Input */}
      <form className="space-y-3" onSubmit={handle}>
        <div className="flex gap-3">
          <input
            name="ticket"
            type="text"
            value={val}
            onChange={(e) => setVal(e.target.value)}
            disabled={isSubmitting}
            placeholder="Scan QR code or enter Ticket ID (e.g., T123456)"
            className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition text-gray-800 placeholder-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <button
            type="submit"
              disabled={isSubmitting || !val.trim()}
              className="inline-flex items-center justify-center px-6 py-3 text-base font-bold leading-6 text-white bg-indigo-500 border border-transparent rounded-lg hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed transition whitespace-nowrap"
          >
              <UserCheck className="mr-2" size={20} /> 
              {isSubmitting ? "Checking..." : "Check In"}
          </button>
        </div>
      </form>
      
      {isSubmitting && (
        <div className="mt-4 text-center text-indigo-600 text-sm font-medium animate-pulse">
          Processing check-in...
        </div>
      )}
    </div>
  );
}

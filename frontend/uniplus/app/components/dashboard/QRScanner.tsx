"use client";

import { useState } from "react";
import QrScanner from "react-qr-barcode-scanner";

export function QRScanner({ onScan }: { onScan: (code: string) => void }) {
  const [last, setLast] = useState("");

  return (
    <div className="w-full p-4 bg-white border rounded-xl shadow-sm flex flex-col items-center">
      <div className="font-bold text-gray-700 text-lg mb-2">Camera Scan</div>

      <div style={{ width: "100%", maxWidth: 450, height: "auto" }}>
        <QrScanner
          onUpdate={(err, result) => {
            if (result) {
              const text = result.getText().trim();
              if (text !== last) {
                setLast(text);
                onScan(text);
              }
            }
          }}
          facingMode="environment"
        />
      </div>

      <div className="mt-2 text-sm text-gray-400">Scanning…</div>
    </div>
  );
}

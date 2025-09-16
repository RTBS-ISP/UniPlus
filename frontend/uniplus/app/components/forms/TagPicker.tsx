"use client";

import { useState } from "react";

export default function TagPicker({
  value,
  onChange,
  options,
}: {
  value: string[];
  onChange: (v: string[]) => void;
  options: string[];
}) {
  const [open, setOpen] = useState(false);

  const toggle = (label: string) => {
    const has = value.includes(label);
    const next = has ? value.filter((v) => v !== label) : [...value, label];
    onChange(next);
  };

  return (
    <div>
      {/* control */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setOpen((s) => !s)}
          className="w-full rounded-full bg-white px-4 py-2 text-left text-sm ring-1 ring-gray-200 hover:ring-gray-300"
        >
          Select Tags
        </button>
        <span className="select-none text-lg leading-none">▾</span>
      </div>

      {/* selected chips */}
      <div className="mt-3 flex flex-wrap gap-2">
        {value.map((v) => (
          <Chip key={v} label={v} onClick={() => toggle(v)} selected />
        ))}
      </div>

      {/* dropdown */}
      {open && (
        <div className="mt-2 rounded-xl bg-white p-3 shadow-lg ring-1 ring-gray-200">
          <div className="flex flex-wrap gap-2">
            {options.map((o) => (
              <Chip
                key={o}
                label={o}
                onClick={() => toggle(o)}
                selected={value.includes(o)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Chip({
  label,
  onClick,
  selected,
}: {
  label: string;
  onClick: () => void;
  selected?: boolean;
}) {
  const { bg, text } = chipColors(label);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1 text-xs font-medium ${
        selected ? "ring-2 ring-black/50" : ""
      }`}
      style={{ backgroundColor: bg, color: text }}
      title={label}
    >
      {label}
    </button>
  );
}

// color rules (Organizer, University, Student)
function chipColors(label: string): { bg: string; text: string } {
  const v = label.toLowerCase();
  if (v === "organizer") return { bg: "#D87C70", text: "#ffffff" };
  if (v === "university") return { bg: "#70D8D3", text: "#0b3a38" };
  if (v === "student" || v === "students") return { bg: "#D8C170", text: "#3a2f0b" };
  // neutral
  return { bg: "#E5E7EB", text: "#374151" }; // gray-200 / gray-700
}

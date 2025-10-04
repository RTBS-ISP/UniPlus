"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

type TagsDropdownProps = {
  valueCSV: string;
  onChangeCSV: (next: string) => void;
  options: string[];
  placeholder?: string;
  maxTags?: number;
  name?: string; 
};

const splitCSV = (v: string) => v.split(",").map((s) => s.trim()).filter(Boolean);
const joinCSV = (arr: string[]) => arr.join(", ");

export default function TagDropdown({
  valueCSV,
  onChangeCSV,
  options,
  placeholder = "Select tags…",
  maxTags,
  name,
}: TagsDropdownProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = useMemo(() => splitCSV(valueCSV), [valueCSV]);
  const selectedSet = useMemo(() => new Set(selected.map((s) => s.toLowerCase())), [selected]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = q ? options.filter((o) => o.toLowerCase().includes(q)) : options;
    return base.slice(0, 200);
  }, [options, query]);

  const emitArr = useCallback((arr: string[]) => onChangeCSV(joinCSV(arr)), [onChangeCSV]);

  const toggle = useCallback(
    (opt: string) => {
      const low = opt.toLowerCase();
      const exists = selectedSet.has(low);
      if (!exists) {
        if (maxTags && selected.length >= maxTags) return;
        emitArr([...selected, opt]);
      } else {
        emitArr(selected.filter((t) => t.toLowerCase() !== low));
      }
    },
    [emitArr, maxTags, selected, selectedSet]
  );

  const removeTag = (opt: string) => {
    emitArr(selected.filter((t) => t.toLowerCase() !== opt.toLowerCase()));
    buttonRef.current?.focus();
  };

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current) return;
      if (rootRef.current.contains(e.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  useEffect(() => {
    if (!open) return;
    setActiveIndex(0);
    const t = setTimeout(() => inputRef.current?.focus(), 0);
    return () => clearTimeout(t);
  }, [open]);

  const onKeyDownList = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      buttonRef.current?.focus();
      return;
    }
    if (e.key === "Tab") {
      setOpen(false);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filtered[activeIndex]) toggle(filtered[activeIndex]);
    }
  };

  return (
    <div ref={rootRef} className="relative">
      {/* Selected chips */}
      <div className="mb-2 flex flex-wrap gap-2">
        {selected.map((tag) => (
          <span key={tag} className="inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-sm">
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              aria-label={`Remove ${tag}`}
              className="rounded p-0.5 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            >
              ×
            </button>
          </span>
        ))}
      </div>

      {/* Trigger */}
      <button
        ref={buttonRef}
        type="button"
        className="w-full justify-between px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition text-left text-black bg-white"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <span className={selected.length ? "text-black" : "text-gray-400"}>
          {selected.length ? `${selected.length} selected` : placeholder}
        </span>
        <span className="float-right">▾</span>
      </button>

      {/* Hidden input for non-JS form posts */}
      {name && <input type="hidden" name={name} value={valueCSV} readOnly />}

      {/* Dropdown panel */}
      {open && (
        <div
          role="listbox"
          aria-multiselectable="true"
          onKeyDown={onKeyDownList}
          className="absolute z-20 mt-2 w-full rounded-xl border-2 border-gray-200 bg-white shadow-xl"
        >
          <div className="p-2 border-b">
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search tags…"
              className="w-full px-3 py-2 rounded-lg border focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none"
              aria-label="Search tags"
            />
          </div>
          <ul className="max-h-64 overflow-auto py-1">
            {filtered.length === 0 && <li className="px-3 py-2 text-sm text-gray-500">No matches</li>}
            {filtered.map((opt, idx) => {
              const checked = selectedSet.has(opt.toLowerCase());
              const active = idx === activeIndex;
              return (
                <li
                  key={opt}
                  role="option"
                  aria-selected={checked}
                  onMouseEnter={() => setActiveIndex(idx)}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => toggle(opt)}
                  className={["flex items-center gap-3 px-3 py-2 cursor-pointer", active ? "bg-indigo-50" : ""].join(
                    " "
                  )}
                >
                  <input readOnly type="checkbox" checked={checked} className="h-4 w-4 pointer-events-none" />
                  <span className="text-sm">{opt}</span>
                </li>
              );
            })}
          </ul>
          <div className="flex items-center justify-between p-2 border-t text-xs text-gray-500">
            <span>{filtered.length} options</span>
            {maxTags ? <span>Max {maxTags} tags</span> : null}
          </div>
        </div>
      )}
    </div>
  );
}
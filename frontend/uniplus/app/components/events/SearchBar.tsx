"use client";
import { Search } from "lucide-react";

export default function SearchBar({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div
      className="mb-4 ml-auto w-full max-w-xs flex items-center rounded-full
      bg-white px-4 py-2 shadow-sm"
    >
      <Search
        className="mr-2 h-4 w-4 text-gray-500"
      />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        type="text"
        placeholder="Search"
        className="w-full bg-transparent text-sm text-gray-700
        placeholder:text-gray-400 focus:outline-none"
      />
    </div>
  );
}
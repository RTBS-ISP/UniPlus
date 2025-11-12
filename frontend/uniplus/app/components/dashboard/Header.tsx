"use client";

import React from "react";

export function Header({ title, id }: { title?: string; id?: number }) {
  return (
    <div className="max-w-7xl mx-auto px-8 py-8">
      <div className="flex flex-col items-start gap-y-4">
        <h1 className="text-gray-800 text-5xl font-extrabold pt-10">{title}</h1>
        {id && (
          <div className="text-gray-800 font-medium">
            Event ID: <span className="text-gray-800 font-bold">#{id}</span>
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import Navbar from "../components/navbar";
import SearchBar from "../components/events/SearchBar";
import SortPanel from "../components/events/SortPanel";
import EventCard from "../components/events/EventCard";
import Pagination from "../components/events/Pagination";
import { events as seed } from "../../lib/events/events-data";

export default function EventsPage() {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"recent" | "popular" | "upcoming">("recent");
  const [page, setPage] = useState(1);
  const pageSize = 5;

  // Filter + sort
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = seed.filter((e) =>
      [e.title, e.excerpt, ...e.tags, ...e.host].some((x) =>
        x.toLowerCase().includes(q)
      )
    );

    if (sort === "popular") list = [...list].sort((a, b) => b.popularity - a.popularity);
    if (sort === "recent") list = [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    if (sort === "upcoming") list = [...list].sort((a, b) => a.date.localeCompare(b.date));

    return list;
  }, [query, sort]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const start = (page - 1) * pageSize;
  const pageItems = filtered.slice(start, start + pageSize);

  return (
    <div className="min-h-screen bg-[#ece8f3]">
      {/* Global hover animation for the "More" button inside EventCard */}
      <style jsx global>{`
        /* Apply to either a class or a data-attribute on the button */
        .event-card-more,
        [data-role="more"] {
          transition: transform 200ms ease, box-shadow 200ms ease, background-color 200ms ease;
          will-change: transform;
        }
        .event-card-more:hover,
        [data-role="more"]:hover {
          transform: translateY(-1px) scale(1.04);
          box-shadow: 0 8px 22px rgba(0, 0, 0, 0.18);
          background-color: #111; /* subtle lighten from pure black if you use bg-black */
        }
        .event-card-more:active,
        [data-role="more"]:active {
          transform: translateY(0) scale(0.98);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.18);
        }
        /* Optional: a soft focus ring for keyboard users */
        .event-card-more:focus-visible,
        [data-role="more"]:focus-visible {
          outline: none;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.45); /* Tailwind's blue-ish ring */
        }
      `}</style>

      <Navbar />

      {/* Header */}
      <section className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-3xl font-bold">Events List</h1>
        <p className="mt-2 max-w-2xl text-sm text-gray-600">
          Discover clubs, meetups, and university events happening around campus. Use the search
          and sort options to quickly find what you’re looking for.
        </p>
      </section>

      {/* Content */}
      <main className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-4 pb-16 md:grid-cols-12">
        {/* Left: Sort panel (starts lower, sticks to top on scroll) */}
        <aside className="pt-[52px] md:col-span-3">
          <div className="sticky top-20">
            <SortPanel
              value={sort}
              onChange={(v) => {
                setPage(1);
                setSort(v);
              }}
            />
          </div>
        </aside>

        {/* Right: Search + Cards + Pagination */}
        <section className="md:col-span-9" id="events">
          <div className="mb-4">
            <SearchBar
              value={query}
              onChange={(v) => {
                setPage(1);
                setQuery(v);
              }}
            />
          </div>

          <div className="space-y-4">
            {pageItems.map((e) => (
              <EventCard key={e.id} item={e} />
            ))}

            {pageItems.length === 0 && (
              <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500">
                No events found.
              </div>
            )}
          </div>

          <div className="mt-8">
            <Pagination page={page} totalPages={totalPages} onChange={setPage} />
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-black/10 bg-white/60 py-10">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-4 md:grid-cols-4">
          <div>
            <p className="text-sm text-gray-700">Site name</p>
            <div className="mt-3 flex items-center gap-3 text-gray-500">
              <div className="h-5 w-5 rounded-full border" />
              <div className="h-5 w-5 rounded-full border" />
              <div className="h-5 w-5 rounded-full border" />
              <div className="h-5 w-5 rounded-full border" />
            </div>
          </div>

          {["Topic", "Topic", "Topic"].map((t, i) => (
            <div key={i}>
              <p className="text-sm font-medium text-gray-800">{t}</p>
              <ul className="mt-3 space-y-1 text-sm text-gray-600">
                <li>
                  <a href="#" className="hover:underline">
                    Page
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:underline">
                    Page
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:underline">
                    Page
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:underline">
                    Page
                  </a>
                </li>
              </ul>
            </div>
          ))}
        </div>
        <div className="mx-auto mt-8 max-w-6xl px-4 text-xs text-gray-500">
          © {new Date().getFullYear()} UniPLUS
        </div>
      </footer>
    </div>
  );
}

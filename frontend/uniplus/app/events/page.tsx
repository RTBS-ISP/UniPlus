// app/events/page.tsx
"use client";

import { useMemo, useState } from "react";
import Navbar from "../components/navbar";
import SearchBar from "../components/events/SearchBar";
import SortPanel from "../components/events/SortPanel";
import FilterPanel, { FilterValues } from "../components/events/FilterPanel";
import EventCard from "../components/events/EventCard";
import Pagination from "../components/events/Pagination";
import { events as seed } from "../../lib/events/events-data";

export default function EventsPage() {
  const [query, setQuery] = useState("");
  const [sort, setSort] =
    useState<"recent" | "popular" | "upcoming">("recent");
  const [filters, setFilters] = useState<FilterValues>({
    category: "",
    host: "",
    dateFrom: "",
    dateTo: "",
    location: "",
  });
  const [page, setPage] = useState(1);
  const pageSize = 5;

  // ---- Build dropdown options from data ----
  const categoryOptions = useMemo(() => {
    const set = new Set<string>();
    seed.forEach((e) => {
      if (e.category) set.add(e.category);
      // also allow categories that appear inside tags
      [
        "Technology",
        "Design",
        "Health",
        "Sports",
        "Arts",
        "Networking",
        "Business",
        "Science",
        "Club",
        "Campus",
      ].forEach((k) => {
        if (e.tags?.includes(k)) set.add(k);
      });
    });
    return Array.from(set).sort();
  }, []);

  const hostOptions = useMemo(() => {
    const set = new Set<string>();
    seed.forEach((e) => {
      if (e.host?.[0]) set.add(e.host[0]);
    });
    return Array.from(set).sort();
  }, []);

  // ---- Filter + Sort ----
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    let list = seed.filter((e) => {
      const matchesText = [e.title, e.excerpt, ...(e.tags || []), ...(e.host || [])]
        .some((x) => x.toLowerCase().includes(q));

      const matchesCategory = filters.category
        ? e.category === filters.category ||
          (e.tags || []).includes(filters.category)
        : true;

      const matchesHost = filters.host
        ? (e.host?.[0] || "").toLowerCase() === filters.host.toLowerCase()
        : true;

      const matchesLocation = filters.location
        ? (e.location ?? "").toLowerCase().includes(filters.location.toLowerCase())
        : true;

      const matchesDateFrom = filters.dateFrom
        ? e.startDate
          ? e.startDate >= filters.dateFrom
          : false
        : true;

      const matchesDateTo = filters.dateTo
        ? e.endDate
          ? e.endDate <= filters.dateTo
          : false
        : true;

      return (
        matchesText &&
        matchesCategory &&
        matchesHost &&
        matchesLocation &&
        matchesDateFrom &&
        matchesDateTo
      );
    });

    if (sort === "popular")
      list = [...list].sort((a, b) => b.popularity - a.popularity);
    if (sort === "recent")
      list = [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    if (sort === "upcoming")
      list = [...list].sort((a, b) => a.date.localeCompare(b.date));

    return list;
  }, [query, sort, filters]);

  // ---- Pagination ----
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const start = (page - 1) * pageSize;
  const pageItems = filtered.slice(start, start + pageSize);

  return (
    <div className="min-h-screen bg-[#E0E7FF]">
      <Navbar />

      {/* Header */}
      <section className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-3xl text-black font-bold">Discover Events</h1>
        <p className="mt-2 max-w-2xl text-sm text-gray-600">
          Explore clubs, meetups, and university events happening around campus.
          Use the search and filters to find exactly what you’re looking for.
        </p>

        <button
          onClick={() => (window.location.href = "/events/create")}
          className="mt-4 rounded-full bg-[#6366F1] px-4 py-2 text-sm font-semibold text-white hover:bg-[#4F46E5] transition"
        >
          + Create Event
        </button>
      </section>

      {/* Content */}
      <main className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-4 pb-16 md:grid-cols-12">
        {/* Left: Sort + Filter */}
        <aside className="pt-[52px] md:col-span-3">
          <div className="sticky top-30 space-y-4">
            <SortPanel
              value={sort}
              onChange={(v) => {
                setPage(1);
                setSort(v);
              }}
            />

            <FilterPanel
              categories={categoryOptions}
              hosts={hostOptions}
              value={filters}
              onChange={(f) => {
                setPage(1);
                setFilters(f);
              }}
              onClear={() => setPage(1)}
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
                <li><a href="#" className="hover:underline">Page</a></li>
                <li><a href="#" className="hover:underline">Page</a></li>
                <li><a href="#" className="hover:underline">Page</a></li>
                <li><a href="#" className="hover:underline">Page</a></li>
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

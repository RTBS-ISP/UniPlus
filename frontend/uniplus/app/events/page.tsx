"use client";
import Navbar from "../components/navbar";
import SearchBar from "../components/events/SearchBar";
import SortPanel from "../components/events/SortPanel";
import EventCard from "../components/events/EventCard";
import Pagination from "../components/events/Pagination";
import { useMemo, useState, useEffect } from "react";
import { events as seed } from "@/lib/events-data";

export default function EventsPage() {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"recent" | "popular" | "upcoming">("recent");
  const [page, setPage] = useState(1);
  const pageSize = 5;

  // reset to page 1 whenever query/sort changes
  useEffect(() => {
    setPage(1);
  }, [query, sort]);

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

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const start = (page - 1) * pageSize;
  const pageItems = filtered.slice(start, start + pageSize);

  return (
    <div className="min-h-screen bg-[#ece8f3]">
      <Navbar />

      {/* Title + blurb */}
      <section className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-3xl font-bold">Events List</h1>
        <p className="mt-2 max-w-2xl text-sm text-gray-600">
          Lorem Ipsum is simply dummy text of the printing and typesetting industry.
          Lorem Ipsum has been the industry's standard dummy
        </p>
      </section>

      {/* RIGHT-ALIGNED SEARCH ABOVE THE GRID */}
      <section className="mx-auto max-w-6xl px-4 mb-4">
        <div className="ml-auto w-full max-w-xs">
          <SearchBar value={query} onChange={setQuery} />
        </div>
      </section>

      {/* Grid: left sort / right list (no search here) */}
      <main className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-4 pb-16 md:grid-cols-12">
        <aside className="md:col-span-3">
          <SortPanel value={sort} onChange={setSort} />
        </aside>

        <section className="md:col-span-9" id="events">
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

          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
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

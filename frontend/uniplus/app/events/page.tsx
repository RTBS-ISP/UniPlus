"use client";

import { useMemo, useState, useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import Navbar from "../components/navbar";
import SearchBar from "../components/events/SearchBar";
import SortPanel from "../components/events/SortPanel";
import FilterPanel, { FilterValues } from "../components/events/FilterPanel";
import EventCard from "../components/events/EventCard";
import Pagination from "../components/events/Pagination";

export default function EventsPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [query, setQuery] = useState("");
  const [sort, setSort] = 
    useState<"recent" | "popular" | "upcoming">("recent");
  const [filters, setFilters] = useState({
    category: "",
    host: "",
    dateFrom: "",
    dateTo: "",
    location: "",
  });
  const [page, setPage] = useState(1);
  const pageSize = 5;

  const reduce = useReducedMotion();

  // Fetch events from API
  useEffect(() => {
    async function fetchEvents() {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:8000/api/events');
        if (!response.ok) throw new Error('Failed to fetch events');
        const data = await response.json();
        console.log(response);
        const transformedEvents = data.map((event: any) => ({
          id: event.id,
          title: event.event_title,
          host: [
          event.organizer_role
            ? event.organizer_role.charAt(0).toUpperCase() + event.organizer_role.slice(1).toLowerCase()
            : "Organizer"
          ],
          tags: event.tags || [],
          excerpt: event.event_description,
          date: event.event_start_date || event.start_date_register,
          createdAt: event.event_create_date,
          popularity: event.attendee_count || 0,
          category: event.tags?.[0] || "",
          startDate: event.event_start_date?.split('T')[0],
          endDate: event.event_end_date?.split('T')[0],
          location: event.event_address || (event.is_online ? "Online" : ""),
          capacity: event.max_attendee,
          registered: event.attendee_count,
          spotsAvailable: event.max_attendee ? event.max_attendee - event.attendee_count : undefined,
        }));

        setEvents(transformedEvents);
        console.log(transformedEvents);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load events');
        console.error('Error fetching events:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchEvents();
  }, []);

  // Build dropdown options from data
  const categoryOptions = useMemo(() => {
    const set = new Set<string>();
    events.forEach((e) => {
      if (e.category) set.add(e.category);
      if (e.tags) {
        e.tags.forEach((tag: string) => set.add(tag));
      }
    });
    return Array.from(set).sort();
  }, [events]);

  const hostOptions = useMemo(() => {
    return ["Student", "Organizer", "Professor"];
  }, []);

  // ---- Helper: percent filled (0..1). Lower availability => higher score ----
  const pctFilled = (e: any) => {
    const capacity = Number(
      e.capacity ?? e.maxAttendee ?? e.maxSeats ?? e.limit ?? 0
    );

    // Prefer direct registered/attending counts
    const registered = Number(
      e.registered ?? e.attending ?? e.rsvpCount ?? e.enrolled ?? NaN
    );
    if (capacity > 0 && !Number.isNaN(registered)) {
      return Math.min(1, Math.max(0, registered / capacity));
    }
  
    // Fallback: derive from spotsAvailable if present
    const spotsAvailable = Number(
      e.spotsAvailable ?? e.available ?? e.seatsLeft ?? NaN
    );
    if (capacity > 0 && !Number.isNaN(spotsAvailable)) {
      return Math.min(1, Math.max(0, 1 - spotsAvailable / capacity));
    }

    if (!Number.isNaN(spotsAvailable) && spotsAvailable >= 0) {
      return 1 - 1 / (1 + spotsAvailable);
    }

    return 0;
  };

  // Filter + Sort
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    let list = events.filter((e) => {
      const matchesText = [e.title, e.excerpt, ...(e.tags || []), ...(e.host || [])]
        .some((x) => x?.toLowerCase().includes(q));

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

    if (sort === "popular") {
      list = [...list].sort((a, b) => {
        const fb = pctFilled(b);
        const fa = pctFilled(a);
        if (fb !== fa) return fb - fa; // more filled first
        return (b.popularity ?? 0) - (a.popularity ?? 0);
      });
    }

    if (sort === "recent")
      list = [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    if (sort === "upcoming")
      list = [...list].sort((a, b) => a.date.localeCompare(b.date));

    return list;
  }, [query, sort, filters, events]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const start = (page - 1) * pageSize;
  const pageItems = filtered.slice(start, start + pageSize);

  // Smooth-scroll to list top on page change
  const handlePageChange = (p: number) => {
    setPage(p);
    const el = document.getElementById("events");
    if (el) el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  };

  // Light entrance for sections (not the cards themselves)
  const sectionIn = {
    hidden: { opacity: 0, y: reduce ? 0 : 8 },
    show: { opacity: 1, y: 0, transition: { duration: reduce ? 0 : 0.25 } },
  };

  return (
    <div className="min-h-screen bg-[#E0E7FF]">
      <Navbar />

      {/* Header */}
      <motion.section
        variants={sectionIn}
        initial="hidden"
        animate="show"
        className="mx-auto max-w-6xl px-4 py-8"
      >
        <h1 className="text-3xl text-black font-bold">Discover Events</h1>
        <p className="mt-2 max-w-2xl text-sm text-gray-600">
          Explore clubs, meetups, and university events happening around campus.
          Use the search and filters to find exactly what you're looking for.
        </p>

        <motion.button
          whileHover={reduce ? undefined : { scale: 1.03 }}
          whileTap={reduce ? undefined : { scale: 0.98 }}
          onClick={() => (window.location.href = "/events/create")}
          className="mt-4 rounded-full bg-[#6366F1] px-4 py-2 text-sm font-semibold text-white hover:bg-[#4F46E5] transition"
        >
          + Create Event
        </motion.button>
      </motion.section>

      {/* Content */}
      <main className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-4 pb-16 md:grid-cols-12">
        {/* Left: Sort + Filter */}
        <motion.aside
          variants={sectionIn}
          initial="hidden"
          animate="show"
          className="pt-[52px] md:col-span-3"
        >
          <div className="sticky top-30 space-y-4">
            <SortPanel
              value={sort}
              onChange={(v: any) => {
                setPage(1);
                setSort(v);
              }}
            />
            <FilterPanel
              categories={categoryOptions}
              hosts={hostOptions}
              value={filters}
              onChange={(f: any) => {
                setPage(1);
                setFilters(f);
              }}
              onClear={() => {
                setPage(1);
                setFilters({
                  category: "",
                  host: "",
                  dateFrom: "",
                  dateTo: "",
                  location: "",
                });
              }}
            />
          </div>
        </motion.aside>

        {/* Right: Search + Cards + Pagination */}
        <section className="md:col-span-9" id="events">
          <motion.div
            variants={sectionIn}
            initial="hidden"
            animate="show"
            className="mb-4"
          >
            <SearchBar
              value={query}
              onChange={(v: string) => {
                setPage(1);
                setQuery(v);
              }}
            />
          </motion.div>

          {/* Loading State */}
          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-xl border border-gray-300 bg-white p-8 text-center"
            >
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#6366F1] border-r-transparent"></div>
              <p className="mt-4 text-sm text-gray-600">Loading events...</p>
            </motion.div>
          )}

          {/* Error State */}
          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-xl border border-red-300 bg-red-50 p-8 text-center"
            >
              <p className="text-sm text-red-600">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg text-sm"
              >
                Retry
              </button>
            </motion.div>
          )}

          {/* Cards */}
          {!loading && !error && (
            <div className="space-y-4">
              {pageItems.map((e, i) => (
                <EventCard key={e.id} item={e} index={i} stagger={0.06} />
              ))}

              {pageItems.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, y: reduce ? 0 : 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500"
                >
                  No events found.
                </motion.div>
              )}
            </div>
          )}

          {!loading && !error && (
            <motion.div
              variants={sectionIn}
              initial="hidden"
              animate="show"
              className="mt-8"
            >
              <Pagination page={page} totalPages={totalPages} onChange={handlePageChange} />
            </motion.div>
          )}
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
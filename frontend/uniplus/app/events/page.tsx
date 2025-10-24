
"use client";

import { useMemo, useState, useEffect } from "react";
import Navbar from "../components/navbar";
import SearchBar from "../components/events/SearchBar";
import SortPanel from "../components/events/SortPanel";
import FilterPanel, { FilterValues } from "../components/events/FilterPanel";
import EventCard from "../components/events/EventCard";
import Pagination from "../components/events/Pagination";

interface EventItem {
  id: number;
  title: string;
  host: string[];
  tags: string[];
  excerpt: string;
  date: string;
  createdAt: string;
  popularity: number;
  available?: number;
  startDate?: string;
  endDate?: string;
  location?: string;
  image?: string;
  hostRole?: string;
  category?: string;
}

// Predefined category options
const CATEGORY_OPTIONS = [
  "Workshop",
  "Club",
  "Campus",
  "AI",
  "Design",
  "Networking",
  "Panel",
  "Health",
  "Fitness",
  "Research",
  "Career",
  "Education",
  "Engineering",
  "Extra",
];

// Predefined host role options
const HOST_ROLE_OPTIONS = [
  "Organizer",
  "University",
  "Club",
  "Student",
];

export default function EventsPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"recent" | "popular" | "upcoming">("recent");
  const [filters, setFilters] = useState<FilterValues>({
    category: "",
    host: "",
    dateFrom: "",
    dateTo: "",
    location: "",
  });
  const [page, setPage] = useState(1);
  const pageSize = 5;

  // Fetch events from Django backend
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const res = await fetch("http://localhost:8000/api/events", {
          method: "GET",
          credentials: "include",
        });

        if (!res.ok) {
          throw new Error("Failed to fetch events");
        }

        const data = await res.json();

        // Transform backend data to match frontend interface
        const transformedEvents: EventItem[] = data.map((event: any) => {
          // Parse tags if they're stored as JSON string
          let parsedTags: string[] = [];
          try {
            parsedTags = event.tags ? JSON.parse(event.tags) : [];
          } catch {
            parsedTags = event.tags ? [event.tags] : [];
          }

          return {
            id: event.id,
            title: event.event_title,
            host: [event.organizer_role || "Organizer"],
            tags: parsedTags,
            excerpt: event.event_description?.substring(0, 150) + "..." || "",
            date: event.event_start_date,
            createdAt: event.event_create_date,
            popularity: event.attendee?.length || 0,
            available: event.max_attendee
              ? event.max_attendee - (event.attendee?.length || 0)
              : undefined,
            startDate: event.event_start_date,
            endDate: event.event_end_date,
            location: event.is_online ? "Online" : (event.event_address || "TBA"),
            image: event.event_image || "/placeholder-event.jpg",
            hostRole: event.organizer_role || "Organizer",
            category: parsedTags[0] || "General",
          };
        });

        setEvents(transformedEvents);
      } catch (err) {
        console.error("Error fetching events:", err);
        setError("Failed to load events. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  // Filter + Sort
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    let list = events.filter((e) => {
      const matchesText = [
        e.title,
        e.excerpt,
        ...(e.tags || []),
        ...(e.host || []),
      ].some((x) => x.toLowerCase().includes(q));

      const matchesCategory = filters.category
        ? e.category === filters.category || (e.tags || []).includes(filters.category)
        : true;

      const matchesHost = filters.host
        ? (e.hostRole || "").toLowerCase() === filters.host.toLowerCase()
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

    // FIX: Proper sorting logic
    if (sort === "popular") {
      list = [...list].sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
    }

    if (sort === "recent") {
      list = [...list].sort((a, b) => {
        const dateA = new Date(a.createdAt || "").getTime();
        const dateB = new Date(b.createdAt || "").getTime();
        return dateB - dateA; // Most recent first
      });
    }

    if (sort === "upcoming") {
      list = [...list].sort((a, b) => {
        const dateA = new Date(a.date || "").getTime();
        const dateB = new Date(b.date || "").getTime();
        return dateA - dateB; // Soonest first
      });
    }

    return list;
  }, [events, query, sort, filters]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const start = (page - 1) * pageSize;
  const pageItems = filtered.slice(start, start + pageSize);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50 to-indigo-50">
        <Navbar />
        <div className="flex items-center justify-center h-screen">
          <div className="animate-pulse">
            <div className="text-2xl font-semibold text-gray-600">Loading events...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#E0E7FF]">
        <Navbar />
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="text-2xl font-semibold text-red-600 mb-4">{error}</div>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#E0E7FF]">
      <Navbar />

      {/* Header */}
      <section className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-3xl text-black font-bold">Discover Events</h1>
        <p className="mt-2 max-w-2xl text-sm text-gray-600">
          Explore clubs, meetups, and university events happening around campus.
          Use the search and filters to find exactly what you're looking for.
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
              categories={CATEGORY_OPTIONS}
              hosts={HOST_ROLE_OPTIONS}
              value={filters}
              onChange={(f) => {
                setPage(1);
                setFilters(f);
              }}
              onClear={() => setPage(1)}
            />
          </div>
        </aside>

        <section className="md:col-span-9" id="events">
          <div className="mb-6">
            <SearchBar
              value={query}
              onChange={(v) => {
                setPage(1);
                setQuery(v);
              }}
            />
          </div>

          <div className="space-y-5">
            {pageItems.map((e) => (
              <EventCard key={e.id} item={e} />
            ))}

            {pageItems.length === 0 && (
              <div className="rounded-2xl border-2 border-dashed border-gray-300 bg-white p-12 text-center shadow-sm">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {events.length === 0 ? "No events available yet" : "No events found"}
                </h3>
                <p className="text-gray-600">
                  {events.length === 0
                    ? "Check back soon for upcoming events!"
                    : "Try adjusting your search or filters"}
                </p>
              </div>
            )}
          </div>

          {totalPages > 1 && (
            <div className="mt-10">
              <Pagination page={page} totalPages={totalPages} onChange={setPage} />
            </div>
          )}
        </section>
      </main>

      <footer className="border-t border-gray-200 bg-white/80 backdrop-blur-sm py-12 mt-16">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-4 mb-8">
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-4">🎓 UniPLUS</h3>
              <p className="text-sm text-gray-600 mb-4">
                Connecting students through events and experiences.
              </p>
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
        </div>
      </footer>
    </div>
  );
}
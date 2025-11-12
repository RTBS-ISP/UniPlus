"use client";

import { useMemo, useState, useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import Navbar from "../components/navbar";
import SearchBar from "../components/events/SearchBar";
import SortPanel from "../components/events/SortPanel";
import FilterPanel, { FilterValues } from "../components/events/FilterPanel";
import EventCard from "../components/events/EventCard";
import Pagination from "../components/events/Pagination";
import Link from "next/link";
import { Mail, Phone, MapPin } from "lucide-react";

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
      <footer className="border-t border-gray-200 bg-white py-12">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
            {/* Brand Section */}
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <img
                  src="/images/monkey_7.png"
                  alt="UniPLUS Logo"
                  className="w-8 h-8 object-contain"
                />
                <h3 className="text-lg font-bold text-gray-900">UniPLUS</h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Your campus event management platform
              </p>
              <div className="flex items-center gap-3">
                <a href="#" className="text-gray-400 hover:text-indigo-600 transition">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-indigo-600 transition">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-indigo-600 transition">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z"/>
                  </svg>
                </a>
              </div>
            </div>

            {/* Events */}
            <div>
              <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4">
                Events
              </h4>
              <ul className="space-y-2">
                <li>
                  <Link href="/events" className="text-sm text-gray-600 hover:text-indigo-600 transition">
                    Browse Events
                  </Link>
                </li>
                <li>
                  <Link href="/events/create" className="text-sm text-gray-600 hover:text-indigo-600 transition">
                    Create Event
                  </Link>
                </li>
                <li>
                  <Link href="/my-ticket" className="text-sm text-gray-600 hover:text-indigo-600 transition">
                    My Tickets
                  </Link>
                </li>
                <li>
                  <Link href="/my-created-events" className="text-sm text-gray-600 hover:text-indigo-600 transition">
                    My Events
                  </Link>
                </li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4">
                Support
              </h4>
              <ul className="space-y-2">
                <li>
                  <Link href="/support" className="text-sm text-gray-600 hover:text-indigo-600 transition">
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link href="/support#contact-form" className="text-sm text-gray-600 hover:text-indigo-600 transition">
                    Contact Us
                  </Link>
                </li>
                <li>
                  <a href="#" className="text-sm text-gray-600 hover:text-indigo-600 transition">
                    FAQs
                  </a>
                </li>
                <li>
                  <a href="#" className="text-sm text-gray-600 hover:text-indigo-600 transition">
                    Community
                  </a>
                </li>
              </ul>
            </div>

            {/* Contact Info */}
            <div>
              <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4">
                Contact
              </h4>
              <ul className="space-y-3">
                <li className="flex items-start gap-2 text-sm text-gray-600">
                  <Mail className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <a href="mailto:support@uniplus.com" className="hover:text-indigo-600 transition">
                    support@uniplus.com
                  </a>
                </li>
                <li className="flex items-start gap-2 text-sm text-gray-600">
                  <Phone className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <a href="tel:+15551234567" className="hover:text-indigo-600 transition">
                    +1 (555) 123-4567
                  </a>
                </li>
                <li className="flex items-start gap-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>Bangkok, Thailand</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="mt-8 pt-8 border-t border-gray-200">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-sm text-gray-500">
                © {new Date().getFullYear()} UniPLUS. All rights reserved.
              </p>
              <div className="flex gap-6 text-sm text-gray-500">
                <a href="#" className="hover:text-indigo-600 transition">Privacy Policy</a>
                <a href="#" className="hover:text-indigo-600 transition">Terms of Service</a>
                <a href="#" className="hover:text-indigo-600 transition">Cookie Policy</a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
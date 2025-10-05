"use client";

import { useMemo, useState, useEffect } from "react";
import Navbar from "../components/navbar";
import SearchBar from "../components/events/SearchBar";
import SortPanel from "../components/events/SortPanel";
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
}

export default function EventsPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"recent" | "popular" | "upcoming">("recent");
  const [page, setPage] = useState(1);
  const pageSize = 5;

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/events', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Raw API data:', data);
        
        const transformedEvents: EventItem[] = data.map((event: any) => {
          let parsedTags: string[] = [];
          
          console.log('Event tags raw:', event.tags, 'Type:', typeof event.tags); 
          
          if (typeof event.tags === 'string') {
            try {
              parsedTags = JSON.parse(event.tags);
              console.log('Parsed tags:', parsedTags); 
            } catch (e) {
              console.error('Failed to parse tags:', e);
              parsedTags = [];
            }
          } else if (Array.isArray(event.tags)) {
            parsedTags = event.tags;
          }

          return {
            id: event.id,
            title: event.event_title,
            host: [event.organizer_username || 'Organizer'],
            hostRole: 'Organizer',
            tags: parsedTags,
            excerpt: event.event_description?.length > 150 
              ? event.event_description.slice(0, 150) + '...' 
              : event.event_description || '',
            date: new Date(event.start_date_register).toLocaleDateString(),
            createdAt: event.start_date_register,
            popularity: event.current_attendees || 0,
            available: (event.max_attendee || 0) - (event.current_attendees || 0),
            startDate: event.start_date_register,
            endDate: event.end_date_register,
            location: event.is_online ? 'Online' : (event.event_address || 'TBA'),
            image: event.event_image,
          };
        });

        console.log('Transformed events:', transformedEvents); // DEBUG
        setEvents(transformedEvents);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = events.filter((e) =>
      [e.title, e.excerpt, ...e.tags, ...e.host].some((x) =>
        x.toLowerCase().includes(q)
      )
    );

    if (sort === "popular") list = [...list].sort((a, b) => b.popularity - a.popularity);
    if (sort === "recent") list = [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    if (sort === "upcoming") list = [...list].sort((a, b) => a.date.localeCompare(b.date));

    return list;
  }, [query, sort, events]);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50 to-indigo-50">
      <style jsx global>{`
        .event-card-more,
        [data-role="more"] {
          transition: transform 200ms ease, box-shadow 200ms ease, background-color 200ms ease;
          will-change: transform;
        }
        .event-card-more:hover,
        [data-role="more"]:hover {
          transform: translateY(-1px) scale(1.04);
          box-shadow: 0 8px 22px rgba(0, 0, 0, 0.18);
          background-color: #111;
        }
        .event-card-more:active,
        [data-role="more"]:active {
          transform: translateY(0) scale(0.98);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.18);
        }
        .event-card-more:focus-visible,
        [data-role="more"]:focus-visible {
          outline: none;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.45);
        }
      `}</style>

      <Navbar />

      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="space-y-3">
          <h1 className="text-5xl font-extrabold text-gray-900 tracking-tight">
            Discover Events
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl leading-relaxed">
            Explore clubs, meetups, and university events happening around campus. 
            Use the search and filters to find exactly what you're looking for.
          </p>
        </div>
      </section>

      <main className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-4 pb-16 md:grid-cols-12">
        <aside className="md:col-span-3">
          <div className="sticky top-8">
            <SortPanel
              value={sort}
              onChange={(v) => {
                setPage(1);
                setSort(v);
              }}
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
                  <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {events.length === 0 ? 'No events available yet' : 'No events found'}
                </h3>
                <p className="text-gray-600">
                  {events.length === 0 
                    ? 'Check back soon for upcoming events!' 
                    : 'Try adjusting your search or filters'}
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

            {[
              { title: "Events", links: ["Browse Events", "Create Event", "My Tickets", "Calendar"] },
              { title: "About", links: ["About Us", "Contact", "Privacy Policy", "Terms of Service"] },
              { title: "Support", links: ["Help Center", "Report Issue", "Feedback", "FAQs"] }
            ].map((section, i) => (
              <div key={i}>
                <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4">
                  {section.title}
                </h4>
                <ul className="space-y-2">
                  {section.links.map((link, j) => (
                    <li key={j}>
                      <a href="#" className="text-sm text-gray-600 hover:text-indigo-600 transition-colors">
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          
          <div className="pt-8 border-t border-gray-200">
            <p className="text-sm text-center text-gray-500">
              © {new Date().getFullYear()} UniPLUS. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
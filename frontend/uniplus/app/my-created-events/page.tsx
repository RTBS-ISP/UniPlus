"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../components/navbar";
import { Calendar, Users, TrendingUp, Eye } from "lucide-react";

interface CreatedEvent {
  id: number;
  event_title: string;
  event_description: string;
  event_start_date: string;
  event_end_date: string;
  max_attendee: number;
  current_attendees: number;
  available_spots: number;
  status_registration: string;
  event_image: string | null;
  is_approved: boolean;
  event_create_date: string;
}

export default function MyCreatedEventsPage() {
  const [events, setEvents] = useState<CreatedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    fetchCreatedEvents();
  }, []);

  const fetchCreatedEvents = async () => {
    try {
      setLoading(true);
      const response = await fetch("http://localhost:8000/api/user/created-events", {
        credentials: "include",
      });

      if (!response.ok) {
        if (response.status === 401) {
          router.push("/login");
          return;
        }
        throw new Error("Failed to fetch created events");
      }

      const data = await response.json();
      setEvents(data.events || []);
    } catch (err: any) {
      console.error("Error fetching created events:", err);
      setError(err.message || "Failed to load events");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <main>
        <Navbar />
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center">
          <div className="text-2xl text-gray-600">Loading your events...</div>
        </div>
      </main>
    );
  }

  return (
    <main>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">My Created Events</h1>
            <p className="text-gray-600">Manage and view all events you've created</p>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {events.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-md p-12 text-center">
              <Calendar className="mx-auto mb-4 text-gray-400" size={64} />
              <h2 className="text-2xl font-semibold text-gray-800 mb-2">No Events Created Yet</h2>
              <p className="text-gray-600 mb-6">Start by creating your first event!</p>
              <button
                onClick={() => router.push("/events/create")}
                className="inline-flex items-center justify-center px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition"
              >
                Create Event
              </button>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-shadow overflow-hidden"
                >
                  {/* Event Image */}
                  {event.event_image ? (
                    <div className="h-48 w-full overflow-hidden">
                      <img
                        src={`http://localhost:8000${event.event_image}`}
                        alt={event.event_title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="h-48 w-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center">
                      <Calendar className="text-white" size={64} />
                    </div>
                  )}

                  {/* Event Content */}
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-xl font-bold text-gray-900 line-clamp-2">
                        {event.event_title}
                      </h3>
                      {!event.is_approved && (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded-full">
                          Pending
                        </span>
                      )}
                    </div>

                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {event.event_description}
                    </p>

                    {/* Event Stats */}
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar size={16} />
                        <span>
                          {new Date(event.event_start_date).toLocaleDateString()} -{" "}
                          {new Date(event.event_end_date).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Users size={16} />
                        <span>
                          {event.current_attendees} / {event.max_attendee || "∞"} attendees
                        </span>
                      </div>
                      {event.status_registration && (
                        <div className="flex items-center gap-2 text-sm">
                          <span
                            className={`inline-block w-2 h-2 rounded-full ${
                              event.status_registration === "open"
                                ? "bg-green-500"
                                : "bg-red-500"
                            }`}
                          />
                          <span className="capitalize text-gray-600">
                            Registration {event.status_registration}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => router.push(`/events/${event.id}`)}
                        className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition"
                      >
                        <Eye size={16} />
                        View
                      </button>
                      <button
                        onClick={() => router.push(`/events/${event.id}/dashboard`)}
                        className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition"
                      >
                        <TrendingUp size={16} />
                        Dashboard
                      </button>
                    </div>
                  </div>

                  {/* Footer with creation date */}
                  <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
                    <p className="text-xs text-gray-500">
                      Created {new Date(event.event_create_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Navbar from "../../components/navbar";
import Tabs from '../../components/profile/Tabs';
import EventCard from "../../components/events/EventCard";
import { Calendar } from 'lucide-react';

interface EventData {
  event_id?: number;
  id?: number;
  event_title: string;
  event_date?: string;
  event_start_date?: string;
  event_description: string;
  location?: string;
  event_address?: string;
  organizer?: string;
  organizer_role?: string;
  status?: string;
  event_tags?: string[] | string;
  tags?: string[] | string;
  is_online: boolean;
  user_name?: string;
  user_email?: string;
  purchase_date?: string | null;
  qr_code?: string | null;
}

interface PublicUserData {
  username: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  role: string;
  about_me: any;
  profile_pic: string;
  events_organized: number;
  total_attendees: number;
  user_total_events: number;
  avg_rating: number | null;
}

interface StatisticsData {
  total_events: number;
  upcoming_events: number;
  attended_events: number;
  created_events: number;
  total_registrations: number;
}

function transformEventToItem(event: any, index: number) {
  const eventDateStr = 
    event.event_date ||           
    event.event_start_date ||     
    event.start_date_register || 
    '';
    
  const eventDate = eventDateStr ? new Date(eventDateStr) : null;
  const now = new Date();
  const isPast = eventDate ? eventDate < now : false;
  
  const organizerRole = event.organizer_role 
    ? event.organizer_role.charAt(0).toUpperCase() + event.organizer_role.slice(1)
    : 'Organizer';
  
  let eventTags: string[] = [];
  
  // Try event_tags first (from event-history API)
  if (event.event_tags) {
    if (Array.isArray(event.event_tags)) {
      eventTags = event.event_tags;
    } else if (typeof event.event_tags === 'string') {
      try {
        const parsed = JSON.parse(event.event_tags);
        eventTags = Array.isArray(parsed) ? parsed : [event.event_tags];
      } catch {
        eventTags = [event.event_tags];
      }
    }
  }
  
  // Also check for 'tags' field as fallback (used in EventsPage)
  if (eventTags.length === 0 && event.tags) {
    if (Array.isArray(event.tags)) {
      eventTags = event.tags;
    } else if (typeof event.tags === 'string') {
      try {
        const parsed = JSON.parse(event.tags);
        eventTags = Array.isArray(parsed) ? parsed : [event.tags];
      } catch {
        eventTags = [event.tags];
      }
    }
  }
  
  // Extract category from tags (first tag is usually the category)
  const category = eventTags.length > 0 ? eventTags[0] : undefined;
  
  // Create excerpt from event description
  const excerpt = event.event_description 
    ? (event.event_description.length > 150 
        ? event.event_description.substring(0, 150) + '...' 
        : event.event_description)
    : 'No description available';

  // Handle location
  const location = event.is_online 
    ? 'Online Event' 
    : (event.location || event.event_address || 'TBA');

  return {
    id: event.event_id || event.id || index,
    title: event.event_title || 'Untitled Event',
    host: [organizerRole],
    tags: eventTags, 
    category: category,
    excerpt: excerpt,
    date: eventDateStr,
    createdAt: event.event_create_date || eventDateStr || new Date().toISOString(),
    popularity: event.attendee_count || 0,
    startDate: eventDateStr,
    endDate: event.event_end_date || eventDateStr,
    location: location,
  };
}

function PublicProfilePage() {
  const params = useParams();
  const username = params.username as string;
  const router = useRouter();
  
  const [userData, setUserData] = useState<PublicUserData | null>(null);
  const [eventHistory, setEventHistory] = useState<EventData[]>([]);
  const [statistics, setStatistics] = useState<StatisticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [createdEvents, setCreatedEvents] = useState<EventData[]>([]);
  const [filter, setFilter] = useState<"all" | "upcoming" | "past">("all");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPublicProfile();
    fetchPublicEventHistory();
    fetchPublicCreatedEvents();
    fetchPublicStatistics();
  }, [username]);

  const fetchPublicProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:8000/api/user/${username}/profile`);
      
      if (response.ok) {
        const data = await response.json();
        setUserData(data);
      } else if (response.status === 404) {
        setError("User not found");
      } else {
        setError("Failed to load profile");
      }
    } catch (error) {
      console.error('Error fetching public profile:', error);
      setError("Error loading profile");
    } finally {
      setLoading(false);
    }
  };

  const fetchPublicEventHistory = async () => {
    try {
      setLoadingEvents(true);
      const response = await fetch(`http://localhost:8000/api/user/${username}/event-history`);
      
      if (response.ok) {
        const data = await response.json();
        setEventHistory(data.events || []);
      } else {
        console.error('Failed to fetch public event history');
      }
    } catch (error) {
      console.error('Error fetching public event history:', error);
    } finally {
      setLoadingEvents(false);
    }
  };

  const fetchPublicCreatedEvents = async () => {
    try {
      setLoadingEvents(true);
      const response = await fetch(`http://localhost:8000/api/user/${username}/created-events`);

      if (response.ok) {
        const data = await response.json();
        setCreatedEvents(data.events || []);
      } else {
        console.error("Failed to fetch public created events");
      }
    } catch (error) {
      console.error("Error fetching public created events:", error);
    } finally {
      setLoadingEvents(false);
    }
  };

  const fetchPublicStatistics = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/user/${username}/statistics`);
      
      if (response.ok) {
        const data = await response.json();
        setStatistics(data);
      } else {
        console.error('Failed to fetch public statistics');
      }
    } catch (error) {
      console.error('Error fetching public statistics:', error);
    }
  };

  if (loading) {
    return (
      <main>
        <Navbar />
        <div className="flex items-center justify-center min-h-screen bg-indigo-100">
          <div className="text-gray-600">Loading profile...</div>
        </div>
      </main>
    );
  }

  if (error || !userData) {
    return (
      <main>
        <Navbar />
        <div className="flex flex-col items-center justify-center min-h-screen bg-indigo-100">
          <div className="text-red-600 text-xl font-semibold mb-4">
            {error || "User not found"}
          </div>
          <button
            onClick={() => router.push('/events')}
            className="px-6 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg"
          >
            Back to Events
          </button>
        </div>
      </main>
    );
  }

  // Transform event history to EventCard format
  const eventItems = eventHistory.map((event, idx) => 
    transformEventToItem(event, idx)
  );

  // Sort events: upcoming first, then past
  const sortedEventItems = [...eventItems].sort((a, b) => {
    const aDate = a.date ? new Date(a.date).getTime() : 0;
    const bDate = b.date ? new Date(b.date).getTime() : 0;
    const now = Date.now();
    
    const aIsUpcoming = aDate >= now;
    const bIsUpcoming = bDate >= now;
    
    if (aIsUpcoming && !bIsUpcoming) return -1;
    if (!aIsUpcoming && bIsUpcoming) return 1;
    
    return bDate - aDate; 
  });

  const filteredEvents = sortedEventItems.filter((e) => {
    if (!e.date) return false;
    const eventDate = new Date(e.date);
    if (filter === "upcoming") return eventDate >= new Date();
    if (filter === "past") return eventDate < new Date();
    return true;
  });

  const createdEventItems = createdEvents.map((event, idx) =>
    transformEventToItem(event, idx)
  );

  const sortedCreatedEventItems = [...createdEventItems].sort((a, b) => {
    const aDate = a.date ? new Date(a.date).getTime() : 0;
    const bDate = b.date ? new Date(b.date).getTime() : 0;
    return bDate - aDate;
  });

  const items = [
    {
      title: "Event History",
      content: (
        <div className="mt-4 rounded-xl">
          {loadingEvents ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-gray-500">Loading events...</div>
            </div>
          ) : sortedEventItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-800 bg-white rounded-xl">
              <Calendar className="mb-2.5" size={52} />
              <p className="font-semibold text-xl">No registered events yet</p>
              <p className="text-sm text-gray-600 mt-2">
                This user hasn't registered for any events
              </p>
            </div>
          ) : (
            <div className="flex gap-6">
              {/* Left Sidebar */}
              <div className="w-72 flex-shrink-0">
                <div className="bg-white rounded-xl p-6 shadow-sm sticky top-6">
                  <h3 className="font-bold text-lg text-gray-800 mb-4">
                    Statistics
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                      <span className="text-gray-600 text-sm">Total Events</span>
                      <span className="font-bold text-indigo-600">
                        {statistics?.total_events || sortedEventItems.length}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                      <span className="text-gray-600 text-sm">Upcoming</span>
                      <span className="font-bold text-indigo-400">
                        {statistics?.upcoming_events || 
                          sortedEventItems.filter(e => e.date && new Date(e.date) >= new Date()).length
                        }
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 text-sm">Past Events</span>
                      <span className="font-bold text-indigo-400">
                        {statistics?.attended_events || 
                          sortedEventItems.filter(e => e.date && new Date(e.date) < new Date()).length
                        }
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <h4 className="font-semibold text-sm text-gray-700 mb-3">
                      Filter by Status
                    </h4>
                    <div className="space-y-2">
                      <button
                        onClick={() => setFilter("all")}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                          filter === "all"
                            ? "bg-indigo-500 text-white"
                            : "hover:bg-indigo-50 text-gray-700"
                        }`}
                      >
                        All Events
                      </button>
                      <button
                        onClick={() => setFilter("upcoming")}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                          filter === "upcoming"
                            ? "bg-indigo-500 text-white"
                            : "hover:bg-indigo-50 text-gray-700"
                        }`}
                      >
                        Upcoming
                      </button>
                      <button
                        onClick={() => setFilter("past")}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                          filter === "past"
                            ? "bg-indigo-500 text-white"
                            : "hover:bg-indigo-50 text-gray-700"
                        }`}
                      >
                        Past Events
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Event Cards */}
              <div className="flex-1 space-y-4">
                {filteredEvents.map((eventItem, idx) => (
                  <EventCard 
                    key={eventItem.id} 
                    item={eventItem} 
                    index={idx}
                    stagger={0.04}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Created Events",
      content: (
        <div className="mt-4 rounded-xl">
          {loadingEvents ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-gray-500">Loading events...</div>
            </div>
          ) : sortedCreatedEventItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-800 bg-white rounded-xl">
              <Calendar className="mb-2.5" size={52} />
              <p className="font-semibold text-xl">No events created yet</p>
              <p className="text-sm text-gray-600 mt-2">
                This user hasn't created any events
              </p>
            </div>
          ) : (
            <div className="flex gap-6">
              {/* Left Sidebar */}
              <div className="w-72 flex-shrink-0">
                <div className="bg-white rounded-xl p-6 shadow-sm sticky top-6">
                  <h3 className="font-bold text-lg text-gray-800 mb-4">
                    Event Overview
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                      <span className="text-gray-600 text-sm">Total Created</span>
                      <span className="font-bold text-indigo-600">
                        {statistics?.created_events || sortedCreatedEventItems.length}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                      <span className="text-gray-600 text-sm">Upcoming</span>
                      <span className="font-bold text-indigo-400">
                        {
                          sortedCreatedEventItems.filter(
                            (e) => e.date && new Date(e.date) >= new Date()
                          ).length
                        }
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 text-sm">Completed</span>
                      <span className="font-bold text-indigo-400">
                        {
                          sortedCreatedEventItems.filter(
                            (e) => e.date && new Date(e.date) < new Date()
                          ).length
                        }
                      </span>
                    </div>
                  </div>
                  
                  {userData.avg_rating && (
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <h4 className="font-semibold text-sm text-gray-700 mb-3">
                        Organizer Rating
                      </h4>
                      <div className="flex items-center">
                        <span className="text-2xl font-bold text-indigo-600">
                          {userData.avg_rating}
                        </span>
                        <span className="text-gray-500 ml-2">/ 5.0</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Event Cards */}
              <div className="flex-1 space-y-4">
                {sortedCreatedEventItems.map((eventItem, idx) => (
                  <EventCard
                    key={eventItem.id}
                    item={eventItem}
                    index={idx}
                    stagger={0.04}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      ),
    }
  ];

  return (
    <main>
      <Navbar />
      
      <div className="flex flex-col min-h-screen bg-indigo-100">
        <div className="flex flex-col w-full px-20 py-10 mb-3">
          <div className="flex justify-between p-6">
            <div className="flex flex-row gap-x-6 items-stretch">
              {/* Profile Picture */}
              <div className="w-64 h-64 overflow-hidden rounded-xl">
                <img
                  src={
                    userData.profile_pic.startsWith("/images")
                      ? userData.profile_pic
                      : `http://localhost:8000${userData.profile_pic}`
                  }
                  alt="Profile Picture"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Info */}
              <div className="flex flex-col justify-between h-64">
                <div>
                  <div className="text-gray-800 font-extrabold text-5xl">
                    {userData.first_name.charAt(0).toUpperCase() + userData.first_name.slice(1)}{" "}
                    {userData.last_name.charAt(0).toUpperCase() + userData.last_name.slice(1)}
                  </div>
                  
                  <div className="flex mt-3 mb-4">
                    {userData.role === "student" ? (
                      <div className="bg-sky-100 text-gray-800 font-bold text-base px-5 py-1 rounded-lg text-center">
                        Student
                      </div>
                    ) : userData.role === "professor" ? (
                      <div className="bg-indigo-200 text-gray-800 font-bold text-base px-5 py-1 rounded-lg text-center">
                        Professor
                      </div>
                    ) : userData.role === "organizer" ? (
                      <div className="bg-purple-100 text-gray-800 font-bold text-base px-5 py-1 rounded-lg text-center">
                        Organizer
                      </div>
                    ) : userData.role === "admin" && (
                      <div className="bg-slate-200 text-gray-800 font-bold text-base px-5 py-1 rounded-lg text-center">
                        Admin
                      </div>
                    )}
                  </div>

                  {/* Role-Specific Info */}
                  {userData.role === "student" && userData.about_me && (
                    <div className="text-gray-800 text-base mt-3.5 space-y-3.5">
                      <div className="font-medium">Faculty: {userData.about_me.faculty}</div>
                      <div className="font-medium">Year: {userData.about_me.year}</div>
                      <div className="font-medium">Tel: {userData.phone_number}</div>
                    </div>
                  )}

                  {userData.role === "professor" && userData.about_me && (
                    <div className="text-gray-800 text-base mt-3.5 space-y-3.5">
                      <div className="font-medium">Faculty: {userData.about_me.faculty}</div>
                      <div className="font-medium">Tel: {userData.phone_number}</div>
                    </div>
                  )}

                  {userData.role === "organizer" && userData.about_me && (
                    <div className="text-gray-800 text-base mt-3.5 space-y-3.5">
                      <div className="font-medium">Organizer: {userData.about_me.organizerName}</div>
                      <div className="font-medium">Tel: {userData.phone_number}</div>
                    </div>
                  )}

                  {/* Public Stats */}
                  <div className="flex gap-6 mt-6">
                    <div className="text-center">
                    </div>
                    <div className="text-center">
                    </div>
                    {userData.avg_rating && (
                      <div className="text-center">
                        <div className="text-2xl font-bold text-indigo-600">
                          {userData.avg_rating}
                        </div>
                        <div className="text-sm text-gray-600">Avg Rating</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Event History & Created Events */}
        <div className="flex flex-col w-full px-20">
          <Tabs items={items} />
        </div>
      </div>
    </main>
  );
}

export default PublicProfilePage;
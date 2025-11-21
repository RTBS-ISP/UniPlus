"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../components/navbar";
import EditPopup from "../components/profile/EditPopup";
import Tabs from '../components/profile/Tabs';
import EventCard from "../components/events/EventCard";
import { useUser } from "../context/UserContext"; 
import { Calendar, Copy } from 'lucide-react';

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
}

interface StatisticsData {
  total_events: number;
  upcoming_events: number;
  attended_events: number;
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
  
  const category = eventTags.length > 0 ? eventTags[0] : undefined;
  
  const excerpt = event.event_description 
    ? (event.event_description.length > 150 
        ? event.event_description.substring(0, 150) + '...' 
        : event.event_description)
    : 'No description available';

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

function ProfilePage() {
  const { user, setUser } = useUser(); 
  const [editOpen, setEditOpen] = useState(false);
  const [eventHistory, setEventHistory] = useState<EventData[]>([]);
  const [statistics, setStatistics] = useState<StatisticsData | null>(null);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [loadingStats, setLoadingStats] = useState(false);
  const [createdEvents, setCreatedEvents] = useState<EventData[]>([]);
  const [filter, setFilter] = useState<"all" | "upcoming" | "past">("all");
  const router = useRouter();

  useEffect(() => {
    if (user === null) {
      router.push('/login');
    } else if (user) {
      fetchEventHistory();
      fetchCreatedEvents();
      fetchStatistics();
    }
  }, [user, router]);

  const fetchEventHistory = async () => {
    try {
      setLoadingEvents(true);
      const response = await fetch('http://localhost:8000/api/user/event-history', {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        setEventHistory(data.events || []);
      } else {
        console.error('Failed to fetch event history');
      }
    } catch (error) {
      console.error('Error fetching event history:', error);
    } finally {
      setLoadingEvents(false);
    }
  };

  const fetchCreatedEvents = async () => {
    try {
      setLoadingEvents(true);
      const response = await fetch("http://localhost:8000/api/user/created-events", {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setCreatedEvents(data.events || []);
      } else {
        console.error("Failed to fetch created events");
      }
    } catch (error) {
      console.error("Error fetching created events:", error);
    } finally {
      setLoadingEvents(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      setLoadingStats(true);
      const response = await fetch('http://localhost:8000/api/user/statistics', {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        setStatistics(data);
      } else {
        console.error('Failed to fetch statistics');
      }
    } catch (error) {
      console.error('Error fetching statistics:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  const handleDuplicate = (eventId: number) => {
    // Simply redirect to create page with the event ID to duplicate
    router.push(`/events/create?duplicate=${eventId}`);
  };

  function getCookie(name: string): string | undefined {
    if (typeof document === "undefined") return undefined;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(";").shift();
  }

  const handleEditSave = async (data: any) => {
    const csrftoken = getCookie("csrftoken");
    const formData = new FormData();

    if (data.firstName) formData.append("firstName", data.firstName);
    if (data.lastName) formData.append("lastName", data.lastName);
    if (data.phone) formData.append("phone", data.phone);
    if (data.aboutMe) formData.append("aboutMe", JSON.stringify(data.aboutMe));
    if (data.file) formData.append("profilePic", data.file);

    const res = await fetch("http://localhost:8000/api/user", {
      method: "PATCH",
      credentials: "include",
      headers: {
        "X-CSRFToken": csrftoken ?? "",
      },
      body: formData,
    });

    if (res.ok) {
      const updatedUser = await res.json();
      setUser(updatedUser);
      setEditOpen(false);
    } else {
      console.error("Failed to update profile", await res.text());
      alert("Failed to update profile.");
    }
  };

  if (!user) return <p>Loading.....</p>

  const eventItems = eventHistory.map((event, idx) => 
    transformEventToItem(event, idx)
  );

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
                Register for events to see them here
              </p>
            </div>
          ) : (
            <div className="flex gap-6">
              <div className="w-72 flex-shrink-0">
                <div className="bg-white rounded-xl p-6 shadow-sm sticky top-6">
                  <h3 className="font-bold text-lg text-gray-800 mb-4">
                    Statistics
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                      <span className="text-gray-600 text-sm">Total Events</span>
                      <span className="font-bold text-indigo-600">
                        {sortedEventItems.length}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                      <span className="text-gray-600 text-sm">Upcoming</span>
                      <span className="font-bold text-indigo-400">
                        {
                          sortedEventItems.filter(
                            (e) => e.date && new Date(e.date) >= new Date()
                          ).length
                        }
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 text-sm">Past Events</span>
                      <span className="font-bold text-indigo-400">
                        {
                          sortedEventItems.filter(
                            (e) => e.date && new Date(e.date) < new Date()
                          ).length
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
      title: "My Events",
      content: (
        <div className="mt-4 rounded-xl">
          {loadingEvents ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-gray-500">Loading your events...</div>
            </div>
          ) : sortedCreatedEventItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-800 bg-white rounded-xl">
              <Calendar className="mb-2.5" size={52} />
              <p className="font-semibold text-xl">No events created yet</p>
              <p className="text-sm text-gray-600 mt-2">
                Create an event to see it here.
              </p>
            </div>
          ) : (
            <div className="flex gap-6">
              <div className="w-72 flex-shrink-0">
                <div className="bg-white rounded-xl p-6 shadow-sm sticky top-6">
                  <h3 className="font-bold text-lg text-gray-800 mb-4">
                    Event Overview
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                      <span className="text-gray-600 text-sm">Total Created</span>
                      <span className="font-bold text-indigo-600">
                        {sortedCreatedEventItems.length}
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
                  
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <h4 className="font-semibold text-medium text-gray-700 mb-3">
                      Quick Actions
                    </h4>
                    <div className="flex flex-col w-full space-y-2">
                      <a 
                        href="/events/create" 
                        className="w-full text-center px-3 py-2 rounded-lg text-sm bg-indigo-500 hover:bg-indigo-600 text-white transition-colors font-medium"
                      >
                        Create New Event
                      </a>
                      
                      {/* Duplicate from last event */}
                      {sortedCreatedEventItems.length > 0 && (
                        <button
                          onClick={() => handleDuplicate(sortedCreatedEventItems[0].id)}
                          className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm bg-purple-100 hover:bg-purple-200 text-purple-700 transition-colors font-medium"
                        >
                          <Copy size={16} />
                          Duplicate Last Event
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Event Cards with Duplicate Buttons */}
              <div className="flex-1 space-y-4">
                {sortedCreatedEventItems.map((eventItem, idx) => (
                  <EventCard
                    key={eventItem.id}
                    item={eventItem}
                    index={idx}
                    stagger={0.04}
                    showDuplicate={true}
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
      <EditPopup
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSave={handleEditSave}
        role={user.role}
        initialData={{
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          aboutMe: user.aboutMe,
          profilePic: user.profilePic,
        }}
      />

      <div className="flex flex-col min-h-screen bg-indigo-100">
        <div className="flex flex-col w-full px-20 py-10 mb-3">
          <div className="flex justify-between p-6">
            <div className="flex flex-row gap-x-6 items-stretch">
              <div className="w-64 h-64 overflow-hidden rounded-xl">
                <img
                  src={
                    user.profilePic.startsWith("/images")
                      ? user.profilePic
                      : `http://localhost:8000${user.profilePic}`
                  }
                  alt="Profile Picture"
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex flex-col justify-between h-64">
                <div>
                  <div className="text-gray-800 font-extrabold text-5xl">
                    {user.firstName.charAt(0).toUpperCase() + user.firstName.slice(1)}{" "}
                    {user.lastName.charAt(0).toUpperCase() + user.lastName.slice(1)}
                  </div>
                  
                  {user.role && (
                    <div className="flex mt-3 mb-4">
                      {user.role === "student" ? (
                        <div className="bg-sky-100 text-gray-800 font-bold text-base px-5 py-1 rounded-lg text-center">
                          Student
                        </div>
                      ) : user.role === "professor" ? (
                        <div className="bg-indigo-200 text-gray-800 font-bold text-base px-5 py-1 rounded-lg text-center">
                          Professor
                        </div>
                      ) : user.role === "organizer" ? (
                        <div className="bg-purple-100 text-gray-800 font-bold text-base px-5 py-1 rounded-lg text-center">
                          Organizer
                        </div>
                      ) : user.role === "admin" && (
                        <div className="bg-slate-200 text-gray-800 font-bold text-base px-5 py-1 rounded-lg text-center">
                          Admin
                        </div>
                      )}
                    </div>
                  )}

                  {user.role === "student" && user.aboutMe && (
                    <div className="text-gray-800 text-base mt-3.5 space-y-3.5">
                      <div className="font-medium">Faculty: {user.aboutMe.faculty}</div>
                      <div className="font-medium">Year: {user.aboutMe.year}</div>
                      <div className="font-medium">Tel: {user.phone}</div>
                    </div>
                  )}

                  {user.role === "professor" && user.aboutMe && (
                    <div className="text-gray-800 text-base mt-3.5 space-y-3.5">
                      <div className="font-medium">Faculty: {user.aboutMe.faculty}</div>
                      <div className="font-medium">Tel: {user.phone}</div>
                    </div>
                  )}

                  {user.role === "organizer" && user.aboutMe && (
                    <div className="text-gray-800 text-base mt-3.5 space-y-3.5">
                      <div className="font-medium">Organizer: {user.aboutMe.organizerName}</div>
                      <div className="font-medium">Tel: {user.phone}</div>
                    </div>
                  )}
                </div>

                <div className="mt-4">
                  <button
                    onClick={() => setEditOpen(true)}
                    className="px-5 py-2 font-bold bg-indigo-500 hover:bg-indigo-300 text-white rounded-lg text-sm"
                  >
                    Edit Profile
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-col w-full px-20">
          <Tabs items={items} />
        </div>
      </div>
    </main>
  );
}

export default ProfilePage;
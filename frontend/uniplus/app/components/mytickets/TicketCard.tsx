"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Calendar, Clock, MapPin } from "lucide-react";

interface EventDay {
  date: string;
  time: string;
  endTime?: string;
  location: string;
  is_online: boolean;
  meeting_link?: string | null;
}
interface ScheduleDay {
  date: string;
  startTime: string;
  endTime: string;
  location: string;
}

interface TicketInfo {
  date: string;
  time: string;
  location: string;
  organizer: string;
  user_information: {
    name: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  event_title: string;
  event_description: string;
  ticket_number: string;
  event_id: number;
  is_online: boolean;
  event_meeting_link: string | null;
  event_image: string | null;
  event_dates: EventDay[];
}

interface EventDetail {
  tags: string[];
  schedule?: ScheduleDay[];
  is_online: boolean;
}

export default function TicketCard({ ticket }: { ticket: TicketInfo }) {
  const [tags, setTags] = useState<string[]>([]);
  const [schedule, setSchedule] = useState<ScheduleDay[]>([]);
  const [isOnline, setIsOnline] = useState(ticket.is_online);
  const [loading, setLoading] = useState(true);

  const fetchEventDetail = async (eventId: number) => {
    try {
      const response = await fetch(`http://localhost:8000/api/events/${eventId}`, {
        credentials: "include",
      });

      if (response.ok) {
        const data: EventDetail = await response.json();
        setTags(data.tags || []);
        setSchedule(data.schedule || []);
        setIsOnline(data.is_online);
      }
    } catch (error) {
      console.error("Error fetching event detail:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (ticket.event_id) {
      fetchEventDetail(ticket.event_id);
    } else {
      setLoading(false);
    }
  }, [ticket.event_id]);

  const formatDate = (dateString: string) => {
    if (!dateString) return "TBA";
    const date = new Date(dateString.split('T')[0]); 
    if (isNaN(date.getTime())) return "TBA";
    
    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };
  
  // Function to summarize date range 
  const formatDateRangeSummary = (eventDates: EventDay[], fallbackDate: string) => {
    if (!eventDates || eventDates.length === 0) {
      return formatDate(fallbackDate);
    }

    const sortedDates = eventDates
      .map((d) => new Date(d.date.split('T')[0])) 
      .filter(d => !isNaN(d.getTime()))
      .sort((a, b) => a.getTime() - b.getTime());

    if (sortedDates.length === 0) {
        return formatDate(fallbackDate);
    }

    const startDate = sortedDates[0];
    const endDate = sortedDates[sortedDates.length - 1];

    // Case 1: Single day event
    if (sortedDates.length === 1 || startDate.getTime() === endDate.getTime()) {
      return formatDate(eventDates[0].date);
    }

    // Case 2: Consecutive multi-day event 
    const oneDay = 24 * 60 * 60 * 1000;
    const diffDays = Math.round(
      Math.abs((endDate.getTime() - startDate.getTime()) / oneDay)
    );
    
    if (diffDays === sortedDates.length - 1) {
      // If the number of days in the array equals the span of days (consecutive)
      const formattedStart = formatDate(startDate.toISOString().split('T')[0]);
      const formattedEnd = formatDate(endDate.toISOString().split('T')[0]);
      return `${formattedStart} - ${formattedEnd}`;
    } else {
      // Case 3: Non-consecutive/scattered event
      const formattedStart = formatDate(startDate.toISOString().split('T')[0]);
      return `${formattedStart} (${eventDates.length} Dates)`;
    }
  };

  const formatTimeRange = (time?: string, endTime?: string) => {
    if (!time) return "TBA";
    try {
      const start = new Date(`1970-01-01T${time}`);
      const startStr = start.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });

      if (endTime) {
        const end = new Date(`1970-01-01T${endTime}`);
        const endStr = end.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        });
        return `${startStr} - ${endStr}`;
      }

      return startStr;
    } catch {
      return time;
    }
  };

  // Get location from the fetched schedule instead of ticket data
  const getEventLocation = () => {
    const hasPhysicalLocation =
      schedule && schedule.some(s => s.location && s.location.trim() !== "");

    if (isOnline && hasPhysicalLocation) {
      return "Hybrid (Online & Onsite)";
    }

    if (isOnline) {
      return "Online Event";
    }

    if (hasPhysicalLocation) {
      const locations = schedule.map(s => s.location).filter(Boolean);
      const uniqueLocations = [...new Set(locations)];
      if (uniqueLocations.length === 1) {
        return uniqueLocations[0];
      }
      return `${uniqueLocations[0]} (+${uniqueLocations.length - 1} more)`;
    }

    // Fallback
    const firstDate = ticket.event_dates?.[0];
    return firstDate?.location || ticket.location || "TBA";
  };

  const firstDate = ticket.event_dates?.[0];
  // Summary function for the date display
  const formattedDate = formatDateRangeSummary(
    ticket.event_dates,
    ticket.date
  ); 

  const formattedTime = formatTimeRange(firstDate?.time || ticket.time, firstDate?.endTime);
  const eventLocation = getEventLocation();
  
  const MAX_VISIBLE_TAGS = 2;
  const visibleTags = tags.slice(0, MAX_VISIBLE_TAGS);
  const hiddenTags = tags.slice(MAX_VISIBLE_TAGS);

  if (loading) {
    return (
      <div className="rounded-lg bg-white p-6 shadow-sm text-gray-500 text-sm text-center">
        Loading event info...
      </div>
    );
  }

  return (
    <Link
      href={`/my-ticket/${ticket.ticket_number}`}
      className="rounded-lg shadow-sm bg-white flex flex-col transition-transform hover:scale-[1.02] hover:shadow-md"
    >
      {/* Header */}
      <div className="flex items-center rounded-t-lg w-full h-24 bg-indigo-500">
        <div className="flex flex-col p-6 gap-y-3">
          <h2 className="text-white text-xl font-bold">
            {ticket.event_title || "Untitled Event"}
          </h2>
          <p className="text-white text-sm font-medium">
            {ticket.ticket_number}
          </p>
        </div>
      </div>

      {/* Detail Section */}
      <div className="p-6 flex-1 flex flex-col">
        <div className="flex gap-x-2 mb-2">
          <Calendar size={20} className="text-indigo-500" />
          <p className="text-gray-800 text-sm font-semibold">{formattedDate}</p>
        </div>
        <div className="flex gap-x-2 mb-2">
          <Clock size={20} className="text-indigo-500" />
          <p className="text-gray-800 text-sm font-semibold">{formattedTime}</p>
        </div>
        <div className="flex gap-x-2 mb-4">
          <MapPin size={20} className="text-indigo-500" />
          <p className="text-gray-800 text-sm font-semibold line-clamp-1">
            {eventLocation}
          </p>
        </div>
        <hr className="mb-4" />

        {/* Tags Section */}
        {tags.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2 mt-auto">
            <div className="flex flex-wrap gap-2">
              {visibleTags.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center rounded-md bg-[#E8EEFF] px-2 py-1 text-xs font-semibold text-[#1F2A44]"
                >
                  {t}
                </span>
              ))}

              {hiddenTags.length > 0 && (
                <span className="relative group inline-block">
                  <button
                    type="button"
                    className="inline-flex items-center rounded-md bg-[#E8EEFF] px-2 py-1 text-xs font-semibold text-[#1F2A44]"
                  >
                    +{hiddenTags.length}
                  </button>

                  {/* hover dropdown */}
                  <div
                    className="pointer-events-none absolute left-1/2 z-50 mt-2 w-[min(420px,90vw)]
                              -translate-x-1/2 rounded-xl border border-gray-200 bg-white/95 p-3
                              shadow-lg backdrop-blur opacity-0 scale-95 transition-all duration-150
                              group-hover:opacity-100 group-hover:scale-100"
                  >
                    <div className="flex flex-wrap gap-2">
                      {hiddenTags.map((t) => (
                        <span
                          key={t}
                          className="inline-flex items-center rounded-md bg-[#E8EEFF] px-2 py-1 text-xs font-semibold text-[#1F2A44]"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </span>
              )}
            </div>
          </div>
        ) : (
          <span className="px-3 py-1 bg-gray-100 text-gray-500 text-sm rounded-lg">
            No Tags
          </span>
        )}
        </div>
    </Link>
  );
}
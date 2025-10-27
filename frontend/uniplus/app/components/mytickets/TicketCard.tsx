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
}

export default function TicketCard({ ticket }: { ticket: TicketInfo }) {
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEventDetail = async (eventId: number) => {
    try {
      const response = await fetch(`http://localhost:8000/api/events/${eventId}`, {
        credentials: "include",
      });

      if (response.ok) {
        const data: EventDetail = await response.json();
        setTags(data.tags || []);
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
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
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

  const firstDate = ticket.event_dates?.[0];
  const formattedDate = formatDate(firstDate?.date || ticket.date);
  const formattedTime = formatTimeRange(firstDate?.time || ticket.time, firstDate?.endTime);

  if (loading) {
    return (
      <div className="rounded-lg bg-white p-6 shadow-sm text-gray-500 text-sm text-center">
        Loading event info...
      </div>
    );
  }

  return (
    <Link
      href={`/mytickets/${ticket.ticket_number}`}
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
          <p className="text-gray-800 text-sm">{formattedDate}</p>
        </div>
        <div className="flex gap-x-2 mb-2">
          <Clock size={20} className="text-indigo-500" />
          <p className="text-gray-800 text-sm">{formattedTime}</p>
        </div>
        <div className="flex gap-x-2 mb-4">
          <MapPin size={20} className="text-indigo-500" />
          <p className="text-gray-800 text-sm">
            {firstDate?.is_online
              ? "Online Event"
              : firstDate?.location || ticket.location || "TBA"}
          </p>
        </div>
        <hr className="mb-4" />

        {/* Tags Section */}
        <div className="flex flex-wrap gap-2 mt-auto">
          {tags.length > 0 ? (
            tags.map((tag, i) => (
              <span
                key={i}
                className="px-3 py-1 bg-indigo-100 text-gray-800 text-sm font-bold rounded-lg"
              >
                {tag}
              </span>
            ))
          ) : (
            <span className="px-3 py-1 bg-gray-100 text-gray-500 text-sm rounded-lg">
              No Tags
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

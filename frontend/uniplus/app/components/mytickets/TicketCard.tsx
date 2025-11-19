"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Calendar, Clock, MapPin, ChevronLeft, ChevronRight, CheckCircle2 } from "lucide-react";

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
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [showTitlePopover, setShowTitlePopover] = useState(false);

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

  // Helper functions defined first
  const getCurrentDayInfo = () => {
    if (ticket.event_dates && ticket.event_dates.length > 0) {
      return ticket.event_dates[selectedDayIndex];
    }
    return {
      date: ticket.date,
      time: ticket.time,
      location: ticket.location,
      is_online: ticket.is_online,
    };
  };

  // Determine if event is past, today, or upcoming
  const getEventStatus = () => {
    const currentDay = getCurrentDayInfo();
    const eventDate = new Date(currentDay.date.split('T')[0] + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const diffTime = eventDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'past';
    if (diffDays === 0) return 'today';
    if (diffDays <= 7) return 'soon'; // Within a week
    return 'upcoming';
  };

  const status = getEventStatus();

  // Get styling based on status
    const getStatusStyles = () => {
    switch (status) {
      case 'past':
        return {
          cardClass: 'opacity-60',
          headerBg: 'bg-slate-400',
          iconColor: 'text-slate-400',
          badge: { text: 'Past', bg: 'bg-slate-500/90' }
        };
      case 'today':
        return {
          cardClass: '',
          headerBg: 'bg-[#8B9CFF]',
          iconColor: 'text-[#8B9CFF]',
          badge: { text: 'Today', bg: 'bg-[#6B7CFF]/90' }
        };
      case 'soon':
        return {
          cardClass: '',
          headerBg: 'bg-[#6366F1]',
          iconColor: 'text-[#6366F1]',
          badge: { text: 'Soon', bg: 'bg-[#4F46E5]/90' }
        };
      default: // upcoming
        return {
          cardClass: '',
          headerBg: 'bg-indigo-700', // Darker shade (Indigo-600)
          iconColor: 'text-indigo-700',
          badge: { text: 'Upcoming', bg: 'bg-indigo-800/90' }
        };
    }
  };

  const styles = getStatusStyles();

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

  const formatShortDate = (dateString: string) => {
    if (!dateString) return "TBA";
    const date = new Date(dateString.split('T')[0]); 
    if (isNaN(date.getTime())) return "TBA";
    
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
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

  const getCurrentDayLocation = () => {
    const currentDay = getCurrentDayInfo();
    
    if (schedule && schedule.length > 0) {
      const currentDateStr = currentDay.date.split('T')[0];
      const matchingSchedule = schedule.find(s => s.date === currentDateStr);
      
      if (matchingSchedule && matchingSchedule.location && matchingSchedule.location.trim() !== "") {
        if (isOnline) {
          return "Hybrid (Online & Onsite)";
        }
        return matchingSchedule.location;
      }
    }
    
    if (isOnline) {
      return "Online Event";
    }
    
    // Fallback: check event_dates location
    if (currentDay.location && currentDay.location.trim() !== "" && currentDay.location !== "TBA") {
      return currentDay.location;
    }
    
    // Final fallback
    return ticket.location || "TBA";
  };

  const currentDay = getCurrentDayInfo();
  const hasMultipleDays = ticket.event_dates && ticket.event_dates.length > 1;
  
  const formattedDate = formatDate(currentDay.date);
  const formattedTime = formatTimeRange(currentDay.time, currentDay.endTime);
  const eventLocation = getCurrentDayLocation();
  
  const MAX_VISIBLE_TAGS = 2;
  const visibleTags = tags.slice(0, MAX_VISIBLE_TAGS);
  const hiddenTags = tags.slice(MAX_VISIBLE_TAGS);

  const handlePrevDay = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedDayIndex((prev) => 
      prev === 0 ? ticket.event_dates.length - 1 : prev - 1
    );
  };

  const handleNextDay = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedDayIndex((prev) => 
      prev === ticket.event_dates.length - 1 ? 0 : prev + 1
    );
  };

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
      className={`rounded-lg shadow-sm bg-white flex flex-col transition-all duration-300 hover:scale-[1.02] hover:shadow-md ${styles.cardClass}`}
    >
      {/* Header */}
      <div className={`flex items-start justify-between rounded-t-lg w-full h-36 ${styles.headerBg} relative p-6 gap-4 overflow-hidden`}>
        {/* Status Badge - Top Left */}
        {styles.badge && (
          <div className={`absolute top-3 left-3 ${styles.badge.bg} text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-lg`}>
            {styles.badge.icon && <styles.badge.icon size={12} />}
            {styles.badge.text}
          </div>
        )}

        <div className="flex flex-col gap-y-3 flex-1 pr-2 relative" style={{ marginTop: styles.badge ? '28px' : '0' }}>
          <div className="relative group/title">
            <h2 
              className="text-white text-xl font-bold line-clamp-2 cursor-pointer"
              onClick={(e) => {
                if (ticket.event_title && ticket.event_title.length > 80) {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowTitlePopover(!showTitlePopover);
                }
              }}
            >
              {ticket.event_title || "Untitled Event"}
            </h2>
            
            {/* Popover - Shows on hover (desktop) or click (mobile) */}
            {ticket.event_title && ticket.event_title.length > 80 && (
              <div className={`absolute left-0 top-full mt-2 w-[min(400px,90vw)] bg-white rounded-lg shadow-xl border border-gray-200 p-4 z-50 transition-all duration-200
                ${showTitlePopover ? 'opacity-100 visible' : 'opacity-0 invisible'}
                md:group-hover/title:opacity-100 md:group-hover/title:visible md:pointer-events-none
              `}>
                <div className="flex items-start justify-between gap-2">
                  <p className="text-gray-900 text-sm font-semibold leading-relaxed flex-1">
                    {ticket.event_title}
                  </p>
                  {/* Close button - only visible on mobile */}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowTitlePopover(false);
                    }}
                    className="md:hidden flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors p-1"
                    aria-label="Close"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                </div>
                <div className="absolute -top-2 left-6 w-4 h-4 bg-white border-l border-t border-gray-200 transform rotate-45"></div>
              </div>
            )}
          </div>
          
          <p className="text-white text-sm font-medium">
            {ticket.ticket_number}
          </p>
        </div>

        {/* Day Selector - Top Right in Header */}
        {hasMultipleDays && (
          <div className="flex items-center gap-1 bg-white/20 backdrop-blur-sm rounded-full px-2 py-1.5 border border-white/30 flex-shrink-0">
            <button
              onClick={handlePrevDay}
              className="p-0.5 hover:bg-white/30 rounded-full transition-colors"
              aria-label="Previous day"
            >
              <ChevronLeft size={14} className="text-white" />
            </button>
            
            <span className="text-xs font-semibold text-white whitespace-nowrap px-1">
              Day {selectedDayIndex + 1} of {ticket.event_dates.length}
            </span>

            <button
              onClick={handleNextDay}
              className="p-0.5 hover:bg-white/30 rounded-full transition-colors"
              aria-label="Next day"
            >
              <ChevronRight size={14} className="text-white" />
            </button>
          </div>
        )}
      </div>

      {/* Detail Section */}
      <div className="p-6 flex-1 flex flex-col">
        <div className="flex gap-x-2 mb-2">
          <Calendar size={20} className={styles.iconColor} />
          <p className="text-gray-800 text-sm font-semibold">{formattedDate}</p>
        </div>
        <div className="flex gap-x-2 mb-2">
          <Clock size={20} className={styles.iconColor} />
          <p className="text-gray-800 text-sm font-semibold">{formattedTime}</p>
        </div>
        <div className="flex gap-x-2 mb-4">
          <MapPin size={20} className={styles.iconColor} />
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
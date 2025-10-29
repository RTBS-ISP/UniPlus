"use client";
import { useState, useEffect } from "react";
import Navbar from "../../components/navbar";
import { Calendar, Clock, MapPin, ArrowLeft, User, Mail, ChevronDown } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";


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
  schedule: Array<{
    date: string;
    startTime: string;
    endTime: string;
  }>;
}

export default function TicketDetailPage () {
  const [selectedDateIndex, setSelectedDateIndex] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);  

  const params = useParams();
  const ticketNumber = (params?.ticketNumber || params?.id) as string;
  const [ticket, setTicket] = useState<TicketInfo | null>(null);
  const [eventDetail, setEventDetail] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [tags, setTags] = useState<string[]>([]);

  useEffect(() => {
    console.log('Params:', params);
    console.log('Ticket number extracted:', ticketNumber);
    if (ticketNumber) {
      fetchTicketDetail();
    }
  }, [ticketNumber]);

  const fetchEventDetail = async (eventId: number) => {
    try {
      const response = await fetch(`http://localhost:8000/api/events/${eventId}`, {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Event detail received:', data);
        setEventDetail(data);
        return data;
      }
    } catch (error) {
      console.error('Error fetching event detail:', error);
    }
    return null;
  };

  const fetchTicketDetail = async () => {
    try {
      setLoading(true);
      console.log('Looking for ticket with number:', ticketNumber);
      
      const response = await fetch('http://localhost:8000/api/user', {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('User data received:', data);
        console.log('All tickets:', data.tickets);
        
        const foundTicket = data.tickets?.find(
          (t: TicketInfo) => t.ticket_number === ticketNumber
        );

        console.log('Found ticket:', foundTicket);

        if (foundTicket) {
          console.log('Setting ticket with event_dates:', foundTicket.event_dates);
          console.log('event_dates type:', typeof foundTicket.event_dates);
          console.log('event_dates is array?:', Array.isArray(foundTicket.event_dates));
          
          // Parse event_dates if it's a string
          let parsedTicket = { ...foundTicket };
          if (typeof foundTicket.event_dates === 'string') {
            try {
              parsedTicket.event_dates = JSON.parse(foundTicket.event_dates);
              console.log('Parsed event_dates:', parsedTicket.event_dates);
            } catch (e) {
              console.error('Failed to parse event_dates:', e);
            }
          }
          
          setTicket(parsedTicket);
          
          // Fetch event details to get tags
          if (parsedTicket.event_id) {
            const eventData = await fetchEventDetail(parsedTicket.event_id);
            
            // Generate tags based on ticket and event info
            const generatedTags = [];
            
            // Add tags from event detail
            if (eventData && eventData.tags && Array.isArray(eventData.tags)) {
              generatedTags.push(...eventData.tags);
            }
            
            console.log('Final tags:', generatedTags);
            setTags(generatedTags);
          }
        } else {
          console.error('No matching ticket found');
          console.log('Available ticket numbers:', data.tickets?.map((t: any) => t.ticket_number));
        }
      } else {
        console.error('API response not ok:', response.status);
      }
    } catch (error) {
      console.error('Error fetching ticket:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const formatTimeRange = (startTime: string, endTime?: string) => {
    const parseTime = (t: string) => {
      const [hours, minutes] = t.split(":");
      const date = new Date();
      date.setHours(parseInt(hours), parseInt(minutes));
      return date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    };
    const start = parseTime(startTime);
    return endTime ? `${start} - ${parseTime(endTime)}` : start;
  };

  if (loading) {
    return (
      <main>
        <Navbar/>
        <div className="min-h-screen bg-indigo-100 flex items-center justify-center">
          <div className="text-gray-800 text-xl">Loading ticket details...</div>
        </div>
      </main>
    );
  }

  if (!ticket) {
    return (
      <main>
        <Navbar/>
        <div className="min-h-screen bg-indigo-100">
          <div className="max-w-7xl mx-auto px-8 pt-16">
            <Link href="/mytickets" className="flex items-center gap-2 hover:opacity-80 transition-opacity w-fit">
              <ArrowLeft size={18} className="text-gray-800"/>
              <p className="text-gray-800 font-medium">Back to My Tickets</p>
            </Link>
          </div>
          <div className="flex items-center justify-center py-20">
            <div className="text-red-600 text-xl">Ticket not found</div>
          </div>
        </div>
      </main>
    );
  }

  // Ensure event_dates is an array
  const eventDates = Array.isArray(ticket.event_dates) ? ticket.event_dates : [];
  const hasMultipleDays = eventDates.length > 1;

  console.log('Rendering with event dates:', eventDates);
  console.log('Has multiple days:', hasMultipleDays);
  console.log('Selected date index:', selectedDateIndex);

  return (
    <main>
      <Navbar/>
      <div className="min-h-screen bg-indigo-100">
        {/* Back Button */}
        <div className="max-w-7xl mx-auto px-8 pt-16">
          <Link href="/mytickets" className="flex items-center gap-2 hover:opacity-80 transition-opacity w-fit">
            <ArrowLeft size={18} className="text-gray-800"/>
            <p className="text-gray-800 font-medium">Back to My Tickets</p>
          </Link>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="rounded-lg shadow-sm bg-white overflow-hidden">
            {/* Header Section with Tags */}
            <div className="bg-indigo-500 p-8">
              <h1 className="text-white text-4xl font-bold mb-4">
                {ticket.event_title}
              </h1>
              {tags.length > 0 && (() => {
                const MAX_VISIBLE_TAGS = 3;
                const visibleTags = tags.slice(0, MAX_VISIBLE_TAGS);
                const hiddenTags = tags.slice(MAX_VISIBLE_TAGS);

                return (
                  <div className="flex flex-wrap gap-2 items-center">
                    {visibleTags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-4 py-1.5 bg-indigo-100 text-gray-800 text-sm font-semibold rounded-lg"
                      >
                        {tag}
                      </span>
                    ))}

                    {hiddenTags.length > 0 && (
                      <span className="relative group inline-block">
                        <button
                          type="button"
                          className="px-3 py-1.5 bg-indigo-100 text-gray-800 text-sm font-semibold rounded-lg"
                        >
                          +{hiddenTags.length} more
                        </button>

                        {/* hover dropdown */}
                        <div
                          className="pointer-events-none absolute left-1/2 z-50 mt-2 w-[min(400px,90vw)]
                                    -translate-x-1/2 rounded-xl border border-gray-200 bg-white/95 p-3
                                    shadow-lg backdrop-blur opacity-0 scale-95 transition-all duration-150
                                    group-hover:opacity-100 group-hover:scale-100"
                        >
                          <div className="flex flex-wrap gap-2">
                            {hiddenTags.map((tag, idx) => (
                              <span
                                key={idx}
                                className="px-4 py-1.5 bg-indigo-100 text-gray-800 text-sm font-semibold rounded-lg"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </span>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-8">
              {/* Left Column */}
              <div className="space-y-8">
                {/* Day Selector (Only show if multi-day event) */}
                {hasMultipleDays && (
                  <div className="relative">
                    <h2 className="text-gray-800 font-bold text-lg mb-4">
                      SELECT DAY
                    </h2>
                    <button
                      onClick={() => setDropdownOpen((prev) => !prev)}
                      className="w-full flex justify-between items-center px-4 py-3 bg-indigo-100 rounded-lg text-gray-800 font-semibold hover:bg-indigo-200 transition"
                    >
                      Day {selectedDateIndex + 1} — {formatDate(eventDates[selectedDateIndex].date)}
                      <ChevronDown
                        size={18}
                        className={`transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
                      />
                    </button>

                    {dropdownOpen && (
                      <div className="absolute mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-md z-10">
                        {eventDates.map((eventDate, index) => (
                          <button
                            key={index}
                            onClick={() => {
                              setSelectedDateIndex(index);
                              setDropdownOpen(false);
                            }}
                            className={`block w-full text-left px-4 py-2 text-sm font-semibold transition-colors ${
                              selectedDateIndex === index
                                ? "bg-indigo-500 text-white"
                                : "text-gray-800 hover:bg-indigo-100"
                            }`}
                          >
                            Day {index + 1} — {formatDate(eventDate.date)}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}        
              
                {/* Event Details */}
                <div>
                  <h2 className="text-gray-800 font-bold text-lg mb-4">EVENT DETAILS</h2>
                  {eventDates.length > 0 ? (
                    <div className="space-y-4">
                      {(() => {
                        const eventDate = eventDates[selectedDateIndex];
                        return (
                          <>
                            <div className="flex gap-4">
                              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-indigo-100">
                                <Calendar size={20} className="text-indigo-500"/>
                              </div>
                              <div>
                                <p className="text-gray-800 text-sm">Date</p>
                                <p className="text-gray-800 font-semibold">{formatDate(eventDate.date)}</p>
                              </div>
                            </div>

                            <div className="flex gap-4">
                              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-indigo-100">
                                <Clock size={20} className="text-indigo-500"/>
                              </div>
                              <div>
                                <p className="text-gray-800 text-sm">Time</p>
                                <p className="text-gray-800 font-semibold">{formatTimeRange(eventDate.time, eventDate.endTime)}</p>
                              </div>
                            </div>

                            <div className="flex gap-4">
                              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-indigo-100">
                                <MapPin size={20} className="text-indigo-500"/>
                              </div>
                              <div>
                                <p className="text-gray-800 text-sm">Location</p>
                                <p className="text-gray-800 font-semibold">
                                  {eventDate.is_online ? 'Online Event' : eventDate.location}
                                </p>
                                {eventDate.is_online && eventDate.meeting_link && (
                                  <a 
                                    href={eventDate.meeting_link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-indigo-600 text-sm hover:underline mt-1 inline-block"
                                  >
                                    Join Meeting →
                                  </a>
                                )}
                              </div>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex gap-4">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-indigo-100">
                          <Calendar size={20} className="text-indigo-500"/>
                        </div>
                        <div>
                          <p className="text-gray-800 text-sm">Date</p>
                          <p className="text-gray-800 font-semibold">{formatDate(ticket.date)}</p>
                        </div>
                      </div>

                      <div className="flex gap-4">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-indigo-100">
                          <Clock size={20} className="text-indigo-500"/>
                        </div>
                        <div>
                          <p className="text-gray-800 text-sm">Time</p>
                          <p className="text-gray-800 font-semibold">{formatTimeRange(ticket.time)}</p>
                        </div>
                      </div>

                      <div className="flex gap-4">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-indigo-100">
                          <MapPin size={20} className="text-indigo-500"/>
                        </div>
                        <div>
                          <p className="text-gray-800 text-sm">Location</p>
                          <p className="text-gray-800 font-semibold">
                            {ticket.is_online ? 'Online Event' : ticket.location}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <hr/>
                
                {/* Ticket Holder */}
                <div>
                  <h2 className="text-gray-800 font-bold text-lg mb-4">TICKET HOLDER</h2>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <User size={20} className="text-gray-800"/>
                      <p className="text-gray-800 font-semibold">{ticket.user_information.name}</p>
                    </div>

                    <div className="flex items-center gap-3">
                      <Mail size={20} className="text-gray-800"/>
                      <p className="text-gray-800">{ticket.user_information.email}</p>
                    </div>
                  </div>
                </div>
                <hr/>

                {/* Additional Info */}
                <div className="bg-indigo-100 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-800">Organized by</span>
                    <span className="text-gray-800 font-semibold">{eventDetail?.host?.length ? eventDetail.host.join(", ") : ticket.organizer}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-800">Registered on</span>
                    <span className="text-gray-800 font-semibold">8 October 2025</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-800">Ticket ID</span>
                    <span className="text-gray-800 font-semibold">{ticket.ticket_number}</span>
                  </div>
                </div>
              </div>

              {/* Right Column - QR Code */}
              <div className="flex flex-col items-center justify-start">
                <div className="w-full max-w-sm aspect-square bg-gray-200 rounded-lg flex items-center justify-center">
                  {/* Placeholder for QR Code */}
                  <div className="text-gray-400 text-center">
                    <p className="text-sm">QR Code</p>
                  </div>
                </div>
                <p className="text-center text-gray-800 text-sm mt-4 max-w-sm">
                  Present this QR code at the event entrance for verification
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
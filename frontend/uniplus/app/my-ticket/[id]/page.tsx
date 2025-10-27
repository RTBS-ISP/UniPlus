"use client"
import Navbar from "../../components/navbar"
import { Calendar, Clock, MapPin, ArrowLeft, User, Mail } from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useState, useEffect } from "react"

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

function TicketDetailPage() {
  const params = useParams();
  // Try both possible param names
  const ticketNumber = (params?.ticketNumber || params?.id) as string;
  
  const [ticket, setTicket] = useState<TicketInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [tags, setTags] = useState<string[]>([]);
  const [selectedDateIndex, setSelectedDateIndex] = useState(0);

  useEffect(() => {
    console.log('Params:', params);
    console.log('Ticket number extracted:', ticketNumber);
    if (ticketNumber) {
      fetchTicketDetail();
    }
  }, [ticketNumber]);

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
          
          // Generate tags based on ticket info
          const generatedTags = [];
          if (parsedTicket.is_online) {
            generatedTags.push('Online Event');
          }
          if (parsedTicket.event_dates && Array.isArray(parsedTicket.event_dates) && parsedTicket.event_dates.length > 1) {
            generatedTags.push(`${parsedTicket.event_dates.length} Days`);
            console.log('Multi-day event detected:', parsedTicket.event_dates.length, 'days');
          }
          setTags(generatedTags);
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
    return date.toLocaleDateString('en-US', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
  };

  const formatTime = (timeString: string) => {
    try {
      const [hours, minutes] = timeString.split(':');
      const date = new Date();
      date.setHours(parseInt(hours), parseInt(minutes));
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
    } catch {
      return timeString;
    }
  };

  const formatTimeRange = (startTime: string, endTime?: string) => {
    const start = formatTime(startTime);
    if (endTime) {
      const end = formatTime(endTime);
      return `${start} - ${end}`;
    }
    return start;
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
              <h1 className="text-white text-4xl font-bold mb-4">{ticket.event_title}</h1>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-4 py-1.5 bg-indigo-100 text-gray-800 text-sm font-semibold rounded-lg"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-8">
              {/* Left Column */}
              <div className="space-y-8">
                {/* DEBUG: Show event_dates info
                {console.log('Rendering - ticket.event_dates:', ticket.event_dates)}
                {console.log('Rendering - is array?:', Array.isArray(ticket.event_dates))}
                {console.log('Rendering - length:', ticket.event_dates?.length)} */}
                
                {/* Multi-day Dropdown */}
                {ticket.event_dates && Array.isArray(ticket.event_dates) && ticket.event_dates.length > 1 && (
                  <div className="bg-indigo-50 rounded-lg p-4 border-2 border-indigo-200">
                    <label className="block text-gray-800 font-bold text-sm mb-2">
                      Select Event Day ({ticket.event_dates.length} days available)
                    </label>
                    <select
                      value={selectedDateIndex}
                      onChange={(e) => setSelectedDateIndex(Number(e.target.value))}
                      className="w-full px-4 py-3 rounded-lg border-2 border-indigo-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition text-gray-800 font-semibold bg-white"
                    >
                      {ticket.event_dates.map((eventDate, index) => (
                        <option key={index} value={index}>
                          Day {index + 1}: {formatDate(eventDate.date)} - {formatTime(eventDate.time)}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Event Details */}
                <div>
                  <h2 className="text-gray-800 font-bold text-lg mb-4">EVENT DETAILS</h2>
                  
                  {ticket.event_dates && Array.isArray(ticket.event_dates) && ticket.event_dates.length > 0 ? (
                    <div className="space-y-4">
                      {(() => {
                        const eventDate = ticket.event_dates[selectedDateIndex];
                        return (
                          <>
                            <div className="flex gap-4">
                              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-indigo-100">
                                <Calendar size={20} className="text-indigo-500"/>
                              </div>
                              <div>
                                <p className="text-gray-800 text-sm">
                                  Date {ticket.event_dates.length > 1 ? `(Day ${selectedDateIndex + 1} of ${ticket.event_dates.length})` : ''}
                                </p>
                                <p className="text-gray-800 font-semibold">{formatDate(eventDate.date)}</p>
                              </div>
                            </div>

                            <div className="flex gap-4">
                              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-indigo-100">
                                <Clock size={20} className="text-indigo-500"/>
                              </div>
                              <div>
                                <p className="text-gray-800 text-sm">Time</p>
                                <p className="text-gray-800 font-semibold">
                                  {formatTimeRange(eventDate.time, eventDate.endTime)}
                                </p>
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
                          <p className="text-gray-800 font-semibold">{formatTime(ticket.time)}</p>
                        </div>
                      </div>

                      <div className="flex gap-4">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-indigo-100">
                          <MapPin size={20} className="text-indigo-500"/>
                        </div>
                        <div>
                          <p className="text-gray-800 text-sm">Location</p>
                          <p className="text-gray-800 font-semibold">{ticket.location}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

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

                {/* Additional Info */}
                <div className="bg-indigo-100 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-800">Organized by</span>
                    <span className="text-gray-800 font-semibold">{ticket.organizer}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-800">Ticket ID</span>
                    <span className="text-gray-800 font-semibold">{ticket.ticket_number.substring(0, 8).toUpperCase()}</span>
                  </div>
                </div>
              </div>

              {/* Right Column - QR Code */}
              <div className="flex flex-col items-center justify-start">
                <div className="w-full max-w-sm aspect-square bg-gray-200 rounded-lg flex items-center justify-center">
                  {/* Placeholder for QR Code */}
                  <div className="text-gray-400 text-center">
                    <p className="text-sm">QR Code</p>
                    <p className="text-xs mt-2">{ticket.ticket_number}</p>
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
  );
}

export default TicketDetailPage;
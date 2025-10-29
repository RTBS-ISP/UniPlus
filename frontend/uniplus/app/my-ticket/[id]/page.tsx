"use client"
import Navbar from "../../components/navbar"
import { Calendar, Clock, MapPin, ArrowLeft, User, Mail, AlertCircle } from "lucide-react"
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
  ticket_id: number;
  qr_code: string;
  event_id: number | null;
  event_title: string;
  event_description: string | null;
  event_image: string | null;
  organizer_name: string | null;
  organizer_id: number | null;
  date: string | null;
  time: string | null;
  location: string | null;
  is_online: boolean;
  event_meeting_link: string | null;
  event_dates: EventDay[];
  approval_status: string;
  purchase_date: string | null;
  checked_in_at: string | null;
  status: string;
}

function TicketDetailPage() {
  const params = useParams();
  // Try both possible param names
  const ticketNumber = (params?.ticketNumber || params?.id) as string;
  
  const [ticket, setTicket] = useState<TicketInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [selectedDateIndex, setSelectedDateIndex] = useState(0);

  useEffect(() => {
    console.log('Params:', params);
    console.log('Ticket number extracted:', ticketNumber);
    if (ticketNumber) {
      fetchTicketDetail();
    } else {
      setError('No ticket number provided');
      setLoading(false);
    }
  }, [ticketNumber]);

  const fetchTicketDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Looking for ticket with number:', ticketNumber);
      
      // Use the new API endpoint
      const response = await fetch('http://localhost:8000/api/user/tickets', {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('User tickets data received:', data);
        console.log('All tickets:', data.tickets);
        
        // Use qr_code field for matching since that's the ticket identifier
        const foundTicket = data.tickets?.find(
          (t: TicketInfo) => t.qr_code === ticketNumber
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
              parsedTicket.event_dates = [];
            }
          } else if (!Array.isArray(foundTicket.event_dates)) {
            parsedTicket.event_dates = [];
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
          
          // Add approval status tag
          if (parsedTicket.approval_status) {
            generatedTags.push(parsedTicket.approval_status.charAt(0).toUpperCase() + parsedTicket.approval_status.slice(1));
          }
          
          setTags(generatedTags);
        } else {
          console.error('No matching ticket found');
          console.log('Available ticket qr_codes:', data.tickets?.map((t: any) => t.qr_code));
          setError(`Ticket not found. Looking for: ${ticketNumber}`);
        }
      } else {
        console.error('API response not ok:', response.status);
        if (response.status === 401) {
          setError('Please log in to view your tickets');
        } else {
          setError(`Failed to load tickets: ${response.status}`);
        }
      }
    } catch (error) {
      console.error('Error fetching ticket:', error);
      setError('Failed to load ticket details');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'TBD';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      return date.toLocaleDateString('en-US', { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
      });
    } catch {
      return dateString || 'TBD';
    }
  };

  const formatTime = (timeString: string | null) => {
    if (!timeString) return 'TBD';
    try {
      // Handle both "HH:MM:SS" and "HH:MM" formats
      const timeParts = timeString.split(':');
      const hours = parseInt(timeParts[0]);
      const minutes = parseInt(timeParts[1]);
      
      const date = new Date();
      date.setHours(hours, minutes);
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
    } catch {
      return timeString;
    }
  };

  const formatTimeRange = (startTime: string | null, endTime?: string | null) => {
    const start = formatTime(startTime);
    if (endTime) {
      const end = formatTime(endTime);
      return `${start} - ${end}`;
    }
    return start;
  };

  // Get current event date based on selection
  const getCurrentEventDate = () => {
    if (!ticket) return null;
    
    if (ticket.event_dates && Array.isArray(ticket.event_dates) && ticket.event_dates.length > 0) {
      return ticket.event_dates[selectedDateIndex];
    }
    
    // Fallback to main ticket date/time
    return {
      date: ticket.date,
      time: ticket.time,
      endTime: null,
      location: ticket.location,
      is_online: ticket.is_online,
      meeting_link: ticket.event_meeting_link
    };
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

  if (error) {
    return (
      <main>
        <Navbar/>
        <div className="min-h-screen bg-indigo-100">
          <div className="max-w-7xl mx-auto px-8 pt-16">
            <Link href="/my-ticket" className="flex items-center gap-2 hover:opacity-80 transition-opacity w-fit">
              <ArrowLeft size={18} className="text-gray-800"/>
              <p className="text-gray-800 font-medium">Back to My Tickets</p>
            </Link>
          </div>
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <div className="text-red-600 text-xl mb-2">Error Loading Ticket</div>
              <div className="text-gray-600 max-w-md">{error}</div>
              <button 
                onClick={fetchTicketDetail}
                className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
              >
                Try Again
              </button>
            </div>
          </div>
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
            <Link href="/my-ticket" className="flex items-center gap-2 hover:opacity-80 transition-opacity w-fit">
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

  const currentEventDate = getCurrentEventDate();

  return (
    <main>
      <Navbar/>
      <div className="min-h-screen bg-indigo-100">
        {/* Back Button */}
        <div className="max-w-7xl mx-auto px-8 pt-16">
          <Link href="/my-ticket" className="flex items-center gap-2 hover:opacity-80 transition-opacity w-fit">
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
                    className={`px-4 py-1.5 text-sm font-semibold rounded-lg ${
                      tag.toLowerCase() === 'approved' 
                        ? 'bg-green-100 text-green-800'
                        : tag.toLowerCase() === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : tag.toLowerCase() === 'rejected'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-indigo-100 text-gray-800'
                    }`}
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
                  
                  {currentEventDate ? (
                    <div className="space-y-4">
                      <div className="flex gap-4">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-indigo-100">
                          <Calendar size={20} className="text-indigo-500"/>
                        </div>
                        <div>
                          <p className="text-gray-800 text-sm">
                            Date {ticket.event_dates && ticket.event_dates.length > 1 ? `(Day ${selectedDateIndex + 1} of ${ticket.event_dates.length})` : ''}
                          </p>
                          <p className="text-gray-800 font-semibold">{formatDate(currentEventDate.date)}</p>
                        </div>
                      </div>

                      <div className="flex gap-4">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-indigo-100">
                          <Clock size={20} className="text-indigo-500"/>
                        </div>
                        <div>
                          <p className="text-gray-800 text-sm">Time</p>
                          <p className="text-gray-800 font-semibold">
                            {formatTimeRange(currentEventDate.time, currentEventDate.endTime)}
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
                            {currentEventDate.is_online ? 'Online Event' : currentEventDate.location || 'TBD'}
                          </p>
                          {currentEventDate.is_online && currentEventDate.meeting_link && (
                            <a 
                              href={currentEventDate.meeting_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-indigo-600 text-sm hover:underline mt-1 inline-block"
                            >
                              Join Meeting →
                            </a>
                          )}
                        </div>
                      </div>
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
                          <p className="text-gray-800 font-semibold">
                            {ticket.is_online ? 'Online Event' : ticket.location || 'TBD'}
                          </p>
                          {ticket.is_online && ticket.event_meeting_link && (
                            <a 
                              href={ticket.event_meeting_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-indigo-600 text-sm hover:underline mt-1 inline-block"
                            >
                              Join Meeting →
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Event Description */}
                {ticket.event_description && (
                  <div>
                    <h2 className="text-gray-800 font-bold text-lg mb-4">DESCRIPTION</h2>
                    <p className="text-gray-800 leading-relaxed">{ticket.event_description}</p>
                  </div>
                )}

                {/* Additional Info */}
                <div className="bg-indigo-100 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-800">Organized by</span>
                    <span className="text-gray-800 font-semibold">{ticket.organizer_name || 'Unknown Organizer'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-800">Ticket ID</span>
                    <span className="text-gray-800 font-semibold">{ticket.qr_code.substring(0, 8).toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-800">Status</span>
                    <span className={`font-semibold ${
                      ticket.approval_status === 'approved' ? 'text-green-600' :
                      ticket.approval_status === 'pending' ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {ticket.approval_status?.charAt(0).toUpperCase() + ticket.approval_status?.slice(1) || 'Unknown'}
                    </span>
                  </div>
                  {ticket.purchase_date && (
                    <div className="flex justify-between">
                      <span className="text-gray-800">Purchased</span>
                      <span className="text-gray-800 font-semibold">{formatDate(ticket.purchase_date)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column - QR Code */}
              <div className="flex flex-col items-center justify-start">
                <div className="w-full max-w-sm aspect-square bg-gray-200 rounded-lg flex items-center justify-center">
                  {/* Placeholder for QR Code */}
                  <div className="text-gray-400 text-center">
                    <p className="text-sm">QR Code</p>
                    <p className="text-xs mt-2">{ticket.qr_code}</p>
                  </div>
                </div>
                <p className="text-center text-gray-800 text-sm mt-4 max-w-sm">
                  Present this QR code at the event entrance for verification
                </p>
                
                {/* Approval Status Notice */}
                {ticket.approval_status !== 'approved' && (
                  <div className={`mt-4 p-3 rounded-lg text-center max-w-sm ${
                    ticket.approval_status === 'pending' 
                      ? 'bg-yellow-50 text-yellow-800 border border-yellow-200'
                      : 'bg-red-50 text-red-800 border border-red-200'
                  }`}>
                    <p className="text-sm font-semibold">
                      {ticket.approval_status === 'pending' 
                        ? '⏳ Ticket Pending Approval' 
                        : '❌ Ticket Not Approved'}
                    </p>
                    <p className="text-xs mt-1">
                      {ticket.approval_status === 'pending'
                        ? 'Your ticket is awaiting organizer approval'
                        : 'This ticket has been rejected by the organizer'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default TicketDetailPage;
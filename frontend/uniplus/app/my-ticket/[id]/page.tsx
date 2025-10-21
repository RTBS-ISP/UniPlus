'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import QRCode from 'qrcode';
import { MapPin, Clock, Calendar, Download, Share2, ArrowLeft, ChevronDown } from 'lucide-react';
import Navbar from '../../components/navbar';

interface EventDay {
  date: string;
  time: string;
  location: string;
  is_online: boolean;
  meeting_link?: string;
}

type Ticket = {
  ticket_number: string;
  event_title: string;
  event_description?: string;
  date: string;
  time: string;
  location: string;
  organizer: string;
  user_information?: {
    name: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  is_online?: boolean;
  event_meeting_link?: string;
  event_image?: string;
  event_dates?: string | EventDay[];
};

export default function TicketPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedDateIndex, setSelectedDateIndex] = useState(0);
  const [availableDates, setAvailableDates] = useState<EventDay[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchTicket();
  }, [id]);

  useEffect(() => {
    if (ticket) {
      parseAndFilterDates();
      generateQRCode();
    }
  }, [ticket, selectedDateIndex]);

  const fetchTicket = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/user', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        const foundTicket = data.tickets?.find((t: any) => t.ticket_number === id);

        if (foundTicket) {
          setTicket(foundTicket);
        } else {
          console.error('Ticket not found with ID:', id);
        }
      } else {
        console.error('Failed to fetch user data:', response.status);
      }
    } catch (error) {
      console.error('Error fetching ticket:', error);
    } finally {
      setLoading(false);
    }
  };

  const parseAndFilterDates = () => {
    if (!ticket) return;

    let dates: EventDay[] = [];

    // Try to parse event_dates if it exists
    if (ticket.event_dates) {
      try {
        const parsed = typeof ticket.event_dates === 'string' 
          ? JSON.parse(ticket.event_dates) 
          : ticket.event_dates;
        
        if (Array.isArray(parsed) && parsed.length > 0) {
          dates = parsed;
        }
      } catch (e) {
        console.error('Error parsing event_dates:', e);
      }
    }

    // If no event_dates or parsing failed, use single date from ticket
    if (dates.length === 0) {
      dates = [{
        date: ticket.date,
        time: ticket.time,
        location: ticket.location,
        is_online: ticket.is_online || false,
        meeting_link: ticket.event_meeting_link,
      }];
    }

    // Filter out past dates, keep only future/today
    const now = new Date();
    const upcomingDates = dates.filter((eventDay) => {
      try {
        const eventDateTime = new Date(`${eventDay.date}T${eventDay.time}:00`);
        return eventDateTime >= now;
      } catch {
        return true;
      }
    });

    // If all dates are past, show all dates
    if (upcomingDates.length === 0) {
      setAvailableDates(dates);
    } else {
      setAvailableDates(upcomingDates);
    }

    // Find closest date
    const closestIndex = dates.findIndex((d) => {
      try {
        const eventDateTime = new Date(`${d.date}T${d.time}:00`);
        return eventDateTime >= now;
      } catch {
        return false;
      }
    });

    setSelectedDateIndex(closestIndex >= 0 ? closestIndex : 0);
  };

  const generateQRCode = async () => {
    if (!ticket) return;

    try {
      const url = await QRCode.toDataURL(ticket.ticket_number, {
        width: 300,
        margin: 2,
      });
      setQrCodeUrl(url);
    } catch (err) {
      console.error('Error generating QR code:', err);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const formatDateShort = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const formatTime = (timeStr: string) => {
    if (!timeStr) return 'TBD';
    if (timeStr.includes(':')) {
      return timeStr.substring(0, 5);
    }
    return timeStr;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-indigo-50">
        <Navbar />
        <div className="flex items-center justify-center h-screen">
          <div className="text-2xl text-gray-600">Loading ticket...</div>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="min-h-screen bg-indigo-50">
        <Navbar />
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="text-2xl text-gray-600 mb-4">Ticket not found</div>
            <button
              onClick={() => router.push('/my-ticket')}
              className="text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Return to My Tickets
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentEventDay = availableDates[selectedDateIndex] || availableDates[0];

  return (
    <div className="min-h-screen bg-indigo-50">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 py-8">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft size={20} />
          <span className="font-medium">Back to My Tickets</span>
        </button>

        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          <div className="relative h-64 overflow-hidden bg-gradient-to-b from-indigo-400 to-indigo-600">
            {ticket.event_image ? (
              <>
                <img
                  src={
                    ticket.event_image.startsWith('http')
                      ? ticket.event_image
                      : `http://localhost:8000${ticket.event_image}`
                  }
                  alt={ticket.event_title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
                <div className="absolute inset-0 bg-black/30"></div>
              </>
            ) : null}

            <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
              <div className="flex items-center justify-between mb-2">
                <div className="bg-indigo-600 px-4 py-2 rounded-xl text-sm font-bold">
                  Event Ticket
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      if (navigator.share) {
                        navigator.share({
                          title: ticket.event_title,
                          text: `Check out my ticket for ${ticket.event_title}`,
                        });
                      }
                    }}
                    className="p-2 bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors"
                  >
                    <Share2 size={20} />
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="p-2 bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors"
                  >
                    <Download size={20} />
                  </button>
                </div>
              </div>
              <h1 className="text-3xl font-bold">{ticket.event_title}</h1>
              <p className="text-white/90 mt-1">{currentEventDay ? formatDate(currentEventDay.date) : 'Date TBD'}</p>
            </div>
          </div>

          {/* Multi-Day Selector */}
          {availableDates.length > 1 && (
            <div className="bg-indigo-50 border-b border-indigo-100 p-4">
              <div className="relative inline-block w-full">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="w-full px-4 py-3 bg-white border border-indigo-300 rounded-xl text-left font-semibold text-gray-900 flex items-center justify-between hover:bg-gray-50 transition"
                >
                  <span>
                    Day {selectedDateIndex + 1}: {formatDateShort(currentEventDay.date)}
                  </span>
                  <ChevronDown
                    size={20}
                    className={`transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {dropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-indigo-300 rounded-xl shadow-lg z-50">
                    {availableDates.map((eventDay, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setSelectedDateIndex(idx);
                          setDropdownOpen(false);
                        }}
                        className={`w-full px-4 py-3 text-left hover:bg-indigo-50 transition ${
                          idx === selectedDateIndex ? 'bg-indigo-100 font-semibold' : ''
                        } ${idx !== 0 ? 'border-t border-gray-200' : ''}`}
                      >
                        <div className="font-semibold text-gray-900">
                          Day {idx + 1}: {formatDateShort(eventDay.date)}
                        </div>
                        <div className="text-sm text-gray-600">
                          {formatDate(eventDay.date)} at {formatTime(eventDay.time)}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex items-center justify-center -my-3 relative z-10">
            <div className="absolute left-0 w-6 h-6 bg-indigo-50 rounded-r-full"></div>
            <div className="flex-1 flex items-center justify-center gap-2">
              {Array.from({ length: 30 }).map((_, i) => (
                <div key={i} className="w-2 h-2 bg-gray-300 rounded-full"></div>
              ))}
            </div>
            <div className="absolute right-0 w-6 h-6 bg-indigo-50 rounded-l-full"></div>
          </div>

          <div className="p-8">
            <div className="grid md:grid-cols-2 gap-8">
              <div className="flex flex-col items-center justify-center">
                <div className="bg-gray-50 p-8 rounded-3xl shadow-lg">
                  {qrCodeUrl ? (
                    <img src={qrCodeUrl} alt="QR Code" className="w-64 h-64" />
                  ) : (
                    <div className="w-64 h-64 bg-gray-200 flex items-center justify-center rounded">
                      <span className="text-gray-500">Generating QR Code...</span>
                    </div>
                  )}
                </div>
                <div className="mt-6 text-center">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">
                    Ticket Number
                  </p>
                  <p className="font-mono font-bold text-xl text-gray-900 break-all">
                    {ticket.ticket_number.substring(0, 12).toUpperCase()}
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Event Details</h2>

                  <div className="space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                        <Clock className="text-indigo-600" size={24} />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Time</p>
                        <p className="font-semibold text-gray-900">
                          {currentEventDay ? formatTime(currentEventDay.time) : 'TBD'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                        <MapPin className="text-indigo-600" size={24} />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Location</p>
                        <p className="font-semibold text-gray-900">
                          {currentEventDay ? (currentEventDay.is_online ? '🌐 Online' : currentEventDay.location || 'TBD') : 'TBD'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                        <Calendar className="text-indigo-600" size={24} />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Organized by</p>
                        <p className="font-semibold text-gray-900">{ticket.organizer}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {ticket.user_information && (
                  <div className="bg-gray-50 rounded-2xl p-6">
                    <h3 className="font-bold text-gray-900 mb-4">Attendee Information</h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Name</p>
                        <p className="font-semibold text-gray-900">
                          {ticket.user_information.name || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Email</p>
                        <p className="font-semibold text-gray-900">
                          {ticket.user_information.email || 'N/A'}
                        </p>
                      </div>
                      {ticket.user_information.phone && (
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Phone</p>
                          <p className="font-semibold text-gray-900">
                            {ticket.user_information.phone}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {currentEventDay && currentEventDay.is_online && currentEventDay.meeting_link && (
                  <div className="bg-indigo-50 rounded-2xl p-6 border-2 border-indigo-200">
                    <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                      Online Event
                    </h3>
                    <a
                      href={currentEventDay.meeting_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700 transition-colors font-semibold"
                    >
                      Join Meeting
                    </a>
                  </div>
                )}
              </div>
            </div>

            {ticket.event_description && (
              <div className="mt-8 pt-8 border-t border-gray-200">
                <h3 className="font-bold text-gray-900 mb-4 text-xl">About This Event</h3>
                <p className="text-gray-700 leading-relaxed">{ticket.event_description}</p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 bg-indigo-100 border border-indigo-200 rounded-2xl p-6">
          <p className="text-sm text-indigo-800">
            <span className="font-bold">Important:</span> Please present this QR code at the event
            entrance for check-in. Screenshot or save this page for offline access.
            {availableDates.length > 1 && ' Select a different date above to see event details for that day.'}
          </p>
        </div>
      </div>
    </div>
  );
}
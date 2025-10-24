'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import QRCode from 'qrcode';
import { MapPin, Clock, Calendar, Download, Share2, ArrowLeft, ChevronDown } from 'lucide-react';
import Navbar from '../../components/navbar';

// ========== Event Day Interface ==========
interface EventDay {
  date: string;
  time?: string;
  start_time?: string;
  endTime?: string;
  end_time?: string;
  location?: string;
  address?: string;
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
  event_dates?: EventDay[];
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
  }, [ticket]);

  useEffect(() => {
    if (ticket && availableDates.length > 0) {
      generateQRCode();
    }
  }, [selectedDateIndex]);

  const fetchTicket = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/user', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        const foundTicket = data.tickets?.find((t: any) => t.ticket_number === id);

        if (foundTicket) {
          console.log('Found ticket:', foundTicket);
          console.log('event_dates:', foundTicket.event_dates);
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

    console.log('=== PARSING event_dates ===');
    console.log('Raw event_dates:', ticket.event_dates);
    console.log('Type:', typeof ticket.event_dates);

    if (ticket.event_dates) {
      try {
        let parsed = ticket.event_dates;
        
        // Handle if it's a string (need to parse)
        if (typeof parsed === 'string') {
          console.log('Parsing string...');
          parsed = JSON.parse(parsed);
        }
        
        // Handle double-encoded JSON
        if (typeof parsed === 'string') {
          console.log('Double-encoded detected, parsing again...');
          parsed = JSON.parse(parsed);
        }
        
        console.log('Parsed result:', parsed);
        console.log('Is array?', Array.isArray(parsed));
        
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Normalize the data - handle both field name variations
          dates = parsed.map((day, idx) => {
            console.log(`Processing day ${idx + 1}:`, day);
            return {
              date: day.date,
              time: day.time || day.start_time || '00:00',
              start_time: day.start_time || day.time || '00:00',
              endTime: day.endTime || day.end_time || '23:59',
              end_time: day.end_time || day.endTime || '23:59',
              location: day.location || day.address || 'TBA',
              address: day.address || day.location || 'TBA',
              is_online: day.is_online || false,
              meeting_link: day.meeting_link || '',
            };
          });

          console.log('Normalized dates:', dates);
        }
      } catch (e) {
        console.error('Error parsing event_dates:', e);
      }
    }

    // Fallback to single date if no event_dates
    if (dates.length === 0) {
      console.log('No event_dates found, using fallback single date');
      dates = [{
        date: ticket.date,
        time: ticket.time,
        start_time: ticket.time,
        location: ticket.location,
        address: ticket.location,
        is_online: ticket.is_online || false,
        meeting_link: ticket.event_meeting_link,
      }];
    }

    console.log(`Total dates available: ${dates.length}`);

    // Don't filter by upcoming - show ALL dates
    setAvailableDates(dates);

    // Select first date by default
    setSelectedDateIndex(0);
  };

  const generateQRCode = async () => {
    if (!ticket) return;

    try {
      // Include selected date info in QR code for multi-day events
      const qrData = availableDates.length > 1 
        ? `${ticket.ticket_number}|${availableDates[selectedDateIndex]?.date || ''}`
        : ticket.ticket_number;
        
      const url = await QRCode.toDataURL(qrData, {
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
        year: 'numeric',
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
  const hasMultipleDates = availableDates.length > 1;

  return (
    <div className="min-h-screen bg-indigo-50">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 py-8">
        <button
          onClick={() => router.push('/my-ticket')}
          className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft size={20} />
          <span className="font-medium">Back to My Tickets</span>
        </button>

        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Header Section */}
          <div className="relative">
            {ticket.event_image && (
              <div className="h-48 overflow-hidden">
                <img
                  src={ticket.event_image.startsWith('http') ? ticket.event_image : `http://localhost:8000${ticket.event_image}`}
                  alt={ticket.event_title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            )}

            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-8">
              <div className="flex items-start justify-between mb-4">
                <div className="inline-flex items-center bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 text-sm font-semibold">
                  Event Ticket
                  {hasMultipleDates && (
                    <span className="ml-2 bg-white/30 px-2 py-0.5 rounded-full text-xs">
                      {availableDates.length} Days
                    </span>
                  )}
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
                    className="p-2 bg-white/20 backdrop-blur-sm rounded-xl hover:bg-white/30 transition-colors"
                  >
                    <Share2 size={20} />
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="p-2 bg-white/20 backdrop-blur-sm rounded-xl hover:bg-white/30 transition-colors"
                  >
                    <Download size={20} />
                  </button>
                </div>
              </div>
              <h1 className="text-3xl font-bold">{ticket.event_title}</h1>
              <p className="text-white/90 mt-1">
                {currentEventDay ? formatDate(currentEventDay.date) : 'Date TBD'}
              </p>
            </div>
          </div>

          {/* ========== MULTI-DAY DATE SELECTOR ========== */}
          {hasMultipleDates && (
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b-2 border-indigo-200 p-6">
              <div className="mb-3">
                <div className="flex items-center gap-2 mb-1">
                  <Calendar size={18} className="text-indigo-600" />
                  <p className="text-sm font-bold text-indigo-900">
                    Select Event Date
                  </p>
                </div>
                <p className="text-xs text-indigo-700">
                  This event has {availableDates.length} dates. Select a date to view specific details.
                </p>
              </div>
              
              <div className="relative inline-block w-full">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="w-full px-5 py-4 bg-white border-2 border-indigo-300 rounded-xl text-left font-semibold text-gray-900 flex items-center justify-between hover:bg-indigo-50 hover:border-indigo-400 transition-all shadow-md"
                >
                  <span className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-indigo-100 rounded-lg text-indigo-600 font-bold text-sm">
                      {selectedDateIndex + 1}
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Day {selectedDateIndex + 1}</div>
                      <div className="font-bold">{formatDateShort(currentEventDay.date)}</div>
                    </div>
                  </span>
                  <ChevronDown
                    size={22}
                    className={`transition-transform duration-200 text-indigo-600 ${dropdownOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {dropdownOpen && (
                  <>
                    {/* Backdrop to close dropdown */}
                    <div 
                      className="fixed inset-0 z-40"
                      onClick={() => setDropdownOpen(false)}
                    />
                    
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-indigo-300 rounded-xl shadow-2xl z-50 overflow-hidden max-h-[400px] overflow-y-auto">
                      {availableDates.map((eventDay, idx) => {
                        const location = eventDay.location || eventDay.address || 'TBA';
                        const time = eventDay.time || eventDay.start_time || '00:00';
                        const endTime = eventDay.endTime || eventDay.end_time;
                        
                        return (
                          <button
                            key={idx}
                            onClick={() => {
                              setSelectedDateIndex(idx);
                              setDropdownOpen(false);
                            }}
                            className={`w-full px-5 py-4 text-left hover:bg-indigo-50 transition-all ${
                              idx === selectedDateIndex 
                                ? 'bg-indigo-100 border-l-4 border-indigo-600' 
                                : 'border-l-4 border-transparent'
                            } ${idx !== 0 ? 'border-t border-gray-200' : ''}`}
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  {idx === selectedDateIndex && (
                                    <div className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse"></div>
                                  )}
                                  <div className={`font-bold ${idx === selectedDateIndex ? 'text-indigo-900' : 'text-gray-900'}`}>
                                    Day {idx + 1}: {formatDate(eventDay.date)}
                                  </div>
                                </div>
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600 mt-2">
                                  <span className="flex items-center gap-1.5">
                                    <Clock size={14} className="text-indigo-600" />
                                    <span className="font-medium">
                                      {formatTime(time)}
                                      {endTime && ` - ${formatTime(endTime)}`}
                                    </span>
                                  </span>
                                  <span className="flex items-center gap-1.5">
                                    <MapPin size={14} className="text-indigo-600" />
                                    <span className="font-medium">
                                      {eventDay.is_online ? '🌐 Online' : location}
                                    </span>
                                  </span>
                                </div>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Decorative separator */}
          <div className="flex items-center justify-center -my-3 relative z-10 bg-white">
            <div className="absolute left-0 w-6 h-6 bg-indigo-50 rounded-r-full"></div>
            <div className="flex-1 flex items-center justify-center gap-2 py-3">
              {Array.from({ length: 30 }).map((_, i) => (
                <div key={i} className="w-2 h-2 bg-gray-300 rounded-full"></div>
              ))}
            </div>
            <div className="absolute right-0 w-6 h-6 bg-indigo-50 rounded-l-full"></div>
          </div>

          {/* Main Content */}
          <div className="p-8">
            <div className="grid md:grid-cols-2 gap-8">
              {/* QR Code Section */}
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
                  {hasMultipleDates && (
                    <div className="mt-3 inline-flex items-center gap-2 bg-indigo-100 text-indigo-800 px-3 py-1.5 rounded-full text-xs font-semibold">
                      <Calendar size={12} />
                      Showing Day {selectedDateIndex + 1} of {availableDates.length}
                    </div>
                  )}
                </div>
              </div>

              {/* Event Details Section */}
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Event Details</h2>

                  <div className="space-y-4">
                    {/* Date */}
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                        <Calendar className="text-indigo-600" size={24} />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Date</p>
                        <p className="font-semibold text-gray-900">
                          {currentEventDay ? formatDate(currentEventDay.date) : 'TBD'}
                        </p>
                      </div>
                    </div>

                    {/* Time */}
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                        <Clock className="text-indigo-600" size={24} />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Time</p>
                        <p className="font-semibold text-gray-900">
                          {currentEventDay ? (
                            <>
                              {formatTime(currentEventDay.time || currentEventDay.start_time || '00:00')}
                              {(currentEventDay.endTime || currentEventDay.end_time) && 
                                ` - ${formatTime(currentEventDay.endTime || currentEventDay.end_time || '')}`
                              }
                            </>
                          ) : 'TBD'}
                        </p>
                      </div>
                    </div>

                    {/* Location */}
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                        <MapPin className="text-indigo-600" size={24} />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Location</p>
                        <p className="font-semibold text-gray-900">
                          {currentEventDay ? (
                            currentEventDay.is_online 
                              ? '🌐 Online Event' 
                              : (currentEventDay.location || currentEventDay.address || 'TBA')
                          ) : 'TBD'}
                        </p>
                      </div>
                    </div>

                    {/* Organizer */}
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                        <div className="text-indigo-600 font-bold text-lg">👤</div>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Organized by</p>
                        <p className="font-semibold text-gray-900">{ticket.organizer}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Attendee Information */}
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

                {/* Online Meeting Link */}
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

            {/* Event Description */}
            {ticket.event_description && (
              <div className="mt-8 pt-8 border-t border-gray-200">
                <h3 className="font-bold text-gray-900 mb-4 text-xl">About This Event</h3>
                <p className="text-gray-700 leading-relaxed">{ticket.event_description}</p>
              </div>
            )}
          </div>
        </div>

        {/* Important Notice */}
        <div className="mt-6 bg-indigo-100 border border-indigo-200 rounded-2xl p-6">
          <p className="text-sm text-indigo-800">
            <span className="font-bold">Important:</span> Please present this QR code at the event
            entrance for check-in. Screenshot or save this page for offline access.
            {hasMultipleDates && (
              <span className="block mt-2">
                📅 <strong>Multi-Day Event:</strong> This event spans {availableDates.length} dates. 
                Use the dropdown above to view details for each specific date and location. 
                Your ticket is valid for all {availableDates.length} days!
              </span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

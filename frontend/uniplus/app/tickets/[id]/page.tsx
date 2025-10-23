'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import QRCode from 'qrcode';
import { MapPin, Clock, Calendar, Download, Share2, ArrowLeft } from 'lucide-react';
import Navbar from '../../components/navbar';

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
};

export default function TicketPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchTicket();
  }, [id]);

  const fetchTicket = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/user', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        
        // Find ticket by ticket_number (which is the QR code)
        const foundTicket = data.tickets?.find((t: any) => t.ticket_number === id);

        if (foundTicket) {
          // Map backend response to ticket type
          const mappedTicket: Ticket = {
            ticket_number: foundTicket.ticket_number,
            event_title: foundTicket.event_title,
            event_description: foundTicket.event_description,
            date: foundTicket.date,
            time: foundTicket.time,
            location: foundTicket.location,
            organizer: foundTicket.organizer,
            user_information: foundTicket.user_information,
            is_online: foundTicket.is_online,
            event_meeting_link: foundTicket.event_meeting_link,
            event_image: foundTicket.event_image,
          };
          
          setTicket(mappedTicket);
          
          // Generate QR code from ticket number
          if (foundTicket.ticket_number) {
            QRCode.toDataURL(foundTicket.ticket_number)
              .then(setQrCodeUrl)
              .catch(err => console.error('QR code generation error:', err));
          }
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

  const formatTime = (timeStr: string) => {
    if (!timeStr) return 'TBD';
    // If it's already formatted like "14:30:00", extract just "14:30"
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
              onClick={() => router.push('/my-tickets')}
              className="text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Return to My Tickets
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-indigo-50">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft size={20} />
          <span className="font-medium">Back to My Tickets</span>
        </button>

        {/* Ticket Card */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Event Image Header */}
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
                    // Fallback to gradient if image fails
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
                      // Share functionality
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
                    onClick={() => {
                      // Download functionality - print to PDF
                      window.print();
                    }}
                    className="p-2 bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors"
                  >
                    <Download size={20} />
                  </button>
                </div>
              </div>
              <h1 className="text-3xl font-bold">{ticket.event_title}</h1>
              <p className="text-white/90 mt-1">{formatDate(ticket.date)}</p>
            </div>
          </div>

          {/* Perforated Line */}
          <div className="flex items-center justify-center -my-3 relative z-10">
            <div className="absolute left-0 w-6 h-6 bg-indigo-50 rounded-r-full"></div>
            <div className="flex-1 flex items-center justify-center gap-2">
              {Array.from({ length: 30 }).map((_, i) => (
                <div key={i} className="w-2 h-2 bg-gray-300 rounded-full"></div>
              ))}
            </div>
            <div className="absolute right-0 w-6 h-6 bg-indigo-50 rounded-l-full"></div>
          </div>

          {/* Main Content */}
          <div className="p-8">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Left Side - QR Code */}
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
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Ticket Number</p>
                  <p className="font-mono font-bold text-xl text-gray-900 break-all">
                    {ticket.ticket_number.substring(0, 12).toUpperCase()}
                  </p>
                </div>
              </div>

              {/* Right Side - Details */}
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Event Details</h2>

                  <div className="space-y-4">
                    {/* Time */}
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                        <Clock className="text-indigo-600" size={24} />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Time</p>
                        <p className="font-semibold text-gray-900">
                          {formatTime(ticket.time)}
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
                        <p className="font-semibold text-gray-900">{ticket.location}</p>
                      </div>
                    </div>

                    {/* Organizer */}
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

                {/* Attendee Info */}
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
                {ticket.is_online && ticket.event_meeting_link && (
                  <div className="bg-indigo-50 rounded-2xl p-6 border-2 border-indigo-200">
                    <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                      Online Event
                    </h3>
                    <a
                      href={ticket.event_meeting_link}
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
          </p>
        </div>
      </div>
    </div>
  );
}
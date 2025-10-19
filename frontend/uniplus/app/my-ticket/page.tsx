'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import QRCode from 'qrcode';
import Navbar from '../components/navbar';

interface TicketData {
  qr_code: string;
  event_title: string;
  event_description: string;
  event_date: string;  
  start_date: string;
  location: string;
  meeting_link?: string;
  is_online: boolean;
  organizer: string;
  user_name: string;
  user_email: string;
}

export default function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [tickets, setTickets] = useState<TicketData[]>([]);
  const [selectedTicketIndex, setSelectedTicketIndex] = useState(0);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchTickets();
  }, [id]);

  useEffect(() => {
    if (tickets.length > 0) {
      generateQRCode(selectedTicketIndex);
    }
  }, [selectedTicketIndex, tickets]);

  const fetchTickets = async () => {
    try {
      // Fetch all tickets for this event by the ticket ID
      // In reality, you'll need to modify your backend to return all tickets for an event
      const response = await fetch(`http://localhost:8000/api/tickets/${id}`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        // If backend returns single ticket, wrap in array
        // If it returns array of tickets for multi-day, use as-is
        setTickets(Array.isArray(data) ? data : [data]);
      } else {
        router.push('/my-ticket');
      }
    } catch (error) {
      console.error('Error fetching ticket:', error);
      router.push('/my-ticket');
    } finally {
      setLoading(false);
    }
  };

  const generateQRCode = async (index: number) => {
    const ticket = tickets[index];
    
    // QR Code data - this is what gets scanned
    const qrData = JSON.stringify({
      ticket_id: ticket.qr_code,
      user_name: ticket.user_name,
      user_email: ticket.user_email,
      event_title: ticket.event_title,
      event_date: ticket.event_date,
      location: ticket.location,
      check_in_time: new Date().toISOString()
    });

    try {
      const url = await QRCode.toDataURL(qrData, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });
      setQrDataUrl(url);
    } catch (err) {
      console.error('Error generating QR code:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
        <Navbar />
        <div className="flex items-center justify-center h-screen">
          <div className="text-xl text-gray-900">Loading ticket...</div>
        </div>
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
        <Navbar />
        <div className="flex items-center justify-center h-screen">
          <div className="text-xl text-gray-900">Ticket not found</div>
        </div>
      </div>
    );
  }

  const currentTicket = tickets[selectedTicketIndex];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <Navbar />

      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* Back Button */}
        <button
          onClick={() => router.push('/my-ticket')}
          className="mb-6 flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-semibold"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to My Tickets
        </button>

        {/* Ticket Card */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-8 text-white">
            <h1 className="text-3xl font-bold mb-2">{currentTicket.event_title}</h1>
            <p className="text-indigo-100">Organized by {currentTicket.organizer}</p>
          </div>

          {/* Date Selector Buttons - NEW */}
          {tickets.length > 1 && (
            <div className="bg-indigo-50 p-6 border-b-2 border-indigo-100">
              <p className="text-sm font-semibold text-gray-700 mb-3 text-center">
                📅 Select Event Date
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {tickets.map((ticket, index) => {
                  const date = new Date(ticket.event_date);
                  const isSelected = index === selectedTicketIndex;
                  
                  return (
                    <button
                      key={index}
                      onClick={() => setSelectedTicketIndex(index)}
                      className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                        isSelected
                          ? 'bg-indigo-600 text-white shadow-lg scale-105'
                          : 'bg-white text-indigo-600 hover:bg-indigo-100 border-2 border-indigo-200'
                      }`}
                    >
                      <div className="text-center">
                        <div className="text-xs opacity-75">Day {index + 1}</div>
                        <div className="text-sm font-bold">
                          {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-gray-600 mt-3 text-center">
                Click a date to view its QR code
              </p>
            </div>
          )}

          {/* QR Code Section */}
          <div className="p-8">
            <div className="bg-gray-50 rounded-2xl p-6 mb-6">
              <h2 className="text-xl font-bold text-center mb-4 text-gray-900">
                Your Ticket QR Code
              </h2>
              <div className="bg-white p-6 rounded-xl flex justify-center border-4 border-indigo-200">
                {qrDataUrl ? (
                  <img src={qrDataUrl} alt="QR Code" className="w-64 h-64" />
                ) : (
                  <div className="w-64 h-64 flex items-center justify-center text-gray-400">
                    Loading QR Code...
                  </div>
                )}
              </div>
              <p className="text-center text-sm text-gray-600 mt-4">
                Show this QR code at the event entrance
              </p>
            </div>

            {/* Ticket Details */}
            <div className="space-y-4">
              <div className="bg-indigo-50 rounded-xl p-4">
                <p className="text-xs text-gray-600 uppercase tracking-wide mb-1">Event Date</p>
                <p className="font-bold text-lg text-gray-900">
                  {new Date(currentTicket.event_date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>

              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs text-gray-600 uppercase tracking-wide mb-1">Ticket Number</p>
                <p className="font-mono font-bold text-sm text-gray-900 break-all">
                  {currentTicket.qr_code}
                </p>
              </div>

              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs text-gray-600 uppercase tracking-wide mb-1">Attendee</p>
                <p className="font-bold text-gray-900">{currentTicket.user_name}</p>
                <p className="text-sm text-gray-600">{currentTicket.user_email}</p>
              </div>

              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs text-gray-600 uppercase tracking-wide mb-1">Location</p>
                <p className="font-bold text-gray-900">
                  {currentTicket.is_online ? '🌐 Online Event' : currentTicket.location}
                </p>
                {currentTicket.is_online && currentTicket.meeting_link && (
                  <a
                    href={currentTicket.meeting_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-indigo-600 hover:text-indigo-700 hover:underline mt-1 inline-block"
                  >
                    Join Meeting →
                  </a>
                )}
              </div>
            </div>

            {/* Important Notice */}
            <div className="mt-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-r-xl">
              <p className="text-sm text-yellow-800">
                <strong>Important:</strong> This QR code is unique to you and this specific date. Do not share it with others.
                {tickets.length > 1 && ' You have separate QR codes for each day of this multi-day event.'}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 grid grid-cols-2 gap-4">
              <button
                onClick={() => window.print()}
                className="py-3 px-4 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition font-semibold"
              >
                🖨️ Print
              </button>
              <button
                onClick={() => {
                  // Download QR code
                  const link = document.createElement('a');
                  link.download = `ticket-${currentTicket.event_title}-${currentTicket.event_date}.png`;
                  link.href = qrDataUrl;
                  link.click();
                }}
                className="py-3 px-4 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition font-semibold"
              >
                💾 Download QR
              </button>
            </div>
          </div>
        </div>

        {/* Event Description */}
        {currentTicket.event_description && (
          <div className="mt-6 bg-white rounded-2xl shadow-lg p-6">
            <h3 className="font-bold text-xl mb-3 text-gray-900">About This Event</h3>
            <p className="text-gray-700 whitespace-pre-line">{currentTicket.event_description}</p>
          </div>
        )}
      </div>
    </div>
  );
}
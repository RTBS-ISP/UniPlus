'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../components/navbar';
import { Calendar, Clock, MapPin, AlertCircle } from 'lucide-react';

/* ---------- Utility Functions ---------- */
function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return 'TBD';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function formatTime(timeStr: string) {
  if (!timeStr) return 'TBD';
  if (timeStr.includes(':')) {
    return timeStr.substring(0, 5);
  }
  return timeStr;
}

/* ---------- Types ---------- */
interface Ticket {
  ticket_id: number;
  ticket_qr: string;
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
  event_dates: Array<{
    date: string;
    time: string;
    endTime?: string;
    location: string;
    is_online: boolean;
    meeting_link: string | null;
  }>;
  approval_status: string;
  purchase_date: string | null;
  checked_in_at: string | null;
  status: string;
}

interface TicketsResponse {
  tickets: Ticket[];
  total_count: number;
  pending_count: number;
  approved_count: number;
  rejected_count: number;
}

/* ---------- Main Page ---------- */
export default function MyTicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ticketStats, setTicketStats] = useState({
    total_count: 0,
    pending_count: 0,
    approved_count: 0,
    rejected_count: 0
  });
  const router = useRouter();

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('http://localhost:8000/api/user/tickets', {
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 401) {
          router.push('/login');
          return;
        }
        throw new Error(`Failed to fetch tickets: ${response.status}`);
      }

      const data: TicketsResponse = await response.json();
      
      // DEBUG: Log the API response
      console.log('=== MY TICKETS PAGE DEBUG ===');
      console.log('Full API Response:', data);
      console.log('Tickets from API:', data.tickets);
      
      if (data.tickets && Array.isArray(data.tickets)) {
        console.log('Total tickets received:', data.tickets.length);
        console.log('Ticket statistics:', {
          total: data.total_count,
          pending: data.pending_count,
          approved: data.approved_count,
          rejected: data.rejected_count
        });
        
        // Log each ticket's details
        data.tickets.forEach((ticket: Ticket, idx: number) => {
          console.log(`Ticket ${idx + 1}:`, {
            title: ticket.event_title,
            ticket_qr: ticket.ticket_qr,
            approval_status: ticket.approval_status,
            date: ticket.date,
            time: ticket.time,
            organizer: ticket.organizer_name,
          });
        });

        // Set ticket statistics
        setTicketStats({
          total_count: data.total_count,
          pending_count: data.pending_count,
          approved_count: data.approved_count,
          rejected_count: data.rejected_count
        });

        // FILTER: Only show approved tickets
        // If you want to show ALL tickets (including pending), remove the filter below
        const approvedTickets = data.tickets.filter(
          (ticket: Ticket) => ticket.approval_status === 'approved'
        );
        
        console.log('Approved tickets:', approvedTickets.length);
        console.log('Pending/rejected tickets:', data.tickets.length - approvedTickets.length);
        
        // OPTION 1: Show only approved tickets (uncomment line below)
        setTickets(approvedTickets);
        
        // OPTION 2: Show all tickets regardless of approval status (uncomment line below)
        // setTickets(data.tickets);
        
      } else {
        console.log('No tickets array found in response');
        setTickets([]);
      }
    } catch (err) {
      console.error('Error fetching tickets:', err);
      setError(err instanceof Error ? err.message : 'Failed to load tickets');
    } finally {
      setLoading(false);
    }
  };

  const isUpcoming = (dateStr: string | null | undefined) => {
    if (!dateStr) return false;
    try {
      const eventDate = new Date(dateStr);
      if (isNaN(eventDate.getTime())) return false;
      const now = new Date();
      // Set time to end of day for the event to consider it upcoming until the day ends
      eventDate.setHours(23, 59, 59, 999);
      return eventDate >= now;
    } catch {
      return false;
    }
  };

  const upcomingTickets = tickets.filter((t) => isUpcoming(t.date));
  const pastTickets = tickets.filter((t) => !isUpcoming(t.date));

  if (loading) {
    return (
      <div className="min-h-screen bg-[#E8ECFF]">
        <Navbar />
        <div className="flex items-center justify-center h-screen">
          <div className="text-xl text-gray-900">Loading tickets...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#E8ECFF]">
      <Navbar />

      <main className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="text-4xl font-extrabold tracking-tight text-[#0B1220] mb-2">
          My Tickets
        </h1>
        
        {/* Ticket Statistics */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="bg-white rounded-lg px-4 py-2 shadow-sm">
            <div className="text-sm text-gray-500">Total</div>
            <div className="text-lg font-bold text-gray-900">{ticketStats.total_count}</div>
          </div>
          <div className="bg-yellow-50 rounded-lg px-4 py-2 shadow-sm">
            <div className="text-sm text-yellow-600">Pending</div>
            <div className="text-lg font-bold text-yellow-700">{ticketStats.pending_count}</div>
          </div>
          <div className="bg-green-50 rounded-lg px-4 py-2 shadow-sm">
            <div className="text-sm text-green-600">Approved</div>
            <div className="text-lg font-bold text-green-700">{ticketStats.approved_count}</div>
          </div>
          <div className="bg-red-50 rounded-lg px-4 py-2 shadow-sm">
            <div className="text-sm text-red-600">Rejected</div>
            <div className="text-lg font-bold text-red-700">{ticketStats.rejected_count}</div>
          </div>
        </div>


        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-red-900">Error</p>
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        {tickets.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl shadow-sm">
            <div className="mb-4 text-6xl">🎫</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No Tickets Yet</h2>
            <p className="text-gray-600 mb-6">
              Your registered tickets will appear here once they are approved by the event organizer
            </p>
            <button
              onClick={() => router.push('/events')}
              className="inline-block px-6 py-3 bg-[#6366F1] text-white font-semibold rounded-xl hover:bg-[#4F46E5] transition"
            >
              Browse Events
            </button>
          </div>
        ) : (
          <>
            {upcomingTickets.length > 0 && (
              <section className="mb-12">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-1 h-8 bg-[#6366F1] rounded-full"></div>
                  <h2 className="text-2xl font-bold text-[#0B1220]">
                    Upcoming Events ({upcomingTickets.length})
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {upcomingTickets.map((ticket, idx) => (
                    <TicketCard
                      key={`upcoming-${ticket.ticket_id}`}
                      ticket={ticket}
                      onClick={() => router.push(`/my-ticket/${ticket.ticket_id}`)}
                    />
                  ))}
                </div>
              </section>
            )}

            {pastTickets.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-1 h-8 bg-gray-400 rounded-full"></div>
                  <h2 className="text-2xl font-bold text-[#0B1220]">
                    Past Events ({pastTickets.length})
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {pastTickets.map((ticket, idx) => (
                    <TicketCard
                      key={`past-${ticket.ticket_id}`}
                      ticket={ticket}
                      onClick={() => router.push(`/my-ticket/${ticket.ticket_id}`)}
                      isPast
                    />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>

      <footer className="border-t border-black/10 bg-white/60 py-10 mt-12">
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-xs text-gray-500">
            © {new Date().getFullYear()} UniPLUS
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ---------- TicketCard Component ---------- */
interface TicketCardProps {
  ticket: Ticket;
  onClick: () => void;
  isPast?: boolean;
}

function TicketCard({ ticket, onClick, isPast = false }: TicketCardProps) {
  return (
    <div
      onClick={onClick}
      className={`rounded-2xl shadow-sm overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1 cursor-pointer ${
        isPast ? 'bg-gray-100 opacity-75' : 'bg-white'
      }`}
    >
      <div
        className={`p-4 text-white ${
          isPast
            ? 'bg-gradient-to-r from-gray-400 to-gray-500'
            : 'bg-gradient-to-r from-[#6366F1] to-[#4F46E5]'
        }`}
      >
        <h3 className="font-bold text-lg truncate">{ticket.event_title}</h3>
        <p className="text-sm opacity-90">
          {isPast ? 'Past Event' : 'Upcoming Event'}
        </p>
      </div>

      <div className="p-4 space-y-3">
        {/* Date */}
        <div className="flex items-start gap-3">
          <Calendar className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Date</p>
            <p className="font-semibold text-gray-900">{formatDate(ticket.date)}</p>
          </div>
        </div>

        {/* Time */}
        <div className="flex items-start gap-3">
          <Clock className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Time</p>
            <p className="font-semibold text-gray-900">{formatTime(ticket.time || '')}</p>
          </div>
        </div>

        {/* Location */}
        <div className="flex items-start gap-3">
          <MapPin className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Location</p>
            <p className="font-semibold text-gray-900">
              {ticket.is_online ? '🌐 Online' : ticket.location || 'TBD'}
            </p>
          </div>
        </div>

        <div className="pt-2 border-t border-gray-200">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Organized by</p>
          <p className="font-semibold text-gray-900">{ticket.organizer_name || 'Unknown Organizer'}</p>
        </div>
      </div>

      <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
        <button className="w-full text-center text-sm font-semibold text-[#6366F1] hover:text-[#4F46E5]">
          View Ticket →
        </button>
      </div>
    </div>
  );
}
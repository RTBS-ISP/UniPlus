'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, MapPin, Clock, Search, Ticket } from 'lucide-react';
import Navbar from '../components/navbar';

interface TicketData {
  ticket_number: string;
  event_title: string;
  event_description: string;
  event_date: string;
  time: string;
  location: string;
  organizer: string;
  is_online: boolean;
  event_meeting_link?: string;
  event_id: number;
}

export default function MyTicketsPage() {
  const [tickets, setTickets] = useState<TicketData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'upcoming' | 'past'>('upcoming');
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/user', {
        credentials: 'include',
      });

      if (!response.ok) {
        router.push('/login');
        return;
      }

      const data = await response.json();
      setTickets(data.tickets || []);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  // FIXED: Use event date + time to determine if event is past
  const categorizedTickets = tickets.map(ticket => {
    // Combine date and time to get the actual event datetime
    const eventDateTime = new Date(`${ticket.event_date}T${ticket.time || '00:00:00'}`);
    const now = new Date();
    
    // Event is past only if the event datetime has already occurred
    const isPast = eventDateTime < now;
    
    return { ...ticket, status: isPast ? 'past' : 'upcoming' };
  });

  const filteredTickets = categorizedTickets.filter(ticket => {
    const matchesFilter = activeFilter === 'all' || ticket.status === activeFilter;
    const matchesSearch = ticket.event_title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const upcomingCount = categorizedTickets.filter(t => t.status === 'upcoming').length;
  const pastCount = categorizedTickets.filter(t => t.status === 'past').length;

  const formatShortDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const month = date.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    const day = date.getDate();
    return `${month}\n${day}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-indigo-50">
        <Navbar />
        <div className="flex items-center justify-center h-screen">
          <div className="text-2xl text-gray-600">Loading your tickets...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-indigo-50">
      <Navbar />

      {/* Header */}
      <div className="bg-indigo-600 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-16 h-16 bg-white/20 rounded-3xl flex items-center justify-center">
                <Ticket size={32} />
              </div>
              <div>
                <h1 className="text-4xl sm:text-5xl font-bold">My Tickets</h1>
                <p className="text-indigo-100 mt-1">Your personal event collection</p>
              </div>
            </div>

            {/* Stats */}
            <div className="flex gap-3">
              <div className="bg-white/20 rounded-2xl px-6 py-4 border border-white/30">
                <p className="text-indigo-100 text-xs uppercase tracking-wide mb-1">Upcoming</p>
                <p className="text-3xl font-bold">{upcomingCount}</p>
              </div>
              <div className="bg-white/20 rounded-2xl px-6 py-4 border border-white/30">
                <p className="text-indigo-100 text-xs uppercase tracking-wide mb-1">Past</p>
                <p className="text-3xl font-bold">{pastCount}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8">
        <div className="bg-white rounded-3xl shadow-2xl p-6 border border-gray-100">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
              />
            </div>

            {/* Filter Buttons */}
            <div className="flex gap-2 bg-gray-100 p-1.5 rounded-2xl">
              {['all', 'upcoming', 'past'].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter as 'all' | 'upcoming' | 'past')}
                  className={`px-6 py-2.5 rounded-xl font-semibold transition-all ${
                    activeFilter === filter
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-gray-600 hover:text-indigo-700'
                  }`}
                >
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Ticket List */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {filteredTickets.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Ticket className="text-gray-400" size={48} />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No tickets found</h3>
            <p className="text-gray-600 mb-6">
              {tickets.length === 0
                ? "You haven't registered for any events yet"
                : 'Try adjusting your search or filters'}
            </p>
            <a
              href="/events"
              className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700 transition-colors font-semibold"
            >
              Browse Events
            </a>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTickets.map((ticket) => (
              <div key={ticket.ticket_number} className="group cursor-pointer">
                <div className="relative bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden">
                  {/* Header */}
                  <div className="bg-indigo-600 p-6 text-white relative">
                    <h3 className="font-bold text-xl leading-tight mb-4">
                      {ticket.event_title}
                    </h3>
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 rounded-2xl border-2 border-white/40">
                      <div className="text-center leading-tight">
                        {formatShortDate(ticket.event_date).split('\n').map((line, i) => (
                          <div
                            key={i}
                            className={i === 0 ? 'text-xs font-bold' : 'text-2xl font-bold'}
                          >
                            {line}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="p-6">
                    <div className="space-y-3 mb-6">
                      <div className="flex items-center gap-3 text-gray-700">
                        <Clock size={16} className="text-indigo-600" />
                        <span className="text-sm font-medium">{ticket.time}</span>
                      </div>
                      <div className="flex items-start gap-3 text-gray-700">
                        <MapPin size={16} className="text-indigo-600 mt-0.5" />
                        <span className="text-sm font-medium line-clamp-2">
                          {ticket.location}
                        </span>
                      </div>
                    </div>

                    {/* Ticket Number */}
                    <div className="bg-gray-50 rounded-2xl p-4 mb-4">
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                        Ticket Number
                      </p>
                      <p className="font-mono font-bold text-lg text-gray-900">
                        {ticket.ticket_number.slice(0, 8).toUpperCase()}
                      </p>
                    </div>

                    {/* View Button */}
                    <button
                      onClick={() => router.push(`/tickets/${ticket.ticket_number}`)}
                      className="w-full bg-indigo-600 text-white py-3 rounded-xl hover:bg-indigo-700 transition-all font-semibold shadow-lg hover:shadow-xl group-hover:scale-[1.02]"
                    >
                      View Full Ticket
                    </button>
                  </div>

                  {/* Past Overlay */}
                  {ticket.status === 'past' && (
                    <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                      <div className="bg-gray-900 text-white px-6 py-3 rounded-xl font-bold shadow-2xl">
                        Event Ended
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
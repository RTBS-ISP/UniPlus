"use client"
import Navbar from "../components/navbar"
import TicketCard from "../components/mytickets/TicketCard";
import { useState, useEffect } from "react"

interface EventDate {
  date: string;
  time: string;
  endTime?: string;
  location: string;
  is_online: boolean;
  meeting_link?: string;
}

interface UserInformation {
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

interface Ticket {
  date: string;
  time: string;
  location: string;
  organizer: string;
  user_information: UserInformation;
  event_title: string;
  event_description: string;
  ticket_number: string;
  event_id: number;
  is_online: boolean;
  event_meeting_link?: string;
  event_image?: string;
  event_dates: EventDate[];
}

function MyTicketPage() {
  const [activeFilter, setActiveFilter] = useState("all");
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch user data including tickets
  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/user', {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch tickets');
        }

        const data = await response.json();
        setTickets(data.tickets || []);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        setLoading(false);
      }
    };

    fetchTickets();
  }, []);

  // Filter tickets based on activeFilter and searchQuery
  useEffect(() => {
    let filtered = tickets;

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(ticket =>
        ticket.event_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.event_description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.location.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply time-based filter
    const now = new Date();
    
    if (activeFilter === "present") {
      // Upcoming events
      filtered = filtered.filter(ticket => {
        const eventDate = new Date(ticket.date);
        return eventDate >= now;
      });
    } else if (activeFilter === "pending") {
      // Past events
      filtered = filtered.filter(ticket => {
        const eventDate = new Date(ticket.date);
        return eventDate < now;
      });
    }

    setFilteredTickets(filtered);
  }, [tickets, activeFilter, searchQuery]);

  // Count tickets by status
  const upcomingCount = tickets.filter(ticket => {
    const eventDate = new Date(ticket.date);
    return eventDate >= new Date();
  }).length;

  const pastCount = tickets.filter(ticket => {
    const eventDate = new Date(ticket.date);
    return eventDate < new Date();
  }).length;

  if (loading) {
    return (
      <main>
        <Navbar />
        <div className="min-h-screen bg-indigo-100 flex items-center justify-center">
          <div className="text-gray-800 text-xl">Loading tickets...</div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main>
        <Navbar />
        <div className="min-h-screen bg-indigo-100 flex items-center justify-center">
          <div className="text-red-600 text-xl">Error: {error}</div>
        </div>
      </main>
    );
  }

  return (
    <main>
      <Navbar />
      <div className="min-h-screen bg-indigo-100">
        {/* Header */}
        <div className="flex flex-col gap-y-5 max-w-7xl mx-auto px-8 py-8">
          <h1 className="text-gray-800 text-5xl font-extrabold pt-10">My Tickets</h1>
          <p className="text-gray-800 font-medium">Your personal event collection</p>
        </div>

        {/* Search & Filter Section */}
        <div className="max-w-7xl mx-auto px-8 py-2">
          <div className="rounded-lg shadow-sm p-8 mb-8 bg-white">
            <input
              type="text"
              placeholder="Search your tickets.."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-4 py-3 w-full rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition text-gray-800 placeholder-gray-400"
            />
            <div className="flex mt-4 gap-2">
              <button
                onClick={() => setActiveFilter("all")}
                className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
                  activeFilter === "all"
                    ? "bg-indigo-500 text-white"
                    : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                }`}
              >
                All ({tickets.length})
              </button>
              <button
                onClick={() => setActiveFilter("present")}
                className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
                  activeFilter === "present"
                    ? "bg-indigo-500 text-white"
                    : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                }`}
              >
                Upcoming ({upcomingCount})
              </button>
              <button
                onClick={() => setActiveFilter("pending")}
                className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
                  activeFilter === "pending"
                    ? "bg-indigo-500 text-white"
                    : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                }`}
              >
                Past ({pastCount})
              </button>
            </div>
          </div>
        </div>

        {/* Tickets Display */}
        <div className="max-w-7xl mx-auto px-8 py-2 pb-12">
          {filteredTickets.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <p className="text-gray-500 text-lg">
                {searchQuery ? "No tickets found matching your search." : "You don't have any tickets yet."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTickets.map((ticket) => (
                    <TicketCard key={ticket.ticket_number} ticket={ticket} />
                ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
export default MyTicketPage
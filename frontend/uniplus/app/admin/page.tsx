"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Calendar, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Search,
  User
} from "lucide-react";

// Add the Navbar component import - adjust the path based on your project structure
import Navbar from "../components/navbar";

interface Event {
  id: number;
  title: string;
  event_title: string;
  event_description: string;
  event_create_date: string;
  organizer_name: string;
  organizer_id: number;
  status_registration: string;
  verification_status: string; // This should be "approved", "rejected", or "pending"
}

interface Statistics {
  total_events: number;
  approved_events: number;
  pending_events: number;
  rejected_events: number;
}

export default function AdminPage() {
  const router = useRouter();
  const [allEvents, setAllEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userRole, setUserRole] = useState<string>("");
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Check user role and permissions
  useEffect(() => {
    checkUserRole();
  }, []);

  // Fetch data when component mounts
  useEffect(() => {
    if (userRole === "admin") {
      fetchData();
    }
  }, [userRole]);

  // Filter events when search or filters change
  useEffect(() => {
    filterEvents();
  }, [allEvents, searchQuery, statusFilter]);

  const checkUserRole = async () => {
    try {
      const response = await fetch("http://localhost:8000/api/user", {
        credentials: "include",
      });

      if (!response.ok) {
        router.push("/login");
        return;
      }

      const userData = await response.json();
      
      if (userData.role !== "admin") {
        setError("Access denied. Admin privileges required.");
        setUserRole("user");
      } else {
        setUserRole("admin");
      }
    } catch (err) {
      console.error("Error checking user role:", err);
      setError("Failed to verify user permissions");
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch statistics and events in parallel for better performance
      const [statsResponse, eventsResponse] = await Promise.all([
        fetch("http://localhost:8000/api/admin/statistics", {
          credentials: "include",
        }),
        fetch("http://localhost:8000/api/admin/events", { // Use the new admin events endpoint
          credentials: "include",
        })
      ]);

      if (!statsResponse.ok) {
        throw new Error("Failed to fetch statistics");
      }

      if (!eventsResponse.ok) {
        // Fallback to regular events endpoint if admin endpoint doesn't exist yet
        console.log("Admin events endpoint not available, falling back to regular events");
        const fallbackResponse = await fetch("http://localhost:8000/api/events", {
          credentials: "include",
        });
        
        if (!fallbackResponse.ok) {
          throw new Error("Failed to fetch events");
        }
        
        const eventsData = await fallbackResponse.json();
        setAllEvents(eventsData);
      } else {
        const eventsData = await eventsResponse.json();
        setAllEvents(eventsData);
      }

      const statsData = await statsResponse.json();
      setStatistics(statsData);
      
    } catch (err: any) {
      console.error("Error fetching data:", err);
      setError(err.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const refreshStatistics = async () => {
    try {
      const response = await fetch("http://localhost:8000/api/admin/statistics", {
        credentials: "include",
      });

      if (response.ok) {
        const statsData = await response.json();
        setStatistics(statsData);
      }
    } catch (err) {
      console.error("Error refreshing statistics:", err);
    }
  };

  const filterEvents = () => {
    let filtered = [...allEvents];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(event =>
        event.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.event_title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.organizer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.event_description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(event => {
        if (statusFilter === "approved") {
          return event.verification_status === "approved";
        } else if (statusFilter === "pending") {
          return event.verification_status !== "approved" && event.verification_status !== "rejected";
        } else if (statusFilter === "rejected") {
          return event.verification_status === "rejected";
        }
        return true;
      });
    }

    setFilteredEvents(filtered);
  };

  const getVerificationStatus = (event: Event) => {
    const verificationStatus = event.verification_status;
    
    if (verificationStatus === "approved") {
      return {
        text: "Approved",
        color: "bg-lime-500 text-white",
        icon: <CheckCircle className="w-4 h-4" />
      };
    } else if (verificationStatus === "rejected") {
      return {
        text: "Rejected",
        color: "bg-red-400 text-white",
        icon: <XCircle className="w-4 h-4" />
      };
    } else {
      // Everything else is pending (null, undefined, empty string, etc.)
      return {
        text: "Pending",
        color: "bg-yellow-400 text-white",
        icon: <Clock className="w-4 h-4" />
      };
    }
  };

  // Get CSRF token helper function
  const getCSRFToken = async () => {
    try {
      const response = await fetch("http://localhost:8000/api/set-csrf-token", {
        credentials: "include",
      });
      const data = await response.json();
      return data.csrftoken;
    } catch (error) {
      console.error("Error getting CSRF token:", error);
      return null;
    }
  };

  // Verify event function
  const handleVerifyEvent = async (eventId: number) => {
    try {
      setActionLoading(eventId);
      
      const csrfToken = await getCSRFToken();
      if (!csrfToken) {
        alert("Failed to get CSRF token");
        return;
      }

      const response = await fetch(`http://localhost:8000/api/events/${eventId}/verify`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": csrfToken,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to verify event");
      }

      const result = await response.json();
      
      // Update local state and refresh statistics
      setAllEvents(prev => 
        prev.map(event => 
          event.id === eventId 
            ? { ...event, verification_status: "approved" }
            : event
        )
      );

      // Refresh statistics from API to ensure accuracy
      await refreshStatistics();

      alert("Event approved successfully!");
    } catch (err: any) {
      console.error("Error verifying event:", err);
      alert(`Failed to approve event: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  // Reject event function
  const handleRejectEvent = async (eventId: number) => {
    try {
      setActionLoading(eventId);
      
      const csrfToken = await getCSRFToken();
      if (!csrfToken) {
        alert("Failed to get CSRF token");
        return;
      }

      const response = await fetch(`http://localhost:8000/api/events/${eventId}/reject`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": csrfToken,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to reject event");
      }

      const result = await response.json();
      
      // Update local state and refresh statistics
      setAllEvents(prev => 
        prev.map(event => 
          event.id === eventId 
            ? { ...event, verification_status: "rejected" }
            : event
        )
      );

      // Refresh statistics from API to ensure accuracy
      await refreshStatistics();

      alert("Event rejected successfully!");
    } catch (err: any) {
      console.error("Error rejecting event:", err);
      alert(`Failed to reject event: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  // Show access denied for non-admin users
  if (userRole && userRole !== "admin") {
    return (
      <div className="min-h-screen bg-indigo-100 flex items-center justify-center">
        <Navbar /> {/* Add Navbar here too */}
        <div className="text-center">
          <div className="text-2xl text-red-600 mb-4">Access Denied</div>
          <div className="text-gray-600 mb-4">{error}</div>
          <button
            onClick={() => router.push("/")}
            className="px-6 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-indigo-100">
        <Navbar /> {/* Add Navbar here too */}
        <div className="flex items-center justify-center h-screen">
          <div className="text-2xl text-gray-600">Loading admin dashboard...</div>
        </div>
      </div>
    );
  }

  if (error && !allEvents.length) {
    return (
      <div className="min-h-screen bg-indigo-100">
        <Navbar /> {/* Add Navbar here too */}
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="text-2xl text-red-600 mb-4">{error}</div>
            <button
              onClick={fetchData}
              className="px-6 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-indigo-100">
      <Navbar /> {/* Add Navbar at the top */}
      
      <div className="max-w-7xl mx-auto px-8 py-8">
        <div className="flex flex-col items-start gap-y-4">
          <h1 className="text-gray-800 text-5xl font-extrabold pt-10">Admin Dashboard</h1>
          <div className="text-gray-800 font-medium">
          </div>

          {/* Statistics Cards */}
          {statistics && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
              {/* Total Events */}
              <div className="bg-white rounded-xl p-6 shadow-md">
                <div className="flex items-center gap-3">
                  <Calendar className="text-indigo-500" size={32} />
                  <div>
                    <p className="text-gray-500 text-sm font-medium">Total Events</p>
                    <p className="text-3xl font-bold text-gray-800">{statistics.total_events}</p>
                  </div>
                </div>
              </div>

              {/* Approved Events */}
              <div className="bg-white rounded-xl p-6 shadow-md">
                <div className="flex items-center gap-3">
                  <CheckCircle className="text-lime-500" size={32} />
                  <div>
                    <p className="text-gray-500 text-sm font-medium">Approved</p>
                    <p className="text-3xl font-bold text-gray-800">{statistics.approved_events}</p>
                  </div>
                </div>
              </div>

              {/* Pending Events */}
              <div className="bg-white rounded-xl p-6 shadow-md">
                <div className="flex items-center gap-3">
                  <Clock className="text-yellow-400" size={32} />
                  <div>
                    <p className="text-gray-500 text-sm font-medium">Pending</p>
                    <p className="text-3xl font-bold text-gray-800">{statistics.pending_events}</p>
                  </div>
                </div>
              </div>

              {/* Rejected Events */}
              <div className="bg-white rounded-xl p-6 shadow-md">
                <div className="flex items-center gap-3">
                  <XCircle className="text-red-400" size={32} />
                  <div>
                    <p className="text-gray-500 text-sm font-medium">Rejected</p>
                    <p className="text-3xl font-bold text-gray-800">{statistics.rejected_events}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Events Table Section */}
          <div className="w-full bg-white rounded-2xl p-8 shadow-md mt-6">
            <div className="flex justify-between items-center mb-4">
              <div className="text-gray-800 text-2xl font-bold">
                Events Management
              </div>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by event name, organizer, or description....."
                    className="px-4 py-2 w-80 rounded-xl bg-white border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition text-gray-800 placeholder-gray-400"
                  />
                </div>
                <button
                  onClick={fetchData}
                  className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
                >
                  Refresh
                </button>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-row gap-2 mb-4">
              <button
                onClick={() => setStatusFilter("all")}
                className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
                  statusFilter === "all"
                    ? "bg-indigo-500 text-white"
                    : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                }`}
              >
                All ({allEvents.length})
              </button>
              <button
                onClick={() => setStatusFilter("approved")}
                className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
                  statusFilter === "approved"
                    ? "bg-lime-500 text-white"
                    : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                }`}
              >
                Approved ({statistics?.approved_events || 0})
              </button>
              <button
                onClick={() => setStatusFilter("pending")}
                className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
                  statusFilter === "pending"
                    ? "bg-yellow-400 text-white"
                    : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                }`}
              >
                Pending ({statistics?.pending_events || 0})
              </button>
              <button
                onClick={() => setStatusFilter("rejected")}
                className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
                  statusFilter === "rejected"
                    ? "bg-red-400 text-white"
                    : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                }`}
              >
                Rejected ({statistics?.rejected_events || 0})
              </button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="w-full">
                <thead>
                  <tr className="bg-indigo-500 text-white">
                    <th className="px-6 py-3 text-left font-bold text-sm">EVENT ID</th>
                    <th className="px-6 py-3 text-left font-bold text-sm">EVENT NAME</th>
                    <th className="px-6 py-3 text-left font-bold text-sm">ORGANIZER</th>
                    <th className="px-6 py-3 text-center font-bold text-sm">STATUS</th>
                    <th className="px-6 py-3 text-center font-bold text-sm">CREATED DATE</th>
                    <th className="px-6 py-3 text-center font-bold text-sm">APPROVAL</th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {filteredEvents.length > 0 ? (
                    filteredEvents.map((event) => {
                      const verificationStatus = getVerificationStatus(event);
                      const isActionLoading = actionLoading === event.id;
                      
                      return (
                        <tr key={event.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                          {/* EVENT ID */}
                          <td className="px-6 py-4">
                            <div className="text-gray-800 font-mono font-medium">
                              #{event.id}
                            </div>
                          </td>
                          
                          {/* EVENT NAME */}
                          <td className="px-6 py-4">
                            <div className="text-gray-800 font-medium">
                              {event.title || event.event_title}
                            </div>
                          </td>
                          
                          {/* ORGANIZER */}
                          <td className="px-6 py-4 text-gray-800 font-medium">
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-gray-400" />
                              {event.organizer_name}
                            </div>
                          </td>
                          
                          {/* VERIFICATION STATUS */}
                          <td className="px-6 py-4 text-center">
                            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold ${verificationStatus.color}`}>
                              {verificationStatus.icon}
                              {verificationStatus.text}
                            </span>
                          </td>
                          
                          {/* CREATED DATE */}
                          <td className="px-6 py-4 text-center text-gray-800">
                            <div className="text-sm font-medium">
                              {event.event_create_date 
                                ? new Date(event.event_create_date).toLocaleDateString()
                                : 'N/A'
                              }
                            </div>
                            <div className="text-xs text-gray-500">
                              {event.event_create_date 
                                ? new Date(event.event_create_date).toLocaleTimeString()
                                : ''
                              }
                            </div>
                          </td>
                          
                          {/* APPROVAL */}
                          <td className="px-6 py-4 text-center">
                            {(event.verification_status !== "approved" && event.verification_status !== "rejected") ? (
                              <div className="flex justify-center gap-2">
                                <button
                                  onClick={() => handleVerifyEvent(event.id)}
                                  disabled={isActionLoading}
                                  className="p-2 bg-lime-500 hover:bg-lime-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                  title="Approve Event"
                                >
                                  <CheckCircle size={20} className="text-white" />
                                </button>
                                <button
                                  onClick={() => handleRejectEvent(event.id)}
                                  disabled={isActionLoading}
                                  className="p-2 bg-red-400 hover:bg-red-500 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                  title="Reject Event"
                                >
                                  <XCircle size={20} className="text-white" />
                                </button>
                              </div>
                            ) : (
                              // CHANGED: Show "—" instead of status badge for approved/rejected events
                              <div className="text-gray-400 text-lg font-medium">
                                —
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                        No events found matching your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
"use client";

import Navbar from "../../../components/navbar"; 
import { QrCode, UserCheck, User, Clock, Calendar, CheckCircle, XCircle, RefreshCw } from "lucide-react";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

interface Attendee {
  ticketId: string;
  name: string;
  email: string;
  status: "present" | "pending" | "absent";
  approvalStatus: "approved" | "pending" | "rejected";
  registered: string;
  checkedIn: string;
  eventDate: string;
  phone?: string;
  role?: string;
  about_me?: any;
}

interface EventData {
  id: number;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  max_attendee: number;
}

interface ScheduleDay {
  date: string;
  label: string;
  start_time: string;
  end_time: string;
  location: string;
  is_online: boolean;
}

interface Statistics {
  total_registered: number;
  checked_in: number;
  pending: number;
  approved: number;
  pending_approval: number;
  rejected: number;
  attendance_rate?: number;
}

export default function DashBoardPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params?.id as string;

  const [event, setEvent] = useState<EventData | null>(null);
  const [eventDates, setEventDates] = useState<ScheduleDay[]>([]);
  const [allAttendees, setAllAttendees] = useState<Attendee[]>([]);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [activeFilter, setActiveFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [tableView, setTableView] = useState("approval");
  
  // NEW: Selection state for bulk actions
  const [selectedTickets, setSelectedTickets] = useState<string[]>([]);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  useEffect(() => {
    if (eventId) {
      fetchDashboardData();
    }
  }, [eventId]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:8000/api/events/${eventId}/dashboard`, {
        credentials: "include",
      });

      if (!response.ok) {
        if (response.status === 403) {
          setError("You are not authorized to view this dashboard");
          return;
        }
        throw new Error("Failed to fetch dashboard data");
      }

      const data = await response.json();
      console.log("Dashboard data:", data);
      
      setEvent(data.event);
      setEventDates(data.schedule_days);
      setAllAttendees(data.attendees);
      setStatistics(data.statistics);
      
      if (data.schedule_days.length > 0) {
        setSelectedDate(data.schedule_days[0].date);
      }
    } catch (err: any) {
      console.error("Error fetching dashboard:", err);
      setError(err.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  // NEW: Bulk approval/rejection handler
  const handleBulkAction = async (action: "approve" | "reject") => {
    if (selectedTickets.length === 0) {
      alert("Please select at least one ticket");
      return;
    }

    if (!confirm(`Are you sure you want to ${action} ${selectedTickets.length} ticket(s)?`)) {
      return;
    }

    try {
      setBulkActionLoading(true);
      
      const response = await fetch(
        `http://localhost:8000/api/events/${eventId}/registrations/bulk-action`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ticket_ids: selectedTickets,
            action: action,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to ${action} tickets`);
      }

      const result = await response.json();
      console.log("Bulk action result:", result);

      // Update local state
      const newStatus = action === "approve" ? "approved" : "rejected";
      setAllAttendees((prev) =>
        prev.map((a) =>
          selectedTickets.includes(a.ticketId)
            ? { ...a, approvalStatus: newStatus as any }
            : a
        )
      );

      // Clear selection
      setSelectedTickets([]);

      // Refresh statistics
      fetchDashboardData();

      alert(`Successfully ${action}ed ${result.processed_count || selectedTickets.length} ticket(s)`);
    } catch (err: any) {
      console.error(`Error ${action}ing tickets:`, err);
      alert(`Failed to ${action} tickets: ${err.message}`);
    } finally {
      setBulkActionLoading(false);
    }
  };

  // NEW: Select/Deselect all handler
  const handleSelectAll = () => {
    if (selectedTickets.length === filteredAttendees.length) {
      // Deselect all
      setSelectedTickets([]);
    } else {
      // Select all filtered attendees
      const allTicketIds = filteredAttendees.map((a) => a.ticketId);
      setSelectedTickets(allTicketIds);
    }
  };

  // NEW: Toggle individual ticket selection
  const toggleTicketSelection = (ticketId: string) => {
    setSelectedTickets((prev) =>
      prev.includes(ticketId)
        ? prev.filter((id) => id !== ticketId)
        : [...prev, ticketId]
    );
  };

  // UPDATED: Individual approval handler (using new endpoint with CSRF)
  const handleApproval = async (ticketId: string, action: "approve" | "reject") => {
    try {
      // Get CSRF token
      const csrfResponse = await fetch("http://localhost:8000/api/set-csrf-token", {
        credentials: "include",
      });
      const csrfData = await csrfResponse.json();
      const csrfToken = csrfData.csrftoken;

      const endpoint = action === "approve" 
        ? `http://localhost:8000/api/events/${eventId}/registrations/${ticketId}/approve`
        : `http://localhost:8000/api/events/${eventId}/registrations/${ticketId}/reject`;

      const response = await fetch(endpoint, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": csrfToken,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${action} ticket`);
      }

      const newStatus = action === "approve" ? "approved" : "rejected";
      
      // Update local state
      setAllAttendees((prev) =>
        prev.map((a) =>
          a.ticketId === ticketId ? { ...a, approvalStatus: newStatus as any } : a
        )
      );

      // Refresh to update statistics
      fetchDashboardData();
      
      alert(`Ticket ${action}ed successfully!`);
    } catch (err: any) {
      console.error(`Error ${action}ing ticket:`, err);
      alert(`Failed to ${action} ticket: ${err.message}`);
    }
  };

  const handleCheckIn = async (ticketId: string) => {
    try {
      const response = await fetch(
        `http://localhost:8000/api/events/${eventId}/check-in?ticket_id=${ticketId}`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to check in attendee");
      }

      setAllAttendees((prev) =>
        prev.map((a) =>
          a.ticketId === ticketId
            ? { ...a, status: "present", checkedIn: new Date().toISOString() }
            : a
        )
      );

      fetchDashboardData();
    } catch (err) {
      console.error("Error checking in:", err);
      alert("Failed to check in attendee");
    }
  };

  // Filter attendees
  const attendees = tableView === "attendance" 
    ? allAttendees.filter((a) => a.eventDate === selectedDate)
    : allAttendees;

  const filteredAttendees = attendees.filter((attendee) => {
    let matchesFilter = false;

    if (tableView === "attendance") {
      matchesFilter = activeFilter === "all" || attendee.status === activeFilter;
    } else {
      matchesFilter = activeFilter === "all" || attendee.approvalStatus === activeFilter;
    }

    const matchesSearch =
      searchQuery === "" ||
      attendee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      attendee.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      attendee.ticketId.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const totalRegistered = attendees.length;
  const checkedIn = attendees.filter((a) => a.status === "present").length;
  const pending = attendees.filter((a) => a.status === "pending").length;
  const attendanceRate = totalRegistered > 0 ? (checkedIn / totalRegistered) * 100 : 0;

  if (loading) {
    return (
      <main>
        <Navbar />
        <div className="min-h-screen bg-indigo-100 flex items-center justify-center">
          <div className="text-2xl text-gray-600">Loading dashboard...</div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main>
        <Navbar />
        <div className="min-h-screen bg-indigo-100 flex items-center justify-center">
          <div className="text-center">
            <div className="text-2xl text-red-600 mb-4">{error}</div>
            <button
              onClick={() => router.push("/my-created-events")}
              className="px-6 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600"
            >
              Back to My Events
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (!event) return null;

  return (
    <main>
      <Navbar />
      <div className="min-h-screen bg-indigo-100">
        <div className="max-w-7xl mx-auto px-8 py-8">
          <div className="flex flex-col items-start gap-y-4">
            <h1 className="text-gray-800 text-5xl font-extrabold pt-10">{event.title}</h1>
            <div className="text-gray-800 font-medium">
              Event ID: <span className="text-gray-800 font-bold">#{event.id}</span>
            </div>
            <button
              type="button"
              onClick={fetchDashboardData}
              className="inline-flex items-center justify-center gap-2 px-4 py-1 text-base font-bold leading-6 text-white bg-indigo-500 border border-transparent rounded-lg hover:bg-indigo-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-400"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>

            <div className="flex gap-2 items-center">
              <button
                onClick={() => {
                  setTableView("approval");
                  setActiveFilter("all");
                  setSelectedTickets([]);
                }}
                className={`px-6 py-2 rounded-lg font-bold text-sm transition-colors ${
                  tableView === "approval"
                    ? "bg-indigo-500 text-white shadow-md"
                    : "bg-white text-gray-700 border-2 border-gray-300 hover:bg-gray-50"
                }`}
              >
                Approval View
              </button>
              <button
                onClick={() => {
                  setTableView("attendance");
                  setActiveFilter("all");
                  setSelectedTickets([]);
                }}
                className={`px-6 py-2 rounded-lg font-bold text-sm transition-colors ${
                  tableView === "attendance"
                    ? "bg-indigo-500 text-white shadow-md"
                    : "bg-white text-gray-700 border-2 border-gray-300 hover:bg-gray-50"
                }`}
              >
                Attendance View
              </button>
            </div>

          {tableView === "attendance" && eventDates.length > 1 && (
            <div className="w-full">
              <label className="block text-gray-700 font-medium mb-2">Select Event Date:</label>
              <select
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-4 py-2 rounded-xl bg-white border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition text-gray-800"
              >
                {eventDates.map((day) => (
                  <option key={day.date} value={day.date}>
                    {day.label}
                  </option>
                ))}
              </select>
            </div>
          )}

            {statistics && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
                {tableView === "attendance" ? (
                  <>
                    <div className="bg-white rounded-xl p-6 shadow-md">
                      <div className="flex items-center gap-3">
                        <User className="text-indigo-500" size={32} />
                        <div>
                          <p className="text-gray-500 text-sm font-medium">Total Registered</p>
                          <p className="text-3xl font-bold text-gray-800">{totalRegistered}</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white rounded-xl p-6 shadow-md">
                      <div className="flex items-center gap-3">
                        <UserCheck className="text-lime-500" size={32} />
                        <div>
                          <p className="text-gray-500 text-sm font-medium">Checked In</p>
                          <p className="text-3xl font-bold text-gray-800">{checkedIn}</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white rounded-xl p-6 shadow-md">
                      <div className="flex items-center gap-3">
                        <Clock className="text-yellow-400" size={32} />
                        <div>
                          <p className="text-gray-500 text-sm font-medium">Pending</p>
                          <p className="text-3xl font-bold text-gray-800">{pending}</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white rounded-xl p-6 shadow-md">
                      <div className="flex items-center gap-3">
                        <QrCode className="text-indigo-500" size={32} />
                        <div>
                          <p className="text-gray-500 text-sm font-medium">Attendance Rate</p>
                          <p className="text-3xl font-bold text-gray-800">{attendanceRate.toFixed(0)}%</p>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="bg-white rounded-xl p-6 shadow-md">
                      <div className="flex items-center gap-3">
                        <User className="text-indigo-500" size={32} />
                        <div>
                          <p className="text-gray-500 text-sm font-medium">Total Registrations</p>
                          <p className="text-3xl font-bold text-gray-800">{statistics.total_registered}</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white rounded-xl p-6 shadow-md">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="text-lime-500" size={32} />
                        <div>
                          <p className="text-gray-500 text-sm font-medium">Approved</p>
                          <p className="text-3xl font-bold text-gray-800">{statistics.approved}</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white rounded-xl p-6 shadow-md">
                      <div className="flex items-center gap-3">
                        <Clock className="text-yellow-400" size={32} />
                        <div>
                          <p className="text-gray-500 text-sm font-medium">Pending Approval</p>
                          <p className="text-3xl font-bold text-gray-800">{statistics.pending_approval}</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white rounded-xl p-6 shadow-md">
                      <div className="flex items-center gap-3">
                        <XCircle className="text-red-400" size={32} />
                        <div>
                          <p className="text-gray-500 text-sm font-medium">Rejected</p>
                          <p className="text-3xl font-bold text-gray-800">{statistics.rejected}</p>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Attendee Table Section */}
            <div className="w-full bg-white rounded-2xl p-8 shadow-md mt-6">
              <div className="flex justify-between items-center mb-4">
                <div className="text-gray-800 text-2xl font-bold">
                  {tableView === "attendance" ? "Attendee Table" : "Approval Table"}
                </div>
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name, email, or ticket ID....."
                    className="px-4 py-2 w-80 rounded-xl bg-white border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition text-gray-800 placeholder-gray-400"
                  />
                </div>
              </div>

              {/* NEW: Bulk Action Buttons (only in approval view) */}
              {tableView === "approval" && (
                <div className="flex gap-3 mb-4">
                  <button
                    onClick={handleSelectAll}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                  >
                    {selectedTickets.length === filteredAttendees.length && filteredAttendees.length > 0
                      ? "Deselect All"
                      : "Select All"}
                  </button>
                  
                  {selectedTickets.length > 0 && (
                    <>
                      <button
                        onClick={() => handleBulkAction("approve")}
                        disabled={bulkActionLoading}
                        className="px-4 py-2 bg-lime-500 text-white rounded-lg font-semibold hover:bg-lime-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {bulkActionLoading ? "Processing..." : `Approve Selected (${selectedTickets.length})`}
                      </button>
                      
                      <button
                        onClick={() => handleBulkAction("reject")}
                        disabled={bulkActionLoading}
                        className="px-4 py-2 bg-red-400 text-white rounded-lg font-semibold hover:bg-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {bulkActionLoading ? "Processing..." : `Reject Selected (${selectedTickets.length})`}
                      </button>
                    </>
                  )}
                </div>
              )}

              {/* Filter Tabs */}
              {tableView === "attendance" ? (
                <div className="flex flex-row gap-2 mb-4">
                  <button
                    onClick={() => setActiveFilter("all")}
                    className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
                      activeFilter === "all"
                        ? "bg-indigo-500 text-white"
                        : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    All ({attendees.length})
                  </button>
                  <button
                    onClick={() => setActiveFilter("present")}
                    className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
                      activeFilter === "present"
                        ? "bg-lime-500 text-white"
                        : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    Present ({checkedIn})
                  </button>
                  <button
                    onClick={() => setActiveFilter("pending")}
                    className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
                      activeFilter === "pending"
                        ? "bg-yellow-400 text-white"
                        : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    Pending ({pending})
                  </button>
                </div>
              ) : (
                <div className="flex flex-row gap-2 mb-4">
                  <button
                    onClick={() => setActiveFilter("all")}
                    className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
                      activeFilter === "all"
                        ? "bg-indigo-500 text-white"
                        : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    All ({allAttendees.length})
                  </button>
                  <button
                    onClick={() => setActiveFilter("approved")}
                    className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
                      activeFilter === "approved"
                        ? "bg-lime-500 text-white"
                        : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    Approved ({statistics?.approved || 0})
                  </button>
                  <button
                    onClick={() => setActiveFilter("pending")}
                    className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
                      activeFilter === "pending"
                        ? "bg-yellow-400 text-white"
                        : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    Pending ({statistics?.pending_approval || 0})
                  </button>
                  <button
                    onClick={() => setActiveFilter("rejected")}
                    className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
                      activeFilter === "rejected"
                        ? "bg-red-400 text-white"
                        : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    Rejected ({statistics?.rejected || 0})
                  </button>
                </div>
              )}

              {/* Table */}
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="w-full">
                  <thead>
                    <tr className="bg-indigo-500 text-white">
                      {/* NEW: Checkbox column for approval view */}
                      {tableView === "approval" && (
                        <th className="px-6 py-3 text-center font-bold text-sm">
                          <input
                            type="checkbox"
                            checked={selectedTickets.length === filteredAttendees.length && filteredAttendees.length > 0}
                            onChange={handleSelectAll}
                            className="w-4 h-4 cursor-pointer"
                          />
                        </th>
                      )}
                      <th className="px-6 py-3 text-left font-bold text-sm">TICKET ID</th>
                      <th className="px-6 py-3 text-left font-bold text-sm">NAME</th>
                      <th className="px-6 py-3 text-left font-bold text-sm">EMAIL</th>
                      <th className="px-6 py-3 text-center font-bold text-sm">STATUS</th>
                      <th className="px-6 py-3 text-left font-bold text-sm">REGISTERED</th>
                      {tableView === "attendance" ? (
                        <th className="px-6 py-3 text-left font-bold text-sm">CHECKED IN</th>
                      ) : (
                        <th className="px-6 py-3 text-center font-bold text-sm">APPROVAL</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {filteredAttendees.length > 0 ? (
                      filteredAttendees.map((attendee, index) => (
                        <tr key={index} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                          {/* NEW: Checkbox for selection */}
                          {tableView === "approval" && (
                            <td className="px-6 py-4 text-center">
                              <input
                                type="checkbox"
                                checked={selectedTickets.includes(attendee.ticketId)}
                                onChange={() => toggleTicketSelection(attendee.ticketId)}
                                className="w-4 h-4 cursor-pointer"
                              />
                            </td>
                          )}
                          <td className="px-6 py-4 text-gray-800 font-medium">{attendee.ticketId}</td>
                          <td className="px-6 py-4 text-gray-800 font-medium">{attendee.name}</td>
                          <td className="px-6 py-4 text-gray-800">{attendee.email}</td>
                          <td className="px-6 py-4 text-center">
                            {tableView === "attendance" ? (
                              <span
                                className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                                  attendee.status === "present"
                                    ? "bg-lime-500 text-white"
                                    : "bg-yellow-400 text-white"
                                }`}
                              >
                                {attendee.status === "present" ? "Present" : "Pending"}
                              </span>
                            ) : (
                              <span
                                className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                                  attendee.approvalStatus === "approved"
                                    ? "bg-lime-500 text-white"
                                    : attendee.approvalStatus === "rejected"
                                    ? "bg-red-400 text-white"
                                    : "bg-yellow-400 text-white"
                                }`}
                              >
                                {attendee.approvalStatus === "approved"
                                  ? "Approved"
                                  : attendee.approvalStatus === "rejected"
                                  ? "Rejected"
                                  : "Pending"}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-gray-800">
                            {new Date(attendee.registered).toLocaleString()}
                          </td>
                          {tableView === "attendance" ? (
                            <td className="px-6 py-4 text-gray-800">
                              {attendee.checkedIn === "—" || !attendee.checkedIn ? (
                                <button
                                  onClick={() => handleCheckIn(attendee.ticketId)}
                                  className="px-3 py-1 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 text-sm"
                                >
                                  Check In
                                </button>
                              ) : (
                                new Date(attendee.checkedIn).toLocaleString()
                              )}
                            </td>
                          ) : (
                            <td className="px-6 py-4">
                              {attendee.approvalStatus === "pending" ? (
                                <div className="flex justify-center gap-2">
                                  <button
                                    onClick={() => handleApproval(attendee.ticketId, "approve")}
                                    className="p-2 bg-lime-500 hover:bg-lime-600 rounded-lg transition-colors"
                                    title="Approve"
                                  >
                                    <CheckCircle size={20} className="text-white" />
                                  </button>
                                  <button
                                    onClick={() => handleApproval(attendee.ticketId, "reject")}
                                    className="p-2 bg-red-400 hover:bg-red-500 rounded-lg transition-colors"
                                    title="Reject"
                                  >
                                    <XCircle size={20} className="text-white" />
                                  </button>
                                </div>
                              ) : (
                                <div className="text-center text-gray-400 text-sm">—</div>
                              )}
                            </td>
                          )}
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={tableView === "approval" ? 7 : 6} className="px-6 py-8 text-center text-gray-500">
                          No data found matching your search.
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
    </main>
  );
}
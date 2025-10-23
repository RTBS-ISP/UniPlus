"use client";
import Navbar from "../../../components/navbar"; 
import { QrCode, UserCheck, User, Clock, Calendar, ChevronDown, CheckCircle, XCircle } from "lucide-react";
import { useState } from "react";

export default function DashBoardPage() {
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState("2025-10-07");
  const [tableView, setTableView] = useState("approval");

  // Event dates
  const eventDates = [
    { date: "2025-10-07", label: "Day 1 - Oct 7, 2025" },
    { date: "2025-10-08", label: "Day 2 - Oct 8, 2025" },
    { date: "2025-10-09", label: "Day 3 - Oct 9, 2025" },
    { date: "2025-10-10", label: "Day 4 - Oct 10, 2025" },
    { date: "2025-10-11", label: "Day 5 - Oct 11, 2025" }
  ];

  // Mock-up attendee data with dates and approval status
  const [allAttendees, setAllAttendees] = useState([
    // Day 1
    {
      ticketId: "T123456",
      name: "John Doe",
      email: "john@example.com",
      status: "present",
      approvalStatus: "approved",
      registered: "2025-10-05 22:00",
      checkedIn: "2025-10-07 22:00",
      eventDate: "2025-10-07"
    },
    {
      ticketId: "T123457",
      name: "Charlie Brown",
      email: "charlie@example.com",
      status: "pending",
      approvalStatus: "pending",
      registered: "2025-10-05 22:30",
      checkedIn: "—",
      eventDate: "2025-10-07"
    },
    {
      ticketId: "T123458",
      name: "Jane Smith",
      email: "jane@example.com",
      status: "present",
      approvalStatus: "approved",
      registered: "2025-10-06 10:00",
      checkedIn: "2025-10-07 21:30",
      eventDate: "2025-10-07"
    },
    {
      ticketId: "T123462",
      name: "Mike Johnson",
      email: "mike@example.com",
      status: "pending",
      approvalStatus: "rejected",
      registered: "2025-10-06 15:00",
      checkedIn: "—",
      eventDate: "2025-10-07"
    },
    // Day 2
    {
      ticketId: "T123459",
      name: "Alice Johnson",
      email: "alice@example.com",
      status: "present",
      approvalStatus: "approved",
      registered: "2025-10-05 14:00",
      checkedIn: "2025-10-08 09:15",
      eventDate: "2025-10-08"
    },
    {
      ticketId: "T123460",
      name: "Bob Wilson",
      email: "bob@example.com",
      status: "pending",
      approvalStatus: "pending",
      registered: "2025-10-06 16:00",
      checkedIn: "—",
      eventDate: "2025-10-08"
    },
    // Day 3
    {
      ticketId: "T123461",
      name: "Emma Davis",
      email: "emma@example.com",
      status: "present",
      approvalStatus: "approved",
      registered: "2025-10-04 11:00",
      checkedIn: "2025-10-09 10:30",
      eventDate: "2025-10-09"
    }
  ]);

  // Handle approve/reject
  const handleApproval = (ticketId, status) => {
    setAllAttendees(prev =>
      prev.map(a =>
        a.ticketId === ticketId
          ? { ...a, approvalStatus: status }
          : a
      )
    );
  };

  // Filter attendees
  const attendees = tableView === "attendance" 
    ? allAttendees.filter(a => a.eventDate === selectedDate)
    : allAttendees; 

  // Filter logic for both views
  const filteredAttendees = attendees.filter(attendee => {
    let matchesFilter = false;
    
    if (tableView === "attendance") {
      matchesFilter = activeFilter === "all" || attendee.status === activeFilter;
    } else {
      // Approval view
      matchesFilter = activeFilter === "all" || attendee.approvalStatus === activeFilter;
    }
    
    const matchesSearch = searchQuery === "" || 
      attendee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      attendee.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      attendee.ticketId.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  const totalRegistered = attendees.length;
  const checkedIn = attendees.filter(a => a.status === "present").length;
  const pending = attendees.filter(a => a.status === "pending").length;
  const attendanceRate = totalRegistered > 0 ? (checkedIn / totalRegistered) * 100 : 0;

  // Approval stats 
  const allApprovalAttendees = allAttendees;
  const approvedCount = allApprovalAttendees.filter(a => a.approvalStatus === "approved").length;
  const pendingApproval = allApprovalAttendees.filter(a => a.approvalStatus === "pending").length;
  const rejectedCount = allApprovalAttendees.filter(a => a.approvalStatus === "rejected").length;
  const totalApprovalRegistered = allApprovalAttendees.length;

  return (
    <main>
      <Navbar />
      <div className="min-h-screen bg-indigo-100">
        <div className="max-w-7xl mx-auto px-8 py-8">
          {/* Header with View Toggle */}
          <div className="flex flex-col items-start gap-y-4">
            <h1 className="text-gray-800 text-5xl font-extrabold pt-10">Test 1</h1>
            <div className="text-gray-800 font-medium">
              Event ID: <span className="text-gray-800 font-bold">E1212312121</span>
            </div>
            <button
                type="button"
                className="inline-flex items-center justify-center w-full px-4 py-1 text-base font-bold leading-6 text-white bg-indigo-500 border border-transparent rounded-lg md:w-auto hover:bg-indigo-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Refresh
            </button>
            <div className="flex gap-2 items-center">
              <button
                onClick={() => {
                  setTableView("approval");
                  setActiveFilter("all");
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
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-8 py-8">
          {/* Stats Cards Section */}
          <div className="rounded-lg shadow-sm p-8 mb-8 bg-white">
            {/* Date Selector */}
            {tableView === "attendance" && (
              <div className="flex items-center justify-between mb-6 pb-6 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-100 rounded-lg">
                    <Calendar size={24} className="text-indigo-500" />
                  </div>
                  <div>
                    <h2 className="text-gray-800 text-lg font-bold">Event Date</h2>
                    <p className="text-gray-600 text-sm">Select a date to view attendance</p>
                  </div>
                </div>
                
                <div className="relative">
                  <select
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="appearance-none px-6 py-3 pr-12 rounded-lg font-semibold text-sm bg-indigo-500 text-white shadow-md cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 transition-all min-w-[250px]"
                  >
                    {eventDates.map((eventDay) => (
                      <option key={eventDay.date} value={eventDay.date}>
                        {eventDay.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={20} className="absolute right-4 top-1/2 -translate-y-1/2 text-white pointer-events-none" />
                </div>
              </div>
            )}

            {/* Stats Cards Grid */}
            {tableView === "attendance" ? (
              <div className="grid grid-cols-4 gap-6">
                {/* Total Registered */}
                <div className="bg-indigo-500 rounded-lg p-6 flex flex-col shadow-md">
                  <User size={32} className="font-extrabold mb-3"/>
                  <div className="flex text-white text-3xl font-extrabold mb-1">{totalRegistered}</div>
                  <div className="text-white font-extrabold">Total Registered</div>
                </div>

                {/* Checked In */}
                <div className="bg-lime-500 rounded-lg p-6 flex flex-col shadow-md">
                  <UserCheck size={32} className="font-extrabold mb-3"/>
                  <div className="flex text-white text-3xl font-extrabold mb-1">{checkedIn}</div>
                  <div className="text-white font-extrabold">Checked In</div>
                </div>

                {/* Pending */}
                <div className="bg-yellow-400 rounded-lg p-6 flex flex-col shadow-md">
                  <Clock size={32} className="font-extrabold mb-3"/>
                  <div className="flex text-white text-3xl font-extrabold mb-1">{pending}</div>
                  <div className="text-white font-extrabold">Pending Check-In</div>
                </div>

                {/* Attendance Rate */}
                <div className="bg-pink-400 rounded-lg p-6 flex flex-col shadow-md w-full">
                  <div className="text-white text-3xl font-bold">
                    {attendanceRate.toFixed(0)}%
                  </div>
                  <div className="text-white mt-2 font-extrabold">Attendance Rate</div>

                  {/* Progress bar */}
                  <div className="w-full bg-gray-300 h-2 rounded-full mt-3">
                    <div
                      className="h-2 bg-white rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${attendanceRate}%` }}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-6">
                {/* Total Registered */}
                <div className="bg-indigo-500 rounded-lg p-6 flex flex-col shadow-md">
                  <User size={32} className="font-extrabold mb-3"/>
                  <div className="flex text-white text-3xl font-extrabold mb-1">{totalApprovalRegistered}</div>
                  <div className="text-white font-extrabold">Total Registered</div>
                </div>

                {/* Approved */}
                <div className="bg-lime-500 rounded-lg p-6 flex flex-col shadow-md">
                  <UserCheck size={32} className="font-extrabold mb-3"/>
                  <div className="flex text-white text-3xl font-extrabold mb-1">{approvedCount}</div>
                  <div className="text-white font-extrabold">Approved</div>
                </div>

                {/* Pending Approval */}
                <div className="bg-yellow-400 rounded-lg p-6 flex flex-col shadow-md">
                  <Clock size={32} className="font-extrabold mb-3"/>
                  <div className="flex text-white text-3xl font-extrabold mb-1">{pendingApproval}</div>
                  <div className="text-white font-extrabold">Pending Approval</div>
                </div>

                {/* Rejected */}
                <div className="bg-red-400 rounded-lg p-6 flex flex-col shadow-md">
                  <XCircle size={32} className="font-extrabold mb-3"/>
                  <div className="flex text-white text-3xl font-extrabold mb-1">{rejectedCount}</div>
                  <div className="text-white font-extrabold">Rejected</div>
                </div>
              </div>
            )}
          </div>

          {/* QR Code Section (Only show in attendance view) */}
          {tableView === "attendance" && (
            <div className="rounded-lg shadow-sm p-8 mb-8 bg-white">
              <div className="flex flex-row items-center w-full mb-2 gap-3">
                <div className="p-3 bg-indigo-100 rounded-lg">
                  <QrCode size={42} className="text-indigo-500" />
                </div>
                <div className="flex flex-col w-full">
                  <div className="text-gray-800 text-3xl font-extrabold w-full">
                    QR Code Scanner
                  </div>
                  <div className="text-gray-400 text-base font-medium w-full">
                    Scan attendee tickets for instant check-in
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="Scan QR code or enter Ticket ID (e.g., T123456)"
                  className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition text-gray-800 placeholder-gray-400"
                />
                <button
                  type="submit"
                  className="inline-flex items-center justify-center w-full px-4 py-1 text-base font-bold leading-6 text-white bg-indigo-500 border border-transparent rounded-lg md:w-auto hover:bg-indigo-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <UserCheck className="mr-1"/> Check In
                </button>
              </div>
            </div>
          )}

          {/* Table Section */}
          <div className="rounded-lg shadow-sm p-8 bg-white">
            {/* Title and Search */}
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
                  All ({allApprovalAttendees.length})
                </button>
                <button 
                  onClick={() => setActiveFilter("approved")}
                  className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
                    activeFilter === "approved" 
                      ? "bg-lime-500 text-white" 
                      : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  Approved ({approvedCount})
                </button>
                <button 
                  onClick={() => setActiveFilter("pending")}
                  className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
                    activeFilter === "pending" 
                      ? "bg-yellow-400 text-white" 
                      : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  Pending ({pendingApproval})
                </button>
                <button 
                  onClick={() => setActiveFilter("rejected")}
                  className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
                    activeFilter === "rejected" 
                      ? "bg-red-400 text-white" 
                      : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  Rejected ({rejectedCount})
                </button>
              </div>
            )}

            {/* Table */}
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="w-full">
                <thead>
                  <tr className="bg-indigo-500 text-white">
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
                        <td className="px-6 py-4 text-gray-800 font-medium">{attendee.ticketId}</td>
                        <td className="px-6 py-4 text-gray-800 font-medium">{attendee.name}</td>
                        <td className="px-6 py-4 text-gray-800">{attendee.email}</td>
                        <td className="px-6 py-4 text-center">
                          {tableView === "attendance" ? (
                            <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                              attendee.status === "present" 
                                ? "bg-lime-500 text-white" 
                                : "bg-yellow-400 text-white"
                            }`}>
                              {attendee.status === "present" ? "Present" : "Pending"}
                            </span>
                          ) : (
                            <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                              attendee.approvalStatus === "approved" 
                                ? "bg-lime-500 text-white" 
                                : attendee.approvalStatus === "rejected"
                                ? "bg-red-400 text-white"
                                : "bg-yellow-400 text-white"
                            }`}>
                              {attendee.approvalStatus === "approved" 
                                ? "Approved" 
                                : attendee.approvalStatus === "rejected"
                                ? "Rejected"
                                : "Pending"}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-gray-800">{attendee.registered}</td>
                        {tableView === "attendance" ? (
                          <td className="px-6 py-4 text-gray-800">{attendee.checkedIn}</td>
                        ) : (
                          <td className="px-6 py-4">
                            {attendee.approvalStatus === "pending" ? (
                              <div className="flex justify-center gap-2">
                                <button onClick={() => handleApproval(attendee.ticketId, "approved")} className="p-2 bg-lime-500 hover:bg-lime-600 rounded-lg transition-colors">
                                  <CheckCircle size={20} className="text-white" />
                                </button>
                                <button onClick={() => handleApproval(attendee.ticketId, "rejected")} className="p-2 bg-red-400 hover:bg-red-500 rounded-lg transition-colors">
                                  <XCircle size={20} className="text-white" />
                                </button>
                              </div>
                            ) : (
                              <div className="text-center text-gray-400 text-sm">
                                —
                              </div>
                            )}
                          </td>
                        )}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
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
    </main>
  );
}
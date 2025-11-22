"use client";

import { RefreshCw, Download } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import Navbar from "@/app/components/navbar";

import { useDashboard } from "@/lib/dashboard/useDashboard";

import { Header } from "@/app/components/dashboard/Header";
import { ViewToggle } from "@/app/components/dashboard/ViewToggle";
import { DateSelector } from "@/app/components/dashboard/DateSelector";
import { AttendanceStatCards, ApprovalStatCards } from "@/app/components/dashboard/StatCards";
import { QRCheckIn } from "@/app/components/dashboard/QRCheckIn";
import { Filters } from "@/app/components/dashboard/Filters";
import { BulkActions } from "@/app/components/dashboard/BulkActions";
import { AttendeeTable } from "@/app/components/dashboard/AttendeeTable";

export default function DashBoardPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params?.id as string | undefined;

  const {
    state,
    visibleAttendees,
    attendanceStats,
    load,
    setTableView,
    setSelectedDate,
    setSearch,
    setActiveFilter,
    toggleTicket,
    selectAll,
    approveReject,
    bulkAct,
    checkIn,
  } = useDashboard(eventId);
const exportCSV = async () => {
  if (!eventId) {
    alert('No event ID found');
    return;
  }

  try {
    console.log('Starting CSV export for event:', eventId);
    
    // Use absolute URL to your Django backend
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/events/${eventId}/export`, {
      method: 'GET',
      credentials: 'include', // Important for session cookies
    });

    console.log('Export response status:', response.status);

    if (response.ok) {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('text/csv')) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        
        const contentDisposition = response.headers.get('Content-Disposition');
        let filename = `event_${eventId}_registrations_${new Date().toISOString().split('T')[0]}.csv`;
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename="(.+)"/);
          if (filenameMatch) {
            filename = filenameMatch[1];
          }
        }
        
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        console.log('CSV export successful');
      } else {
        const text = await response.text();
        console.error('Server returned non-CSV response:', text);
        alert('Export failed: Server returned an error. Please check console for details.');
      }
    } else {
      const errorText = await response.text();
      console.error('Export failed with status:', response.status, 'Response:', errorText);
      
      if (response.status === 403) {
        alert('Export failed: You are not authorized to export this event.');
      } else if (response.status === 404) {
        alert('Export failed: Event not found or no registrations available.');
      } else {
        alert(`Export failed: Server returned error ${response.status}. Please try again.`);
      }
    }
  } catch (error) {
    console.error('Export error:', error);
    alert('Error exporting CSV. Please check your connection and try again.');
  }
};


  if (state.loading) {
    return (
      <main>
        <Navbar />
        <div className="min-h-screen bg-indigo-100 flex items-center justify-center">
          <div className="text-2xl text-gray-600">Loading dashboard...</div>
        </div>
      </main>
    );
  }

  if (state.error) {
    return (
      <main>
        <Navbar />
        <div className="min-h-screen bg-indigo-100 flex items-center justify-center">
          <div className="text-center">
            <div className="text-2xl text-red-600 mb-4">{state.error}</div>
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

  if (!state.event) return null;

  const countsForFilters =
    state.tableView === "attendance"
      ? {
          all: visibleAttendees.length,
          present: attendanceStats.present,
          pending: attendanceStats.pending,
        }
      : {
          all: state.attendees.length,
          approved: state.statistics?.approved || 0,
          pending_approval: state.statistics?.pending_approval || 0,
          rejected: state.statistics?.rejected || 0,
        };

  const anySelected =
    state.selectedTickets.length > 0 &&
    state.selectedTickets.length <= visibleAttendees.length;

  return (
    <main>
      <Navbar />
      <div className="min-h-screen bg-indigo-100">
        <Header title={state.event?.title} id={state.event?.id} />

        <div className="max-w-7xl mx-auto px-8 -mt-4 mb-2 flex flex-col items-start gap-4">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={load}
              className="inline-flex items-center justify-center gap-2 px-4 py-1 text-base font-bold leading-6 text-white bg-indigo-500 border border-transparent rounded-lg hover:bg-indigo-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-400"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>

            <button
              type="button"
              onClick={exportCSV}
              disabled={state.loading}
              className="inline-flex items-center justify-center gap-2 px-4 py-1 text-base font-bold leading-6 text-white bg-green-600 border border-transparent rounded-lg hover:bg-green-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-400 disabled:bg-green-400 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>

          <ViewToggle view={state.tableView} onChange={setTableView} />
        </div>

        <div className="max-w-7xl mx-auto px-8 py-8">
          <div className="rounded-lg shadow-sm p-8 mb-8 bg-white">
            {state.tableView === "attendance" && (
              <DateSelector
                days={state.schedule}
                selected={state.selectedDate}
                onChange={setSelectedDate}
              />
            )}

            {state.tableView === "attendance" ? (
              <AttendanceStatCards
                total={attendanceStats.total}
                present={attendanceStats.present}
                pending={attendanceStats.pending}
                rate={attendanceStats.rate}
              />
            ) : (
              <ApprovalStatCards stats={state.statistics} />
            )}
          </div>

          {state.tableView === "attendance" && (
            <QRCheckIn onSubmit={(id) => checkIn(id)} />
          )}

          <div className="rounded-lg shadow-sm p-8 bg-white">
            <div className="flex justify-between items-center mb-4">
              <div className="text-gray-800 text-2xl font-bold">
                {state.tableView === "attendance" ? "Attendee Table" : "Approval Table"}
              </div>
              <div className="relative">
                <input
                  type="text"
                  value={state.search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name, email, or ticket ID....."
                  className="px-4 py-2 w-80 rounded-xl bg-white border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition text-gray-800 placeholder-gray-400"
                />
              </div>
            </div>

            {state.tableView === "approval" && (
              <BulkActions
                anySelected={anySelected}
                totalSelected={state.selectedTickets.length}
                onSelectAll={selectAll}
                onApprove={() => bulkAct("approve")}
                onReject={() => bulkAct("reject")}
                busy={state.bulkBusy}
              />
            )}

            <Filters
              view={state.tableView}
              counts={countsForFilters as any}
              active={state.activeFilter}
              onChange={setActiveFilter}
            />

            <AttendeeTable
              view={state.tableView}
              data={visibleAttendees}
              selected={state.selectedTickets}
              toggle={toggleTicket}
              onApprove={(id) => approveReject(id, "approve")}
              onReject={(id) => approveReject(id, "reject")}
              onCheckIn={(id) => checkIn(id)}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
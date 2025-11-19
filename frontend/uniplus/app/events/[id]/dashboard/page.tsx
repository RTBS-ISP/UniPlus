"use client";
import { useState, useEffect } from "react";
import { RefreshCw } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import Navbar from "@/app/components/navbar";

import { useDashboard } from "@/lib/dashboard/useDashboard";

import { Header } from "@/app/components/dashboard/Header";
import { ViewToggle } from "@/app/components/dashboard/ViewToggle";
import { DateSelector } from "@/app/components/dashboard/DateSelector";
import {
  AttendanceStatCards,
  ApprovalStatCards,
} from "@/app/components/dashboard/StatCards";
import { QRCheckIn } from "@/app/components/dashboard/QRCheckIn";
import { Filters } from "@/app/components/dashboard/Filters";
import { BulkActions } from "@/app/components/dashboard/BulkActions";
import { AttendeeTable } from "@/app/components/dashboard/AttendeeTable";
import { FeedbackPanel, type EventFeedback } from "@/app/components/dashboard/FeedbackPanel";
import { FeedbackSummarySidebar } from "@/app/components/dashboard/FeedbackSummarySidebar";

// --- helpers for export ---

const API_BASE =
  (process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000/api").replace(
    /\/$/,
    ""
  );

type FeedbackReportResponse = {
  aggregates: {
    total: number;
    average_rating: number;
    rating_counts: Record<string, number>;
    anonymous_count: number;
  };
  ai_summary: string;
  feedback: EventFeedback[];
};

function buildFeedbackReportMarkdown(
  event: { title?: string | null; id: number },
  data: {
    aggregates: {
      total: number;
      average_rating: number;
      rating_counts: Record<string, number>;
      anonymous_count: number;
    };
    ai_summary: string;
    feedback: {
      id: number;
      rating: number;
      comment: string;
      created_at: string;
      user_name: string;
      user_email: string | null;
    }[];
  }
) {
  const { aggregates, ai_summary, feedback } = data;

  const lines: string[] = [];

  lines.push(`# Feedback Report – ${event.title ?? "Untitled Event"}`);
  lines.push("");
  lines.push(`Event ID: ${event.id}`);
  lines.push("");

  lines.push("## 1. Overview");
  lines.push(`- Total feedback: **${aggregates.total}**`);
  lines.push(`- Average rating: **${aggregates.average_rating.toFixed(2)}/5**`);
  const anonPct =
    aggregates.total > 0
      ? Math.round((aggregates.anonymous_count / aggregates.total) * 100)
      : 0;
  lines.push(
    `- Anonymous responses: **${aggregates.anonymous_count}** (${anonPct}%)`
  );
  lines.push("");

  lines.push("### Rating distribution");
  for (let r = 5; r >= 1; r--) {
    const key = String(r);
    const count = aggregates.rating_counts[key] ?? 0;
    const bar = "█".repeat(Math.min(count, 20)); // simple text "graph"
    lines.push(`- ${r}★: ${bar} (${count})`);
  }
  lines.push("");

  lines.push("## 2. AI summary (qualitative)");
  lines.push(ai_summary || "_No AI summary generated yet._");
  lines.push("");

  lines.push("## 3. Individual feedback");
  if (feedback.length === 0) {
    lines.push("_No feedback yet._");
  } else {
    feedback.forEach((fb) => {
      lines.push(
        `### Rating ${fb.rating}/5 – ${fb.user_name}${
          fb.user_email ? ` (${fb.user_email})` : ""
        }`
      );
      lines.push(`- Submitted at: ${new Date(fb.created_at).toLocaleString()}`);
      if (fb.comment && fb.comment.trim()) {
        lines.push("");
        lines.push(fb.comment.trim());
      } else {
        lines.push("");
        lines.push("_No written comment._");
      }
      lines.push("");
    });
  }

  return lines.join("\n");
}

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
    feedbacks,
  } = useDashboard(eventId);

  const [exporting, setExporting] = useState(false);

  // NEW: state for feedback report / AI summary
  const [report, setReport] = useState<FeedbackReportResponse | null>(null);
  const [reportLoading, setReportLoading] = useState(false);

  const fetchFeedbackReport = async () => {
    if (!eventId) return;
    setReportLoading(true);
    try {
      const res = await fetch(
        `${API_BASE}/events/${eventId}/feedback/report`,
        { credentials: "include" }
      );

      const data = await res.json();

      if (!res.ok) {
        console.error("Failed to load feedback report", data);
        setReport(null);
        return;
      }

      setReport(data);
    } catch (err) {
      console.error("Error loading feedback report", err);
      setReport(null);
    } finally {
      setReportLoading(false);
    }
  };

  // load AI summary once when event changes
  useEffect(() => {
    fetchFeedbackReport();
  }, [eventId]);

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
      : state.tableView === "approval"
      ? {
          all: state.attendees.length,
          approved: state.statistics?.approved || 0,
          pending_approval: state.statistics?.pending_approval || 0,
          rejected: state.statistics?.rejected || 0,
        }
      : null;

  const anySelected =
    state.selectedTickets.length > 0 &&
    state.selectedTickets.length <= visibleAttendees.length;

  const handleExportFeedbackReport = async () => {
    if (!eventId || !state.event) return;
    if (exporting) return;

    setExporting(true);
    try {
      const res = await fetch(
        `${API_BASE}/events/${eventId}/feedback/report`,
        { credentials: "include" }
      );
      const data = await res.json();

      if (!res.ok) {
        console.error("Export error", data);
        alert(data.error || "Failed to export feedback report");
        return;
      }

      const markdown = buildFeedbackReportMarkdown(state.event, data);

      const blob = new Blob([markdown], {
        type: "text/markdown;charset=utf-8",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `event-${eventId}-feedback-report.md`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert("Unexpected error while exporting report");
    } finally {
      setExporting(false);
    }
  };

  return (
    <main>
      <Navbar />
      <div className="min-h-screen bg-indigo-100">
        <Header title={state.event?.title} id={state.event?.id} />

        <div className="max-w-7xl mx-auto px-8 -mt-4 mb-2 flex flex-col items-start gap-4">
          <button
            type="button"
            onClick={() => {
              load();
              fetchFeedbackReport();
            }}
            className="inline-flex items-center justify-center gap-2 px-4 py-1 text-base font-bold leading-6 text-white bg-indigo-500 border border-transparent rounded-lg hover:bg-indigo-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-400"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>

          <ViewToggle view={state.tableView} onChange={setTableView} />
        </div>

        <div className="max-w-7xl mx-auto px-8 py-8">
          {/* Top stats card – only for attendance & approval */}
          {state.tableView !== "feedback" && (
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
          )}

          {/* QR check-in only for attendance */}
          {state.tableView === "attendance" && (
            <QRCheckIn onSubmit={(id) => checkIn(id)} />
          )}

          {/* Main content */}
          {state.tableView === "feedback" ? (
            <div className="grid lg:grid-cols-[minmax(0,2fr)_minmax(260px,1fr)] gap-6">
              <div>
                <FeedbackPanel feedbacks={feedbacks} />
              </div>

              <FeedbackSummarySidebar
                feedbacks={feedbacks}
                aiSummary={report?.ai_summary || ""}
                aiSummaryLoading={reportLoading}
                onExport={handleExportFeedbackReport}
              />
            </div>
          ) : (
            <div className="rounded-lg shadow-sm p-8 bg-white">
              <div className="flex justify-between items-center mb-4">
                <div className="text-gray-800 text-2xl font-bold">
                  {state.tableView === "attendance"
                    ? "Attendee Table"
                    : "Approval Table"}
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
          )}
        </div>
      </div>
    </main>
  );
}

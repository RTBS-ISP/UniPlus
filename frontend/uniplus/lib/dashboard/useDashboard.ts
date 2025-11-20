"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  ApprovalAction,
  Attendee,
  EventData,
  ScheduleDay,
  Statistics,
  TableView,
  EventFeedback,
} from "@/lib/dashboard/types";
import {
  approveRejectOne,
  bulkApproval,
  checkInOne,
  fetchDashboard,
  fetchEventFeedback,
} from "@/lib/dashboard/api";
import { useAlert } from "@/app/components/ui/AlertProvider";

type FilterType =
  | "all"
  | "present"
  | "pending"
  | "approved"
  | "rejected"
  | "pending_approval";

type State = {
  loading: boolean;
  error: string;
  event: EventData | null;
  schedule: ScheduleDay[];
  attendees: Attendee[];
  statistics: Statistics | null;
  tableView: TableView;
  selectedDate: string;
  search: string;
  activeFilter: FilterType;
  selectedTickets: string[];
  bulkBusy: boolean;
  feedbacks: EventFeedback[];
};

export function useDashboard(eventId: string | undefined) {
  const alert = useAlert();

  const [state, setState] = useState<State>({
    loading: true,
    error: "",
    event: null,
    schedule: [],
    attendees: [],
    statistics: null,
    tableView: "approval",
    selectedDate: "",
    search: "",
    activeFilter: "all",
    selectedTickets: [],
    bulkBusy: false,
    feedbacks: [],
  });

  const load = useCallback(async () => {
    if (!eventId) return;
    setState((s) => ({ ...s, loading: true, error: "" }));
    try {
      const [data, feedbacks] = await Promise.all([
        fetchDashboard(eventId),
        fetchEventFeedback(eventId),
      ]);
      const schedule = data.schedule_days || [];

      setState((s) => {
        let nextSelected = s.selectedDate;
        if (!nextSelected) {
          nextSelected = schedule[0]?.date ?? "";
        } else if (!schedule.some((d) => d.date === nextSelected)) {
          nextSelected = schedule[0]?.date ?? nextSelected;
        }

        return {
          ...s,
          loading: false,
          event: data.event,
          schedule,
          attendees: data.attendees || [],
          statistics: data.statistics || null,
          selectedDate: nextSelected,
          feedbacks: feedbacks || [],
        };
      });
    } catch (e: any) {
      const msg = e?.message || "Failed to load dashboard.";
      setState((s) => ({ ...s, loading: false, error: msg }));
      alert({ text: msg, variant: "error" });
    }
  }, [eventId, alert]);

  useEffect(() => {
    load();
  }, [load]);

  // -------- visibleAttendees: TABLE ONLY (respects filter + search) --------
  const visibleAttendees = useMemo(() => {
    // 1) base list
    const base =
      state.tableView === "attendance"
        ? state.attendees.filter((a) => a.approvalStatus === "approved")
        : state.attendees;

    const q = state.search.trim().toLowerCase();

    // 2) per-day status for attendance view
    const withDayStatus: Attendee[] = base.map((a) => {
      if (state.tableView !== "attendance" || !state.selectedDate) {
        return a;
      }

      const checkedInDates = a.checkedInDates ?? {};
      const isPresentForSelectedDay = state.selectedDate in checkedInDates;

      return {
        ...a,
        eventDate: state.selectedDate,
        status: isPresentForSelectedDay ? "present" : "pending",
        checkedIn: isPresentForSelectedDay
          ? checkedInDates[state.selectedDate] || a.checkedIn
          : "",
      };
    });

    // 3) filter by activeFilter for each view
    const filteredByStatus = withDayStatus.filter((a) => {
      if (state.activeFilter === "all") return true;

      if (state.tableView === "attendance") {
        // attendance filter: "present" | "pending"
        return a.status === state.activeFilter;
      }

      // approval filter: "approved" | "pending" | "rejected"
      return a.approvalStatus === state.activeFilter;
    });

    // 4) search
    if (!q) return filteredByStatus;

    return filteredByStatus.filter((a) => {
      return (
        a.name.toLowerCase().includes(q) ||
        a.email.toLowerCase().includes(q) ||
        a.ticketId.toLowerCase().includes(q)
      );
    });
  }, [
    state.attendees,
    state.tableView,
    state.selectedDate,
    state.activeFilter,
    state.search,
  ]);

  // -------- attendanceStats: ALWAYS FROM FULL BASE, IGNORE FILTER + SEARCH --------
  const attendanceStats = useMemo(() => {
    if (state.tableView !== "attendance") {
      return { total: 0, present: 0, pending: 0, rate: 0 };
    }

    // all *approved* attendees for this event (same rule as table)
    const approved = state.attendees.filter(
      (a) => a.approvalStatus === "approved"
    );

    const total = approved.length;

    if (!state.selectedDate) {
      // no day selected yet -> treat all as pending
      return {
        total,
        present: 0,
        pending: total,
        rate: 0,
      };
    }

    let present = 0;

    approved.forEach((a) => {
      const checkedInDates = a.checkedInDates ?? {};
      if (state.selectedDate in checkedInDates) {
        present++;
      }
    });

    const pending = total - present;
    const rate = total > 0 ? (present / total) * 100 : 0;

    return { total, present, pending, rate };
  }, [state.attendees, state.tableView, state.selectedDate]);

  // -------- setters --------
  const setTableView = (v: TableView) =>
    setState((s) => ({
      ...s,
      tableView: v,
      activeFilter: "all",
      selectedTickets: [],
    }));

  const setSelectedDate = (d: string) =>
    setState((s) => ({
      ...s,
      selectedDate: d,
    }));

  const setSearch = (q: string) =>
    setState((s) => ({ ...s, search: q }));

  const setActiveFilter = (f: FilterType) =>
    setState((s) => ({ ...s, activeFilter: f }));

  const toggleTicket = (id: string) =>
    setState((s) => ({
      ...s,
      selectedTickets: s.selectedTickets.includes(id)
        ? s.selectedTickets.filter((x) => x !== id)
        : [...s.selectedTickets, id],
    }));

  const selectAll = () =>
    setState((s) => ({
      ...s,
      selectedTickets:
        s.selectedTickets.length === visibleAttendees.length
          ? []
          : visibleAttendees.map((a) => a.ticketId),
    }));

  // -------- approve/reject single ticket --------
  const approveReject = async (ticketId: string, action: ApprovalAction) => {
    if (!state.event) return;

    setState((s) => ({
      ...s,
      attendees: s.attendees.map((a) =>
        a.ticketId === ticketId
          ? {
              ...a,
              approvalStatus: action === "approve" ? "approved" : "rejected",
            }
          : a
      ),
    }));

    try {
      await approveRejectOne(String(state.event.id), ticketId, action);
      alert({ text: `Ticket ${ticketId} ${action}ed.`, variant: "success" });
      await load();
    } catch (err: any) {
      alert({ text: err?.message || "Action failed.", variant: "error" });
      await load();
    }
  };

  // -------- bulk approve/reject --------
  const bulkAct = async (action: ApprovalAction) => {
    if (!state.event) return;

    const selected = state.selectedTickets;
    const pendingIds = selected.filter((id) =>
      state.attendees.some(
        (a) => a.ticketId === id && a.approvalStatus === "pending"
      )
    );
    const skipped = selected.length - pendingIds.length;

    if (pendingIds.length === 0) {
      alert({
        text: "Some selected tickets are already processed — only pending ones can be updated.",
        variant: "warning",
      });
      return;
    }

    setState((s) => ({ ...s, bulkBusy: true }));
    try {
      const res = await bulkApproval(String(state.event.id), pendingIds, action);
      const processed = res?.processed_count ?? pendingIds.length;
      const msg =
        skipped > 0
          ? `Processed ${processed} ticket(s). Skipped ${skipped} already-processed.`
          : `Processed ${processed} ticket(s).`;
      alert({ text: msg, variant: "success" });
      await load();
    } catch (err: any) {
      alert({ text: err?.message || "Bulk action failed.", variant: "error" });
    } finally {
      setState((s) => ({
        ...s,
        bulkBusy: false,
        selectedTickets: [],
      }));
    }
  };

  // -------- check-in for selected date --------
  const checkIn = async (ticketId: string) => {
    if (!state.event) return;

    const trimmed = ticketId.trim();
    if (!trimmed) {
      alert({ text: "Please provide a Ticket ID.", variant: "info" });
      return;
    }

    if (!state.selectedDate) {
      alert({ text: "Please select a schedule day first.", variant: "warning" });
      return;
    }

    const a = state.attendees.find((x) => x.ticketId === trimmed);
    if (!a) {
      alert({
        text: `Ticket ${trimmed} not found for this event.`,
        variant: "warning",
      });
      return;
    }
    if (a.approvalStatus !== "approved") {
      alert({
        text: `Ticket ${trimmed} isn’t approved — cannot check in.`,
        variant: "warning",
      });
      return;
    }

    const now = new Date().toISOString();
    setState((s) => ({
      ...s,
      attendees: s.attendees.map((attendee) =>
        attendee.ticketId === trimmed
          ? {
              ...attendee,
              checkedIn: now,
              checkedInDates: {
                ...(attendee.checkedInDates || {}),
                [s.selectedDate]: now,
              },
            }
          : attendee
      ),
    }));

    try {
      const res = await checkInOne(
        String(state.event.id),
        trimmed,
        state.selectedDate
      );
      const msg =
        (res as any)?.message ||
        `Checked in ${trimmed} for ${state.selectedDate}.`;

      if (msg.toLowerCase().includes("already")) {
        alert({ text: msg, variant: "info" });
      } else {
        alert({ text: msg, variant: "success" });
      }
    } catch (err: any) {
      alert({ text: err?.message || "Check-in failed.", variant: "error" });
      await load();
    }
  };

  return {
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
    feedbacks: state.feedbacks,
  };
}

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  ApprovalAction,
  Attendee,
  EventData,
  ScheduleDay,
  Statistics,
  TableView,
} from "@/lib/dashboard/types";
import { approveRejectOne, bulkApproval, checkInOne, fetchDashboard } from "@/lib/dashboard/api";
import { useAlert } from "@/app/components/ui/AlertProvider";

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
  activeFilter: string;
  selectedTickets: string[];
  bulkBusy: boolean;
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
  });

  const load = useCallback(async () => {
    if (!eventId) return;
    setState((s) => ({ ...s, loading: true, error: "" }));
    try {
      const data = await fetchDashboard(eventId);
      setState((s) => ({
        ...s,
        loading: false,
        event: data.event,
        schedule: data.schedule_days || [],
        attendees: data.attendees || [],
        statistics: data.statistics || null,
        selectedDate: data.schedule_days?.[0]?.date ?? s.selectedDate,
      }));
    } catch (e: any) {
      const msg = e?.message || "Failed to load dashboard.";
      setState((s) => ({ ...s, loading: false, error: msg }));
      alert({ text: msg, variant: "error" });
    }
  }, [eventId, alert]);

  useEffect(() => {
    load();
  }, [load]);

  const visibleAttendees = useMemo(() => {
    const base =
      state.tableView === "attendance"
        ? state.attendees.filter((a) => a.approvalStatus === "approved")
        : state.attendees;

    const q = state.search.trim().toLowerCase();

    const withDayStatus: Attendee[] = base.map((a) => {
      if (state.tableView !== "attendance" || !state.selectedDate) return a;

      const checkedInDates = a.checkedInDates ?? [];
      const isPresentForSelectedDay = checkedInDates.includes(state.selectedDate);

      return {
        ...a,
        status: isPresentForSelectedDay ? "present" : "pending",
        checkedIn: isPresentForSelectedDay ? a.checkedIn : "",
      };
    });

    const filtered = withDayStatus.filter((a) => {
      const filterOk =
        state.tableView === "attendance"
          ? state.activeFilter === "all" || a.status === state.activeFilter
          : state.activeFilter === "all" || a.approvalStatus === state.activeFilter;

      if (!filterOk) return false;

      if (!q) return true;

      const searchOk =
        a.name.toLowerCase().includes(q) ||
        a.email.toLowerCase().includes(q) ||
        a.ticketId.toLowerCase().includes(q);

      return searchOk;
    });

    return filtered;
  }, [state.attendees, state.tableView, state.selectedDate, state.activeFilter, state.search]);

  const attendanceStats = useMemo(() => {
    const total = visibleAttendees.length;
    const present = visibleAttendees.filter((a) => a.status === "present").length;
    const pending = visibleAttendees.filter((a) => a.status === "pending").length;
    const rate = total > 0 ? (present / total) * 100 : 0;
    return { total, present, pending, rate };
  }, [visibleAttendees]);

  // setters
  const setTableView = (v: TableView) =>
    setState((s) => ({ ...s, tableView: v, activeFilter: "all", selectedTickets: [] }));

  const setSelectedDate = (d: string) =>
    setState((s) => ({
      ...s,
      selectedDate: d,
    }));

  const setSearch = (q: string) => setState((s) => ({ ...s, search: q }));
  const setActiveFilter = (f: string) => setState((s) => ({ ...s, activeFilter: f }));

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

  // approve/reject single ticket
  const approveReject = async (ticketId: string, action: ApprovalAction) => {
    if (!state.event) return;
    try {
      await approveRejectOne(String(state.event.id), ticketId, action);
      alert({ text: `Ticket ${ticketId} ${action}ed.`, variant: "success" });
      await load();
    } catch (err: any) {
      alert({ text: err?.message || "Action failed.", variant: "error" });
    }
  };

  // bulk approve/reject
  const bulkAct = async (action: ApprovalAction) => {
    if (!state.event) return;

    const selected = state.selectedTickets;
    const pendingIds = selected.filter((id) =>
      state.attendees.some((a) => a.ticketId === id && a.approvalStatus === "pending")
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
      setState((s) => ({ ...s, bulkBusy: false, selectedTickets: [] }));
    }
  };

  // check-in for specific selected date
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
      alert({ text: `Ticket ${trimmed} not found for this event.`, variant: "warning" });
      return;
    }
    if (a.approvalStatus !== "approved") {
      alert({ text: `Ticket ${trimmed} isn’t approved — cannot check in.`, variant: "warning" });
      return;
    }

    try {
      await checkInOne(String(state.event.id), trimmed, state.selectedDate);
      alert({ text: `Checked in ${trimmed} for ${state.selectedDate}.`, variant: "success" });
      await load();
    } catch (err: any) {
      alert({ text: err?.message || "Check-in failed.", variant: "error" });
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
  };
}

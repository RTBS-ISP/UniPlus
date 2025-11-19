import type { Attendee, EventData, ScheduleDay, Statistics } from "@/lib/dashboard/types";

const API_BASE = (process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000/api").replace(
  /\/$/,
  ""
);

async function getJSON<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const res = await fetch(input, { credentials: "include", ...init });
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      msg = (body as any)?.error || msg;
    } catch {
      /* ignore */
    }
    throw new Error(msg);
  }
  return res.json() as Promise<T>;
}

export async function fetchDashboard(eventId: string) {
  return await getJSON<{
    event: EventData;
    schedule_days: ScheduleDay[];
    attendees: Attendee[];
    statistics: Statistics;
  }>(`${API_BASE}/events/${eventId}/dashboard`);
}

export async function getCsrf(): Promise<string> {
  const data = await getJSON<{ csrftoken: string }>(`${API_BASE}/set-csrf-token`);
  return data.csrftoken;
}

export async function approveRejectOne(
  eventId: string,
  ticketId: string,
  action: "approve" | "reject"
) {
  const csrf = await getCsrf();
  const url =
    action === "approve"
      ? `${API_BASE}/events/${eventId}/registrations/${ticketId}/approve`
      : `${API_BASE}/events/${eventId}/registrations/${ticketId}/reject`;

  return await getJSON(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-CSRFToken": csrf,
    },
  });
}

export async function bulkApproval(
  eventId: string,
  ticket_ids: string[],
  action: "approve" | "reject"
) {
  const csrf = await getCsrf();
  return await getJSON<{ processed_count: number }>(
    `${API_BASE}/events/${eventId}/registrations/bulk-action`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": csrf,
      },
      body: JSON.stringify({ ticket_ids, action }),
    }
  );
}

// Check in for a specific date
export async function checkInOne(eventId: string, ticketId: string, date: string) {
  const csrf = await getCsrf();

  return await getJSON<{
    success: boolean;
    message: string;
    ticket_id: string;
    attendee_name: string;
    event_title: string;
    event_date?: string;
    already_checked_in: boolean;
    checked_in_at?: string;
    approval_status: string;
  }>(`${API_BASE}/checkin`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-CSRFToken": csrf,
    },
    body: JSON.stringify({
      qr_code: ticketId,
      event_date: date,
    }),
  });
}

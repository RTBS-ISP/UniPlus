export interface Attendee {
ticketId: string;
name: string;
email: string;
status: "present" | "pending" | "absent";
approvalStatus: "approved" | "pending" | "rejected";
registered: string;
approvedAt?: string;
rejectedAt?: string;
checkedIn: string;
eventDate: string;
phone?: string;
role?: string;
about_me?: any;
checkedInDates?: Record<string, string>;
}


export interface EventData {
id: number;
title: string;
description: string;
start_date: string;
end_date: string;
max_attendee: number;
}


export interface ScheduleDay {
date: string;
label: string;
start_time: string;
end_time: string;
location: string;
is_online: boolean;
}


export interface Statistics {
total_registered: number;
checked_in: number;
pending: number;
approved: number;
pending_approval: number;
rejected: number;
attendance_rate?: number;
}

export interface EventFeedback {
  id: number;
  rating: number;
  comment: string | null;
  created_at: string;
  updated_at: string;
  user_name: string;
  user_email: string;
}

export type TableView = "approval" | "attendance" | "feedback";
export type ApprovalAction = "approve" | "reject";
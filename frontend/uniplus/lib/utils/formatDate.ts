export function formatDate(dateInput: string | Date): string {
  if (!dateInput) return "-";
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return "-";

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
}

export function formatDateTime(s: string) {
  try {
    const d = new Date(s);
    return new Intl.DateTimeFormat("en-GB", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "Asia/Bangkok",
    }).format(d);
  } catch {
    return s;
  }
}

// Helper to get check-in time for a specific date
export function getCheckinTimeForDate(checkedInDates: Record<string, string> | undefined, eventDate: string): string | null {
  if (!checkedInDates || typeof checkedInDates !== 'object') return null;
  
  // Normalize the event date to YYYY-MM-DD format
  const normalizedDate = eventDate.length >= 10 ? eventDate.substring(0, 10) : eventDate;
  
  return checkedInDates[normalizedDate] || null;
}
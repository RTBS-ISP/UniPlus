export type EventSession = {
  date: string;
  startTime: string;
  endTime: string;
  location?: string;
  is_online: boolean;
  address?: string;
  address2?: string;
};

export function formatDateGB(s: string) {
  try {
    const d = new Date(s);
    return new Intl.DateTimeFormat("en-GB", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      timeZone: "UTC",
    }).format(d);
  } catch {
    return s;
  }
}

function dateKey(d: string) {
  return new Date(d + "T00:00:00Z").getTime();
}

export function groupConsecutiveSessions(sessions: EventSession[]) {
  if (!sessions?.length) return [];
  const sorted = [...sessions].sort((a, b) => dateKey(a.date) - dateKey(b.date));
  return sorted.map((s) => ({
    start: s.date,
    end: s.date,
    startTime: s.startTime,
    endTime: s.endTime,
    items: [s],
  }));
}

// Helper function to get full image URL
export const getImageUrl = (imagePath: string | null) => {
  if (!imagePath) {
    return "https://images.unsplash.com/photo-1604908176997-431651c0d2dc?q=80&w=1200&auto=format&fit=crop";
  }

  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
    return imagePath;
  }

  return `http://localhost:8000${imagePath.startsWith("/") ? "" : "/"}${imagePath}`;
};

import type { EventItem } from "../app/components/events/EventCard";

export const events: EventItem[] = [
  {
    id: 1,
    title: "Event 1",
    host: ["Organizer"],
    tags: ["Engineer", "Engineer", "Engineer", "Engineer", "Extra"],
    excerpt:
      "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy",
    date: "2025-10-12",
    createdAt: "2025-09-10T09:00:00Z",
    popularity: 78,
  },
  {
    id: 2,
    title: "Event 2",
    host: ["Organizer"],
    tags: ["Engineer", "Engineer", "Engineer", "Engineer", "Extra"],
    excerpt:
      "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy",
    date: "2025-11-02",
    createdAt: "2025-09-14T07:30:00Z",
    popularity: 55,
  },
  {
    id: 3,
    title: "Event 3",
    host: ["Organizer"],
    tags: ["Engineer", "Engineer", "Engineer", "Engineer", "Extra"],
    excerpt:
      "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy",
    date: "2025-09-25",
    createdAt: "2025-09-01T12:00:00Z",
    popularity: 88,
  },
  ...Array.from({ length: 47 }, (_, i) => ({
    id: i + 4,
    title: `Event ${i + 4}`,
    host: ["Organizer"],
    tags: ["Engineer", "Engineer", "Engineer", "Engineer", "Extra"],
    excerpt:
      "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy",
    date: `2025-10-${((i + 3) % 30) + 1}`,
    createdAt: `2025-09-${((i + 3) % 30) + 1}T09:00:00Z`,
    popularity: 80 - ((i + 3) % 50),
  })),
];
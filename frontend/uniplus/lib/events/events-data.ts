import { EventItem } from "../../app/components/events/EventCard";

/** --------- Extend the base card type just for this mock data --------- */
type EventSession = {
  date: string;      // "YYYY-MM-DD"
  startTime: string; // "HH:mm"
  endTime: string;   // "HH:mm"
};

export type EventItemPlus = EventItem & {
  // extra optional fields used by the detail page
  schedule?: EventSession[];
  capacity?: number;
  available?: number;
  address2?: string;
  image?: string;
};

/** --------- Static pools --------- */
<<<<<<< HEAD
const hostTypes = [["Organizer"], ["University"], ["Club"], ["Student"]];
=======
const hostTypes = [["Organizer"], ["Professor"], ["Student"]];
>>>>>>> origin/main

const tagSets = [
  ["Engineer", "Club", "Workshop"],
  ["Campus", "Extra"],
  ["AI", "Design", "Networking", "Panel"],
  ["Health", "Fitness"],
  ["Research", "Poster", "Education", "CV", "Career"],
];

const eventNames = [
  "KU Welcome Fair",
  "AI in Practice",
  "Design × Tech Meetup",
  "Student Research Showcase",
  "HackKU: 24-Hour Hackathon",
  "Career Fair",
  "Beginner Yoga on the Lawn",
  "Photography Walk",
  "Product Management 101",
  "Sustainability Forum",
  "Startup Pitch Night",
  "Music Jam Session",
  "Art Exhibition",
  "Coding Bootcamp",
  "Business Networking",
  "Robotics Demo",
  "Film Screening",
  "Food Festival",
  "Science Day",
  "Literature Panel",
  "Sports Tournament",
  "Mental Health Workshop",
  "Entrepreneurship Talk",
  "Language Exchange",
  "Dance Battle",
  "Chess Competition",
  "Volunteer Day",
  "Eco Awareness",
  "Cultural Night",
  "Quiz Bowl",
  "Board Game Night",
  "Photography Contest",
  "Resume Clinic",
  "Public Speaking Workshop",
  "Debate Championship",
  "Startup Mixer",
  "Career Mentoring",
  "Coding Challenge",
  "Art Therapy",
  "Music Production Lab",
  "Film Making Workshop",
  "Yoga Retreat",
  "Science Symposium",
  "Book Club",
  "TEDx University",
  "Poetry Slam",
  "Drama Play",
  "Fashion Show",
  "Cooking Class",
  "Language Workshop",
  "Social Impact Forum",
  "Alumni Meetup",
];

// 50 unique Unsplash links
const eventImages = [
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1551836022-d5d88e9218df?q=80&w=1600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=1600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1516251193007-45ef944ab0c6?q=80&w=1600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?q=80&w=1600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1549576490-b0b4831ef60a?q=80&w=1600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1469474968028-56623f02e42e?q=80&w=1600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=1600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1482192596544-9eb780fc7f66?q=80&w=1600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1492724441997-5dc865305da7?q=80&w=1600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1507874457470-272b3c8d8ee2?q=80&w=1600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1559028012-481c04fa702d?q=80&w=1600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?q=80&w=1600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1606166325683-1e6c00e94d4e?q=80&w=1600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1517602302552-471fe67acf66?q=80&w=1600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?q=80&w=1600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1509228627152-72ae9ae6848d?q=80&w=1600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?q=80&w=1600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1508804185872-d7badad00f7d?q=80&w=1600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?q=80&w=1600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?q=80&w=1600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1515169067865-5387ec356754?q=80&w=1600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?q=80&w=1600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1518544889280-cfb57c6a9d1d?q=80&w=1600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=1600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=1600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?q=80&w=1600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?q=80&w=1600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1607746882042-944635dfe10e?q=80&w=1600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1517849845537-4d257902454a?q=80&w=1600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=1600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1521791136064-7986c2920216?q=80&w=1600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?q=80&w=1600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?q=80&w=1600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1518600506278-4e8ef466b4c1?q=80&w=1600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1551434678-e076c223a692?q=80&w=1600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1581291519195-ef11498d1cf0?q=80&w=1600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?q=80&w=1600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1542204637-e67bc7d41e48?q=80&w=1600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1554306297-0c86e837d24b?q=80&w=1600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=1600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=1600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1503424886300-4d2baf6b2a12?q=80&w=1600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1515168833906-d2a3b82b82c5?q=80&w=1600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1527515637462-cff94eecc1f8?q=80&w=1600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1520975922320-273d4b8a9d6f?q=80&w=1600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1524594154908-edd336f68f6c?q=80&w=1600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1600&auto=format&fit=crop",
];

/** --------- Helpers to build schedules deterministically --------- */
function pad2(n: number) {
  return n.toString().padStart(2, "0");
}
function ymd(y: number, m: number, d: number) {
  return `${y}-${pad2(m)}-${pad2(d)}`;
}

/**
 * Pattern by index:
 * 0: single day
 * 1: two consecutive days (same time)
 * 2: three scattered days (different times)
 * 3: five consecutive days (same time)
 */
function buildSchedule(i: number): EventSession[] {
  const baseDay = (i % 20) + 3; // keep within month
  const y = 2025;
  const m = 10;

  const pattern = i % 4;

  if (pattern === 0) {
    return [{ date: ymd(y, m, baseDay), startTime: "10:00", endTime: "17:00" }];
  }
  if (pattern === 1) {
    return [
      { date: ymd(y, m, baseDay), startTime: "09:00", endTime: "16:00" },
      { date: ymd(y, m, baseDay + 1), startTime: "09:00", endTime: "16:00" },
    ];
  }
  if (pattern === 2) {
    return [
      { date: ymd(y, m, baseDay), startTime: "13:00", endTime: "16:00" },
      { date: ymd(y, m, baseDay + 2), startTime: "09:30", endTime: "12:00" },
      { date: ymd(y, m, baseDay + 5), startTime: "10:00", endTime: "17:00" },
    ];
  }
  // pattern === 3
  return Array.from({ length: 5 }, (_, k) => ({
    date: ymd(y, m, baseDay + k),
    startTime: "09:00",
    endTime: "16:00",
  }));
}

function firstDate(s: EventSession[]) {
  return s.length ? s.map(x => x.date).sort()[0] : `2025-10-01`;
}
function lastDate(s: EventSession[]) {
  return s.length ? s.map(x => x.date).sort().slice(-1)[0] : `2025-10-01`;
}

/** --------- Exported events with schedules --------- */
export const events: EventItemPlus[] = [
  ...Array.from({ length: 50 }, (_, i) => {
    const schedule = buildSchedule(i);
    const startDate = firstDate(schedule);
    const endDate = lastDate(schedule);

    // a mix of open/closed states; first is closed (0 available)
    const capacity = 100 + (i % 3) * 50;
    const available = i === 0 ? 0 : 20 + ((i * 17) % capacity);

    return {
      id: i + 1,
      title: eventNames[i % eventNames.length],
      host: hostTypes[i % hostTypes.length],
      tags: tagSets[i % tagSets.length].slice(
        0,
        (i % tagSets[i % tagSets.length].length) + 1
      ),
      excerpt:
        "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy.",
      // legacy single-date fields stay present for backward-compat (use first session)
      date: startDate,
      createdAt: `2025-09-${pad2(((i % 28) + 1))}T09:00:00Z`,
      popularity: 100 - i,

      // ---- Extra fields used by the detail page ----
      image: eventImages[i],
      location: "Campus Hall",
      address2: "Kasetsart University",
      capacity,
      available,
      startDate,     // derived from schedule
      endDate,       // derived from schedule
      startTime: schedule[0]?.startTime ?? "10:00",
      endTime: schedule[0]?.endTime ?? "17:00",

      // The new multi-day data
      schedule,
    };
  }),
];

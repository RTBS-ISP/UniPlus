import Link from "next/link";
import { Calendar, Clock, MapPin } from "lucide-react";


{/* Mock Tickets Data */}
const mockTickets = [
  {
    id: "63DA6DE0",
    title: "Software Engineering Seminar",
    code: "63DA6DE0",
    date: "13 October 2025",
    time: "12:00 PM - 5:00 PM",
    location: "Room 203, Building 15, Faculty of Engineer",
    tags: ["Year 1", "Technology", "Web Development"],
  },
  {
    id: "A1B2C3D4",
    title: "AI & Data Science Workshop",
    code: "A1B2C3D4",
    date: "20 November 2025",
    time: "09:00 AM - 4:00 PM",
    location: "Auditorium, Building 7",
    tags: ["Year 2", "AI", "Data Science"],
  },
  {
    id: "E5F6G7H8",
    title: "Mobile App Development",
    code: "E5F6G7H8",
    date: "15 December 2025",
    time: "10:00 AM - 3:00 PM",
    location: "Lab 101, Building 3",
    tags: ["Year 3", "Mobile", "Programming"],
  },
];

export default function TicketCard() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {mockTickets.map((ticket) => (
        <Link
          key={ticket.id}
          href={`/mytickets/${ticket.id}`}
          className="rounded-lg shadow-sm bg-white flex flex-col transition-transform hover:scale-[1.02] hover:shadow-md"
        >
          {/* Header */}
          <div className="flex items-center rounded-t-lg w-full h-24 bg-indigo-500">
            <div className="flex flex-col p-6 gap-y-3">
              <h2 className="text-white text-xl font-bold">{ticket.title}</h2>
              <p className="text-white text-sm font-medium">{ticket.code}</p>
            </div>
          </div>

          {/* Detail Section */}
          <div className="p-6 flex-1 flex flex-col">
            <div className="flex gap-x-2 mb-2">
              <Calendar size={20} className="text-indigo-500"/>
              <p className="text-gray-800 text-sm">{ticket.date}</p>
            </div>
            <div className="flex gap-x-2 mb-2">
              <Clock size={20} className="text-indigo-500"/>
              <p className="text-gray-800 text-sm">{ticket.time}</p>
            </div>
            <div className="flex gap-x-2 mb-4">
              <MapPin size={20} className="text-indigo-500"/>
              <p className="text-gray-800 text-sm">{ticket.location}</p>
            </div>
            <hr className="mb-4" />

            {/* Tags Section */}
            <div className="flex flex-wrap gap-2 mt-auto">
              {ticket.tags.map((tag, i) => (
                <span
                  key={i}
                  className="px-3 py-1 bg-indigo-100 text-gray-800 text-sm font-bold rounded-lg"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

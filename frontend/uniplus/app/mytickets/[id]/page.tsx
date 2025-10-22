"use client"
import Navbar from "../../components/navbar"
import { Calendar, Clock, MapPin, ArrowLeft, User, Mail } from "lucide-react"
import Link from "next/link"

const mockTicket = {
  title: "Test 1",
  code: "63DA6DE0",
  date: "13 October 2025",
  time: "2:00 PM - 5:00 PM",
  location: "Room 203, Building 15, Faculty of Engineering",
  tags: ["Year 1", "Technology", "Web Development"],
  holder: {
    name: "John Doe",
    email: "john@example.com"
  },
  organizer: "Test Account",
  registeredOn: "8 October 2025"
};

function TicketDetailPage () {
  return (
    <main>
      <Navbar/>
      <div className="min-h-screen bg-indigo-100">
        {/* Back Button */}
        <div className="max-w-7xl mx-auto px-8 pt-16">
          <Link href="/mytickets" className="flex items-center gap-2 hover:opacity-80 transition-opacity w-fit">
            <ArrowLeft size={18} className="text-gray-800"/>
            <p className="text-gray-800 font-medium">Back to My Tickets</p>
          </Link>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="rounded-lg shadow-sm bg-white overflow-hidden">
            {/* Header Section with Tags */}
            <div className="bg-indigo-500 p-8">
              <h1 className="text-white text-4xl font-bold mb-4">{mockTicket.title}</h1>
              <div className="flex flex-wrap gap-2">
                {mockTicket.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-4 py-1.5 bg-indigo-100 text-gray-800 text-sm font-semibold rounded-lg"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-8">
              {/* Left Column */}
              <div className="space-y-8">
                {/* Event Details */}
                <div>
                  <h2 className="text-gray-800 font-bold text-lg mb-4">EVENT DETAILS</h2>
                  
                  <div className="space-y-4">
                    <div className="flex gap-4">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-indigo-100">
                        <Calendar size={20} className="text-indigo-500"/>
                      </div>
                      <div>
                        <p className="text-gray-800 text-sm">Date</p>
                        <p className="text-gray-800 font-semibold">{mockTicket.date}</p>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-indigo-100">
                        <Clock size={20} className="text-indigo-500"/>
                      </div>
                      <div>
                        <p className="text-gray-800 text-sm">Time</p>
                        <p className="text-gray-800 font-semibold">{mockTicket.time}</p>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-indigo-100">
                        <MapPin size={20} className="text-indigo-500"/>
                      </div>
                      <div>
                        <p className="text-gray-800 text-sm">Location</p>
                        <p className="text-gray-800 font-semibold">{mockTicket.location}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Ticket Holder */}
                <div>
                  <h2 className="text-gray-800 font-bold text-lg mb-4">TICKET HOLDER</h2>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <User size={20} className="text-gray-800"/>
                      <p className="text-gray-800 font-semibold">{mockTicket.holder.name}</p>
                    </div>

                    <div className="flex items-center gap-3">
                      <Mail size={20} className="text-gray-800"/>
                      <p className="text-gray-800">{mockTicket.holder.email}</p>
                    </div>
                  </div>
                </div>

                {/* Additional Info */}
                <div className="bg-indigo-100 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-800">Organized by</span>
                    <span className="text-gray-800 font-semibold">{mockTicket.organizer}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-800">Registered on</span>
                    <span className="text-gray-800 font-semibold">{mockTicket.registeredOn}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-800">Ticket ID</span>
                    <span className="text-gray-800 font-semibold">{mockTicket.code}</span>
                  </div>
                </div>
              </div>

              {/* Right Column - QR Code */}
              <div className="flex flex-col items-center justify-start">
                <div className="w-full max-w-sm aspect-square bg-gray-200 rounded-lg flex items-center justify-center">
                  {/* Placeholder for QR Code */}
                  <div className="text-gray-400 text-center">
                    <p className="text-sm">QR Code</p>
                  </div>
                </div>
                <p className="text-center text-gray-800 text-sm mt-4 max-w-sm">
                  Present this QR code at the event entrance for verification
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
export default TicketDetailPage
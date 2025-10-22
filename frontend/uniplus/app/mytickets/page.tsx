"use client"
import Navbar from "../components/navbar"
import TicketCard from "../components/mytickets/TicketCard";
import { useState } from "react"

function MyTicketPage () {
  const [activeFilter, setActiveFilter] = useState("all");

  return (
    <main>
        <Navbar/>
        <div className="min-h-screen bg-indigo-100">
            {/* Header */}
            <div className="flex flex-col gap-y-5 max-w-7xl mx-auto px-8 py-8">
                <h1 className="text-gray-800 text-5xl font-extrabold pt-10">My Tickets</h1>
                <p className="text-gray-800 font-medium">Your personal event collection</p>
            </div>

            {/* Search & Filter Section */}
            <div className="max-w-7xl mx-auto px-8 py-2">
                <div className="rounded-lg shadow-sm p-8 mb-8 bg-white">
                    <input
                        type="text"
                        placeholder="Search your tickets.."
                        className="flex-1 px-4 py-3 w-full rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition text-gray-800 placeholder-gray-400"
                    />
                    <div className="flex mt-4 gap-2">
                        <button 
                        onClick={() => setActiveFilter("all")}
                        className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
                        activeFilter === "all" 
                            ? "bg-indigo-500 text-white" 
                            : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                        }`}
                        >
                            All (3)
                        </button>
                        <button 
                            onClick={() => setActiveFilter("present")}
                            className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
                            activeFilter === "present" 
                                ? "bg-indigo-500 text-white" 
                                : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                            }`}
                        >
                            Upcoming (2)
                        </button>
                        <button 
                            onClick={() => setActiveFilter("pending")}
                            className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
                            activeFilter === "pending" 
                                ? "bg-indigo-500 text-white" 
                                : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                            }`}
                        >
                            Past (1)
                        </button>
                    </div>
                </div>
            </div>
            <div className="max-w-7xl mx-auto px-8 py-2">
                <div className="max-h-3xl">
                    <TicketCard/>
                </div>
            </div>
        </div>
    </main>
  )
}
export default MyTicketPage


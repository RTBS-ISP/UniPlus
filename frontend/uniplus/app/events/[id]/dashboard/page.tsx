import Navbar from "../../../components/navbar"; 
import { QrCode, UserCheck, User, Clock } from "lucide-react";

export default function DashBoardPage() {
  const totalRegistered = 100;
  const checkedIn = 32;
  const pending = totalRegistered - checkedIn;
  const attendanceRate = (checkedIn / totalRegistered) * 100;

  return (
    <main>
      <Navbar />
      <div className="min-h-screen bg-indigo-100">
        {/* Header */}
        <div className="flex flex-col items-start max-w-7xl pl-52 pt-5 gap-y-4">
          <h1 className="text-gray-800 text-5xl font-extrabold pt-10">Test 1</h1>
          <div className="text-gray-800 font-medium">
            Event ID: <span className="text-gray-800 font-bold">E1212312121</span>
          </div>
          <button
            type="submit"
            className="inline-flex items-center justify-center w-full px-4 py-1 text-base font-bold leading-6 text-white bg-indigo-500 border border-transparent rounded-lg md:w-auto hover:bg-indigo-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Refresh
          </button>
        </div>

        {/* Stats Cards */}
        <div className="flex flex-col items-center justify-center rounded-lg mt-10 mx-52 bg-white">
          <div className="grid grid-cols-2 gap-6 w-full p-10">
            {/* Total Registered */}
            <div className="bg-indigo-500 rounded-lg p-6 flex flex-row shadow-md">
              <div className="flex flex-col items-start gap-y-2.5 ml-4 w-full">
                <User size={32} className="font-extrabold"/>
                <div className="text-white font-extrabold mt-2">Total Registered</div>
              </div>
              <div className="flex text-white text-3xl font-extrabold w-full justify-end">{totalRegistered}</div>
            </div>

            {/* Checked In */}
            <div className="bg-lime-500 rounded-lg p-6 flex flex-rowshadow-md">
              <div className="flex flex-col items-start gap-y-2.5 ml-4 w-full">
                <UserCheck size={32} className="font-extrabold"/>
                <div className="text-white font-extrabold mt-2">Checked In</div>
              </div>
              <div className="flex text-white text-3xl font-extrabold w-full justify-end">{checkedIn}</div>
            </div>

            {/* Pending */}
            <div className="bg-yellow-400 rounded-lg p-6 flex flex-row shadow-md">
              <div className="flex flex-col items-start gap-y-2.5 ml-4 w-full">
                <Clock size={32} className="font-extrabold"/>
                <div className="text-white font-extrabold mt-2">Pending Check-In</div>
              </div>
              <div className="flex text-white text-3xl font-extrabold w-full justify-end">{pending}</div>
            </div>

            {/* Attendance Rate */}
            <div className="bg-pink-400 rounded-lg p-6 flex flex-col shadow-md w-full">
              <div className="text-white text-3xl font-bold">
                {attendanceRate.toFixed(0)}%
              </div>
              <div className="text-white mt-2 font-extrabold">Attendance Rate</div>

              {/* Progress bar */}
              <div className="w-full bg-gray-300 h-2 rounded-full mt-3">
                <div
                  className="h-2 bg-white rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${attendanceRate}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* QR Code Section */}
        <div className="flex flex-col items-center justify-center rounded-lg mt-10 mx-52 p-10 bg-white">
          <div className="flex flex-row items-center w-full mb-2 gap-3">
            <div className="p-3 bg-indigo-100 rounded-lg">
              <QrCode size={42} className="text-indigo-500" />
            </div>
            <div className="flex flex-col w-full">
              <div className="text-gray-800 text-3xl font-extrabold w-full">
                QR Code Scanner
              </div>
              <div className="text-gray-400 text-base font-medium w-full">
                Scan attendee tickets for instant check-in
              </div>
            </div>
          </div>

          <div className="flex flex-row w-full gap-x-2">
            <input
              type="text"
              placeholder="Scan QR code or enter Ticket ID (e.g., T123456)"
              className="w-7xl px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition text-gray-800 placeholder-gray-400"
            />
            <button
              type="submit"
              className="inline-flex items-center justify-center w-full px-4 py-1 text-base font-bold leading-6 text-white bg-indigo-500 border border-transparent rounded-lg md:w-auto hover:bg-indigo-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <UserCheck className="mr-1"/> Check In
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

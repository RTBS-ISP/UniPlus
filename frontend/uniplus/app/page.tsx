import Image from "next/image"; 
import Navbar from "./components/navbar"; 
import {Sparkles, ArrowRight, ArrowDown} from 'lucide-react';

export default function page() { 
  return ( 
    <main>
      <div className="min-h-screen bg-[#E9E9F4]">
          <Navbar />
          
          {/*Hero Section*/}
          <div className="mt-40 flex justify-center">
            <div className="p-10 rounded-xl max-w-screen text-center">
                <div className="inline-flex items-center px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full border border-indigo-200 shadow-lg hover:shadow-xl transition-shadow duration-300">
                  <Sparkles className="w-4 h-4 mr-2 text-indigo-500 animate-spin" style={{ animationDuration: '3s' }} />
                  <span className="text-sm font-semibold text-indigo-700">Your Campus, Your Events</span>
                </div>
                <h1 className="mt-5 text-5xl md:text-6xl font-extrabold text-gray-900 leading-tight tracking-tight"> 
                  <span className="text-indigo-400 block relative animate-fade-in-right">University life</span>
                  <span className="text-black block">is more than lectures.</span>
                  <span>Discover your next favorite event with <span className="text-indigo-400">UniPLUS</span>.</span> 
                </h1>
                <a href='#' className='mt-10 bg-indigo-400 border-black text-white text-xl md:text-xl lg:text-2xl rounded-xl px-12 py-4 inline-flex items-center font-bold hover:scale-105 hover:shadow-2xl transition-all duration-300'> 
                  <span>Browse Events</span>
                  <ArrowRight className="w-5 h-5 ml-3" />
                </a> 
            </div>
          </div>

          <div className="mt-70 flex justify-center">
            <div className="w-16 h-16 rounded-full shadow-2xl shadow-indigo-400 flex items-center justify-center animate-bounce bg-white">
              <ArrowDown className="w-6 h-6 text-indigo-500" />
            </div>
          </div>
          
          {/*Feature Section*/}
          <div className="mt-100 p-10 flex flex-col bg-white">
            <div className="mt-5 text-3xl md:text-4xl font-extrabold text-center text-black">
              Everything You Need in One Platform
            </div>
            <div className="mt-5 flex flex-col mx-auto">

              {/*First Row*/}
              <div className="mt-5 flex flex-row gap-x-5">
                <div className="flex flex-col p-8 rounded-2xl max-w-md w-full min-h-[300px] text-left transition-transform duration-300 ease-in-out hover:shadow-2xl hover:scale-105 bg-indigo-200">
                    <div className="w-16 h-16 mb-5 rounded-full shadow-xl flex items-center justify-center bg-white">
                      🎯
                    </div>
                    <div className="mb-2 text-xl text-black font-bold">
                      Smart Discovery
                    </div>
                    <div className="text-base text-black">
                      Find events that match you interests with intelligent filtering by category, date, and location.
                    </div>
                </div>

                <div className="flex flex-col p-8 rounded-2xl max-w-md w-full min-h-[300px] text-left transition-transform duration-300 ease-in-out hover:shadow-2xl hover:scale-105 bg-indigo-200">
                    <div className="w-16 h-16 mb-5 rounded-full shadow-xl flex items-center justify-center bg-white">
                      📱
                    </div>
                    <div className="mb-2 text-xl text-black font-bold">
                      QR Code Tickets
                    </div>
                    <div className="text-base text-black">
                      Get unique QR code tickets for seamless check-in and attendance tracking at any event.
                    </div>
                </div>

                <div className="flex flex-col p-8 rounded-2xl max-w-md w-full min-h-[300px] text-left transition-transform duration-300 ease-in-out hover:shadow-2xl hover:scale-105 bg-indigo-200">
                    <div className="w-16 h-16 mb-5 rounded-full shadow-xl flex items-center justify-center bg-white">
                      📊
                    </div>
                    <div className="mb-2 text-xl text-black font-bold">
                      Event Analytics
                    </div>
                    <div className="text-base text-black">
                      Organizers get detailed insights with automated Google Sheets integration and feedback reports.
                    </div>
                </div>
              </div>

              {/*Second Row*/}
              <div className="mt-5 flex flex-row gap-x-5">
                <div className="flex flex-col p-8 rounded-2xl max-w-md w-full min-h-[300px] text-left transition-transform duration-300 ease-in-out hover:shadow-2xl hover:scale-105 bg-indigo-200">
                    <div className="w-16 h-16 mb-5 rounded-full shadow-xl flex items-center justify-center bg-white">
                      🔒
                    </div>
                    <div className="mb-2 text-xl text-black font-bold">
                      Quality Control
                    </div>
                    <div className="text-base text-black">
                      Admin approval system ensures all events meet university standards before going live.
                    </div>
                </div>

                <div className="flex flex-col p-8 rounded-2xl max-w-md w-full min-h-[300px] text-left transition-transform duration-300 ease-in-out hover:shadow-2xl hover:scale-105 bg-indigo-200">
                    <div className="w-16 h-16 mb-5 rounded-full shadow-xl flex items-center justify-center bg-white">
                      ⭐️
                    </div>
                    <div className="mb-2 text-xl text-black font-bold">
                      Feedback System
                    </div>
                    <div className="text-base text-black">
                      Rate and review events to help improve futre experiences and guide other students.
                    </div>
                </div>

                <div className="flex flex-col p-8 rounded-2xl max-w-md w-full min-h-[300px] text-left transition-transform duration-300 ease-in-out hover:shadow-2xl hover:scale-105 bg-indigo-200">
                    <div className="w-16 h-16 mb-5 rounded-full shadow-xl flex items-center justify-center bg-white">
                      📈
                    </div>
                    <div className="mb-2 text-xl text-black font-bold">
                      Track History
                    </div>
                    <div className="text-base text-black">
                      Keep track of all events you've attended and build your campus involement portfolio.
                    </div>
                </div>
              </div>
            </div>
          </div>
      </div>
    </main>
); }

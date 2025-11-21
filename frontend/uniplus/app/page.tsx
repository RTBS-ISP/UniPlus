'use client';
import React, { useState, useEffect } from 'react';
import Navbar from "./components/navbar";
import { Sparkles, ArrowDown, Calendar, Users, MapPin } from 'lucide-react';

export default function Page() {
  const [currentEvent, setCurrentEvent] = useState(0);
  const [animatedNumber, setAnimatedNumber] = useState(0);

  const mockEvents = [
    { title: "Tech Talk: AI in Education", date: "Sept 15", attendees: 85, location: "Hall A" },
    { title: "Cultural Night 2024", date: "Sept 20", attendees: 200, location: "Main Auditorium" },
    { title: "Career Fair", date: "Sept 25", attendees: 150, location: "Student Center" },
  ];

  useEffect(() => {
    const eventInterval = setInterval(() => {
      setCurrentEvent((prev) => (prev + 1) % mockEvents.length);
    }, 3000);

    const numberInterval = setInterval(() => {
      setAnimatedNumber((prev) => (prev >= 847 ? 0 : prev + 7));
    }, 50);

    return () => {
      clearInterval(eventInterval);
      clearInterval(numberInterval);
    };
  }, []);

  return (
    <main>
      <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-white to-purple-50 relative overflow-hidden">
        <Navbar />
        
        {/* MASCOT PATTERN BACKGROUND - Sliding rows */}
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
          {/* Generate consistent grid of mascots - 5 rows x 10 columns = 50 mascots */}
          {[0, 1, 2, 3, 4].map((row) => (
            <div
              key={row}
              className={`absolute w-full ${row % 2 === 0 ? 'animate-slide-right' : 'animate-slide-left'}`}
              style={{
                top: `${row * 20 + 5}%`,
                height: '100px',
              }}
            >
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((col) => {
                const index = row * 10 + col;
                const monkeyNum = (index % 5) + 1; // Cycle through monkey_1 to monkey_5
                
                return (
                  <div
                    key={`${row}-${col}`}
                    className="absolute"
                    style={{
                      left: `${col * 10 + 2}%`,
                      width: '100px',
                      height: '100px',
                      opacity: 0.05,
                    }}
                  >
                    <img
                      src={`/images/monkey_${monkeyNum}.png`}
                      alt=""
                      className="w-full h-full object-contain"
                    />
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        
        {/* Background Elements */}
        <div className="absolute top-[-100px] left-[-100px] w-[300px] h-[300px] bg-indigo-200 rounded-full blur-3xl opacity-40 z-0" />
        <div className="absolute bottom-[-100px] right-[-100px] w-[300px] h-[300px] bg-purple-300 rounded-full blur-3xl opacity-30 z-0"/>
        <div className="absolute top-[20%] right-[10%] w-[200px] h-[200px] bg-pink-200 rounded-full blur-2xl opacity-20 animate-pulse z-0" />
        <div className="absolute bottom-[30%] left-[5%] w-[150px] h-[150px] bg-yellow-200 rounded-full blur-2xl opacity-25 animate-pulse z-0" style={{ animationDelay: '1s' }} />

        {/* Hero Section */}
        <div className="pt-48 px-10 relative z-10">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-16 items-start relative">
              
              {/* Left Side - Main Content */}
              <div className="text-center lg:text-left z-10">
                <div className="inline-flex items-center px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full border border-indigo-200 shadow-lg hover:shadow-xl transition-all duration-300 group">
                  <Sparkles className="w-4 h-4 mr-2 text-indigo-500 animate-spin group-hover:animate-pulse" style={{ animationDuration: '3s' }} />
                  <span className="text-sm font-semibold text-indigo-700">Your Campus, Your Events</span>
                </div>
                
                <h1 className="mt-8 text-4xl lg:text-6xl font-extrabold text-gray-900 leading-tight tracking-tight"> 
                  <span className="text-indigo-400 block animate-fade-in">
                    University life <span className="text-black">is more than lectures.</span>
                  </span>
                  <span className="animate-fade-in" style={{ animationDelay: '0.3s' }}>
                    Discover your next favorite event with <span className="text-indigo-400 relative">
                      UniPLUS
                      <span className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full transform scale-x-0 animate-expand" style={{ animationDelay: '1s' }}></span>
                    </span>.
                  </span> 
                </h1>
                
                <p className="mt-6 text-lg text-gray-600 max-w-xl mx-auto lg:mx-0">
                  Join thousands of students discovering amazing campus events, from tech talks to cultural nights.
                </p>
                
                <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <a href="/events" className="relative inline-flex items-center justify-center px-8 py-4 overflow-hidden font-medium text-white transition duration-300 ease-out border-2 border-indigo-400 rounded-xl shadow-lg group hover:shadow-2xl">
                    <span className="absolute inset-0 flex items-center justify-center w-full h-full text-white duration-300 -translate-x-full bg-gradient-to-r from-indigo-500 to-purple-500 group-hover:translate-x-0 ease">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                      </svg>
                    </span>
                    <span className="absolute flex items-center justify-center w-full h-full text-xl text-black font-extrabold transition-all duration-300 transform group-hover:translate-x-full ease">
                      Browse Events
                    </span>
                    <span className="relative invisible">Browse Events</span>
                  </a>
                  
                  <a href="/login" className="px-8 py-4 text-indigo-600 font-semibold border-2 border-transparent hover:border-indigo-200 rounded-xl transition-all duration-300 hover:bg-white/50 backdrop-blur-sm text-center">
                    Get Started
                  </a>
                </div>
              </div>

              {/* Right Side - BIG MONKEY MASCOT */}
              <div className="relative flex justify-center lg:justify-end -mt-8 lg:-mt-16">
                {/* HUGE MONKEY - Aligned higher */}
                <div className="w-full max-w-[700px] h-[700px] relative z-10">
                  <img 
                    src="/images/monkey_1.png" 
                    alt="UniPlus Mascot" 
                    className="w-full h-full object-contain drop-shadow-2xl animate-float-main"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="mt-24 flex justify-center relative z-10">
          <button
            onClick={() => {
              document.getElementById('features-section')?.scrollIntoView({ 
                behavior: 'smooth',
                block: 'start'
              });
            }}
            className="w-16 h-16 rounded-full shadow-2xl shadow-indigo-400/50 flex items-center justify-center animate-bounce bg-white hover:bg-indigo-50 transition-colors duration-300 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-400"
            aria-label="Scroll to features"
          >
            <ArrowDown className="w-6 h-6 text-indigo-500" />
          </button>
        </div>

        {/*Feature Section*/}
        <div id="features-section" className="mt-32 p-10 flex flex-col bg-white relative scroll-mt-20 z-10">
          {/* MASCOT 4 - Feature Section Top Right */}
          <div className="absolute right-10 top-10 w-[200px] h-[200px] opacity-10 pointer-events-none hidden xl:block">
            <img 
              src="/images/monkey_4.png" 
              alt="UniPlus Mascot" 
              className="w-full h-full object-contain animate-float"
            />
          </div>

          {/* MASCOT 5 - Feature Section Left Side */}
          <div className="absolute left-10 top-[40%] w-[180px] h-[180px] opacity-8 pointer-events-none hidden xl:block">
            <img 
              src="/images/monkey_5.png" 
              alt="UniPlus Mascot" 
              className="w-full h-full object-contain animate-float-slow"
            />
          </div>

          <div className="mt-5 text-3xl md:text-4xl font-extrabold text-center text-black relative z-10">
            Everything You Need in One Platform
          </div>
          <div className="mt-10 flex flex-col mx-auto max-w-7xl relative z-10">

            {/*First Row*/}
            <div className="flex flex-col lg:flex-row gap-5 justify-center">
              <div className="flex flex-col p-8 rounded-2xl max-w-md w-full min-h-[280px] text-left transition-transform duration-300 ease-in-out hover:shadow-2xl hover:scale-105 bg-indigo-200 relative overflow-hidden group">
                  <div className="absolute right-[-20px] bottom-[-20px] w-[120px] h-[120px] opacity-0 group-hover:opacity-30 transition-opacity duration-300 pointer-events-none">
                    <img src="/images/monkey_1.png" alt="" className="w-full h-full object-contain" />
                  </div>
                  <div className="w-16 h-16 mb-5 rounded-full shadow-xl flex items-center justify-center bg-white text-3xl">
                    🎯
                  </div>
                  <div className="mb-2 text-xl text-black font-bold">
                    Smart Discovery
                  </div>
                  <div className="text-base text-gray-700">
                    Find events that match your interests with intelligent filtering by category, date, and location.
                  </div>
              </div>

              <div className="flex flex-col p-8 rounded-2xl max-w-md w-full min-h-[280px] text-left transition-transform duration-300 ease-in-out hover:shadow-2xl hover:scale-105 bg-purple-200 relative overflow-hidden group">
                  <div className="absolute right-[-20px] bottom-[-20px] w-[120px] h-[120px] opacity-0 group-hover:opacity-30 transition-opacity duration-300 pointer-events-none">
                    <img src="/images/monkey_2.png" alt="" className="w-full h-full object-contain" />
                  </div>
                  <div className="w-16 h-16 mb-5 rounded-full shadow-xl flex items-center justify-center bg-white text-3xl">
                    📱
                  </div>
                  <div className="mb-2 text-xl text-black font-bold">
                    QR Code Tickets
                  </div>
                  <div className="text-base text-gray-700">
                    Get unique QR code tickets for seamless check-in and attendance tracking at any event.
                  </div>
              </div>

              <div className="flex flex-col p-8 rounded-2xl max-w-md w-full min-h-[280px] text-left transition-transform duration-300 ease-in-out hover:shadow-2xl hover:scale-105 bg-pink-200 relative overflow-hidden group">
                  <div className="absolute right-[-20px] bottom-[-20px] w-[120px] h-[120px] opacity-0 group-hover:opacity-30 transition-opacity duration-300 pointer-events-none">
                    <img src="/images/monkey_3.png" alt="" className="w-full h-full object-contain" />
                  </div>
                  <div className="w-16 h-16 mb-5 rounded-full shadow-xl flex items-center justify-center bg-white text-3xl">
                    📊
                  </div>
                  <div className="mb-2 text-xl text-black font-bold">
                    Event Analytics
                  </div>
                  <div className="text-base text-gray-700">
                    Organizers get detailed insights with real-time dashboards and attendance reports.
                  </div>
              </div>
            </div>

            {/*Second Row*/}
            <div className="mt-5 flex flex-col lg:flex-row gap-5 justify-center">
              <div className="flex flex-col p-8 rounded-2xl max-w-md w-full min-h-[280px] text-left transition-transform duration-300 ease-in-out hover:shadow-2xl hover:scale-105 bg-yellow-200 relative overflow-hidden group">
                  <div className="absolute right-[-20px] bottom-[-20px] w-[120px] h-[120px] opacity-0 group-hover:opacity-30 transition-opacity duration-300 pointer-events-none">
                    <img src="/images/monkey_4.png" alt="" className="w-full h-full object-contain" />
                  </div>
                  <div className="w-16 h-16 mb-5 rounded-full shadow-xl flex items-center justify-center bg-white text-3xl">
                    🔒
                  </div>
                  <div className="mb-2 text-xl text-black font-bold">
                    Quality Control
                  </div>
                  <div className="text-base text-gray-700">
                    Admin approval system ensures all events meet university standards before going live.
                  </div>
              </div>

              <div className="flex flex-col p-8 rounded-2xl max-w-md w-full min-h-[280px] text-left transition-transform duration-300 ease-in-out hover:shadow-2xl hover:scale-105 bg-green-200 relative overflow-hidden group">
                  <div className="absolute right-[-20px] bottom-[-20px] w-[120px] h-[120px] opacity-0 group-hover:opacity-30 transition-opacity duration-300 pointer-events-none">
                    <img src="/images/monkey_5.png" alt="" className="w-full h-full object-contain" />
                  </div>
                  <div className="w-16 h-16 mb-5 rounded-full shadow-xl flex items-center justify-center bg-white text-3xl">
                    ⭐
                  </div>
                  <div className="mb-2 text-xl text-black font-bold">
                    Feedback System
                  </div>
                  <div className="text-base text-gray-700">
                    Rate and review events to help improve future experiences and guide other students.
                  </div>
              </div>

              <div className="flex flex-col p-8 rounded-2xl max-w-md w-full min-h-[280px] text-left transition-transform duration-300 ease-in-out hover:shadow-2xl hover:scale-105 bg-blue-200 relative overflow-hidden group">
                  <div className="absolute right-[-20px] bottom-[-20px] w-[120px] h-[120px] opacity-0 group-hover:opacity-30 transition-opacity duration-300 pointer-events-none">
                    <img src="/images/monkey_6.png" alt="" className="w-full h-full object-contain" />
                  </div>
                  <div className="w-16 h-16 mb-5 rounded-full shadow-xl flex items-center justify-center bg-white text-3xl">
                    📈
                  </div>
                  <div className="mb-2 text-xl text-black font-bold">
                    Track History
                  </div>
                  <div className="text-base text-gray-700">
                    Keep track of all events you've attended and build your campus involvement portfolio.
                  </div>
              </div>
            </div>
          </div>

          {/* MASCOT 7 - Footer Center */}
          <div className="mt-20 flex justify-center relative z-10">
            <div className="relative w-[280px] h-[280px] group">
              <img 
                src="/images/monkey_7.png" 
                alt="UniPlus Mascot" 
                className="w-full h-full object-contain drop-shadow-2xl transition-transform duration-300 group-hover:scale-110"
              />
              <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <p className="text-indigo-600 font-bold text-lg whitespace-nowrap">Ready to explore? 🎉</p>
              </div>
            </div>
          </div>

          {/* Small mascot decoration at bottom */}
          <div className="mt-16 flex justify-center gap-8 opacity-20">
            <img src="/images/monkey_1.png" alt="" className="w-16 h-16 object-contain animate-bounce" style={{ animationDelay: '0s' }} />
            <img src="/images/monkey_2.png" alt="" className="w-16 h-16 object-contain animate-bounce" style={{ animationDelay: '0.2s' }} />
            <img src="/images/monkey_3.png" alt="" className="w-16 h-16 object-contain animate-bounce" style={{ animationDelay: '0.4s' }} />
            <img src="/images/monkey_4.png" alt="" className="w-16 h-16 object-contain animate-bounce" style={{ animationDelay: '0.6s' }} />
            <img src="/images/monkey_5.png" alt="" className="w-16 h-16 object-contain animate-bounce" style={{ animationDelay: '0.8s' }} />
          </div>
        </div>
      </div>

      {/* Add animations */}
      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes expand {
          from { transform: scaleX(0); }
          to { transform: scaleX(1); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes float-main {
          0%, 100% { transform: translateY(0px) rotate(-2deg); }
          50% { transform: translateY(-20px) rotate(2deg); }
        }
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
        }
        @keyframes float-gentle {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        @keyframes slide-right {
          0% { transform: translateX(-10%); }
          100% { transform: translateX(10%); }
        }
        @keyframes slide-left {
          0% { transform: translateX(10%); }
          100% { transform: translateX(-10%); }
        }
        .animate-fade-in {
          animation: fade-in 0.8s ease-out forwards;
        }
        .animate-expand {
          animation: expand 0.6s ease-out forwards;
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        .animate-float-main {
          animation: float-main 6s ease-in-out infinite;
        }
        .animate-float-slow {
          animation: float-slow 8s ease-in-out infinite;
        }
        .animate-float-gentle {
          animation: float-gentle 10s ease-in-out infinite;
        }
        .animate-slide-right {
          animation: slide-right 20s ease-in-out infinite alternate;
        }
        .animate-slide-left {
          animation: slide-left 20s ease-in-out infinite alternate;
        }
      `}</style>
    </main>
  );
}
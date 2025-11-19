'use client';

import React, { useState, useEffect } from 'react';
import Navbar from "./components/navbar"; 
import {Sparkles, ArrowDown} from 'lucide-react';

export default function page() { 
  return ( 
    <main>
      <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-white to-purple-50 relative overflow-hidden">
          <Navbar />
          
          {/*Hero Section*/}
          <div className="mt-40 flex justify-center relative">
            {/* Background Elements */}
            <div className="absolute top-[-100px] left-[-100px] w-[300px] h-[300px] bg-indigo-200 rounded-full blur-3xl opacity-40" />
            <div className="absolute bottom-[-100px] right-[-100px] w-[300px] h-[300px] bg-purple-300 rounded-full blur-3xl opacity-30"/>
            <div className="absolute top-[20%] right-[10%] w-[200px] h-[200px] bg-pink-200 rounded-full blur-2xl opacity-20 animate-pulse" />
            <div className="absolute bottom-[60%] left-[5%] w-[150px] h-[150px] bg-yellow-200 rounded-full blur-2xl opacity-25 animate-pulse" style={{ animationDelay: '1s' }} />
            
            {/* MASCOT 1 - Large Semi-Transparent Background (Top Right) */}
            <div className="absolute right-[-50px] top-[-100px] w-[500px] h-[500px] opacity-15 pointer-events-none">
              <img 
                src="/images/monkey_1.png" 
                alt="UniPlus Mascot" 
                className="w-full h-full object-contain animate-float"
              />
            </div>

            {/* MASCOT 2 - Bottom Left (Flipped) */}
            <div className="absolute left-[-80px] bottom-[-80px] w-[350px] h-[350px] opacity-10 pointer-events-none hidden lg:block">
              <img 
                src="/images/monkey_2.png" 
                alt="UniPlus Mascot" 
                className="w-full h-full object-contain transform scale-x-[-1] animate-float-slow"
              />
            </div>

            {/* MASCOT 3 - Small Top Left */}
            <div className="absolute left-[5%] top-[10%] w-[180px] h-[180px] opacity-12 pointer-events-none hidden xl:block">
              <img 
                src="/images/monkey_3.png" 
                alt="UniPlus Mascot" 
                className="w-full h-full object-contain animate-float-delay"
              />
            </div>
            
            <div className="p-10 rounded-xl max-w-screen text-center relative z-10">
              <div className="inline-flex items-center px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full border border-indigo-200 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <Sparkles className="w-4 h-4 mr-2 text-indigo-500 animate-spin" style={{ animationDuration: '3s' }} />
                <span className="text-sm font-semibold text-indigo-700">Your Campus, Your Events</span>
              </div>
              <h1 className="mt-5 text-5xl md:text-6xl font-extrabold text-gray-900 leading-tight tracking-tight"> 
                <span className="text-indigo-400 block">University life <span className="text-black">is more than lectures.</span></span>
                <span>Discover your next favorite event with <span className="text-indigo-400">UniPLUS</span>.</span> 
              </h1>
              <p className="mt-6 text-lg text-gray-600 max-w-3xl mx-auto">
                Join thousands of students discovering amazing events, from casual club meetups to major university gatherings.
              </p>

              <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
                <a href="/events" className="relative inline-flex items-center justify-center px-12 py-4 overflow-hidden font-medium text-white transition duration-300 ease-out border-2 border-indigo-400 rounded-xl shadow-md group">
                  <span className="absolute inset-0 flex items-center justify-center w-full h-full text-white duration-300 -translate-x-full bg-indigo-400 group-hover:translate-x-0 ease">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                  </span>
                  <span className="absolute flex items-center justify-center w-full h-full text-xl text-black font-extrabold transition-all duration-300 transform group-hover:translate-x-full ease">Browse Events</span>
                  <span className="relative invisible">Browse Events</span>
                </a>
                <a href='/login' className="px-8 py-4 text-indigo-600 font-semibold border-2 border-transparent hover:border-indigo-200 rounded-xl transition-all duration-300 hover:bg-white/50 backdrop-blur-sm">
                  Get Started
                </a>
              </div>
            </div>
          </div>

          <div className="mt-32 flex justify-center relative z-10">
            <div className="w-16 h-16 rounded-full shadow-2xl shadow-indigo-400 flex items-center justify-center animate-bounce bg-white">
              <ArrowDown className="w-6 h-6 text-indigo-500" />
            </div>
          </div>
          
          {/*Feature Section*/}
          <div className="mt-32 p-10 flex flex-col bg-white relative">
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
                    {/* Monkey on hover */}
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

            {/* MASCOT 7 - Footer Center (Main Showcase) */}
            <div className="mt-20 flex justify-center relative z-10">
              <div className="relative w-[280px] h-[280px] group">
                <img 
                  src="/images/monkey_7.png" 
                  alt="UniPlus Mascot" 
                  className="w-full h-full object-contain drop-shadow-2xl transition-transform duration-300 group-hover:scale-110"
                />
                {/* Fun text on hover */}
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
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-20px);
          }
        }
        @keyframes float-slow {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-15px);
          }
        }
        @keyframes float-delay {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-25px);
          }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-float-slow {
          animation: float-slow 8s ease-in-out infinite;
        }
        .animate-float-delay {
          animation: float-delay 7s ease-in-out infinite;
        }
      `}</style>
    </main>
); }
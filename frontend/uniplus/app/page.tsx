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
          <div className="mt-40 flex justify-center">
            {/* Background Elements */}
            <div className="absolute top-[-100px] left-[-100px] w-[300px] h-[300px] bg-indigo-200 rounded-full blur-3xl opacity-40" />
            <div className="absolute bottom-[-100px] right-[-100px] w-[300px] h-[300px] bg-purple-300 rounded-full blur-3xl opacity-30"/>
            <div className="absolute top-[20%] right-[10%] w-[200px] h-[200px] bg-pink-200 rounded-full blur-2xl opacity-20 animate-pulse" />
            <div className="absolute bottom-[60%] left-[5%] w-[150px] h-[150px] bg-yellow-200 rounded-full blur-2xl opacity-25 animate-pulse" style={{ animationDelay: '1s' }} />
            
            <div className="p-10 rounded-xl max-w-screen text-center">
              <div className="inline-flex items-center px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full border border-indigo-200 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <Sparkles className="w-4 h-4 mr-2 text-indigo-500 animate-spin" style={{ animationDuration: '3s' }} />
                <span className="text-sm font-semibold text-indigo-700">Your Campus, Your Events</span>
              </div>
              <h1 className="mt-5 text-5xl md:text-6xl font-extrabold text-gray-900 leading-tight tracking-tight"> 
                <span className="text-indigo-400 block">University life <span className="text-black">is more than lectures.</span></span>
                <span>Discover your next favorite event with <span className="text-indigo-400">UniPLUS</span>.</span> 
              </h1>
              <p className="mt-6 text-lg text-gray-600 max-w-screen mx-auto lg:mx-0">
                Join thousands of students discovering many amazing events, from casual club meetups to major university events.
              </p>

              <div className="mt-10 flex flex-col sm:flex-row gap-2 justify-center lg:justify-center">
                <a href="#_" className="relative inline-flex items-center justify-center p-4 px-12 py-4 overflow-hidden font-medium text-white transition duration-300 ease-out border-2 border-indigo-400 rounded-xl shadow-md group">
                  <span className="absolute inset-0 flex items-center justify-center w-full h-full text-white duration-300 -translate-x-full bg-indigo-400 group-hover:translate-x-0 ease">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                  </span>
                  <span className="absolute flex items-center justify-center w-full h-full text-xl text-black font-extrabold transition-all duration-300 transform group-hover:translate-x-full ease">Browse Events</span>
                  <span className="relative invisible">Browse Events</span>
                </a>
                <a href='#_' className="px-8 py-4 text-indigo-600 font-semibold border-2 border-transparent hover:border-indigo-200 rounded-xl transition-all duration-300 hover:bg-white/50 backdrop-blur-sm">
                  About Us
                </a>
              </div>
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

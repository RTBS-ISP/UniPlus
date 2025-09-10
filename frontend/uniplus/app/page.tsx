import Image from "next/image"; 
import Navbar from "./components/navbar"; 
import {Sparkles, ArrowRight} from 'lucide-react';

export default function page() { 
  return ( 
    <main>
      <div className="min-h-screen bg-[#E9E9F4]">
          <Navbar />
          <div className="mt-5 flex justify-center">
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
                  <span>Browse Events List</span>
                  <ArrowRight className="w-5 h-5 ml-3" />
                </a> 
            </div>
          </div>
      </div>
    </main>
); }

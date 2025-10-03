"use client"
import React from 'react'
import Navbar from "../components/navbar";
import Image from 'next/image';

import { useState, useEffect, ChangeEvent } from "react";

interface User {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

function ProfilePage() {
  const [user, setUser] = useState<User | null> (null);
  const [form, setForm] = useState<Partial<User>>({});

  useEffect(() => {
    fetch("http://localhost:8000/api/user", {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + localStorage.getItem("token"),
      },
    })
      .then((res) => res.json())
      .then((data: User) => {
        setUser(data);
        setForm(data);
      });
  }, []);

  if (!user) return <p>Loading.....</p>

  return (
    <main>
        <Navbar />
        <div className='flex flex-col min-h-screen bg-[#E9E9F4]'>
            <div className='flex flex-col w-full px-20 py-10 mb-6'>
                <div className="bg-white rounded-2xl shadow-2xl flex justify-between p-6">
                    {/*Left Side*/}
                    <div className="flex flex-row gap-x-6">
                      <Image src="/images/logo.png" alt="Profile Picture" width={256} height={297} className='rounded-xl'/>
                      <div className="flex flex-col">
                        <div className='text-black font-extrabold text-4xl py-2'>
                            {user.firstName.charAt(0).toUpperCase() + user.firstName.slice(1)} {user.lastName.charAt(0).toUpperCase() + user.lastName.slice(1)}
                        </div>
                        <div className='text-gray-400 text-base py-2'>
                            Software and Knowledge Engineering
                        </div>
                        <div className='text-gray-400 text-base py-2'>
                            {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                        </div>
                        <div className="mt-4">
                          <a href="#_" className="px-5 py-2.5 font-medium bg-indigo-50 hover:bg-indigo-100 hover:text-indigo-600 text-indigo-500 rounded-lg text-sm">
                              Edit Profile
                          </a>
                        </div>
                      </div>
                    </div>
                    

                    {/*Right Side*/}
                    <div className="grid grid-cols-3 gap-6 items-center px-6">
                      <div className="text-center bg-indigo-50 rounded-lg px-12 py-5 shadow">
                        <div className="text-sm text-gray-500">Registered</div>
                        <div className="text-2xl font-bold text-indigo-600">12</div>
                      </div>
                      <div className="text-center bg-indigo-50 rounded-lg px-12 py-5 shadow">
                        <div className="text-sm text-gray-500">Finished</div>
                        <div className="text-2xl font-bold text-indigo-600">8</div>
                      </div>
                      <div className="text-center bg-indigo-50 rounded-lg px-12 py-5 shadow">
                        <div className="text-sm text-gray-500">Saved</div>
                        <div className="text-2xl font-bold text-indigo-600">5</div>
                      </div>
                    </div>
                </div>
            </div>
            
            <div className='flex flex-col w-full px-20 py-10'>
                <div className="bg-white rounded-2xl shadow-2xl flex flex-row gap-x-4 p-6">
                    <div className='flex flex-row gap-x-8'>
                        <div className='text-xl text-black font-extrabold'>History</div>
                        <div className='text-xl text-black font-extrabold'>Registered</div>
                    </div>
                </div>
            </div>
        </div>
    </main>
    
  )
}
export default ProfilePage


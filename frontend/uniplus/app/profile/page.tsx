"use client"
import React, { useState, useEffect } from 'react'
import Navbar from "../components/navbar";
import EditPopup from '../components/profile/EditPopup';

interface AboutMe {
  faculty?: string;
  year?: string;
  organizerName?: string;
}

interface User {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  phone: string;
  aboutMe: AboutMe | null;
  profilePic: string;
}

function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  function getCookie(name: string): string | undefined {
    if (typeof document === "undefined") return undefined;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(";").shift();
  }

  useEffect(() => {
    fetch("http://localhost:8000/api/set-csrf-token", {
      method: "GET",
      credentials: "include",
    }).catch((err) => console.error("CSRF fetch failed", err));
  }, []);

  useEffect(() => {
    fetch("http://localhost:8000/api/user", {
      method: "GET",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch user");
        return res.json();
      })
      .then((data: User) => setUser(data))
      .catch((err) => console.error(err));
  }, []);

  const handleEditSave = async (data: any) => {
    const csrftoken = getCookie("csrftoken");
    const formData = new FormData();

    if (data.firstName) formData.append("firstName", data.firstName);
    if (data.lastName) formData.append("lastName", data.lastName);
    if (data.phone) formData.append("phone", data.phone);
    if (data.aboutMe) formData.append("aboutMe", JSON.stringify(data.aboutMe));
    if (data.file) formData.append("profilePic", data.file);

    const res = await fetch("http://localhost:8000/api/user", {
      method: "PATCH",
      credentials: "include",
      headers: {
        "X-CSRFToken": csrftoken ?? "",
      },
      body: formData,
    });

    if (res.ok) {
      const updatedUser = await res.json();
      console.log("Profile updated", updatedUser);
      setUser(updatedUser);
      setEditOpen(false);
    } else {
      console.error("Failed to update profile", await res.text());
      alert("Failed to update profile.");
    }
  };

  if (!user) return <p>Loading.....</p>

  return (
    <main>
      <Navbar />
      <EditPopup
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSave={handleEditSave}
        role={user.role}
        initialData={{
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          aboutMe: user.aboutMe,
          profilePic: user.profilePic,
        }}
      />

      <div className='flex flex-col min-h-screen bg-[#E9E9F4]'>
        <div className='flex flex-col w-full px-20 py-10 mb-6'>
          <div className="bg-white rounded-2xl shadow-2xl flex justify-between p-6">
            {/* Left Side: Profile Info */}
            <div className="flex flex-row gap-x-6">
              <div className="w-64 h-72 overflow-hidden rounded-xl">
                <img
                  src={
                    user.profilePic.startsWith("/images")
                      ? user.profilePic
                      : `http://localhost:8000${user.profilePic}`
                  }
                  alt="Profile Picture"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex flex-col justify-start">
                <div className='text-black font-extrabold text-4xl'>
                  {user.firstName.charAt(0).toUpperCase() + user.firstName.slice(1)}{" "}
                  {user.lastName.charAt(0).toUpperCase() + user.lastName.slice(1)}
                </div>

                <div className='text-gray-500 text-base pt-3 capitalize'>
                  Role: {user.role}
                </div>

                {/* Role-Specific Info */}
                {user.role === 'student' && user.aboutMe && (
                  <div className="text-gray-500 text-base py-2 space-y-2">
                    <div className="font-medium">Faculty: {user.aboutMe.faculty}</div>
                    <div className="font-medium">Year: {user.aboutMe.year}</div>
                    <div className="font-medium">Tel: {user.phone}</div>
                  </div>
                )}

                {user.role === 'organizer' && user.aboutMe && (
                  <div className="text-gray-500 text-base py-2 space-y-2">
                    <div className="font-medium">Organizer: {user.aboutMe.organizerName}</div>
                    <div className="font-medium">Tel: {user.phone}</div>
                  </div>
                )}

                <div className="mt-3">
                  <button
                    onClick={() => setEditOpen(true)}
                    className="px-5 py-2.5 font-medium bg-indigo-50 hover:bg-indigo-100 hover:text-indigo-600 text-indigo-500 rounded-lg text-sm"
                  >
                    Edit Profile
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Registered & History titles - Registered comes first */}
        <div className='flex flex-col w-full px-20 py-6'>
          <div className="bg-white rounded-2xl shadow-2xl flex flex-row gap-x-8 p-6">
            <div className='text-xl text-black font-extrabold cursor-pointer hover:text-indigo-600'>
              Registered
            </div>
            <div className='text-xl text-black font-extrabold cursor-pointer hover:text-indigo-600'>
              History
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

export default ProfilePage;

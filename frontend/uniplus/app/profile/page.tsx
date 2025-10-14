"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../components/navbar";
import EditPopup from "../components/profile/EditPopup";
import { useUser } from "../context/UserContext"; 

function ProfilePage() {
  const { user, setUser } = useUser(); 
  const [editOpen, setEditOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // If user is not logged in, redirect to login
    if (user === null) {
      router.push('/login');
    }
  }, [user, router]);

  if (!user) {
    return <div className="text-center mt-10">Loading...</div>;
  }

  function getCookie(name: string): string | undefined {
    if (typeof document === "undefined") return undefined;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(";").shift();
  }

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

      <div className="flex flex-col min-h-screen bg-indigo-100">
        <div className="flex flex-col w-full px-20 py-10 mb-3">
          <div className="flex justify-between p-6">
            <div className="flex flex-row gap-x-6 items-stretch">
              {/* Profile Picture */}
              <div className="w-64 h-64 overflow-hidden rounded-xl">
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

              {/* Info */}
              <div className="flex flex-col justify-between h-64">
                <div className="overflow-y-auto">
                  <div className="text-gray-800 font-extrabold text-5xl">
                    {user.firstName.charAt(0).toUpperCase() + user.firstName.slice(1)}{" "}
                    {user.lastName.charAt(0).toUpperCase() + user.lastName.slice(1)}
                  </div>
                  
                  {user.role && (
                    <div className="flex mt-3 mb-4">
                      {user.role === "student" ? (
                        <div className="bg-sky-100 text-gray-800 font-bold text-base px-5 py-1 rounded-lg text-center">
                          Student
                        </div>
                      ) : user.role === "teacher" ? (
                        <div className="bg-indigo-200 text-gray-800 font-bold text-base px-5 py-1rounded-lg text-center">
                          Teacher
                        </div>
                      ) : user.role === "organizer" ? (
                        <div className="bg-purple-100 text-gray-800 font-bold text-base px-5 py-1 rounded-lg text-center">
                          Organizer
                        </div>
                      ) : user.role === "admin" && (
                        <div className="bg-slate-200 text-gray-800 font-bold text-base px-5 py-1 rounded-lg text-center">
                          Admin
                        </div>
                      )}
                    </div>
                  )}

                  {/* Role-Specific Info */}
                  {user.role === "student" && user.aboutMe && (
                    <div className="text-gray-800 text-base mt-3.5 space-y-3.5">
                      <div className="font-medium">Faculty: {user.aboutMe.faculty}</div>
                      <div className="font-medium">Year: {user.aboutMe.year}</div>
                      <div className="font-medium">Tel: {user.phone}</div>
                    </div>
                  )}

                  {user.role === "teacher" && user.aboutMe && (
                    <div className="text-gray-800 text-base mt-3.5 space-y-3.5">
                      <div className="font-medium">Faculty: {user.aboutMe.faculty}</div>
                      <div className="font-medium">Tel: {user.phone}</div>
                    </div>
                  )}

                  {user.role === "organizer" && user.aboutMe && (
                    <div className="text-gray-800 text-base mt-3.5 space-y-3.5">
                      <div className="font-medium">Organizer: {user.aboutMe.organizerName}</div>
                      <div className="font-medium">Tel: {user.phone}</div>
                    </div>
                  )}
                </div>

                <div className="mt-4">
                  <button
                    onClick={() => setEditOpen(true)}
                    className="px-5 py-2 font-bold bg-indigo-500 hover:bg-indigo-300 text-white rounded-lg text-sm"
                  >
                    Edit Profile
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Event History & Stats*/}
        <div className="flex flex-col w-full px-20">
          <div className="bg-white rounded-2xl shadow-2xl flex flex-row gap-x-8 p-6">
            <div className="text-xl text-black font-extrabold cursor-pointer hover:text-indigo-600">
              Registered
            </div>
            <div className="text-xl text-black font-extrabold cursor-pointer hover:text-indigo-600">
              History
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default ProfilePage;

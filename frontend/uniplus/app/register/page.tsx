"use client";

import React, { useState } from "react";
import Link from "next/link";

function RegisterPage() {
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();

  try {
    // Get CSRF token from backend
    const csrfRes = await fetch("http://localhost:8000/api/set-csrf-token", {
      credentials: "include", // important for CSRF cookies
    });
    const csrfData = await csrfRes.json();

    const res = await fetch("http://localhost:8000/api/register", {
      method: "POST",
      credentials: "include", // important for CSRF cookies
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": csrfData.csrftoken,
      },
      body: JSON.stringify({
        email: form.email,
        password: form.password,
        username: form.username,
        role: form.role,
      }),
    });

    const data = await res.json();
    if (data.success) {
      alert("Registered successfully!");
      window.location.href = "/";
    } else {
      alert("Error: " + (data.error || data.message));
    }
  } catch (err) {
    console.error(err);
    alert("Something went wrong");
  }
};


  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2 bg-[#E9E9F4]">
      <main className="flex flex-col items-center justify-center w-full flex-1 px-20 text-center">
        <div className="bg-white rounded-2xl shadow-2xl flex-col w-170 max-w-4xl p-10">
          <h2 className="text-4xl font-bold mb-5 text-black">Register</h2>
          <form className="flex flex-col items-center" onSubmit={handleSubmit}>
            {/* Username */}
            <label className="flex items-start text-xs px-2 py-2 text-black">Username</label>
            <input
              type="text"
              name="username"
              placeholder="Enter your username"
              value={form.username}
              onChange={handleChange}
              className="bg-gray-100 text-black outline-none text-sm w-130 p-2 mb-5 rounded-full"
            />

            {/* Email */}
            <label className="flex items-start text-xs px-2 py-2 text-black">Email</label>
            <input
              type="email"
              name="email"
              placeholder="Enter your email"
              value={form.email}
              onChange={handleChange}
              className="bg-gray-100 text-black outline-none text-sm w-130 p-2 mb-5 rounded-full"
            />

            {/* Password */}
            <label className="flex items-start text-xs px-2 py-2 text-black">Password</label>
            <input
              type="password"
              name="password"
              placeholder="Enter your password"
              value={form.password}
              onChange={handleChange}
              className="bg-gray-100 text-black outline-none text-sm w-130 p-2 mb-5 rounded-full"
            />

            {/* Confirm Password */}
            <label className="flex items-start text-xs px-2 py-2 text-black">Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm your password"
              value={form.confirmPassword}
              onChange={handleChange}
              className="bg-gray-100 text-black outline-none text-sm w-130 p-2 mb-5 rounded-full"
            />

            {/* Role */}
            <label className="flex items-start text-xs px-2 py-2 text-black">Role</label>
            <select
              name="role"
              value={form.role}
              onChange={handleChange}
              className="w-50 py-2 rounded-full border-[0.5px] border-black text-black bg-gray-100 p-3 text-sm mb-5"
            >
              <option value="" disabled>
                Select your role
              </option>
              <option value="student">Student</option>
              <option value="organizer">Organizer</option>
            </select>

            {/* Buttons */}
            <div className="flex justify-end w-130 py-5 gap-3">
              <Link
                className="text-gray-500 hover:underline flex items-center text-xs py-3"
                href="/"
              >
                Cancel
              </Link>
              <button
                type="submit"
                className="border-2 bg-black border-black text-white rounded-full px-4 py-1 inline-block font-semibold hover:bg-black hover:text-[#E9E9F4]"
              >
                Confirm
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

export default RegisterPage;

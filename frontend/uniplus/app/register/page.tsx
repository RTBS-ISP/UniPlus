"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

function RegisterPage() {
  const [form, setForm] = useState({
    username: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    role: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    setError(""); // Clear error when user types
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    // Frontend validation
    if (!form.username || !form.email || !form.password || !form.confirmPassword || !form.role) {
      setError("Username, email, password, and role are required");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (form.password.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    setLoading(true);

    try {
      // Step 1: Get CSRF token
      const csrfRes = await fetch("http://localhost:8000/api/set-csrf-token", {
        method: "GET",
        credentials: "include",
      });

      if (!csrfRes.ok) {
        throw new Error("Failed to get CSRF token");
      }

      const csrfData = await csrfRes.json();

      // Step 2: Register user
      const res = await fetch("http://localhost:8000/api/register", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": csrfData.csrftoken,
        },
        body: JSON.stringify({
          username: form.username,
          email: form.email,
          password: form.password,
          role: form.role,
        }),
      });

      const data = await res.json();

      if (data.success) {
        alert("Registered successfully! Please login.");
        router.push("/login");
      } else {
        setError(data.error || data.message || "Registration failed");
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2 bg-[#E9E9F4]">
      <main className="flex flex-col items-center justify-center w-full px-4 sm:px-10 text-center">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl p-14">
          <h2 className="text-4xl font-bold mb-5 text-black">Register</h2>

          {/* Error Message */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="flex flex-col space-y-4">
              {/* Username */}
              <div className="flex flex-col">
                <label className="flex items-start text-xs p-2 text-black">
                  Username
                </label>
                <div className="bg-gray-100 p-2 flex items-center mb-5 rounded-full">
                  <input
                    type="text"
                    name="username"
                    placeholder="Enter your username"
                    value={form.username}
                    onChange={handleChange}
                    required
                    className="bg-gray-100 text-black outline-none text-sm w-full px-3"
                  />
                </div>
              </div>

              {/* First and Last Name */}
              <div className="flex flex-row gap-4 w-full">
                <div className="flex flex-col w-1/2">
                  <label className="flex items-start text-xs p-2 text-black">
                    First Name
                  </label>
                  <div className="bg-gray-100 p-2 flex items-center mb-5 rounded-full">
                    <input
                      type="text"
                      name="firstName"
                      placeholder="Enter your first name"
                      value={form.firstName}
                      onChange={handleChange}
                      className="bg-gray-100 text-black outline-none text-sm w-full px-3"
                    />
                  </div>
                </div>
                <div className="flex flex-col w-1/2">
                  <label className="flex items-start text-xs p-2 text-black">
                    Last Name
                  </label>
                  <div className="bg-gray-100 p-2 flex items-center mb-5 rounded-full">
                    <input
                      type="text"
                      name="lastName"
                      placeholder="Enter your last name"
                      value={form.lastName}
                      onChange={handleChange}
                      className="bg-gray-100 text-black outline-none text-sm w-full px-3"
                    />
                  </div>
                </div>
              </div>

              {/* Email and Phone */}
              <div className="flex flex-row gap-4 w-full">
                <div className="flex flex-col w-1/2">
                  <label className="flex items-start text-xs p-2 text-black">
                    Email
                  </label>
                  <div className="bg-gray-100 p-2 flex items-center mb-5 rounded-full">
                    <input
                      type="email"
                      name="email"
                      placeholder="Enter your email"
                      value={form.email}
                      onChange={handleChange}
                      required
                      className="bg-gray-100 text-black outline-none text-sm w-full px-3"
                    />
                  </div>
                </div>
                <div className="flex flex-col w-1/2">
                  <label className="flex items-start text-xs p-2 text-black">
                    Phone Number
                  </label>
                  <div className="bg-gray-100 p-2 flex items-center mb-5 rounded-full">
                    <input
                      type="tel"
                      name="phone"
                      placeholder="Enter your phone number"
                      value={form.phone}
                      onChange={handleChange}
                      className="bg-gray-100 text-black outline-none text-sm w-full px-3"
                    />
                  </div>
                </div>
              </div>

              {/* Password */}
              <div className="flex flex-col">
                <label className="flex items-start text-xs p-2 text-black">
                  Password
                </label>
                <div className="bg-gray-100 p-2 flex items-center mb-5 rounded-full">
                  <input
                    type="password"
                    name="password"
                    placeholder="Enter your password"
                    value={form.password}
                    onChange={handleChange}
                    required
                    minLength={8}
                    className="bg-gray-100 text-black outline-none text-sm w-full px-3"
                  />
                </div>
              </div>

              {/* Confirm Password */}
              <div className="flex flex-col">
                <label className="flex items-start text-xs p-2 text-black">
                  Confirm Password
                </label>
                <div className="bg-gray-100 p-2 flex items-center mb-5 rounded-full">
                  <input
                    type="password"
                    name="confirmPassword"
                    placeholder="Confirm your password"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    required
                    className="bg-gray-100 text-black outline-none text-sm w-full px-3"
                  />
                </div>
              </div>

              {/* Role Selector */}
              <div className="flex flex-col">
                <label className="flex items-start text-xs p-2 text-black">
                  Roles
                </label>
                <select
                  name="role"
                  value={form.role}
                  onChange={handleChange}
                  required
                  className="bg-gray-100 text-black text-sm w-50 p-3 rounded-full mb-5"
                >
                  <option value="" disabled>
                    Select your role
                  </option>
                  <option value="student">Student</option>
                  <option value="organizer">Organizer</option>
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-4 pt-3">
                <Link
                  href="/"
                  className="text-gray-500 hover:underline flex item-center text-sm py-2"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center justify-center w-full px-4 py-1 text-base font-bold leading-6 text-white bg-indigo-400 border border-transparent rounded-full md:w-auto hover:bg-indigo-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Registering..." : "Confirm"}
                </button>
              </div>

              <hr className="h-px my-8 bg-gray-200 border-0" />
              <div className="text-black text-md">
                Already have an account?{" "}
                <Link href="/login" className="underline text-indigo-400">
                  Sign In
                </Link>
              </div>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

export default RegisterPage;
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MoveLeft, X } from "lucide-react";

type AboutMe = {
  faculty?: string;
  year?: string;
  organizerName?: string;
};

type FormState = {
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  role: string;
  aboutMe: AboutMe;
};

function RegisterPage() {
  const [form, setForm] = useState<FormState>({
    username: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    role: "",
    aboutMe: {},
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    if (form.role === "student" && (name === "faculty" || name === "year")) {
      setForm({ ...form, aboutMe: { ...form.aboutMe, [name]: value } });
    } else if (form.role === "organizer" && name === "organizerName") {
      setForm({ ...form, aboutMe: { ...form.aboutMe, organizerName: value } });
    } else {
      setForm({ ...form, [name]: value });
    }

    setError(""); // clear error when typing
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    // Frontend validation
    if (
      !form.username ||
      !form.email ||
      !form.password ||
      !form.confirmPassword ||
      !form.role
    ) {
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

    // Role-specific validation
    if (form.role === "student") {
      if (!form.aboutMe.faculty || !form.aboutMe.year) {
        setError("Faculty and year are required for students");
        return;
      }
    } else if (form.role === "organizer") {
      if (!form.aboutMe.organizerName) {
        setError("Organizer name is required");
        return;
      }
    }

    setLoading(true);

    try {
      // Get CSRF token
      const csrfRes = await fetch("http://localhost:8000/api/set-csrf-token", {
        method: "GET",
        credentials: "include",
      });
      if (!csrfRes.ok) throw new Error("Failed to get CSRF token");
      const csrfData = await csrfRes.json();

      // Prepare the request body according to your backend schema
      const requestBody = {
        username: form.username,
        email: form.email,
        password: form.password,
        first_name: form.firstName, 
        last_name: form.lastName,   
        phone_number: form.phone,   
        about_me: form.aboutMe,    
        role: form.role,
      };

      console.log("Sending request:", requestBody); // For debugging

      const res = await fetch("http://localhost:8000/api/register", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": csrfData.csrftoken,
        },
        body: JSON.stringify(requestBody),
      });

      const data = await res.json();
      
      if (res.ok && data.success) {
        alert("Registered successfully! Please login.");
        router.push("/login");
      } else {
        setError(data.error || data.message || "Registration failed");
      }
    } catch (err) {
      console.error("Registration error:", err);
      setError(
        err instanceof Error ? err.message : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2 bg-indigo-100">
      <main className="flex flex-col items-center justify-center w-full px-4 sm:px-10">
        <div className="flex items-start w-full max-w-3xl">
          <h1 className="text-5xl text-center font-extrabold mb-5 text-gray-800">Register</h1>
        </div>

        <div className="bg-white rounded-[30px] shadow-2xl w-full max-w-3xl p-14">

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="flex flex-col space-y-4">

              {/* Username */}
              <div>
                <label className="flex text-sm pb-2 text-gray-800">Username</label>
                <div className="bg-white border border-gray-200 p-1.5 rounded-lg">
                  <input
                    type="text"
                    name="username"
                    placeholder="Enter your username"
                    value={form.username}
                    onChange={handleChange}
                    required
                    className="bg-white text-gray-800 outline-none text-sm w-full px-3"
                  />
                </div>
              </div>

              {/* First & Last Name */}
              <div className="flex gap-4">
                <div className="flex flex-col w-1/2">
                  <label className="text-sm text-left pb-2 text-gray-800">First Name</label>
                  <div className="bg-white border border-gray-200 p-1.5 rounded-lg">
                    <input
                      type="text"
                      name="firstName"
                      placeholder="Enter your first name"
                      value={form.firstName}
                      onChange={handleChange}
                      className="bg-white text-gray-800 outline-none text-sm w-full px-3"
                    />
                  </div>
                </div>
                <div className="flex flex-col w-1/2">
                  <label className="text-sm text-left pb-2 text-gray-800">Last Name</label>
                  <div className="bg-white border border-gray-200 p-1.5 rounded-lg">
                    <input
                      type="text"
                      name="lastName"
                      placeholder="Enter your last name"
                      value={form.lastName}
                      onChange={handleChange}
                      className="bg-white text-gray-800 outline-none text-sm w-full px-3"
                    />
                  </div>
                </div>
              </div>

              {/* Email & Phone */}
              <div className="flex gap-4">
                <div className="flex flex-col w-1/2">
                  <label className="text-sm text-left pb-2 text-gray-800">Email</label>
                  <div className="bg-white border border-gray-200 p-1.5 rounded-lg">
                    <input
                      type="email"
                      name="email"
                      placeholder="Enter your email"
                      value={form.email}
                      onChange={handleChange}
                      required
                      className="bg-white text-gray-800 outline-none text-sm w-full px-3"
                    />
                  </div>
                </div>
                <div className="flex flex-col w-1/2">
                  <label className="text-sm text-left pb-2 text-gray-800">Phone Number</label>
                  <div className="bg-white border border-gray-200 p-1.5 rounded-lg">
                    <input
                      type="tel"
                      name="phone"
                      placeholder="Enter your phone number"
                      value={form.phone}
                      onChange={handleChange}
                      className="bg-white text-gray-800 outline-none text-sm w-full px-3"
                    />
                  </div>
                </div>
              </div>

              {/* Password & Confirm */}
              <div>
                <label className="flex text-sm text-left pb-2 text-gray-800">Password</label>
                <div className="bg-white border border-gray-200 p-1.5 rounded-lg">
                  <input
                    type="password"
                    name="password"
                    placeholder="Enter your password"
                    value={form.password}
                    onChange={handleChange}
                    required
                    minLength={8}
                    className="bg-white text-gray-800 outline-none text-sm w-full px-3"
                  />
                </div>
              </div>

              <div>
                <label className="flex text-sm text-left pb-2 text-gray-800">Confirm Password</label>
                <div className="bg-white border border-gray-200 p-1.5 rounded-lg">
                  <input
                    type="password"
                    name="confirmPassword"
                    placeholder="Confirm your password"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    required
                    className="bg-white text-gray-800 outline-none text-sm w-full px-3"
                  />
                </div>
              </div>

              {/* Role Selection */}
              <div className="flex flex-col w-1/2">
                <label className="text-sm pb-2 text-gray-800">Role</label>
                <div className="bg-white border border-gray-200 p-1.5 rounded-lg">
                  <select
                    name="role"
                    value={form.role}
                    onChange={handleChange}
                    required
                    className="bg-white text-gray-800 outline-none text-sm w-full px-3"
                  >
                    <option value="" disabled>
                      Select your role
                    </option>
                    <option value="student">Student</option>
                    <option value="professor">Professor</option>
                    <option value="organizer">Organizer</option>
                  </select>
                </div>
              </div>

              {form.role && (
                <div>
                  {form.role === "student" ? (
                    <div className="flex gap-4">
                      {/* Faculty Dropdown */}
                      <div className="flex flex-col w-1/2">
                        <label className="text-sm pb-2 text-gray-800">Faculty</label>
                        <div className="bg-white border border-gray-200 p-1.5 rounded-lg">
                          <select
                            name="faculty"
                            value={form.aboutMe.faculty || ""}
                            onChange={handleChange}
                            className="bg-white text-gray-800 outline-none text-sm w-full px-3"
                            required
                          >
                            <option value="" disabled>
                              Select your faculty
                            </option>
                            <option value="Agriculture">Agriculture</option>
                            <option value="Agro-industry">Agro-Industry</option>
                            <option value="Architecture">Architecture</option>
                            <option value="Business">Business Administration</option>
                            <option value="Economics">Economics</option>
                            <option value="Education">Education</option>
                            <option value="Engineering">Engineering</option>
                            <option value="Environment">Environment</option>
                            <option value="Fisheries">Fisheries</option>
                            <option value="Forestry">Forestry</option>
                            <option value="Humanities">Humanities</option>
                            <option value="Medicine">Medicine</option>
                            <option value="Nursing">Nursing</option>
                            <option value="Pharmaceutical_sciences">Pharmaceutical Sciences</option>
                            <option value="Science">Science</option>
                            <option value="Social_sciences">Social Sciences</option>
                            <option value="Veterinary_medicine">Veterinary Medicine</option>
                            <option value="Veterinary_technology">Veterinary Technology</option>
                            <option value="Interdisciplinary_management_and_technology">
                              Interdisciplinary Management and Technology
                            </option>
                          </select>
                        </div>
                      </div>

                      {/* Year Field */}
                      <div className="flex flex-col w-1/2">
                        <label className="text-sm pb-2 text-gray-800">Year</label>
                        <div className="bg-white border border-gray-200 p-1.5 rounded-lg">
                          <input
                            type="number"
                            name="year"
                            placeholder="Enter your year (1-8)"
                            value={form.aboutMe.year || ""}
                            onChange={handleChange}
                            className="bg-white text-gray-800 outline-none text-sm w-full px-3"
                            min="1"
                            max="8"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  ) : form.role === "professor" ? (
                    <div>
                      {/* Faculty Dropdown */}
                      <label className="flex text-sm pb-2 text-gray-800">Faculty</label>
                        <div className="bg-white border border-gray-200 p-1.5 rounded-lg">
                          <select
                            name="faculty"
                            value={form.aboutMe.faculty || ""}
                            onChange={handleChange}
                            className="bg-white text-gray-800 outline-none text-sm w-full px-3"
                            required
                          >
                            <option value="" disabled>
                              Select your faculty
                            </option>
                            <option value="Agriculture">Agriculture</option>
                            <option value="Agro-industry">Agro-Industry</option>
                            <option value="Architecture">Architecture</option>
                            <option value="Business">Business Administration</option>
                            <option value="Economics">Economics</option>
                            <option value="Education">Education</option>
                            <option value="Engineering">Engineering</option>
                            <option value="Environment">Environment</option>
                            <option value="Fisheries">Fisheries</option>
                            <option value="Forestry">Forestry</option>
                            <option value="Humanities">Humanities</option>
                            <option value="Medicine">Medicine</option>
                            <option value="Nursing">Nursing</option>
                            <option value="Pharmaceutical_sciences">Pharmaceutical Sciences</option>
                            <option value="Science">Science</option>
                            <option value="Social_sciences">Social Sciences</option>
                            <option value="Veterinary_medicine">Veterinary Medicine</option>
                            <option value="Veterinary_technology">Veterinary Technology</option>
                            <option value="Interdisciplinary_management_and_technology">
                              Interdisciplinary Management and Technology
                            </option>
                          </select>
                        </div>
                      </div>
                  ) : (
                    <>
                      {/* Organizer Name */}
                      <label className="flex text-sm p-2 text-gray-800">Organizer Name</label>
                      <div className="bg-white border border-gray-200 p-1.5 rounded-lg">
                        <input
                          type="text"
                          name="organizerName"
                          placeholder="Enter your organizer name (e.g. Kasetsart University)"
                          value={form.aboutMe.organizerName || ""}
                          onChange={handleChange}
                          className="bg-white text-gray-800 outline-none text-sm w-full px-3"
                          required
                        />
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Buttons */}
              <div className="flex justify-end items-center pt-4 space-x-4">
                <Link href='/' className='text-gray-500 hover:underline flex item-center text-sm py-2'>
                  Cancel
                </Link>

                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center justify-center px-6 py-2 text-base font-bold leading-6 text-white bg-indigo-500 border border-transparent rounded-lg hover:bg-indigo-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Registering..." : "Confirm"}
                </button>
              </div>
            </div>
          </form>

          {/* Already have an account */}
          <div className="mt-8 text-center text-gray-800 text-md">
            Already have an account?{" "}
            <Link href="/login" className="underline text-indigo-500">
              Sign In
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

export default RegisterPage;
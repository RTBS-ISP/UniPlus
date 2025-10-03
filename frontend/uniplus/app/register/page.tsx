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
  const [step, setStep] = useState<1 | 2>(1);
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

    setLoading(true);

    try {
      const csrfRes = await fetch("http://localhost:8000/api/set-csrf-token", {
        method: "GET",
        credentials: "include",
      });
      if (!csrfRes.ok) throw new Error("Failed to get CSRF token");
      const csrfData = await csrfRes.json();

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
          firstName: form.firstName,
          lastName: form.lastName,
          phone: form.phone,
          aboutMe: form.aboutMe,
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
      setError(
        err instanceof Error ? err.message : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // STEP 1: Choose Role
  if (step === 1) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#E9E9F4]">
        <div className="relative bg-white rounded-2xl shadow-2xl p-12 max-w-3xl w-full text-center">
          <button
            onClick={() => router.push("/")}
            className="absolute top-6 right-6 p-2 rounded-full text-gray-500 hover:bg-gray-200 transition"
            aria-label="Back to home"
          >
          <X className="w-6 h-6" />
          </button>
          <h2 className="text-3xl font-bold mb-8 text-black">Choose Your Role</h2>
          <div className="grid grid-cols-2 gap-8">
            {/* Student Box */}
            <div
              className="cursor-pointer p-10 border-2 rounded-xl hover:border-indigo-400 hover:bg-indigo-50 transition"
              onClick={() => {
                setForm({ ...form, role: "student" });
                setStep(2);
              }}
            >
              <h3 className="text-2xl font-bold text-black mb-2">🎓 Student</h3>
              <p className="text-gray-600 text-sm">
                Explore and participate events or even create your own one.
              </p>
            </div>

            {/* Organizer Box */}
            <div
              className="cursor-pointer p-10 border-2 rounded-xl hover:border-indigo-400 hover:bg-indigo-50 transition"
              onClick={() => {
                setForm({ ...form, role: "organizer" });
                setStep(2);
              }}
            >
              <h3 className="text-2xl font-bold text-black mb-2">📝 Organizer</h3>
              <p className="text-gray-600 text-sm">
                Create and manage events for students.
              </p>
            </div>
          </div>
          
          <div className="mt-8 text-black text-md">
            Already have an account?{" "}
            <Link href="/login" className="underline text-indigo-400">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // STEP 2: Registration Form
  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2 bg-[#E9E9F4]">
      <main className="flex flex-col items-center justify-center w-full px-4 sm:px-10">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl p-14">
          <h2 className="text-4xl text-center font-bold mb-5 text-black">Register as {form.role === "student" ? "Student" : "Organizer"}</h2>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="flex flex-col space-y-4">

              {/* Username */}
              <div>
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

              {/* First & Last Name */}
              <div className="flex gap-4">
                <div className="flex flex-col w-1/2">
                  <label className="text-xs text-left p-2 text-black">First Name</label>
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
                  <label className="text-xs text-left p-2 text-black">Last Name</label>
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

              {/* Email & Phone */}
              <div className="flex gap-4">
                <div className="flex flex-col w-1/2">
                  <label className="text-xs text-left p-2 text-black">Email</label>
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
                  <label className="text-xs text-left p-2 text-black">Phone Number</label>
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

              {form.role && (
              <div>
                {form.role === "student" ? (
                  <div className="flex gap-4">
                    {/* Faculty Dropdown */}
                    <div className="flex flex-col w-1/2">
                      <label className="flex items-start text-xs p-2 text-black">Faculty</label>
                      <div className="bg-gray-100 p-2 flex items-center mb-5 rounded-full">
                        <select
                          name="faculty"
                          value={form.aboutMe.faculty || ""}
                          onChange={handleChange}
                          className="bg-gray-100 text-black outline-none text-sm w-full px-3"
                          required
                        >
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
                      <label className="flex items-start text-xs p-2 text-black">Year</label>
                      <div className="bg-gray-100 p-2 flex items-center mb-5 rounded-full">
                        <input
                          type="number"
                          name="year"
                          placeholder="Enter your year (e.g. 1)"
                          value={form.aboutMe.year || ""}
                          onChange={handleChange}
                          className="bg-gray-100 text-black outline-none text-sm w-full px-3"
                          min="1"
                          max="8"
                          required
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Organizer Name */}
                    <label className="flex items-start text-xs p-2 text-black">
                      Organizer Name
                    </label>
                    <div className="bg-gray-100 p-2 flex items-center mb-5 rounded-full">
                      <input
                        type="text"
                        name="organizerName"
                        placeholder="Enter your organizer name (e.g. Kasetsart University)"
                        value={form.aboutMe.organizerName || ""}
                        onChange={handleChange}
                        className="bg-gray-100 text-black outline-none text-sm w-full px-3"
                        required
                      />
                    </div>
                  </>
                )}
              </div>
            )}

              {/* Password & Confirm */}
              <div>
                <label className="text-xs text-left p-2 text-black">Password</label>
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

              <div>
                <label className="text-xs text-left p-2 text-black">Confirm Password</label>
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

              {/* Buttons */}
              <div className="flex justify-between items-center pt-3">
                {/* Left side: Back */}
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex items-center text-gray-500 hover:underline text-sm"
                >
                  <MoveLeft className="w-4 h-4 mr-1" />
                  <span>Back</span>
                </button>

                {/* Right side: Confirm + Cancel */}
                <div className="flex items-center space-x-3"> 
                  <Link href='/' className='text-gray-500 hover:underline flex item-center text-sm py-2'>
                  Cancel
                  </Link>

                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex items-center justify-center px-6 py-2 text-base font-bold leading-6 text-white bg-indigo-400 border border-transparent rounded-full hover:bg-indigo-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? "Registering..." : "Confirm"}
                  </button>
                </div>
              </div>

            </div>
          </form>

          {/* Already have an account */}
          <hr className="my-8 border-gray-300" />
          <div className="mt-8 text-center text-black text-md">
            Already have an account?{" "}
            <Link href="/login" className="underline text-indigo-400">
              Sign In
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

export default RegisterPage;

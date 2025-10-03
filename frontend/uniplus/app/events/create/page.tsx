"use client";

import { useState } from "react";
import Link from "next/link";
import Navbar from "../../components/navbar";
import TagPicker from "../../components/forms/TagPicker";

type FormData = {
  event_title: string;
  event_description: string;
  start_date_register: string;
  end_date_register: string;
  max_attendee: number;
  hostTags: string[];
  attendeeTags: string[];
  imageDataUrl?: string;
};

export default function EventCreatePage() {
  const [data, setData] = useState<FormData>({
    event_title: "",
    event_description: "",
    start_date_register: "",
    end_date_register: "",
    max_attendee: 0,
    hostTags: ["Students", "Organizer"],
    attendeeTags: ["Engineer", "Year1"],
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const onFile = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setData((d) => ({ ...d, imageDataUrl: String(reader.result || "") }));
    reader.readAsDataURL(file);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    // Validate required fields
    if (!data.event_title || !data.event_description || !data.start_date_register || !data.end_date_register) {
      setError("Please fill in all required fields");
      setIsSubmitting(false);
      return;
    }

    // Validate dates
    if (new Date(data.end_date_register) <= new Date(data.start_date_register)) {
      setError("End date must be after start date");
      setIsSubmitting(false);
      return;
    }

    try {
      // Use the correct endpoint - note: your API has "/create_events" (typo)
      const API_URL = "http://localhost:8000/api/create_events";
      
      console.log("Sending request to:", API_URL);
      console.log("Request payload:", {
        event_title: data.event_title,
        event_description: data.event_description,
        start_date_register: data.start_date_register,
        end_date_register: data.end_date_register,
        max_attendee: data.max_attendee,
      });

      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // You'll need to include CSRF token and session cookies
          "X-CSRFToken": getCSRFToken(), // You need to implement this
        },
        credentials: "include", // Important for session cookies
        body: JSON.stringify({
          event_title: data.event_title,
          event_description: data.event_description,
          start_date_register: data.start_date_register,
          end_date_register: data.end_date_register,
          max_attendee: data.max_attendee,
        }),
      });

      const responseText = await response.text();
      console.log("Response status:", response.status);
      console.log("Response text:", responseText);

      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch (parseError) {
        console.error("Failed to parse JSON:", parseError);
        
        if (response.status === 403) {
          setError("Authentication required. Please log in first.");
        } else if (response.status === 404) {
          setError("API endpoint not found. Check if backend is running.");
        } else {
          setError(`Server error: ${responseText.substring(0, 200)}...`);
        }
        return;
      }

      if (response.status === 201) {
        alert("Event created successfully!");
        console.log("Created event:", responseData);
        // Clear form
        setData({
          event_title: "",
          event_description: "",
          start_date_register: "",
          end_date_register: "",
          max_attendee: 0,
          hostTags: ["Students", "Organizer"],
          attendeeTags: ["Engineer", "Year1"],
        });
      } else {
        setError(responseData.error || `Failed to create event (Status: ${response.status})`);
      }

    } catch (err) {
      setError("Network error. Make sure your Django backend is running on localhost:8000");
      console.error("Error creating event:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper function to get CSRF token (you need to implement this)
  const getCSRFToken = () => {
    // You should have a way to get the CSRF token from your Django backend
    // This usually involves calling /api/set-csrf-token first and storing it
    return document.cookie
      .split('; ')
      .find(row => row.startsWith('csrftoken='))
      ?.split('=')[1] || '';
  };

  return (
    <div className="min-h-screen bg-[#ece8f3]">
      <Navbar />

      <form onSubmit={submit} className="mx-auto max-w-5xl px-6 pb-20 pt-10">
        <h1 className="mb-8 text-center text-4xl text-black font-extrabold">Event Board Creation</h1>

        {error && (
          <div className="mb-6 rounded-lg bg-red-100 p-4 text-red-700">
            <strong>Error:</strong> {error}
            <br />
            <small className="text-sm">Check console for details</small>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm text-black font-medium">Event Name:*</label>
            <input
              value={data.event_title}
              onChange={(e) => setData({ ...data, event_title: e.target.value })}
              placeholder="Fill in"
              required
              className="w-full rounded-full bg-white text-black px-4 py-2 outline-none ring-1 ring-gray-200 focus:ring-2 focus:ring-black"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-black font-medium">Max Attendees:*</label>
            <input
              type="number"
              min={0}
              value={data.max_attendee}
              onChange={(e) => setData({ ...data, max_attendee: parseInt(e.target.value) || 0 })}
              placeholder="Fill in"
              required
              className="w-full rounded-full bg-white text-black px-4 py-2 outline-none ring-1 ring-gray-200 focus:ring-2 focus:ring-black"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-black font-medium">Registration Start Date:*</label>
            <input
              type="datetime-local"
              value={data.start_date_register}
              onChange={(e) => setData({ ...data, start_date_register: e.target.value })}
              required
              className="w-full rounded-full bg-white text-black px-4 py-2 outline-none ring-1 ring-gray-200 focus:ring-2 focus:ring-black"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-black font-medium">Registration End Date:*</label>
            <input
              type="datetime-local"
              value={data.end_date_register}
              onChange={(e) => setData({ ...data, end_date_register: e.target.value })}
              required
              className="w-full rounded-full bg-white text-black px-4 py-2 outline-none ring-1 ring-gray-200 focus:ring-2 focus:ring-black"
            />
          </div>
        </div>

        <div className="mt-6">
          <label className="mb-2 block text-sm text-black font-medium">Event Description:*</label>
          <textarea
            value={data.event_description}
            onChange={(e) => setData({ ...data, event_description: e.target.value })}
            placeholder="Fill in description like date, time, location and what the event is about"
            rows={8}
            required
            className="w-full rounded-2xl bg-white text-black px-4 py-3 text-sm outline-none ring-1 ring-gray-200 focus:ring-2 focus:ring-black"
          />
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm text-black font-medium">Host:</label>
            <TagPicker
              value={data.hostTags}
              onChange={(v) => setData({ ...data, hostTags: v })}
              options={["Students", "Organizer", "University", "Club"]}
            />
          </div>
          <div>
            <label className="mb-2 block text-sm text-black font-medium">Attendee</label>
            <TagPicker
              value={data.attendeeTags}
              onChange={(v) => setData({ ...data, attendeeTags: v })}
              options={["Engineer", "Year1", "Year2", "Business", "Design"]}
            />
          </div>
        </div>

        <div className="mt-8">
          <label className="mb-2 block text-sm text-black font-medium">Upload Picture:</label>
          <div className="flex items-center gap-4">
            <label className="inline-flex cursor-pointer select-none items-center rounded-lg bg-sky-100 px-4 py-2 text-sm font-medium text-sky-700 hover:bg-sky-200">
              <input 
                type="file" 
                accept="image/*" 
                className="hidden"
                onChange={(e) => onFile(e.target.files?.[0])}
              />
              Upload
            </label>
            {data.imageDataUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={data.imageDataUrl}
                className="h-16 w-24 rounded-md object-cover ring-1 ring-gray-200"
                alt="preview"
              />
            )}
          </div>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-end gap-4">
          <Link
            href="/events"
            className="rounded-lg bg-gray-200 px-6 py-3 font-medium text-gray-900 hover:bg-gray-300"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-lg bg-indigo-400 px-8 py-3 font-medium text-white hover:bg-indigo-300 disabled:bg-indigo-200 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Creating..." : "Confirm"}
          </button>
        </div>
      </form>
    </div>
  );
}
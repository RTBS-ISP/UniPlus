"use client";

import { useState } from "react";
import Link from "next/link";
import Navbar from "../../components/navbar";

type FormData = {
  eventTitle: string;
  eventDescription: string;
  maxAttendee: string;
  eventAddress: string;
  isOnline: boolean;
  eventMeetingLink: string;
  eventCategory: string;
  tags: string;
  eventEmail: string;
  eventPhoneNumber: string;
  eventWebsiteUrl: string;
  termsAndConditions: string;
  startDate: string;
  endDate: string;
  imageFile: File | null;
  imagePreview: string;
};

const CATEGORIES = ["Engineering", "Science", "Business", "Humanities", "Architecture", "Arts", "Sports", "Technology"];

export default function EventCreatePage() {
  const [data, setData] = useState<FormData>({
    eventTitle: "",
    eventDescription: "",
    maxAttendee: "",
    eventAddress: "",
    isOnline: false,
    eventMeetingLink: "",
    eventCategory: "",
    tags: "",
    eventEmail: "",
    eventPhoneNumber: "",
    eventWebsiteUrl: "",
    termsAndConditions: "",
    startDate: "",
    endDate: "",
    imageFile: null,
    imagePreview: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setData({ ...data, imageFile: file, imagePreview: URL.createObjectURL(file) });
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Validation
      if (!data.eventTitle || !data.eventDescription) {
        setError("Event title and description are required");
        setLoading(false);
        return;
      }

      // Get CSRF token
      const csrfRes = await fetch("http://localhost:8000/api/set-csrf-token", {
        method: "GET",
        credentials: "include",
      });

      if (!csrfRes.ok) throw new Error("Failed to get CSRF token");
      const csrfData = await csrfRes.json();

      // Prepare FormData for file upload
      const formData = new FormData();
      formData.append("event_title", data.eventTitle);
      formData.append("event_description", data.eventDescription);
      
      // Dates
      const startDate = data.startDate ? new Date(data.startDate).toISOString() : new Date().toISOString();
      const endDate = data.endDate ? new Date(data.endDate).toISOString() : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      formData.append("start_date_register", startDate);
      formData.append("end_date_register", endDate);

      formData.append("is_online", String(data.isOnline));

      // Optional fields - only add if filled
      if (data.maxAttendee) formData.append("max_attendee", data.maxAttendee);
      if (data.eventAddress) formData.append("event_address", data.eventAddress);
      if (data.eventMeetingLink) formData.append("event_meeting_link", data.eventMeetingLink);
      if (data.eventCategory) formData.append("event_category", data.eventCategory);
      if (data.tags) formData.append("tags", data.tags);
      if (data.eventEmail) formData.append("event_email", data.eventEmail);
      if (data.eventPhoneNumber) formData.append("event_phone_number", data.eventPhoneNumber);
      if (data.eventWebsiteUrl) formData.append("event_website_url", data.eventWebsiteUrl);
      if (data.termsAndConditions) formData.append("terms_and_conditions", data.termsAndConditions);
      if (data.imageFile) formData.append("event_image", data.imageFile);

      // Send request
      const res = await fetch("http://localhost:8000/api/events/create", {
        method: "POST",
        credentials: "include",
        headers: {
          "X-CSRFToken": csrfData.csrftoken,
        },
        body: formData,
      });

      const result = await res.json();

      if (result.success) {
        alert("Event created successfully!");
        window.location.href = "/events";
      } else {
        setError(result.error || "Failed to create event");
      }
    } catch (err) {
      console.error("Create event error:", err);
      setError("Failed to create event. Make sure you're logged in.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      <Navbar />

      <div className="mx-auto max-w-4xl px-4 py-12">
        <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12">
          <h1 className="text-4xl md:text-5xl font-extrabold text-center text-indigo-400 mb-2 ">
            Create New Event
          </h1>
          <p className="text-center text-gray-800 mb-8">Fill in the details to create your event</p>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={submit} className="space-y-6">
            {/* Event Title */}
            <div>
              <label className="block text-sm font-semibold text-black mb-2">
                Event Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={data.eventTitle}
                onChange={(e) => setData({ ...data, eventTitle: e.target.value })}
                placeholder="e.g., Tech Conference 2025"
                required
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition text-black placeholder-gray-400"
              />
            </div>

            {/* Event Description */}
            <div>
              <label className="block text-sm font-semibold text-black mb-2">
                Event Description <span className="text-red-500">*</span>
              </label>
              <textarea
                value={data.eventDescription}
                onChange={(e) => setData({ ...data, eventDescription: e.target.value })}
                placeholder="Describe your event, what attendees can expect, schedule, etc."
                rows={5}
                required
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition resize-none text-black placeholder-gray-400"
              />
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-black mb-2">
                  Registration Start Date
                </label>
                <input
                  type="datetime-local"
                  value={data.startDate}
                  onChange={(e) => setData({ ...data, startDate: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition text-black"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-black mb-2">
                  Registration End Date
                </label>
                <input
                  type="datetime-local"
                  value={data.endDate}
                  onChange={(e) => setData({ ...data, endDate: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition text-black"
                />
              </div>
            </div>

            {/* Category and Max Attendees */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-black mb-2">
                  Category
                </label>
                <select
                  value={data.eventCategory}
                  onChange={(e) => setData({ ...data, eventCategory: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition text-black"
                >
                  <option value="">Select a category</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-black mb-2">
                  Max Attendees
                </label>
                <input
                  type="number"
                  min="1"
                  value={data.maxAttendee}
                  onChange={(e) => setData({ ...data, maxAttendee: e.target.value })}
                  placeholder="e.g., 100"
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition text-black placeholder-gray-400"
                />
              </div>
            </div>

            {/* Online/Offline Toggle */}
            <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-xl">
              <input
                type="checkbox"
                id="isOnline"
                checked={data.isOnline}
                onChange={(e) => setData({ ...data, isOnline: e.target.checked })}
                className="w-5 h-5 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500"
              />
              <label htmlFor="isOnline" className="text-sm font-semibold text-black cursor-pointer">
                This is an online event
              </label>
            </div>

            {/* Location or Meeting Link */}
            {data.isOnline ? (
              <div>
                <label className="block text-sm font-semibold text-black mb-2">
                  Meeting Link
                </label>
                <input
                  type="url"
                  value={data.eventMeetingLink}
                  onChange={(e) => setData({ ...data, eventMeetingLink: e.target.value })}
                  placeholder="https://zoom.us/j/..."
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition text-black placeholder-gray-400"
                />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-semibold text-black mb-2">
                  Event Address
                </label>
                <input
                  type="text"
                  value={data.eventAddress}
                  onChange={(e) => setData({ ...data, eventAddress: e.target.value })}
                  placeholder="123 Main St, City, Country"
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition text-black placeholder-gray-400"
                />
              </div>
            )}

            {/* Tags */}
            <div>
              <label className="block text-sm font-semibold text-black mb-2">
                Tags (comma-separated)
              </label>
              <input
                type="text"
                value={data.tags}
                onChange={(e) => setData({ ...data, tags: e.target.value })}
                placeholder="e.g., technology, networking, workshop"
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition text-black placeholder-gray-400"
              />
            </div>

            {/* Contact Information */}
            <div className="space-y-4 p-6 bg-indigo-50 rounded-xl">
              <h3 className="font-bold text-black mb-3">Contact Information (Optional)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="email"
                  value={data.eventEmail}
                  onChange={(e) => setData({ ...data, eventEmail: e.target.value })}
                  placeholder="contact@example.com"
                  className="px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition text-black placeholder-gray-400"
                />
                <input
                  type="tel"
                  value={data.eventPhoneNumber}
                  onChange={(e) => setData({ ...data, eventPhoneNumber: e.target.value })}
                  placeholder="+1 234 567 8900"
                  className="px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition text-black placeholder-gray-400"
                />
              </div>
              <input
                type="url"
                value={data.eventWebsiteUrl}
                onChange={(e) => setData({ ...data, eventWebsiteUrl: e.target.value })}
                placeholder="https://example.com"
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition text-black placeholder-gray-400"
              />
            </div>

            {/* Image Upload */}
            <div>
              <label className="block text-sm font-semibold text-black mb-2">
                Event Image
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-indigo-400 transition">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  id="imageUpload"
                />
                <label htmlFor="imageUpload" className="cursor-pointer">
                  {data.imagePreview ? (
                    <img
                      src={data.imagePreview}
                      alt="Preview"
                      className="mx-auto h-48 w-full object-cover rounded-lg mb-3"
                    />
                  ) : (
                    <div className="py-12">
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="mt-2 text-sm text-gray-600">Click to upload event image</p>
                    </div>
                  )}
                </label>
              </div>
            </div>

            {/* Terms and Conditions */}
            <div>
              <label className="block text-sm font-semibold text-black mb-2">
                Terms and Conditions
              </label>
              <textarea
                value={data.termsAndConditions}
                onChange={(e) => setData({ ...data, termsAndConditions: e.target.value })}
                placeholder="Any terms or conditions for attendees..."
                rows={3}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition resize-none text-black placeholder-gray-400"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6">
              <Link
                href="/events"
                className="flex-1 text-center px-6 py-3 rounded-xl border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 items-center justify-center px-6 py-3 text-base font-bold leading-6 text-white bg-indigo-400 border border-transparent rounded-xl hover:bg-indigo-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Creating..." : "Create Event"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
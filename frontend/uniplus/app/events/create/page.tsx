"use client";

import { useState } from "react";
import Link from "next/link";
import Navbar from "../../components/navbar";
import TagSelector from "../../components/TagSelector";

type EventDate = {
  date: string;
  time: string;
};

type FormData = {
  eventTitle: string;
  eventDescription: string;
  maxAttendee: string;
  eventAddress: string;
  isOnline: boolean;
  eventMeetingLink: string;
  tags: string[];
  eventEmail: string;
  eventPhoneNumber: string;
  eventWebsiteUrl: string;
  termsAndConditions: string;
  registrationStartDate: string;
  registrationEndDate: string;
  eventDates: EventDate[];  // NEW: Array of dates with times
  imageFile: File | null;
  imagePreview: string;
};

export default function EventCreatePage() {
  const [data, setData] = useState<FormData>({
    eventTitle: "",
    eventDescription: "",
    maxAttendee: "",
    eventAddress: "",
    isOnline: false,
    eventMeetingLink: "",
    tags: [],
    eventEmail: "",
    eventPhoneNumber: "",
    eventWebsiteUrl: "",
    termsAndConditions: "",
    registrationStartDate: "",
    registrationEndDate: "",
    eventDates: [{ date: "", time: "14:00" }],  // Start with one date
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

  const addEventDate = () => {
    const lastDate = data.eventDates[data.eventDates.length - 1];
    setData({
      ...data,
      eventDates: [...data.eventDates, { date: "", time: lastDate.time }]  // Copy time from last
    });
  };

  const removeEventDate = (index: number) => {
    if (data.eventDates.length > 1) {
      setData({
        ...data,
        eventDates: data.eventDates.filter((_, i) => i !== index)
      });
    }
  };

  const updateEventDate = (index: number, field: 'date' | 'time', value: string) => {
    const newDates = [...data.eventDates];
    newDates[index][field] = value;
    setData({ ...data, eventDates: newDates });
  };

  const submit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError("");
  setLoading(true);

  try {
    // Required validation
    if (!data.eventTitle || !data.eventDescription) {
      setError("Event title and description are required");
      setLoading(false);
      return;
    }

        // All event dates must have a date
    if (data.eventDates.some(d => !d.date)) {
      setError("Please fill in all event dates");
      setLoading(false);
      return;
    }

    // Sort event dates chronologically
    const sortedDates = [...data.eventDates].sort((a, b) => {
      const timeA = a.time || "00:00";
      const timeB = b.time || "00:00";
      return new Date(a.date + "T" + timeA).getTime() - new Date(b.date + "T" + timeB).getTime();
    });

    // Get CSRF token
    const csrfRes = await fetch("http://localhost:8000/api/set-csrf-token", {
      method: "GET",
      credentials: "include",
    });
    if (!csrfRes.ok) throw new Error("Failed to get CSRF token");
    const csrfData = await csrfRes.json();

    // Prepare FormData
    const formData = new FormData();
    formData.append("event_title", data.eventTitle);
    formData.append("event_description", data.eventDescription);

    // Registration dates
    const regStart = data.registrationStartDate || new Date().toISOString();
    const regEnd = data.registrationEndDate || new Date(sortedDates[0].date + "T" + sortedDates[0].time).toISOString();
    formData.append("start_date_register", new Date(regStart).toISOString());
    formData.append("end_date_register", new Date(regEnd).toISOString());

    // Event dates as JSON with ISO strings
    formData.append(
      "event_dates",
      JSON.stringify(sortedDates.map(d => ({ date: new Date(d.date + "T" + d.time).toISOString() })))
    );

    // Online status
    formData.append("is_online", String(data.isOnline));

    // Optional fields (send empty string if undefined)
    formData.append("max_attendee", data.maxAttendee?.trim() || "");
    formData.append("event_address", data.isOnline ? "" : data.eventAddress?.trim() || "");
    formData.append("event_meeting_link", data.isOnline ? data.eventMeetingLink?.trim() || "" : "");
    formData.append("tags", JSON.stringify(data.tags || []));
    formData.append("event_email", data.eventEmail?.trim() || "");
    formData.append("event_phone_number", data.eventPhoneNumber?.trim() || "");
    formData.append("event_website_url", data.eventWebsiteUrl?.trim() || "");
    formData.append("terms_and_conditions", data.termsAndConditions?.trim() || "");

    // Image
    if (data.imageFile) formData.append("event_image", data.imageFile);

    // Debug log
    console.log("FormData being sent:");
    for (let [key, value] of formData.entries()) {
      console.log(key, ":", value instanceof File ? "File" : value);
    }

    // Send request
    const res = await fetch("http://localhost:8000/api/events/create", {
      method: "POST",
      credentials: "include",
      headers: { "X-CSRFToken": csrfData.csrftoken },
      body: formData,
    });

    const result = await res.json();

    if (res.ok && result.success) {
      alert("Event created successfully!");
      window.location.href = "/events";
    } else {
      let errorMessage = "Failed to create event";
      if (result.error) errorMessage = result.error;
      else if (result.detail) {
        if (Array.isArray(result.detail)) {
          errorMessage = result.detail.map((err: any) => `${err.loc.join(".")}: ${err.msg}`).join(", ");
        } else if (typeof result.detail === "string") {
          errorMessage = result.detail;
        }
      }
      setError(errorMessage);
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
          <h1 className="text-4xl md:text-5xl font-extrabold text-center text-indigo-400 mb-2">
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

            {/* Event Dates - NEW SECTION */}
            <div className="bg-indigo-50 p-6 rounded-xl space-y-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-bold text-black text-lg">📅 Event Dates & Times <span className="text-red-500">*</span></h3>
                  <p className="text-sm text-gray-700 mt-1">Add multiple dates for multi-day events. Time will copy from first date if left unchanged.</p>
                </div>
                <button
                  type="button"
                  onClick={addEventDate}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-semibold text-sm"
                >
                  + Add Date
                </button>
              </div>

              {data.eventDates.map((eventDate, index) => (
                <div key={index} className="bg-white p-4 rounded-lg border-2 border-indigo-200">
                  <div className="flex items-center gap-4">
                    <span className="font-bold text-indigo-600 text-lg min-w-[60px]">
                      Day {index + 1}
                    </span>
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Date</label>
                        <input
                          type="date"
                          value={eventDate.date}
                          onChange={(e) => updateEventDate(index, 'date', e.target.value)}
                          required
                          className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 focus:border-indigo-500 outline-none text-black"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Time</label>
                        <input
                          type="time"
                          value={eventDate.time}
                          onChange={(e) => updateEventDate(index, 'time', e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 focus:border-indigo-500 outline-none text-black"
                        />
                      </div>
                    </div>
                    {data.eventDates.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeEventDate(index)}
                        className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition text-sm"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Registration Period */}
            <div className="bg-gray-50 p-6 rounded-xl space-y-4">
              <h3 className="font-bold text-black text-lg mb-3">📝 Registration Period (Optional)</h3>
              <p className="text-sm text-gray-700 mb-4">When can people register? Leave empty to allow registration anytime before event.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-black mb-2">
                    Registration Opens
                  </label>
                  <input
                    type="datetime-local"
                    value={data.registrationStartDate}
                    onChange={(e) => setData({ ...data, registrationStartDate: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition text-black"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-black mb-2">
                    Registration Closes
                  </label>
                  <input
                    type="datetime-local"
                    value={data.registrationEndDate}
                    onChange={(e) => setData({ ...data, registrationEndDate: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition text-black"
                  />
                </div>
              </div>
            </div>

            {/* Max Attendees */}
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
            <TagSelector 
              tags={data.tags} 
              setTags={(newTags) => setData({ ...data, tags: newTags })} 
            />

            {/* Contact Information */}
            <div className="space-y-4 p-6 bg-indigo-50 rounded-xl">
              <h3 className="font-bold text-black mb-3">Contact Information (Optional)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="email"
                  value={data.eventEmail}
                  onChange={(e) => setData({ ...data, eventEmail: e.target.value || "" })}
                  placeholder="contact@example.com"
                  className="px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition text-black placeholder-gray-400"
                />
                <input
                  type="tel"
                  value={data.eventPhoneNumber}
                  onChange={(e) => setData({ ...data, eventPhoneNumber: e.target.value || "" })}
                  placeholder="+1 234 567 8900"
                  className="px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition text-black placeholder-gray-400"
                />
              </div>
              <input
                type="url"
                value={data.eventWebsiteUrl}
                onChange={(e) => setData({ ...data, eventWebsiteUrl: e.target.value || "" })}
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
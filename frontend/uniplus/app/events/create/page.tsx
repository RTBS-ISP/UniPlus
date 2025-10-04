// app/events/create/page.tsx
"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import Navbar from "../../components/navbar";
import TagDropdown from "../../components/createevents/tagdropdown";
import AttendeePairs from "../../components/createevents/attendee-pairs";

// ----------------------- constants -----------------------
const CATEGORIES = ["Engineering", "Science", "Business", "Humanities", "Architecture", "Arts", "Sports", "Technology"];
const HOST_OPTIONS = ["Official", "Student Club", "Faculty Office", "Alumni", "External Partner"];
const FACULTIES = ["Economics", "Business", "Engineering", "Science", "Arts"];
const YEARS = [1, 2, 3, 4];
const TAGS_MAX = 200;

// ----------------------- types -----------------------
type FormState = {
  eventTitle: string;
  eventDescription: string;
  maxAttendee: string;
  eventAddress: string;
  isOnline: boolean;
  eventMeetingLink: string;
  eventCategory: string;
  // UI state only; backend still gets `tags` string
  hostTags: string;            // CSV of display host tags
  attendeePairsJson: string;   // JSON string: [{faculty,year}]
  eventEmail: string;
  eventPhoneNumber: string;
  eventWebsiteUrl: string;
  termsAndConditions: string;
  startDate: string;
  endDate: string;
  imageFile: File | null;
  imagePreview: string;
};

// ----------------------- encoding helpers -----------------------
function splitCSV(v: string): string[] {
  return v.split(",").map((s) => s.trim()).filter(Boolean);
}
function uniqCI(arr: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const x of arr) {
    const k = x.toLowerCase();
    if (!seen.has(k)) {
      seen.add(k);
      out.push(x);
    }
  }
  return out;
}
function parsePairs(jsonStr: string): Array<{ faculty: string; year: string }> {
  try {
    const arr = JSON.parse(jsonStr) as Array<{ faculty?: string; year?: string }>;
    if (!Array.isArray(arr)) return [];
    const seen = new Set<string>();
    const out: Array<{ faculty: string; year: string }> = [];
    for (const p of arr) {
      const faculty = String(p?.faculty ?? "").trim();
      const year = String(p?.year ?? "").trim();
      if (!faculty || !year) continue;
      const key = `${faculty}::${year}`.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ faculty, year });
    }
    return out;
  } catch {
    return [];
  }
}
function enc(s: string) {
  return encodeURIComponent(s);
}
function encodeTagsCSV(hostTagsCSV: string, attendeePairsJson: string): string {
  const hosts = uniqCI(splitCSV(hostTagsCSV));
  const pairs = parsePairs(attendeePairsJson);
  const hostTokens = hosts.map((h) => `h:${enc(h)}`);
  const pairTokens = pairs.map((p) => `a:${enc(p.faculty)}|${enc(p.year)}`);
  // No spaces to save characters.
  return [...hostTokens, ...pairTokens].join(",");
}

// ----------------------- component -----------------------
export default function EventCreatePage() {
  const [data, setData] = useState<FormState>({
    eventTitle: "",
    eventDescription: "",
    maxAttendee: "",
    eventAddress: "",
    isOnline: false,
    eventMeetingLink: "",
    eventCategory: "",
    hostTags: "",
    attendeePairsJson: "[]",
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

  const encodedTags = useMemo(
    () => encodeTagsCSV(data.hostTags, data.attendeePairsJson),
    [data.hostTags, data.attendeePairsJson]
  );
  const tagsLen = encodedTags.length;
  const tagsTooLong = tagsLen > TAGS_MAX;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setData((s) => ({ ...s, imageFile: file, imagePreview: URL.createObjectURL(file) }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (tagsTooLong) {
      setError(`Tags payload too long (${tagsLen}/${TAGS_MAX}). Remove some hosts/pairs.`);
      return;
    }
    setLoading(true);

    try {
      if (!data.eventTitle || !data.eventDescription) {
        setError("Event title and description are required");
        setLoading(false);
        return;
      }

      const csrfRes = await fetch("http://localhost:8000/api/set-csrf-token", {
        method: "GET",
        credentials: "include",
      });
      if (!csrfRes.ok) throw new Error("Failed to get CSRF token");
      const csrfData = await csrfRes.json();

      const formData = new FormData();
      formData.append("event_title", data.eventTitle);
      formData.append("event_description", data.eventDescription);

      const startDate = data.startDate ? new Date(data.startDate).toISOString() : new Date().toISOString();
      const endDate = data.endDate
        ? new Date(data.endDate).toISOString()
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      formData.append("start_date_register", startDate);
      formData.append("end_date_register", endDate);

      formData.append("is_online", String(data.isOnline));

      if (data.maxAttendee) formData.append("max_attendee", data.maxAttendee);
      if (!data.isOnline && data.eventAddress) formData.append("event_address", data.eventAddress);
      if (data.isOnline && data.eventMeetingLink) formData.append("event_meeting_link", data.eventMeetingLink);
      if (data.eventCategory) formData.append("event_category", data.eventCategory);

      // IMPORTANT: backend unchanged; send only `tags`
      if (encodedTags) formData.append("tags", encodedTags);

      if (data.eventEmail) formData.append("event_email", data.eventEmail);
      if (data.eventPhoneNumber) formData.append("event_phone_number", data.eventPhoneNumber);
      if (data.eventWebsiteUrl) formData.append("event_website_url", data.eventWebsiteUrl);
      if (data.termsAndConditions) formData.append("terms_and_conditions", data.termsAndConditions);
      if (data.imageFile) formData.append("event_image", data.imageFile);

      const res = await fetch("http://localhost:8000/api/events/create", {
        method: "POST",
        credentials: "include",
        headers: { "X-CSRFToken": csrfData.csrftoken },
        body: formData,
      });

      const result = await res.json();
      if (result.success) {
        alert("Event created successfully!");
        window.location.href = "/events";
      } else {
        setError(result.error || "Failed to create event");
      }
    } catch (err: any) {
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
          <h1 className="text-4xl md:text-5xl font-extrabold text-center text-indigo-400 mb-2">Create New Event</h1>
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
                <label className="block text-sm font-semibold text-black mb-2">Registration Start Date</label>
                <input
                  type="datetime-local"
                  value={data.startDate}
                  onChange={(e) => setData({ ...data, startDate: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition text-black"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-black mb-2">Registration End Date</label>
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
                <label className="block text-sm font-semibold text-black mb-2">Category</label>
                <select
                  value={data.eventCategory}
                  onChange={(e) => setData({ ...data, eventCategory: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition text-black"
                >
                  <option value="">Select a category</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-black mb-2">Max Attendees</label>
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
                <label className="block text-sm font-semibold text-black mb-2">Meeting Link</label>
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
                <label className="block text-sm font-semibold text-black mb-2">Event Address</label>
                <input
                  type="text"
                  value={data.eventAddress}
                  onChange={(e) => setData({ ...data, eventAddress: e.target.value })}
                  placeholder="123 Main St, City, Country"
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition text-black placeholder-gray-400"
                />
              </div>
            )}

            {/* Host Tags (UI) */}
            <div>
              <label className="block text-sm font-semibold text-black mb-2">Host Tags</label>
              <TagDropdown
                valueCSV={data.hostTags}
                onChangeCSV={(next) => setData({ ...data, hostTags: next })}
                options={HOST_OPTIONS}
                maxTags={5}
                name="host_tags_ui"
                placeholder="Select host tags…"
              />
            </div>

            {/* Attendee Eligibility: Faculty × Year (UI) */}
            <div>
              <label className="block text-sm font-semibold text-black mb-2">Eligible Attendees</label>
              <AttendeePairs
                value={data.attendeePairsJson}
                onChange={(next) => setData({ ...data, attendeePairsJson: next })}
                facultyOptions={FACULTIES}
                yearOptions={YEARS}
                maxPairs={20}
                name="attendee_pairs_ui"
                title="Attendee (Faculty and Year)"
              />
              <div className="mt-2 flex items-center justify-between text-xs">
                <span className="text-gray-500">
                  Encoded tags length: <span className={tagsTooLong ? "text-red-600 font-semibold" : "text-gray-700"}>{tagsLen}</span> / {TAGS_MAX}
                </span>
                {tagsTooLong && <span className="text-red-600">Reduce selections to submit.</span>}
              </div>
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
              <label className="block text-sm font-semibold text-black mb-2">Event Image</label>
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-indigo-400 transition">
                <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" id="imageUpload" />
                <label htmlFor="imageUpload" className="cursor-pointer">
                  {data.imagePreview ? (
                    <img src={data.imagePreview} alt="Preview" className="mx-auto h-48 w-full object-cover rounded-lg mb-3" />
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
              <label className="block text-sm font-semibold text-black mb-2">Terms and Conditions</label>
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
                disabled={loading || tagsTooLong}
                className="flex-1 items-center justify-center px-6 py-3 text-base font-bold leading-6 text-white bg-indigo-400 border border-transparent rounded-xl hover:bg-indigo-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Creating..." : "Create Event"}
              </button>
            </div>
          </form>

          {/* Debug / visibility of the encoded tags being sent */}
          <div className="mt-6 text-xs text-gray-500">
            <div className="font-semibold mb-1">Encoded tags to backend:</div>
            <code className="block break-words p-2 rounded bg-gray-50 border">{encodedTags || "(empty)"}</code>
          </div>
        </div>
      </div>
    </div>
  );
}

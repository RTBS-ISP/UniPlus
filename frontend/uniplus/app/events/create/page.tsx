"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Navbar from "../../components/navbar";
import TagSelector from "../../components/events/TagSelector";
import EventScheduleDays, { DaySlot } from "../../components/events/EventScheduleDays";
import { useAlert } from "../../components/ui/AlertProvider";

// ---- Categories (edit this list as needed) ----
const CATEGORIES = [
  "Engineering",
  "Science",
  "Business",
  "Humanities",
  "Architecture",
  "Arts",
  "Sports",
  "Technology",
];

type FormData = {
  eventTitle: string;
  eventDescription: string;
  category: string;
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
  eventStartDate: string; // derived
  eventEndDate: string;   // derived
  imageFile: File | null;
  imagePreview: string;
};

function toISO(date: string, time: string) {
  return new Date(`${date}T${time}:00`).toISOString();
}

const inputBase =
  "w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-gray-900 placeholder-gray-400 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200";
const sectionCard =
  "rounded-2xl border border-gray-200 bg-white p-6 shadow-sm";

export default function EventCreatePage() {
  const toast = useAlert(); // ✅ NEW

  const [data, setData] = useState<FormData>({
    eventTitle: "",
    eventDescription: "",
    category: "",
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
    eventStartDate: "",
    eventEndDate: "",
    imageFile: null,
    imagePreview: "",
  });

  const [scheduleDays, setScheduleDays] = useState<DaySlot[]>([
    { date: "", startTime: "", endTime: "" },
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setData((s) => ({
        ...s,
        imageFile: file,
        imagePreview: URL.createObjectURL(file),
      }));
    }
  };

  const summary = useMemo(() => {
    const first = scheduleDays.find((d) => d.date && d.startTime);
    const last = [...scheduleDays].reverse().find((d) => d.date && d.endTime);
    const when =
      first && last
        ? `${first.date} • ${first.startTime} → ${last.date} • ${last.endTime}`
        : "TBD";
    return {
      when,
      where: data.isOnline
        ? (data.eventMeetingLink ? "Online • Link provided" : "Online • Link TBD")
        : (data.eventAddress ? data.eventAddress : "Location TBD"),
      capacity: data.maxAttendee ? `${data.maxAttendee} people` : "Unlimited",
      tags: data.tags.length ? data.tags.join(", ") : "—",
    };
  }, [scheduleDays, data.isOnline, data.eventMeetingLink, data.eventAddress, data.maxAttendee, data.tags]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // ---------- Validation (with toasts) ----------
      if (!data.eventTitle || !data.eventDescription) {
        const msg = "Event title and description are required.";
        setError(msg);
        toast({ text: msg, variant: "error" });
        setLoading(false);
        return;
      }
      if (scheduleDays.length === 0) {
        const msg = "Please add at least one day.";
        setError(msg);
        toast({ text: msg, variant: "warning" });
        setLoading(false);
        return;
      }
      for (let i = 0; i < scheduleDays.length; i++) {
        const d = scheduleDays[i];
        if (!d.date || !d.startTime || !d.endTime) {
          const msg = `Day ${i + 1}: date, start time, and end time are required.`;
          setError(msg);
          toast({ text: msg, variant: "error" });
          setLoading(false);
          return;
        }
        const startMs = new Date(`${d.date}T${d.startTime}:00`).getTime();
        const endMs = new Date(`${d.date}T${d.endTime}:00`).getTime();
        if (!(endMs > startMs)) {
          const msg = `Day ${i + 1}: end time must be after start time.`;
          setError(msg);
          toast({ text: msg, variant: "error" });
          setLoading(false);
          return;
        }
      }

      // ---------- Dates ----------
      const starts = scheduleDays.map((d) => toISO(d.date, d.startTime));
      const ends = scheduleDays.map((d) => toISO(d.date, d.endTime));
      const overallStartISO = starts.reduce((min, x) => (x < min ? x : min), starts[0]);
      const overallEndISO = ends.reduce((max, x) => (x > max ? x : max), ends[0]);

      // ---------- CSRF ----------
      const csrfRes = await fetch("http://localhost:8000/api/set-csrf-token", {
        method: "GET",
        credentials: "include",
      });
      if (!csrfRes.ok) throw new Error("Failed to get CSRF token");
      const csrfData = await csrfRes.json();

      // ---------- Payload ----------
      const formData = new FormData();
      formData.append("event_title", data.eventTitle);
      formData.append("event_description", data.eventDescription);
      if (data.category) formData.append("category", data.category);

      const regStart = data.registrationStartDate
        ? new Date(data.registrationStartDate).toISOString()
        : new Date().toISOString();
      const regEnd = data.registrationEndDate
        ? new Date(data.registrationEndDate).toISOString()
        : overallStartISO;

      formData.append("start_date_register", regStart);
      formData.append("end_date_register", regEnd);
      formData.append("event_start_date", overallStartISO);
      formData.append("event_end_date", overallEndISO);

      formData.append(
        "schedule_days",
        JSON.stringify(
          scheduleDays.map((d) => ({
            date: d.date,
            start_time: d.startTime,
            end_time: d.endTime,
            start_iso: toISO(d.date, d.startTime),
            end_iso: toISO(d.date, d.endTime),
          }))
        )
      );

      formData.append("is_online", String(data.isOnline));
      if (data.maxAttendee.trim()) formData.append("max_attendee", data.maxAttendee);
      if (!data.isOnline && data.eventAddress.trim()) formData.append("event_address", data.eventAddress);
      if (data.isOnline && data.eventMeetingLink.trim()) formData.append("event_meeting_link", data.eventMeetingLink);
      if (data.tags.length) formData.append("tags", JSON.stringify(data.tags));
      if (data.eventEmail.trim()) formData.append("event_email", data.eventEmail);
      if (data.eventPhoneNumber.trim()) formData.append("event_phone_number", data.eventPhoneNumber);
      if (data.eventWebsiteUrl.trim()) formData.append("event_website_url", data.eventWebsiteUrl);
      if (data.termsAndConditions.trim()) formData.append("terms_and_conditions", data.termsAndConditions);
      if (data.imageFile) formData.append("event_image", data.imageFile);

      // ---------- Send ----------
      const res = await fetch("http://localhost:8000/api/events/create", {
        method: "POST",
        credentials: "include",
        headers: { "X-CSRFToken": csrfData.csrftoken },
        body: formData,
      });

      const result = await res.json();
      if (res.ok && result.success) {
        toast({ text: "Event created successfully!", variant: "success" });
        window.location.href = "/events";
        return;
      }

      let msg = "Failed to create event";
      if (result.error) msg = result.error;
      else if (result.detail) {
        msg = Array.isArray(result.detail)
          ? result.detail.map((err: any) => `${err.loc.join(".")}: ${err.msg}`).join(", ")
          : typeof result.detail === "string"
          ? result.detail
          : JSON.stringify(result.detail);
      }
      setError(msg);
      toast({ text: msg, variant: "error" });
    } catch (ex) {
      console.error(ex);
      const msg = "Failed to create event. Make sure you're logged in.";
      setError(msg);
      toast({ text: msg, variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#E0E7FF]">
      <Navbar />

      <header className="mx-auto max-w-6xl px-5 pt-10">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Create a new event</h1>
          <p className="text-gray-600">Add the core details, schedule your days, and publish.</p>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-8">
        <form onSubmit={submit} className="grid gap-6 md:grid-cols-12">
          {/* Left */}
          <div className="md:col-span-8 space-y-6">
            {/* Basics */}
            <section className={sectionCard}>
              <h2 className="text-lg font-semibold text-gray-900">Basics</h2>
              <p className="mt-1 text-sm text-gray-600">Title, category, and description.</p>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label htmlFor="title" className="mb-1 block text-sm font-medium text-gray-700">
                    Event Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="title"
                    type="text"
                    value={data.eventTitle}
                    onChange={(e) => setData({ ...data, eventTitle: e.target.value })}
                    placeholder="e.g., Tech Conference 2026"
                    className={inputBase}
                    required
                  />
                </div>

                {/* Category dropdown */}
                <div>
                  <label htmlFor="category" className="mb-1 block text-sm font-medium text-gray-700">
                    Category
                  </label>
                  <select
                    id="category"
                    value={data.category}
                    onChange={(e) => setData({ ...data, category: e.target.value })}
                    className={`${inputBase} pr-8`}
                  >
                    <option value="">Select category</option>
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-4">
                <label htmlFor="desc" className="mb-1 block text-sm font-medium text-gray-700">
                  Event Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="desc"
                  rows={5}
                  value={data.eventDescription}
                  onChange={(e) => setData({ ...data, eventDescription: e.target.value })}
                  placeholder="Describe your event, what attendees can expect, and the agenda."
                  className={`${inputBase} resize-y`}
                  required
                />
              </div>
            </section>

            {/* Schedule & Location */}
            <section className={sectionCard}>
              <h2 className="text-lg font-semibold text-gray-900">Schedule & Location</h2>
              <p className="mt-1 text-sm text-gray-600">Add one or more days. Each has start and end times.</p>
              <div className="mt-4">
                <EventScheduleDays value={scheduleDays} onChange={setScheduleDays} />
              </div>

              <div className="mt-6 grid gap-4">
                <div className="flex items-center gap-3 rounded-xl bg-gray-50 p-3">
                  <input
                    id="isOnline"
                    type="checkbox"
                    checked={data.isOnline}
                    onChange={(e) => setData({ ...data, isOnline: e.target.checked })}
                    className="h-5 w-5 rounded text-indigo-600 focus:ring-2 focus:ring-indigo-500"
                  />
                  <label htmlFor="isOnline" className="text-sm font-medium text-gray-800">
                    This is an online event
                  </label>
                </div>

                {data.isOnline ? (
                  <div>
                    <label htmlFor="meet" className="mb-1 block text-sm font-medium text-gray-700">
                      Meeting Link
                    </label>
                    <input
                      id="meet"
                      type="url"
                      value={data.eventMeetingLink}
                      onChange={(e) => setData({ ...data, eventMeetingLink: e.target.value })}
                      placeholder="https://zoom.us/j/..."
                      className={inputBase}
                    />
                    <p className="mt-1 text-xs text-gray-500">Share a Zoom/Google Meet/Teams link.</p>
                  </div>
                ) : (
                  <div>
                    <label htmlFor="address" className="mb-1 block text-sm font-medium text-gray-700">
                      Event Address
                    </label>
                    <input
                      id="address"
                      type="text"
                      value={data.eventAddress}
                      onChange={(e) => setData({ ...data, eventAddress: e.target.value })}
                      placeholder="123 Main St, City, Country"
                      className={inputBase}
                    />
                  </div>
                )}
              </div>
            </section>

            {/* Registration Window */}
            <section className={sectionCard}>
              <h2 className="text-lg font-semibold text-gray-900">Registration Window</h2>
              <p className="mt-1 text-sm text-gray-600">Optional. Leave blank to keep registration open.</p>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Opens</label>
                  <input
                    type="datetime-local"
                    value={data.registrationStartDate}
                    onChange={(e) => setData({ ...data, registrationStartDate: e.target.value })}
                    className={inputBase}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Closes</label>
                  <input
                    type="datetime-local"
                    value={data.registrationEndDate}
                    onChange={(e) => setData({ ...data, registrationEndDate: e.target.value })}
                    className={inputBase}
                  />
                </div>
              </div>
            </section>

            {/* Capacity & Tags */}
            <section className={sectionCard}>
              <h2 className="text-lg font-semibold text-gray-900">Capacity & Tags</h2>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Max Attendees</label>
                  <input
                    type="number"
                    min="1"
                    value={data.maxAttendee}
                    onChange={(e) => setData({ ...data, maxAttendee: e.target.value })}
                    placeholder="e.g., 120"
                    className={inputBase}
                  />
                </div>
                <div className="md:col-span-2">
                  <TagSelector tags={data.tags} setTags={(tags) => setData({ ...data, tags })} />
                </div>
              </div>
            </section>

            {/* Contact Information (Optional) */}
            <section className={sectionCard}>
              <h2 className="text-lg font-semibold text-gray-900">Contact Information (Optional)</h2>
              <p className="mt-1 text-sm text-gray-600">
                Provide ways for attendees to reach you. Leave empty if not needed.
              </p>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    value={data.eventEmail}
                    onChange={(e) => setData({ ...data, eventEmail: e.target.value || "" })}
                    placeholder="contact@example.com"
                    className={inputBase}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Phone Number</label>
                  <input
                    type="tel"
                    value={data.eventPhoneNumber}
                    onChange={(e) => setData({ ...data, eventPhoneNumber: e.target.value || "" })}
                    placeholder="+66 8x xxx xxxx"
                    className={inputBase}
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="mb-1 block text-sm font-medium text-gray-700">Website (Optional)</label>
                <input
                  type="url"
                  value={data.eventWebsiteUrl}
                  onChange={(e) => setData({ ...data, eventWebsiteUrl: e.target.value || "" })}
                  placeholder="https://example.com"
                  className={inputBase}
                />
              </div>
            </section>

            {/* Media */}
            <section className={sectionCard}>
              <h2 className="text-lg font-semibold text-gray-900">Media</h2>
              <div className="mt-4">
                <label className="mb-1 block text-sm font-medium text-gray-700">Event Image</label>
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:border-indigo-400 transition">
                  <input id="imageUpload" type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                  <label htmlFor="imageUpload" className="cursor-pointer block">
                    {data.imagePreview ? (
                      <img
                        src={data.imagePreview}
                        alt="Preview"
                        className="mx-auto h-40 w-full object-cover rounded-lg"
                      />
                    ) : (
                      <div className="py-8 text-gray-500">Click to upload an image (JPG/PNG)</div>
                    )}
                  </label>
                </div>
              </div>
            </section>

            {/* Terms & Conditions */}
            <section className={sectionCard}>
              <h2 className="text-lg font-semibold text-gray-900">Terms & Conditions</h2>
              <div className="mt-4">
                <textarea
                  rows={7}
                  value={data.termsAndConditions}
                  onChange={(e) => setData({ ...data, termsAndConditions: e.target.value })}
                  placeholder="Any rules or conditions for attendees..."
                  className={inputBase}
                />
              </div>
            </section>

            {/* Actions */}
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Link
                href="/events"
                className="inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-5 py-2.5 font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-5 py-2.5 font-semibold text-white shadow-sm hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-60"
              >
                {loading ? "Creating..." : "Create Event"}
              </button>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>

          {/* Right summary */}
          <aside className="md:col-span-4">
            <div className={`${sectionCard} sticky top-30`}>
              <h3 className="text-base font-semibold text-gray-900">Live Summary</h3>

              <dl className="mt-4 space-y-4">
                <div>
                  <dt className="text-xs uppercase tracking-wide text-gray-500">When</dt>
                  <dd className="text-sm text-gray-900">{summary.when || "TBD"}</dd>
                </div>

                <div>
                  <dt className="text-xs uppercase tracking-wide text-gray-500">Where</dt>
                  <dd className="text-sm text-gray-900">{summary.where || "Location TBD"}</dd>
                  <p className="text-xs text-gray-500">
                    {data.isOnline ? "Online event" : "In-person event"}
                  </p>
                </div>

                <div>
                  <dt className="text-xs uppercase tracking-wide text-gray-500">Category</dt>
                  <dd className="text-sm text-gray-900">{data.category || "—"}</dd>
                </div>

                <div>
                  <dt className="text-xs uppercase tracking-wide text-gray-500">Capacity</dt>
                  <dd className="text-sm text-gray-900">{summary.capacity || "Unlimited"}</dd>
                </div>

                <div>
                  <dt className="text-xs uppercase tracking-wide text-gray-500">Tags</dt>
                  <dd className="text-sm text-gray-900">
                    {summary.tags !== "—" ? summary.tags : "—"}
                  </dd>
                </div>

                <hr className="border-gray-200" />

                <div>
                  <dt className="text-xs uppercase tracking-wide text-gray-500">Registration Period</dt>
                  <dd className="text-sm text-gray-900">
                    {data.registrationStartDate && data.registrationEndDate
                      ? `${new Date(data.registrationStartDate).toLocaleString()} — ${new Date(
                          data.registrationEndDate
                        ).toLocaleString()}`
                      : "Not specified"}
                  </dd>
                </div>

                {data.imagePreview && (
                  <div className="pt-2">
                    <dt className="text-xs uppercase tracking-wide text-gray-500">Event Image</dt>
                    <img
                      src={data.imagePreview}
                      alt="Preview"
                      className="mt-2 h-24 w-full rounded-md object-cover border border-gray-200"
                    />
                  </div>
                )}
              </dl>
            </div>
          </aside>
        </form>
      </main>
    </div>
  );
}

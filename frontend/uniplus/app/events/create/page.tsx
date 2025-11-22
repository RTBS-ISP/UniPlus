"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Navbar from "../../components/navbar";
import TagSelector from "../../components/events/TagSelector";
import EventScheduleDays, { DaySlot } from "../../components/events/EventScheduleDays";
import { useAlert } from "../../components/ui/AlertProvider";
import { Trash2, Loader } from "lucide-react";

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
  tags: string[];
  eventEmail: string;
  eventPhoneNumber: string;
  eventWebsiteUrl: string;
  termsAndConditions: string;
  registrationStartDate: string;
  registrationEndDate: string;
  eventStartDate: string;
  eventEndDate: string;
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
  const toast = useAlert();
  const searchParams = useSearchParams();
  const duplicateId = searchParams?.get("duplicate");

  const [data, setData] = useState<FormData>({
    eventTitle: "",
    eventDescription: "",
    category: "",
    maxAttendee: "",
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
    { date: "", startTime: "", endTime: "", isOnline: false, address: "", meetingLink: "" },
  ]);

  const [loading, setLoading] = useState(false);
  const [fetchingTemplate, setFetchingTemplate] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ========== DUPLICATION LOGIC ==========
  useEffect(() => {
    if (duplicateId) {
      fetchAndAutofill(parseInt(duplicateId));
    }
  }, [duplicateId]);

  const fetchAndAutofill = async (eventId: number) => {
    setFetchingTemplate(true);
    setError("");
    try {
      const res = await fetch(`http://localhost:8000/api/events/${eventId}`, {
        method: "GET",
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch event: ${res.status}`);
      }

      const eventData = await res.json();

      console.log("Fetched event data for duplication:", eventData);

      // Extract category from tags[0]
      let category = eventData.category || "";
      if (!category && eventData.tags && Array.isArray(eventData.tags) && eventData.tags.length > 0) {
        category = eventData.tags[0];
      }

      // Filter out category from tags list
      const filteredTags = (eventData.tags || []).filter((t: string) => t !== category && t.trim() !== "");

      // ✅ CRITICAL FIX: Convert image URL to File object for submission
      let imagePreviewUrl = "";
      let imageFileObject: File | null = null;
      const imageUrl = eventData.event_image || eventData.image;
      
      if (imageUrl) {
        // Build absolute URL for preview
        if (imageUrl.startsWith('http')) {
          imagePreviewUrl = imageUrl;
        } else if (imageUrl.startsWith('/')) {
          imagePreviewUrl = `http://localhost:8000${imageUrl}`;
        } else {
          imagePreviewUrl = `http://localhost:8000/media/${imageUrl}`;
        }

        // ✅ NEW: Fetch the image and convert to File object
        try {
          const imageRes = await fetch(imagePreviewUrl);
          if (imageRes.ok) {
            const blob = await imageRes.blob();
            // Get filename from URL
            const filename = imageUrl.split('/').pop() || 'event-image.jpg';
            imageFileObject = new File([blob], filename, { type: blob.type });
            console.log("✅ Image converted to File object:", filename);
          }
        } catch (imageErr) {
          console.warn("Could not fetch image, will skip it:", imageErr);
        }
      }

      console.log("Image URL:", imageUrl);
      console.log("Preview URL:", imagePreviewUrl);
      console.log("Image File Object:", imageFileObject ? "✅ Ready to submit" : "❌ Could not fetch");
      console.log("Optional fields:", {
        event_email: eventData.event_email,
        event_phone_number: eventData.event_phone_number,
        event_website_url: eventData.event_website_url,
        terms_and_conditions: eventData.terms_and_conditions,
      });

      // ✅ FIX: Auto-fill ALL fields including optional ones
      setData((prevData) => ({
        ...prevData,
        eventTitle: `${eventData.event_title || eventData.title} (Copy)`,
        eventDescription: eventData.event_description || "",
        category: category,
        maxAttendee: (eventData.max_attendee || eventData.capacity || "100").toString(),
        tags: filteredTags,
        
        // ✅ FIX: Optional fields - ensure they're strings not undefined
        eventEmail: eventData.event_email || "",
        eventPhoneNumber: eventData.event_phone_number || "",
        eventWebsiteUrl: eventData.event_website_url || "",
        termsAndConditions: eventData.terms_and_conditions || "",
        
        // ✅ CRITICAL: Set imageFile to the fetched File object (not null!)
        imagePreview: imagePreviewUrl,
        imageFile: imageFileObject, // ✅ This is the key fix!
      }));

      // ✅ FIX: Auto-fill schedule days with proper time fields and address
      if (eventData.schedule && Array.isArray(eventData.schedule)) {
        const daySlots: DaySlot[] = eventData.schedule.map(
          (s: any) => ({
            date: s.date || "",
            startTime: s.startTime || s.start_time || "",
            endTime: s.endTime || s.end_time || "",
            isOnline: s.is_online || s.isOnline || false,
            address: (s.address || s.location || eventData.event_address || "").trim() || "",
            meetingLink: s.meeting_link || s.meetingLink || "",
          })
        );
        if (daySlots.length > 0) {
          setScheduleDays(daySlots);
          console.log("Loaded schedule days:", daySlots);
        }
      }

      // Auto-fill registration dates
      if (eventData.start_date_register) {
        try {
          const regStart = new Date(eventData.start_date_register);
          setData((prevData) => ({
            ...prevData,
            registrationStartDate: regStart.toISOString().slice(0, 16),
          }));
        } catch (e) {
          console.error("Error parsing start_date_register:", e);
        }
      }

      if (eventData.end_date_register) {
        try {
          const regEnd = new Date(eventData.end_date_register);
          setData((prevData) => ({
            ...prevData,
            registrationEndDate: regEnd.toISOString().slice(0, 16),
          }));
        } catch (e) {
          console.error("Error parsing end_date_register:", e);
        }
      }

      toast({
        text: "Event template loaded successfully! Modify as needed.",
        variant: "success",
      });
    } catch (ex) {
      console.error("Failed to fetch event for duplication:", ex);
      const msg = "Failed to load event template. Try again.";
      setError(msg);
      toast({ text: msg, variant: "error" });
    } finally {
      setFetchingTemplate(false);
    }
  };

  // ========== END DUPLICATION LOGIC ==========

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

  const removeImage = () => {
    if (data.imagePreview) URL.revokeObjectURL(data.imagePreview);
    setData((s) => ({ ...s, imageFile: null, imagePreview: "" }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const summary = useMemo(() => {
    const first = scheduleDays.find((d) => d.date && d.startTime);
    const last = [...scheduleDays].reverse().find((d) => d.date && d.endTime);

    const when =
      first && last
        ? `${first.date} • ${first.startTime} → ${last.date} • ${last.endTime}`
        : "TBD";

    const firstWithLoc = scheduleDays.find(
      (d) => d.date && (d.isOnline || d.address.trim())
    );

    const where = firstWithLoc
      ? firstWithLoc.isOnline
        ? firstWithLoc.meetingLink
          ? "Online • Link provided"
          : "Online • Link TBD"
        : firstWithLoc.address || "Location TBD"
      : "Location TBD";

    const capacity = data.maxAttendee ? `${data.maxAttendee} people` : "Unlimited";

    return {
      when,
      where,
      capacity,
      tags: data.tags.length ? data.tags.join(", ") : "—",
      modeLabel: firstWithLoc ? (firstWithLoc.isOnline ? "Online event" : "In-person event") : "",
    };
  }, [scheduleDays, data.maxAttendee, data.tags]);

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
            is_online: d.isOnline,
            address: d.address,
            meeting_link: d.meetingLink,
            start_iso: toISO(d.date, d.startTime),
            end_iso: toISO(d.date, d.endTime),
          }))
        )
      );

      if (data.maxAttendee.trim()) formData.append("max_attendee", data.maxAttendee);
      if (data.tags.length) formData.append("tags", JSON.stringify(data.tags));
      if (data.eventEmail.trim()) formData.append("event_email", data.eventEmail);
      if (data.eventPhoneNumber.trim())
        formData.append("event_phone_number", data.eventPhoneNumber);
      if (data.eventWebsiteUrl.trim())
        formData.append("event_website_url", data.eventWebsiteUrl);
      if (data.termsAndConditions.trim())
        formData.append("terms_and_conditions", data.termsAndConditions);
      
      // ✅ CRITICAL FIX: Send imageFile if it exists
      // This now includes images from duplicated events (imageFile is set in fetchAndAutofill)
      if (data.imageFile) {
        formData.append("event_image", data.imageFile);
      }

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

  // Show loading state while fetching template
  if (fetchingTemplate) {
    return (
      <div className="min-h-screen bg-[#E0E7FF] flex items-center justify-center">
        <Navbar />
        <div className="flex flex-col items-center gap-4">
          <Loader className="h-8 w-8 text-indigo-600 animate-spin" />
          <p className="text-gray-600">Loading event template...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#E0E7FF]">
      <Navbar />

      <header className="mx-auto max-w-6xl px-5 pt-10">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
            {duplicateId ? "Create event from template" : "Create a new event"}
          </h1>
          <p className="text-gray-600">
            {duplicateId
              ? "The event details are pre-filled. Modify as needed and click Create."
              : "Add the core details, schedule your days, and publish."}
          </p>
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
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="category"
                    value={data.category}
                    onChange={(e) => setData({ ...data, category: e.target.value })}
                    className={`${inputBase} pr-8`}
                    required
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

            {/* Schedule & per-day location */}
            <section className={sectionCard}>
              <h2 className="text-lg font-semibold text-gray-900">Schedule & Location</h2>
              <p className="mt-1 text-sm text-gray-600">Add one or more days. Each has start/end times and its own location.</p>
              <div className="mt-4">
                <EventScheduleDays value={scheduleDays} onChange={setScheduleDays} />
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
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Max Attendees <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={data.maxAttendee}
                    onChange={(e) => setData({ ...data, maxAttendee: e.target.value })}
                    placeholder="e.g., 120"
                    className={inputBase}
                    required
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
                    onChange={(e) =>
                      setData({ ...data, eventPhoneNumber: e.target.value || "" })
                    }
                    placeholder="+66 8x xxx xxxx"
                    className={inputBase}
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Website (Optional)
                </label>
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
                <div className="mb-1 flex items-center justify-between">
                  <label htmlFor="imageUpload" className="block text-sm font-medium text-gray-700">
                    Event Image
                  </label>

                  {data.imagePreview && (
                    <button
                      type="button"
                      onClick={removeImage}
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-red-500 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                      Remove
                    </button>
                  )}
                </div>

                <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:border-indigo-400 transition">
                  <input
                    id="imageUpload"
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <label htmlFor="imageUpload" className="cursor-pointer block">
                    {data.imagePreview ? (
                      <img
                        src={data.imagePreview}
                        alt="Preview"
                        className="mx-auto h-40 w-full object-cover rounded-lg"
                        onError={(e) => {
                          console.error("Image failed to load:", e);
                          (e.target as HTMLImageElement).src = "/placeholder.png";
                        }}
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
                  onChange={(e) =>
                    setData({ ...data, termsAndConditions: e.target.value })
                  }
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
                  {summary.modeLabel && (
                    <p className="text-xs text-gray-500">{summary.modeLabel}</p>
                  )}
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
                      onError={(e) => console.error("Summary image load failed:", e)}
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
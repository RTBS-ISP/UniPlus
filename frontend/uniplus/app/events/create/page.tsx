"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Navbar from "../../components/navbar";
import { Loader } from "lucide-react";

import { useAlert } from "../../components/ui/AlertProvider";
import type { DaySlot } from "../../components/events/EventScheduleDays";

import type { FormData, Summary } from "../../../lib/create/types";
import { BasicsSection } from "../../components/create/BasicsSection";
import { ScheduleSection } from "../../components/create/ScheduleSection";
import { RegistrationWindowSection } from "../../components/create/RegistrationWindowSection";
import { CapacityTagsSection } from "../../components/create/CapacityTagsSection";
import { ContactInfoSection } from "../../components/create/ContactInfoSection";
import { MediaSection } from "../../components/create/MediaSection";
import { TermsSection } from "../../components/create/TermsSection";
import { SummarySidebar } from "../../components/create/SummarySidebar";

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

function toISO(date: string, time: string) {
  return new Date(`${date}T${time}:00`).toISOString();
}

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
    {
      date: "",
      startTime: "",
      endTime: "",
      isOnline: false,
      address: "",
      meetingLink: "",
    },
  ]);

  const [loading, setLoading] = useState(false);
  const [fetchingTemplate, setFetchingTemplate] = useState(false);
  const [error, setError] = useState("");

  const updateData = (patch: Partial<FormData>) => {
    setData((prev) => ({ ...prev, ...patch }));
  };

  // ========== DUPLICATION LOGIC ==========
  useEffect(() => {
    if (duplicateId) {
      fetchAndAutofill(parseInt(duplicateId, 10));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

      let category = eventData.category || "";
      if (
        !category &&
        eventData.tags &&
        Array.isArray(eventData.tags) &&
        eventData.tags.length > 0
      ) {
        category = eventData.tags[0];
      }

      const filteredTags = (eventData.tags || []).filter(
        (t: string) => t !== category && t.trim() !== ""
      );

      let imagePreviewUrl = "";
      let imageFileObject: File | null = null;
      const imageUrl = eventData.event_image || eventData.image;

      if (imageUrl) {
        if (imageUrl.startsWith("http")) {
          imagePreviewUrl = imageUrl;
        } else if (imageUrl.startsWith("/")) {
          imagePreviewUrl = `http://localhost:8000${imageUrl}`;
        } else {
          imagePreviewUrl = `http://localhost:8000/media/${imageUrl}`;
        }

        try {
          const imageRes = await fetch(imagePreviewUrl);
          if (imageRes.ok) {
            const blob = await imageRes.blob();
            const filename = imageUrl.split("/").pop() || "event-image.jpg";
            imageFileObject = new File([blob], filename, { type: blob.type });
            console.log("✅ Image converted to File object:", filename);
          }
        } catch (imageErr) {
          console.warn("Could not fetch image, will skip it:", imageErr);
        }
      }

      console.log("Image URL:", imageUrl);
      console.log("Preview URL:", imagePreviewUrl);
      console.log(
        "Image File Object:",
        imageFileObject ? "✅ Ready to submit" : "❌ Could not fetch"
      );
      console.log("Optional fields:", {
        event_email: eventData.event_email,
        event_phone_number: eventData.event_phone_number,
        event_website_url: eventData.event_website_url,
        terms_and_conditions: eventData.terms_and_conditions,
      });

      setData((prevData) => ({
        ...prevData,
        eventTitle: `${eventData.event_title || eventData.title} (Copy)`,
        eventDescription: eventData.event_description || "",
        category,
        maxAttendee: (eventData.max_attendee || eventData.capacity || "100").toString(),
        tags: filteredTags,
        eventEmail: eventData.event_email || "",
        eventPhoneNumber: eventData.event_phone_number || "",
        eventWebsiteUrl: eventData.event_website_url || "",
        termsAndConditions: eventData.terms_and_conditions || "",
        imagePreview: imagePreviewUrl,
        imageFile: imageFileObject,
      }));

      if (eventData.schedule && Array.isArray(eventData.schedule)) {
        const daySlots: DaySlot[] = eventData.schedule.map((s: any) => ({
          date: s.date || "",
          startTime: s.startTime || s.start_time || "",
          endTime: s.endTime || s.end_time || "",
          isOnline: s.is_online || s.isOnline || false,
          address:
            (s.address || s.location || eventData.event_address || "").trim() || "",
          meetingLink: s.meeting_link || s.meetingLink || "",
        }));
        if (daySlots.length > 0) {
          setScheduleDays(daySlots);
          console.log("Loaded schedule days:", daySlots);
        }
      }

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

  // ========== IMAGE HANDLERS ==========

  const handleImageChange = (file: File | null) => {
    setData((prev) => {
      // Clean up old blob URL if we created one
      if (prev.imagePreview && prev.imagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(prev.imagePreview);
      }

      if (!file) {
        return { ...prev, imageFile: null, imagePreview: "" };
      }

      const previewUrl = URL.createObjectURL(file);
      return {
        ...prev,
        imageFile: file,
        imagePreview: previewUrl,
      };
    });
  };

  const handleRemoveImage = () => {
    setData((prev) => {
      if (prev.imagePreview && prev.imagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(prev.imagePreview);
      }
      return { ...prev, imageFile: null, imagePreview: "" };
    });
  };

  // ========== SUMMARY ==========

  const summary: Summary = useMemo(() => {
    const first = scheduleDays.find((d) => d.date && d.startTime);
    const last = [...scheduleDays]
      .reverse()
      .find((d) => d.date && d.endTime);

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

    const capacity = data.maxAttendee
      ? `${data.maxAttendee} people`
      : "Unlimited";

    return {
      when,
      where,
      capacity,
      tags: data.tags.length ? data.tags.join(", ") : "—",
      modeLabel: firstWithLoc
        ? firstWithLoc.isOnline
          ? "Online event"
          : "In-person event"
        : "",
    };
  }, [scheduleDays, data.maxAttendee, data.tags]);

  // ========== SUBMIT ==========

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
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
        const startMs = new Date(
          `${d.date}T${d.startTime}:00`
        ).getTime();
        const endMs = new Date(
          `${d.date}T${d.endTime}:00`
        ).getTime();
        if (!(endMs > startMs)) {
          const msg = `Day ${i + 1}: end time must be after start time.`;
          setError(msg);
          toast({ text: msg, variant: "error" });
          setLoading(false);
          return;
        }
      }

      const starts = scheduleDays.map((d) => toISO(d.date, d.startTime));
      const ends = scheduleDays.map((d) => toISO(d.date, d.endTime));
      const overallStartISO = starts.reduce(
        (min, x) => (x < min ? x : min),
        starts[0]
      );
      const overallEndISO = ends.reduce(
        (max, x) => (x > max ? x : max),
        ends[0]
      );

      const csrfRes = await fetch(
        "http://localhost:8000/api/set-csrf-token",
        {
          method: "GET",
          credentials: "include",
        }
      );
      if (!csrfRes.ok) throw new Error("Failed to get CSRF token");
      const csrfData = await csrfRes.json();

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

      if (data.maxAttendee.trim()) {
        formData.append("max_attendee", data.maxAttendee);
      }
      if (data.tags.length) {
        formData.append("tags", JSON.stringify(data.tags));
      }
      if (data.eventEmail.trim()) {
        formData.append("event_email", data.eventEmail);
      }
      if (data.eventPhoneNumber.trim()) {
        formData.append("event_phone_number", data.eventPhoneNumber);
      }
      if (data.eventWebsiteUrl.trim()) {
        formData.append("event_website_url", data.eventWebsiteUrl);
      }
      if (data.termsAndConditions.trim()) {
        formData.append(
          "terms_and_conditions",
          data.termsAndConditions
        );
      }

      if (data.imageFile) {
        formData.append("event_image", data.imageFile);
      }

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
          ? result.detail
              .map(
                (err: any) => `${err.loc.join(".")}: ${err.msg}`
              )
              .join(", ")
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

  if (fetchingTemplate) {
    return (
      <div className="min-h-screen bg-[#E0E7FF]">
        <Navbar />
        <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader className="h-8 w-8 text-indigo-600 animate-spin" />
            <p className="text-gray-600">Loading event template...</p>
          </div>
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
            {duplicateId
              ? "Create event from template"
              : "Create a new event"}
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
            <BasicsSection
              data={data}
              onChange={updateData}
              categories={CATEGORIES}
            />

            <ScheduleSection
              scheduleDays={scheduleDays}
              onChange={setScheduleDays}
            />

            <RegistrationWindowSection
              data={data}
              onChange={updateData}
            />

            <CapacityTagsSection
              data={data}
              onChange={updateData}
            />

            <ContactInfoSection
              data={data}
              onChange={updateData}
            />

            <MediaSection
              imagePreview={data.imagePreview}
              onFileChange={handleImageChange}
              onRemoveImage={handleRemoveImage}
            />

            <TermsSection
              data={data}
              onChange={updateData}
            />

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

            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}
          </div>

          {/* Right summary */}
          <aside className="md:col-span-4">
            <SummarySidebar
              summary={summary}
              category={data.category}
              registrationStartDate={data.registrationStartDate}
              registrationEndDate={data.registrationEndDate}
              imagePreview={data.imagePreview}
            />
          </aside>
        </form>
      </main>
    </div>
  );
}

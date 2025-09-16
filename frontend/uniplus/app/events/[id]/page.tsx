"use client";

import { use, useState } from "react";
import Link from "next/link";
import Navbar from "../../components/navbar";
import { TagAccent } from "../../components/shared/Tag";
import { events } from "../../../lib/events/events-data";

// Augment base event type with optional detail fields (safe for mixed data)
type EventWithOptionals = (typeof events)[number] & {
  available?: number;
  startDate?: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  image?: string;
};

// Next.js 15: params is a Promise in client components
type Params = { params: Promise<{ id: string }> };

export default function EventDetailPage({ params }: Params) {
  // ✅ unwrap params Promise on the client
  const { id } = use(params);
  const numericId = Number(id);

  const event = events.find((e) => e.id === numericId) as
    | EventWithOptionals
    | undefined;

  if (!event) {
    return (
      <div className="min-h-screen bg-[#ece8f3]">
        <Navbar />
        <main className="mx-auto max-w-6xl px-4 py-16">
          <p className="text-lg font-medium">Event not found.</p>
        </main>
      </div>
    );
  }

  const [registered, setRegistered] = useState(false);

  // Safe fallbacks
  const hostLabel = event.host?.[0] ?? "Organizer";
  const available = event.available ?? 200;
  const startDate = event.startDate ?? "2025-09-01";
  const endDate = event.endDate ?? "2025-09-05";
  const startTime = event.startTime ?? "19:00";
  const endTime = event.endTime ?? "20:00";
  const location = event.location ?? "KU";
  const image =
    event.image ??
    "https://images.unsplash.com/photo-1604908176997-431651c0d2dc?q=80&w=1200&auto=format&fit=crop";

  const related = events.filter((e) => e.id !== numericId).slice(0, 6);

  const handleRegister = () => {
    if (registered) return;
    alert("✅ Registered!");
    setRegistered(true);
  };

  return (
    <div className="min-h-screen bg-[#ece8f3]">
      <Navbar />

      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
          {/* left: big image */}
          <div className="md:col-span-6">
            <div className="overflow-hidden rounded-xl bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image}
                alt={event.title}
                className="h-[420px] w-full object-cover"
              />
            </div>
          </div>

          {/* right: details */}
          <div className="md:col-span-6">
            <h1 className="text-3xl font-bold">{event.title}</h1>

            <div className="mt-3">
              <TagAccent label={hostLabel} />
            </div>

            <p className="mt-4 text-sm font-semibold">
              Available: {available} students
            </p>

            <div className="mt-3 rounded-xl bg-white p-4 shadow-sm">
              <dl className="space-y-2 text-sm text-gray-800">
                <div className="flex gap-2">
                  <dt className="w-24 font-medium">Date</dt>
                  <dd>
                    {formatDate(startDate)} - {formatDate(endDate)}
                  </dd>
                </div>
                <div className="flex gap-2">
                  <dt className="w-24 font-medium">Time</dt>
                  <dd>
                    {startTime} - {endTime}
                  </dd>
                </div>
                <div className="flex gap-2">
                  <dt className="w-24 font-medium">Location</dt>
                  <dd>{location}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="w-24 font-medium">Info</dt>
                  <dd className="text-gray-600">{event.excerpt}</dd>
                </div>
              </dl>
            </div>

            {/* Mock registration */}
            <button
              onClick={handleRegister}
              disabled={registered}
              className={`mt-4 block w-full rounded-lg px-4 py-3 text-center font-medium transition
                ${
                  registered
                    ? "bg-gray-300 text-gray-700 cursor-default"
                    : "bg-black text-white hover:bg-gray-800"
                }`}
            >
              {registered ? "Registered" : "Register"}
            </button>

            <p className="mt-2 text-center text-xs text-gray-500">
              Text box for additional details or fine print
            </p>
          </div>
        </div>

        {/* Related */}
        <section className="mt-10">
          <h2 className="text-xl font-semibold">Related Events</h2>
          <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((r) => (
              <RelatedCard key={r.id} item={r} />
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-black/10 bg-white/60 py-10">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-4 md:grid-cols-4">
          <div>
            <p className="text-sm text-gray-700">Site name</p>
            <div className="mt-3 flex items-center gap-3 text-gray-500">
              <div className="h-5 w-5 rounded-full border" />
              <div className="h-5 w-5 rounded-full border" />
              <div className="h-5 w-5 rounded-full border" />
              <div className="h-5 w-5 rounded-full border" />
            </div>
          </div>
          {["Topic", "Topic", "Topic"].map((t, i) => (
            <div key={i}>
              <p className="text-sm font-medium text-gray-800">{t}</p>
              <ul className="mt-3 space-y-1 text-sm text-gray-600">
                <li><a href="#" className="hover:underline">Page</a></li>
                <li><a href="#" className="hover:underline">Page</a></li>
                <li><a href="#" className="hover:underline">Page</a></li>
                <li><a href="#" className="hover:underline">Page</a></li>
              </ul>
            </div>
          ))}
        </div>
        <div className="mx-auto mt-8 max-w-6xl px-4 text-xs text-gray-500">
          © {new Date().getFullYear()} UniPLUS
        </div>
      </footer>
    </div>
  );
}

/** SSR/CSR-stable date formatting */
function formatDate(s: string) {
  try {
    const d = new Date(s);
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      timeZone: "UTC", // ensures same output on server & client
    }).format(d);
  } catch {
    return s;
  }
}

function RelatedCard({ item }: { item: EventWithOptionals }) {
  const img =
    item.image ??
    "https://images.unsplash.com/photo-1604908176997-431651c0d2dc?q=80&w=1200&auto=format&fit=crop";

  // Deterministic fallback (no Math.random to avoid hydration mismatch)
  const available = item.available ?? 20 + ((item.id * 37) % 120);
  const badge = item.host?.[0] ?? item.tags?.[0] ?? "Organizer";

  return (
    <Link
      href={`/events/${item.id}`}
      className="block rounded-xl bg-white shadow-sm transition hover:shadow-md"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={img} alt={item.title} className="h-40 w-full rounded-t-xl object-cover" />
      <div className="p-4">
        <h3 className="font-medium">{item.title}</h3>
        <div className="mt-2">
          <TagAccent label={badge} />
        </div>
        <p className="mt-1 text-sm text-gray-600">
          Available: {available} students
        </p>
      </div>
    </Link>
  );
}

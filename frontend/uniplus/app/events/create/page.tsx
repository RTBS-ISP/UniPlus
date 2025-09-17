"use client";

import { useState } from "react";
import Link from "next/link";
import Navbar from "../../components/navbar";
import TagPicker from "../../components/forms/TagPicker";

type FormData = {
  name: string;
  students: string;
  faculty: string;
  year: string;
  description: string;
  hostTags: string[];
  attendeeTags: string[];
  imageDataUrl?: string;
};

const FACULTIES = ["Engineering", "Science", "Business", "Humanities", "Architecture"];
const YEARS = ["Year1", "Year2", "Year3", "Year4"];

export default function EventCreatePage() {
  const [data, setData] = useState<FormData>({
    name: "",
    students: "",
    faculty: "",
    year: "",
    description: "",
    hostTags: ["Students", "Organizer"],
    attendeeTags: ["Engineer", "Year1"],
  });

  const onFile = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setData((d) => ({ ...d, imageDataUrl: String(reader.result || "") }));
    reader.readAsDataURL(file);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: send to API
    console.log("Create event payload", data);
    alert("Event created! (mock)");
  };

  return (
    <div className="min-h-screen bg-[#ece8f3]">
      <Navbar />

      <form onSubmit={submit} className="mx-auto max-w-5xl px-6 pb-20 pt-10">
        <h1 className="mb-8 text-center text-4xl text-black font-extrabold">Event Board Creation</h1>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm text-black font-medium">Event Name:</label>
            <input
              value={data.name}
              onChange={(e) => setData({ ...data, name: e.target.value })}
              placeholder="Fill in"
              className="w-full rounded-full bg-white text-black px-4 py-2 outline-none ring-1 ring-gray-200 focus:ring-2 focus:ring-black"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-black font-medium">Number of students:</label>
            <input
              type="number"
              min={0}
              value={data.students}
              onChange={(e) => setData({ ...data, students: e.target.value })}
              placeholder="Fill in"
              className="w-full rounded-full bg-white text-black px-4 py-2 outline-none ring-1 ring-gray-200 focus:ring-2 focus:ring-black"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-black font-medium">Faculty:</label>
            <select
              value={data.faculty}
              onChange={(e) => setData({ ...data, faculty: e.target.value })}
              className="w-full appearance-none rounded-full bg-white text-black px-4 py-2 ring-1 ring-gray-200 focus:ring-2 focus:ring-black"
            >
              <option value="">Select Faculty</option>
              {FACULTIES.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm text-black font-medium">Years:</label>
            <select
              value={data.year}
              onChange={(e) => setData({ ...data, year: e.target.value })}
              className="w-full appearance-none rounded-full bg-white text-black px-4 py-2 ring-1 ring-gray-200 focus:ring-2 focus:ring-black"
            >
              <option value="">Select Year</option>
              {YEARS.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-6">
          <label className="mb-2 block text-sm text-black font-medium">Descriptions:</label>
          <textarea
            value={data.description}
            onChange={(e) => setData({ ...data, description: e.target.value })}
            placeholder="Fill in description like date, time, location and what the event is about"
            rows={8}
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
              <input type="file" accept="image/*" className="hidden"
                     onChange={(e) => onFile(e.target.files?.[0])}/>
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
            className="rounded-lg bg-indigo-400 px-8 py-3 font-medium text-white hover:bg-indigo-300"
          >
            Confirm
          </button>
        </div>
      </form>
    </div>
  );
}

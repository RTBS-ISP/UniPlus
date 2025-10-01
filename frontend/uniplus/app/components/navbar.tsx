"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Menu } from "lucide-react";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("click", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("click", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, []);

  return (
    <header className="sticky top-0 z-30 w-full bg-white py-8 shadow-md">
      <nav className="bg-white text-black">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center">
            {/* Left side: 🎓 Logo */}
            <div className="text-2xl font-bold">
              <Link href="/">🎓UniPLUS</Link>
            </div>

            {/* Center Nav */}
            <ul className="hidden md:flex space-x-10 text-base font-medium">
              <li>
                <Link href="/" className="hover:underline">Home</Link>
              </li>
              <li>
                <Link href="/events" className="hover:underline">Events</Link>
              </li>
              <li>
                <Link href="/#" className="hover:underline">Page</Link>
              </li>
            </ul>

            {/* Right side: Auth + Hamburger */}
            <div className="flex items-center space-x-1 text-base font-medium">
              <Link href="/register" className="px-4 py-1 hover:underline text-gray-500">
                Sign Up?
              </Link>
              <a href="/login" className="inline-flex items-center justify-center w-full px-4 py-1 text-base font-bold leading-6 text-white bg-indigo-400 border border-transparent rounded-full md:w-auto hover:bg-indigo-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-400">
                Sign In
              </a>

              {/* Hamburger ALWAYS visible */}
              <div ref={menuRef} className="relative">
                <button
                  onClick={() => setOpen((s) => !s)}
                  aria-haspopup="menu"
                  aria-expanded={open}
                  aria-label="Open menu"
                  className="ml-2 inline-flex h-9 w-9 items-center justify-center rounded-full ring-1 ring-gray-300 hover:bg-gray-100"
                >
                  <Menu className="h-5 w-5" />
                </button>

                {/* Nav links duplicated for quick access */}
                {open && (
                  <div
                    role="menu"
                    className="absolute right-0 mt-2 w-48 overflow-hidden rounded-xl border border-black/10 bg-white shadow-xl z-50"
                  >
                    <Link href="/" className="block px-4 py-2 text-sm hover:bg-gray-50" onClick={() => setOpen(false)}>Home</Link>
                    <Link href="/events" className="block px-4 py-2 text-sm hover:bg-gray-50" onClick={() => setOpen(false)}>Events</Link>
                    <Link href="#" className="block px-4 py-2 text-sm hover:bg-gray-50" onClick={() => setOpen(false)}>Page</Link>
                    <div className="border-t border-gray-200" />
                    <Link href="/profile" className="block px-4 py-2 text-sm hover:bg-gray-50" onClick={() => setOpen(false)}>Profile</Link>
                    <Link href="/events/create" className="block px-4 py-2 text-sm hover:bg-gray-50" onClick={() => setOpen(false)}>Create Event</Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Menu, LogOut, User, Plus } from "lucide-react";
import { useUser } from "@/app/context/UserContext";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 });
  const menuRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const { user, setUser } = useUser();

  useEffect(() => {
    setMounted(true);

    const onDocClick = (e: MouseEvent) => {
      if (
        !menuRef.current?.contains(e.target as Node) &&
        !profileRef.current?.contains(e.target as Node)
      ) {
        setOpen(false);
        setProfileMenuOpen(false);
      }
    };

    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        setProfileMenuOpen(false);
      }
    };

    document.addEventListener("click", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("click", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, []);

  const handleLogout = async () => {
    try {
      const csrfRes = await fetch("http://localhost:8000/api/set-csrf-token", {
        credentials: "include",
      });
      const { csrftoken } = await csrfRes.json();

      await fetch("http://localhost:8000/api/logout", {
        method: "POST",
        credentials: "include",
        headers: {
          "X-CSRFToken": csrftoken,
        },
      });

      setUser(null);
      window.location.href = "/";
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const toggleProfileMenu = () => {
    if (!profileRef.current) return;
    const rect = profileRef.current.getBoundingClientRect();
    setMenuPosition({
      top: rect.bottom + 8,
      right: window.innerWidth - rect.right,
    });
    setProfileMenuOpen((s) => !s);
  };

  if (!mounted) return null;

  return (
    <header className="sticky top-0 z-30 w-full bg-white py-8 shadow-md">
      <nav className="bg-white text-black">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <div className="text-2xl font-bold">
              <Link href="/">🎓UniPLUS</Link>
            </div>

            {/* Links */}
            <ul className="hidden md:flex space-x-10 text-base font-medium">
              <li><Link href="/" className="hover:underline">Home</Link></li>
              <li><Link href="/events" className="hover:underline">Events</Link></li>
              <li><Link href="/#" className="hover:underline">Page</Link></li>
            </ul>

            {/* Right Side */}
            <div className="flex items-center space-x-3 text-base font-medium">
              {!user ? (
                <>
                  <Link href="/register" className="px-4 py-1 hover:underline text-gray-500">
                    Sign Up?
                  </Link>
                  <Link
                    href="/login"
                    className="inline-flex items-center justify-center px-4 py-1 text-base font-bold text-white bg-indigo-400 rounded-full hover:bg-indigo-300"
                  >
                    Sign In
                  </Link>
                </>
              ) : (
                <>
                  {/* Create Event Button */}
                  <Link
                    href="/events/create"
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-500 rounded-lg hover:bg-indigo-600 transition"
                  >
                    <Plus className="w-4 h-4" />
                    Create Event
                  </Link>

                  {/* Profile Menu */}
                  <div ref={profileRef} className="relative flex items-center space-x-2">
                    <button
                      onClick={toggleProfileMenu}
                      className="flex items-center space-x-2 focus:outline-none"
                    >
                      <img
                        src={
                          user.profilePic.startsWith("/images")
                            ? user.profilePic
                            : `http://localhost:8000${user.profilePic}`
                        }
                        alt="profile"
                        className="w-10 h-10 object-cover rounded-md border border-gray-300"
                      />
                      <span className="font-semibold">{user.firstName} {user.lastName}</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Dropdown Menu (fixed position) */}
        {profileMenuOpen && (
          <div
            ref={menuRef}
            role="menu"
            className="fixed w-48 rounded-xl border border-black/10 bg-white shadow-xl z-[9999]"
            style={{
              top: `${menuPosition.top}px`,
              right: `${menuPosition.right}px`,
            }}
          >
            <Link
              href="/profile"
              className="block px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
              onClick={() => setProfileMenuOpen(false)}
            >
              <User className="w-4 h-4" /> Profile
            </Link>
            <Link
              href="/mytickets"
              className="block px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
              onClick={() => setProfileMenuOpen(false)}
            >
              🎟️ My Tickets
            </Link>
            <hr className="my-1 border-gray-200" />
            <button
              onClick={handleLogout}
              className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 text-red-500"
            >
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>
        )}
      </nav>
    </header>
  );
}
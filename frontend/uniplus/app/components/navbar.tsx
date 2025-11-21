"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Menu, LogOut, User, Plus, Shield, Tickets } from "lucide-react";
import { useUser } from "@/app/context/UserContext";
import NotificationBell from "./Notificationbell";

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
            <div className="flex items-center space-x-2 text-2xl font-bold">
              <Link href="/" className="flex items-center space-x-2">
                <img
                  src="/images/monkey_1.png"
                  alt="UniPLUS Logo"
                  className="w-10 h-10 object-contain"
                />
                <span>UniPLUS</span>
              </Link>
            </div>

            {/* Links */}
            <ul className="hidden md:flex space-x-10 text-base font-medium">
              <li><Link href="/" className="hover:underline">Home</Link></li>
              <li><Link href="/events" className="hover:underline">Events</Link></li>
              <li><Link href="/support" className="hover:underline">Support</Link></li>
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
                    className="inline-flex items-center justify-center px-4 py-1 text-base font-bold text-white bg-indigo-500 rounded-lg hover:bg-indigo-600"
                  >
                    Sign In
                  </Link>
                </>
              ) : (
                <>
                  {/* Admin Button - Only visible for admin users */}
                  {user.role === "admin" ? (
                    <Link
                      href="/admin"
                      className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-500 rounded-lg hover:bg-indigo-600 transition"
                      title="Admin Dashboard"
                    >
                      <Shield className="w-4 h-4" />
                      Admin Dashboard
                    </Link>
                  ) : (
                    // Create Event Button - Only visible for normal users
                    <Link
                      href="/events/create"
                      className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-500 rounded-lg hover:bg-indigo-600 transition"
                    >
                      <Plus className="w-4 h-4" />
                      Create Event
                    </Link>
                    )
                  }

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

                  {/* Notification Bell */}
                  <NotificationBell />
                </>
              )}
            </div>
          </div>
        </div>

        {/* Dropdown Menu (fixed position) */}
        {profileMenuOpen && (
          <>
            {/* Backdrop for better UX */}
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setProfileMenuOpen(false)} 
            />
            
            <div
              ref={menuRef}
              role="menu"
              className="fixed w-56 rounded-lg border border-gray-200 bg-white shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
              style={{
                top: `${menuPosition.top}px`,
                right: `${menuPosition.right}px`,
              }}
            >
              {/* User Info Header */}
              <div className="px-4 py-3 bg-gradient-to-br from-indigo-50 to-purple-50 border-b border-gray-200">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {user.email}
                </p>
                <p className="text-xs text-gray-600 mt-0.5 capitalize">
                  {user.role === "admin" && "Administrator"}
                  {user.role === "student" && "Student"}
                  {user.role === "professor" && "Professor"}
                  {user.role === "organizer" && "Organizer"}
                </p>
              </div>

              {/* Menu Items */}
              <div className="py-1">
                <Link
                  href="/profile"
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors duration-150 group"
                  onClick={() => setProfileMenuOpen(false)}
                >
                  <div className="w-7 h-7 rounded bg-gray-100 flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
                    <User className="w-4 h-4" />
                  </div>
                  <span>My Profile</span>
                </Link>
                
                <Link
                  href="/my-ticket"
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors duration-150 group"
                  onClick={() => setProfileMenuOpen(false)}
                >
                  <div className="w-7 h-7 rounded bg-gray-100 flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
                    <Tickets className="w-4 h-4" />
                  </div>
                  <span>My Tickets</span>
                </Link>
              </div>

              {/* Logout Section */}
              <hr className="border-gray-200" />
              <div className="py-1">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors duration-150 font-medium group"
                >
                  <div className="w-7 h-7 rounded bg-red-50 flex items-center justify-center group-hover:bg-red-100 transition-colors">
                    <LogOut className="w-4 h-4" />
                  </div>
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </>
        )}
      </nav>
    </header>
  );
}
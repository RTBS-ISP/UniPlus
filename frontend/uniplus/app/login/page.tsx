'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUser } from '@/app/context/UserContext';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { setUser } = useUser();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Step 1: Get CSRF token from Django backend
      const csrfRes = await fetch("http://localhost:8000/api/set-csrf-token", {
        method: "GET",
        credentials: "include",
      });

      if (!csrfRes.ok) {
        throw new Error("Failed to get CSRF token");
      }

      const csrfData = await csrfRes.json();

      // Step 2: Login to Django backend
      const res = await fetch("http://localhost:8000/api/login", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": csrfData.csrftoken,
        },
        body: JSON.stringify({
          email: email,
          password: password,
        }),
      });

      const data = await res.json();

      if (data.success) {
        console.log('Login successful:', data.message);

        // Fetch the logged-in user's data right after login
        const userRes = await fetch('http://localhost:8000/api/user', {
          credentials: 'include',
        });

        if (userRes.ok) {
          const userData = await userRes.json();
          setUser(userData);
          console.log('User data set:', userData);
        }

        // Redirect to profile
        router.push('/profile');
      } else {
        setError(data.error || "Login failed. Please check your credentials");
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2 bg-[#E9E9F4]">
      <main className="flex flex-col items-center justify-center w-full px-4 sm:px-10 text-center">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl p-14">
          <h2 className="text-4xl font-bold mb-5 text-black">Login</h2>
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col space-y-4">
              {/* Email */}
              <div className="flex flex-col">
                <label className="flex items-start text-xs p-2 text-black">Email</label>
                <div className="bg-gray-100 p-2 flex items-center mb-5 rounded-full">
                  <input
                    type="email"
                    name="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-gray-100 text-black outline-none text-sm w-full px-3"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="flex flex-col">
                <label className="flex items-start text-xs p-2 text-black">Password</label>
                <div className="bg-gray-100 p-2 flex items-center mb-5 rounded-full">
                  <input
                    type="password"
                    name="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="bg-gray-100 text-black outline-none text-sm w-full px-3"
                  />
                </div>
              </div>

              {error && <p className="text-red-500 text-xs italic mb-4">{error}</p>}

              {/* Action Buttons */}
              <div className="flex justify-end gap-4 pt-3">
                <Link
                  href="/"
                  className="text-gray-500 hover:underline flex item-center text-sm py-2"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center justify-center w-full px-4 py-1 text-base font-bold leading-6 text-white bg-indigo-400 border border-transparent rounded-full md:w-auto hover:bg-indigo-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Logging in...' : 'Login'}
                </button>
              </div>

              <hr className="h-px my-5 bg-gray-200 border-0" />
              <div className="text-black text-md">
                Don't have an account?{' '}
                <Link href="/register" className="underline text-indigo-400">
                  Sign Up
                </Link>
              </div>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

export default LoginPage;
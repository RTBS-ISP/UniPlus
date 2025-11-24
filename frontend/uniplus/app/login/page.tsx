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

        const userRes = await fetch('http://localhost:8000/api/user', {
          credentials: 'include',
        });

        if (userRes.ok) {
          const userData = await userRes.json();
          setUser(userData);
          console.log('User data set:', userData);
        }

        router.replace('/profile');
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
    <div className="flex flex-col items-center justify-center min-h-screen py-2 bg-indigo-100">
      <main className="flex flex-col items-center justify-center w-full px-4 sm:px-10 text-center">
        <div className="flex items-start w-full max-w-3xl">
          <h1 className="text-5xl text-center font-extrabold mb-5 text-gray-800">Login</h1>
        </div>
        <div className="bg-white rounded-[30px] shadow-2xl w-full max-w-3xl p-14">
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col space-y-4">
              {/* Email */}
              <div className="flex flex-col">
                <label className="flex text-sm pb-2 text-gray-800">Email</label>
                <div className="bg-white border border-gray-200 p-1.5 mb-5 rounded-lg">
                  <input
                    type="email"
                    name="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-white text-gray-800 outline-none text-sm w-full px-3"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="flex flex-col">
                <label className="flex text-sm pb-2 text-gray-800">Password</label>
                <div className="bg-white border border-gray-200 p-1.5 mb-5 rounded-lg">
                  <input
                    type="password"
                    name="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="bg-white text-gray-800 outline-none text-sm w-full px-3"
                  />
                </div>
              </div>

              {error && <p className="text-red-500 text-xs italic mb-4">{error}</p>}

              {/* Action Buttons */}
              <div className="flex justify-end items-center pt-4 space-x-4">
                <Link
                  href="/"
                  className="text-gray-500 hover:underline flex item-center text-sm py-2"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center justify-center px-6 py-2 text-base font-bold leading-6 text-white bg-indigo-500 border border-transparent rounded-lg hover:bg-indigo-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Logging in...' : 'Login'}
                </button>
              </div>

              <div className="text-gray-800 text-md">
                Don't have an account?{' '}
                <Link href="/register" className="underline text-indigo-500">
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
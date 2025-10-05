"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface AboutMe {
  faculty?: string;
  year?: string;
  organizerName?: string;
}

interface User {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  phone: string;
  aboutMe: AboutMe | null;
  profilePic: string;
}

interface UserContextType {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  fetchUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType>({
  user: null,
  setUser: () => {},
  fetchUser: async () => {},
});

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // 💡 Reusable fetch function
  const fetchUser = async () => {
    try {
      const res = await fetch("http://localhost:8000/api/user", {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      } else {
        setUser(null);
      }
    } catch (err) {
      console.log("No logged-in user found");
      setUser(null);
    }
  };

  // Load user once when app starts
  useEffect(() => {
    fetchUser();
  }, []);

  return (
    <UserContext.Provider value={{ user, setUser, fetchUser }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);

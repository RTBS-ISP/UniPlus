'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from "../../components/navbar";
import { Tag } from "../../components/shared/Tag";

interface EventDetail {
  id: number;
  event_title: string;
  event_description: string;
  organizer_username: string;
  start_date_register: string;
  end_date_register: string;
  max_attendee: number;
  current_attendees: number;
  event_address: string;
  is_online: boolean;
  event_meeting_link: string;
  tags: string[];
  event_category: string;
  event_image: string;
}

export default function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [message, setMessage] = useState('');
  const router = useRouter();

  useEffect(() => {
    fetchEventDetail();
  }, [id]);

  const fetchEventDetail = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/events/${id}`, { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setEvent(data);
      }
    } catch (error) {
      console.error('Error fetching event:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    setRegistering(true);
    setMessage('');
    try {
      const csrfRes = await fetch('http://localhost:8000/api/set-csrf-token', { credentials: 'include' });
      const { csrftoken } = await csrfRes.json();

      const response = await fetch(`http://localhost:8000/api/events/${id}/register`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'X-CSRFToken': csrftoken },
      });

      const result = await response.json();
      if (response.ok) {
        setMessage('✅ Successfully registered! Redirecting...');
        setTimeout(() => router.push('/my-ticket'), 1500);
      } else {
        setMessage(result.error || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      setMessage('❌ Failed to register. Please try again.');
    } finally {
      setRegistering(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
        <Navbar />
        <div className="flex items-center justify-center h-screen">
          <div className="text-xl text-gray-900">Loading event...</div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
        <Navbar />
        <div className="flex items-center justify-center h-screen">
          <div className="text-xl text-gray-900">Event not found</div>
        </div>
      </div>
    );
  }

  const availableSpots = event.max_attendee - event.current_attendees;
  const registrationClosed = new Date() > new Date(event.end_date_register);
  const eventFull = availableSpots <= 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <Navbar />

      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="bg-white rounded-3xl shadow-lg overflow-hidden">

          {/* Event Image */}
          {event.event_image && (
            <div className="h-64 sm:h-80 overflow-hidden">
              <img 
                src={`http://localhost:8000${event.event_image}`}
                alt={event.event_title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="p-6 sm:p-10 text-gray-900">
            {/* Title & Category */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-5">
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold mb-1">
                  {event.event_title}
                </h1>
                <p className="text-base sm:text-lg">
                  Organized by <span className="font-semibold">{event.organizer_username}</span>
                </p>
              </div>
              <span className="inline-block px-3 py-1 mt-2 sm:mt-0 bg-indigo-100 text-indigo-900 rounded-full font-semibold text-sm">
                {event.event_category}
              </span>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-6">
              {event.tags.map((tag, idx) => <Tag key={idx} label={tag} />)}
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-xl">
              <div>
                <p className="text-gray-900 mb-1 font-medium">Registration Period</p>
                <p className="font-semibold">
                  {new Date(event.start_date_register).toLocaleDateString()} - {new Date(event.end_date_register).toLocaleDateString()}
                </p>
              </div>

              <div>
                <p className="text-gray-900 mb-1 font-medium">Available Spots</p>
                <p className="font-semibold text-lg">
                  <span className={availableSpots > 10 ? 'text-green-700' : 'text-orange-700'}>
                    {availableSpots}
                  </span> / {event.max_attendee}
                </p>
              </div>

              <div>
                <p className="text-gray-900 mb-1 font-medium">Location</p>
                <p className="font-semibold">
                  {event.is_online ? '🌐 Online Event' : event.event_address}
                </p>
              </div>

              {event.is_online && event.event_meeting_link && (
                <div>
                  <p className="text-gray-900 mb-1 font-medium">Meeting Link</p>
                  <a 
                    href={event.event_meeting_link}
                    target="_blank"
                    className="text-blue-800 hover:underline break-all"
                  >
                    Join Meeting
                  </a>
                </div>
              )}
            </div>

            {/* Description */}
            <div className="mb-6">
              <h2 className="text-2xl font-semibold mb-2">About This Event</h2>
              <p className="leading-relaxed whitespace-pre-line text-base sm:text-lg">
                {event.event_description}
              </p>
            </div>

            {/* Message */}
            {message && (
              <div className={`mb-6 p-4 rounded-lg text-base ${
                message.includes('✅') ? 'bg-green-50 text-green-900' : 'bg-red-50 text-red-900'
              }`}>
                {message}
              </div>
            )}

            {/* Register Button */}
            <button
              onClick={handleRegister}
              disabled={registering || registrationClosed || eventFull}
              className={`w-full py-3 sm:py-4 rounded-xl font-bold text-base sm:text-lg transition ${
                registrationClosed || eventFull
                  ? 'bg-gray-300 text-gray-800 cursor-not-allowed'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700'
              }`}
            >
              {registering ? 'Registering...' : 
               registrationClosed ? 'Registration Closed' :
               eventFull ? 'Event Full' :
               'Register for Event'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

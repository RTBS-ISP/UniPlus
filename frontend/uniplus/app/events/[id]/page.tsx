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
  event_start_date: string;
  event_end_date: string;
  max_attendee: number;
  current_attendees: number;
  event_address: string;
  is_online: boolean;
  event_meeting_link: string;
  tags: string[];
  event_image: string;
  is_registered: boolean;
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
        const ticketMessage = result.tickets_count > 1 
          ? `✅ Successfully registered! You received ${result.tickets_count} tickets (one for each day). Redirecting...`
          : '✅ Successfully registered! Redirecting...';
        setMessage(ticketMessage);
        setTimeout(() => router.push('/my-ticket'), 2000);
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

  const getEventDays = () => {
    if (!event) return 0;
    const start = new Date(event.event_start_date);
    const end = new Date(event.event_end_date);
    return Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
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
  const isRegistered = event.is_registered;
  const eventDays = getEventDays();

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
            {/* Title */}
            <div className="mb-5">
              <h1 className="text-3xl sm:text-4xl font-bold mb-1">
                {event.event_title}
              </h1>
              <p className="text-base sm:text-lg">
                Organized by <span className="font-semibold">{event.organizer_username}</span>
              </p>
            </div>

            {/* Multi-day Badge */}
            {eventDays > 1 && (
              <div className="mb-4 inline-block px-4 py-2 bg-indigo-100 text-indigo-900 rounded-full font-semibold text-sm">
                🗓️ {eventDays}-Day Event
              </div>
            )}

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-6">
              {event.tags.map((tag, idx) => <Tag key={idx} label={tag} />)}
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-xl">
              <div className="md:col-span-2 bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-900 mb-1 font-medium text-lg">📅 Event Date</p>
                {eventDays === 1 ? (
                  <p className="font-semibold text-xl">
                    {new Date(event.event_start_date).toLocaleString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                ) : (
                  <>
                    <p className="font-semibold text-lg">
                      {new Date(event.event_start_date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                    <p className="text-gray-600 text-sm mb-1">to</p>
                    <p className="font-semibold text-lg">
                      {new Date(event.event_end_date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </>
                )}
              </div>

              <div>
                <p className="text-gray-900 mb-1 font-medium">Registration Period</p>
                <p className="font-semibold text-sm">
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
              <div
                className={`mb-6 p-4 rounded-lg text-center font-medium ${
                  message.startsWith('✅')
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {message}
              </div>
            )}

            {/* Register Button */}
            <div className="flex justify-center">
              {isRegistered ? (
                <button
                  disabled
                  className="px-8 py-3 bg-gray-300 text-gray-700 rounded-full font-semibold cursor-not-allowed"
                >
                  Already Registered
                </button>
              ) : registrationClosed ? (
                <button
                  disabled
                  className="px-8 py-3 bg-gray-300 text-gray-700 rounded-full font-semibold cursor-not-allowed"
                >
                  Registration Closed
                </button>
              ) : eventFull ? (
                <button
                  disabled
                  className="px-8 py-3 bg-gray-300 text-gray-700 rounded-full font-semibold cursor-not-allowed"
                >
                  Event Full
                </button>
              ) : (
                <button
                  onClick={handleRegister}
                  disabled={registering}
                  className={`px-8 py-3 rounded-full font-semibold transition-all ${
                    registering
                      ? 'bg-indigo-300 cursor-wait'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                  }`}
                >
                  {registering ? 'Registering...' : 'Register Now'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

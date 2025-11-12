'use client';

import { useEffect, useState } from 'react';
import Navbar from '../components/navbar';
import { Bell, Check, Trash2, Filter } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

interface Notification {
  id: number;
  message: string;
  notification_type: string;
  is_read: boolean;
  created_at: string;
  related_ticket_id?: number | null;
  related_event_id?: number | null;
  event_title?: string | null;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:8000/api/notifications', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (notificationId: number) => {
    try {
      const csrfRes = await fetch('http://localhost:8000/api/set-csrf-token', {
        credentials: 'include',
      });
      const { csrftoken } = await csrfRes.json();

      const response = await fetch('http://localhost:8000/api/notifications/mark-read', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrftoken,
        },
        body: JSON.stringify({ notification_id: notificationId }),
      });

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notificationId ? { ...n, is_read: true } : n
          )
        );
      }
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const csrfRes = await fetch('http://localhost:8000/api/set-csrf-token', {
        credentials: 'include',
      });
      const { csrftoken } = await csrfRes.json();

      const response = await fetch('http://localhost:8000/api/notifications/mark-all-read', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrftoken,
        },
      });

      if (response.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const deleteNotification = async (notificationId: number) => {
    try {
      const csrfRes = await fetch('http://localhost:8000/api/set-csrf-token', {
        credentials: 'include',
      });
      const { csrftoken } = await csrfRes.json();

      const response = await fetch(`http://localhost:8000/api/notifications/${notificationId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'X-CSRFToken': csrftoken,
        },
      });

      if (response.ok) {
        setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const clearAll = async () => {
    if (!confirm('Are you sure you want to delete all notifications?')) return;

    try {
      const csrfRes = await fetch('http://localhost:8000/api/set-csrf-token', {
        credentials: 'include',
      });
      const { csrftoken } = await csrfRes.json();

      const response = await fetch('http://localhost:8000/api/notifications/clear-all', {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'X-CSRFToken': csrftoken,
        },
      });

      if (response.ok) {
        setNotifications([]);
      }
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'registration':
        return '📝';
      case 'approval':
        return '✅';
      case 'rejection':
        return '❌';
      case 'reminder_24h':
      case 'reminder_1h':
        return '⏰';
      case 'check_in':
        return '🎫';
      case 'event_update':
        return '📝';
      default:
        return '🔔';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'approval':
        return 'bg-green-50 border-green-200';
      case 'rejection':
        return 'bg-red-50 border-red-200';
      case 'reminder_24h':
      case 'reminder_1h':
        return 'bg-yellow-50 border-yellow-200';
      case 'registration':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const filteredNotifications =
    filter === 'unread'
      ? notifications.filter((n) => !n.is_read)
      : notifications;

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 pt-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Notifications
            </h1>
            <p className="text-gray-600">
              Stay updated with your events and tickets
            </p>
          </div>

          {/* Controls */}
          <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              {/* Filter Tabs */}
              <div className="flex gap-2">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    filter === 'all'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All ({notifications.length})
                </button>
                <button
                  onClick={() => setFilter('unread')}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    filter === 'unread'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Unread ({unreadCount})
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2"
                  >
                    <Check className="h-4 w-4" />
                    Mark all read
                  </button>
                )}
                {notifications.length > 0 && (
                  <button
                    onClick={clearAll}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Clear all
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Notifications List */}
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="text-gray-500 mt-4">Loading notifications...</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <Bell className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500 text-lg">
                {filter === 'unread'
                  ? 'No unread notifications'
                  : 'No notifications yet'}
              </p>
              <p className="text-gray-400 text-sm mt-2">
                Notifications will appear here when you register for events
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredNotifications.map((notification) => (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`bg-white rounded-lg shadow-sm p-6 border-l-4 transition hover:shadow-md ${
                    !notification.is_read
                      ? 'border-l-indigo-600'
                      : 'border-l-gray-300'
                  } ${getNotificationColor(notification.notification_type)}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    {/* Icon and Content */}
                    <div className="flex items-start gap-4 flex-1">
                      <div className="text-3xl flex-shrink-0">
                        {getNotificationIcon(notification.notification_type)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <p
                            className={`text-base ${
                              !notification.is_read
                                ? 'font-semibold text-gray-900'
                                : 'font-normal text-gray-700'
                            }`}
                          >
                            {notification.message}
                          </p>
                        </div>

                        {notification.event_title && (
                          <p className="text-sm text-gray-600 mb-2">
                            📅 {notification.event_title}
                          </p>
                        )}

                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span>{formatTimestamp(notification.created_at)}</span>
                          {!notification.is_read && (
                            <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full font-medium">
                              New
                            </span>
                          )}
                        </div>

                        {notification.related_event_id && (
                          <Link
                            href={`/events/${notification.related_event_id}`}
                            className="inline-block mt-3 text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                          >
                            View Event →
                          </Link>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {!notification.is_read && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                          title="Mark as read"
                        >
                          <Check className="h-5 w-5" />
                        </button>
                      )}
                      <button
                        onClick={() => deleteNotification(notification.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="Delete"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
'use client';

import { useState } from 'react';
import Navbar from "../components/navbar";
import Image from "next/image";
import { Mail, Phone, MessageCircle, Send, HelpCircle } from 'lucide-react';

export default function SupportPage() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [sent, setSent] = useState(false);

  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: any) => {
    e.preventDefault();
    console.log('Support message:', form);
    setSent(true);
    setTimeout(() => setSent(false), 3000);
    setForm({ name: '', email: '', message: '' });
  };

  const faqs = [
    { q: "How do I register for an event?", a: "Go to the Events page, click an event, and press 'Register'." },
    { q: "Can I cancel my registration?", a: "Yes, contact the organizer or our support team." },
    { q: "Where can I find my tickets?", a: "Go to your profile and open 'My Tickets'." },
  ];

  return (
    <main className="min-h-screen bg-[#E0E7FF]">
      <Navbar />

      {/* Hero Section with Mascot */}
      <section className="mt-24 px-6 md:px-12 flex flex-col-reverse md:flex-row items-center justify-center gap-12 text-center md:text-left">
        <div className="flex-1 max-w-xl mx-auto md:mx-0 md:pl-8">
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">
            How Can We Help?
          </h1>
          <p className="text-gray-700 text-lg">
            We're here to answer your questions and assist with anything about UniPLUS.
          </p>
        </div>

        <div className="flex-shrink-0">
          <div className="relative w-64 h-64 md:w-[20rem] md:h-[20rem]">
            <Image
              src="/images/monkey_5.png"
              alt="Support Mascot"
              fill
              className="object-contain drop-shadow-md"
              priority
            />
          </div>
        </div>
      </section>

      {/* Contact Info */}
      <section className="max-w-5xl mx-auto grid md:grid-cols-3 gap-6 px-4 mb-16 mt-16">
        <div className="bg-white border rounded-xl p-6 text-center hover:shadow-lg transition">
          <Mail className="w-8 h-8 text-indigo-500 mx-auto mb-3" />
          <h3 className="font-bold text-lg text-gray-900 mb-1">Email</h3>
          <p className="text-gray-600">support@uniplus.com</p>
        </div>

        <div className="bg-white border rounded-xl p-6 text-center hover:shadow-lg transition">
          <MessageCircle className="w-8 h-8 text-indigo-500 mx-auto mb-3" />
          <h3 className="font-bold text-lg text-gray-900 mb-1">Live Chat</h3>
          <p className="text-gray-600">Available Mon–Fri, 9am–6pm</p>
        </div>

        <div className="bg-white border rounded-xl p-6 text-center hover:shadow-lg transition">
          <Phone className="w-8 h-8 text-indigo-500 mx-auto mb-3" />
          <h3 className="font-bold text-lg text-gray-900 mb-1">Phone</h3>
          <p className="text-gray-600">+1 (555) 123-4567</p>
        </div>
      </section>

      {/* Contact Form + FAQ */}
      <section className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 px-4 pb-20">
        {/* Contact Form */}
        <div className="bg-white border rounded-2xl p-8 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Send className="text-indigo-500" />
            <h2 className="text-2xl font-bold text-gray-900">Send us a message</h2>
          </div>

          {sent ? (
            <div className="text-center text-green-600 font-semibold py-10">
              ✅ Message sent! We’ll reply soon.
            </div>
          ) : (
            <form onSubmit={handleSubmit} id="contact-form" className="space-y-4">
              <div>
                <label className="block text-gray-700 font-medium mb-1">Name</label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-indigo-200"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-indigo-200"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-1">Message</label>
                <textarea
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                  rows={5}
                  required
                  className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-indigo-200"
                ></textarea>
              </div>

              <button
                type="submit"
                className="w-full bg-indigo-500 text-white font-semibold py-3 rounded-lg hover:bg-indigo-600 transition"
              >
                Send
              </button>
            </form>
          )}
        </div>

        {/* FAQ Section */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <HelpCircle className="text-indigo-500" />
            <h2 className="text-2xl font-bold text-gray-900">FAQs</h2>
          </div>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <details key={i} className="bg-white border rounded-lg p-4 hover:bg-gray-50">
                <summary className="cursor-pointer font-semibold text-gray-900">
                  {faq.q}
                </summary>
                <p className="mt-2 text-gray-600">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

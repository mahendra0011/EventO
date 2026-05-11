import React from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, Mail, Phone, MapPin, Facebook, Twitter, Instagram, Linkedin, ArrowRight } from 'lucide-react';

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-cocoa-900 text-white">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr_0.8fr_1fr]">
          <div>
            <Link to="/" className="inline-flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-secondary-500 text-white">
                <CalendarDays className="h-6 w-6" />
              </span>
              <span>
                <span className="block text-2xl font-black uppercase tracking-tight">Evento</span>
                <span className="text-xs font-extrabold uppercase tracking-[0.2em] text-cocoa-300">
                  Events made easy
                </span>
              </span>
            </Link>
            <p className="mt-5 max-w-sm leading-7 text-cocoa-200">
              Discover memorable experiences, book with confidence, and give hosts a cleaner way to manage attendees.
            </p>
            <div className="mt-6 flex gap-3">
              {[
                { icon: Facebook, label: 'Facebook' },
                { icon: Twitter, label: 'Twitter' },
                { icon: Instagram, label: 'Instagram' },
                { icon: Linkedin, label: 'LinkedIn' }
              ].map((item) => (
                <button
                  key={item.label}
                  type="button"
                  className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 text-cocoa-200 transition-colors hover:border-primary-400 hover:text-white"
                  aria-label={item.label}
                >
                  <item.icon className="h-5 w-5" />
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-black text-white">Platform</h3>
            <ul className="mt-5 space-y-3">
              {[
                { to: '/', label: 'Home' },
                { to: '/events', label: 'Events' },
                { to: '/login', label: 'Login' },
                { to: '/register', label: 'Sign Up' }
              ].map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="font-semibold text-cocoa-200 transition-colors hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-black text-white">Categories</h3>
            <ul className="mt-5 space-y-3">
              {['Music', 'Technology', 'Sports', 'Business'].map((category) => (
                <li key={category}>
                  <Link to={`/events?category=${category}`} className="font-semibold text-cocoa-200 transition-colors hover:text-white">
                    {category}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-black text-white">Contact</h3>
            <ul className="mt-5 space-y-4">
              <li className="flex gap-3 text-cocoa-200">
                <MapPin className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary-300" />
                <span>123 Event Street, City, Country</span>
              </li>
              <li className="flex gap-3 text-cocoa-200">
                <Mail className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary-300" />
                <span>support@evento.com</span>
              </li>
              <li className="flex gap-3 text-cocoa-200">
                <Phone className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary-300" />
                <span>+1 (555) 123-4567</span>
              </li>
            </ul>
            <Link to="/register?host=true" className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-primary-200 hover:text-white">
              Become a host
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-white/10 pt-6 text-sm font-semibold text-cocoa-300 sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; {year} Evento. All rights reserved.</p>
          <p>Designed for event discovery, ticketing, and host operations.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

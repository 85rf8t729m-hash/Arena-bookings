/* ==========================================================================
   ARENA SETTINGS: edit this file to change what the website says.

   How to edit from your phone or computer:
     1. Open this file on GitHub and tap the pencil icon (Edit).
     2. Change the text between the "quotes".
     3. Tap "Commit changes". The website updates in a minute or two.

   Keep the quotes "", commas , and brackets [ ] { } exactly as they are.
   Lines starting with // are notes for you and are ignored by the website.
   ========================================================================== */

window.ARENA_CONFIG = {
  // The arena's name and a short introduction for the top of the page.
  name: "Riverside Arena",
  tagline: "Check availability and request a booking in under a minute.",
  description:
    "A floodlit, all-weather arena you can hire by the hour for training, lessons, clinics and private practice.",

  // How visitors send you their booking request.
  // Leave any you don't use as "" and that button will disappear.
  contact: {
    whatsapp: "447700900123",      // international format, digits only: no +, spaces or leading 0
    phone: "+44 7700 900123",      // shown on the site; used for calls and text messages
    email: "bookings@example.com",
  },

  address: "Riverside Lane, Hometown, AB1 2CD",
  mapLink: "", // optional link to your location; leave "" to link the address in Google Maps

  // Opening hours, 24-hour clock. Use null for a day you're closed.
  hours: {
    Mon: ["08:00", "21:00"],
    Tue: ["08:00", "21:00"],
    Wed: ["08:00", "21:00"],
    Thu: ["08:00", "21:00"],
    Fri: ["08:00", "21:00"],
    Sat: ["08:00", "18:00"],
    Sun: ["09:00", "17:00"],
  },

  slotMinutes: 60,   // length of one bookable slot, in minutes (30, 60, 90...)
  bookAheadDays: 60, // how many days ahead people can request a booking
  minNoticeHours: 1, // slots starting sooner than this from now can't be requested

  // Prices. For each slot the website uses the FIRST line that matches,
  // so keep a catch-all line (one with no days or times) at the end.
  // days: any of "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"
  // from / to: only slots starting in this time window match
  currency: "£",
  prices: [
    { name: "Weekends", perHour: 40, days: ["Sat", "Sun"] },
    { name: "Weekday evenings (from 5pm)", perHour: 40, days: ["Mon", "Tue", "Wed", "Thu", "Fri"], from: "17:00" },
    { name: "Weekday daytime", perHour: 30 },
  ],

  // What's included. Shown as a list on the page.
  facilities: [
    "Floodlights",
    "All-weather surface",
    "Free parking",
    "Toilets",
    "Spectator area",
  ],

  // Common questions. Add, remove or reword as you like.
  faqs: [
    {
      q: "Is my booking confirmed straight away?",
      a: "Not quite. Your request comes straight to us and we reply to confirm, usually within a few hours. The slot is yours once we've confirmed.",
    },
    {
      q: "How do I pay?",
      a: "We'll send payment details when we confirm your booking. Card, bank transfer and cash are all fine.",
    },
    {
      q: "Can I cancel or change my booking?",
      a: "Yes. Let us know at least 24 hours before your slot and there's no charge.",
    },
    {
      q: "Do I need an account?",
      a: "No. Pick a time, add your name and number, and send the request. That's it.",
    },
  ],
};

/* ==========================================================================
   BOOKED TIMES: anything listed here shows as "Booked" on the website.

   When you confirm a booking, add a line for it. If it's cancelled, delete
   the line. Dates are "YYYY-MM-DD" (year-month-day); times are 24-hour "HH:MM".

   To edit on GitHub: open this file, tap the pencil icon, make your change,
   then tap "Commit changes". The website updates in a minute or two.

   The entries below are EXAMPLES. Replace or delete them before going live.
   ========================================================================== */

window.ARENA_BOOKINGS = {
  // The date you last updated this file. Visitors see it under the times.
  lastUpdated: "2026-11-26",

  // One-off bookings.
  booked: [
    { date: "2026-11-28", from: "10:00", to: "12:00" },
    { date: "2026-11-29", from: "14:00", to: "16:00" },
    { date: "2026-12-02", from: "18:00", to: "21:00" },
  ],

  // Bookings that repeat every week, e.g. a club night.
  // "note" is just for you and is never shown on the website.
  weekly: [
    { day: "Tue", from: "18:00", to: "20:00", note: "Club training" },
    { day: "Thu", from: "17:00", to: "19:00", note: "Junior lessons" },
  ],

  // Days the arena is closed all day. The reason is shown to visitors.
  closed: [
    { date: "2026-12-25", reason: "Closed for Christmas Day" },
    { date: "2026-12-26", reason: "Closed for Boxing Day" },
  ],
};

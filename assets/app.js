/* ==========================================================================
   Arena booking site: page logic.
   You shouldn't need to edit this file. Change config.js and bookings.js.
   ========================================================================== */
(function () {
  "use strict";

  var DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  var WEEK_ORDER = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  var STORE_KEY = "arena-booking-details";

  var problems = [];
  var C = window.ARENA_CONFIG;
  var B = window.ARENA_BOOKINGS;
  if (!C || typeof C !== "object") {
    problems.push("config.js");
    C = {};
  }
  if (!B || typeof B !== "object") {
    problems.push("bookings.js");
    B = {};
  }

  // ---------- Small helpers ----------

  function $(id) { return document.getElementById(id); }

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function list(v) { return Array.isArray(v) ? v : []; }
  function str(v) { return v == null ? "" : String(v).trim(); }

  function num(v, fallback, min, max) {
    var n = Number(v);
    if (!isFinite(n)) return fallback;
    return Math.min(max, Math.max(min, n));
  }

  function pad(n) { return (n < 10 ? "0" : "") + n; }

  function toMin(t) {
    var m = /^(\d{1,2})[:.](\d{2})$/.exec(str(t));
    if (!m) return null;
    var v = Number(m[1]) * 60 + Number(m[2]);
    return v >= 0 && v <= 1440 ? v : null;
  }

  function dayKey(v) {
    var s = str(v).slice(0, 3).toLowerCase();
    return s ? s.charAt(0).toUpperCase() + s.slice(1) : "";
  }

  function isoOf(d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }

  function parseISO(s) {
    var m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(str(s));
    return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : null;
  }

  function addDays(d, n) { var x = new Date(d.getTime()); x.setDate(x.getDate() + n); return x; }

  function fmtTime(min) {
    var d = new Date(2000, 0, 1, 0, min);
    try { return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" }); }
    catch (e) { return pad(d.getHours()) + ":" + pad(d.getMinutes()); }
  }

  function fmtDate(d, opts) {
    try { return d.toLocaleDateString(undefined, opts); }
    catch (e) { return isoOf(d); }
  }

  function fmtDuration(mins) {
    var h = Math.floor(mins / 60), m = mins % 60, out = [];
    if (h) out.push(h + (h === 1 ? " hr" : " hrs"));
    if (m) out.push(m + " min");
    return out.join(" ");
  }

  function fmtMoney(n) {
    var rounded = Math.round(n * 100) / 100;
    var s = rounded % 1 === 0 ? String(rounded) : rounded.toFixed(2);
    return currency + s;
  }

  function safeUrl(u) { return /^https:\/\//i.test(str(u)) ? str(u) : ""; }

  // ---------- Settings ----------

  var name = str(C.name) || "Arena";
  var slotMin = Math.round(num(C.slotMinutes, 60, 5, 720));
  var aheadDays = Math.round(num(C.bookAheadDays, 60, 1, 730));
  var noticeMin = num(C.minNoticeHours, 0, 0, 24 * 60) * 60;
  var currency = str(C.currency);
  var contact = C.contact || {};
  var waDigits = str(contact.whatsapp).replace(/\D/g, "");
  var phone = str(contact.phone);
  var phoneDial = phone.replace(/[^\d+]/g, "");
  var email = str(contact.email);
  var address = str(C.address);
  var mapLink = safeUrl(C.mapLink) ||
    (address ? "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(address) : "");

  var priceRules = list(C.prices).filter(function (p) { return p && isFinite(Number(p.perHour)); });

  // ---------- Availability ----------

  var dayCache = {};

  function priceFor(dateObj, startMin) {
    var key = DAYS[dateObj.getDay()];
    for (var i = 0; i < priceRules.length; i++) {
      var r = priceRules[i];
      var days = [].concat(r.days || []).map(dayKey);
      if (days.length && days.indexOf(key) === -1) continue;
      var f = toMin(r.from), t = toMin(r.to);
      if (f != null && startMin < f) continue;
      if (t != null && startMin >= t) continue;
      return Number(r.perHour) * (slotMin / 60);
    }
    return null;
  }

  function busyRanges(iso, key) {
    var out = [];
    function add(from, to) {
      var f = toMin(from), t = toMin(to);
      if (f == null && t == null) { f = 0; t = 1440; } // no times = whole day
      if (f == null) f = 0;
      if (t == null) t = 1440;
      if (t > f) out.push([f, t]);
    }
    list(B.booked).forEach(function (b) {
      if (b && str(b.date) === iso) add(b.from, b.to);
    });
    list(B.weekly).forEach(function (w) {
      if (!w) return;
      var days = [].concat(w.days || w.day || []).map(dayKey);
      if (days.indexOf(key) !== -1) add(w.from, w.to);
    });
    return out;
  }

  function dayInfo(iso) {
    if (dayCache[iso]) return dayCache[iso];
    var d = parseISO(iso);
    var key = DAYS[d.getDay()];
    var info = { iso: iso, date: d, key: key, open: false, reason: "", slots: [] };

    var closure = list(B.closed).filter(function (c) { return c && str(c.date) === iso; })[0];
    var hours = C.hours && C.hours[key];
    var o = Array.isArray(hours) ? toMin(hours[0]) : null;
    var c = Array.isArray(hours) ? toMin(hours[1]) : null;

    if (closure) {
      info.reason = str(closure.reason) || "Closed";
    } else if (o == null || c == null || c <= o) {
      info.reason = "Closed on " + fmtDate(d, { weekday: "long" }) + "s";
    } else {
      info.open = true;
      info.openMin = o;
      info.closeMin = c;
      var busy = busyRanges(iso, key);
      var earliest = Date.now() + noticeMin * 60000;
      for (var s = o; s + slotMin <= c; s += slotMin) {
        var e = s + slotMin;
        var startTs = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, s).getTime();
        if (startTs < earliest) continue; // too late to request
        var booked = busy.some(function (r) { return s < r[1] && e > r[0]; });
        info.slots.push({ start: s, end: e, booked: booked, price: priceFor(d, s) });
      }
    }
    info.free = info.slots.filter(function (x) { return !x.booked; }).length;
    dayCache[iso] = info;
    return info;
  }

  // ---------- State ----------

  var today, lastDay, dates;
  var state = { date: null, sel: null }; // sel = [firstIndex, lastIndex] into the day's slots

  function computeDates() {
    dayCache = {};
    var now = new Date();
    today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    lastDay = addDays(today, aheadDays - 1);
    dates = [];
    for (var i = 0; i < aheadDays; i++) dates.push(isoOf(addDays(today, i)));
  }

  function currentDay() { return dayInfo(state.date); }

  function selection() {
    if (!state.sel) return null;
    var day = currentDay();
    var a = state.sel[0], b = state.sel[1];
    var slots = day.slots.slice(a, b + 1);
    if (!slots.length) return null;
    var price = 0, hasPrice = true;
    slots.forEach(function (s) { if (s.price == null) hasPrice = false; else price += s.price; });
    return {
      day: day,
      start: slots[0].start,
      end: slots[slots.length - 1].end,
      mins: slots[slots.length - 1].end - slots[0].start,
      price: hasPrice ? price : null,
    };
  }

  // ---------- Rendering: dates ----------

  var datesEl = $("dates");

  function renderDates() {
    datesEl.textContent = "";
    dates.forEach(function (iso, i) {
      var info = dayInfo(iso);
      var d = info.date;
      var b = el("button", "date");
      b.type = "button";
      b.dataset.date = iso;
      var wd = i === 0 ? "Today" : fmtDate(d, { weekday: "short" });
      if (i !== 0 && d.getDate() === 1) wd = fmtDate(d, { month: "short" }); // flag a new month
      var status;
      if (!info.open) { status = "Closed"; b.classList.add("is-closed"); }
      else if (!info.slots.length) { status = "No times"; b.classList.add("is-closed"); }
      else if (!info.free) { status = "Full"; b.classList.add("is-full"); }
      else status = info.free + " free";
      b.appendChild(el("span", "d-wd", wd));
      b.appendChild(el("span", "d-num", String(d.getDate())));
      b.appendChild(el("span", "d-st", status));
      b.setAttribute("aria-pressed", iso === state.date ? "true" : "false");
      b.setAttribute("aria-label", fmtDate(d, { weekday: "long", day: "numeric", month: "long" }) + ", " + status);
      datesEl.appendChild(b);
    });
    updateDateArrows();
  }

  function markSelectedDate() {
    var chips = datesEl.querySelectorAll(".date");
    for (var i = 0; i < chips.length; i++) {
      chips[i].setAttribute("aria-pressed", chips[i].dataset.date === state.date ? "true" : "false");
    }
  }

  function scrollDateIntoView(smooth) {
    var chip = datesEl.querySelector('[data-date="' + state.date + '"]');
    if (!chip) return;
    var left = chip.offsetLeft - datesEl.clientWidth / 2 + chip.clientWidth / 2;
    try { datesEl.scrollTo({ left: Math.max(0, left), behavior: smooth ? "smooth" : "auto" }); }
    catch (e) { datesEl.scrollLeft = Math.max(0, left); }
  }

  function updateDateArrows() {
    var max = datesEl.scrollWidth - datesEl.clientWidth - 2;
    $("datesPrev").disabled = datesEl.scrollLeft <= 2;
    $("datesNext").disabled = datesEl.scrollLeft >= max;
  }

  function scrollDates(dir) {
    var by = Math.max(160, datesEl.clientWidth - 80) * dir;
    try { datesEl.scrollBy({ left: by, behavior: "smooth" }); }
    catch (e) { datesEl.scrollLeft += by; }
  }

  // ---------- Rendering: slots ----------

  var slotsEl = $("slots");

  function renderDay() {
    var day = currentDay();
    var d = day.date;
    $("monthLabel").textContent = fmtDate(d, { month: "long", year: "numeric" });
    $("dayTitle").textContent = fmtDate(d, { weekday: "long", day: "numeric", month: "long" });
    $("dayHours").textContent = day.open ? "Open " + fmtTime(day.openMin) + " – " + fmtTime(day.closeMin) : "";
    renderSlots();
  }

  function renderSlots() {
    var day = currentDay();
    slotsEl.textContent = "";

    if (!day.open || !day.slots.length) {
      var box = el("div", "empty");
      var isToday = day.iso === dates[0];
      box.appendChild(el("strong", null, !day.open ? day.reason : isToday ? "No more times today" : "No times left on this day"));
      box.appendChild(document.createTextNode("Please choose another day."));
      var next = nextAvailable(day.iso);
      if (next) {
        var btn = el("button", "btn btn-ghost btn-sm", "Next available: " + fmtDate(parseISO(next), { weekday: "short", day: "numeric", month: "short" }));
        btn.type = "button";
        btn.addEventListener("click", function () { selectDate(next, true); });
        box.appendChild(document.createElement("br"));
        box.appendChild(btn);
      }
      slotsEl.appendChild(box);
      return;
    }

    var a = state.sel ? state.sel[0] : -1, b = state.sel ? state.sel[1] : -2;
    day.slots.forEach(function (s, i) {
      var btn = el("button", "slot");
      btn.type = "button";
      btn.dataset.i = String(i);
      var selected = i >= a && i <= b;
      btn.appendChild(el("span", "s-t", fmtTime(s.start)));
      var sub = s.booked ? "Booked" : s.price != null ? fmtMoney(s.price) : "Available";
      btn.appendChild(el("span", "s-s", sub));
      if (s.booked) {
        btn.disabled = true;
        btn.setAttribute("aria-label", fmtTime(s.start) + " to " + fmtTime(s.end) + ", booked");
      } else {
        btn.setAttribute("aria-pressed", selected ? "true" : "false");
        btn.setAttribute("aria-label", fmtTime(s.start) + " to " + fmtTime(s.end) + (s.price != null ? ", " + fmtMoney(s.price) : ""));
      }
      slotsEl.appendChild(btn);
    });
  }

  function nextAvailable(fromIso) {
    for (var i = 0; i < dates.length; i++) {
      if (dates[i] > fromIso && dayInfo(dates[i]).free) return dates[i];
    }
    return null;
  }

  function rangeFree(a, b) {
    var slots = currentDay().slots;
    for (var i = a; i <= b; i++) if (!slots[i] || slots[i].booked) return false;
    return true;
  }

  function tapSlot(i) {
    var s = state.sel;
    if (!s) state.sel = [i, i];
    else {
      var a = s[0], b = s[1];
      if (a === b && i === a) state.sel = null;
      else if (i > b) state.sel = rangeFree(a, i) ? [a, i] : [i, i];
      else if (i < a) state.sel = rangeFree(i, b) ? [i, b] : [i, i];
      else if (i === a) state.sel = [a + 1, b];
      else if (i === b) state.sel = [a, b - 1];
      else state.sel = [a, i];
    }
    hideSent();
    renderSlots();
    renderSummary();
  }

  function selectDate(iso, smooth) {
    if (dates.indexOf(iso) === -1) return;
    if (iso !== state.date) state.sel = null;
    state.date = iso;
    $("jumpDate").value = iso;
    markSelectedDate();
    scrollDateIntoView(smooth);
    renderDay();
    renderSummary();
    hideSent();
  }

  // ---------- Rendering: request summary ----------

  var summaryEl = $("summary");
  var bar = $("bar");

  function renderSummary() {
    var sel = selection();
    summaryEl.textContent = "";
    if (!sel) {
      summaryEl.className = "summary is-empty";
      summaryEl.textContent = "No time chosen yet. Pick a day and a start time.";
    } else {
      summaryEl.className = "summary";
      summaryEl.appendChild(el("div", "sum-date", fmtDate(sel.day.date, { weekday: "long", day: "numeric", month: "long" })));
      summaryEl.appendChild(el("div", "sum-time", fmtTime(sel.start) + " – " + fmtTime(sel.end)));
      var meta = el("div", "sum-meta");
      meta.appendChild(el("span", null, fmtDuration(sel.mins)));
      if (sel.price != null) {
        var p = el("span", null, "Estimated ");
        p.appendChild(el("strong", null, fmtMoney(sel.price)));
        meta.appendChild(p);
      }
      summaryEl.appendChild(meta);
    }
    updateSendState(sel);
    updateBar(sel);
  }

  function updateSendState(sel) {
    var btns = $("send").querySelectorAll(".btn");
    for (var i = 0; i < btns.length; i++) {
      btns[i].setAttribute("aria-disabled", sel ? "false" : "true");
    }
  }

  // Bottom bar on phones: visible while a time is chosen and the request card is off-screen.
  var requestVisible = false;

  function updateBar(sel) {
    sel = sel === undefined ? selection() : sel;
    var show = !!sel && !requestVisible;
    if (sel) {
      $("barMain").textContent = fmtDate(sel.day.date, { weekday: "short", day: "numeric", month: "short" }) +
        " · " + fmtTime(sel.start) + " – " + fmtTime(sel.end);
      $("barSub").textContent = fmtDuration(sel.mins) + (sel.price != null ? " · Est. " + fmtMoney(sel.price) : "");
    }
    bar.classList.toggle("is-shown", show);
    bar.setAttribute("aria-hidden", show ? "false" : "true");
    $("barGo").tabIndex = show ? 0 : -1;
    document.body.classList.toggle("has-bar", !!sel);
  }

  // ---------- Sending the request ----------

  var form = $("form");
  var fields = { name: $("fName"), phone: $("fPhone"), email: $("fEmail"), notes: $("fNotes") };

  var ICONS = {
    whatsapp: '<path d="M4 20l1.3-3.9A8 8 0 1 1 8.2 19z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M9 9.5c.3 2 2.5 4.2 4.5 4.5l1-1.2 1.8.8c-.2 1.2-1.1 1.9-2.3 1.9C10.8 15.5 8.5 13.2 8.5 10c0-1.2.7-2.1 1.9-2.3l.8 1.8z" fill="currentColor"/>',
    email: '<rect x="3" y="5" width="18" height="14" rx="2.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="m4 7 8 6 8-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>',
    sms: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H10l-5 4v-4.3A2.5 2.5 0 0 1 4 13.5z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>',
    phone: '<path d="M6.6 3.5h2.6l1.5 4.2-2 1.4a11 11 0 0 0 6.2 6.2l1.4-2 4.2 1.5v2.6a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 4.6 5.7a2 2 0 0 1 2-2.2z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>',
    copy: '<rect x="8" y="8" width="12" height="12" rx="2.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M16 8V6.5A2.5 2.5 0 0 0 13.5 4h-7A2.5 2.5 0 0 0 4 6.5v7A2.5 2.5 0 0 0 6.5 16H8" fill="none" stroke="currentColor" stroke-width="2"/>',
    pin: '<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="9.5" r="2.5" fill="none" stroke="currentColor" stroke-width="2"/>',
    check: '<path d="m5 12.5 4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>',
  };

  function icon(nameKey, size) {
    var s = size || 20;
    var span = document.createElement("span");
    span.setAttribute("aria-hidden", "true");
    // Icon markup is fixed text defined above, never visitor or settings data.
    span.innerHTML = '<svg viewBox="0 0 24 24" width="' + s + '" height="' + s + '">' + ICONS[nameKey] + "</svg>";
    return span.firstChild;
  }

  var channels = [];
  if (waDigits) channels.push({ id: "whatsapp", label: "WhatsApp", primary: true });
  if (email) channels.push({ id: "email", label: "Email" });
  if (phoneDial) channels.push({ id: "sms", label: "Text message" });
  channels.push({ id: "copy", label: "Copy request" });
  if (!channels[0].primary) channels[0].primary = true;

  function renderSendButtons() {
    var wrap = $("send");
    wrap.textContent = "";
    channels.forEach(function (ch) {
      var a = el("a", "btn " + (ch.primary ? "btn-primary" : "btn-ghost"));
      a.href = "#request";
      a.dataset.channel = ch.id;
      if (ch.id === "whatsapp") { a.target = "_blank"; a.rel = "noopener"; }
      a.appendChild(icon(ch.id));
      a.appendChild(document.createTextNode(ch.label));
      a.addEventListener("click", onSend);
      wrap.appendChild(a);
    });
    if (channels.length === 1) {
      $("sendLabel").textContent = "Copy your request and send it to us";
    }
  }

  function values() {
    return {
      name: str(fields.name.value),
      phone: str(fields.phone.value),
      email: str(fields.email.value),
      notes: str(fields.notes.value),
    };
  }

  function buildMessage() {
    var sel = selection();
    var v = values();
    var lines = [
      "Hello, I'd like to book " + name + ".",
      "",
      "Date: " + fmtDate(sel.day.date, { weekday: "long", day: "numeric", month: "long", year: "numeric" }),
      "Time: " + fmtTime(sel.start) + " - " + fmtTime(sel.end) + " (" + fmtDuration(sel.mins) + ")",
    ];
    if (sel.price != null) lines.push("Estimated price: " + fmtMoney(sel.price));
    lines.push("", "Name: " + v.name, "Phone: " + v.phone);
    if (v.email) lines.push("Email: " + v.email);
    if (v.notes) lines.push("Notes: " + v.notes);
    return lines.join("\n");
  }

  function clearErrors() {
    form.querySelectorAll(".err").forEach(function (n) { n.remove(); });
    Object.keys(fields).forEach(function (k) { fields[k].classList.remove("is-invalid"); fields[k].removeAttribute("aria-invalid"); });
  }

  function fieldError(input, message) {
    input.classList.add("is-invalid");
    input.setAttribute("aria-invalid", "true");
    var e = el("p", "err", message);
    e.id = input.id + "Err";
    input.setAttribute("aria-describedby", e.id);
    input.parentNode.appendChild(e);
  }

  function validate() {
    clearErrors();
    var v = values();
    var first = null;
    if (!v.name) { fieldError(fields.name, "Please add your name."); first = first || fields.name; }
    if (v.phone.replace(/\D/g, "").length < 6) { fieldError(fields.phone, "Please add a phone number so we can confirm."); first = first || fields.phone; }
    if (v.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email)) { fieldError(fields.email, "That email address doesn't look right."); first = first || fields.email; }
    if (first) { first.focus(); return false; }
    return true;
  }

  function onSend(ev) {
    var a = ev.currentTarget;
    var ch = a.dataset.channel;
    if (!selection()) {
      ev.preventDefault();
      toast("Choose a time first");
      $("book").scrollIntoView({ block: "start" });
      return;
    }
    if (!validate()) { ev.preventDefault(); return; }
    saveDetails();
    var msg = buildMessage();
    var subject = "Booking request: " + name + ", " +
      fmtDate(selection().day.date, { weekday: "short", day: "numeric", month: "short" });

    if (ch === "copy") {
      ev.preventDefault();
      copyText(msg).then(function () {
        toast("Request copied. Paste it into a message to us.");
        showSent("copy");
      }, function () { toast("Couldn't copy. Please try another way."); });
      return;
    }
    // Set the link at tap time; the phone or computer then opens the right app.
    if (ch === "whatsapp") a.href = "https://wa.me/" + waDigits + "?text=" + encodeURIComponent(msg);
    if (ch === "email") a.href = "mailto:" + email + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(msg);
    if (ch === "sms") a.href = "sms:" + phoneDial + "?&body=" + encodeURIComponent(msg);
    setTimeout(function () { showSent(ch); }, 400);
  }

  function showSent(ch) {
    var where = { whatsapp: "WhatsApp", email: "your email app", sms: "your messages app" }[ch];
    $("sentText").textContent = where
      ? "Check " + where + " and press Send. We'll reply to confirm your booking."
      : "Paste it into a message to us. We'll reply to confirm your booking.";
    $("sent").hidden = false;
  }

  function hideSent() { $("sent").hidden = true; }

  function saveDetails() {
    try {
      var v = values();
      localStorage.setItem(STORE_KEY, JSON.stringify({ name: v.name, phone: v.phone, email: v.email }));
    } catch (e) { /* storage unavailable: fine */ }
  }

  function loadDetails() {
    try {
      var v = JSON.parse(localStorage.getItem(STORE_KEY) || "null");
      if (!v) return;
      if (v.name) fields.name.value = String(v.name);
      if (v.phone) fields.phone.value = String(v.phone);
      if (v.email) fields.email.value = String(v.email);
    } catch (e) { /* ignore */ }
  }

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise(function (resolve, reject) {
      var ta = el("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      var ok = false;
      try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
      ta.remove();
      if (ok) resolve(); else reject();
    });
  }

  // ---------- Toast ----------

  var toastTimer;
  function toast(text) {
    var t = $("toast");
    t.textContent = text;
    t.classList.add("is-shown");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove("is-shown"); }, 2800);
  }

  // ---------- Static sections ----------

  function bindText() {
    document.querySelectorAll('[data-bind="name"]').forEach(function (n) { n.textContent = name; });
    var tagline = str(C.tagline), desc = str(C.description);
    document.querySelectorAll('[data-bind="tagline"]').forEach(function (n) { n.textContent = tagline; n.hidden = !tagline; });
    document.querySelectorAll('[data-bind="description"]').forEach(function (n) { n.textContent = desc; n.hidden = !desc; });
    document.title = name + " · Book online";
    $("year").textContent = String(new Date().getFullYear());
  }

  function renderHeroFacts() {
    var ul = $("heroFacts");
    ul.textContent = "";
    var info = dayInfo(dates[0]);
    var hours = C.hours && C.hours[DAYS[today.getDay()]];
    var o = Array.isArray(hours) ? toMin(hours[0]) : null, c = Array.isArray(hours) ? toMin(hours[1]) : null;
    if (info.open) {
      ul.appendChild(el("li", null, "Open today " + fmtTime(o) + " – " + fmtTime(c)));
    } else {
      ul.appendChild(el("li", "is-closed", "Closed today"));
    }
    if (priceRules.length) {
      var min = Math.min.apply(null, priceRules.map(function (p) { return Number(p.perHour); }));
      ul.appendChild(el("li", null, "From " + fmtMoney(min) + " an hour"));
    }
    ul.appendChild(el("li", null, "Book up to " + aheadDays + " days ahead"));
  }

  function renderPrices() {
    var ul = $("priceList");
    ul.textContent = "";
    priceRules.forEach(function (p) {
      var li = el("li");
      li.appendChild(el("span", null, str(p.name) || "Standard rate"));
      var amt = el("span", "p-amt", fmtMoney(Number(p.perHour)));
      amt.appendChild(el("span", null, " / hour"));
      li.appendChild(amt);
      ul.appendChild(li);
    });
    if (!priceRules.length) ul.appendChild(el("li", null, "Please contact us for prices."));
    $("slotNote").textContent = "Book in " + fmtDuration(slotMin) + " slots. Choose several in a row to book longer.";
  }

  function renderHours() {
    var ul = $("hoursList");
    ul.textContent = "";
    var todayKey = DAYS[today.getDay()];
    WEEK_ORDER.forEach(function (key) {
      var h = C.hours && C.hours[key];
      var o = Array.isArray(h) ? toMin(h[0]) : null, c = Array.isArray(h) ? toMin(h[1]) : null;
      var open = o != null && c != null && c > o;
      var li = el("li", open ? "" : "is-closed");
      if (key === todayKey) li.classList.add("is-today");
      var dayIdx = DAYS.indexOf(key);
      var sample = addDays(today, (dayIdx - today.getDay() + 7) % 7);
      li.appendChild(el("span", "h-day", fmtDate(sample, { weekday: "long" })));
      li.appendChild(el("span", "h-time", open ? fmtTime(o) + " – " + fmtTime(c) : "Closed"));
      ul.appendChild(li);
    });
  }

  function renderFacilities() {
    var items = list(C.facilities).map(str).filter(Boolean);
    $("facilitiesCard").hidden = !items.length;
    var ul = $("facilities");
    ul.textContent = "";
    items.forEach(function (f) {
      var li = el("li");
      li.appendChild(icon("check", 16));
      li.appendChild(document.createTextNode(f));
      ul.appendChild(li);
    });
  }

  function renderFaqs() {
    var items = list(C.faqs).filter(function (f) { return f && str(f.q); });
    $("faqCard").hidden = !items.length;
    var wrap = $("faqs");
    wrap.textContent = "";
    items.forEach(function (f) {
      var d = el("details");
      d.appendChild(el("summary", null, str(f.q)));
      d.appendChild(el("p", null, str(f.a)));
      wrap.appendChild(d);
    });
  }

  function contactItem(iconKey, label, value, href, newTab) {
    var li = el("li");
    var a = el("a");
    a.href = href;
    if (newTab) { a.target = "_blank"; a.rel = "noopener"; }
    var ic = el("span", "c-icon");
    ic.appendChild(icon(iconKey));
    a.appendChild(ic);
    var txt = el("span");
    txt.appendChild(el("span", "c-label", label));
    txt.appendChild(el("span", "c-value", value));
    a.appendChild(txt);
    li.appendChild(a);
    return li;
  }

  function renderContact() {
    var ul = $("contactList");
    ul.textContent = "";
    if (waDigits) ul.appendChild(contactItem("whatsapp", "WhatsApp", "Send us a message", "https://wa.me/" + waDigits, true));
    if (phoneDial) ul.appendChild(contactItem("phone", "Call", phone, "tel:" + phoneDial));
    if (email) ul.appendChild(contactItem("email", "Email", email, "mailto:" + email));
    if (!ul.children.length) ul.appendChild(el("li", "muted", "Contact details coming soon."));

    $("address").textContent = address || "Address coming soon.";
    var mapBtn = $("mapBtn");
    if (mapLink) {
      mapBtn.href = mapLink;
      mapBtn.textContent = "";
      mapBtn.appendChild(icon("pin", 18));
      mapBtn.appendChild(document.createTextNode("Open in Maps"));
    } else {
      mapBtn.hidden = true;
    }
  }

  function renderUpdated() {
    var d = parseISO(B.lastUpdated);
    var text = d
      ? "Availability last updated " + fmtDate(d, { day: "numeric", month: "long" }) + ". We confirm every request by message."
      : "We confirm every request by message.";
    if (problems.indexOf("bookings.js") !== -1) text = "Booked times couldn't be loaded, so every time shows as available. We'll confirm by message.";
    $("updated").textContent = text;
  }

  // ---------- Share & QR ----------

  function pageUrl() { return location.href.split("#")[0]; }

  function share() {
    var url = pageUrl();
    if (navigator.share) {
      navigator.share({ title: name, text: "Book " + name + " online", url: url }).catch(function () {});
      return;
    }
    copyText(url).then(function () { toast("Link copied"); }, function () { toast(url); });
  }

  var qrLoading = null;
  function loadQr() {
    if (window.qrcode) return Promise.resolve();
    if (qrLoading) return qrLoading;
    qrLoading = new Promise(function (resolve, reject) {
      var s = document.createElement("script");
      s.src = "assets/qrcode.js";
      s.onload = function () { resolve(); };
      s.onerror = function () { qrLoading = null; reject(); };
      document.head.appendChild(s);
    });
    return qrLoading;
  }

  function showQr() {
    var dlg = $("qrDialog");
    var url = pageUrl();
    loadQr().then(function () {
      var qr = window.qrcode(0, "M");
      qr.addData(url);
      qr.make();
      var img = el("img");
      img.alt = "QR code for " + url;
      img.src = qr.createDataURL(10, 2);
      var box = $("qrBox");
      box.textContent = "";
      box.appendChild(img);
      $("qrUrl").textContent = url;
      if (typeof dlg.showModal === "function") dlg.showModal();
      else dlg.setAttribute("open", "");
    }, function () {
      toast("Couldn't make the QR code. Use Share instead.");
    });
  }

  // ---------- Events ----------

  function wire() {
    datesEl.addEventListener("click", function (e) {
      var b = e.target.closest(".date");
      if (b) selectDate(b.dataset.date, true);
    });
    datesEl.addEventListener("scroll", function () { window.requestAnimationFrame(updateDateArrows); }, { passive: true });
    $("datesPrev").addEventListener("click", function () { scrollDates(-1); });
    $("datesNext").addEventListener("click", function () { scrollDates(1); });

    var jump = $("jumpDate");
    jump.min = dates[0];
    jump.max = dates[dates.length - 1];
    jump.addEventListener("change", function () {
      if (!jump.value) return;
      if (dates.indexOf(jump.value) === -1) {
        toast("Please choose a date between today and " + fmtDate(lastDay, { day: "numeric", month: "long" }));
        jump.value = state.date;
        return;
      }
      selectDate(jump.value, true);
    });

    slotsEl.addEventListener("click", function (e) {
      var b = e.target.closest(".slot");
      if (b && !b.disabled) tapSlot(Number(b.dataset.i));
    });

    Object.keys(fields).forEach(function (k) {
      fields[k].addEventListener("input", function () {
        if (fields[k].classList.contains("is-invalid")) {
          fields[k].classList.remove("is-invalid");
          fields[k].removeAttribute("aria-invalid");
          var err = $(fields[k].id + "Err");
          if (err) err.remove();
        }
      });
    });
    form.addEventListener("submit", function (e) { e.preventDefault(); });

    $("barGo").addEventListener("click", function () {
      var target = selection() && !fields.name.value ? fields.name : $("request");
      $("request").scrollIntoView({ behavior: "smooth", block: "start" });
      if (target === fields.name) setTimeout(function () { fields.name.focus({ preventScroll: true }); }, 450);
    });

    $("newRequest").addEventListener("click", function () {
      state.sel = null;
      fields.notes.value = "";
      hideSent();
      renderSlots();
      renderSummary();
      $("book").scrollIntoView({ behavior: "smooth", block: "start" });
    });

    $("shareTop").addEventListener("click", share);
    $("shareBtn").addEventListener("click", share);
    $("qrBtn").addEventListener("click", showQr);
    $("qrDialog").addEventListener("click", function (e) {
      if (e.target === e.currentTarget && typeof e.currentTarget.close === "function") e.currentTarget.close();
    });

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        requestVisible = entries[0].isIntersecting;
        updateBar();
      }, { rootMargin: "0px 0px -35% 0px" }).observe($("request"));
    }

    // If the page is left open (e.g. overnight), refresh times when it's looked at again.
    document.addEventListener("visibilitychange", function () {
      if (document.visibilityState !== "visible") return;
      var nowIso = isoOf(new Date());
      if (nowIso !== dates[0] || Date.now() - renderedAt > 5 * 60000) refresh();
    });
  }

  var renderedAt = Date.now();

  function refresh() {
    var keep = state.date;
    computeDates();
    renderDates();
    renderHeroFacts();
    renderHours();
    state.sel = null;
    selectDate(dates.indexOf(keep) !== -1 ? keep : (firstAvailable() || dates[0]), false);
    renderedAt = Date.now();
  }

  function firstAvailable() {
    for (var i = 0; i < dates.length; i++) if (dayInfo(dates[i]).free) return dates[i];
    return null;
  }

  function showProblems() {
    if (!problems.length) return;
    var box = $("problem");
    box.textContent = "Some booking information couldn't be loaded (" + problems.join(", ") +
      "). You can still contact us directly. Site owner: check the last change to that file for a missing quote or comma.";
    box.hidden = false;
  }

  // ---------- Start ----------

  function start() {
    showProblems();
    computeDates();
    bindText();
    renderSendButtons();
    loadDetails();
    renderDates();
    renderHeroFacts();
    renderPrices();
    renderHours();
    renderFacilities();
    renderFaqs();
    renderContact();
    renderUpdated();
    wire();
    state.date = firstAvailable() || dates[0];
    selectDate(state.date, false);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();

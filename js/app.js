// Spacetime telemetry, dual clock, Nolan philosophy ticker, and keyboard shortcuts.

import { initTasks, focusTaskInput } from "./tasks.js";
import { initTimer, toggleTimer, resetTimer } from "./timer.js";
import { initPanels } from "./panels.js";
import { initBackdrop, cycleBackdropMode } from "./backdrop.js";
import { initAmbient, cycleAmbientMode } from "./ambient.js";
import { initAtmosphere } from "./spotify.js";
import { initEmails } from "./emails.js";
import { initJobs, openJobs } from "./jobs.js";
import { initPrep } from "./prep.js";

const els = {
  date: document.getElementById("date"),
  telemetry: document.getElementById("telemetry-pill"),
  greeting: document.getElementById("greeting"),
  quote: document.getElementById("quote-ticker"),
  clock: document.getElementById("clock"),
  clockUtc: document.getElementById("clock-utc"),
};

const QUOTES = [
  "Love is the one thing that transcends time and space.",
  "Do not go gentle into that good night. Rage, rage against the dying of the light.",
  "We used to look up at the sky and wonder at our place in the stars.",
  "Murphy's Law doesn't mean something bad will happen. It means whatever can happen, will happen.",
  "Mankind was born on Earth. It was never meant to die here.",
  "Time is a dimension. It can stretch, it can squeeze, but it cannot run backwards.",
  "An hour on this planet is seven years back on Earth.",
  "We must reach far beyond our own lifespans.",
];

let quoteIndex = 0;

function greetingFor(hour) {
  if (hour < 5) return "Still awake";
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  if (hour < 22) return "Good evening";
  return "Good night";
}

function getDayOfYear(now) {
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now - start;
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
}

function isLeapYear(year) {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

function tickClock() {
  const now = new Date();

  if (els.clock) {
    els.clock.textContent = now.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    });
    els.clock.dateTime = now.toISOString();
  }

  if (els.clockUtc) {
    const utcHours = String(now.getUTCHours()).padStart(2, "0");
    const utcMinutes = String(now.getUTCMinutes()).padStart(2, "0");
    els.clockUtc.textContent = `${utcHours}:${utcMinutes} UTC`;
  }

  if (els.date) {
    els.date.textContent = now.toLocaleDateString(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  }

  if (els.telemetry) {
    const day = getDayOfYear(now);
    const totalDays = isLeapYear(now.getFullYear()) ? 366 : 365;
    els.telemetry.textContent = `Sol Day ${day} / ${totalDays}`;
  }

  if (els.greeting) {
    els.greeting.textContent = `${greetingFor(now.getHours())}, Tanishk`;
  }
}

function cycleQuote() {
  if (!els.quote) return;
  quoteIndex = (quoteIndex + 1) % QUOTES.length;
  els.quote.textContent = QUOTES[quoteIndex];
}

function isTyping(target) {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable ||
      /^(INPUT|TEXTAREA|SELECT|BUTTON)$/.test(target.tagName) ||
      target.closest("button"))
  );
}

function bindShortcuts() {
  document.addEventListener("keydown", async (event) => {
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    if (isTyping(event.target)) return;

    if (event.key === "/") {
      event.preventDefault();
      focusTaskInput();
    } else if (event.key === " ") {
      event.preventDefault();
      toggleTimer();
    } else if (event.key.toLowerCase() === "r") {
      resetTimer();
    } else if (event.key.toLowerCase() === "m") {
      event.preventDefault();
      await cycleAmbientMode();
    } else if (event.key.toLowerCase() === "b") {
      event.preventDefault();
      await cycleBackdropMode();
    } else if (event.key.toLowerCase() === "j") {
      event.preventDefault();
      await openJobs("today", event.shiftKey);
    }
  });
}

// Initialization
tickClock();
setInterval(tickClock, 10_000);

if (els.quote) {
  els.quote.textContent = QUOTES[0];
  els.quote.addEventListener("click", cycleQuote);
  setInterval(cycleQuote, 30_000);
}

bindShortcuts();
await initBackdrop();
await initAmbient();
await initTasks();
await initTimer();
await initPanels();
await initJobs();
await initPrep();
await initEmails();
await initAtmosphere();

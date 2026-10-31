// Greeting, clock, the J shortcut, and wiring for each panel.

import { initJobs, openJobs } from "./jobs.js";
import { initCalendar } from "./calendar.js";
import { initDeadlines } from "./deadlines.js";
import { initLinks } from "./links.js";

const dateEl = document.getElementById("date");
const greetingEl = document.getElementById("greeting");
const clockEl = document.getElementById("clock");

function greetingFor(hour) {
  if (hour < 5) return "Still up";
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  if (hour < 22) return "Good evening";
  return "Good night";
}

function tick() {
  const now = new Date();
  clockEl.textContent = now.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  clockEl.dateTime = now.toISOString();
  dateEl.textContent = now.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
  greetingEl.textContent = `${greetingFor(now.getHours())}, Tanishk`;
}

function isTyping(target) {
  return target instanceof HTMLElement && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName));
}

document.addEventListener("keydown", (event) => {
  if (event.metaKey || event.ctrlKey || event.altKey || isTyping(event.target)) return;
  if (event.key.toLowerCase() === "j") {
    event.preventDefault();
    openJobs("today", event.shiftKey);
  }
});

tick();
setInterval(tick, 10_000);

initLinks();
await Promise.all([initJobs(), initCalendar(), initDeadlines()]);

// Entry point: header, greeting, keyboard shortcuts, and module wiring.

import { initTasks, focusTaskInput } from "./tasks.js";
import { initTimer, toggleTimer, resetTimer } from "./timer.js";
import { initPanels } from "./panels.js";

const els = {
  date: document.getElementById("date"),
  greeting: document.getElementById("greeting"),
  clock: document.getElementById("clock"),
};

function greetingFor(hour) {
  if (hour < 5) return "Still up";
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  if (hour < 22) return "Good evening";
  return "Good night";
}

function tickClock() {
  const now = new Date();
  els.clock.textContent = now.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  els.clock.dateTime = now.toISOString();
  els.date.textContent = now.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
  els.greeting.textContent = `${greetingFor(now.getHours())}, Tanishk`;
}

function isTyping(target) {
  return target instanceof HTMLElement && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName));
}

function bindShortcuts() {
  document.addEventListener("keydown", (event) => {
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
    }
  });
}

tickClock();
setInterval(tickClock, 15_000);
bindShortcuts();
initTasks();
initTimer();
initPanels();

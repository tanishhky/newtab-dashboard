// Pomodoro timer. The end timestamp is stored, not a countdown, so the
// timer stays correct when the tab is throttled or the page reloads.

import { load, save } from "./store.js";

const RING_CIRCUMFERENCE = 2 * Math.PI * 52;
const DURATIONS = { focus: 25 * 60, break: 5 * 60 };
const KEY = "timer";
const SESSIONS_KEY = "sessions";

const els = {
  value: document.getElementById("ring-value"),
  label: document.getElementById("timer-label"),
  time: document.getElementById("timer-time"),
  toggle: document.getElementById("timer-toggle"),
  skip: document.getElementById("timer-skip"),
  reset: document.getElementById("timer-reset"),
  sessions: document.getElementById("focus-sessions"),
};

let state = { mode: "focus", running: false, endsAt: null, remaining: DURATIONS.focus };
let sessions = { date: today(), count: 0 };
let tickId = null;

function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function format(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function remainingNow() {
  if (state.running && state.endsAt) {
    return Math.max(0, Math.round((state.endsAt - Date.now()) / 1000));
  }
  return state.remaining;
}

function render() {
  const left = remainingNow();
  const total = DURATIONS[state.mode];
  const fraction = total ? left / total : 0;
  els.value.style.strokeDasharray = `${RING_CIRCUMFERENCE}`;
  els.value.style.strokeDashoffset = `${RING_CIRCUMFERENCE * (1 - fraction)}`;
  els.value.style.stroke = state.mode === "focus" ? "var(--accent)" : "var(--ok)";
  els.time.textContent = format(left);
  els.label.textContent = state.mode === "focus" ? "Focus" : "Break";
  els.toggle.textContent = state.running ? "Pause" : left === total ? "Start" : "Resume";
  els.sessions.textContent = `${sessions.count} today`;
  document.title = state.running ? `${format(left)} · Dashboard` : "Dashboard";
}

function persist() {
  save(KEY, state);
  save(SESSIONS_KEY, sessions);
}

function complete() {
  if (state.mode === "focus") {
    sessions = sessions.date === today() ? { date: today(), count: sessions.count + 1 } : { date: today(), count: 1 };
    switchMode("break");
  } else {
    switchMode("focus");
  }
  state.running = false;
  state.endsAt = null;
  persist();
  render();
}

function switchMode(mode) {
  state = { mode, running: false, endsAt: null, remaining: DURATIONS[mode] };
}

function tick() {
  if (remainingNow() <= 0) {
    clearInterval(tickId);
    tickId = null;
    complete();
    return;
  }
  render();
}

function start() {
  state.running = true;
  state.endsAt = Date.now() + state.remaining * 1000;
  clearInterval(tickId);
  tickId = setInterval(tick, 500);
  persist();
  render();
}

function pause() {
  state.remaining = remainingNow();
  state.running = false;
  state.endsAt = null;
  clearInterval(tickId);
  tickId = null;
  persist();
  render();
}

export function toggleTimer() {
  if (state.running) pause();
  else start();
}

export function resetTimer() {
  clearInterval(tickId);
  tickId = null;
  switchMode(state.mode);
  persist();
  render();
}

export async function initTimer() {
  const saved = await load(KEY, null);
  const savedSessions = await load(SESSIONS_KEY, null);
  if (savedSessions && savedSessions.date === today()) sessions = savedSessions;
  if (saved && DURATIONS[saved.mode]) {
    state = { ...state, ...saved };
    if (state.running && state.endsAt && state.endsAt <= Date.now()) {
      complete();
    } else if (state.running) {
      tickId = setInterval(tick, 500);
    }
  }

  els.toggle.addEventListener("click", toggleTimer);
  els.reset.addEventListener("click", resetTimer);
  els.skip.addEventListener("click", () => {
    clearInterval(tickId);
    tickId = null;
    complete();
  });
  render();
}

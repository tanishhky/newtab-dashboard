// Pomodoro timer: Endurance 12-Module Ring.
// Calculates remaining time from wall-clock timestamps (endsAt) to survive tab throttling.

import { load, save } from "./store.js";

const RING_CIRCUMFERENCE = 2 * Math.PI * 52;
const DURATIONS = { focus: 25 * 60, break: 5 * 60 };
const KEY = "timer";
const SESSIONS_KEY = "sessions";
const POD_COUNT = 12;

const els = {
  value: document.getElementById("ring-value"),
  pods: document.getElementById("ring-pods"),
  label: document.getElementById("timer-label"),
  time: document.getElementById("timer-time"),
  dilation: document.getElementById("timer-dilation"),
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

function initPods() {
  if (!els.pods) return;
  els.pods.innerHTML = "";
  const cx = 60;
  const cy = 60;
  const r = 52;

  for (let i = 0; i < POD_COUNT; i++) {
    // 12 pods spaced every 30 degrees (pi / 6)
    const angle = (i * (2 * Math.PI) / POD_COUNT) - (Math.PI / 2);
    const px = cx + r * Math.cos(angle);
    const py = cy + r * Math.sin(angle);

    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("cx", px.toFixed(2));
    circle.setAttribute("cy", py.toFixed(2));
    circle.setAttribute("r", "2.8");
    circle.setAttribute("class", "pod-dot");
    circle.setAttribute("id", `pod-${i}`);
    els.pods.appendChild(circle);
  }
}

function renderPods(fraction) {
  if (!els.pods) return;
  // Progress from 0 to 1
  const elapsedFraction = 1 - fraction;
  const activeCount = Math.floor(elapsedFraction * POD_COUNT);

  for (let i = 0; i < POD_COUNT; i++) {
    const pod = document.getElementById(`pod-${i}`);
    if (pod) {
      if (i < activeCount) {
        pod.classList.add("pod-active");
      } else {
        pod.classList.remove("pod-active");
      }
    }
  }

  if (els.dilation) {
    if (state.mode === "focus") {
      const elapsedSec = DURATIONS.focus - remainingNow();
      // Miller's planet dilation: 1 tick (1.25s) = 1 day on Earth
      const earthDays = ((elapsedSec / 1.25)).toFixed(1);
      els.dilation.textContent = `Dilated: ~${earthDays} Earth days (${activeCount}/${POD_COUNT} pods)`;
    } else {
      els.dilation.textContent = `Orbit recovery (${activeCount}/${POD_COUNT} pods)`;
    }
  }
}

function render() {
  const left = remainingNow();
  const total = DURATIONS[state.mode];
  const fraction = total ? left / total : 0;

  if (els.value) {
    els.value.style.strokeDasharray = `${RING_CIRCUMFERENCE}`;
    els.value.style.strokeDashoffset = `${RING_CIRCUMFERENCE * (1 - fraction)}`;
    els.value.style.stroke = state.mode === "focus" ? "var(--accent)" : "var(--ok)";
  }

  if (els.time) els.time.textContent = format(left);
  if (els.label) els.label.textContent = state.mode === "focus" ? "Focus" : "Break";
  if (els.toggle) els.toggle.textContent = state.running ? "Pause" : left === total ? "Start" : "Resume";
  if (els.sessions) els.sessions.textContent = `${sessions.count} today`;

  renderPods(fraction);

  document.title = state.running ? `${format(left)} · Endurance` : "Dashboard";
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
  initPods();
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

  els.toggle?.addEventListener("click", toggleTimer);
  els.reset?.addEventListener("click", resetTimer);
  els.skip?.addEventListener("click", () => {
    clearInterval(tickId);
    tickId = null;
    complete();
  });
  render();
}

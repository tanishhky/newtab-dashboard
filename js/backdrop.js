// Backdrop controller: a static sky painted once by js/sky.js (no image assets, no animation).
// Modes cycle with B or the Atmosphere card button.

import { load, save } from "./store.js";

const BACKDROP_KEY = "cosmos_backdrop_mode";

const BACKDROPS = {
  gargantua: { label: "Gargantua" },
  deep: { label: "Deep Field" },
  void: { label: "Void" },
};

const MODES = ["gargantua", "deep", "void"];
// Modes saved by the old GIF version map onto the nearest static one.
const LEGACY = { cinematic: "gargantua", orbit: "gargantua" };

let currentMode = "gargantua";
let repaint = null;

export async function initBackdrop() {
  const saved = await load(BACKDROP_KEY, "gargantua");
  currentMode = MODES.includes(saved) ? saved : LEGACY[saved] || "gargantua";
  const canvas = document.getElementById("sky");
  if (canvas && typeof window.mountSky === "function") {
    repaint = window.mountSky(canvas, currentMode);
  }
}

export async function cycleBackdropMode() {
  currentMode = MODES[(MODES.indexOf(currentMode) + 1) % MODES.length];
  await save(BACKDROP_KEY, currentMode);
  repaint?.(currentMode);
  const btn = document.getElementById("cosmos-toggle-btn");
  if (btn) btn.textContent = BACKDROPS[currentMode].label;
  return currentMode;
}

export function getBackdropMode() {
  return currentMode;
}

export function getBackdropLabel() {
  return BACKDROPS[currentMode].label;
}

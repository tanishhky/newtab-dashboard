// Cinematic space backdrop controller.
// Switches between high-resolution Interstellar assets and deep void black.

import { load, save } from "./store.js";

const BACKDROP_KEY = "cosmos_backdrop_mode";

const BACKDROPS = {
  cinematic: {
    src: "assets/gargantua-cinematic.gif",
    label: "Endurance Orbit",
    opacity: "0.68",
    fit: "cover",
  },
  orbit: {
    src: "assets/gargantua-orbit.gif",
    label: "Gargantua 360",
    opacity: "0.55",
    fit: "contain",
  },
  void: {
    src: "",
    label: "Void Black",
    opacity: "0",
    fit: "cover",
  },
};

const MODES = ["cinematic", "orbit", "void"];
let currentMode = "cinematic";

export async function initBackdrop() {
  const saved = await load(BACKDROP_KEY, "cinematic");
  currentMode = MODES.includes(saved) ? saved : "cinematic";
  applyBackdrop(currentMode);
}

function applyBackdrop(mode) {
  const img = document.getElementById("bg-media");
  const cfg = BACKDROPS[mode] || BACKDROPS.cinematic;
  if (!img) return;

  if (mode === "void" || !cfg.src) {
    img.style.opacity = "0";
  } else {
    img.src = cfg.src;
    img.style.objectFit = cfg.fit;
    img.style.opacity = cfg.opacity;
  }

  const btn = document.getElementById("cosmos-toggle-btn");
  if (btn) {
    btn.textContent = cfg.label;
  }
}

export async function cycleBackdropMode() {
  const nextIdx = (MODES.indexOf(currentMode) + 1) % MODES.length;
  currentMode = MODES[nextIdx];
  await save(BACKDROP_KEY, currentMode);
  applyBackdrop(currentMode);
  return currentMode;
}

export function getBackdropMode() {
  return currentMode;
}

export function getBackdropLabel() {
  return (BACKDROPS[currentMode] || BACKDROPS.cinematic).label;
}

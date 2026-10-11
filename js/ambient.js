// Web Audio API ambient sound engine: Miller's Planet tick and Deep Cosmic drone.
// 100% offline, zero network requests, zero dependencies.

import { load, save } from "./store.js";

const AMBIENT_KEY = "ambient_sound";
const VOLUME_KEY = "ambient_volume";

let audioCtx = null;
let masterGain = null;
let currentMode = "off"; // "off" | "drone" | "tick"
let volume = 0.3;

// Drone nodes
let droneNodes = [];

// Miller's tick timer
let tickIntervalId = null;

function getAudioContext() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
      masterGain = audioCtx.createGain();
      masterGain.gain.setValueAtTime(volume, audioCtx.currentTime);
      masterGain.connect(audioCtx.destination);
    }
  }
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
}

// 1. Miller's Planet acoustic tick generator
// Interstellar signature: 1 tick every 1.25 seconds = 1 day on Earth
function playMillerTick() {
  const ctx = getAudioContext();
  if (!ctx || currentMode !== "tick") return;

  const now = ctx.currentTime;

  // Mechanical click: High-frequency filtered noise impulse
  const bufferSize = Math.floor(ctx.sampleRate * 0.025);
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const output = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.005));
  }

  const whiteNoise = ctx.createBufferSource();
  whiteNoise.buffer = buffer;

  const noiseFilter = ctx.createBiquadFilter();
  noiseFilter.type = "bandpass";
  noiseFilter.frequency.setValueAtTime(1400, now);
  noiseFilter.Q.setValueAtTime(3.5, now);

  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0.7, now);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);

  whiteNoise.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  noiseGain.connect(masterGain);

  whiteNoise.start(now);
  whiteNoise.stop(now + 0.03);

  // Acoustic wood body resonance (720Hz decaying fast)
  const osc = ctx.createOscillator();
  const oscGain = ctx.createGain();

  osc.type = "sine";
  osc.frequency.setValueAtTime(740, now);
  osc.frequency.exponentialRampToValueAtTime(220, now + 0.04);

  oscGain.gain.setValueAtTime(0.5, now);
  oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

  osc.connect(oscGain);
  oscGain.connect(masterGain);

  osc.start(now);
  osc.stop(now + 0.05);
}

function startMillerTicks() {
  stopMillerTicks();
  playMillerTick();
  // Exact 1.25 second interval (80 BPM Miller's Planet cadence)
  tickIntervalId = setInterval(playMillerTick, 1250);
}

function stopMillerTicks() {
  if (tickIntervalId) {
    clearInterval(tickIntervalId);
    tickIntervalId = null;
  }
}

// 2. Cosmic Ambient Drone (Endurance Void Ambience)
function startCosmicDrone() {
  stopCosmicDrone();
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;

  // Binaural low hum: 55Hz (A1) and 55.4Hz (0.4Hz meditative pulsation)
  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const subOsc = ctx.createOscillator();

  osc1.type = "sine";
  osc1.frequency.setValueAtTime(55.0, now);

  osc2.type = "triangle";
  osc2.frequency.setValueAtTime(55.4, now);

  subOsc.type = "sine";
  subOsc.frequency.setValueAtTime(110.0, now);

  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(180, now);
  filter.Q.setValueAtTime(2.0, now);

  // Slow LFO for space filter breathing
  const lfo = ctx.createOscillator();
  const lfoGain = ctx.createGain();
  lfo.frequency.setValueAtTime(0.08, now); // 12-second cycle
  lfoGain.gain.setValueAtTime(40, now);

  lfo.connect(filter.frequency);

  const droneGain = ctx.createGain();
  droneGain.gain.setValueAtTime(0.001, now);
  droneGain.gain.exponentialRampToValueAtTime(0.6, now + 2.0); // Smooth 2s fade in

  osc1.connect(filter);
  osc2.connect(filter);
  subOsc.connect(filter);

  filter.connect(droneGain);
  droneGain.connect(masterGain);

  osc1.start(now);
  osc2.start(now);
  subOsc.start(now);
  lfo.start(now);

  droneNodes = [osc1, osc2, subOsc, lfo, droneGain];
}

function stopCosmicDrone() {
  if (droneNodes.length) {
    const ctx = audioCtx;
    if (ctx) {
      const gainNode = droneNodes[droneNodes.length - 1];
      if (gainNode && gainNode.gain) {
        gainNode.gain.setValueAtTime(gainNode.gain.value, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      }
    }
    setTimeout(() => {
      droneNodes.forEach((node) => {
        try {
          if (node.stop) node.stop();
          if (node.disconnect) node.disconnect();
        } catch {
          // cleanup
        }
      });
      droneNodes = [];
    }, 600);
  }
}

export async function setAmbientMode(mode) {
  currentMode = mode;
  await save(AMBIENT_KEY, mode);

  if (mode === "off") {
    stopMillerTicks();
    stopCosmicDrone();
  } else if (mode === "tick") {
    stopCosmicDrone();
    startMillerTicks();
  } else if (mode === "drone") {
    stopMillerTicks();
    startCosmicDrone();
  }

  dispatchModeChange();
}

export async function cycleAmbientMode() {
  const modes = ["off", "tick", "drone"];
  const next = modes[(modes.indexOf(currentMode) + 1) % modes.length];
  await setAmbientMode(next);
  return next;
}

export function getAmbientMode() {
  return currentMode;
}

export async function setAmbientVolume(val) {
  volume = Math.max(0, Math.min(1, val));
  if (masterGain && audioCtx) {
    masterGain.gain.setValueAtTime(volume, audioCtx.currentTime);
  }
  await save(VOLUME_KEY, volume);
}

export function getAmbientVolume() {
  return volume;
}

function dispatchModeChange() {
  window.dispatchEvent(new CustomEvent("ambient-mode-change", { detail: { mode: currentMode, volume } }));
}

export async function initAmbient() {
  currentMode = await load(AMBIENT_KEY, "off");
  volume = await load(VOLUME_KEY, 0.3);

  // Resume or stop on visibility change
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      if (currentMode === "tick") stopMillerTicks();
      if (currentMode === "drone") stopCosmicDrone();
    } else {
      if (currentMode === "tick") startMillerTicks();
      if (currentMode === "drone") startCosmicDrone();
    }
  });
}

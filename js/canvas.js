// Interactive deep-space canvas: Starfield and Gargantua gravitational lens.
// Designed with zero dependencies, 60fps performance, and pauses on hidden tabs.

import { load, save } from "./store.js";

const COSMOS_KEY = "cosmos_mode";
const MODES = ["gargantua", "stars", "void"];

let canvas = null;
let ctx = null;
let mode = "gargantua";
let animId = null;
let width = 0;
let height = 0;
let dpr = 1;
let stars = [];
let mouse = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 };
let time = 0;

function createStars(count) {
  const result = [];
  for (let i = 0; i < count; i++) {
    result.push({
      x: Math.random(),
      y: Math.random(),
      z: Math.random() * 0.8 + 0.2, // depth
      size: Math.random() * 1.4 + 0.6,
      baseAlpha: Math.random() * 0.7 + 0.2,
      flickerSpeed: Math.random() * 0.03 + 0.01,
      phase: Math.random() * Math.PI * 2,
    });
  }
  return result;
}

function resize() {
  if (!canvas) return;
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = Math.floor(width * dpr);
  canvas.height = Math.floor(height * dpr);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  if (ctx) ctx.scale(dpr, dpr);
}

function drawGargantua(cx, cy, radius) {
  if (mode !== "gargantua") return;

  ctx.save();
  ctx.translate(cx, cy);

  // Parallax tilt from mouse
  const tiltX = (mouse.x - 0.5) * 0.15;
  const tiltY = (mouse.y - 0.5) * 0.1;
  ctx.transform(1, tiltY, tiltX, 1, 0, 0);

  // 1. Outer gravitational lensing glow (soft amber corona)
  const outerGlow = ctx.createRadialGradient(0, 0, radius * 0.8, 0, 0, radius * 3.2);
  outerGlow.addColorStop(0, "rgba(255, 175, 65, 0.22)");
  outerGlow.addColorStop(0.35, "rgba(225, 120, 30, 0.10)");
  outerGlow.addColorStop(0.7, "rgba(80, 50, 110, 0.04)");
  outerGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = outerGlow;
  ctx.beginPath();
  ctx.arc(0, 0, radius * 3.2, 0, Math.PI * 2);
  ctx.fill();

  // 2. The primary accretion disk (warped vertical ring from relativistic lensing)
  // Back warped arch
  ctx.save();
  ctx.scale(1, 1.4);
  const backArchGrad = ctx.createRadialGradient(0, 0, radius * 1.05, 0, 0, radius * 1.6);
  backArchGrad.addColorStop(0, "rgba(255, 220, 140, 0.75)");
  backArchGrad.addColorStop(0.4, "rgba(235, 130, 35, 0.5)");
  backArchGrad.addColorStop(0.85, "rgba(180, 70, 20, 0.2)");
  backArchGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = backArchGrad;
  ctx.beginPath();
  ctx.arc(0, 0, radius * 1.6, Math.PI, 0, false);
  ctx.arc(0, 0, radius * 1.05, 0, Math.PI, true);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // 3. Lower warped arch
  ctx.save();
  ctx.scale(1, 1.25);
  const bottomArchGrad = ctx.createRadialGradient(0, 0, radius * 1.08, 0, 0, radius * 1.5);
  bottomArchGrad.addColorStop(0, "rgba(255, 200, 110, 0.45)");
  bottomArchGrad.addColorStop(0.5, "rgba(200, 100, 25, 0.25)");
  bottomArchGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = bottomArchGrad;
  ctx.beginPath();
  ctx.arc(0, 0, radius * 1.5, 0, Math.PI, false);
  ctx.arc(0, 0, radius * 1.08, Math.PI, 0, true);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // 4. Horizontal plane of the accretion disk (front equatorial disc)
  ctx.save();
  ctx.scale(2.5, 0.28);
  const discGrad = ctx.createRadialGradient(0, 0, radius * 0.4, 0, 0, radius * 1.8);
  // Doppler beaming: Left side is slightly brighter and blue-shifted (approaching)
  discGrad.addColorStop(0, "rgba(255, 245, 210, 0.95)");
  discGrad.addColorStop(0.2, "rgba(255, 185, 75, 0.85)");
  discGrad.addColorStop(0.55, "rgba(220, 110, 30, 0.55)");
  discGrad.addColorStop(0.85, "rgba(140, 50, 15, 0.2)");
  discGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = discGrad;
  ctx.beginPath();
  ctx.arc(0, 0, radius * 1.8, 0, Math.PI * 2);
  ctx.fill();

  // Thin hyper-bright photon ring
  ctx.strokeStyle = "rgba(255, 245, 220, 0.8)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(0, 0, radius * 1.04, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // 5. Black hole shadow (Event Horizon)
  ctx.fillStyle = "#050608";
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fill();

  // Subtle event horizon rim glow
  ctx.strokeStyle = "rgba(255, 220, 150, 0.65)";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(0, 0, radius * 1.01, 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();
}

function render() {
  if (!ctx || mode === "void") return;

  time += 0.015;
  // Smooth mouse interpolation
  mouse.x += (mouse.tx - mouse.x) * 0.05;
  mouse.y += (mouse.ty - mouse.y) * 0.05;

  ctx.clearRect(0, 0, width, height);

  // Background deep space gradient
  const bgGrad = ctx.createRadialGradient(
    width * 0.7,
    height * 0.35,
    50,
    width * 0.5,
    height * 0.5,
    Math.max(width, height)
  );
  bgGrad.addColorStop(0, "#0a0c14");
  bgGrad.addColorStop(0.6, "#06070a");
  bgGrad.addColorStop(1, "#030406");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // Draw Starfield
  for (let i = 0; i < stars.length; i++) {
    const s = stars[i];
    // Gentle drift + parallax
    const px = (s.x * width + (mouse.x - 0.5) * 40 * s.z + width) % width;
    const py = (s.y * height + (mouse.y - 0.5) * 30 * s.z + height) % height;

    const flicker = Math.sin(time * s.flickerSpeed * 60 + s.phase) * 0.2;
    const alpha = Math.max(0.05, Math.min(1, s.baseAlpha + flicker));

    ctx.fillStyle = `rgba(230, 238, 255, ${alpha})`;
    ctx.beginPath();
    ctx.arc(px, py, s.size, 0, Math.PI * 2);
    ctx.fill();
  }

  // Draw Gargantua centered slightly towards top-right for desktop aesthetic
  const holeX = width > 900 ? width * 0.72 : width * 0.5;
  const holeY = width > 900 ? height * 0.32 : height * 0.28;
  const holeRadius = Math.min(width, height) * 0.12;

  drawGargantua(holeX, holeY, holeRadius);

  animId = requestAnimationFrame(render);
}

function start() {
  if (animId) cancelAnimationFrame(animId);
  if (mode !== "void") {
    animId = requestAnimationFrame(render);
  } else if (ctx) {
    ctx.clearRect(0, 0, width, height);
  }
}

function stop() {
  if (animId) {
    cancelAnimationFrame(animId);
    animId = null;
  }
}

export async function initCanvas() {
  canvas = document.getElementById("cosmos-canvas");
  if (!canvas) return;
  ctx = canvas.getContext("2d");

  const saved = await load(COSMOS_KEY, "gargantua");
  mode = MODES.includes(saved) ? saved : "gargantua";

  stars = createStars(140);
  resize();
  window.addEventListener("resize", resize);

  window.addEventListener("mousemove", (e) => {
    mouse.tx = e.clientX / window.innerWidth;
    mouse.ty = e.clientY / window.innerHeight;
  });

  // Battery and resource optimization: pause when tab is hidden
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stop();
    else start();
  });

  start();
}

export async function cycleCosmosMode() {
  const currentIndex = MODES.indexOf(mode);
  mode = MODES[(currentIndex + 1) % MODES.length];
  await save(COSMOS_KEY, mode);
  start();
  return mode;
}

export function getCosmosMode() {
  return mode;
}

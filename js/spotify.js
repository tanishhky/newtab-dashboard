// Spotify player integration and Atmosphere card controller.
// Allows launching desktop Spotify directly or embedding sleek focus players.

import { load, save } from "./store.js";
import { setAmbientMode, getAmbientMode, setAmbientVolume, getAmbientVolume } from "./ambient.js";
import { cycleCosmosMode, getCosmosMode } from "./canvas.js";

const SPOTIFY_URI_KEY = "spotify_active_uri";

const PRESETS = [
  {
    name: "Interstellar",
    artist: "Hans Zimmer",
    uri: "spotify:album:1jpHPW2o59ezY0e45t5v1B",
    embed: "https://open.spotify.com/embed/album/1jpHPW2o59ezY0e45t5v1B?utm_source=generator&theme=0",
  },
  {
    name: "Oppenheimer",
    artist: "Ludwig Göransson",
    uri: "spotify:album:7GVkS6r062fI9sJ15UqT9Q",
    embed: "https://open.spotify.com/embed/album/7GVkS6r062fI9sJ15UqT9Q?utm_source=generator&theme=0",
  },
  {
    name: "Deep Focus",
    artist: "Atmospheric Lofi / Ambient",
    uri: "spotify:playlist:37i9dQZF1DWZeKCadgRdKQ",
    embed: "https://open.spotify.com/embed/playlist/37i9dQZF1DWZeKCadgRdKQ?utm_source=generator&theme=0",
  },
  {
    name: "Synthwave / Cyberpunk",
    artist: "Focus Beats",
    uri: "spotify:playlist:37i9dQZF1DXdLEN7aqioXM",
    embed: "https://open.spotify.com/embed/playlist/37i9dQZF1DXdLEN7aqioXM?utm_source=generator&theme=0",
  },
];

export async function initAtmosphere() {
  const container = document.getElementById("atmosphere-card");
  if (!container) return;

  const currentEmbedUri = await load(SPOTIFY_URI_KEY, PRESETS[0].embed);

  renderAtmosphere(currentEmbedUri);

  // Listen for ambient mode changes from shortcuts or buttons
  window.addEventListener("ambient-mode-change", () => {
    updateAmbientUI();
  });
}

function updateAmbientUI() {
  const mode = getAmbientMode();
  const vol = getAmbientVolume();

  const modeButtons = document.querySelectorAll(".sound-mode-btn");
  modeButtons.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.mode === mode);
  });

  const volSlider = document.getElementById("ambient-volume");
  if (volSlider) volSlider.value = Math.round(vol * 100);

  const cosmosBtn = document.getElementById("cosmos-toggle-btn");
  if (cosmosBtn) {
    const cMode = getCosmosMode();
    cosmosBtn.textContent = cMode === "gargantua" ? "Gargantua" : cMode === "stars" ? "Starfield" : "Void Off";
  }
}

function renderAtmosphere(activeEmbed) {
  const card = document.getElementById("atmosphere-card");
  if (!card) return;

  card.innerHTML = `
    <header class="card-head">
      <div class="head-title-row">
        <h2 id="atmosphere-title">Atmosphere</h2>
        <span class="meta" id="cosmos-status">Deep Spacetime</span>
      </div>
      <button class="btn btn-ghost btn-sm" id="cosmos-toggle-btn" title="Toggle background cosmos (B)">
        ${getCosmosMode() === "gargantua" ? "Gargantua" : getCosmosMode() === "stars" ? "Starfield" : "Void Off"}
      </button>
    </header>

    <div class="ambient-controls">
      <div class="sound-mode-group">
        <span class="sub-label">Focus Sound</span>
        <div class="btn-group">
          <button class="btn btn-sm sound-mode-btn ${getAmbientMode() === "off" ? "active" : ""}" data-mode="off" type="button">Off</button>
          <button class="btn btn-sm sound-mode-btn ${getAmbientMode() === "tick" ? "active" : ""}" data-mode="tick" type="button" title="Miller's Planet 1.25s cadence">Miller's Tick</button>
          <button class="btn btn-sm sound-mode-btn ${getAmbientMode() === "drone" ? "active" : ""}" data-mode="drone" type="button" title="Endurance cosmic binaural hum">Cosmic Drone</button>
        </div>
      </div>
      <div class="vol-group">
        <label for="ambient-volume" class="sub-label">Volume</label>
        <input type="range" id="ambient-volume" min="0" max="100" value="${Math.round(getAmbientVolume() * 100)}" class="slider">
      </div>
    </div>

    <div class="spotify-section">
      <div class="preset-pills" id="spotify-presets">
        ${PRESETS.map((p) => `
          <button class="pill-btn ${activeEmbed.includes(p.name.toLowerCase()) || activeEmbed === p.embed ? "selected" : ""}"
                  data-embed="${p.embed}"
                  data-uri="${p.uri}">
            ${p.name}
          </button>
        `).join("")}
      </div>

      <div class="spotify-embed-wrap">
        <iframe id="spotify-frame"
                src="${activeEmbed}"
                width="100%"
                height="80"
                frameBorder="0"
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                loading="lazy">
        </iframe>
      </div>
    </div>
  `;

  // Bind cosmos button
  document.getElementById("cosmos-toggle-btn").addEventListener("click", async () => {
    const nextMode = await cycleCosmosMode();
    const btn = document.getElementById("cosmos-toggle-btn");
    btn.textContent = nextMode === "gargantua" ? "Gargantua" : nextMode === "stars" ? "Starfield" : "Void Off";
  });

  // Bind ambient mode buttons
  const modeBtns = card.querySelectorAll(".sound-mode-btn");
  modeBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      setAmbientMode(btn.dataset.mode);
    });
  });

  // Bind volume slider
  const volSlider = document.getElementById("ambient-volume");
  volSlider.addEventListener("input", (e) => {
    setAmbientVolume(Number(e.target.value) / 100);
  });

  // Bind preset pills
  const presetBtns = card.querySelectorAll(".pill-btn");
  presetBtns.forEach((btn) => {
    btn.addEventListener("click", async () => {
      presetBtns.forEach((b) => b.classList.remove("selected"));
      btn.classList.add("selected");
      const embedUrl = btn.dataset.embed;
      const frame = document.getElementById("spotify-frame");
      if (frame) frame.src = embedUrl;
      await save(SPOTIFY_URI_KEY, embedUrl);
    });
  });
}

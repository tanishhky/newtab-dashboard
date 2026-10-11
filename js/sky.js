// Static deep-space backdrop: a seeded starfield and a stylised Gargantua, painted once
// at device resolution. No image assets, no animation loop; it repaints only on resize.
// A classic script (not a module) on purpose: Applications/build_dashboard.py inlines this
// file so the job dashboard and the new tab share one sky.
(function () {
  "use strict";

  // Seeded PRNG so every tab shows the same sky (seed: Interstellar's US release, 2014-11-07).
  function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function gauss(rnd) {
    let u = 0;
    let v = 0;
    while (u === 0) u = rnd();
    while (v === 0) v = rnd();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }

  const TINTS = ["255,255,255", "255,255,255", "214,226,255", "196,212,255", "255,232,200", "255,214,170"];

  function star(ctx, x, y, r, alpha, tint) {
    ctx.fillStyle = `rgba(${tint},${alpha})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  function paintStars(ctx, w, h, rnd, density) {
    // Field stars: brightness follows a steep power law, so most are faint.
    const n = Math.round((w * h) / density);
    for (let i = 0; i < n; i++) {
      const m = Math.pow(rnd(), 3.4);
      const tint = TINTS[Math.floor(rnd() * TINTS.length)];
      star(ctx, rnd() * w, rnd() * h, 0.25 + m * 1.15, 0.18 + m * 0.75, tint);
      if (m > 0.97) {
        const x = rnd() * w;
        const y = rnd() * h;
        const glow = ctx.createRadialGradient(x, y, 0, x, y, 4.5);
        glow.addColorStop(0, `rgba(${tint},0.45)`);
        glow.addColorStop(1, `rgba(${tint},0)`);
        ctx.fillStyle = glow;
        ctx.fillRect(x - 5, y - 5, 10, 10);
        star(ctx, x, y, 0.9, 0.95, tint);
      }
    }
  }

  function paintBand(ctx, w, h, rnd) {
    // A faint galactic band across the frame, denser with tiny stars toward its spine.
    ctx.save();
    ctx.translate(w * 0.5, h * 0.62);
    ctx.rotate(-0.38);
    const span = Math.hypot(w, h);
    const glow = ctx.createLinearGradient(0, -h * 0.3, 0, h * 0.3);
    glow.addColorStop(0, "rgba(70,90,160,0)");
    glow.addColorStop(0.5, "rgba(80,96,170,0.075)");
    glow.addColorStop(1, "rgba(70,90,160,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(-span, -h * 0.3, span * 2, h * 0.6);
    const n = Math.round((w * h) / 900);
    for (let i = 0; i < n; i++) {
      const x = (rnd() - 0.5) * span * 1.6;
      const y = gauss(rnd) * h * 0.07;
      star(ctx, x, y, 0.22 + rnd() * 0.35, 0.08 + rnd() * 0.22, TINTS[Math.floor(rnd() * 3)]);
    }
    ctx.restore();
  }

  // One elliptical band of the accretion disk, brighter on the approaching (left) side.
  function diskBand(w, h, cx, cy, R, flat, inner, outer, warm) {
    const off = document.createElement("canvas");
    off.width = w;
    off.height = h;
    const o = off.getContext("2d");
    o.save();
    o.translate(cx, cy);
    o.scale(1, flat);
    const g = o.createRadialGradient(0, 0, R * inner, 0, 0, R * outer);
    g.addColorStop(0, `rgba(255,236,196,${0.95 * warm})`);
    g.addColorStop(0.18, `rgba(255,186,92,${0.85 * warm})`);
    g.addColorStop(0.45, `rgba(232,118,28,${0.42 * warm})`);
    g.addColorStop(0.75, `rgba(150,60,10,${0.14 * warm})`);
    g.addColorStop(1, "rgba(80,30,5,0)");
    o.fillStyle = g;
    o.beginPath();
    o.arc(0, 0, R * outer, 0, Math.PI * 2);
    o.arc(0, 0, R * inner, 0, Math.PI * 2, true);
    o.fill();
    o.restore();
    // Doppler beaming: fade the receding side.
    o.globalCompositeOperation = "destination-in";
    const beam = o.createLinearGradient(cx - R * outer, 0, cx + R * outer, 0);
    beam.addColorStop(0, "rgba(0,0,0,1)");
    beam.addColorStop(0.5, "rgba(0,0,0,0.85)");
    beam.addColorStop(1, "rgba(0,0,0,0.42)");
    o.fillStyle = beam;
    o.fillRect(0, 0, w, h);
    return off;
  }

  function paintGargantua(ctx, w, h) {
    const R = Math.max(46, Math.min(w, h) * 0.085);
    const cx = w * 0.5;
    const cy = Math.max(R * 2.4, h * 0.2);

    // Wide warm halo so the glass cards pick up a glow when they blur what is behind them.
    const halo = ctx.createRadialGradient(cx, cy, R, cx, cy, R * 7.5);
    halo.addColorStop(0, "rgba(245,158,11,0.16)");
    halo.addColorStop(0.4, "rgba(200,96,20,0.06)");
    halo.addColorStop(1, "rgba(120,50,10,0)");
    ctx.fillStyle = halo;
    ctx.fillRect(0, 0, w, h);

    const back = diskBand(w, h, cx, cy, R, 0.1, 1.03, 4.4, 0.9);
    const front = diskBand(w, h, cx, cy, R, 0.1, 1.03, 4.4, 1);

    // Back half of the disk (behind the shadow).
    ctx.save();
    ctx.filter = "blur(1.2px)";
    ctx.drawImage(back, 0, 0);
    ctx.restore();

    // Lensed image of the far side of the disk: a bright arc over the top of the shadow
    // and a thinner one under it.
    ctx.save();
    ctx.filter = "blur(2.5px)";
    const arcs = [
      [Math.PI, 2 * Math.PI, 1.22, [[0.36, 0.2], [0.17, 0.48], [0.07, 0.9]]],
      [0, Math.PI, 1.12, [[0.14, 0.18], [0.05, 0.55]]],
    ];
    for (const [from, to, rr, strokes] of arcs) {
      for (const [lw, a] of strokes) {
        const ring = ctx.createLinearGradient(cx - R * 1.4, 0, cx + R * 1.4, 0);
        ring.addColorStop(0, `rgba(255,220,160,${a})`);
        ring.addColorStop(1, `rgba(232,128,36,${a * 0.6})`);
        ctx.strokeStyle = ring;
        ctx.lineWidth = R * lw;
        ctx.beginPath();
        ctx.arc(cx, cy, R * rr, from, to);
        ctx.stroke();
      }
    }
    ctx.restore();

    // The shadow itself.
    ctx.fillStyle = "#010102";
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.fill();

    // Photon ring: a thin, bright edge.
    ctx.save();
    ctx.shadowColor = "rgba(255,200,120,0.9)";
    ctx.shadowBlur = 14;
    ctx.strokeStyle = "rgba(255,236,200,0.95)";
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.arc(cx, cy, R * 1.02, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // Front half of the disk crosses in front of the shadow.
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, cy, w, h);
    ctx.clip();
    ctx.filter = "blur(0.8px)";
    ctx.drawImage(front, 0, 0);
    ctx.restore();
  }

  function paintSky(canvas, mode) {
    if (!canvas || !canvas.getContext) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = window.innerWidth;
    const h = window.innerHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const base = ctx.createLinearGradient(0, 0, 0, h);
    base.addColorStop(0, "#060810");
    base.addColorStop(1, "#020304");
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, w, h);
    if (mode === "void") return;

    const rnd = mulberry32(20141107);
    paintBand(ctx, w, h, rnd);
    paintStars(ctx, w, h, rnd, 1700);
    if (mode !== "deep") paintGargantua(ctx, w, h);

    // Soft vignette keeps the edges quiet behind text.
    const v = ctx.createRadialGradient(w / 2, h * 0.42, Math.min(w, h) * 0.35, w / 2, h * 0.5, Math.hypot(w, h) * 0.62);
    v.addColorStop(0, "rgba(2,3,5,0)");
    v.addColorStop(1, "rgba(2,3,5,0.7)");
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, w, h);
  }

  // Paint now and on resize (debounced). mode: "gargantua" (default), "deep" (stars only), "void".
  function mountSky(canvas, mode) {
    let current = mode || "gargantua";
    let timer = null;
    paintSky(canvas, current);
    window.addEventListener("resize", () => {
      clearTimeout(timer);
      timer = setTimeout(() => paintSky(canvas, current), 150);
    });
    return (next) => {
      current = next;
      paintSky(canvas, current);
    };
  }

  window.paintSky = paintSky;
  window.mountSky = mountSky;
})();

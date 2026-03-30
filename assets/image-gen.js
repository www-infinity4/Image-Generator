/* =====================================================================
   Image-Generator — Procedural Image Generator
   image-gen.js — canvas-based image generation with multiple modes:
                  · pixel-art  · abstract  · glitch  · geometric
                  · combo (uses slot win symbols to seed the image)
   ===================================================================== */
window.IMGGEN = (() => {
  "use strict";

  const MODES = ["pixel-art", "abstract", "geometric", "glitch", "combo"];
  const PALETTES = {
    mario:    ["#e52222","#f5c542","#3cb043","#4fc3f7","#ffffff","#1a0a1e"],
    neon:     ["#ff00ff","#00ffff","#ff9900","#00ff00","#ff0066","#0a0a2e"],
    pastel:   ["#ffb3c1","#bde0fe","#c8f7c5","#ffd6a5","#fdffb6","#f0e6ff"],
    cyberpunk:["#f72585","#7209b7","#3a0ca3","#4361ee","#4cc9f0","#000000"],
    earth:    ["#8b4513","#228b22","#4169e1","#ffd700","#deb887","#2f4f4f"],
  };

  /* ---- Helpers ---- */
  function randFrom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function rand(min, max) { return min + Math.random() * (max - min); }
  function randInt(min, max) { return Math.floor(rand(min, max)); }

  function hexToRgba(hex, alpha = 1) {
    const r = parseInt(hex.slice(1,3),16);
    const g = parseInt(hex.slice(3,5),16);
    const b = parseInt(hex.slice(5,7),16);
    return `rgba(${r},${g},${b},${alpha})`;
  }

  /* ---- Generators ---- */
  function genPixelArt(ctx, w, h, palette) {
    const pixSize = randInt(8, 24);
    const cols    = Math.ceil(w / pixSize);
    const rows    = Math.ceil(h / pixSize);
    ctx.fillStyle = palette[0];
    ctx.fillRect(0, 0, w, h);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (Math.random() > 0.45) {
          ctx.fillStyle = randFrom(palette);
          ctx.fillRect(c * pixSize, r * pixSize, pixSize, pixSize);
        }
      }
    }
    // pixel outline pass
    ctx.strokeStyle = "rgba(0,0,0,0.25)";
    ctx.lineWidth = 1;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        ctx.strokeRect(c * pixSize, r * pixSize, pixSize, pixSize);
      }
    }
  }

  function genAbstract(ctx, w, h, palette) {
    const bg = palette[0];
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
    const count = randInt(12, 30);
    for (let i = 0; i < count; i++) {
      const x  = rand(0, w);
      const y  = rand(0, h);
      const r  = rand(20, Math.min(w, h) * 0.4);
      const c  = hexToRgba(randFrom(palette), rand(0.15, 0.7));
      const grd = ctx.createRadialGradient(x, y, 0, x, y, r);
      grd.addColorStop(0, hexToRgba(randFrom(palette), 0.8));
      grd.addColorStop(1, "transparent");
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function genGeometric(ctx, w, h, palette) {
    ctx.fillStyle = palette[palette.length - 1];
    ctx.fillRect(0, 0, w, h);
    const shapes = randInt(8, 20);
    for (let i = 0; i < shapes; i++) {
      const type  = randFrom(["rect","tri","circle","hex"]);
      const color = hexToRgba(randFrom(palette), rand(0.4, 0.9));
      ctx.fillStyle   = color;
      ctx.strokeStyle = hexToRgba(randFrom(palette), 0.6);
      ctx.lineWidth   = rand(1, 3);
      const x = rand(0, w), y = rand(0, h);
      const s = rand(20, Math.min(w, h) * 0.3);
      ctx.beginPath();
      if (type === "rect") {
        ctx.rect(x - s/2, y - s/2, s, s * rand(0.5, 2));
      } else if (type === "circle") {
        ctx.arc(x, y, s / 2, 0, Math.PI * 2);
      } else if (type === "tri") {
        const angle = rand(0, Math.PI * 2);
        for (let j = 0; j < 3; j++) {
          const a = angle + (j * Math.PI * 2) / 3;
          j === 0 ? ctx.moveTo(x + s * Math.cos(a), y + s * Math.sin(a))
                  : ctx.lineTo(x + s * Math.cos(a), y + s * Math.sin(a));
        }
        ctx.closePath();
      } else { // hex
        for (let j = 0; j < 6; j++) {
          const a = (j * Math.PI * 2) / 6 - Math.PI / 6;
          j === 0 ? ctx.moveTo(x + s * Math.cos(a), y + s * Math.sin(a))
                  : ctx.lineTo(x + s * Math.cos(a), y + s * Math.sin(a));
        }
        ctx.closePath();
      }
      ctx.fill();
      ctx.stroke();
    }
  }

  function genGlitch(ctx, w, h, palette) {
    // Start with geometric base
    genGeometric(ctx, w, h, palette);
    // Glitch slices
    const slices = randInt(6, 18);
    for (let i = 0; i < slices; i++) {
      const y      = rand(0, h);
      const sliceH = rand(2, 30);
      const offset = rand(-40, 40);
      const imgData = ctx.getImageData(0, Math.round(y), w, Math.round(sliceH));
      ctx.putImageData(imgData, Math.round(offset), Math.round(y));
    }
    // Color channel shift
    const imgData = ctx.getImageData(0, 0, w, h);
    const d = imgData.data;
    // Process every 4th pixel (RGBA stride = 16 bytes between sampled pixels)
    const PIXEL_STRIDE = 16;
    for (let i = 0; i < d.length; i += PIXEL_STRIDE) {
      d[i]   = Math.min(255, d[i]   + randInt(0, 80));   // R channel boost
      d[i+2] = Math.max(0,   d[i+2] - randInt(0, 60));   // B channel reduce
    }
    ctx.putImageData(imgData, 0, 0);
  }

  function genCombo(ctx, w, h, palette, symbols) {
    genAbstract(ctx, w, h, palette);
    // Overlay emoji characters from winning symbols
    const emojis = symbols || ["🍄","🌟","🪙","🎮"];
    ctx.font      = `${Math.round(w * 0.12)}px serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const count  = emojis.length;
    const step   = w / (count + 1);
    for (let i = 0; i < count; i++) {
      const x   = step * (i + 1);
      const y   = rand(h * 0.2, h * 0.8);
      const rot = rand(-0.4, 0.4);
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rot);
      ctx.globalAlpha = rand(0.6, 1);
      ctx.fillText(emojis[i], 0, 0);
      ctx.globalAlpha = 1;
      ctx.restore();
    }
  }

  /* ---- Public API ---- */
  function generate(canvasEl, opts = {}) {
    const mode    = opts.mode    || randFrom(MODES);
    const palette = opts.palette ? PALETTES[opts.palette] || PALETTES.mario
                                 : PALETTES[randFrom(Object.keys(PALETTES))];
    const symbols = opts.symbols || null;
    const w = canvasEl.width;
    const h = canvasEl.height;
    const cx = canvasEl.getContext("2d");

    cx.clearRect(0, 0, w, h);

    switch (mode) {
      case "pixel-art":  genPixelArt(cx, w, h, palette);  break;
      case "abstract":   genAbstract(cx, w, h, palette);  break;
      case "geometric":  genGeometric(cx, w, h, palette); break;
      case "glitch":     genGlitch(cx, w, h, palette);    break;
      case "combo":      genCombo(cx, w, h, palette, symbols); break;
      default:           genAbstract(cx, w, h, palette);
    }

    const dataUrl = canvasEl.toDataURL("image/png");
    const prompt  = `${mode} · ${Object.keys(PALETTES).find((k) => PALETTES[k] === palette) || "custom"} palette`;
    const token   = window.TOKENS.mintImage(dataUrl, prompt, w, h, mode);
    return { dataUrl, token, mode, palette };
  }

  function getModes()    { return [...MODES]; }
  function getPalettes() { return Object.keys(PALETTES); }

  return { generate, getModes, getPalettes };
})();

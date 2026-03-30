# Image-Generator 🎨

A full ∞ Infinity System app combining a Mario-themed slot machine, character drawing tool, token piano, background sound listener, and procedural image generator — all powered by a unified token ledger.

## Features

### 🎰 Slot Machine
- 5-reel slot machine with emoji symbols (🍄 🌟 👾 🎮 🏆 🪙)
- **Custom characters**: draw your own symbol and inject it into the reels
- Win tiers: Jackpot (5-of-a-kind), Big Win (4), Super Win (3), Win (pair)
- On every win, a **combo image is auto-generated** using the winning symbols
- Each spin mints a **SPIN token**

### ✏️ Character Drawing Tool
- HTML5 Canvas 320×320 drawing pad
- Tools: brush, eraser, flood-fill
- 10-colour palette + custom colour picker + size slider
- Undo stack (20 levels)
- **Save & Mint**: injects your drawn character into the slot machine reels + mints a **DRAW token**

### 🎹 Token Piano
- Elegant 2-octave piano keyboard (C4–F5)
- **Computer keyboard mapping**: `A W S E D F T G Y H U J K O L P`
- Web Audio API synthesis (triangle oscillator with natural decay)
- Every key press mints a **NOTE token**
- **Tune minting**: play 4+ notes → 3 seconds of silence → a **TUNE token** is auto-minted with AI genre classification and a generated title

| Genre | Detection Logic |
|-------|----------------|
| Lullaby | ≥4 notes with small intervals |
| Jazz | Contains sharps + ≥5 notes |
| Blues | Contains blues-scale notes |
| Classical | ≥8 notes |
| Pop | 4–7 notes |
| Freestyle | Default |

### 🎙️ Background Sound Listener
- Microphone input via `getUserMedia` + Web Audio `AnalyserNode`
- **Autocorrelation-based pitch detection** (~67ms stability window)
- Detects musical pitches from **singing, whistling, humming, or any instrument**
- Detected notes mint **NOTE tokens** and feed into the tune recorder
- Always-on when activated — works across any sound source

### 🖼️ Image Generator
- 5 procedural generation modes: **pixel-art · abstract · geometric · glitch · combo**
- 5 colour palettes: **mario · neon · pastel · cyberpunk · earth**
- `combo` mode overlays slot win symbols onto an abstract background
- Gallery shows last 20 generated images with download buttons
- Each generation mints an **IMAGE token**

### 🪙 Token Ledger
- 5 token types: `SPIN` `NOTE` `TUNE` `IMAGE` `DRAW`
- Stored in `localStorage` (up to 2000 tokens)
- Real-time stats dashboard
- Export full ledger as JSON

## Play

Open `index.html` in a modern browser (Chrome/Firefox/Safari/Edge).

| Action | Shortcut |
|--------|----------|
| Spin slot | `Space` or click SPIN & GO! |
| Pull lever | Click the lever on the right |
| Play piano | `A W S E D F T G Y H U J` etc. |
| Mint tune now | Click **🎵 Mint Tune Now** button |
| Start mic listener | Click **🎙️ Start Listening** |

## Architecture

```
index.html          — main layout & section structure
assets/
  cfg.js            — runtime config (token, repo settings)
  tokens.js         — unified token ledger & minting API
  auth.js           — user auth (SHA-256 + AES-GCM, from Mario-spin)
  slot.js           — slot machine logic & reel animation
  piano.js          — piano keyboard, Web Audio synthesis, mic pitch detection
  draw.js           — HTML5 Canvas character drawing tool
  image-gen.js      — procedural canvas image generation
  app.js            — main orchestration, wires all modules together
  style.css         — dark Mario-themed responsive UI
```

## Token Flow

```
🎰 Spin  →  SPIN token
🎹 Note  →  NOTE token  →  (4+ notes + 3s silence)  →  TUNE token
✏️ Draw  →  DRAW token  →  character injected into slot reels
🖼️ Win   →  combo IMAGE token  (auto-generated)
🎙️ Mic   →  NOTE token  →  TUNE token
```

Adapted from [Mario-spin](https://github.com/www-infinity4/Mario-spin) — ∞ Infinity System.

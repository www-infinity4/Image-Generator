/* =====================================================================
   Image-Generator — Token Piano
   piano.js — elegant 2-octave piano keyboard
              · Each key pressed mints a NOTE token
              · Full melodies (≥4 notes) auto-categorise and mint a TUNE token
              · Integrated with Web Audio API for real synthesis
              · Background mic pitch detection (optional permission)
   ===================================================================== */
window.PIANO = (() => {
  "use strict";

  /* ---- Music theory helpers ---- */
  const NOTE_NAMES   = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
  const SHARP_LABELS = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];

  function noteToFreq(note, octave) {
    const semis = NOTE_NAMES.indexOf(note) + (octave + 1) * 12;
    return 440 * Math.pow(2, (semis - 69) / 12);
  }

  /* ---- Tune category heuristic ---- */
  const CATEGORIES = [
    { name: "Lullaby",   test: (ns) => ns.length >= 4 && avgInterval(ns) < 3 },
    { name: "Jazz",      test: (ns) => ns.some((n) => n.includes("#")) && ns.length >= 5 },
    { name: "Blues",     test: (ns) => hasBluesNotes(ns) },
    { name: "Classical", test: (ns) => ns.length >= 8 },
    { name: "Pop",       test: (ns) => ns.length >= 4 && ns.length < 8 },
    { name: "Freestyle", test: ()   => true },
  ];

  function avgInterval(notes) {
    if (notes.length < 2) return 0;
    let sum = 0;
    for (let i = 1; i < notes.length; i++) {
      const a = NOTE_NAMES.indexOf(notes[i - 1].replace(/\d/, ""));
      const b = NOTE_NAMES.indexOf(notes[i].replace(/\d/, ""));
      sum += Math.abs(b - a);
    }
    return sum / (notes.length - 1);
  }

  function hasBluesNotes(notes) {
    const bluesSemis = new Set([0, 3, 5, 6, 7, 10]);
    return notes.some((n) => {
      const idx = NOTE_NAMES.indexOf(n.replace(/\d/, ""));
      return idx >= 0 && bluesSemis.has(idx % 12);
    });
  }

  function categoriseTune(notes) {
    for (const cat of CATEGORIES) {
      if (cat.test(notes)) return cat.name;
    }
    return "Freestyle";
  }

  function generateTuneTitle(category, notes) {
    const adjectives = ["Infinite","Cosmic","Golden","Crystal","Neon","Shadow","Electric","Mystic","Velvet","Prism"];
    const nouns      = ["Dream","Echo","Wave","Pulse","Soul","Flame","Storm","Light","Moon","Star"];
    const adj  = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    return `${adj} ${noun} (${category} · ${notes.length} notes)`;
  }

  /* ---- Audio Context ---- */
  let audioCtx = null;
  function getAudioCtx() {
    if (!audioCtx || audioCtx.state === "closed") {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === "suspended") audioCtx.resume();
    return audioCtx;
  }

  function playNote(freq, duration = 0.5, type = "triangle") {
    const ctx  = getAudioCtx();
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(0.4, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration + 0.05);
  }

  /* ---- Build piano DOM ---- */
  const KEYS = [
    // octave 4
    { note:"C",  octave:4, black:false, key:"a" },
    { note:"C#", octave:4, black:true,  key:"w" },
    { note:"D",  octave:4, black:false, key:"s" },
    { note:"D#", octave:4, black:true,  key:"e" },
    { note:"E",  octave:4, black:false, key:"d" },
    { note:"F",  octave:4, black:false, key:"f" },
    { note:"F#", octave:4, black:true,  key:"t" },
    { note:"G",  octave:4, black:false, key:"g" },
    { note:"G#", octave:4, black:true,  key:"y" },
    { note:"A",  octave:4, black:false, key:"h" },
    { note:"A#", octave:4, black:true,  key:"u" },
    { note:"B",  octave:4, black:false, key:"j" },
    // octave 5
    { note:"C",  octave:5, black:false, key:"k" },
    { note:"C#", octave:5, black:true,  key:"o" },
    { note:"D",  octave:5, black:false, key:"l" },
    { note:"D#", octave:5, black:true,  key:"p" },
    { note:"E",  octave:5, black:false, key:";" },
    { note:"F",  octave:5, black:false, key:"'" },
  ];

  const KB_MAP = {};
  KEYS.forEach((k) => { KB_MAP[k.key] = k; });

  /* ---- Tune recording state ---- */
  let currentTune   = [];
  let tuneTimer     = null;
  let onNoteCallback  = null;
  let onTuneCallback  = null;
  let onMintCallback  = null;
  const TUNE_SILENCE_THRESHOLD_MS = 3000; // mint tune after 3s of silence

  function recordNote(noteName, octave) {
    const label = `${noteName}${octave}`;
    currentTune.push(label);
    clearTimeout(tuneTimer);
    if (currentTune.length >= 4) {
      tuneTimer = setTimeout(mintCurrentTune, TUNE_SILENCE_THRESHOLD_MS);
    }
  }

  function mintCurrentTune() {
    if (currentTune.length < 4) { currentTune = []; return; }
    const category = categoriseTune(currentTune);
    const title    = generateTuneTitle(category, currentTune);
    const token    = window.TOKENS.mintTune([...currentTune], 120, category, title);
    if (onTuneCallback) onTuneCallback(token);
    currentTune = [];
  }

  function flushTune() {
    clearTimeout(tuneTimer);
    mintCurrentTune();
  }

  /* ---- Build piano element ---- */
  function build(container, opts = {}) {
    onNoteCallback = opts.onNote || null;
    onTuneCallback = opts.onTune || null;
    onMintCallback = opts.onMint || null;

    container.innerHTML = "";
    const wrap = document.createElement("div");
    wrap.className = "piano-wrap";
    const keyboard = document.createElement("div");
    keyboard.className = "piano-keyboard";

    const keyEls = {};

    KEYS.forEach((k) => {
      const el = document.createElement("button");
      el.className  = k.black ? "piano-key piano-key-black" : "piano-key piano-key-white";
      el.dataset.note   = k.note;
      el.dataset.octave = k.octave;
      el.dataset.key    = k.key;
      el.setAttribute("aria-label", `${k.note}${k.octave}`);

      const kbLabel = document.createElement("span");
      kbLabel.className = "piano-kb-label";
      kbLabel.textContent = k.key.toUpperCase();
      el.appendChild(kbLabel);

      const noteLabel = document.createElement("span");
      noteLabel.className = "piano-note-label";
      noteLabel.textContent = k.note;
      el.appendChild(noteLabel);

      el.addEventListener("mousedown", () => pressKey(k, el));
      el.addEventListener("touchstart", (e) => { e.preventDefault(); pressKey(k, el); }, { passive: false });

      keyboard.appendChild(el);
      keyEls[k.key] = el;
    });

    wrap.appendChild(keyboard);

    /* Tune display */
    const tuneDisplay = document.createElement("div");
    tuneDisplay.className = "piano-tune-display";
    tuneDisplay.id = "pianoTuneDisplay";
    wrap.appendChild(tuneDisplay);

    /* Controls */
    const ctrl = document.createElement("div");
    ctrl.className = "piano-controls";

    const flushBtn = document.createElement("button");
    flushBtn.className = "btn btn-sm";
    flushBtn.textContent = "🎵 Mint Tune Now";
    flushBtn.addEventListener("click", flushTune);
    ctrl.appendChild(flushBtn);

    const clearBtn = document.createElement("button");
    clearBtn.className = "btn btn-sm btn-ghost";
    clearBtn.textContent = "🗑️ Clear";
    clearBtn.addEventListener("click", () => { currentTune = []; clearTimeout(tuneTimer); updateTuneDisplay(); });
    ctrl.appendChild(clearBtn);

    wrap.appendChild(ctrl);
    container.appendChild(wrap);

    function pressKey(k, el) {
      const freq = noteToFreq(k.note, k.octave);
      playNote(freq);
      el.classList.add("active");
      setTimeout(() => el.classList.remove("active"), 250);

      const token = window.TOKENS.mintNote(k.note + k.octave, freq);
      if (onNoteCallback) onNoteCallback(token, k);
      recordNote(k.note, k.octave);
      updateTuneDisplay();
    }

    /* Keyboard events */
    document.addEventListener("keydown", (e) => {
      if (e.repeat) return;
      if (document.activeElement.tagName === "INPUT" ||
          document.activeElement.tagName === "TEXTAREA") return;
      const k = KB_MAP[e.key.toLowerCase()];
      if (!k) return;
      pressKey(k, keyEls[k.key]);
    });

    function updateTuneDisplay() {
      const el = document.getElementById("pianoTuneDisplay");
      if (!el) return;
      if (!currentTune.length) {
        el.textContent = "Play 4+ notes to mint a tune token…";
        return;
      }
      el.textContent = currentTune.join(" · ");
    }
    updateTuneDisplay();

    return { pressKey, flushTune };
  }

  /* ---- Mic pitch detection (background listener) ---- */
  let micStream    = null;
  let micAnalyser  = null;
  let micRunning   = false;
  let micDetectTimer = null;
  let onMicNoteCallback = null;

  function freqToNoteName(freq) {
    if (freq <= 0) return null;
    const midi = Math.round(12 * Math.log2(freq / 440) + 69);
    if (midi < 21 || midi > 108) return null;
    const note   = NOTE_NAMES[midi % 12];
    const octave = Math.floor(midi / 12) - 1;
    return { note, octave, label: `${note}${octave}`, freq };
  }

  function detectPitch(analyser, sampleRate) {
    const buf = new Float32Array(analyser.fftSize);
    analyser.getFloatTimeDomainData(buf);

    // Simple autocorrelation
    const size   = buf.length;
    const maxRms = buf.reduce((a, v) => a + v * v, 0) / size;
    if (Math.sqrt(maxRms) < 0.01) return -1; // silence

    let bestOff = -1, bestCorr = -1;
    for (let offset = 20; offset < Math.floor(size / 2); offset++) {
      let corr = 0;
      for (let i = 0; i < size - offset; i++) corr += buf[i] * buf[i + offset];
      corr /= (size - offset);
      if (corr > bestCorr) { bestCorr = corr; bestOff = offset; }
    }
    return bestOff > 0 ? sampleRate / bestOff : -1;
  }

  let lastMicNote  = null;
  let micNoteHeld  = 0;

  function micLoop() {
    if (!micRunning) return;
    const ctx = getAudioCtx();
    const freq = detectPitch(micAnalyser, ctx.sampleRate);
    if (freq > 50 && freq < 4200) {
      const info = freqToNoteName(freq);
      if (info) {
        if (info.label !== lastMicNote) {
          lastMicNote = info.label;
          micNoteHeld = 1;
        } else {
          micNoteHeld++;
          // Require ~4 frames of stability ≈ 67ms at 60fps before minting
          if (micNoteHeld === 4) {
            const token = window.TOKENS.mintNote(info.label, info.freq, 0.6);
            if (onMicNoteCallback) onMicNoteCallback(token, info);
            recordNote(info.note, info.octave);
          }
        }
      }
    } else {
      lastMicNote = null; micNoteHeld = 0;
    }
    micDetectTimer = requestAnimationFrame(micLoop);
  }

  async function startMic(onNote) {
    if (micRunning) return;
    onMicNoteCallback = onNote || null;
    try {
      micStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      const ctx      = getAudioCtx();
      const source   = ctx.createMediaStreamSource(micStream);
      micAnalyser    = ctx.createAnalyser();
      micAnalyser.fftSize      = 2048;
      micAnalyser.smoothingTimeConstant = 0.3;
      source.connect(micAnalyser);
      micRunning = true;
      micLoop();
      return true;
    } catch (e) {
      console.warn("Mic access denied:", e.message);
      return false;
    }
  }

  function stopMic() {
    micRunning = false;
    cancelAnimationFrame(micDetectTimer);
    if (micStream) { micStream.getTracks().forEach((t) => t.stop()); micStream = null; }
  }

  function isMicRunning() { return micRunning; }

  return { build, flushTune, startMic, stopMic, isMicRunning, NOTE_NAMES, noteToFreq };
})();

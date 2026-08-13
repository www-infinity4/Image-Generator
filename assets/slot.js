/* =====================================================================
   Image-Generator — Slot Machine
   slot.js — 5-reel slot machine with emoji symbols + custom drawn character slots
   Adapted from Mario-spin (www-infinity4/Mario-spin)
   ===================================================================== */
window.SLOT = (() => {
  "use strict";

  /* ------------------------------------------------------------------
     BUILT-IN SYMBOLS — emoji based (self-contained, no external images)
  ------------------------------------------------------------------ */
  const DEFAULT_SYMBOLS = [
    { emoji: "🍄", label: "MUSHROOM", value: 6,  weight: 6  },
    { emoji: "🌟", label: "STAR",     value: 10, weight: 3  },
    { emoji: "👾", label: "SPRITE",   value: 2,  weight: 10 },
    { emoji: "🎮", label: "GAME",     value: 8,  weight: 4  },
    { emoji: "🏆", label: "TROPHY",   value: 5,  weight: 7  },
    { emoji: "🪙", label: "COIN",     value: 3,  weight: 10 },
  ];

  /* Custom characters injected by the draw tool */
  let customSymbols = [];

  function addCustomSymbol(dataUrl, name) {
    customSymbols = customSymbols.slice(-4); // keep last 4
    customSymbols.push({ img: dataUrl, label: name.toUpperCase().slice(0, 8), value: 12, weight: 2, custom: true });
  }

  function getSymbols() {
    return [...DEFAULT_SYMBOLS, ...customSymbols];
  }

  /* ------------------------------------------------------------------
     WEIGHTED RANDOM PICK
  ------------------------------------------------------------------ */
  function pickSymbol() {
    const symbols = getSymbols();
    const total   = symbols.reduce((a, s) => a + s.weight, 0);
    let r = Math.random() * total;
    for (const s of symbols) { r -= s.weight; if (r <= 0) return s; }
    return symbols[symbols.length - 1];
  }

  /* ------------------------------------------------------------------
     EVALUATE RESULT
  ------------------------------------------------------------------ */
  function evaluate(symbols) {
    const counts = {};
    symbols.forEach((s) => { counts[s.label] = (counts[s.label] || 0) + 1; });
    const max   = Math.max(...Object.values(counts));
    const total = symbols.reduce((a, s) => a + s.value, 0);
    if (max === 5) return { tier: "jackpot",    label: "🌟 JACKPOT! ALL MATCH!",       score: total * 50 };
    if (max === 4) return { tier: "win-big",    label: "🍄 POWER-UP! 4 of a kind!",    score: total * 12 };
    if (max === 3) return { tier: "win-medium", label: "⭐ SUPER WIN! 3 of a kind!",   score: total * 5  };
    if (max === 2) return { tier: "win-small",  label: "✅ WIN! Pair found!",           score: total * 2  };
    return               { tier: "lose",        label: "🔄 No match. Try again!",      score: 0          };
  }

  /* ------------------------------------------------------------------
     BUILD SYMBOL ELEMENT
  ------------------------------------------------------------------ */
  function makeSymbolEl(sym) {
    const div = document.createElement("div");
    div.className = "reel-symbol";
    if (sym.img) {
      const img = document.createElement("img");
      img.src = sym.img; img.alt = sym.label;
      img.className = "sym-img"; img.draggable = false;
      div.appendChild(img);
    } else {
      const emoji = document.createElement("div");
      emoji.className = "sym-emoji";
      emoji.textContent = sym.emoji;
      div.appendChild(emoji);
    }
    const lbl = document.createElement("span");
    lbl.className = "sym-label"; lbl.textContent = sym.label;
    div.appendChild(lbl);
    return div;
  }

  /* ------------------------------------------------------------------
     REEL ANIMATION
  ------------------------------------------------------------------ */
  const SYMBOL_HEIGHT = 140;
  const REEL_COUNT    = 5;

  function buildStrip(stripEl) {
    stripEl.innerHTML = "";
    for (let i = 0; i < 24; i++) stripEl.appendChild(makeSymbolEl(pickSymbol()));
  }

  function animateReel(reelEl, stripEl, finalSymbol, delay, duration) {
    return new Promise((resolve) => {
      setTimeout(() => {
        stripEl.innerHTML = "";
        const count = 20;
        for (let i = 0; i < count; i++) {
          stripEl.appendChild(makeSymbolEl(i === count - 1 ? finalSymbol : pickSymbol()));
        }
        const farY = (count - 2) * SYMBOL_HEIGHT;
        stripEl.style.transition = "none";
        stripEl.style.transform  = `translateY(${farY}px)`;
        void stripEl.offsetHeight;
        stripEl.style.transition = `transform ${duration}ms cubic-bezier(.17,.67,.35,1.05)`;
        stripEl.style.transform  = `translateY(${-(count - 1) * SYMBOL_HEIGHT}px)`;

        let settled = false;
        function settle() {
          if (settled) return; settled = true;
          stripEl.innerHTML = "";
          stripEl.appendChild(makeSymbolEl(finalSymbol));
          stripEl.style.transition = "none";
          stripEl.style.transform  = "translateY(0)";
          reelEl.classList.remove("spinning");
          resolve();
        }
        stripEl.addEventListener("transitionend", settle, { once: true });
        setTimeout(settle, duration + 600);
      }, delay);
    });
  }

  /* ------------------------------------------------------------------
     COIN BURST
  ------------------------------------------------------------------ */
  function burstCoins(container, count = 6) {
    const emojis = ["🪙", "⭐", "🍄", "🌟", "💰", "🎮"];
    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        const el = document.createElement("div");
        el.className  = "coin-burst";
        el.textContent = emojis[Math.floor(Math.random() * emojis.length)];
        el.style.left = `${10 + Math.random() * 80}%`;
        el.style.top  = `${20 + Math.random() * 50}%`;
        el.style.setProperty("--dx", `${(Math.random() - .5) * 160}px`);
        el.style.setProperty("--dy", `${-(60 + Math.random() * 120)}px`);
        container.appendChild(el);
        el.addEventListener("animationend", () => el.remove(), { once: true });
      }, i * 80);
    }
  }

  /* ------------------------------------------------------------------
     PUBLIC INIT — called with DOM references
  ------------------------------------------------------------------ */
  function init(opts) {
    const {
      strips, spinBtn, spinCounterEl, scoreCounterEl,
      resultBar, resultText, winOverlay, leverEl, machineEl,
      onSpinComplete,
    } = opts;

    let spinCount  = 0;
    let totalScore = 0;
    let isSpinning = false;

    strips.forEach((s) => buildStrip(s));

    function pullLever() {
      if (!leverEl) return;
      leverEl.classList.add("pulled");
      setTimeout(() => leverEl.classList.remove("pulled"), 500);
    }

    async function spin() {
      if (isSpinning) return;
      isSpinning = true;
      spinBtn.disabled = true;

      pullLever();
      resultBar.className = "result-bar";
      resultText.textContent = "Spinning…";
      winOverlay.textContent = "";
      winOverlay.className   = "win-overlay";

      const finalSymbols = Array.from({ length: REEL_COUNT }, () => pickSymbol());

      const BASE = 900;
      const promises = strips.map((strip, i) => {
        const reelEl = strip.parentElement;
        reelEl.classList.add("spinning");
        return animateReel(reelEl, strip, finalSymbols[i], i * 220, BASE + i * 180);
      });
      await Promise.all(promises);

      const { tier, label, score } = evaluate(finalSymbols);
      spinCount++;
      totalScore += score;
      spinCounterEl.textContent = spinCount;
      scoreCounterEl.textContent = totalScore;

      resultBar.className = `result-bar ${tier}`;
      resultText.textContent = label;

      if (tier !== "lose") {
        winOverlay.textContent = tier === "jackpot" ? "🌟 JACKPOT! 🌟" : "🎉 WIN! 🎉";
        winOverlay.className   = "win-overlay show";
        setTimeout(() => { winOverlay.className = "win-overlay"; }, 2000);
        burstCoins(machineEl, tier === "jackpot" ? 14 : 6);
      }

      const symbolLabels = finalSymbols.map((s) => s.label);
      if (onSpinComplete) onSpinComplete({ tier, label, score, spinCount, totalScore, symbols: symbolLabels });

      isSpinning = false;
      spinBtn.disabled = false;
    }

    spinBtn.addEventListener("click", spin);
    if (leverEl) leverEl.parentElement.addEventListener("click", spin);

    document.addEventListener("keydown", (e) => {
      if (e.code === "Space" && document.activeElement.tagName !== "INPUT" &&
          document.activeElement.tagName !== "TEXTAREA") {
        e.preventDefault();
        spin();
      }
    });

    return { spin, getSpinCount: () => spinCount, getTotalScore: () => totalScore };
  }

  return { init, addCustomSymbol, getSymbols };
})();

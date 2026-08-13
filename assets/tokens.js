/* =====================================================================
   Image-Generator — Token System
   tokens.js — unified token ledger for spin, note, tune, and image tokens
   ===================================================================== */
window.TOKENS = (() => {
  "use strict";

  const LEDGER_KEY = "ig_tokens_v1";
  const MAX_TOKENS = 2000;

  /* Token types */
  const TYPE = {
    SPIN:  "spin",
    NOTE:  "note",
    TUNE:  "tune",
    IMAGE: "image",
    DRAW:  "draw",
  };

  function getLedger() {
    try { return JSON.parse(localStorage.getItem(LEDGER_KEY) || "[]"); }
    catch (_) { return []; }
  }

  function saveLedger(tokens) {
    if (tokens.length > MAX_TOKENS) tokens = tokens.slice(-MAX_TOKENS);
    localStorage.setItem(LEDGER_KEY, JSON.stringify(tokens));
  }

  /* Mint a new token — returns the minted token object */
  function mint(type, data = {}) {
    const ledger = getLedger();
    const id = `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const token = {
      id,
      type,
      mintedAt: new Date().toISOString(),
      ...data,
    };
    ledger.push(token);
    saveLedger(ledger);
    _notify(token);
    return token;
  }

  function mintSpin(symbols, tier, score) {
    return mint(TYPE.SPIN, { symbols, tier, score });
  }

  function mintNote(note, freq, velocity = 1) {
    return mint(TYPE.NOTE, { note, freq, velocity });
  }

  function mintTune(notes, bpm, category, title) {
    return mint(TYPE.TUNE, { notes, bpm, category, title, noteCount: notes.length });
  }

  function mintImage(dataUrl, prompt, width, height, mode) {
    return mint(TYPE.IMAGE, { prompt, width, height, mode, thumbnail: dataUrl.slice(0, 200) });
  }

  function mintDraw(dataUrl, characterName) {
    return mint(TYPE.DRAW, { characterName, thumbnail: dataUrl.slice(0, 200) });
  }

  function getAll()    { return [...getLedger()]; }
  function getByType(t){ return getLedger().filter((tk) => tk.type === t); }
  function count()     { return getLedger().length; }
  function countByType(t){ return getByType(t).length; }
  function clear()     { saveLedger([]); _notify(null); }

  /* Listener callbacks */
  const _listeners = [];
  function onMint(fn) { _listeners.push(fn); }
  function _notify(token) { _listeners.forEach((fn) => { try { fn(token); } catch(_){} }); }

  /* Stats summary */
  function stats() {
    const all = getLedger();
    const out = { total: all.length };
    Object.values(TYPE).forEach((t) => {
      out[t] = all.filter((tk) => tk.type === t).length;
    });
    return out;
  }

  /* Export as JSON blob download */
  function exportLedger() {
    const blob = new Blob([JSON.stringify(getLedger(), null, 2)], { type: "application/json" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = `ig-tokens-${Date.now()}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 100);
  }

  return { TYPE, mint, mintSpin, mintNote, mintTune, mintImage, mintDraw,
           getAll, getByType, count, countByType, clear, stats, onMint, exportLedger };
})();

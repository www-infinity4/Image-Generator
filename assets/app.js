/* =====================================================================
   Image-Generator — Main Orchestration
   app.js — wires slot, piano, draw, image-gen, auth, and token ledger
   ===================================================================== */
(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);

  /* ---- Utility ---- */
  function escHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) =>
      ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;" }[c])
    );
  }

  function log(msg, type = "") {
    const el = $("consoleLog");
    if (!el) return;
    const ts   = new Date().toLocaleTimeString();
    const line = `[${ts}] ${msg}\n`;
    const typeMap = { err: "log-err", ok: "log-ok", warn: "log-warn" };
    if (typeMap[type]) {
      el.innerHTML += `<span class="${typeMap[type]}">${escHtml(line)}</span>`;
    } else {
      el.textContent += line;
    }
    el.scrollTop = el.scrollHeight;
  }

  /* ---- Token stats display ---- */
  function refreshTokenStats() {
    const stats = window.TOKENS.stats();
    const el    = $("tokenStats");
    if (!el) return;
    el.innerHTML = [
      `<span class="ts-item">🎰 Spins: <b>${stats.spin}</b></span>`,
      `<span class="ts-item">🎵 Notes: <b>${stats.note}</b></span>`,
      `<span class="ts-item">🎶 Tunes: <b>${stats.tune}</b></span>`,
      `<span class="ts-item">🖼️ Images: <b>${stats.image}</b></span>`,
      `<span class="ts-item">✏️ Draws: <b>${stats.draw}</b></span>`,
      `<span class="ts-item ts-total">Total: <b>${stats.total}</b></span>`,
    ].join("");
  }

  /* ---- Token ledger table ---- */
  function renderTokenLedger() {
    const container = $("tokenLedger");
    if (!container) return;
    const tokens = window.TOKENS.getAll().reverse().slice(0, 50);
    if (!tokens.length) { container.innerHTML = "<p style='color:var(--muted2);padding:12px'>No tokens minted yet.</p>"; return; }

    const typeIcon = { spin:"🎰", note:"🎵", tune:"🎶", image:"🖼️", draw:"✏️" };
    container.innerHTML = "";
    tokens.forEach((tk) => {
      const div = document.createElement("div");
      div.className = "token-item";
      const time = new Date(tk.mintedAt).toLocaleTimeString();
      let detail = "";
      if (tk.type === "spin")  detail = `${tk.tier} · +${tk.score}pts`;
      if (tk.type === "note")  detail = `${tk.note} · ${Math.round(tk.freq)}Hz`;
      if (tk.type === "tune")  detail = `${tk.category} · "${tk.title}"`;
      if (tk.type === "image") detail = `${tk.mode} · ${tk.width}×${tk.height}`;
      if (tk.type === "draw")  detail = tk.characterName;
      div.innerHTML = `
        <span class="ti-icon">${typeIcon[tk.type] || "🪙"}</span>
        <span class="ti-id">${escHtml(tk.id.slice(-8))}</span>
        <span class="ti-detail">${escHtml(detail)}</span>
        <span class="ti-time">${time}</span>
      `;
      container.appendChild(div);
    });
  }

  /* ---- Image gallery ---- */
  let generatedImages = [];

  function addImageToGallery(dataUrl, token) {
    generatedImages.unshift({ dataUrl, token });
    if (generatedImages.length > 20) generatedImages = generatedImages.slice(0, 20);
    renderGallery();
  }

  function renderGallery() {
    const el = $("imageGallery");
    if (!el) return;
    el.innerHTML = "";
    generatedImages.forEach(({ dataUrl, token }) => {
      const item = document.createElement("div");
      item.className = "gallery-item";
      const img   = document.createElement("img");
      img.src     = dataUrl; img.alt = token ? token.mode : "image";
      img.className = "gallery-img";
      const lbl  = document.createElement("div");
      lbl.className = "gallery-label";
      lbl.textContent = token ? token.mode : "generated";

      const dlBtn = document.createElement("button");
      dlBtn.className = "btn btn-xs btn-ghost";
      dlBtn.textContent = "⬇";
      dlBtn.title = "Download";
      dlBtn.addEventListener("click", () => {
        const a = document.createElement("a");
        a.href = dataUrl; a.download = `ig-image-${Date.now()}.png`;
        document.body.appendChild(a); a.click(); a.remove();
      });
      item.appendChild(img); item.appendChild(lbl); item.appendChild(dlBtn);
      el.appendChild(item);
    });
  }

  /* ---- Spin history ---- */
  let spinHistory = [];

  function addSpinHistory(data) {
    spinHistory.unshift(data);
    if (spinHistory.length > 30) spinHistory = spinHistory.slice(0, 30);
    const histEl = $("spinHistory");
    if (!histEl) return;
    histEl.innerHTML = "";
    spinHistory.forEach((d) => {
      const item = document.createElement("div");
      item.className = `hist-item${d.tier === "jackpot" ? " jackpot-item" : ""}`;
      item.innerHTML = `
        <div class="hist-symbols">${d.symbols.join(" ")}</div>
        <div class="hist-result ${d.tier === "jackpot" ? "jackpot" : d.tier !== "lose" ? "win" : ""}">
          ${escHtml(d.label)}
        </div>
        <div class="hist-time">Spin #${d.spinCount} · +${d.score}pts · ${new Date().toLocaleTimeString()}</div>
      `;
      histEl.appendChild(item);
    });
    const countEl = $("spinHistoryCount");
    if (countEl) countEl.textContent = `${spinHistory.length} spins`;
  }

  /* ---- Note log ---- */
  let noteLog = [];

  function addNoteLog(token, info) {
    noteLog.unshift({ token, info });
    if (noteLog.length > 40) noteLog = noteLog.slice(0, 40);
    const el = $("noteLog");
    if (!el) return;
    el.innerHTML = "";
    noteLog.forEach(({ token: tk, info: inf }) => {
      const span = document.createElement("span");
      span.className  = "note-log-item";
      span.textContent = tk.note || (inf && inf.label) || "?";
      el.insertBefore(span, el.firstChild);
    });
  }

  /* ---- Tune log ---- */
  function addTuneLog(token) {
    log(`🎶 Tune minted: "${token.title}" (${token.category} · ${token.noteCount} notes)`, "ok");
    refreshTokenStats();
    renderTokenLedger();

    const el = $("tuneList");
    if (!el) return;
    const item = document.createElement("div");
    item.className = "tune-item";
    item.innerHTML = `
      <span class="tune-icon">🎶</span>
      <span class="tune-title">${escHtml(token.title)}</span>
      <span class="tune-cat">${escHtml(token.category)}</span>
      <span class="tune-notes">${token.noteCount} notes</span>
    `;
    el.insertBefore(item, el.firstChild);
  }

  /* ---- Init auth ---- */
  function initAuth() {
    window.AUTH.ensureAdmin();

    const session = window.AUTH.currentUser();
    if (session) updateUserBadge(session);

    $("loginBtn")?.addEventListener("click", () => {
      $("loginOverlay").style.display = "flex";
      $("loginOverlay").removeAttribute("aria-hidden");
    });
    $("loginClose")?.addEventListener("click", () => {
      $("loginOverlay").style.display = "none";
      $("loginOverlay").setAttribute("aria-hidden", "true");
    });
    $("logoutBtn")?.addEventListener("click", () => {
      window.AUTH.logout();
      $("userBadge").style.display = "none";
      $("loginBtn").style.display  = "";
      log("👋 Signed out.", "warn");
    });

    $("tabLogin")?.addEventListener("click",    () => switchTab("login"));
    $("tabRegister")?.addEventListener("click", () => switchTab("register"));

    $("btnLogin")?.addEventListener("click", async () => {
      const u = $("loginUser").value.trim();
      const p = $("loginPass").value;
      try {
        const user = await window.AUTH.login(u, p);
        updateUserBadge(user);
        $("loginOverlay").style.display = "none";
        $("loginMsg").textContent = "";
        log(`✅ Signed in as ${user.username}.`, "ok");
      } catch (e) {
        showAuthMsg("loginMsg", e.message, "err");
      }
    });

    $("btnRegister")?.addEventListener("click", async () => {
      const u = $("regUser").value.trim();
      const em = $("regEmail").value.trim();
      const p  = $("regPass").value;
      try {
        const user = await window.AUTH.register(u, em, p);
        updateUserBadge(user);
        $("loginOverlay").style.display = "none";
        log(`✅ Account created for ${user.username}.`, "ok");
      } catch (e) {
        showAuthMsg("registerMsg", e.message, "err");
      }
    });

    function switchTab(tab) {
      $("loginForm").style.display    = tab === "login"    ? "" : "none";
      $("registerForm").style.display = tab === "register" ? "" : "none";
      $("tabLogin").classList.toggle("active",    tab === "login");
      $("tabRegister").classList.toggle("active", tab === "register");
    }

    function showAuthMsg(id, msg, type) {
      const el = $(id); if (!el) return;
      el.textContent = msg;
      el.className   = `auth-msg ${type}`;
    }

    function updateUserBadge(user) {
      const badge = $("userBadge"); if (!badge) return;
      badge.style.display = "";
      $("userBadgeName").textContent = user.username;
      $("userBadgeRole").textContent = user.role;
      $("loginBtn").style.display    = "none";
      if (user.role === "admin") $("adminPanel")?.style && ($("adminPanel").style.display = "");
    }
  }

  /* ---- Init slot machine ---- */
  function initSlot() {
    const REEL_COUNT = 5;
    const strips = Array.from({ length: REEL_COUNT }, (_, i) => $(`strip${i}`));

    const slotAPI = window.SLOT.init({
      strips,
      spinBtn:        $("spinBtn"),
      spinCounterEl:  $("spinCounter"),
      scoreCounterEl: $("scoreCounter"),
      resultBar:      $("resultBar"),
      resultText:     $("resultText"),
      winOverlay:     $("winOverlay"),
      leverEl:        $("lever"),
      machineEl:      $("machine"),
      onSpinComplete(data) {
        const token = window.TOKENS.mintSpin(data.symbols, data.tier, data.score);
        log(`🎰 Spin #${data.spinCount}: ${data.label} (+${data.score}pts)`, data.tier !== "lose" ? "ok" : "");
        addSpinHistory(data);
        refreshTokenStats();
        renderTokenLedger();

        // Auto-generate a combo image on wins
        if (data.tier !== "lose") {
          const canvas = $("genCanvas");
          if (canvas) {
            const result = window.IMGGEN.generate(canvas, { mode: "combo", symbols: data.symbols });
            addImageToGallery(result.dataUrl, result.token);
            log(`🖼️ Combo image generated from win.`, "ok");
          }
        }
      },
    });
    return slotAPI;
  }

  /* ---- Init piano ---- */
  function initPiano() {
    const container = $("pianoContainer");
    if (!container) return;

    window.PIANO.build(container, {
      onNote(token, keyInfo) {
        addNoteLog(token, keyInfo);
        refreshTokenStats();
        renderTokenLedger();
      },
      onTune(token) {
        addTuneLog(token);
      },
    });

    /* Mic controls */
    $("micStartBtn")?.addEventListener("click", async () => {
      if (window.PIANO.isMicRunning()) {
        window.PIANO.stopMic();
        $("micStartBtn").textContent  = "🎙️ Start Listening";
        $("micStatus").textContent    = "Mic off";
        $("micStatus").className      = "mic-status";
        log("🎙️ Mic stopped.", "warn");
      } else {
        log("🎙️ Requesting mic access…");
        const ok = await window.PIANO.startMic((token, info) => {
          addNoteLog(token, info);
          log(`🎙️ Detected: ${info.label} (${Math.round(info.freq)}Hz)`, "");
          refreshTokenStats();
          renderTokenLedger();
        });
        if (ok) {
          $("micStartBtn").textContent = "⏹️ Stop Listening";
          $("micStatus").textContent   = "🔴 Listening…";
          $("micStatus").className     = "mic-status active";
          log("✅ Mic active — sing, whistle, or play an instrument!", "ok");
        } else {
          log("❌ Mic permission denied.", "err");
        }
      }
    });
  }

  /* ---- Init drawing tool ---- */
  function initDraw() {
    const container = $("drawContainer");
    if (!container) return;

    window.DRAW.build(container, {
      onSave(dataUrl, name) {
        log(`✏️ Character "${name}" saved & minted as draw token. Added to slot!`, "ok");
        refreshTokenStats();
        renderTokenLedger();
      },
    });
  }

  /* ---- Init image generator ---- */
  function initImageGen() {
    const canvas    = $("genCanvas");
    const modeSelect = $("genMode");
    const palSelect  = $("genPalette");
    const genBtn     = $("genBtn");
    if (!canvas || !genBtn) return;

    // Populate selects
    if (modeSelect) {
      window.IMGGEN.getModes().forEach((m) => {
        const opt = document.createElement("option");
        opt.value = m; opt.textContent = m;
        modeSelect.appendChild(opt);
      });
      modeSelect.value = "abstract";
    }
    if (palSelect) {
      window.IMGGEN.getPalettes().forEach((p) => {
        const opt = document.createElement("option");
        opt.value = p; opt.textContent = p;
        palSelect.appendChild(opt);
      });
    }

    genBtn.addEventListener("click", () => {
      const mode    = modeSelect ? modeSelect.value : undefined;
      const palette = palSelect  ? palSelect.value  : undefined;
      const result  = window.IMGGEN.generate(canvas, { mode, palette });
      addImageToGallery(result.dataUrl, result.token);
      log(`🖼️ Generated ${result.mode} image.`, "ok");
      refreshTokenStats();
      renderTokenLedger();
    });

    // Generate a first image on load
    const result = window.IMGGEN.generate(canvas, { mode: "abstract" });
    addImageToGallery(result.dataUrl, result.token);
  }

  /* ---- Init hamburger nav ---- */
  function initNav() {
    $("hamBtn")?.addEventListener("click", () => {
      $("hamDrawer").classList.add("open");
      $("hamOverlay").classList.add("visible");
      $("hamBtn").setAttribute("aria-expanded", "true");
    });
    $("hamClose")?.addEventListener("click",   closeNav);
    $("hamOverlay")?.addEventListener("click", closeNav);
    function closeNav() {
      $("hamDrawer").classList.remove("open");
      $("hamOverlay").classList.remove("visible");
      $("hamBtn").setAttribute("aria-expanded", "false");
    }
  }

  /* ---- Token controls ---- */
  function initTokenControls() {
    $("exportTokensBtn")?.addEventListener("click", () => {
      window.TOKENS.exportLedger();
      log("📦 Token ledger exported.", "ok");
    });
    $("clearTokensBtn")?.addEventListener("click", () => {
      if (!confirm("Clear all tokens? This cannot be undone.")) return;
      window.TOKENS.clear();
      refreshTokenStats();
      renderTokenLedger();
      log("🗑️ Token ledger cleared.", "warn");
    });

    window.TOKENS.onMint(() => {
      refreshTokenStats();
    });
  }

  /* ---- Clear console ---- */
  $("clearLog")?.addEventListener("click", () => { $("consoleLog").textContent = ""; });

  /* ---- Jackpot lights animation ---- */
  function initJackpotLights() {
    let step = 0;
    const lights = ["jLight1","jLight2"];
    setInterval(() => {
      lights.forEach((id, i) => {
        const el = $(id); if (!el) return;
        el.style.opacity = (i === step % lights.length) ? "1" : "0.3";
      });
      step++;
    }, 600);
  }

  /* ---- Ticker ---- */
  function initTicker() {
    const el = $("ticker"); if (!el) return;
    const messages = [
      "∞ IMAGE GENERATOR ACTIVE — SPIN · DRAW · PLAY · MINT ∞",
      "🎵 Every note is a token — play to create your melody ♪",
      "🎰 Jackpot triggers a combo image! Spin to win!",
      "✏️ Draw your character and inject it into the slot machine!",
      "🪙 Token piano: every key = 1 NOTE token · full melody = TUNE token",
      "🎙️ Background listener: sing or whistle to mint sound tokens!",
    ];
    let idx = 0;
    setInterval(() => { el.textContent = messages[idx++ % messages.length]; }, 4000);
  }

  /* ---- Boot ---- */
  document.addEventListener("DOMContentLoaded", () => {
    initNav();
    initAuth();
    initSlot();
    initPiano();
    initDraw();
    initImageGen();
    initTokenControls();
    initJackpotLights();
    initTicker();
    refreshTokenStats();
    renderTokenLedger();
    log("🚀 Image-Generator · Infinity System ready. Spin · Draw · Play · Mint.", "ok");
  });
})();

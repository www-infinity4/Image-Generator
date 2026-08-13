/* =====================================================================
   Image-Generator — Character Drawing Tool
   draw.js — HTML5 Canvas painting pad for creating custom characters
             that can be injected into the slot machine as symbols.
   ===================================================================== */
window.DRAW = (() => {
  "use strict";

  let canvas, ctx;
  let drawing = false;
  let tool    = "brush";  // brush | eraser | fill
  let color   = "#f5c542";
  let size    = 8;
  let lastX   = 0, lastY = 0;
  let onSaveCallback = null;

  /* Undo stack */
  const undoStack = [];
  const MAX_UNDO  = 20;

  function pushUndo() {
    undoStack.push(canvas.toDataURL());
    if (undoStack.length > MAX_UNDO) undoStack.shift();
  }

  function undo() {
    if (!undoStack.length) return;
    const img    = new Image();
    img.onload  = () => { ctx.clearRect(0, 0, canvas.width, canvas.height); ctx.drawImage(img, 0, 0); };
    img.src     = undoStack.pop();
  }

  /* ---- Fill (flood fill) ---- */
  function floodFill(startX, startY, fillColorHex) {
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data    = imgData.data;
    const w       = canvas.width;
    const h       = canvas.height;
    const idx     = (startY * w + startX) * 4;

    const targetR = data[idx], targetG = data[idx+1], targetB = data[idx+2], targetA = data[idx+3];
    const [fillR, fillG, fillB] = hexToRgb(fillColorHex);

    if (targetR === fillR && targetG === fillG && targetB === fillB) return;

    const stack = [[startX, startY]];
    const seen  = new Uint8Array(w * h);

    function match(i) {
      return data[i] === targetR && data[i+1] === targetG && data[i+2] === targetB && data[i+3] === targetA;
    }

    while (stack.length) {
      const [x, y] = stack.pop();
      if (x < 0 || x >= w || y < 0 || y >= h) continue;
      const i = y * w + x;
      if (seen[i]) continue;
      seen[i] = 1;
      const di = i * 4;
      if (!match(di)) continue;
      data[di] = fillR; data[di+1] = fillG; data[di+2] = fillB; data[di+3] = 255;
      stack.push([x-1,y],[x+1,y],[x,y-1],[x,y+1]);
    }
    ctx.putImageData(imgData, 0, 0);
  }

  function hexToRgb(hex) {
    const r = parseInt(hex.slice(1,3),16);
    const g = parseInt(hex.slice(3,5),16);
    const b = parseInt(hex.slice(5,7),16);
    return [r, g, b];
  }

  /* ---- Drawing ---- */
  function getPos(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width  / rect.width;
    const scaleY = canvas.height / rect.height;
    const src = e.touches ? e.touches[0] : e;
    return { x: (src.clientX - rect.left) * scaleX, y: (src.clientY - rect.top) * scaleY };
  }

  function startDraw(e) {
    e.preventDefault();
    const { x, y } = getPos(e);
    if (tool === "fill") { pushUndo(); floodFill(Math.round(x), Math.round(y), color); return; }
    drawing = true;
    lastX = x; lastY = y;
    pushUndo();
    ctx.beginPath();
    ctx.arc(x, y, size / 2, 0, Math.PI * 2);
    ctx.fillStyle = tool === "eraser" ? "#1a0a1e" : color;
    ctx.fill();
  }

  function moveDraw(e) {
    if (!drawing) return;
    e.preventDefault();
    const { x, y } = getPos(e);
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(x, y);
    ctx.lineWidth   = size;
    ctx.lineCap     = "round";
    ctx.lineJoin    = "round";
    ctx.strokeStyle = tool === "eraser" ? "#1a0a1e" : color;
    ctx.stroke();
    lastX = x; lastY = y;
  }

  function endDraw() { drawing = false; }

  /* ---- Build editor UI ---- */
  function build(container, opts = {}) {
    onSaveCallback = opts.onSave || null;

    container.innerHTML = "";
    const wrap = document.createElement("div");
    wrap.className = "draw-wrap";

    /* Toolbar */
    const toolbar = document.createElement("div");
    toolbar.className = "draw-toolbar";

    /* Color palette */
    const PALETTE = ["#f5c542","#e52222","#3cb043","#4fc3f7","#ffffff",
                     "#ff9800","#9c27b0","#00bcd4","#ff4081","#1a0a1e"];
    const palWrap = document.createElement("div");
    palWrap.className = "draw-palette";
    PALETTE.forEach((hex) => {
      const sw = document.createElement("button");
      sw.className = "draw-swatch";
      sw.style.background = hex;
      sw.setAttribute("aria-label", hex);
      sw.addEventListener("click", () => { color = hex; updateActiveColor(); });
      palWrap.appendChild(sw);
    });

    /* Custom color picker */
    const colorPicker = document.createElement("input");
    colorPicker.type  = "color";
    colorPicker.value = color;
    colorPicker.className = "draw-color-picker";
    colorPicker.addEventListener("input", (e) => { color = e.target.value; });
    palWrap.appendChild(colorPicker);
    toolbar.appendChild(palWrap);

    function updateActiveColor() {
      palWrap.querySelectorAll(".draw-swatch").forEach((sw) => {
        sw.classList.toggle("active", sw.style.background === color || sw.style.backgroundColor === color);
      });
      colorPicker.value = color;
    }

    /* Tool buttons */
    const TOOLS = [
      { id: "brush",  icon: "🖌️", label: "Brush"  },
      { id: "eraser", icon: "🧹", label: "Eraser" },
      { id: "fill",   icon: "🪣", label: "Fill"   },
    ];
    const toolWrap = document.createElement("div");
    toolWrap.className = "draw-tools";
    TOOLS.forEach((t) => {
      const btn = document.createElement("button");
      btn.className = `btn btn-sm draw-tool-btn${t.id === tool ? " active" : ""}`;
      btn.dataset.tool = t.id;
      btn.innerHTML = `${t.icon} <span>${t.label}</span>`;
      btn.addEventListener("click", () => {
        tool = t.id;
        toolWrap.querySelectorAll(".draw-tool-btn").forEach((b) => b.classList.toggle("active", b.dataset.tool === tool));
      });
      toolWrap.appendChild(btn);
    });
    toolbar.appendChild(toolWrap);

    /* Size slider */
    const sizeWrap = document.createElement("div");
    sizeWrap.className = "draw-size-wrap";
    const sizeLabel = document.createElement("label");
    sizeLabel.textContent = "Size";
    sizeLabel.className = "draw-size-label";
    const sizeSlider = document.createElement("input");
    sizeSlider.type  = "range";
    sizeSlider.min   = 2; sizeSlider.max = 40; sizeSlider.value = size;
    sizeSlider.className = "draw-size-slider";
    sizeSlider.addEventListener("input", (e) => { size = parseInt(e.target.value); });
    sizeWrap.appendChild(sizeLabel);
    sizeWrap.appendChild(sizeSlider);
    toolbar.appendChild(sizeWrap);

    /* Action buttons */
    const actWrap = document.createElement("div");
    actWrap.className = "draw-actions";

    const undoBtn = document.createElement("button");
    undoBtn.className = "btn btn-sm btn-ghost"; undoBtn.textContent = "↩ Undo";
    undoBtn.addEventListener("click", undo);
    actWrap.appendChild(undoBtn);

    const clearBtn = document.createElement("button");
    clearBtn.className = "btn btn-sm btn-ghost"; clearBtn.textContent = "🗑️ Clear";
    clearBtn.addEventListener("click", () => { pushUndo(); ctx.clearRect(0, 0, canvas.width, canvas.height); drawGrid(); });
    actWrap.appendChild(clearBtn);

    const saveBtn = document.createElement("button");
    saveBtn.className = "btn btn-sm"; saveBtn.textContent = "💾 Save & Mint";
    saveBtn.addEventListener("click", saveCharacter);
    actWrap.appendChild(saveBtn);

    toolbar.appendChild(actWrap);
    wrap.appendChild(toolbar);

    /* Character name input */
    const nameRow = document.createElement("div");
    nameRow.className = "draw-name-row";
    const nameInput = document.createElement("input");
    nameInput.type = "text"; nameInput.className = "form-input"; nameInput.placeholder = "Character name…";
    nameInput.id = "drawCharName";
    nameRow.appendChild(nameInput);
    wrap.appendChild(nameRow);

    /* Canvas */
    canvas = document.createElement("canvas");
    canvas.width  = 320;
    canvas.height = 320;
    canvas.className = "draw-canvas";
    canvas.addEventListener("mousedown",  startDraw);
    canvas.addEventListener("mousemove",  moveDraw);
    canvas.addEventListener("mouseup",    endDraw);
    canvas.addEventListener("mouseleave", endDraw);
    canvas.addEventListener("touchstart", startDraw, { passive: false });
    canvas.addEventListener("touchmove",  moveDraw,  { passive: false });
    canvas.addEventListener("touchend",   endDraw);

    ctx = canvas.getContext("2d");
    ctx.fillStyle = "#1a0a1e";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawGrid();

    wrap.appendChild(canvas);
    container.appendChild(wrap);
    updateActiveColor();

    /* Save to slot + mint draw token */
    function saveCharacter() {
      const name  = (document.getElementById("drawCharName") || {}).value || "Custom";
      const dataUrl = canvas.toDataURL("image/png");
      window.TOKENS.mintDraw(dataUrl, name);
      window.SLOT.addCustomSymbol(dataUrl, name);
      if (onSaveCallback) onSaveCallback(dataUrl, name);
    }
  }

  function drawGrid() {
    if (!ctx) return;
    ctx.strokeStyle = "rgba(255,255,255,0.04)";
    ctx.lineWidth = 1;
    for (let x = 0; x <= canvas.width; x += 16) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
    }
    for (let y = 0; y <= canvas.height; y += 16) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
    }
  }

  return { build };
})();

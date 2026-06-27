const fileInput = document.querySelector("#fileInput");
const downloadButton = document.querySelector("#downloadButton");
const previewCanvas = document.querySelector("#previewCanvas");
const dropZone = document.querySelector("#dropZone");
const emptyState = document.querySelector("#emptyState");
const ctx = previewCanvas.getContext("2d", { willReadFrequently: true });

const controls = {
  threshold: document.querySelector("#threshold"),
  gain: document.querySelector("#gain"),
  streakLength: document.querySelector("#streakLength"),
  streakIntensity: document.querySelector("#streakIntensity"),
  rays: document.querySelector("#rays"),
  rotation: document.querySelector("#rotation"),
  glowRadius: document.querySelector("#glowRadius"),
  glowIntensity: document.querySelector("#glowIntensity"),
  mix: document.querySelector("#mix"),
  tint: document.querySelector("#tint"),
  useSourceColor: document.querySelector("#useSourceColor"),
};

const outputs = {
  threshold: document.querySelector("#thresholdValue"),
  gain: document.querySelector("#gainValue"),
  streakLength: document.querySelector("#streakLengthValue"),
  streakIntensity: document.querySelector("#streakIntensityValue"),
  rays: document.querySelector("#raysValue"),
  rotation: document.querySelector("#rotationValue"),
  glowRadius: document.querySelector("#glowRadiusValue"),
  glowIntensity: document.querySelector("#glowIntensityValue"),
  mix: document.querySelector("#mixValue"),
};

const presets = {
  classic: {
    threshold: 176,
    gain: 145,
    streakLength: 74,
    streakIntensity: 118,
    rays: 8,
    rotation: 18,
    glowRadius: 32,
    glowIntensity: 95,
    mix: 115,
    tint: "#dfeaff",
    useSourceColor: true,
  },
  soft: {
    threshold: 150,
    gain: 120,
    streakLength: 46,
    streakIntensity: 74,
    rays: 6,
    rotation: 0,
    glowRadius: 54,
    glowIntensity: 125,
    mix: 105,
    tint: "#fff1cf",
    useSourceColor: true,
  },
  neon: {
    threshold: 126,
    gain: 180,
    streakLength: 112,
    streakIntensity: 148,
    rays: 10,
    rotation: 27,
    glowRadius: 42,
    glowIntensity: 150,
    mix: 135,
    tint: "#73f7ff",
    useSourceColor: false,
  },
  sharp: {
    threshold: 205,
    gain: 240,
    streakLength: 140,
    streakIntensity: 185,
    rays: 4,
    rotation: 45,
    glowRadius: 14,
    glowIntensity: 72,
    mix: 150,
    tint: "#ffffff",
    useSourceColor: true,
  },
};

let sourceImage = null;
let sourceBitmap = null;
let renderQueued = false;

const work = {
  source: document.createElement("canvas"),
  highlights: document.createElement("canvas"),
  glow: document.createElement("canvas"),
  streaks: document.createElement("canvas"),
  temp: document.createElement("canvas"),
};

function getSettings() {
  return {
    threshold: Number(controls.threshold.value),
    gain: Number(controls.gain.value) / 100,
    streakLength: Number(controls.streakLength.value),
    streakIntensity: Number(controls.streakIntensity.value) / 100,
    rays: Number(controls.rays.value),
    rotation: Number(controls.rotation.value),
    glowRadius: Number(controls.glowRadius.value),
    glowIntensity: Number(controls.glowIntensity.value) / 100,
    mix: Number(controls.mix.value) / 100,
    tint: hexToRgb(controls.tint.value),
    useSourceColor: controls.useSourceColor.checked,
  };
}

function updateOutputs() {
  outputs.threshold.value = controls.threshold.value;
  outputs.gain.value = `${controls.gain.value}%`;
  outputs.streakLength.value = `${controls.streakLength.value}px`;
  outputs.streakIntensity.value = `${controls.streakIntensity.value}%`;
  outputs.rays.value = controls.rays.value;
  outputs.rotation.value = `${controls.rotation.value}deg`;
  outputs.glowRadius.value = `${controls.glowRadius.value}px`;
  outputs.glowIntensity.value = `${controls.glowIntensity.value}%`;
  outputs.mix.value = `${controls.mix.value}%`;
}

function hexToRgb(hex) {
  const value = hex.replace("#", "");
  return {
    r: parseInt(value.slice(0, 2), 16),
    g: parseInt(value.slice(2, 4), 16),
    b: parseInt(value.slice(4, 6), 16),
  };
}

function fitSize(width, height) {
  const maxSide = 1800;
  const scale = Math.min(1, maxSide / Math.max(width, height));
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

function resizeCanvases(width, height) {
  for (const canvas of [previewCanvas, ...Object.values(work)]) {
    canvas.width = width;
    canvas.height = height;
  }
}

async function loadFile(file) {
  if (!file || !file.type.startsWith("image/")) return;

  const bitmap = await createImageBitmap(file);
  const size = fitSize(bitmap.width, bitmap.height);
  sourceBitmap = bitmap;
  sourceImage = size;
  resizeCanvases(size.width, size.height);
  emptyState.classList.add("is-hidden");
  render();
}

function extractHighlights(settings) {
  const sourceCtx = work.source.getContext("2d", { willReadFrequently: true });
  const highlightCtx = work.highlights.getContext("2d", { willReadFrequently: true });

  sourceCtx.clearRect(0, 0, work.source.width, work.source.height);
  sourceCtx.drawImage(sourceBitmap, 0, 0, work.source.width, work.source.height);

  const image = sourceCtx.getImageData(0, 0, work.source.width, work.source.height);
  const data = image.data;
  const tint = settings.tint;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    const hot = Math.max(0, (luma - settings.threshold) / (255 - settings.threshold || 1));
    const amount = Math.min(1, hot * settings.gain);
    const sourceMix = settings.useSourceColor ? 0.56 : 0;

    data[i] = Math.min(255, (r * sourceMix + tint.r * (1 - sourceMix)) * amount);
    data[i + 1] = Math.min(255, (g * sourceMix + tint.g * (1 - sourceMix)) * amount);
    data[i + 2] = Math.min(255, (b * sourceMix + tint.b * (1 - sourceMix)) * amount);
    data[i + 3] = Math.round(255 * amount);
  }

  highlightCtx.putImageData(image, 0, 0);
}

function drawGlow(settings) {
  const glowCtx = work.glow.getContext("2d");
  glowCtx.clearRect(0, 0, work.glow.width, work.glow.height);
  glowCtx.globalCompositeOperation = "lighter";
  glowCtx.globalAlpha = 0.72 * settings.glowIntensity;

  const radii = [
    settings.glowRadius * 0.35,
    settings.glowRadius,
    settings.glowRadius * 2.2,
  ];

  for (const radius of radii) {
    if (radius <= 0) continue;
    glowCtx.filter = `blur(${radius}px)`;
    glowCtx.drawImage(work.highlights, 0, 0);
  }

  glowCtx.filter = "none";
  glowCtx.globalAlpha = 1;
  glowCtx.globalCompositeOperation = "source-over";
}

function drawStreaks(settings) {
  const streakCtx = work.streaks.getContext("2d");
  const tempCtx = work.temp.getContext("2d");
  const width = work.streaks.width;
  const height = work.streaks.height;

  streakCtx.clearRect(0, 0, width, height);
  streakCtx.globalCompositeOperation = "lighter";

  const half = Math.max(2, Math.round(settings.streakLength / 2));
  const step = Math.max(2, Math.round(settings.streakLength / 18));
  const rayCount = Math.max(2, settings.rays);

  for (let ray = 0; ray < rayCount; ray++) {
    const angle = ((settings.rotation + (180 / rayCount) * ray) * Math.PI) / 180;
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);

    for (let offset = -half; offset <= half; offset += step) {
      if (offset === 0) continue;
      const distance = Math.abs(offset) / half;
      const falloff = Math.pow(1 - distance, 2.2);
      const alpha = falloff * 0.115 * settings.streakIntensity;

      tempCtx.clearRect(0, 0, width, height);
      tempCtx.globalAlpha = alpha;
      tempCtx.filter = `blur(${Math.max(0.4, distance * 1.8)}px)`;
      tempCtx.drawImage(work.highlights, dx * offset, dy * offset);

      streakCtx.drawImage(work.temp, 0, 0);
    }
  }

  tempCtx.filter = "none";
  tempCtx.globalAlpha = 1;
  streakCtx.globalCompositeOperation = "source-over";
}

function compose(settings) {
  ctx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
  ctx.drawImage(work.source, 0, 0);
  ctx.globalCompositeOperation = "lighter";
  ctx.globalAlpha = settings.mix;
  ctx.drawImage(work.glow, 0, 0);
  ctx.drawImage(work.streaks, 0, 0);
  ctx.globalAlpha = Math.min(1, settings.mix * 0.4);
  ctx.drawImage(work.highlights, 0, 0);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";
}

function render() {
  if (!sourceBitmap || !sourceImage) {
    updateOutputs();
    return;
  }

  const settings = getSettings();
  updateOutputs();
  extractHighlights(settings);
  drawGlow(settings);
  drawStreaks(settings);
  compose(settings);
}

function queueRender() {
  if (renderQueued) return;
  renderQueued = true;
  requestAnimationFrame(() => {
    renderQueued = false;
    render();
  });
}

function applyPreset(name) {
  const preset = presets[name];
  if (!preset) return;

  for (const [key, value] of Object.entries(preset)) {
    if (key === "useSourceColor") {
      controls.useSourceColor.checked = value;
    } else {
      controls[key].value = value;
    }
  }

  document.querySelectorAll(".preset").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.preset === name);
  });

  queueRender();
}

function download() {
  if (!sourceBitmap) return;
  const link = document.createElement("a");
  link.download = "starglow-modoki.png";
  link.href = previewCanvas.toDataURL("image/png");
  link.click();
}

fileInput.addEventListener("change", () => {
  loadFile(fileInput.files[0]);
});

downloadButton.addEventListener("click", download);

for (const control of Object.values(controls)) {
  control.addEventListener("input", queueRender);
  control.addEventListener("change", queueRender);
}

document.querySelectorAll(".preset").forEach((button) => {
  button.addEventListener("click", () => applyPreset(button.dataset.preset));
});

dropZone.addEventListener("dragover", (event) => {
  event.preventDefault();
  dropZone.classList.add("is-dragging");
});

dropZone.addEventListener("dragleave", () => {
  dropZone.classList.remove("is-dragging");
});

dropZone.addEventListener("drop", (event) => {
  event.preventDefault();
  dropZone.classList.remove("is-dragging");
  loadFile(event.dataTransfer.files[0]);
});

updateOutputs();

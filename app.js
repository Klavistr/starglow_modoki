const fileInput = document.querySelector("#fileInput");
const downloadButton = document.querySelector("#downloadButton");
const previewCanvas = document.querySelector("#previewCanvas");
const dropZone = document.querySelector("#dropZone");
const emptyState = document.querySelector("#emptyState");
const ctx = previewCanvas.getContext("2d", { willReadFrequently: true });

const controls = {
  inputChannel: document.querySelector("#inputChannel"),
  threshold: document.querySelector("#threshold"),
  thresholdSoft: document.querySelector("#thresholdSoft"),
  gain: document.querySelector("#gain"),
  shapePreset: document.querySelector("#shapePreset"),
  streakLength: document.querySelector("#streakLength"),
  streakIntensity: document.querySelector("#streakIntensity"),
  rays: document.querySelector("#rays"),
  rotation: document.querySelector("#rotation"),
  glowRadius: document.querySelector("#glowRadius"),
  glowIntensity: document.querySelector("#glowIntensity"),
  mix: document.querySelector("#mix"),
  sourceOpacity: document.querySelector("#sourceOpacity"),
  transferMode: document.querySelector("#transferMode"),
  colormap: document.querySelector("#colormap"),
  tint: document.querySelector("#tint"),
  useSourceColor: document.querySelector("#useSourceColor"),
  shimmerAmount: document.querySelector("#shimmerAmount"),
  shimmerDetail: document.querySelector("#shimmerDetail"),
  shimmerPhase: document.querySelector("#shimmerPhase"),
};

const outputs = {
  threshold: document.querySelector("#thresholdValue"),
  thresholdSoft: document.querySelector("#thresholdSoftValue"),
  gain: document.querySelector("#gainValue"),
  streakLength: document.querySelector("#streakLengthValue"),
  streakIntensity: document.querySelector("#streakIntensityValue"),
  rays: document.querySelector("#raysValue"),
  rotation: document.querySelector("#rotationValue"),
  glowRadius: document.querySelector("#glowRadiusValue"),
  glowIntensity: document.querySelector("#glowIntensityValue"),
  mix: document.querySelector("#mixValue"),
  sourceOpacity: document.querySelector("#sourceOpacityValue"),
  shimmerAmount: document.querySelector("#shimmerAmountValue"),
  shimmerDetail: document.querySelector("#shimmerDetailValue"),
  shimmerPhase: document.querySelector("#shimmerPhaseValue"),
};

const presets = {
  classic: {
    inputChannel: "luminance",
    threshold: 172,
    thresholdSoft: 46,
    gain: 165,
    shapePreset: "even",
    streakLength: 92,
    streakIntensity: 135,
    rays: 8,
    rotation: 0,
    glowRadius: 26,
    glowIntensity: 82,
    mix: 125,
    sourceOpacity: 100,
    transferMode: "lighter",
    colormap: "white",
    tint: "#eef4ff",
    useSourceColor: true,
    shimmerAmount: 10,
    shimmerDetail: 4,
    shimmerPhase: 40,
  },
  soft: {
    inputChannel: "lightness",
    threshold: 136,
    thresholdSoft: 88,
    gain: 118,
    shapePreset: "diagonal",
    streakLength: 58,
    streakIntensity: 78,
    rays: 8,
    rotation: 10,
    glowRadius: 62,
    glowIntensity: 142,
    mix: 108,
    sourceOpacity: 100,
    transferMode: "screen",
    colormap: "warm",
    tint: "#ffe4b5",
    useSourceColor: true,
    shimmerAmount: 5,
    shimmerDetail: 2,
    shimmerPhase: 20,
  },
  neon: {
    inputChannel: "luminance",
    threshold: 118,
    thresholdSoft: 34,
    gain: 220,
    shapePreset: "prism",
    streakLength: 130,
    streakIntensity: 174,
    rays: 8,
    rotation: 18,
    glowRadius: 38,
    glowIntensity: 128,
    mix: 142,
    sourceOpacity: 92,
    transferMode: "lighter",
    colormap: "prism",
    tint: "#6ff7ff",
    useSourceColor: false,
    shimmerAmount: 24,
    shimmerDetail: 7,
    shimmerPhase: 115,
  },
  sharp: {
    inputChannel: "luminance",
    threshold: 204,
    thresholdSoft: 18,
    gain: 260,
    shapePreset: "cross",
    streakLength: 156,
    streakIntensity: 210,
    rays: 4,
    rotation: 45,
    glowRadius: 12,
    glowIntensity: 58,
    mix: 158,
    sourceOpacity: 100,
    transferMode: "lighter",
    colormap: "cool",
    tint: "#ffffff",
    useSourceColor: true,
    shimmerAmount: 16,
    shimmerDetail: 6,
    shimmerPhase: 280,
  },
};

const colormaps = {
  white: ["#ffffff", "#e9f1ff", "#ffffff", "#f5fbff", "#ffffff"],
  rgb: ["#ff4b4b", "#ffe45c", "#60ff78", "#4cc8ff", "#8464ff"],
  prism: ["#ff4f8b", "#ffb34a", "#fff36e", "#6fffd2", "#63a7ff", "#b96cff"],
  warm: ["#fff1bd", "#ffd071", "#ff8c68", "#f75f91", "#ffffff"],
  cool: ["#ffffff", "#cbe6ff", "#78d8ff", "#8da2ff", "#d8c7ff"],
};

const rayAngles = [0, 45, 90, 135, 180, 225, 270, 315];

let sourceImage = null;
let sourceBitmap = null;
let renderQueued = false;

const work = {
  source: document.createElement("canvas"),
  highlightMask: document.createElement("canvas"),
  rayTint: document.createElement("canvas"),
  glow: document.createElement("canvas"),
  streaks: document.createElement("canvas"),
  temp: document.createElement("canvas"),
};

function getSettings() {
  return {
    inputChannel: controls.inputChannel.value,
    threshold: Number(controls.threshold.value),
    thresholdSoft: Number(controls.thresholdSoft.value),
    gain: Number(controls.gain.value) / 100,
    shapePreset: controls.shapePreset.value,
    streakLength: Number(controls.streakLength.value),
    streakIntensity: Number(controls.streakIntensity.value) / 100,
    rays: Number(controls.rays.value),
    rotation: Number(controls.rotation.value),
    glowRadius: Number(controls.glowRadius.value),
    glowIntensity: Number(controls.glowIntensity.value) / 100,
    mix: Number(controls.mix.value) / 100,
    sourceOpacity: Number(controls.sourceOpacity.value) / 100,
    transferMode: controls.transferMode.value,
    colormap: controls.colormap.value,
    tint: hexToRgb(controls.tint.value),
    useSourceColor: controls.useSourceColor.checked,
    shimmerAmount: Number(controls.shimmerAmount.value) / 100,
    shimmerDetail: Number(controls.shimmerDetail.value),
    shimmerPhase: Number(controls.shimmerPhase.value),
  };
}

function updateOutputs() {
  outputs.threshold.value = controls.threshold.value;
  outputs.thresholdSoft.value = controls.thresholdSoft.value;
  outputs.gain.value = `${controls.gain.value}%`;
  outputs.streakLength.value = `${controls.streakLength.value}px`;
  outputs.streakIntensity.value = `${controls.streakIntensity.value}%`;
  outputs.rays.value = controls.rays.value;
  outputs.rotation.value = `${controls.rotation.value}deg`;
  outputs.glowRadius.value = `${controls.glowRadius.value}px`;
  outputs.glowIntensity.value = `${controls.glowIntensity.value}%`;
  outputs.mix.value = `${controls.mix.value}%`;
  outputs.sourceOpacity.value = `${controls.sourceOpacity.value}%`;
  outputs.shimmerAmount.value = `${controls.shimmerAmount.value}%`;
  outputs.shimmerDetail.value = controls.shimmerDetail.value;
  outputs.shimmerPhase.value = `${controls.shimmerPhase.value}deg`;
}

function hexToRgb(hex) {
  const value = hex.replace("#", "");
  return {
    r: parseInt(value.slice(0, 2), 16),
    g: parseInt(value.slice(2, 4), 16),
    b: parseInt(value.slice(4, 6), 16),
  };
}

function mixRgb(a, b, amount) {
  return {
    r: a.r * (1 - amount) + b.r * amount,
    g: a.g * (1 - amount) + b.g * amount,
    b: a.b * (1 - amount) + b.b * amount,
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

function sampleInputChannel(r, g, b, a, channel) {
  if (channel === "red") return r;
  if (channel === "green") return g;
  if (channel === "blue") return b;
  if (channel === "alpha") return a;
  if (channel === "lightness") return (Math.max(r, g, b) + Math.min(r, g, b)) / 2;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function smoothstep(edge0, edge1, value) {
  const t = Math.min(1, Math.max(0, (value - edge0) / (edge1 - edge0 || 1)));
  return t * t * (3 - 2 * t);
}

function shimmerAt(x, y, settings) {
  if (settings.shimmerAmount <= 0) return 1;
  const scale = 0.018 * settings.shimmerDetail;
  const phase = (settings.shimmerPhase * Math.PI) / 180;
  const a = Math.sin(x * scale + y * scale * 0.37 + phase);
  const b = Math.sin(x * scale * 0.41 - y * scale * 0.82 + phase * 1.7);
  const n = (a + b) * 0.5;
  return Math.max(0, 1 + n * settings.shimmerAmount);
}

function extractHighlightMask(settings) {
  const sourceCtx = work.source.getContext("2d", { willReadFrequently: true });
  const maskCtx = work.highlightMask.getContext("2d", { willReadFrequently: true });

  sourceCtx.clearRect(0, 0, work.source.width, work.source.height);
  sourceCtx.drawImage(sourceBitmap, 0, 0, work.source.width, work.source.height);

  const image = sourceCtx.getImageData(0, 0, work.source.width, work.source.height);
  const data = image.data;
  const low = settings.threshold - settings.thresholdSoft;

  for (let i = 0; i < data.length; i += 4) {
    const pixel = i / 4;
    const x = pixel % image.width;
    const y = Math.floor(pixel / image.width);
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];
    const channel = sampleInputChannel(r, g, b, a, settings.inputChannel);
    const soft = smoothstep(low, settings.threshold, channel);
    const hot = Math.max(0, (channel - settings.threshold) / (255 - settings.threshold || 1));
    const amount = Math.min(1, (soft * 0.42 + hot * 0.95) * settings.gain);
    const shimmer = shimmerAt(x, y, settings);
    const alpha = Math.min(1, amount * shimmer);

    data[i] = 255;
    data[i + 1] = 255;
    data[i + 2] = 255;
    data[i + 3] = Math.round(255 * alpha);
  }

  maskCtx.putImageData(image, 0, 0);
}

function getActiveRays(settings) {
  const wanted = new Set();
  const rayLimit = Math.min(8, Math.max(2, settings.rays));

  if (settings.shapePreset === "cross") {
    [0, 2, 4, 6].forEach((index) => wanted.add(index));
  } else if (settings.shapePreset === "diagonal") {
    [1, 3, 5, 7].forEach((index) => wanted.add(index));
  } else if (settings.shapePreset === "vertical") {
    [2, 6].forEach((index) => wanted.add(index));
  } else if (settings.shapePreset === "horizontal") {
    [0, 4].forEach((index) => wanted.add(index));
  } else {
    for (let i = 0; i < rayLimit; i += 1) {
      wanted.add(Math.round((i * 8) / rayLimit) % 8);
    }
  }

  return rayAngles.map((angle, index) => {
    const active = wanted.has(index);
    const prismBias = settings.shapePreset === "prism" ? 0.62 + (index % 3) * 0.26 : 1;
    const crossBias = index % 2 === 0 ? 1 : 0.72;
    const length = settings.streakLength * prismBias * (settings.shapePreset === "even" ? crossBias : 1);
    return {
      angle: angle + settings.rotation,
      active,
      length,
      weight: active ? 1 : 0,
      color: getRayColor(index, settings),
    };
  });
}

function getRayColor(index, settings) {
  const colors = colormaps[settings.colormap] || colormaps.white;
  const base = hexToRgb(colors[index % colors.length]);
  if (settings.colormap === "white") return mixRgb(base, settings.tint, 0.35);
  if (settings.useSourceColor) return mixRgb(base, settings.tint, 0.18);
  return mixRgb(base, settings.tint, 0.5);
}

function drawTintedMask(target, color, alpha = 1) {
  const targetCtx = target.getContext("2d");
  targetCtx.clearRect(0, 0, target.width, target.height);
  targetCtx.drawImage(work.highlightMask, 0, 0);
  targetCtx.globalCompositeOperation = "source-in";
  targetCtx.globalAlpha = alpha;
  targetCtx.fillStyle = `rgb(${color.r}, ${color.g}, ${color.b})`;
  targetCtx.fillRect(0, 0, target.width, target.height);
  targetCtx.globalAlpha = 1;
  targetCtx.globalCompositeOperation = "source-over";
}

function drawGlow(settings, rays) {
  const glowCtx = work.glow.getContext("2d");
  glowCtx.clearRect(0, 0, work.glow.width, work.glow.height);
  glowCtx.globalCompositeOperation = "lighter";

  const active = rays.filter((ray) => ray.active);
  const averageColor = (active.length ? active : [rays[0]])
    .reduce((sum, ray, index, activeRays) => {
      sum.r += ray.color.r / activeRays.length;
      sum.g += ray.color.g / activeRays.length;
      sum.b += ray.color.b / activeRays.length;
      return sum;
    }, { r: 0, g: 0, b: 0 });

  drawTintedMask(work.rayTint, averageColor, 1);

  const radii = [
    settings.glowRadius * 0.3,
    settings.glowRadius,
    settings.glowRadius * 2.1,
  ];

  for (const radius of radii) {
    if (radius <= 0) continue;
    glowCtx.globalAlpha = 0.28 * settings.glowIntensity;
    glowCtx.filter = `blur(${radius}px)`;
    glowCtx.drawImage(work.rayTint, 0, 0);
  }

  glowCtx.filter = "none";
  glowCtx.globalAlpha = 1;
  glowCtx.globalCompositeOperation = "source-over";
}

function drawStreaks(settings, rays) {
  const streakCtx = work.streaks.getContext("2d");
  const tempCtx = work.temp.getContext("2d");
  const width = work.streaks.width;
  const height = work.streaks.height;

  streakCtx.clearRect(0, 0, width, height);
  streakCtx.globalCompositeOperation = "lighter";

  for (const ray of rays) {
    if (!ray.active || ray.length <= 0) continue;

    drawTintedMask(work.rayTint, ray.color, 1);

    const half = Math.max(2, Math.round(ray.length / 2));
    const step = Math.max(2, Math.round(ray.length / 24));
    const angle = (ray.angle * Math.PI) / 180;
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);

    for (let offset = -half; offset <= half; offset += step) {
      if (offset === 0) continue;

      const distance = Math.abs(offset) / half;
      const falloff = Math.pow(1 - distance, 2.05);
      const core = Math.pow(1 - distance, 5.5) * 0.05;
      const alpha = (falloff * 0.105 + core) * settings.streakIntensity * ray.weight;
      if (alpha <= 0.002) continue;

      tempCtx.clearRect(0, 0, width, height);
      tempCtx.globalAlpha = alpha;
      tempCtx.filter = `blur(${Math.max(0.25, distance * 1.45)}px)`;
      tempCtx.drawImage(work.rayTint, dx * offset, dy * offset);
      streakCtx.drawImage(work.temp, 0, 0);
    }
  }

  tempCtx.filter = "none";
  tempCtx.globalAlpha = 1;
  streakCtx.globalCompositeOperation = "source-over";
}

function drawCenterHighlights(rays) {
  const active = rays.filter((ray) => ray.active);
  const color = (active.length ? active : [rays[0]]).reduce((sum, ray, index, activeRays) => {
    sum.r += ray.color.r / activeRays.length;
    sum.g += ray.color.g / activeRays.length;
    sum.b += ray.color.b / activeRays.length;
    return sum;
  }, { r: 0, g: 0, b: 0 });

  drawTintedMask(work.rayTint, color, 1);
}

function compose(settings) {
  ctx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
  ctx.globalAlpha = settings.sourceOpacity;
  ctx.drawImage(work.source, 0, 0);
  ctx.globalAlpha = settings.mix;
  ctx.globalCompositeOperation = settings.transferMode;
  ctx.drawImage(work.glow, 0, 0);
  ctx.drawImage(work.streaks, 0, 0);
  ctx.globalAlpha = Math.min(1, settings.mix * 0.28);
  ctx.drawImage(work.rayTint, 0, 0);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";
}

function render() {
  if (!sourceBitmap || !sourceImage) {
    updateOutputs();
    return;
  }

  const settings = getSettings();
  const rays = getActiveRays(settings);
  updateOutputs();
  extractHighlightMask(settings);
  drawGlow(settings, rays);
  drawStreaks(settings, rays);
  drawCenterHighlights(rays);
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

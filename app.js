const fileInput = document.querySelector("#fileInput");
const saveButton = document.querySelector("#saveButton");
const presetSelect = document.querySelector("#presetSelect");
const controlsRoot = document.querySelector("#controlsRoot");
const previewPane = document.querySelector("#previewPane");
const viewport = document.querySelector("#viewport");
const previewCanvas = document.querySelector("#previewCanvas");
const emptyState = document.querySelector("#emptyState");
const ctx = previewCanvas.getContext("2d", { willReadFrequently: true });

const dirs = [
  ["up", "Up", -90],
  ["down", "Down", 90],
  ["left", "Left", 180],
  ["right", "Right", 0],
  ["upLeft", "Up Left", -135],
  ["upRight", "Up Right", -45],
  ["downLeft", "Down Left", 135],
  ["downRight", "Down Right", 45],
];

const blendModes = {
  None: "source-over",
  Normal: "source-over",
  Add: "lighter",
  Multiply: "multiply",
  Screen: "screen",
  Overlay: "overlay",
  "Soft Light": "soft-light",
  "Hard Light": "hard-light",
  "Color Dodge": "color-dodge",
  "Color Burn": "color-burn",
  Darken: "darken",
  Lighten: "lighten",
  Difference: "difference",
  Exclusion: "exclusion",
  Hue: "hue",
  Saturation: "saturation",
  Color: "color",
};

const gradientPresets = {
  Fire: ["#ffffff", "#ffb000", "#aa0000"],
  Mars: ["#fff3cf", "#d75a32", "#45140d"],
  Chemistry: ["#f2ff88", "#00ff88", "#003b2b"],
  Deepsea: ["#ffffff", "#00aaff", "#00144d"],
  Electric: ["#ffffff", "#00ffff", "#0000ff"],
  Spirit: ["#ffffff", "#a9a0ff", "#351f8f"],
  Aura: ["#ffffff", "#adffdd", "#1d7a5c"],
  Heaven: ["#ffffff", "#9999ff", "#4730af"],
  Romance: ["#fff1ff", "#ff67bc", "#6f0036"],
  Magic: ["#ffffff", "#ae00ff", "#17005b"],
  USA: ["#ffffff", "#4169ff", "#c00020"],
  Rastafari: ["#ffff66", "#00b050", "#b00020"],
  Enlightenment: ["#ffffff", "#fff5a6", "#ffb34a", "#ff5a3d", "#530000"],
  Radioaktiv: ["#ffffff", "#d7ff00", "#69d300", "#108a00", "#001a00"],
  "IR Vision": ["#ffffff", "#ffeb3b", "#ff5722", "#8b0000", "#120000"],
  Lysergic: ["#ffffff", "#ff4fd8", "#00e5ff", "#7cff4f", "#2d0050"],
  Rainbow: ["#ff3030", "#fff04a", "#2cff6a", "#25b8ff", "#7b3dff"],
  RGB: ["#ff0000", "#ffff00", "#00ff00", "#00ffff", "#0000ff"],
  Technicolor: ["#ffffff", "#ff2d55", "#ffcc00", "#34c759", "#007aff"],
  Chess: ["#ffffff", "#bdbdbd", "#777777", "#303030", "#000000"],
  Pastell: ["#ffffff", "#ffc7df", "#c7d7ff", "#c9ffd7", "#fff1bd"],
  "Desert Sun": ["#ffffff", "#ffd27d", "#df8738", "#803000", "#190800"],
  "Red Prism": ["#ffffff", "#ff8080", "#ff2020", "#900000", "#240000"],
};

const colormapPresetGroups = {
  Type: ["One Color", "3-Color Gradient", "5-Color Gradient"],
  "3-Color Gradient": ["Fire", "Mars", "Chemistry", "Deepsea", "Electric", "Spirit", "Aura", "Heaven", "Romance", "Magic", "USA", "Rastafari"],
  "5-Color Gradient": ["Enlightenment", "Radioaktiv", "IR Vision", "Lysergic", "Rainbow", "RGB", "Technicolor", "Chess", "Pastell", "Desert Sun", "Red Prism"],
};

const defaultMap = (preset = "3-Color Gradient", colors = ["#ffffff", "#ffffff", "#ffffff"]) => ({
  preset,
  highlights: colors[0],
  midHigh: colors[1] || colors[0],
  midtones: colors[2] || colors[1] || colors[0],
  midLow: colors[3] || colors[2] || colors[1] || colors[0],
  shadows: colors[4] || colors[2] || colors[1] || colors[0],
});

const initialState = {
  preset: "Xmas Star",
  dirty: false,
  inputChannel: "Lightness",
  threshold: 245,
  thresholdSoft: 10,
  useMask: false,
  maskRadius: 100,
  maskFeather: 50,
  maskX: 0,
  maskY: 0,
  streakLength: 20,
  boostLight: 0,
  lengths: Object.fromEntries(dirs.map(([key]) => [key, 1])),
  colors: {
    up: "A",
    down: "A",
    left: "A",
    right: "A",
    upLeft: "B",
    upRight: "B",
    downLeft: "B",
    downRight: "B",
  },
  maps: {
    A: defaultMap("3-Color Gradient", ["#ffffff", "#99ff00", "#008000"]),
    B: defaultMap("3-Color Gradient", ["#ffffff", "#ff5b22", "#5d0000"]),
    C: defaultMap("3-Color Gradient", ["#ffffff", "#9999ff", "#0000ff"]),
  },
  shimmerAmount: 0,
  shimmerDetail: 10,
  phaseTurns: 0,
  phaseDegrees: 0,
  useLoop: false,
  revolutionsInLoop: 1,
  sourceOpacity: 100,
  starglowOpacity: 100,
  transferMode: "Screen",
};

let state = structuredClone(initialState);
let sourceBitmap = null;
let sourceSize = null;
let renderQueued = false;
let suppressDirty = false;

const work = {
  source: document.createElement("canvas"),
  mask: document.createElement("canvas"),
  tint: document.createElement("canvas"),
  glow: document.createElement("canvas"),
  streaks: document.createElement("canvas"),
  temp: document.createElement("canvas"),
};

const controls = new Map();

const presetGroups = {
  Basic: [
    ["Red", { allColor: "#ff3030", length: 1.8 }],
    ["Green", { allColor: "#48ff54", length: 1.8 }],
    ["Blue", { allColor: "#4b7bff", length: 1.8 }],
    ["White Star", { allColor: "#ffffff", length: 1.8 }],
    ["White Star 2", { allColor: "#ffffff", length: 1.0, boostLight: 45 }],
    ["White Cross", { active: ["up", "down", "left", "right"], allColor: "#ffffff", length: 1.9 }],
    ["White X", { active: ["upLeft", "upRight", "downLeft", "downRight"], allColor: "#ffffff", length: 1.9 }],
    ["White H", { active: ["left", "right"], allColor: "#ffffff", length: 2.1 }],
    ["White V", { active: ["up", "down"], allColor: "#ffffff", length: 2.1 }],
    ["White Tri", { active: ["up", "downRight", "downLeft"], allColor: "#ffffff", length: 1.9 }],
    ["White Y", { active: ["upLeft", "upRight", "down"], allColor: "#ffffff", length: 1.9 }],
  ],
  Prism: [
    ["Star Prism", { prism: "star" }],
    ["Tilt Prism", { prism: "tilt" }],
    ["H Prism", { active: ["left", "right"], prism: "h", length: 0.95 }],
    ["V Prism", { active: ["up", "down"], prism: "v", length: 0.95 }],
    ["HV Prism", { active: ["up", "down", "left", "right"], prism: "hv", length: 0.95 }],
    ["HVD Prism", { active: ["up", "down", "left", "right", "upLeft", "upRight", "downLeft", "downRight"], prism: "hv", length: 1.15, boostLight: 45 }],
    ["Tri Prism", { active: ["up", "downRight", "downLeft"], tri: true, length: 1.85 }],
  ],
  Colored: [
    ["Warm Star", { cardinal: "#ff9f24", diagonal: "#ff542b", length: 1.8 }],
    ["Warm Star 2", { split: ["#ff9f24", "#ff542b"], length: 1.8 }],
    ["Warm Heaven", { cardinal: "#bc75ff", diagonal: "#ff5f9f", length: 1.8 }],
    ["Warm Heaven 2", { split: ["#bc75ff", "#ff5f9f"], length: 1.8 }],
    ["Cold Heaven", { cardinal: "#bc75ff", diagonal: "#536dff", length: 1.8 }],
    ["Cold Heaven 2", { split: ["#bc75ff", "#536dff"], length: 1.8 }],
    ["Romantic", { romantic: true, length: 1.8 }],
    ["Xmas Star", { xmas: true }],
    ["Supastar", { supastar: true, length: 0.95, boostLight: 30 }],
    ["Grassy Star", { grassy: true, length: 1.8 }],
    ["Scope", { active: ["left", "right"], scope: true, length: 2.1 }],
  ],
};

function makePreset(spec) {
  const s = structuredClone(initialState);
  s.preset = "";
  s.dirty = false;
  s.streakLength = 20;
  s.boostLight = spec.boostLight || 0;
  s.lengths = Object.fromEntries(dirs.map(([key]) => [key, spec.active && !spec.active.includes(key) ? 0 : spec.length || 1]));
  s.colors = Object.fromEntries(dirs.map(([key]) => [key, "A"]));

  if (spec.allColor) {
    s.maps.A = defaultMap("One Color", [spec.allColor]);
  } else if (spec.cardinal || spec.diagonal) {
    s.maps.A = defaultMap("One Color", [spec.cardinal]);
    s.maps.B = defaultMap("One Color", [spec.diagonal]);
    ["upLeft", "upRight", "downLeft", "downRight"].forEach((key) => { s.colors[key] = "B"; });
  } else if (spec.split) {
    s.maps.A = defaultMap("One Color", [spec.split[0]]);
    s.maps.B = defaultMap("One Color", [spec.split[1]]);
    ["downRight", "down", "downLeft", "left"].forEach((key) => { s.colors[key] = "B"; });
  } else if (spec.prism) {
    s.maps.A = defaultMap("3-Color Gradient", ["#ffffff", "#ff3030", "#400000"]);
    s.maps.B = defaultMap("3-Color Gradient", ["#ffffff", "#32ff5c", "#003f16"]);
    s.maps.C = defaultMap("3-Color Gradient", ["#ffffff", "#4b80ff", "#00005b"]);
    if (spec.prism === "star") {
      Object.assign(s.colors, { upLeft: "A", up: "A", upRight: "A", left: "B", right: "B", downLeft: "C", down: "C", downRight: "C" });
    } else if (spec.prism === "tilt") {
      Object.assign(s.colors, { up: "A", upRight: "A", right: "A", downRight: "B", upLeft: "B", down: "C", downLeft: "C", left: "C" });
    } else if (spec.prism === "h") {
      s.maps.A = defaultMap("3-Color Gradient", ["#35ff55", "#35ff55", "#ff3030"]);
      s.maps.B = defaultMap("3-Color Gradient", ["#35ff55", "#35ff55", "#2438ff"]);
      Object.assign(s.colors, { right: "A", left: "B" });
    } else if (spec.prism === "v") {
      s.maps.A = defaultMap("3-Color Gradient", ["#35ff55", "#35ff55", "#ff3030"]);
      s.maps.B = defaultMap("3-Color Gradient", ["#35ff55", "#35ff55", "#2438ff"]);
      Object.assign(s.colors, { up: "A", down: "B" });
    } else {
      s.maps.A = defaultMap("3-Color Gradient", ["#35ff55", "#35ff55", "#ff3030"]);
      s.maps.B = defaultMap("3-Color Gradient", ["#35ff55", "#35ff55", "#2438ff"]);
      Object.assign(s.colors, { up: "A", right: "A", down: "B", left: "B" });
    }
  } else if (spec.tri) {
    s.maps.A = defaultMap("One Color", ["#ff3030"]);
    s.maps.B = defaultMap("One Color", ["#35ff55"]);
    s.maps.C = defaultMap("One Color", ["#3f64ff"]);
    Object.assign(s.colors, { up: "A", downRight: "B", downLeft: "C" });
  } else if (spec.romantic) {
    s.maps.A = defaultMap("One Color", ["#9a143a"]);
    s.maps.B = defaultMap("One Color", ["#d060d8"]);
    ["downRight", "downLeft"].forEach((key) => { s.colors[key] = "B"; });
  } else if (spec.xmas) {
    Object.assign(s.lengths, { up: 1.9, down: 1.8, left: 1, right: 1, upLeft: 1, upRight: 2, downLeft: 1, downRight: 1 });
    Object.assign(s.colors, { up: "A", down: "B", left: "B", right: "A", upLeft: "A", upRight: "B", downLeft: "B", downRight: "A" });
    s.maps.A = defaultMap("3-Color Gradient", ["#ffffff", "#99ff00", "#008000"]);
    s.maps.B = defaultMap("3-Color Gradient", ["#ffffff", "#ff5b22", "#5d0000"]);
  } else if (spec.supastar) {
    s.maps.A = defaultMap("One Color", ["#bc75ff"]);
    s.maps.B = defaultMap("One Color", ["#ff5f9f"]);
    s.maps.C = defaultMap("One Color", ["#536dff"]);
    Object.assign(s.colors, { upRight: "B", downLeft: "B", downRight: "C", upLeft: "C" });
  } else if (spec.grassy) {
    s.maps.A = defaultMap("One Color", ["#31ffc5"]);
    s.maps.B = defaultMap("One Color", ["#25a832"]);
    s.maps.C = defaultMap("One Color", ["#55d97c"]);
    Object.assign(s.colors, { up: "A", upRight: "A", right: "A", down: "B", downLeft: "B", left: "B", downRight: "C", upLeft: "C" });
    s.lengths.downRight = 0.75;
    s.lengths.upLeft = 0.75;
  } else if (spec.scope) {
    s.maps.A = defaultMap("3-Color Gradient", ["#ffffff", "#00d5ff", "#001f80"]);
  }

  return s;
}

const presets = Object.fromEntries(Object.values(presetGroups).flat().map(([name, spec]) => [name, makePreset(spec)]));

function init() {
  buildPresetSelect();
  buildControls();
  applyPreset("Xmas Star");
  bindFileUi();
  new ResizeObserver(updateCanvasDisplaySize).observe(previewPane);
}

function buildPresetSelect() {
  presetSelect.innerHTML = "";
  for (const [group, entries] of Object.entries(presetGroups)) {
    const optgroup = document.createElement("optgroup");
    optgroup.label = group;
    for (const [name] of entries) {
      const option = document.createElement("option");
      option.value = name;
      option.textContent = name;
      optgroup.append(option);
    }
    presetSelect.append(optgroup);
  }
  presetSelect.addEventListener("change", () => applyPreset(presetSelect.value));
}

function buildControls() {
  controlsRoot.innerHTML = "";
  addSelect(null, "Input Channel", "inputChannel", ["Lightness", "Luminance", "Red", "Green", "Blue", "Alpha"]);
  addGroup("Pre-Process", [
    slider("Threshold", "threshold", 0, 1000, 0.1),
    slider("Threshold Soft", "thresholdSoft", 0, 100, 0.1),
    checkbox("Use Mask", "useMask"),
    slider("Mask Radius", "maskRadius", -100, 100, 0.1),
    slider("Mask Feather", "maskFeather", 0, 100, 0.1),
    slider("Mask Position X", "maskX", -50, 50, 0.1),
    slider("Mask Position Y", "maskY", -50, 50, 0.1),
  ]);
  addStandaloneSlider("Streak Length", "streakLength", 0, 100, 0.1);
  addStandaloneSlider("Boost Light", "boostLight", 0, 100, 0.1);
  addGroup("Individual Lengths", dirs.map(([key, label]) => slider(label, `lengths.${key}`, 0, 10, 0.01)));
  addGroup("Individual Colors", dirs.map(([key, label]) => select(label, `colors.${key}`, ["A", "B", "C"], (v) => `Colormap ${v}`)));
  ["A", "B", "C"].forEach((name) => addColormapGroup(name));
  addGroup("Shimmer", [
    slider("Amount", "shimmerAmount", 0, 100, 0.1),
    slider("Detail", "shimmerDetail", 0, 100, 0.1),
    slider("Phase Revolutions", "phaseTurns", 0, 36, 1),
    slider("Phase Degrees", "phaseDegrees", 0, 360, 0.1),
    checkbox("Use Loop", "useLoop"),
    slider("Revolutions in Loop", "revolutionsInLoop", 1, 36, 1),
  ]);
  addStandaloneSlider("Source Opacity", "sourceOpacity", 0, 100, 0.1);
  addStandaloneSlider("Starglow Opacity", "starglowOpacity", 0, 100, 0.1);
  addSelect(null, "Transfer Mode", "transferMode", Object.keys(blendModes));
}

function addGroup(title, rows) {
  const details = document.createElement("details");
  const summary = document.createElement("summary");
  const body = document.createElement("div");
  summary.textContent = title;
  body.className = "group-body";
  rows.forEach((row) => body.append(row));
  details.append(summary, body);
  controlsRoot.append(details);
}

function addColormapGroup(name) {
  const rows = [
    selectGrouped("Preset", `maps.${name}.preset`, colormapPresetGroups),
    color("Highlights", `maps.${name}.highlights`),
    color("Mid High", `maps.${name}.midHigh`),
    color("Midtones", `maps.${name}.midtones`),
    color("Mid Low", `maps.${name}.midLow`),
    color("Shadows", `maps.${name}.shadows`),
    note(`Disabled when no direction uses Colormap ${name}.`),
  ];
  addGroup(`Colormap ${name}`, rows);
}

function addStandaloneSlider(label, path, min, max, step) {
  const row = slider(label, path, min, max, step);
  row.classList.add("top-control-row");
  controlsRoot.append(row);
}

function addSelect(parent, label, path, options) {
  const row = select(label, path, options);
  (parent || controlsRoot).append(row);
}

function slider(label, path, min, max, step) {
  const row = document.createElement("label");
  const text = document.createElement("span");
  const range = document.createElement("input");
  const number = document.createElement("input");
  row.className = "slider-row";
  text.textContent = label;
  range.type = "range";
  range.min = min;
  range.max = max;
  range.step = step;
  number.className = "number-input";
  number.type = "text";
  range.addEventListener("input", (event) => {
    if (path === "streakLength") {
      setMasterStreakLength(Number(range.value), event.ctrlKey);
    } else {
      setValue(path, Number(range.value), true);
    }
  });
  number.addEventListener("keydown", (event) => {
    if (path === "streakLength" && event.key === "Enter") {
      setMasterStreakLength(Number(number.value), event.ctrlKey);
    }
  });
  number.addEventListener("change", () => {
    if (path === "streakLength") {
      setMasterStreakLength(Number(number.value), false);
    } else {
      setValue(path, Number(number.value), true);
    }
  });
  row.append(text, range, number);
  controls.set(path, { range, number, min, max });
  return row;
}

function select(label, path, options, display = (value) => value) {
  const row = document.createElement("label");
  const text = document.createElement("span");
  const input = document.createElement("select");
  row.className = "field-row";
  text.textContent = label;
  for (const optionValue of options) {
    const option = document.createElement("option");
    option.value = optionValue;
    option.textContent = display(optionValue);
    input.append(option);
  }
  input.addEventListener("change", () => {
    setValue(path, input.value, true);
    if (path.endsWith(".preset")) {
      applyColormapPreset(path);
      updateControls();
      queueRender();
    }
  });
  row.append(text, input);
  controls.set(path, { input });
  return row;
}

function selectGrouped(label, path, groups) {
  const row = document.createElement("label");
  const text = document.createElement("span");
  const input = document.createElement("select");
  row.className = "field-row";
  text.textContent = label;
  for (const [groupName, options] of Object.entries(groups)) {
    const optgroup = document.createElement("optgroup");
    optgroup.label = groupName;
    for (const optionValue of options) {
      const option = document.createElement("option");
      option.value = optionValue;
      option.textContent = optionValue;
      optgroup.append(option);
    }
    input.append(optgroup);
  }
  input.addEventListener("change", () => {
    setValue(path, input.value, true);
    applyColormapPreset(path);
    updateControls();
    queueRender();
  });
  row.append(text, input);
  controls.set(path, { input });
  return row;
}

function checkbox(label, path) {
  const row = document.createElement("label");
  const text = document.createElement("span");
  const cell = document.createElement("span");
  const input = document.createElement("input");
  row.className = "check-row";
  cell.className = "check-cell";
  text.textContent = label;
  input.type = "checkbox";
  input.addEventListener("change", () => setValue(path, input.checked, true));
  cell.append(input);
  row.append(text, cell);
  controls.set(path, { input });
  return row;
}

function color(label, path) {
  const row = document.createElement("label");
  const text = document.createElement("span");
  const input = document.createElement("input");
  row.className = "color-row";
  text.textContent = label;
  input.type = "color";
  input.addEventListener("input", () => setValue(path, input.value, true));
  row.append(text, input);
  controls.set(path, { input });
  return row;
}

function note(text) {
  const row = document.createElement("div");
  row.className = "disabled-note";
  row.textContent = text;
  return row;
}

function getValue(path) {
  return path.split(".").reduce((target, key) => target[key], state);
}

function setValue(path, value, dirty = false) {
  if (Number.isNaN(value)) value = 0;
  const parts = path.split(".");
  let target = state;
  while (parts.length > 1) target = target[parts.shift()];
  target[parts[0]] = value;
  if (dirty && !suppressDirty) markDirty();
  updateControls();
  queueRender();
}

function setMasterStreakLength(value, relative) {
  if (Number.isNaN(value)) value = 0;
  const previous = state.streakLength;
  state.streakLength = value;
  if (relative) {
    const ratio = previous === 0 ? 1 : value / previous;
    for (const [key] of dirs) state.lengths[key] *= ratio;
  } else {
    const delta = (value - previous) / 20;
    for (const [key] of dirs) state.lengths[key] += delta;
  }
  if (!suppressDirty) markDirty();
  updateControls();
  queueRender();
}

function applyColormapPreset(path) {
  const presetName = getValue(path);
  const colors = gradientPresets[presetName];
  if (!colors) return;
  const mapPath = path.split(".").slice(0, 2).join(".");
  const map = getValue(mapPath);
  map.highlights = colors[0];
  map.midHigh = colors[1] || colors[0];
  map.midtones = colors[2] || colors[1] || colors[0];
  map.midLow = colors[3] || colors[2] || colors[1] || colors[0];
  map.shadows = colors[4] || colors[3] || colors[2] || colors[0];
}

function markDirty() {
  state.dirty = true;
  presetSelect.value = state.preset;
  const selected = presetSelect.selectedOptions[0];
  if (selected && !selected.textContent.endsWith(" (modified)")) selected.textContent += " (modified)";
}

function applyPreset(name) {
  suppressDirty = true;
  state = structuredClone(presets[name]);
  state.preset = name;
  state.dirty = false;
  for (const option of presetSelect.options) option.textContent = option.value;
  presetSelect.value = name;
  updateControls();
  suppressDirty = false;
  queueRender();
}

function updateControls() {
  for (const [path, control] of controls) {
    const value = getValue(path);
    if (control.range) {
      control.range.value = Math.max(Number(control.min), Math.min(Number(control.max), Number(value)));
      control.number.value = formatNumber(value);
    } else if (control.input?.type === "checkbox") {
      control.input.checked = Boolean(value);
    } else if (control.input) {
      control.input.value = value;
    }
  }
  updateColormapDisabled();
}

function updateColormapDisabled() {
  const used = new Set(Object.values(state.colors));
  for (const name of ["A", "B", "C"]) {
    const groupDisabled = !used.has(name);
    const map = state.maps[name];
    const stopCount = map.preset === "One Color" ? 1 : (gradientPresets[map.preset]?.length || (map.preset === "5-Color Gradient" ? 5 : 3));
    const disabledByStop = {
      highlights: false,
      midHigh: stopCount < 5,
      midtones: stopCount < 3,
      midLow: stopCount < 5,
      shadows: stopCount < 3,
    };

    for (const path of [`maps.${name}.preset`, `maps.${name}.highlights`, `maps.${name}.midHigh`, `maps.${name}.midtones`, `maps.${name}.midLow`, `maps.${name}.shadows`]) {
      const control = controls.get(path);
      const field = path.split(".")[2];
      if (control?.input) control.input.disabled = groupDisabled || Boolean(disabledByStop[field]);
    }
  }
}

function formatNumber(value) {
  return Number.isInteger(value) ? String(value) : String(Number(value).toFixed(2)).replace(/\.?0+$/, "");
}

function bindFileUi() {
  fileInput.addEventListener("change", () => loadFile(fileInput.files[0]));
  saveButton.addEventListener("click", savePng);
  previewPane.addEventListener("dragover", (event) => {
    event.preventDefault();
    previewPane.classList.add("is-dragging");
  });
  previewPane.addEventListener("dragleave", () => previewPane.classList.remove("is-dragging"));
  previewPane.addEventListener("drop", (event) => {
    event.preventDefault();
    previewPane.classList.remove("is-dragging");
    loadFile(event.dataTransfer.files[0]);
  });
}

async function loadFile(file) {
  if (!file || !file.type.startsWith("image/")) return;
  sourceBitmap = await createImageBitmap(file);
  const maxSide = 2200;
  const scale = Math.min(1, maxSide / Math.max(sourceBitmap.width, sourceBitmap.height));
  sourceSize = {
    width: Math.max(1, Math.round(sourceBitmap.width * scale)),
    height: Math.max(1, Math.round(sourceBitmap.height * scale)),
  };
  resizeCanvases(sourceSize.width, sourceSize.height);
  emptyState.classList.add("is-hidden");
  updateCanvasDisplaySize();
  render();
}

function resizeCanvases(width, height) {
  for (const canvas of [previewCanvas, ...Object.values(work)]) {
    canvas.width = width;
    canvas.height = height;
  }
}

function updateCanvasDisplaySize() {
  if (!sourceSize) return;
  const scale = Math.min(
    1,
    Math.max(0.01, (previewPane.clientWidth - 24) / sourceSize.width),
    Math.max(0.01, (previewPane.clientHeight - 24) / sourceSize.height),
  );
  previewCanvas.style.setProperty("--canvas-display-width", `${Math.round(sourceSize.width * scale)}px`);
  previewCanvas.style.setProperty("--canvas-display-height", `${Math.round(sourceSize.height * scale)}px`);
  viewport.style.minWidth = `${Math.max(previewPane.clientWidth - 24, Math.round(sourceSize.width * scale))}px`;
  viewport.style.minHeight = `${Math.max(previewPane.clientHeight - 24, Math.round(sourceSize.height * scale))}px`;
}

function savePng() {
  if (!sourceBitmap) return;
  const link = document.createElement("a");
  link.download = "starglow_modoki.png";
  link.href = previewCanvas.toDataURL("image/png");
  link.click();
}

function queueRender() {
  if (renderQueued) return;
  renderQueued = true;
  requestAnimationFrame(() => {
    renderQueued = false;
    render();
  });
}

function render() {
  if (!sourceBitmap || !sourceSize) return;
  drawSource();
  extractMask();
  drawGlow();
  drawStreaks();
  compose();
}

function drawSource() {
  const sourceCtx = work.source.getContext("2d", { willReadFrequently: true });
  sourceCtx.clearRect(0, 0, work.source.width, work.source.height);
  sourceCtx.drawImage(sourceBitmap, 0, 0, work.source.width, work.source.height);
}

function extractMask() {
  const sourceCtx = work.source.getContext("2d", { willReadFrequently: true });
  const maskCtx = work.mask.getContext("2d", { willReadFrequently: true });
  const image = sourceCtx.getImageData(0, 0, work.source.width, work.source.height);
  const data = image.data;
  const threshold = (state.threshold / 1000) * 255;
  const soft = Math.max(0.0001, (state.thresholdSoft / 100) * 255);

  for (let i = 0; i < data.length; i += 4) {
    const pixel = i / 4;
    const x = pixel % image.width;
    const y = Math.floor(pixel / image.width);
    const channel = inputValue(data[i], data[i + 1], data[i + 2], data[i + 3]);
    const hot = smoothstep(threshold - soft, threshold + soft, channel);
    const shimmer = shimmerAt(x, y);
    const mask = maskAt(x, y, image.width, image.height);
    const boost = 1 + (state.boostLight / 100) * 5.5;
    const alpha = Math.min(1, hot * boost * shimmer * mask);
    data[i] = 255;
    data[i + 1] = 255;
    data[i + 2] = 255;
    data[i + 3] = Math.round(255 * alpha);
  }

  maskCtx.putImageData(image, 0, 0);
}

function inputValue(r, g, b, a) {
  if (state.inputChannel === "Red") return r;
  if (state.inputChannel === "Green") return g;
  if (state.inputChannel === "Blue") return b;
  if (state.inputChannel === "Alpha") return a;
  if (state.inputChannel === "Luminance") return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return (Math.max(r, g, b) + Math.min(r, g, b)) / 2;
}

function smoothstep(edge0, edge1, value) {
  const t = Math.max(0, Math.min(1, (value - edge0) / (edge1 - edge0 || 1)));
  return t * t * (3 - 2 * t);
}

function clamp01(value) {
  return Math.max(0, Math.min(1, value));
}

function shimmerAt(x, y) {
  if (state.shimmerAmount <= 0) return 1;
  const detail = Math.max(0.01, state.shimmerDetail);
  const phase = ((state.phaseTurns * 360 + state.phaseDegrees) * Math.PI) / 180;
  const loopPhase = state.useLoop ? phase * state.revolutionsInLoop : phase;
  const scale = 0.004 + detail * 0.0028;
  const n1 = Math.sin(x * scale + y * scale * 0.41 + loopPhase);
  const n2 = Math.sin(x * scale * 1.9 - y * scale * 1.1 + loopPhase * 1.73);
  const n3 = Math.sin((x + y) * scale * 0.37 - loopPhase * 0.91);
  const noise = (n1 + n2 * 0.65 + n3 * 0.4) / 2.05;
  return Math.max(0, 1 + noise * (state.shimmerAmount / 100));
}

function maskAt(x, y, width, height) {
  if (!state.useMask) return 1;
  const minSide = Math.min(width, height);
  const cx = width / 2 + (state.maskX / 100) * width;
  const cy = height / 2 + (state.maskY / 100) * height;
  const radius = Math.abs(state.maskRadius) / 100 * minSide * 0.5;
  const feather = Math.max(0.0001, (state.maskFeather / 100) * minSide * 0.5);
  const distance = Math.hypot(x - cx, y - cy);
  const inside = 1 - smoothstep(radius, radius + feather, distance);
  return state.maskRadius < 0 ? 1 - inside : inside;
}

function getMapColor(mapName, t) {
  const map = state.maps[mapName] || state.maps.A;
  let stops;
  if (map.preset === "One Color") {
    stops = [map.highlights, map.highlights];
  } else if (map.preset === "3-Color Gradient" || gradientPresets[map.preset]?.length === 3) {
    stops = [map.shadows, map.midtones, map.highlights];
  } else {
    stops = [map.shadows, map.midLow, map.midtones, map.midHigh, map.highlights];
  }
  const p = Math.max(0, Math.min(1, t)) * (stops.length - 1);
  const i = Math.min(stops.length - 2, Math.floor(p));
  return mix(hexToRgb(stops[i]), hexToRgb(stops[i + 1]), p - i);
}

function hexToRgb(hex) {
  const value = hex.replace("#", "");
  return {
    r: parseInt(value.slice(0, 2), 16),
    g: parseInt(value.slice(2, 4), 16),
    b: parseInt(value.slice(4, 6), 16),
  };
}

function mix(a, b, t) {
  return {
    r: a.r * (1 - t) + b.r * t,
    g: a.g * (1 - t) + b.g * t,
    b: a.b * (1 - t) + b.b * t,
  };
}

function tintMask(color, alpha = 1) {
  const tintCtx = work.tint.getContext("2d");
  tintCtx.clearRect(0, 0, work.tint.width, work.tint.height);
  tintCtx.drawImage(work.mask, 0, 0);
  tintCtx.globalCompositeOperation = "source-in";
  tintCtx.globalAlpha = alpha;
  tintCtx.fillStyle = `rgb(${color.r}, ${color.g}, ${color.b})`;
  tintCtx.fillRect(0, 0, work.tint.width, work.tint.height);
  tintCtx.globalAlpha = 1;
  tintCtx.globalCompositeOperation = "source-over";
}

function drawGlow() {
  const glowCtx = work.glow.getContext("2d");
  glowCtx.clearRect(0, 0, work.glow.width, work.glow.height);
  glowCtx.globalCompositeOperation = "lighter";
  tintMask(averageActiveColor(), 1);
  const minSide = Math.min(work.glow.width, work.glow.height);
  for (const radius of [0.008, 0.022, 0.055]) {
    glowCtx.globalAlpha = 0.23;
    glowCtx.filter = `blur(${Math.max(1, minSide * radius)}px)`;
    glowCtx.drawImage(work.tint, 0, 0);
  }
  glowCtx.filter = "none";
  glowCtx.globalAlpha = 1;
  glowCtx.globalCompositeOperation = "source-over";
}

function averageActiveColor() {
  const active = dirs.filter(([key]) => state.lengths[key] > 0);
  const list = active.length ? active : dirs;
  return list.reduce((sum, [key]) => {
    const c = getMapColor(state.colors[key], 1);
    sum.r += c.r / list.length;
    sum.g += c.g / list.length;
    sum.b += c.b / list.length;
    return sum;
  }, { r: 0, g: 0, b: 0 });
}

function drawStreaks() {
  const streakCtx = work.streaks.getContext("2d");
  const tempCtx = work.temp.getContext("2d");
  const minSide = Math.min(work.streaks.width, work.streaks.height);
  streakCtx.clearRect(0, 0, work.streaks.width, work.streaks.height);
  streakCtx.globalCompositeOperation = "lighter";

  for (const [key, , deg] of dirs) {
    const individual = Number(state.lengths[key]);
    if (individual <= 0) continue;
    const fullLength = minSide * 0.105 * individual;
    const half = Math.max(1, fullLength / 2);
    const step = Math.max(1.5, fullLength / 34);
    const angle = (deg * Math.PI) / 180;
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);

    for (let offset = -half; offset <= half; offset += step) {
      if (Math.abs(offset) < 0.001) continue;
      const distance = Math.abs(offset) / half;
      const falloff = Math.pow(1 - distance, 2.15);
      const color = getMapColor(state.colors[key], 1 - distance);
      tintMask(color, 1);
      tempCtx.clearRect(0, 0, work.temp.width, work.temp.height);
      tempCtx.globalAlpha = falloff * 0.12;
      tempCtx.filter = `blur(${Math.max(0.35, distance * 2.2)}px)`;
      tempCtx.drawImage(work.tint, dx * offset, dy * offset);
      streakCtx.drawImage(work.temp, 0, 0);
    }
  }

  tempCtx.filter = "none";
  tempCtx.globalAlpha = 1;
  streakCtx.globalCompositeOperation = "source-over";
}

function compose() {
  ctx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
  ctx.globalAlpha = clamp01(state.sourceOpacity / 100);
  ctx.drawImage(work.source, 0, 0);
  if (state.transferMode !== "None") {
    ctx.globalCompositeOperation = blendModes[state.transferMode] || "source-over";
    ctx.globalAlpha = clamp01(state.starglowOpacity / 100);
    ctx.drawImage(work.glow, 0, 0);
    ctx.drawImage(work.streaks, 0, 0);
    tintMask(averageActiveColor(), 1);
    ctx.globalAlpha = clamp01((state.starglowOpacity / 100) * 0.28);
    ctx.drawImage(work.tint, 0, 0);
  }
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";
}

init();

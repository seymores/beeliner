"use strict";

const fields = ["enabled", "autoTheme", "start", "middle", "end", "intensity"];
const controls = document.getElementById("controls");
const intensityValue = document.getElementById("intensity-value");
const preview = document.querySelector(".preview");
let saveTimer;

function values() {
  return {
    enabled: document.getElementById("enabled").checked,
    autoTheme: document.getElementById("autoTheme").checked,
    start: document.getElementById("start").value,
    middle: document.getElementById("middle").value,
    end: document.getElementById("end").value,
    intensity: Number(document.getElementById("intensity").value),
  };
}

function save(immediate = false) {
  clearTimeout(saveTimer);
  if (immediate) chrome.storage.sync.set(values());
  else saveTimer = setTimeout(() => chrome.storage.sync.set(values()), 80);
}

function render(settings) {
  for (const field of fields) {
    const input = document.getElementById(field);
    if (field === "enabled" || field === "autoTheme") input.checked = settings[field];
    else input.value = settings[field];
  }
  controls.disabled = !settings.enabled;
  for (const field of ["start", "middle", "end"]) document.getElementById(field).disabled = settings.autoTheme;
  intensityValue.value = `${settings.intensity}%`;
  preview.textContent = settings.autoTheme ? "Colours matched to this page’s theme." : "Follow the colours. Find the next line.";
  preview.style.backgroundImage = settings.autoTheme ? "none" : `linear-gradient(100deg, ${settings.start}, ${settings.middle}, ${settings.end})`;
  preview.style.backgroundClip = "text";
  preview.style.webkitBackgroundClip = "text";
  preview.style.color = settings.autoTheme ? "#64748b" : "transparent";
}

chrome.storage.sync.get(Beeline.DEFAULTS, (settings) => render(Beeline.normalizeSettings(settings)));

for (const field of fields) {
  const input = document.getElementById(field);
  input.addEventListener("input", () => {
    const current = values();
    render(current);
    save(field === "enabled" || field === "autoTheme");
  });
  input.addEventListener("change", () => save(true));
}

document.getElementById("reset").addEventListener("click", () => {
  render(Beeline.DEFAULTS);
  save(true);
});

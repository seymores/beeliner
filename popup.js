"use strict";

const fields = ["enabled", "start", "middle", "end", "intensity"];
const controls = document.getElementById("controls");
const intensityValue = document.getElementById("intensity-value");
const preview = document.querySelector(".preview");
let saveTimer;

function values() {
  return {
    enabled: document.getElementById("enabled").checked,
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
    if (field === "enabled") input.checked = settings.enabled;
    else input.value = settings[field];
  }
  controls.disabled = !settings.enabled;
  intensityValue.value = `${settings.intensity}%`;
  preview.style.backgroundImage = `linear-gradient(100deg, ${settings.start}, ${settings.middle}, ${settings.end})`;
  preview.style.backgroundClip = "text";
  preview.style.webkitBackgroundClip = "text";
  preview.style.color = "transparent";
}

chrome.storage.sync.get(Beeline.DEFAULTS, (settings) => render(Beeline.normalizeSettings(settings)));

for (const field of fields) {
  const input = document.getElementById(field);
  input.addEventListener("input", () => {
    const current = values();
    render(current);
    save(field === "enabled");
  });
  input.addEventListener("change", () => save(true));
}

document.getElementById("reset").addEventListener("click", () => {
  render(Beeline.DEFAULTS);
  save(true);
});

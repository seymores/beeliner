"use strict";

const assert = require("node:assert/strict");
const { DEFAULTS, parseColor, themeColors, gradientColor, normalizeSettings } = require("./beeline.js");

assert.deepEqual(parseColor("#2563eb"), [37, 99, 235]);
assert.equal(parseColor("not-a-colour"), null);
assert.equal(gradientColor(["#000000", "#777777", "#ffffff"], 0), "rgb(0, 0, 0)");
assert.equal(gradientColor(["#000000", "#777777", "#ffffff"], 0.5), "rgb(119, 119, 119)");
assert.equal(gradientColor(["#000000", "#777777", "#ffffff"], 1), "rgb(255, 255, 255)");
assert.equal(gradientColor(["#ff0000", "#00ff00", "#0000ff"], 0, "#000000", 50), "rgb(128, 0, 0)");
assert.equal(gradientColor(["#ff0000", "#00ff00", "#0000ff"], 1, "#ffffff", 0), "rgb(255, 255, 255)");

function contrast(a, b) {
  const luminance = (hex) => parseColor(hex).map((channel) => {
    const value = channel / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  }).reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index], 0);
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
}

for (const [accent, background] of [["#2563eb", "#ffffff"], ["#c4b5fd", "#17131f"], ["#333330", "#f7f5ee"]]) {
  const palette = themeColors(accent, background);
  assert.equal(new Set(palette).size, 3);
  for (const color of palette) assert.ok(contrast(color, background) >= 4.5, `${color} on ${background}`);
}
for (const color of themeColors("#222222", "#ffffff")) {
  const [r, g, b] = parseColor(color);
  assert.ok(r === g && g === b, "Monochrome pages must stay neutral");
}
assert.equal(normalizeSettings({ autoTheme: false }).autoTheme, false);
assert.equal(normalizeSettings({ autoTheme: "yes" }).autoTheme, DEFAULTS.autoTheme);
assert.deepEqual(normalizeSettings({ enabled: false, intensity: 150 }), {
  ...DEFAULTS,
  enabled: false,
  intensity: 100,
});
assert.equal(normalizeSettings({ start: "invalid" }).start, DEFAULTS.start);
console.log("Beeline colour and settings tests passed.");

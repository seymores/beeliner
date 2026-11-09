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

function distance(a, b) {
  return Math.round(Math.hypot(...parseColor(a).map((channel, index) => channel - parseColor(b)[index])));
}

const themes = [
  ["sample article", "rgb(42, 69, 200)", "rgb(247, 245, 239)", "rgb(23, 22, 15)"],
  ["blue on white", "#2563eb", "#ffffff", "#222222"],
  ["dark", "#c4b5fd", "#17131f", "#e9e4f0"],
  ["warm", "#333330", "#f7f5ee", "#17160f"],
  ["monochrome", "#222222", "#ffffff", "#222222"],
];
for (const [name, accent, background, base] of themes) {
  const palette = themeColors(accent, background);
  assert.equal(new Set(palette).size, 3, `${name} needs three distinct stops`);
  for (const color of palette) assert.ok(contrast(color, background) >= 4.5, `${name}: ${color} on ${background}`);
  for (const [intensity, adjacent, full] of [[56, 25, 40], [70, 30, 45]]) {
    const shown = [0, 0.5, 1].map((position) => gradientColor(palette, position, base, intensity));
    const gaps = [distance(shown[0], shown[1]), distance(shown[1], shown[2])];
    assert.ok(Math.max(...gaps) >= adjacent, `${name} is too flat at ${intensity}%: ${gaps.join(", ")}`);
    assert.ok(distance(shown[0], shown[2]) >= full, `${name} lacks line-direction contrast at ${intensity}%`);
  }
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

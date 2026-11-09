"use strict";

const assert = require("node:assert/strict");
const { DEFAULTS, parseColor, gradientColor, normalizeSettings } = require("./beeline.js");

assert.deepEqual(parseColor("#2563eb"), [37, 99, 235]);
assert.equal(parseColor("not-a-colour"), null);
assert.equal(gradientColor(["#000000", "#777777", "#ffffff"], 0), "rgb(0, 0, 0)");
assert.equal(gradientColor(["#000000", "#777777", "#ffffff"], 0.5), "rgb(119, 119, 119)");
assert.equal(gradientColor(["#000000", "#777777", "#ffffff"], 1), "rgb(255, 255, 255)");
assert.equal(gradientColor(["#ff0000", "#00ff00", "#0000ff"], 0, "#000000", 50), "rgb(128, 0, 0)");
assert.equal(gradientColor(["#ff0000", "#00ff00", "#0000ff"], 1, "#ffffff", 0), "rgb(255, 255, 255)");
assert.deepEqual(normalizeSettings({ enabled: false, intensity: 150 }), {
  ...DEFAULTS,
  enabled: false,
  intensity: 100,
});
assert.equal(normalizeSettings({ start: "invalid" }).start, DEFAULTS.start);
console.log("Beeline colour and settings tests passed.");

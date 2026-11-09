(function (root, factory) {
  const api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.Beeline = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const DEFAULTS = Object.freeze({
    enabled: true,
    start: "#2563eb",
    middle: "#7c3aed",
    end: "#dc2626",
    intensity: 70,
  });

  function parseColor(value) {
    if (typeof value !== "string") return null;
    const hex = value.match(/^#([\da-f]{6})$/i);
    if (hex) {
      return [0, 2, 4].map((offset) => parseInt(hex[1].slice(offset, offset + 2), 16));
    }
    const rgb = value.match(/^rgba?\(\s*(\d+(?:\.\d+)?)[,\s]+(\d+(?:\.\d+)?)[,\s]+(\d+(?:\.\d+)?)/i);
    return rgb ? rgb.slice(1, 4).map(Number) : null;
  }

  function mix(a, b, amount) {
    return a.map((channel, index) => Math.round(channel + (b[index] - channel) * amount));
  }

  function gradientColor(colors, position, baseColor = "#000000", intensity = 100) {
    const points = colors.map(parseColor);
    const base = parseColor(baseColor);
    if (points.some((point) => !point) || !base) return baseColor;
    const t = Math.min(1, Math.max(0, position));
    const scaled = t * 2;
    const index = Math.min(1, Math.floor(scaled));
    const color = mix(points[index], points[index + 1], scaled - index);
    const adjusted = mix(base, color, Math.min(100, Math.max(0, intensity)) / 100);
    return `rgb(${adjusted.join(", ")})`;
  }

  function normalizeSettings(settings = {}) {
    return {
      enabled: typeof settings.enabled === "boolean" ? settings.enabled : DEFAULTS.enabled,
      start: parseColor(settings.start) ? settings.start : DEFAULTS.start,
      middle: parseColor(settings.middle) ? settings.middle : DEFAULTS.middle,
      end: parseColor(settings.end) ? settings.end : DEFAULTS.end,
      intensity: Number.isFinite(settings.intensity)
        ? Math.min(100, Math.max(0, settings.intensity))
        : DEFAULTS.intensity,
    };
  }

  return { DEFAULTS, parseColor, gradientColor, normalizeSettings };
});

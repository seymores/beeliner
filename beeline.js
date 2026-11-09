(function (root, factory) {
  const api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.Beeline = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const DEFAULTS = Object.freeze({
    enabled: true,
    autoTheme: true,
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

  function rgbToHsl(rgb) {
    const [r, g, b] = rgb.map((channel) => channel / 255);
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;
    const lightness = (max + min) / 2;
    if (!delta) return [0, 0, lightness];
    let hue = ((r === max ? (g - b) / delta : g === max ? (b - r) / delta + 2 : (r - g) / delta + 4) * 60) % 360;
    if (hue < 0) hue += 360;
    return [hue, delta / (1 - Math.abs(2 * lightness - 1)), lightness];
  }

  function hslToRgb(hue, saturation, lightness) {
    const h = ((hue % 360) + 360) % 360;
    const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
    const x = chroma * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = lightness - chroma / 2;
    const [r, g, b] = h < 60 ? [chroma, x, 0] : h < 120 ? [x, chroma, 0] : h < 180 ? [0, chroma, x] : h < 240 ? [0, x, chroma] : h < 300 ? [x, 0, chroma] : [chroma, 0, x];
    return [r, g, b].map((channel) => Math.round((channel + m) * 255));
  }

  function luminance(rgb) {
    return rgb.map((channel) => {
      const value = channel / 255;
      return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
    }).reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index], 0);
  }

  function contrast(a, b) {
    const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
    return (light + 0.05) / (dark + 0.05);
  }

  function toHex(rgb) {
    return `#${rgb.map((channel) => channel.toString(16).padStart(2, "0")).join("")}`;
  }

  function themeColors(themeColor, backgroundColor) {
    const theme = parseColor(themeColor) || [0, 0, 0];
    const background = parseColor(backgroundColor) || [255, 255, 255];
    const [themeHue, themeSaturation] = rgbToHsl(theme);
    const [backgroundHue, backgroundSaturation] = rgbToHsl(background);
    const useAccent = themeSaturation >= 0.18;
    const hue = useAccent ? themeHue : backgroundHue;
    const sourceSaturation = useAccent ? themeSaturation : backgroundSaturation;
    const saturation = sourceSaturation < 0.06 ? 0 : Math.min(0.62, Math.max(useAccent ? 0.32 : 0.24, sourceSaturation));
    const lightBackground = contrast(background, [0, 0, 0]) >= contrast(background, [255, 255, 255]);
    const lightnesses = lightBackground ? [0.3, 0.4, 0.3] : [0.74, 0.64, 0.74];

    return [-18, 0, 18].map((offset, index) => {
      let lightness = lightnesses[index];
      let color = hslToRgb(hue + offset, saturation, lightness);
      while (contrast(color, background) < 4.5 && lightness > 0 && lightness < 1) {
        lightness = Math.min(1, Math.max(0, lightness + (lightBackground ? -0.02 : 0.02)));
        color = hslToRgb(hue + offset, saturation, lightness);
      }
      return toHex(color);
    });
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
      autoTheme: typeof settings.autoTheme === "boolean" ? settings.autoTheme : DEFAULTS.autoTheme,
      start: parseColor(settings.start) ? settings.start : DEFAULTS.start,
      middle: parseColor(settings.middle) ? settings.middle : DEFAULTS.middle,
      end: parseColor(settings.end) ? settings.end : DEFAULTS.end,
      intensity: Number.isFinite(settings.intensity)
        ? Math.min(100, Math.max(0, settings.intensity))
        : DEFAULTS.intensity,
    };
  }

  return { DEFAULTS, parseColor, themeColors, gradientColor, normalizeSettings };
});

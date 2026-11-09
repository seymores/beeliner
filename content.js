(() => {
  "use strict";

  const ROOTS = "p, li, blockquote";
  const SKIP = "a, button, input, textarea, select, option, code, pre, kbd, samp, script, style, svg, [contenteditable]";
  let settings = { ...Beeline.DEFAULTS, enabled: false };
  let frame = 0;

  function wrap(root) {
    if (root.dataset.beelineRoot) return;
    root.dataset.beelineRoot = "true";
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (node.nodeValue.trim() && !node.parentElement.closest(SKIP)) nodes.push(node);
    }

    for (const node of nodes) {
      const fragment = document.createDocumentFragment();
      for (const part of node.nodeValue.split(/(\s+)/)) {
        if (!part) continue;
        if (/^\s+$/.test(part)) {
          fragment.append(document.createTextNode(part));
        } else {
          const word = document.createElement("span");
          word.className = "beeline-word";
          word.textContent = part;
          fragment.append(word);
        }
      }
      node.replaceWith(fragment);
    }
  }

  function paint(root) {
    const words = [...root.querySelectorAll(".beeline-word")];
    const lines = [];
    for (const word of words) {
      const top = word.getBoundingClientRect().top;
      const line = lines[lines.length - 1];
      if (!line || Math.abs(top - line.top) > 2) lines.push({ top, words: [word] });
      else line.words.push(word);
    }

    const baseColor = getComputedStyle(root).color;
    for (const [lineIndex, line] of lines.entries()) {
      const length = line.words.reduce((sum, word) => sum + word.textContent.length, 0);
      let offset = 0;
      for (const word of line.words) {
        const position = length ? (offset + word.textContent.length / 2) / length : 0;
        const directedPosition = lineIndex % 2 ? 1 - position : position;
        word.style.color = Beeline.gradientColor(
          [settings.start, settings.middle, settings.end],
          directedPosition,
          baseColor,
          settings.intensity
        );
        offset += word.textContent.length;
      }
    }
  }

  function enable() {
    const roots = [...document.querySelectorAll(ROOTS)].filter(
      (element) => !element.parentElement.closest(ROOTS)
    );
    for (const root of roots) {
      wrap(root);
      paint(root);
    }
  }

  function disable() {
    for (const root of document.querySelectorAll("[data-beeline-root]")) {
      for (const word of root.querySelectorAll(".beeline-word")) {
        word.replaceWith(document.createTextNode(word.textContent));
      }
      root.normalize();
      delete root.dataset.beelineRoot;
    }
  }

  function update(next) {
    const wasEnabled = settings.enabled;
    settings = Beeline.normalizeSettings(next);
    if (!settings.enabled) disable();
    else if (!wasEnabled) enable();
    else {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        for (const root of document.querySelectorAll("[data-beeline-root]")) paint(root);
      });
    }
  }

  chrome.storage.sync.get(Beeline.DEFAULTS, update);
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "sync") return;
    const next = { ...settings };
    for (const [key, change] of Object.entries(changes)) next[key] = change.newValue;
    update(next);
  });

  window.addEventListener("resize", () => {
    if (!settings.enabled) return;
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      for (const root of document.querySelectorAll("[data-beeline-root]")) paint(root);
    });
  });
})();

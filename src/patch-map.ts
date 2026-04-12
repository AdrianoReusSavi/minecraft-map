import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { config } from "./config.js";
import { log } from "./logger.js";

const CUSTOM_CSS = `
.realms-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  padding: 10px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: rgba(0, 0, 0, 0.8);
  border-bottom: 1px solid #333;
  z-index: 1000;
  pointer-events: none;
}
.realms-header-title {
  font-size: 14px;
  font-weight: 600;
  color: #e0e0e0;
  letter-spacing: 0.3px;
}
.realms-header-updated {
  font-size: 11px;
  color: #666;
}
.realms-footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 8px 20px;
  text-align: center;
  font-size: 12px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  border-top: 1px solid #333;
  background: rgba(0, 0, 0, 0.8);
  z-index: 1000;
  pointer-events: none;
}
.realms-footer a {
  color: #888;
  text-decoration: none;
  pointer-events: auto;
}
.realms-footer a:hover {
  color: #ccc;
}
.realms-footer span {
  color: #555;
  margin: 0 6px;
}
.ol-scale-bar, .ol-scale-line, .ol-mouse-position, .ol-zoom {
  display: none !important;
}`.trim();

const CUSTOM_JS = `
(function() {
  var el = document.querySelector('.realms-header-updated');
  if (el) {
    var d = new Date(el.getAttribute('data-updated'));
    el.textContent = 'Updated ' + d.toLocaleDateString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }

  document.body.style.background = '#000';
  document.getElementById('map').style.background = '#000';
  document.addEventListener('contextmenu', function(e) { e.preventDefault(); });

  var targets = '.ol-scale-bar, .ol-scale-line, .ol-mouse-position, .ol-zoom';
  var observer = new MutationObserver(function(_, obs) {
    var els = document.querySelectorAll(targets);
    if (els.length > 0) {
      els.forEach(function(el) { el.remove(); });
      obs.disconnect();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
})();`.trim();

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function patchMap(realmName: string): Promise<void> {
  const propsPath = join(config.outputPath, "unmined.map.properties.js");
  let props = await readFile(propsPath, "utf-8");
  props = props.replace(/showGrid:\s*true/, "showGrid: false");
  props = props.replace(/background:\s*""/, 'background: "#000000"');
  await writeFile(propsPath, props);

  const worldNameMatch = props.match(/worldName:\s*"([^"]*)"/);
  const worldName = escapeHtml(worldNameMatch?.[1] || "Unknown");
  const realm = escapeHtml(realmName || "Unknown");
  const updated = new Date().toISOString();

  const htmlPath = join(config.outputPath, "index.html");
  let html = await readFile(htmlPath, "utf-8");
  html = html.replace(/<title>[^<]*<\/title>/, `<title>Realms Map</title>`);
  const favicon = `<link rel="icon" href="favicon.png">`;
  html = html.replace("</head>", `${favicon}\n</head>`);
  html += [
    `<style>${CUSTOM_CSS}</style>`,
    `<div class="realms-header">`,
    `  <div class="realms-header-title">Realm: ${realm} - World: ${worldName}</div>`,
    `  <div class="realms-header-updated" data-updated="${updated}"></div>`,
    `</div>`,
    `<div class="realms-footer">`,
    `  <a href="https://github.com/AdrianoReusSavi/realms-map" target="_blank" rel="noopener">GitHub</a>`,
    `  <span>&middot;</span>`,
    `  <a href="https://github.com/AdrianoReusSavi/realms-map/blob/master/LICENSE" target="_blank" rel="noopener">Open Source</a>`,
    `</div>`,
    `<script>${CUSTOM_JS}</script>`,
  ].join("\n");
  await writeFile(htmlPath, html);

  log.info("Map patched.");
}
import { access, readFile, readdir } from "node:fs/promises";
import { dirname, extname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { createSurfaceMap } from "../src/surface-map.mjs";
import { checkEarthContours } from "./check-earth-contours.mjs";

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const requiredFiles = [
  "dist/health.json",
  "dist/index.html",
  "dist/app.js",
  "dist/editor.html",
  "dist/editor.js",
  "dist/wording.html",
  "dist/wording-editor.js",
  "dist/src/wording-editor.css",
  "dist/earth.html",
  "dist/earth-editor.js",
  "dist/object.html",
  "dist/objects.html",
  "dist/objects.js",
  "dist/src/object-bank.css",
  "dist/src/editor.css",
  "dist/src/earth-editor.css",
  "dist/src/styles.css",
  "dist/config/missions.json",
  "dist/config/missions.schema.json",
  "dist/config/mission-system.json",
  "dist/config/mission-v2.schema.json",
  "dist/config/missions/index.json",
  "dist/config/ui-shell.json",
  "dist/config/ui-shell.schema.json",
  "dist/config/wording.json",
  "dist/config/wording.schema.json",
  "dist/config/audio.json",
  "dist/config/audio.schema.json",
  "dist/cards/card.svg",
  "dist/icons/sputnik.svg",
  "dist/icons/endpoint-a.svg",
  "dist/icons/endpoint-b.svg",
  "dist/earth/Earth_Diffuse_4K.jpg",
  "dist/earth/Earth_Illumination_Core_4K.webp",
  "dist/earth/Earth_Specular_4K.webp",
  "dist/earth/Earth_Surface_4K.bin",
  "dist/earth/Earth_Surface_4K.json",
  "dist/earth/Earth_Normal_4K.webp",
  "dist/earth/Earth_Clouds_4K.webp",
  "dist/earth/Russia_Fill_Mask_6K.svg",
  "dist/earth/Russia_Border_Mask_6K.svg",
  "dist/fonts/Bureau-1440-Display-Medium.ttf",
  "server.mjs",
  "START-WINDOWS.bat",
  "START-EDITOR-WINDOWS.bat",
  "runtime/win-x64/node.exe",
];

await Promise.all(requiredFiles.map((file) => access(resolve(appRoot, file))));
await checkEarthContours(resolve(appRoot, "dist"));
const surfaceManifest = JSON.parse(await readFile(resolve(appRoot, "dist/earth/Earth_Surface_4K.json"), "utf8"));
const surfaceBytes = new Uint8Array(await readFile(resolve(appRoot, "dist/earth/Earth_Surface_4K.bin")));
createSurfaceMap(surfaceManifest, surfaceBytes);
if (createHash("sha256").update(surfaceBytes).digest("hex") !== surfaceManifest.sha256) throw new Error("Gameplay surface mask checksum mismatch");
await access(resolve(appRoot, "dist/screens")).then(
  () => { throw new Error("В production-сборке осталась папка PNG-заглушек dist/screens"); },
  () => undefined,
);
await access(resolve(appRoot, "dist/earth/Earth_Illumination_Glow_4K.webp")).then(
  () => { throw new Error("В production-сборке осталась запечённая glow-карта огней"); },
  () => undefined,
);

const audioManifest = JSON.parse(await readFile(resolve(appRoot, "dist/config/audio.json"), "utf8"));
if (audioManifest.assets?.length !== 21) throw new Error("Production audio manifest должен содержать 21 runtime-asset");
await Promise.all(audioManifest.assets.map((asset) => access(resolve(appRoot, "dist", asset.url.replace(/^\.\//, "")))));

const textExtensions = new Set([".bat", ".css", ".html", ".js", ".json", ".md", ".mjs", ".txt"]);
const roots = [resolve(appRoot, "dist"), resolve(appRoot, "server.mjs"), resolve(appRoot, "START-WINDOWS.bat"), resolve(appRoot, "START-EDITOR-WINDOWS.bat")];
const files = [];
for (const root of roots) await collect(root, files);

const forbidden = /(?:\b[A-Za-z]:[\\/](?!\/)|file:\/\/\/|X-SPUTNIK[\\/]workspace)/g;
const violations = [];
for (const file of files) {
  if (!textExtensions.has(extname(file).toLowerCase())) continue;
  const content = await readFile(file, "utf8");
  const matches = content.match(forbidden);
  if (matches) violations.push(`${file}: ${[...new Set(matches)].join(", ")}`);
}

if (violations.length) throw new Error(`Найдены локальные абсолютные пути:\n${violations.join("\n")}`);
console.log("Portable check passed: runtime-файлы автономны и не содержат локальных абсолютных путей.");

async function collect(path, output) {
  const entries = await readdir(path, { withFileTypes: true }).catch((error) => {
    if (error.code === "ENOTDIR") return null;
    throw error;
  });
  if (!entries) {
    output.push(path);
    return;
  }
  for (const entry of entries) await collect(resolve(path, entry.name), output);
}

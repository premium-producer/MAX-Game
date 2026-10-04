import { readFile, readdir, stat } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { validateAudioManifest } from "../src/audio/audio-manifest.mjs";

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const manifest = validateAudioManifest(JSON.parse(await readFile(resolve(appRoot, "public/config/audio.json"), "utf8")));
if (manifest.assets.length !== 21) throw new Error(`Ожидался 21 runtime audio asset, найдено ${manifest.assets.length}`);

const expectedFiles = new Set();
for (const asset of manifest.assets) {
  const relative = asset.url.replace(/^\.\//, "");
  const file = resolve(appRoot, "public", relative);
  const info = await stat(file);
  if (!info.isFile() || info.size < 44) throw new Error(`Audio asset пуст или отсутствует: ${relative}`);
  expectedFiles.add(relative.slice("audio/".length));
}

const actualFiles = new Set((await readdir(resolve(appRoot, "public/audio"))).filter((file) => /\.(?:wav|webm|ogg)$/i.test(file)));
const unmapped = [...actualFiles].filter((file) => !expectedFiles.has(file));
const missing = [...expectedFiles].filter((file) => !actualFiles.has(file));
if (unmapped.length || missing.length) throw new Error(`Audio manifest mismatch. Unmapped: ${unmapped.join(", ") || "—"}; missing: ${missing.join(", ") || "—"}`);

console.log(`Audio check passed: ${manifest.assets.length} assets, ${manifest.events.length} semantic events.`);

import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import { lintWording } from "../src/typography.mjs";
import { parseWording } from "../src/wording.mjs";

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const raw = JSON.parse(await readFile(resolve(appRoot, "public/config/wording.json"), "utf8"));
const diagnostics = lintWording(raw);

for (const issue of diagnostics.warnings) console.warn(`COPY WARNING [${issue.code}] ${issue.location}: ${issue.message}`);
if (diagnostics.errors.length) {
  for (const issue of diagnostics.errors) console.error(`COPY ERROR [${issue.code}] ${issue.location}: ${issue.message}`);
  process.exitCode = 1;
} else {
  const wording = parseWording(raw);
  await checkPlayerSources(wording);
  console.log(`Copy check passed: ${Object.keys(wording.entries).length} RU/EN entries, ${diagnostics.warnings.length} warning(s).`);
}

async function checkPlayerSources(wording) {
  const workingNames = /x[\s_-]*sputnik|x[\s_-]*спутник|\b(?:Embody|Envoy)\b/iu;
  for (const [key, translations] of Object.entries(wording.entries)) {
    for (const [language, copy] of Object.entries(translations)) {
      if (workingNames.test(copy)) throw new Error(`COPY ERROR [working-name] ${key}.${language}: служебное название в пользовательском тексте`);
    }
  }
  for (const source of ["index.html", "editor.html", "earth.html", "object.html", "wording.html"]) {
    const content = await readFile(resolve(appRoot, source), "utf8");
    if (workingNames.test(content)) throw new Error(`COPY ERROR [working-name] ${source}: служебное название в интерфейсе`);
  }
  const sources = ["src/main.js", "index.html"];
  for (const source of sources) {
    const content = await readFile(resolve(appRoot, source), "utf8");
    const withoutBootCopy = content
      .replace(/<([a-z0-9]+)\b[^>]*data-boot-copy="([^"]+)"[^>]*>([^<]*)<\/\1>/g, (_, tag, key, copy) => {
        if (copy !== wording.entries[key]?.ru) throw new Error(`COPY ERROR [boot-copy] ${key}: начальная надпись не совпадает с русским словарём`);
        return "";
      })
      .replace(/<progress data-boot-aria="([^"]+)" aria-label="([^"]+)">/g, (_, key, copy) => {
        if (copy !== wording.entries[key]?.ru) throw new Error(`COPY ERROR [boot-copy] ${key}: подпись прогресса не совпадает с русским словарём`);
        return "";
      });
    if (/[А-Яа-яЁё]/u.test(withoutBootCopy)) throw new Error(`COPY ERROR [embedded-player-copy] ${source}: найден русский player-facing текст вне wording.json`);
    for (const match of content.matchAll(/\bt\("([a-zA-Z0-9_.-]+)"/g)) {
      if (!wording.entries[match[1]]) throw new Error(`COPY ERROR [unknown-key] ${source}: отсутствует ключ ${match[1]}`);
    }
  }
}

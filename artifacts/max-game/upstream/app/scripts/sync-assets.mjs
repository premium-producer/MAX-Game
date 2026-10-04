import { access, cp, mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { basename, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { checkEarthContours } from "./check-earth-contours.mjs";

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const projectRoot = resolve(appRoot, "..");
const exportsRoot = resolve(projectRoot, "workspace/figma-plugin/web-handoff-exporter/exports");
const sessions = (await readdir(exportsRoot, { withFileTypes: true }).catch((error) => {
  if (error.code === "ENOENT") return [];
  throw error;
}))
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort()
  .reverse();

let source = null;
for (const session of sessions) {
  const candidate = resolve(exportsRoot, session);
  try {
    const manifest = JSON.parse(await readFile(resolve(candidate, "manifest.json"), "utf8"));
    if (manifest.format === "web-handoff" && manifest.formatVersion >= 2) {
      source = candidate;
      break;
    }
  } catch (_) {
    // Ignore incomplete sessions.
  }
}

const publicRoot = resolve(appRoot, "public");
// Keep the supplied English brand asset across handoff refreshes and portable rebuilds.
const englishLogo = await readFile(resolve(projectRoot, "workspace/brandbook/logo-eng.svg")).catch((error) => {
  if (error.code !== "ENOENT") throw error;
  return readFile(resolve(publicRoot, "assets/nodes/logo-eng.svg"));
});
// Preserve supplied QR assets when refreshing the generated handoff directory.
// A portable checkout can rebuild using its already bundled copies.
const qrFiles = await Promise.all(["tg.svg", "max.svg"].map(async (name) => {
  const data = await readFile(resolve(projectRoot, "workspace/UI/qr", name)).catch((error) => {
    if (error.code !== "ENOENT") throw error;
    return readFile(resolve(publicRoot, "assets/qr", name));
  });
  return { name, data };
}));

if (!source) {
  const bundledFiles = [
    "screens/cta.png",
    "cards/card.svg",
    "icons/sputnik.svg",
    "earth/Earth_Diffuse_4K.jpg",
    "earth/Earth_Illumination_4K.jpg",
    "earth/Earth_Illumination_Core_4K.webp",
    "earth/Earth_Specular_4K.webp",
    "earth/Earth_Surface_4K.bin",
    "earth/Earth_Surface_4K.json",
    "earth/Earth_Normal_4K.webp",
    "earth/Earth_Clouds_4K.webp",
    "earth/Russia_Fill_Mask_6K.svg",
    "earth/Russia_Border_Mask_6K.svg",
    "fonts/Bureau-1440-Display-Medium.ttf",
    "fonts/Bureau-1440-Text-Normal.ttf",
  ];
  try {
    await Promise.all(bundledFiles.map((file) => access(resolve(publicRoot, file))));
  } catch (_) {
    throw new Error("Нет внешнего WEB handoff и неполон локальный комплект app/public.");
  }
  console.log("Workspace не найден: используем переносимые ассеты из app/public.");
} else {
  await rm(resolve(publicRoot, "screens"), { recursive: true, force: true });
  await rm(resolve(publicRoot, "handoff"), { recursive: true, force: true });
  await rm(resolve(publicRoot, "assets"), { recursive: true, force: true });
  await rm(resolve(publicRoot, "cards"), { recursive: true, force: true });
  await rm(resolve(publicRoot, "icons"), { recursive: true, force: true });
  await rm(resolve(publicRoot, "textures"), { recursive: true, force: true });
  await mkdir(resolve(publicRoot, "screens"), { recursive: true });
  await mkdir(resolve(publicRoot, "handoff"), { recursive: true });
  await mkdir(resolve(publicRoot, "fonts"), { recursive: true });

  await cp(resolve(source, "reference"), resolve(publicRoot, "screens"), { recursive: true });
  await cp(resolve(source, "assets"), resolve(publicRoot, "assets"), { recursive: true });
  await cp(resolve(projectRoot, "workspace/UI/dev/card"), resolve(publicRoot, "cards"), { recursive: true });
  await cp(resolve(projectRoot, "workspace/UI/dev/icon"), resolve(publicRoot, "icons"), { recursive: true });
  await mkdir(resolve(publicRoot, "earth"), { recursive: true });
  await cp(resolve(projectRoot, "TD/HugeData/3D/earth-good/textures/Russia_Border_Mask_6K.svg"), resolve(publicRoot, "earth/Russia_Border_Mask_6K.svg"));
  await cp(resolve(projectRoot, "TD/HugeData/3D/earth-good/textures/Russia_Fill_Mask_6K.svg"), resolve(publicRoot, "earth/Russia_Fill_Mask_6K.svg"));
  for (const file of [
    "manifest.json", "asset-index.json", "image-index.json", "reference-index.json",
    "tokens.json", "tokens-derived.json", "tokens.css", "validation.json",
  ]) {
    await cp(resolve(source, file), resolve(publicRoot, "handoff", file));
  }

  const fontSource = resolve(projectRoot, "workspace/brandbook/fonts/bureau1440/Bureau 1440 Display Medium.ttf");
  await cp(fontSource, resolve(publicRoot, "fonts/Bureau-1440-Display-Medium.ttf"));
  const textFontSource = resolve(projectRoot, "workspace/brandbook/fonts/bureau1440/Bureau 1440 Text Normal.ttf");
  await cp(textFontSource, resolve(publicRoot, "fonts/Bureau-1440-Text-Normal.ttf"));
  await writeFile(resolve(publicRoot, "handoff/source.txt"), `handoff-session=${basename(source)}\n`, "utf8");
  console.log(`Синхронизирован WEB handoff: ${basename(source)}`);
}

await mkdir(resolve(publicRoot, "assets/qr"), { recursive: true });
await mkdir(resolve(publicRoot, "assets/nodes"), { recursive: true });
await writeFile(resolve(publicRoot, "assets/nodes/logo-eng.svg"), englishLogo);
for (const { name, data } of qrFiles) await writeFile(resolve(publicRoot, "assets/qr", name), data);

// Registered variants in public/earth/contours remain independent of legacy TD sources.
await checkEarthContours(publicRoot);

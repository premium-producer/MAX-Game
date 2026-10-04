import { cp, mkdir, rm } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";
import { checkEarthContours } from "./check-earth-contours.mjs";

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dist = resolve(appRoot, "dist");
await checkEarthContours(resolve(appRoot, "public"));
await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });

await cp(resolve(appRoot, "index.html"), resolve(dist, "index.html"));
await cp(resolve(appRoot, "editor.html"), resolve(dist, "editor.html"));
await cp(resolve(appRoot, "wording.html"), resolve(dist, "wording.html"));
await cp(resolve(appRoot, "earth.html"), resolve(dist, "earth.html"));
await cp(resolve(appRoot, "object.html"), resolve(dist, "object.html"));
await cp(resolve(appRoot, "object.html"), resolve(dist, "objects.html"));
await cp(resolve(appRoot, "src"), resolve(dist, "src"), { recursive: true });
await cp(resolve(appRoot, "public"), dist, { recursive: true });
await rm(resolve(dist, "screens"), { recursive: true, force: true });
await rm(resolve(dist, "earth/Earth_Illumination_Glow_4K.webp"), { force: true });
await build({
  entryPoints: [resolve(appRoot, "src/main.js")],
  outfile: resolve(dist, "app.js"),
  bundle: true,
  format: "esm",
  platform: "browser",
  target: ["es2020"],
  sourcemap: true,
});
await build({
  entryPoints: [resolve(appRoot, "src/editor-main.js")],
  outfile: resolve(dist, "editor.js"),
  bundle: true,
  format: "esm",
  platform: "browser",
  target: ["es2020"],
  sourcemap: true,
});
await build({
  entryPoints: [resolve(appRoot, "src/earth-editor-main.js")],
  outfile: resolve(dist, "earth-editor.js"),
  bundle: true,
  format: "esm",
  platform: "browser",
  target: ["es2020"],
  sourcemap: true,
});

await build({
  entryPoints: [resolve(appRoot, "src/objects-main.js")],
  outfile: resolve(dist, "objects.js"),
  bundle: true,
  format: "esm",
  platform: "browser",
  target: ["es2020"],
  sourcemap: true,
});
console.log(`Built browser prototype: ${dist}`);

await build({ entryPoints: [resolve(appRoot, "src/wording-editor-main.js")], outfile: resolve(dist, "wording-editor.js"), bundle: true, format: "esm", platform: "browser", target: ["es2020"], sourcemap: true });

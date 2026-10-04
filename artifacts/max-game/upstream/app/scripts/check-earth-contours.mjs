import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { parseEarthContours, earthContourById } from "../src/earth-contours.mjs";

export async function checkEarthContours(publicRoot) {
  const catalog = parseEarthContours(JSON.parse(await readFile(resolve(publicRoot, "config/earth-contours.json"), "utf8")));
  const shell = JSON.parse(await readFile(resolve(publicRoot, "config/ui-shell.json"), "utf8"));
  earthContourById(catalog, shell.rendering?.earth?.russiaContour);
  for (const variant of catalog.variants) for (const kind of ["border", "fill"]) {
    const source = variant[kind];
    const svg = await readFile(resolve(publicRoot, source), "utf8");
    if (!/<svg\b[^>]*\bviewBox=["']0 0 6000 3000["']/s.test(svg)) throw new Error(`${source}: expected SVG viewBox 0 0 6000 3000`);
    if (/<\s*(?:script|image|foreignObject|use|clipPath|style)\b|\b(?:href|transform|style|clip-path|on\w+)\s*=/i.test(svg)) throw new Error(`${source}: prepare a plain standalone SVG first`);
    const paths = [...svg.matchAll(/<path\b[^>]*\bd=["']([^"']+)["']/gs)];
    if (!paths.length) throw new Error(`${source}: no paths`);
    for (const [, d] of paths) {
      const numbers = d.match(/[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:[eE][-+]?\d+)?/g) || [];
      const commands = d.replace(/[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:[eE][-+]?\d+)?/g, "").replace(/[\s,]/g, "");
      if (!/^[MLZ]+$/.test(commands) || numbers.length % 2 || !numbers.length) throw new Error(`${source}: use prepared absolute M/L/Z paths`);
      if (numbers.some((n, i) => !Number.isFinite(Number(n)) || Number(n) < 0 || Number(n) > (i % 2 ? 3000 : 6000))) throw new Error(`${source}: point outside the 6000×3000 map`);
    }
  }
  return catalog;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const root = resolve(import.meta.dirname, "../public");
  const catalog = await checkEarthContours(root);
  console.log(`Earth contours check passed: ${catalog.variants.length} complete SVG pairs.`);
}

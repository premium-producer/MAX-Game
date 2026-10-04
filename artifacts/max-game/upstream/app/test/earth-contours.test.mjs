import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import { parseEarthContours, earthContourById, loadEarthContours, createContourSwitcher } from "../src/earth-contours.mjs";
import { parseUiShellConfig } from "../src/ui-shell-config.mjs";
import { collectAssetSources, PreparedAssets } from "../src/asset-preparation.mjs";
import { checkEarthContours } from "../scripts/check-earth-contours.mjs";

const root = new URL("../public/", import.meta.url);
const raw = JSON.parse(await readFile(new URL("config/earth-contours.json", root), "utf8"));
const catalog = parseEarthContours(raw);
const deferred = () => { let resolve,reject; const promise = new Promise((yes,no) => { resolve=yes;reject=no; }); return { promise,resolve,reject }; };

test("registered contour pairs retain the original and the exact supplied decorative geometry", async () => {
  assert.deepEqual(catalog.variants.map((v) => v.id), ["classic","decorative-2026"]);
  await checkEarthContours(fileURLToPath(new URL("../public/", import.meta.url)));
  const variant = earthContourById(catalog,"decorative-2026");
  const expected = { border: "7cbe7235fc6d6bef85c7ff6d0947228d792b2b2a66f67f097e687c3042858c8a", fill: "75add7711cad7dc9d83c17e81533e789ad8ae9ec5157e358a4545a2297fa4186" };
  for (const key of ["border","fill"]) assert.equal(createHash("sha256").update(await readFile(new URL(variant[key],root))).digest("hex"),expected[key]);
});

test("catalog accepts further local variants and rejects duplicate IDs, missing pairs and unsafe paths", async () => {
  const extra = { id: "next-contour", label: "Следующий", border: "./earth/contours/next/border.svg", fill: "./earth/contours/next/fill.svg" };
  assert.equal(earthContourById(parseEarthContours({ ...raw, variants: [...raw.variants,extra] }),extra.id).label,"Следующий");
  for (const patch of [{ id: "classic" },{ id: undefined },{ border: "https://example.com/file.svg" },{ fill: "./earth/../config/a.svg" },{ fill: extra.border },{ label: "" }]) {
    assert.throws(() => parseEarthContours({ ...raw, variants: [...raw.variants,{ ...extra,...patch }] }));
  }
  assert.throws(() => earthContourById(catalog,"missing"),/не найден/);
  assert.deepEqual(await loadEarthContours(async () => ({ ok:true,json:async () => raw })),catalog);
  await assert.rejects(loadEarthContours(async () => ({ ok:false,status:404 })),/HTTP 404/);
});

test("legacy profiles default to classic; new IDs survive style normalization", async () => {
  const shell = JSON.parse(await readFile(new URL("config/ui-shell.json",root),"utf8"));
  delete shell.rendering.earth.russiaContour;
  assert.equal(parseUiShellConfig(shell).rendering.earth.russiaContour,"classic");
  shell.rendering.earth.russiaContour="next-contour";
  assert.equal(parseUiShellConfig(shell).rendering.earth.russiaContour,"next-contour");
  shell.rendering.earth.russiaContour="../mask";
  assert.throws(() => parseUiShellConfig(shell),/russiaContour/);
});

test("startup prepares only the selected pair and treats its border as vector data", async () => {
  const variant = earthContourById(catalog,"decorative-2026");
  const sources = collectAssetSources({}, {}, catalog,variant.id);
  assert.ok(sources.images.includes(variant.fill)); assert.ok(sources.images.includes(variant.border));
  assert.ok(!sources.images.includes(earthContourById(catalog,"classic").fill));
  const prepared = new PreparedAssets();
  await prepared.load({ icons:[], contours:catalog, images:[variant.border], vectorSources:[variant.border] },undefined,{
    fetchImpl:async () => new Response("<svg>vector</svg>"),
    imageFactory: () => { throw new Error("Vector border must not rasterize"); },
  });
  assert.equal(prepared.get(variant.border).text,"<svg>vector</svg>");
  assert.equal(prepared.contours,catalog); prepared.dispose();
});

test("switching waits for a complete pair, deduplicates pending requests and disposes after apply", async () => {
  const gate=deferred(), events=[];
  const switcher=createContourSwitcher({ initial:{ id:"classic",resource:"old" },load:() => gate.promise,apply:(x) => events.push(["apply",x]),release:(x) => events.push(["release",x]) });
  const first=switcher.select("next"); assert.equal(switcher.select("next"),first);
  assert.equal(switcher.activeId,"classic"); assert.deepEqual(events,[]);
  gate.resolve("new"); assert.equal(await first,true);
  assert.deepEqual(events,[["apply","new"],["release","old"]]);
  assert.equal(switcher.activeId,"next");
  switcher.dispose(); switcher.dispose();
  assert.deepEqual(events.at(-1),["release","new"]);
  assert.equal(events.length,3);
});

test("late loads cannot override the latest selection or a return to the original", async () => {
  const a=deferred(),b=deferred(), applied=[],released=[];
  const switcher=createContourSwitcher({ initial:{id:"classic",resource:"old"},load:(id) => id==="a"?a.promise:b.promise,apply:(r) => applied.push(r),release:(r) => released.push(r) });
  const pa=switcher.select("a"),pb=switcher.select("b");
  b.resolve("b"); await pb; a.resolve("a"); assert.equal(await pa,false);
  assert.deepEqual(applied,["b"]); assert.deepEqual(released,["old","a"]);
  const c=deferred(), other=createContourSwitcher({initial:{id:"classic",resource:"original"},load:() => c.promise,apply:() => assert.fail("stale apply"),release:(x) => released.push(x)});
  const pc=other.select("c"); await other.select("classic"); c.resolve("c"); assert.equal(await pc,false);
  assert.equal(other.activeId,"classic");
});

test("load failures preserve the active pair; disposal releases in-flight results without applying", async () => {
  const released=[],gate=deferred();
  const switcher=createContourSwitcher({initial:{id:"classic",resource:"old"},load:() => gate.promise,apply:() => assert.fail("must not apply"),release:(r) => released.push(r)});
  const pending=switcher.select("broken"); gate.reject(new Error("missing SVG")); await assert.rejects(pending,/missing SVG/);
  assert.equal(switcher.activeId,"classic"); assert.deepEqual(released,[]);
  const late=deferred();
  const other=createContourSwitcher({initial:{id:"classic",resource:"old2"},load:() => late.promise,apply:() => assert.fail("disposed apply"),release:(r) => released.push(r)});
  const request=other.select("next"); other.dispose(); late.resolve("late"); await request;
  assert.deepEqual(released,["old2","late"]);
});

test("editor locks saving during contour load and restores the selected ID after a failed load", async () => {
  const source=await readFile(new URL("../src/earth-editor-main.js",import.meta.url),"utf8");
  const body=source.slice(source.indexOf("function applyPreviewStyle()"),source.indexOf("function syncAllFields()"));
  const gate=deferred(),events=[];
  const context=vm.createContext({ field:{getEarthContourId:()=>"classic",setEarthStyle:()=>gate.promise},earthStyle:{russiaContour:"decorative-2026"},styleRequest:0,contourLoading:false,
    updateStatus(){},renderTextures(){},syncAllFields(){},persistDraft(){events.push("draft")},showNotice(){events.push("error")},console:{error(){}} });
  vm.runInContext(body,context);context.applyPreviewStyle();
  assert.equal(context.contourLoading,true);
  gate.reject(new Error("offline"));await new Promise((r)=>setImmediate(r));
  assert.equal(context.contourLoading,false);
  assert.equal(context.earthStyle.russiaContour,"classic");
  assert.deepEqual(events,["draft","error"]);
  assert.match(source,/if \(saving \|\| contourLoading \|\| !isDirty\(\)\) return/);
});

import assert from "node:assert/strict";
import { cp, mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve, join } from "node:path";
import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { once } from "node:events";
import test from "node:test";

const root = resolve(import.meta.dirname, "..");
test("local HTTP editor API persists only in its project and rejects stale and incompatible writes", async (t) => {
  const projectRoot = await mkdtemp(join(tmpdir(), "sputnik-editor-http-"));
  let child;
  t.after(async () => {
    if (child && child.exitCode === null) { child.kill(); await once(child, "exit"); }
    await rm(projectRoot, { recursive: true, force: true });
  });
  await cp(resolve(root, "server.mjs"), resolve(projectRoot, "server.mjs"));
  await cp(resolve(root, "src"), resolve(projectRoot, "src"), { recursive: true });
  await cp(resolve(root, "public/config"), resolve(projectRoot, "public/config"), { recursive: true });
  await cp(resolve(root, "public/config"), resolve(projectRoot, "dist/config"), { recursive: true });
  const reserve = createServer(); reserve.listen(0, "127.0.0.1"); await once(reserve, "listening");
  const port = reserve.address().port; await new Promise((done) => reserve.close(done));
  child = spawn(process.execPath, [resolve(projectRoot, "server.mjs"), `--port=${port}`], { stdio: ["ignore", "pipe", "pipe"] });
  await Promise.race([
    once(child.stdout, "data"),
    once(child, "exit").then(() => { throw new Error("Test editor server failed to start"); }),
    new Promise((_, reject) => { const timeout = setTimeout(() => reject(new Error("Editor server startup timed out")), 10000); timeout.unref(); }),
  ]);
  const base = `http://127.0.0.1:${port}`;
  const status = await (await fetch(`${base}/api/editor/status`)).json();
  assert.equal(status.protocolVersion, 2);
  const read = async () => (await fetch(`${base}/api/editor/project`)).json();
  const post = (path, body, origin = base) => fetch(`${base}${path}`, { method: "POST", headers: { "Content-Type": "application/json", Origin: origin }, body: JSON.stringify(body) });
  const project = await read();
  const payload = { catalog: project.catalog, shellConfig: project.shellConfig, expected: project.revisions };
  payload.catalog.missions[0].name = "HTTP ТЕСТ";
  assert.equal((await post("/api/editor/save", payload, "https://unrelated.example")).status, 403);
  assert.equal((await post("/api/editor/save", { catalog: project.catalog, shellConfig: project.shellConfig })).status, 422);
  const response = await post("/api/editor/save", payload);
  assert.equal(response.status, 200, await response.clone().text());
  const result = await response.json();
  assert.ok(result.backupId);
  assert.equal((await read()).catalog.missions[0].name, "HTTP ТЕСТ");
  assert.equal((await post("/api/editor/save", payload)).status, 409);
  const current = await read();
  const earth = { ...current.shellConfig.rendering.earth, oceanColor: "#225588" };
  assert.equal((await post("/api/earth-style/save", { earthStyle: earth, expected: current.revisions })).status, 200);
  assert.equal((await post("/api/earth-style/save", { earthStyle: earth, expected: current.revisions })).status, 409);
  const next = await read(); next.wording.entries["cta.primary"].ru = "ПРОВЕРЬ СВЯЗЬ";
  assert.equal((await post("/api/wording/save", { wording: next.wording, expected: next.revisions })).status, 200);
  const persisted = JSON.parse(await readFile(resolve(projectRoot, "dist/config/wording.json"), "utf8"));
  assert.equal(persisted.entries["cta.primary"].ru, "ПРОВЕРЬ СВЯЗЬ");
  // Read after restarting the process, not from an in-memory cache.
  child.kill(); await once(child, "exit");
  child = spawn(process.execPath, [resolve(projectRoot, "server.mjs"), `--port=${port}`], { stdio: ["ignore", "pipe", "pipe"] });
  await once(child.stdout, "data");
  const restarted = await read();
  assert.equal(restarted.catalog.missions[0].name, "HTTP ТЕСТ");
  assert.equal(restarted.shellConfig.rendering.earth.oceanColor, "#225588");
  assert.equal(restarted.wording.entries["cta.primary"].ru, "ПРОВЕРЬ СВЯЗЬ");
});

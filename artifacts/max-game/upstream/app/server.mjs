import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import { dirname, extname, isAbsolute, normalize, resolve, sep } from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { readEditorProject, saveWordingConfig, saveEarthStyleConfig, saveProjectConfigs } from "./src/editor-project-save.mjs";

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)));
const root = resolve(appRoot, "dist");
const host = "127.0.0.1";
const portArgument = process.argv.find((argument) => argument.startsWith("--port="));
const port = Number(portArgument?.slice("--port=".length) || process.env.XSP_PORT || process.env.PORT || 4174);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("Некорректный локальный порт.");
const types = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ttf": "font/ttf",
  ".wav": "audio/wav",
  ".webm": "audio/webm",
  ".ogg": "audio/ogg",
};

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url || "/", `http://${host}:${port}`);
    const isEditorApi = url.pathname === "/api/editor/status" || url.pathname === "/api/editor/save" || url.pathname === "/api/earth-style/save" || url.pathname === "/api/editor/project" || url.pathname === "/api/wording/save";
    if (isEditorApi && !allowEditorApiOrigin(request, response)) {
      sendJson(response, 403, { error: "Доступ разрешён только локальному редактору проекта." });
      return;
    }
    if (isEditorApi && request.method === "OPTIONS") {
      response.writeHead(204, { "Cache-Control": "no-store" });
      response.end();
      return;
    }
    if (url.pathname === "/api/editor/status") {
      sendJson(response, request.method === "GET" ? 200 : 405, request.method === "GET"
        ? { writable: true, protocolVersion: 2 }
        : { error: "Метод не поддерживается." });
      return;
    }
    if (url.pathname === "/api/editor/project") {
      if (request.method !== "GET") sendJson(response, 405, { error: "Метод не поддерживается." });
      else sendJson(response, 200, await readEditorProject(appRoot));
      return;
    }
    if (url.pathname === "/api/wording/save") {
      await handleWordingSave(request, response);
      return;
    }
    if (url.pathname === "/api/editor/save") {
      await handleEditorSave(request, response);
      return;
    }
    if (url.pathname === "/api/earth-style/save") {
      await handleEarthStyleSave(request, response);
      return;
    }
    const pathname = decodeURIComponent(url.pathname);
    const relative = normalize(pathname.replace(/^\/+/, ""));
    let target = resolve(root, relative === "." || !relative ? "index.html" : relative);
    if (isAbsolute(relative) || !target.startsWith(root + sep)) throw new Error("Unsafe path");
    try {
      const info = await stat(target);
      if (info.isDirectory()) target = resolve(target, "index.html");
    } catch (_) {
      target = resolve(root, "index.html");
    }
    const info = await stat(target);
    response.writeHead(200, {
      "Content-Type": types[extname(target).toLowerCase()] || "application/octet-stream",
      "Content-Length": info.size,
      "Cache-Control": "no-store",
    });
    createReadStream(target).pipe(response);
  } catch (error) {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
  }
});

async function handleEditorSave(request, response) {
  if (request.method !== "POST") {
    sendJson(response, 405, { error: "Метод не поддерживается." });
    return;
  }
  if (!String(request.headers["content-type"] || "").toLowerCase().startsWith("application/json")) {
    sendJson(response, 415, { error: "Ожидается JSON-запрос." });
    return;
  }
  try {
    const payload = JSON.parse(await readRequestBody(request));
    requireRevisions(payload, payload.scope === "catalog" ? ["wording"] : ["wording", "shell"]);
    if (![undefined, "catalog", "project"].includes(payload.scope)) throw new Error("Неизвестная область сохранения");
    const result = await saveProjectConfigs({
      expected: payload.expected,
      scope: payload.scope,
      catalog: payload.catalog,
      shellConfig: payload.shellConfig,
      projectRoot: appRoot,
    });
    sendJson(response, 200, result);
  } catch (error) {
    sendJson(response, error.status || (error instanceof SyntaxError ? 400 : 422), { error: error.message || "Не удалось сохранить конфигурацию." });
  }
}

async function handleEarthStyleSave(request, response) {
  if (request.method !== "POST") {
    sendJson(response, 405, { error: "Метод не поддерживается." });
    return;
  }
  if (!String(request.headers["content-type"] || "").toLowerCase().startsWith("application/json")) {
    sendJson(response, 415, { error: "Ожидается JSON-запрос." });
    return;
  }
  try {
    const payload = JSON.parse(await readRequestBody(request));
    requireRevisions(payload, ["earth"]);
    const result = await saveEarthStyleConfig({ earthStyle: payload.earthStyle, expected: payload.expected, projectRoot: appRoot });
    sendJson(response, 200, result);
  } catch (error) {
    sendJson(response, error.status || (error instanceof SyntaxError ? 400 : 422), { error: error.message || "Не удалось сохранить профиль Земли." });
  }
}

function requireRevisions(payload, domains) {
  if (domains.some((key) => typeof payload.expected?.[key] !== "string")) throw new Error("Обновите страницу редактора: требуется актуальная версия сохранения.");
}

async function handleWordingSave(request, response) {
  if (request.method !== "POST") { sendJson(response, 405, { error: "Метод не поддерживается." }); return; }
  if (!String(request.headers["content-type"] || "").toLowerCase().startsWith("application/json")) { sendJson(response, 415, { error: "Ожидается JSON-запрос." }); return; }
  try {
    const payload = JSON.parse(await readRequestBody(request));
    requireRevisions(payload, ["wording"]);
    const result = await saveWordingConfig({ wording: payload.wording, expected: payload.expected, projectRoot: appRoot });
    sendJson(response, 200, result);
  } catch (error) { sendJson(response, error.status || 422, { error: error.message }); }
}

function allowEditorApiOrigin(request, response) {
  const origin = request.headers.origin;
  if (!origin) return true;
  const allowedOrigins = new Set([
    `http://${host}:${port}`,
    "http://127.0.0.1:4173",
    "http://localhost:4173",
    "http://127.0.0.1:4174",
    "http://localhost:4174",
  ]);
  if (!allowedOrigins.has(origin)) return false;
  response.setHeader("Access-Control-Allow-Origin", origin);
  response.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type");
  response.setHeader("Vary", "Origin");
  return true;
}

function readRequestBody(request) {
  return new Promise((resolveBody, rejectBody) => {
    const chunks = [];
    let size = 0;
    let rejected = false;
    request.on("data", (chunk) => {
      if (rejected) return;
      size += chunk.length;
      if (size > 8 * 1024 * 1024) {
        rejected = true;
        rejectBody(new Error("Конфигурация превышает допустимый размер 8 МБ."));
        return;
      }
      chunks.push(chunk);
    });
    request.on("end", () => { if (!rejected) resolveBody(Buffer.concat(chunks).toString("utf8")); });
    request.on("error", rejectBody);
  });
}

function sendJson(response, status, data) {
  const body = JSON.stringify(data);
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
    "Cache-Control": "no-store",
  });
  response.end(body);
}

server.listen(port, host, () => {
  const address = `http://${host}:${port}`;
  console.log(`X-SPUTNIK browser prototype: ${address}`);
  if (process.argv.includes("--open-editor")) openBrowser(`${address}/editor.html`);
  else if (process.argv.includes("--open")) openBrowser(address);
});

function openBrowser(address) {
  const command = process.platform === "win32"
    ? [process.env.ComSpec || "cmd.exe", ["/d", "/s", "/c", "start", "", address]]
    : process.platform === "darwin"
      ? ["open", [address]]
      : ["xdg-open", [address]];
  const child = spawn(command[0], command[1], { detached: true, stdio: "ignore" });
  child.on("error", () => console.log(`Откройте приложение вручную: ${address}`));
  child.unref();
}

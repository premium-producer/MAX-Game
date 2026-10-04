var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  try {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  } catch (e) {
    throw mod = 0, e;
  }
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// artifacts/max-game/node_modules/range-parser/index.js
var require_range_parser = __commonJS({
  "artifacts/max-game/node_modules/range-parser/index.js"(exports, module) {
    "use strict";
    module.exports = rangeParser;
    function rangeParser(size, str, options) {
      if (typeof str !== "string") {
        throw new TypeError("argument str must be a string");
      }
      var index = str.indexOf("=");
      if (index === -1) {
        return -2;
      }
      var arr = str.slice(index + 1).split(",");
      var ranges = [];
      ranges.type = str.slice(0, index);
      for (var i = 0; i < arr.length; i++) {
        var range = arr[i].split("-");
        var start = parseInt(range[0], 10);
        var end = parseInt(range[1], 10);
        if (isNaN(start)) {
          start = size - end;
          end = size - 1;
        } else if (isNaN(end)) {
          end = size - 1;
        }
        if (end > size - 1) {
          end = size - 1;
        }
        if (isNaN(start) || isNaN(end) || start > end || start < 0) {
          continue;
        }
        ranges.push({
          start,
          end
        });
      }
      if (ranges.length < 1) {
        return -1;
      }
      return options && options.combine ? combineRanges(ranges) : ranges;
    }
    function combineRanges(ranges) {
      var ordered = ranges.map(mapWithIndex).sort(sortByRangeStart);
      for (var j = 0, i = 1; i < ordered.length; i++) {
        var range = ordered[i];
        var current = ordered[j];
        if (range.start > current.end + 1) {
          ordered[++j] = range;
        } else if (range.end > current.end) {
          current.end = range.end;
          current.index = Math.min(current.index, range.index);
        }
      }
      ordered.length = j + 1;
      var combined = ordered.sort(sortByRangeIndex).map(mapWithoutIndex);
      combined.type = ranges.type;
      return combined;
    }
    function mapWithIndex(range, index) {
      return {
        start: range.start,
        end: range.end,
        index
      };
    }
    function mapWithoutIndex(range) {
      return {
        start: range.start,
        end: range.end
      };
    }
    function sortByRangeIndex(a, b) {
      return a.index - b.index;
    }
    function sortByRangeStart(a, b) {
      return a.start - b.start;
    }
  }
});

// artifacts/max-game/start.mjs
var import_range_parser = __toESM(require_range_parser(), 1);
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
var root = path.dirname(fileURLToPath(import.meta.url));
var port = Number(process.env.MAX_GAME_PORT || 8785);
var origin = `http://localhost:${port}`;
var types = { ".mp4": "video/mp4", ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".mjs": "text/javascript", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp", ".woff2": "font/woff2", ".bin": "application/octet-stream", ".webm": "audio/webm", ".ogg": "audio/ogg", ".mp3": "audio/mpeg", ".md": "text/plain", ".txt": "text/plain" };
function open() {
  if (!process.argv.includes("--no-open") && process.platform === "win32") spawn("rundll32.exe", ["url.dll,FileProtocolHandler", origin], { windowsHide: true, stdio: "ignore" }).unref();
}
var identity = { application: "max-space-game", version: "0.1.0" };
function resolveAsset(requested) {
  const relative = decodeURIComponent(new URL(requested, origin).pathname).slice(1) || "index.html";
  if (relative.includes("\\") || relative.split("/").some((s) => s.startsWith(".") || s.includes(":"))) throw Error("Invalid path");
  const file = path.resolve(root, relative);
  if (!file.startsWith(root + path.sep) || !types[path.extname(file)]) throw Error("Invalid path");
  return file;
}
function createGameServer() {
  return http.createServer((req, res) => {
    if (!["GET", "HEAD"].includes(req.method)) {
      res.writeHead(405);
      return res.end();
    }
    if (req.url === "/health") {
      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(req.method === "HEAD" ? void 0 : JSON.stringify(identity));
    }
    try {
      const file = resolveAsset(req.url), stat = fs.statSync(file);
      if (!stat.isFile()) throw Error("Not a file");
      const video = path.extname(file) === ".mp4";
      const headers = { "Content-Type": types[path.extname(file)], "Content-Length": stat.size, "Accept-Ranges": "bytes", "Cache-Control": video ? "public, max-age=3600" : "no-store" };
      let range;
      if (req.method === "GET" && req.headers.range) {
        const ranges = (0, import_range_parser.default)(stat.size, req.headers.range, { combine: true });
        if (ranges === -1) {
          res.writeHead(416, { "Content-Range": `bytes */${stat.size}` });
          return res.end();
        }
        if (Array.isArray(ranges) && ranges.type === "bytes" && ranges.length === 1) range = ranges[0];
      }
      if (range) {
        headers["Content-Range"] = `bytes ${range.start}-${range.end}/${stat.size}`;
        headers["Content-Length"] = range.end - range.start + 1;
      }
      res.writeHead(range ? 206 : 200, headers);
      if (req.method === "HEAD") return res.end();
      const stream = fs.createReadStream(file, range);
      stream.on("error", () => res.destroy());
      res.on("close", () => stream.destroy());
      stream.pipe(res);
    } catch {
      res.writeHead(404);
      res.end("Not found");
    }
  });
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (!Number.isInteger(port) || port < 1024 || port > 65535) throw Error("MAX_GAME_PORT must be 1024\u201365535");
  const server = createGameServer();
  server.on("error", async (error) => {
    if (error.code === "EADDRINUSE") {
      try {
        const r = await fetch(origin + "/health", { signal: AbortSignal.timeout(2e3) });
        if ((await r.json()).application === identity.application) {
          console.log("Already running: " + origin);
          open();
          return;
        }
      } catch {
      }
      console.error(`Port ${port} belongs to another service. Choose MAX_GAME_PORT.`);
    } else console.error(error.message);
    process.exitCode = 1;
  });
  server.listen(port, "localhost", () => {
    console.log(origin);
    open();
  });
  for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => {
    server.closeAllConnections();
    server.close();
  });
}
export {
  createGameServer,
  resolveAsset
};
/*! Bundled license information:

range-parser/index.js:
  (*!
   * range-parser
   * Copyright(c) 2012-2014 TJ Holowaychuk
   * Copyright(c) 2015-2016 Douglas Christopher Wilson
   * MIT Licensed
   *)
*/

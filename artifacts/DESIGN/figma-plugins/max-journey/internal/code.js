var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
const MAXReview = (() => {
  const finite = Number.isFinite;
  const transform = (m, p) => ({ x: m[0][0] * p.x + m[0][1] * p.y + m[0][2], y: m[1][0] * p.x + m[1][1] * p.y + m[1][2] });
  function validTransform(m) {
    return Array.isArray(m) && m.length === 2 && m.every((row) => Array.isArray(row) && row.length === 3 && row.every(finite));
  }
  function polygon(screen) {
    const m = screen.absoluteTransform;
    return [{ x: 0, y: 0 }, { x: screen.width, y: 0 }, { x: screen.width, y: screen.height }, { x: 0, y: screen.height }].map((p) => transform(m, p));
  }
  function inside(screen, p) {
    const m = screen.absoluteTransform, a = m[0][0], b = m[0][1], c = m[1][0], d = m[1][1], det = a * d - b * c;
    if (Math.abs(det) < 1e-9) return false;
    const x = p.x - m[0][2], y = p.y - m[1][2], u = (d * x - b * y) / det, v = (-c * x + a * y) / det;
    return u >= 0 && v >= 0 && u <= screen.width && v <= screen.height;
  }
  function segmentDistance(p, a, b) {
    const dx = b.x - a.x, dy = b.y - a.y, s = dx * dx + dy * dy, t = s ? Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / s)) : 0;
    return Math.hypot(p.x - a.x - t * dx, p.y - a.y - t * dy);
  }
  function distance(screen, p) {
    if (inside(screen, p)) return 0;
    const poly = polygon(screen);
    return Math.min(...poly.map((a, i) => segmentDistance(p, a, poly[(i + 1) % 4])));
  }
  function area(poly) {
    return Math.abs(poly.reduce((s, a, i) => {
      const b = poly[(i + 1) % poly.length];
      return s + a.x * b.y - b.x * a.y;
    }, 0)) / 2;
  }
  function clip(subject, clipper) {
    const signed = clipper.reduce((s, a, i) => {
      const b = clipper[(i + 1) % clipper.length];
      return s + a.x * b.y - b.x * a.y;
    }, 0), sign = signed >= 0 ? 1 : -1;
    let result = subject;
    for (let i = 0; i < clipper.length && result.length; i++) {
      const a = clipper[i], b = clipper[(i + 1) % clipper.length], side = (p) => sign * ((b.x - a.x) * (p.y - a.y) - (b.y - a.y) * (p.x - a.x));
      const input = result;
      result = [];
      for (let j = 0; j < input.length; j++) {
        const p = input[j], q = input[(j + 1) % input.length], sp = side(p), sq = side(q), pin = sp >= -1e-8, qin = sq >= -1e-8;
        if (pin) result.push(p);
        if (pin !== qin) {
          const t = sp / (sp - sq);
          result.push({ x: p.x + t * (q.x - p.x), y: p.y + t * (q.y - p.y) });
        }
      }
    }
    return result;
  }
  function geometry(meta, anchors) {
    if (!meta || typeof meta !== "object") return { error: "missing-position" };
    const anchor = meta.node_id ? anchors[meta.node_id] : null;
    if (meta.node_id && !anchor) return { error: "unknown-node", nodeId: meta.node_id };
    const p = meta.node_id ? meta.node_offset : meta;
    if (!p || ![p.x, p.y].every(finite)) return { error: "missing-position" };
    const m = anchor == null ? void 0 : anchor.absoluteTransform;
    if (anchor && !validTransform(m)) return { error: "invalid-node-transform", nodeId: meta.node_id };
    const point = anchor ? transform(m, p) : { x: p.x, y: p.y };
    let region = null;
    if (finite(meta.region_width) && finite(meta.region_height) && meta.region_width > 0 && meta.region_height > 0) {
      const corner = meta.comment_pin_corner || "bottom-right";
      if (!["bottom-right", "bottom-left", "top-right", "top-left"].includes(corner)) return { error: "invalid-region-corner" };
      const x = p.x - (corner.endsWith("right") ? meta.region_width : 0), y = p.y - (corner.startsWith("bottom") ? meta.region_height : 0);
      region = [{ x, y }, { x: x + meta.region_width, y }, { x: x + meta.region_width, y: y + meta.region_height }, { x, y: y + meta.region_height }].map((q) => anchor ? transform(m, q) : q);
    }
    return { point, region, pageId: (anchor == null ? void 0 : anchor.pageId) || null, nodeId: meta.node_id || null, anchor };
  }
  function match(meta, map, assumePage) {
    const g = geometry(meta, map.anchors), base = { status: "unassigned", screenIds: [], candidates: [], reason: g.error || null, position: g.point || null, region: g.region || null, pageId: g.pageId || null };
    if (g.error) return base;
    const candidates = map.screens.filter((s) => s.visible && (!g.pageId || s.pageId === g.pageId));
    if (g.anchor) {
      const chain = [g.nodeId, ...g.anchor.ancestorIds];
      const bound = candidates.filter((s) => chain.includes(s.nodeId));
      if (bound.length === 1) return __spreadProps(__spreadValues({}, base), { status: "bound", screenIds: [bound[0].nodeId], reason: "explicit-node-ancestor" });
      if (!candidates.some((s) => s.ancestorIds.includes(g.nodeId))) return __spreadProps(__spreadValues({}, base), { status: "outside-selection", reason: "bound-node-outside-selected-screens" });
    }
    const knownPage = g.pageId || assumePage;
    const scope = knownPage ? candidates.filter((s) => s.pageId === knownPage) : candidates;
    const scored = scope.map((s) => ({ screenId: s.nodeId, distance: distance(s, g.point), overlap: g.region ? area(clip(g.region, polygon(s))) / area(g.region) : 0 }));
    const hits = g.region ? scored.filter((c) => c.overlap > 1e-8) : scored.filter((c) => c.distance === 0);
    if (!knownPage) return __spreadProps(__spreadValues({}, base), { status: "unknown-page", reason: "absolute-position-has-no-page-id", candidates: hits.length ? hits : scored.sort((a, b) => a.distance - b.distance).slice(0, 3) });
    base.pageId = knownPage;
    if (hits.length) {
      const status = hits.length === 1 ? "contained" : g.region ? "multi-screen" : "ambiguous";
      return __spreadProps(__spreadValues({}, base), { status, screenIds: status === "ambiguous" ? [] : hits.map((c) => c.screenId), candidates: hits, reason: g.region ? "region-intersection" : "point-inside-frame" });
    }
    const nearby = scored.filter((c) => {
      const s = scope.find((s2) => s2.nodeId === c.screenId);
      return c.distance <= Math.min(80, 0.08 * Math.min(s.bounds.width, s.bounds.height));
    }).sort((a, b) => a.distance - b.distance);
    if (!nearby.length) return __spreadProps(__spreadValues({}, base), { reason: "no-screen-within-nearby-threshold", candidates: scored.sort((a, b) => a.distance - b.distance).slice(0, 3) });
    const tied = nearby.filter((c) => c.distance - nearby[0].distance <= Math.max(8, nearby[0].distance * 0.2));
    return __spreadProps(__spreadValues({}, base), { status: tied.length > 1 ? "ambiguous" : "nearby", reason: tied.length > 1 ? "similar-distance-to-multiple-frames" : "near-frame-needs-review", candidates: tied });
  }
  function assemble(map, raw, { fileKey, assumeCurrentPage = false, fetchedAt } = {}) {
    if (!Array.isArray(raw) || raw.length > 1e4) throw Error("\u041E\u0436\u0438\u0434\u0430\u0435\u0442\u0441\u044F \u0434\u043E 10 000 \u043A\u043E\u043C\u043C\u0435\u043D\u0442\u0430\u0440\u0438\u0435\u0432");
    const ids = /* @__PURE__ */ new Map();
    for (const c of raw) {
      if (!c || typeof c.id !== "string" || ids.has(c.id)) throw Error("\u041D\u0435\u043A\u043E\u0440\u0440\u0435\u043A\u0442\u043D\u044B\u0435 \u0438\u043B\u0438 \u043F\u043E\u0432\u0442\u043E\u0440\u044F\u044E\u0449\u0438\u0435\u0441\u044F ID \u043A\u043E\u043C\u043C\u0435\u043D\u0442\u0430\u0440\u0438\u0435\u0432");
      if (c.file_key && c.file_key !== fileKey) throw Error("\u041A\u043E\u043C\u043C\u0435\u043D\u0442\u0430\u0440\u0438\u0438 \u043E\u0442\u043D\u043E\u0441\u044F\u0442\u0441\u044F \u043A \u0434\u0440\u0443\u0433\u043E\u043C\u0443 \u0444\u0430\u0439\u043B\u0443");
      ids.set(c.id, c);
    }
    const roots = /* @__PURE__ */ new Map(), associations = /* @__PURE__ */ new Map();
    function root(c) {
      if (roots.has(c.id)) return roots.get(c.id);
      let item = c;
      const seen = /* @__PURE__ */ new Set();
      while (item.parent_id) {
        if (seen.has(item.id)) return null;
        seen.add(item.id);
        item = ids.get(item.parent_id);
        if (!item) return null;
      }
      roots.set(c.id, item.id);
      return item.id;
    }
    for (const c of raw) {
      const rootId = root(c);
      if (rootId && !associations.has(rootId)) associations.set(rootId, match(ids.get(rootId).client_meta, map, assumeCurrentPage ? map.page.id : null));
    }
    const comments = raw.map((c) => {
      const rootId = root(c);
      return __spreadProps(__spreadValues({}, c), { threadRootId: rootId, association: rootId ? __spreadProps(__spreadValues({}, associations.get(rootId)), { inheritedFrom: c.id !== rootId ? rootId : null }) : { status: "unassigned", screenIds: [], candidates: [], reason: "missing-or-cyclic-parent" } });
    });
    const grouped = /* @__PURE__ */ new Map();
    for (const c of comments) if (c.threadRootId) {
      if (!grouped.has(c.threadRootId)) grouped.set(c.threadRootId, []);
      grouped.get(c.threadRootId).push(c.id);
    }
    const threads = [...associations].map(([rootId, association]) => ({ rootId, commentIds: grouped.get(rootId), association }));
    const counts = { screens: map.screens.length, comments: comments.length, threads: threads.length };
    for (const c of comments) counts[c.association.status] = (counts[c.association.status] || 0) + 1;
    return { schema: "max-review", version: 1, exportedAt: (/* @__PURE__ */ new Date()).toISOString(), fileKey, commentsFetchedAt: fetchedAt || null, coordinateSystem: "Figma page coordinates; screen bounds exclude rendered shadows", scope: { page: map.page, selectedNodeIds: map.selectedNodeIds, freeCommentPageAssumption: assumeCurrentPage ? map.page.id : null }, screenMap: map.screens, commentMap: comments, threads, unassignedCommentIds: comments.filter((c) => !c.association.screenIds.length).map((c) => c.id), anchors: map.anchors, warnings: map.warnings, summary: counts };
  }
  return { assemble, match, geometry, validTransform };
})();
let reviewBusy = false;
let reviewCancelled = false;
function reviewFileKey() {
  try {
    return figma.fileKey || "";
  } catch (e) {
    return "";
  }
}
async function exportReview(message) {
  if (run || reviewBusy) throw Error("\u0414\u043E\u0436\u0434\u0438\u0442\u0435\u0441\u044C \u0437\u0430\u0432\u0435\u0440\u0448\u0435\u043D\u0438\u044F \u0442\u0435\u043A\u0443\u0449\u0435\u0439 \u043E\u043F\u0435\u0440\u0430\u0446\u0438\u0438");
  reviewBusy = true;
  reviewCancelled = false;
  try {
    let ancestors2 = function(node) {
      const ids = [];
      let parent = node.parent;
      while (parent && parent.type !== "DOCUMENT") {
        ids.push(parent.id);
        parent = parent.parent;
      }
      return ids;
    }, metadata2 = function(node) {
      var _a;
      const raw = (_a = node.getPluginData) == null ? void 0 : _a.call(node, "max-source");
      if (!raw) return null;
      try {
        const value = JSON.parse(raw);
        if (!value || typeof value !== "object" || typeof value.id !== "string") throw Error();
        return value;
      } catch (e) {
        warnings.push({ nodeId: node.id, reason: "invalid-max-source" });
        return null;
      }
    }, add2 = function(node, meta) {
      var _a;
      if (screens.some((s) => s.nodeId === node.id)) return;
      const bounds = node.absoluteBoundingBox, m = node.absoluteTransform;
      if (!bounds || !MAXReview.validTransform(m) || ![node.width, node.height].every(Number.isFinite) || node.width <= 0 || node.height <= 0) {
        warnings.push({ nodeId: node.id, reason: "missing-geometry" });
        return;
      }
      let visible = node.visible !== false;
      for (let p = node.parent; p && p.type !== "PAGE"; p = p.parent) visible = visible && p.visible !== false;
      screens.push({ nodeId: node.id, name: node.name, pageId: page.id, parentId: ((_a = node.parent) == null ? void 0 : _a.id) || null, ancestorIds: ancestors2(node), width: node.width, height: node.height, bounds: { x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height }, absoluteTransform: m.map((row) => [...row]), visible, source: meta });
      if (screens.length > 1e3) throw Error("\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u043D\u0435 \u0431\u043E\u043B\u0435\u0435 1000 \u044D\u043A\u0440\u0430\u043D\u043E\u0432");
    }, tagged2 = function(node) {
      if (seen.has(node.id)) return false;
      seen.add(node.id);
      if (++visited > 6e4) throw Error("\u041E\u0431\u043B\u0430\u0441\u0442\u044C \u0441\u043B\u0438\u0448\u043A\u043E\u043C \u0432\u0435\u043B\u0438\u043A\u0430; \u0432\u044B\u0434\u0435\u043B\u0438\u0442\u0435 \u043C\u0435\u043D\u044C\u0448\u0435 \u044D\u043A\u0440\u0430\u043D\u043E\u0432");
      const meta = metadata2(node);
      if (node.type === "FRAME" && meta) {
        add2(node, meta);
        return true;
      }
      let found = false;
      for (const child of node.children || []) found = tagged2(child) || found;
      return found;
    };
    var ancestors = ancestors2, metadata = metadata2, add = add2, tagged = tagged2;
    const page = figma.currentPage, selected = [...page.selection];
    if (!selected.length) throw Error("\u0412\u044B\u0434\u0435\u043B\u0438\u0442\u0435 \u044D\u043A\u0440\u0430\u043D\u044B \u0438\u043B\u0438 \u0433\u0440\u0443\u043F\u043F\u044B \u043C\u0438\u0441\u0441\u0438\u0439 \u043D\u0430 \u0445\u043E\u043B\u0441\u0442\u0435");
    if (typeof message.fileKey !== "string" || !/^[A-Za-z0-9_-]{5,200}$/.test(message.fileKey)) throw Error("\u0423\u043A\u0430\u0436\u0438\u0442\u0435 \u0441\u0441\u044B\u043B\u043A\u0443 \u043D\u0430 \u0444\u0430\u0439\u043B Figma");
    const currentFileKey = reviewFileKey();
    if (currentFileKey && currentFileKey !== message.fileKey) throw Error("\u0421\u0441\u044B\u043B\u043A\u0430 \u043D\u0435 \u0441\u043E\u043E\u0442\u0432\u0435\u0442\u0441\u0442\u0432\u0443\u0435\u0442 \u043E\u0442\u043A\u0440\u044B\u0442\u043E\u043C\u0443 \u0444\u0430\u0439\u043B\u0443");
    if (!Array.isArray(message.comments) || message.comments.length > 1e4) throw Error("\u041D\u0435\u043A\u043E\u0440\u0440\u0435\u043A\u0442\u043D\u044B\u0439 \u0441\u043F\u0438\u0441\u043E\u043A \u043A\u043E\u043C\u043C\u0435\u043D\u0442\u0430\u0440\u0438\u0435\u0432");
    const screens = [], warnings = [], seen = /* @__PURE__ */ new Set();
    let visited = 0;
    if (!currentFileKey) warnings.push({ reason: "file-key-provided-by-user-not-verified-by-plugin-api" });
    const roots = selected.filter((n) => !selected.some((other) => other !== n && ancestors2(n).includes(other.id)));
    for (const root of roots) {
      const count = screens.length;
      tagged2(root);
      if (screens.length === count) {
        if (root.type === "FRAME") add2(root, null);
        else warnings.push({ nodeId: root.id, reason: "selected-node-is-not-a-screen" });
      }
    }
    if (!screens.length) throw Error("\u0412 \u0432\u044B\u0434\u0435\u043B\u0435\u043D\u0438\u0438 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u044B \u044D\u043A\u0440\u0430\u043D\u044B. \u0412\u044B\u0434\u0435\u043B\u0438\u0442\u0435 \u0444\u0440\u0435\u0439\u043C\u044B \u0438\u043B\u0438 \u0433\u0440\u0443\u043F\u043F\u044B \u043C\u0438\u0441\u0441\u0438\u0439 MAX");
    const anchors = {};
    const nodeIds = [...new Set(message.comments.map((c) => {
      var _a;
      return (_a = c.client_meta) == null ? void 0 : _a.node_id;
    }).filter((id) => typeof id === "string"))];
    if (nodeIds.length > 3e3) throw Error("\u0421\u043B\u0438\u0448\u043A\u043E\u043C \u043C\u043D\u043E\u0433\u043E \u043F\u0440\u0438\u0432\u044F\u0437\u0430\u043D\u043D\u044B\u0445 \u0443\u0437\u043B\u043E\u0432 \u0434\u043B\u044F \u043E\u0434\u043D\u043E\u0433\u043E \u044D\u043A\u0441\u043F\u043E\u0440\u0442\u0430");
    for (let i = 0; i < nodeIds.length; i += 20) {
      await Promise.all(nodeIds.slice(i, i + 20).map(async (id) => {
        try {
          const node = await figma.getNodeByIdAsync(id);
          if (!node) return;
          let owner = node;
          while (owner && owner.type !== "PAGE") owner = owner.parent;
          if (!owner) return;
          anchors[id] = { nodeId: id, name: node.name, pageId: owner.id, ancestorIds: ancestors2(node), absoluteTransform: MAXReview.validTransform(node.absoluteTransform) ? node.absoluteTransform.map((row) => [...row]) : null };
        } catch (e) {
          warnings.push({ nodeId: id, reason: "unavailable-comment-anchor" });
        }
      }));
      if (reviewCancelled) throw Error("\u042D\u043A\u0441\u043F\u043E\u0440\u0442 \u043E\u0441\u0442\u0430\u043D\u043E\u0432\u043B\u0435\u043D");
      if (figma.currentPage !== page) throw Error("\u0421\u0442\u0440\u0430\u043D\u0438\u0446\u0430 \u0438\u0437\u043C\u0435\u043D\u0438\u043B\u0430\u0441\u044C. \u041F\u043E\u0432\u0442\u043E\u0440\u0438\u0442\u0435 \u044D\u043A\u0441\u043F\u043E\u0440\u0442 \u043D\u0430 \u043D\u0443\u0436\u043D\u043E\u0439 \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u0435");
    }
    for (const screen of screens) {
      const node = await figma.getNodeByIdAsync(screen.nodeId);
      if (!node || node.removed) throw Error("\u0412\u044B\u0431\u0440\u0430\u043D\u043D\u044B\u0439 \u044D\u043A\u0440\u0430\u043D \u0443\u0434\u0430\u043B\u0451\u043D. \u041F\u043E\u0432\u0442\u043E\u0440\u0438\u0442\u0435 \u044D\u043A\u0441\u043F\u043E\u0440\u0442");
      const b = node.absoluteBoundingBox;
      if (!b) throw Error("\u0423 \u044D\u043A\u0440\u0430\u043D\u0430 \u043D\u0435\u0442 \u0433\u0435\u043E\u043C\u0435\u0442\u0440\u0438\u0438");
      screen.bounds = { x: b.x, y: b.y, width: b.width, height: b.height };
      screen.width = node.width;
      screen.height = node.height;
      screen.absoluteTransform = node.absoluteTransform.map((row) => [...row]);
      screen.name = node.name;
      screen.ancestorIds = ancestors2(node);
    }
    if (reviewCancelled) throw Error("\u042D\u043A\u0441\u043F\u043E\u0440\u0442 \u043E\u0441\u0442\u0430\u043D\u043E\u0432\u043B\u0435\u043D");
    if (figma.currentPage !== page) throw Error("\u0421\u0442\u0440\u0430\u043D\u0438\u0446\u0430 \u0438\u0437\u043C\u0435\u043D\u0438\u043B\u0430\u0441\u044C. \u041F\u043E\u0432\u0442\u043E\u0440\u0438\u0442\u0435 \u044D\u043A\u0441\u043F\u043E\u0440\u0442");
    const result = MAXReview.assemble({ page: { id: page.id, name: page.name }, selectedNodeIds: selected.map((n) => n.id), screens, anchors, warnings }, message.comments, { fileKey: message.fileKey, assumeCurrentPage: message.assumeCurrentPage === true, fetchedAt: message.fetchedAt });
    figma.ui.postMessage({ type: "review-result", requestId: message.requestId, result });
  } finally {
    reviewBusy = false;
  }
}
figma.showUI(__html__, { width: 540, height: 720, themeColors: true });
figma.root.setRelaunchData({ open: "\u0421\u043E\u0431\u0440\u0430\u0442\u044C \u044D\u043A\u0440\u0430\u043D\u044B MAX \u0438\u0437 \u0438\u0441\u0445\u043E\u0434\u043D\u0438\u043A\u043E\u0432 \u0438\u0433\u0440\u044B" });
let run = null;
function decode(url) {
  const input = url.slice(url.indexOf(",") + 1), chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/", out = [];
  let bits = 0, value = 0;
  for (const c of input) {
    if (c === "=") break;
    const n = chars.indexOf(c);
    if (n < 0) continue;
    value = value << 6 | n;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      out.push(value >> bits & 255);
    }
  }
  return new Uint8Array(out);
}
function raster(parent, name, url, x, y, w, h) {
  if (typeof url !== "string" || !url.startsWith("data:image/png;base64,") || url.length > 24e6) throw Error("\u041D\u0435\u043A\u043E\u0440\u0440\u0435\u043A\u0442\u043D\u044B\u0439 PNG");
  const n = figma.createRectangle();
  parent.appendChild(n);
  n.name = name;
  n.resize(w, h);
  n.x = x;
  n.y = y;
  n.fills = [{ type: "IMAGE", scaleMode: "FILL", imageHash: figma.createImage(decode(url)).hash }];
  return n;
}
async function findFonts() {
  var _a;
  const fonts = await figma.listAvailableFontsAsync(), available = fonts.filter((f) => f.fontName.family.toLowerCase() === "max sans");
  const found = {};
  for (const [weight, pattern] of [["400", /regular/i], ["500", /medium/i], ["600", /demi|semi/i]]) {
    const font = (_a = available.find((f) => pattern.test(f.fontName.style))) == null ? void 0 : _a.fontName;
    if (font) {
      try {
        await figma.loadFontAsync(font);
        found[weight] = font;
      } catch (e) {
      }
    }
  }
  return found;
}
function color(css) {
  var _a;
  const values = ((_a = css.match(/[\d.]+/g)) == null ? void 0 : _a.map(Number)) || [255, 255, 255];
  return { r: values[0] / 255, g: values[1] / 255, b: values[2] / 255 };
}
async function appendScreen(s) {
  var _a;
  if (!run || run.count >= run.total || !Number.isInteger(s.width) || s.width < 1600 || s.width > 3600 || s.height !== 1e3 || !Array.isArray(s.layers) || s.layers.length > 1200) throw Error("\u041D\u0435\u043A\u043E\u0440\u0440\u0435\u043A\u0442\u043D\u043E\u0435 \u0441\u043E\u0441\u0442\u043E\u044F\u043D\u0438\u0435 \u044D\u043A\u0440\u0430\u043D\u0430");
  let g = run.groups.get(s.group);
  if (!g) {
    const frame2 = figma.createFrame();
    run.page.appendChild(frame2);
    frame2.name = s.group;
    frame2.fills = [];
    frame2.clipsContent = false;
    frame2.x = run.origin.x + run.groups.size * (run.groupWidth + 240);
    frame2.y = run.origin.y;
    frame2.resize(run.groupWidth, 1e3);
    g = { frame: frame2, count: 0 };
    run.groups.set(s.group, g);
  }
  const frame = figma.createFrame();
  g.frame.appendChild(frame);
  frame.name = s.name;
  frame.resize(s.width, s.height);
  frame.clipsContent = true;
  frame.x = g.count % 3 * (run.cellWidth + 80);
  frame.y = Math.floor(g.count / 3) * 1080;
  frame.fills = [];
  try {
    frame.setPluginData("max-source", JSON.stringify({ edition: s.edition, id: s.id, mission: s.mission, kind: s.kind, step: s.step, stage: s.stage, branch: s.branch, device: s.device, media: s.media, revision: run.revision }));
    raster(frame, "WebGL \xB7 \u0444\u043E\u043D, Frost, \u0432\u043E\u043B\u043E\u043A\u043D\u0430 \u0438 \u043F\u043E\u0432\u0435\u0440\u0445\u043D\u043E\u0441\u0442\u0438", s.base, 0, 0, s.width, s.height);
    for (const part of s.layers) {
      if (![part.x, part.y, part.w, part.h, part.opacity].every(Number.isFinite) || part.w <= 0 || part.h <= 0) throw Error("\u041D\u0435\u043A\u043E\u0440\u0440\u0435\u043A\u0442\u043D\u0430\u044F \u0433\u0435\u043E\u043C\u0435\u0442\u0440\u0438\u044F \u0441\u043B\u043E\u044F");
      let n;
      if (part.kind === "svg") {
        n = figma.createNodeFromSvg(part.svg);
        frame.appendChild(n);
        n.name = "SVG \xB7 " + (((_a = part.svg.match(/data-icon="([^"]+)/)) == null ? void 0 : _a[1]) || "\u0438\u0441\u0445\u043E\u0434\u043D\u0438\u043A \u0438\u0433\u0440\u044B");
        n.resize(part.w, part.h);
        n.x = part.x;
        n.y = part.y;
      } else if (part.kind === "text" && run.editable && run.fonts[part.weight]) {
        n = figma.createText();
        frame.appendChild(n);
        n.fontName = run.fonts[part.weight];
        n.fontSize = part.fontSize;
        n.characters = part.text;
        n.name = part.text;
        n.textAutoResize = "WIDTH_AND_HEIGHT";
        n.fills = [{ type: "SOLID", color: color(part.color) }];
        n.x = part.x + 4;
        n.y = part.y + 4;
        const ls = parseFloat(part.letterSpacing);
        if (Number.isFinite(ls)) n.letterSpacing = { unit: "PIXELS", value: ls };
      } else {
        n = raster(frame, part.kind === "text" ? part.text : "\u0418\u0437\u043E\u0431\u0440\u0430\u0436\u0435\u043D\u0438\u0435 \u0438\u0437 \u0438\u0433\u0440\u044B", part.png, part.x, part.y, part.w, part.h);
        if (part.kind === "text") n.setPluginData("text", JSON.stringify({ characters: part.text, fontFamily: "Max Sans", fontSize: part.fontSize, weight: part.weight }));
      }
      n.opacity = Math.max(0, Math.min(1, part.opacity));
    }
    if (run.reference) {
      const n = raster(frame, "\u042D\u0442\u0430\u043B\u043E\u043D \xB7 \u043F\u043E\u043B\u043D\u044B\u0439 \u043A\u0430\u0434\u0440 \u0438\u0433\u0440\u044B (\u0432\u043A\u043B\u044E\u0447\u0438\u0442\u044C \u0434\u043B\u044F \u0441\u0440\u0430\u0432\u043D\u0435\u043D\u0438\u044F)", s.reference, 0, 0, s.width, s.height);
      n.visible = false;
      n.locked = true;
    }
    frame.setRelaunchData({ open: "\u0421\u043E\u0437\u0434\u0430\u0442\u044C \u043D\u043E\u0432\u044B\u0439 \u043D\u0430\u0431\u043E\u0440 \u044D\u043A\u0440\u0430\u043D\u043E\u0432" });
    g.count++;
    g.frame.resize(run.groupWidth, Math.ceil(g.count / 3) * 1080);
    run.count++;
    figma.ui.postMessage({ type: "screen-added", id: s.id, count: run.count });
  } catch (e) {
    frame.remove();
    throw e;
  }
}
figma.ui.onmessage = async (m) => {
  var _a;
  try {
    if (m.type === "review-init") {
      figma.ui.postMessage({ type: "review-init", fileKey: reviewFileKey(), pageName: figma.currentPage.name });
    } else if (m.type === "review-cancel") {
      reviewCancelled = true;
    } else if (m.type === "review-export") {
      await exportReview(m);
    } else if (m.type === "start") {
      if (reviewBusy) throw Error("\u0414\u043E\u0436\u0434\u0438\u0442\u0435\u0441\u044C \u044D\u043A\u0441\u043F\u043E\u0440\u0442\u0430 \u043A\u043E\u043C\u043C\u0435\u043D\u0442\u0430\u0440\u0438\u0435\u0432");
      if (run) throw Error("\u041F\u0440\u0435\u0434\u044B\u0434\u0443\u0449\u0438\u0439 \u043D\u0430\u0431\u043E\u0440 \u0435\u0449\u0451 \u0441\u043E\u0437\u0434\u0430\u0451\u0442\u0441\u044F");
      if (!Number.isInteger(m.total) || m.total < 1 || m.total > 450) throw Error("\u041D\u0443\u0436\u043D\u043E \u043E\u0442 1 \u0434\u043E 450 \u044D\u043A\u0440\u0430\u043D\u043E\u0432");
      const page = figma.currentPage;
      const fonts = m.editable ? await findFonts() : {};
      const bounds = page.children.map((n) => n.absoluteRenderBounds || n.absoluteBoundingBox).filter(Boolean);
      const origin = bounds.length ? { x: Math.max(...bounds.map((b) => b.x + b.width)) + 240, y: Math.min(...bounds.map((b) => b.y)) } : { x: figma.viewport.center.x, y: figma.viewport.center.y };
      const cellWidth = Math.max(1600, Math.min(3600, Number(m.maxWidth) || 1600));
      run = { page, origin, total: m.total, count: 0, groups: /* @__PURE__ */ new Map(), fonts, editable: m.editable, reference: m.reference, revision: m.revision, cellWidth, groupWidth: 3 * cellWidth + 160 };
      figma.ui.postMessage({ type: "started", fontAvailable: !!fonts["400"] });
    } else if (m.type === "screen") {
      await appendScreen(m.screen);
    } else if (m.type === "finish" || m.type === "cancel") {
      if (run) {
        const first = (_a = [...run.groups.values()][0]) == null ? void 0 : _a.frame;
        if (first && figma.currentPage === run.page) {
          run.page.selection = [first];
          figma.viewport.scrollAndZoomIntoView(first.children.slice(0, 3));
        }
        const count = run.count;
        run = null;
        figma.ui.postMessage({ type: "finished", count, cancelled: m.type === "cancel" });
        figma.notify(m.type === "cancel" ? `\u041E\u0441\u0442\u0430\u043D\u043E\u0432\u043B\u0435\u043D\u043E. \u0421\u043E\u0445\u0440\u0430\u043D\u0435\u043D\u043E \u044D\u043A\u0440\u0430\u043D\u043E\u0432: ${count}` : `\u0413\u043E\u0442\u043E\u0432\u043E: ${count} \u044D\u043A\u0440\u0430\u043D\u043E\u0432 MAX`);
      }
    }
  } catch (error) {
    figma.ui.postMessage({ type: m.type === "review-export" ? "review-error" : "error", requestId: m.requestId, error: error.message });
  }
};

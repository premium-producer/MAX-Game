// Pure route model shared by the evaluator and the footer. Geometrically valid
// links anchor a component even while their live signal is waking up.
export function buildRouteLayout(ordered, links, from, to, capacity) {
  const count = Math.max(capacity, ordered.length);
  const start = `endpoint:${from}`, end = `endpoint:${to}`;
  const byId = new Map(ordered.map((node) => [node.id, node]));
  const adjacency = new Map([...byId.keys(), start, end].map((id) => [id, new Set()]));
  const accepted = links.filter((link) => !link.closing && adjacency.has(link.a) && adjacency.has(link.b));
  for (const { a, b } of accepted) { adjacency.get(a).add(b); adjacency.get(b).add(a); }
  const rank = new Map(ordered.map((node, index) => [node.id, index]));
  const visited = new Set(), groups = [];
  for (const node of ordered) {
    if (visited.has(node.id)) continue;
    const pending = [node.id], ids = new Set();
    while (pending.length) {
      const id = pending.pop();
      if (visited.has(id)) continue;
      visited.add(id); ids.add(id);
      for (const next of adjacency.get(id)) if (!visited.has(next)) pending.push(next);
    }
    const nodes = [...ids].filter((id) => byId.has(id)).sort((a, b) => rank.get(a) - rank.get(b)).map((id) => byId.get(id));
    groups.push({ anchor: ids.has(start) ? (ids.has(end) ? "both" : "from") : ids.has(end) ? "to" : "free", nodes });
  }
  const left = groups.filter((g) => g.anchor === "from" || g.anchor === "both");
  const right = groups.filter((g) => g.anchor === "to");
  const free = groups.filter((g) => g.anchor === "free");
  const size = (list) => list.reduce((n, g) => n + g.nodes.length, 0);
  const leftSize = size(left), rightSize = size(right), freeSize = size(free);
  const items = [];
  const place = (list, offset) => {
    for (const group of list) {
      group.offset = offset;
      for (const node of group.nodes) items.push({ node, position: offset++, anchor: group.anchor });
    }
  };
  place(left, 0);
  place(free, leftSize + Math.floor((count - leftSize - rightSize - freeSize) / 2));
  place(right, count - rightSize);
  const positions = new Map([[start, -1], [end, count], ...items.map(({ node, position }) => [node.id, position])]);
  const connections = accepted.map((link) => ({ ...link, fromPosition: positions.get(link.a), toPosition: positions.get(link.b) }));
  return { count, groups: [...left, ...free, ...right], items, connections };
}

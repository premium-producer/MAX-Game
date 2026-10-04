// Bounds consist of a projected world rectangle plus fixed-size DOM margins.
// World geometry scales with camera zoom; mission cards must keep their size.
export function fitMissionMarkerSafeArea(rects, area, width, height, preferredX, preferredY, out = {}) {
  let zoom = 1;
  for (const a of rects) for (const b of rects) {
    const dx = b.right - a.left, dy = b.bottom - a.top;
    if (dx > 0) zoom = Math.min(zoom, (area.right - area.left - a.padLeft - b.padRight) / dx);
    if (dy > 0) zoom = Math.min(zoom, (area.bottom - area.top - a.padTop - b.padBottom) / dy);
  }
  zoom = Math.max(0.001, zoom);
  let minX = -Infinity, maxX = Infinity, minY = -Infinity, maxY = Infinity;
  for (const r of rects) {
    minX = Math.max(minX, area.left - (width / 2 + (r.left - width / 2) * zoom - r.padLeft));
    maxX = Math.min(maxX, area.right - (width / 2 + (r.right - width / 2) * zoom + r.padRight));
    minY = Math.max(minY, area.top - (height / 2 + (r.top - height / 2) * zoom - r.padTop));
    maxY = Math.min(maxY, area.bottom - (height / 2 + (r.bottom - height / 2) * zoom + r.padBottom));
  }
  out.zoom = zoom;
  out.x = Math.max(minX, Math.min(maxX, preferredX));
  out.y = Math.max(minY, Math.min(maxY, preferredY));
  return out;
}

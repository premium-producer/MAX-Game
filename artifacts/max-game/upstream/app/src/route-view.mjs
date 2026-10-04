// Fixed footer grid. The live network stays immediate; this view publishes the
// latest snapshot once per accumulation window, without a trailing debounce.
export const ROUTE_BATCH_MS = 200;
export const ROUTE_FADE_MS = 80;

export function createRouteBatch(commit, { schedule = setTimeout, cancel = clearTimeout } = {}) {
  let timer = null, latest = null, shown = null, disposed = false;
  const flush = () => {
    timer = null;
    if (disposed || !latest || latest.key === shown) return;
    shown = latest.key; commit(latest.value);
  };
  return {
    push(key, value, immediate = false) {
      if (disposed) return;
      latest = { key, value };
      if (shown === null || immediate) { if (timer !== null) cancel(timer); timer = null; flush(); }
      else if (key !== shown && timer === null) timer = schedule(flush, ROUTE_BATCH_MS);
    },
    dispose() { disposed = true; if (timer !== null) cancel(timer); timer = null; latest = null; },
  };
}

export function disposeRouteTrack(track) {
  track?.routeBatch?.dispose();
  if (track) track.routeGeneration = (track.routeGeneration || 0) + 1;
  for (const slot of track?.routeSlots || []) { slot.routeAnimation?.cancel(); slot.routeAnimation = null; }
}

export function updateRouteTrack(track, layout, network, renderIcon, animate = () => null, options = {}) {
  if (!track) return;
  if (!track.routeSlots || track.routeSlots.length !== layout.count) {
    disposeRouteTrack(track);
    track.replaceChildren(); track.routeSlots = []; track.routeEdges = [];
    track.style.setProperty('--route-count', layout.count);
    track.style.setProperty('--route-grid-columns', Array.from({ length: layout.count }, () => 'minmax(0, 1fr)').join(' 20px '));
    for (let i = 0; i < layout.count; i++) {
      if (i) {
        const arrow = track.ownerDocument.createElement('span');
        arrow.className = 'route-arrow route-edge'; arrow.textContent = '→';
        arrow.setAttribute('aria-hidden', 'true'); track.append(arrow); track.routeEdges.push(arrow);
      }
      const slot = track.ownerDocument.createElement('div');
      slot.className = 'route-slot'; slot.dataset.routeIndex = String(i);
      const content = track.ownerDocument.createElement('div'); content.className = 'route-cell-content';
      slot.append(content); slot.routeContent = content;
      track.append(slot); track.routeSlots.push(slot);
    }
    track.routeBatch = createRouteBatch((snapshot) => {
      if (track.isConnected === false) return;
      const generation = track.routeGeneration;
      track.routeNodes = new Map();
      const occupied = new Map(snapshot.items.map((item) => [item.position, item]));
      for (const slot of track.routeSlots) {
        const item = occupied.get(Number(slot.dataset.routeIndex));
        const contentKey = item ? JSON.stringify([item.id, item.type]) : '';
        if (item) track.routeNodes.set(String(item.id), slot);
        slot.classList.toggle('is-correct', item?.state === 'link');
        slot.classList.toggle('is-wrong', item?.state === 'wrong');
        slot.classList.toggle('is-filled', Boolean(item));
        slot.dataset.anchor = item?.anchor || '';
        if (item) slot.dataset.placementId = String(item.id); else delete slot.dataset.placementId;
        if (slot.routeTargetKey === contentKey) continue;
        slot.routeTargetKey = contentKey;
        const slotGeneration = slot.routeGeneration = (slot.routeGeneration || 0) + 1;
        slot.routeAnimation?.cancel(); slot.routeAnimation = null;
        if (slot.dataset.contentKey === contentKey) continue;
        const content = slot.routeContent;
        const replace = () => {
          if (track.routeGeneration !== generation || slot.routeGeneration !== slotGeneration || track.isConnected === false) return;
          slot.dataset.contentKey = contentKey;
          content.innerHTML = item ? renderIcon(item.type) : '';
          slot.routeAnimation = item ? animate(content, [{ opacity: 0 }, { opacity: 1 }]) : null;
        };
        const outgoing = content.innerHTML ? animate(content, [{ opacity: 1 }, { opacity: 0 }]) : null;
        slot.routeAnimation = outgoing;
        if (outgoing?.finished) outgoing.finished.then(() => { outgoing.cancel(); replace(); }, () => {});
        else replace();
      }
      for (let i = 0; i < track.routeEdges.length; i++) {
        const connected = snapshot.connections.some((edge) => edge.active !== false && !edge.endpoint && edge.fromPosition === i && edge.toPosition === i + 1);
        track.routeEdges[i].classList.toggle('is-connected', connected);
      }
      snapshot.onCommit?.(snapshot);
    }, options);
  }
  // Copy values: the renderer/projector may reuse mutable buffers during motion.
  const items = layout.items.map(({ node, position, anchor }) => ({ id: node.id, type: node.type, position, anchor, state: network?.states?.[node.id] || 'base' }));
  const connections = layout.connections.map(({ a, b, fromPosition, toPosition, endpoint, active }) => ({ a, b, fromPosition, toPosition, endpoint, active }));
  const key = JSON.stringify([options.identity ?? null, items, connections]);
  track.routeBatch.push(key, { items, connections, onCommit: options.onCommit }, options.immediate);
}

const clamp = (value, low, high) => Math.min(high, Math.max(low, value));

// Touch/wheel/keyboard use native scrolling; mouse/pen can swipe in tap mode.
export function createInventoryScroll({ list, canSwipe = () => true, events = window,
  reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches }) {
  let gesture = null, suppressClick = false, autoScrolling = false, disposed = false;
  let previous = new Map();
  const maxScroll = () => Math.max(0, list.scrollHeight - list.clientHeight);
  const scale = () => list.getBoundingClientRect().height / Math.max(1, list.offsetHeight) || 1;
  function stopAuto() {
    if (autoScrolling) list.scrollTo({ top: list.scrollTop, behavior: "instant" });
    autoScrolling = false;
  }
  function finish() {
    const ended = gesture;
    gesture = null;
    if (ended && list.hasPointerCapture(ended.id)) list.releasePointerCapture(ended.id);
  }
  function down(event) {
    stopAuto();
    suppressClick = false;
    if (gesture) { finish(); return; }
    if (event.button !== 0 || event.isPrimary === false) return;
    gesture = { id: event.pointerId, x: event.clientX, y: event.clientY, top: list.scrollTop,
      manual: event.pointerType !== "touch" && canSwipe(), swiping: false };
  }
  function move(event) {
    if (!gesture || gesture.id !== event.pointerId || !gesture.manual) return;
    const dy = event.clientY - gesture.y;
    if (!gesture.swiping) {
      if (Math.abs(dy) <= 8 || Math.abs(dy) < Math.abs(event.clientX - gesture.x)) return;
      gesture.swiping = true;
      suppressClick = true;
      list.setPointerCapture(event.pointerId);
    }
    list.scrollTop = clamp(gesture.top - dy / scale(), 0, maxScroll());
    event.preventDefault();
  }
  function up(event) {
    if (gesture?.id !== event.pointerId) return;
    move(event);
    finish();
  }
  function cancel(event) {
    if (gesture?.id !== event.pointerId) return;
    suppressClick = false;
    finish();
  }
  function click(event) {
    if (!suppressClick) return;
    suppressClick = false;
    event.preventDefault();
    event.stopImmediatePropagation();
  }
  function key() { suppressClick = false; stopAuto(); }
  function sync() {
    if (disposed) return;
    const cards = [...list.children];
    const replaced = cards.length !== previous.size || cards.some((card) => !previous.has(card));
    const exhausted = replaced ? -1 : cards.findIndex((card) => previous.get(card) === false && card.disabled);
    previous = new Map(cards.map((card) => [card, card.disabled]));
    if (replaced) { stopAuto(); finish(); return; }
    if (exhausted < 0 || gesture) return;
    let target = null;
    // Nearest in menu order; equal distance prefers the next card.
    for (let distance = 1; distance < cards.length && !target; distance++) {
      for (const index of [exhausted + distance, exhausted - distance]) {
        if (cards[index] && !cards[index].disabled) { target = cards[index]; break; }
      }
    }
    if (!target) return;
    const top = clamp(list.scrollTop + (target.getBoundingClientRect().top - list.getBoundingClientRect().top) / scale(), 0, maxScroll());
    autoScrolling = !reducedMotion();
    list.scrollTo({ top, behavior: autoScrolling ? "smooth" : "instant" });
  }
  const observer = new MutationObserver(sync);
  observer.observe(list, { childList: true, subtree: true, attributes: true, attributeFilter: ["disabled"] });
  list.addEventListener("pointerdown", down, true);
  list.addEventListener("click", click, true);
  list.addEventListener("wheel", stopAuto, { passive: true });
  list.addEventListener("keydown", key);
  list.addEventListener("lostpointercapture", cancel);
  events.addEventListener("pointermove", move, { passive: false });
  events.addEventListener("pointerup", up);
  events.addEventListener("pointercancel", cancel);
  sync();
  return { sync, dispose() {
    disposed = true; stopAuto(); finish(); observer.disconnect();
    list.removeEventListener("pointerdown", down, true);
    list.removeEventListener("click", click, true);
    list.removeEventListener("wheel", stopAuto);
    list.removeEventListener("keydown", key);
    list.removeEventListener("lostpointercapture", cancel);
    events.removeEventListener("pointermove", move);
    events.removeEventListener("pointerup", up);
    events.removeEventListener("pointercancel", cancel);
  } };
}

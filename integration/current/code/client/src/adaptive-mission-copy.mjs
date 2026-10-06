const cache = new WeakMap();
const COPY_SELECTOR = ".mission-description, .mission-summary";

export function candidateCopyWidths(baseWidth) {
  if (!Number.isFinite(baseWidth) || baseWidth <= 48) return [];
  const widths = [baseWidth];
  for (let delta = 4; delta <= 24; delta += 4) widths.push(baseWidth - delta, baseWidth + delta);
  return widths;
}

export function chooseCopyWidth(candidates, baseWidth) {
  const acceptable = candidates.filter((entry) => !entry.overflow && Number.isFinite(entry.maxGapRatio));
  acceptable.sort((a, b) => a.maxGapRatio - b.maxGapRatio || Math.abs(a.width - baseWidth) - Math.abs(b.width - baseWidth));
  return acceptable[0] || { width: baseWidth };
}

// Run only after font preparation/content changes, never in the Earth render loop.
export function adaptMissionCopy(root) {
  if (root?.dataset?.missionTextLayout !== "adaptive") return;
  const document = root.ownerDocument;
  if (document.fonts?.status === "loading") return;
  for (const copy of root.querySelectorAll(COPY_SELECTOR)) {
    const card = copy.matches(".mission-summary") ? copy.closest(".mission-marker") : copy;
    if (!card?.parentElement) continue;
    const styles = document.defaultView.getComputedStyle(copy);
    const previous = cache.get(copy);
    const baseWidth = previous?.baseWidth ?? parseFloat(document.defaultView.getComputedStyle(card).width);
    const signature = `${copy.textContent}|${styles.font}|${styles.letterSpacing}|${baseWidth}`;
    if (previous?.signature === signature) continue;

    const clone = card.cloneNode(true);
    const sample = card === copy ? clone : clone.querySelector(".mission-summary");
    clone.removeAttribute("id");
    for (const child of clone.querySelectorAll("[id]")) child.removeAttribute("id");
    clone.setAttribute("aria-hidden", "true");
    clone.inert = true;
    Object.assign(clone.style, { visibility: "hidden", pointerEvents: "none", transition: "none", animation: "none", transform: "none" });
    sample.style.removeProperty("text-align");
    card.parentElement.append(clone);
    try {
      const probe = document.createElement("span");
      probe.textContent = " ";
      probe.style.cssText = "position:absolute;display:block;white-space:pre;font:inherit;letter-spacing:inherit;width:auto;max-width:none";
      sample.append(probe);
      const normalSpace = probe.getBoundingClientRect().width;
      probe.remove();
      if (!(normalSpace > 0)) continue;

      const ranges = spaceNeighbours(sample);
      const candidates = [];
      for (const width of candidateCopyWidths(baseWidth)) {
        clone.style.width = `${width}px`;
        const maxGapRatio = largestGap(ranges, normalSpace);
        candidates.push({ width, maxGapRatio, overflow: sample.scrollWidth > sample.clientWidth + 1 });
      }
      const result = chooseCopyWidth(candidates, baseWidth);
      card.style.width = `${result.width}px`;
      // Justification is mandatory; only the width is negotiable.
      copy.style.textAlign = "justify";
      copy.dataset.copyFit = "justified";
      cache.set(copy, { baseWidth, signature });
    } finally {
      clone.remove();
    }
  }
}

function spaceNeighbours(element) {
  const document = element.ownerDocument;
  const walker = document.createTreeWalker(element, 4);
  const pairs = [];
  while (walker.nextNode()) {
    const node = walker.currentNode;
    for (const match of node.data.matchAll(/[ \u00a0]+/gu)) {
      const before = match.index - 1, after = match.index + match[0].length;
      if (before < 0 || after >= node.length || /\s/u.test(node.data[before]) || /\s/u.test(node.data[after])) continue;
      const left = document.createRange(), right = document.createRange();
      left.setStart(node, before); left.setEnd(node, before + 1);
      right.setStart(node, after); right.setEnd(node, after + 1);
      pairs.push([left, right]);
    }
  }
  return pairs;
}

function largestGap(pairs, normalSpace) {
  let maximum = 1;
  for (const [leftRange, rightRange] of pairs) {
    const left = [...leftRange.getClientRects()].at(-1), right = rightRange.getClientRects()[0];
    if (!left || !right || Math.abs(left.top - right.top) > Math.min(left.height, right.height) / 2) continue;
    maximum = Math.max(maximum, (right.left - left.right) / normalSpace);
  }
  return maximum;
}

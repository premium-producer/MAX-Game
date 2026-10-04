// Minimal deterministic DOM for the footer's actual renderer (no browser/GPU).
export function routeElement(width = 1000) {
  const element = { dataset: {}, children: [], clientWidth: width, className: "", innerHTML: "",
    style: { setProperty(key, value) { this[key] = value; } },
    classList: { values: new Set(), toggle(key, on) { if (on) this.values.add(key); else this.values.delete(key); }, contains(key) { return this.values.has(key); } },
    setAttribute(key, value) { this[key] = value; },
    append(child) { child.parent = this; this.children.push(child); },
    replaceChildren() { this.children = []; },
    remove() { this.parent.children = this.parent.children.filter((child) => child !== this); },
    querySelector() { return null; },
  };
  element.ownerDocument = { createElement: () => routeElement() };
  return element;
}

export function routeDom(width = 1000) {
  const track = routeElement(width), from = routeElement(), to = routeElement();
  const route = routeElement();
  route.querySelector = (selector) => ({ "[data-route-track]": track, "[data-route-from]": from, "[data-route-to]": to })[selector];
  return { route, track, from, to };
}

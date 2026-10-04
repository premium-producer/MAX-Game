// Shared visible game title for the loading screen and persistent shell.
export function brandTitleHtml(language, title, logoAlt, logoUrl = "./assets/nodes/logo-eng.svg") {
  if (language !== "en") return escapeHtml(title);
  return `<img class="brand-title-logo" src="${escapeHtml(logoUrl)}" alt="${escapeHtml(logoAlt)}" draggable="false" />`;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
}

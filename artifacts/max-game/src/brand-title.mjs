// Shared visible game title for the loading screen and persistent shell.
export function brandTitleHtml(language, title) {
  return escapeHtml(title);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
}

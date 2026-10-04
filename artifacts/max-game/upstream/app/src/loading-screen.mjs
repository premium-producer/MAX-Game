import { brandTitleHtml } from "./brand-title.mjs";

export class LoadingScreen {
  constructor(element) {
    this.element = element;
    this.title = element.querySelector("h1");
    this.status = element.querySelector("[data-loading-status]");
    this.progress = element.querySelector("progress");
    this.count = element.querySelector("[data-loading-count]");
    this.retry = element.querySelector("button");
    this.initialStatus = this.status.textContent;
    this.initialError = element.querySelector("[data-loading-error]").textContent;
    this.retry.addEventListener("click", () => location.reload());
    this.translate = null;
    this.startedAt = performance.now();
    this.phaseStartedAt = this.startedAt;
    this.phaseName = null;
    this.timings = {};
  }
  localize(translate, language = "ru") {
    this.translate = translate;
    document.title = translate("app.title");
    this.element.querySelector(".boot-brand").innerHTML = brandTitleHtml(language, translate("app.header.title"), translate("app.aria.logo"));
    this.title.textContent = translate("loading.title");
    this.retry.textContent = translate("loading.retry");
    this.progress.setAttribute("aria-label", translate("loading.progress"));
    if (this.phaseName) this.status.textContent = translate(`loading.${this.phaseName}`);
  }
  phase(name) {
    this.recordPhase();
    this.phaseName = name;
    this.status.textContent = this.translate ? this.translate(`loading.${name}`) : this.initialStatus;
    this.progress.removeAttribute("value");
    this.count.textContent = "";
    return (completed, total) => {
      this.progress.max = Math.max(1, total);
      this.progress.value = completed;
      this.count.textContent = `${completed} / ${total}`;
    };
  }
  fail(error) {
    this.element.hidden = false;
    this.element.setAttribute("aria-busy", "false");
    this.status.textContent = this.translate ? this.translate("loading.error") : this.initialError;
    this.progress.hidden = true;
    this.count.textContent = "";
    this.retry.hidden = false;
    this.retry.focus();
    console.error("[startup]", error);
  }
  recordPhase() {
    const now = performance.now();
    if (this.phaseName) this.timings[this.phaseName] = Math.round(now - this.phaseStartedAt);
    this.phaseStartedAt = now;
  }
  finish() {
    this.recordPhase();
    this.element.setAttribute("aria-busy", "false"); this.element.hidden = true;
    return { totalMs: Math.round(performance.now() - this.startedAt), phasesMs: { ...this.timings } };
  }
}

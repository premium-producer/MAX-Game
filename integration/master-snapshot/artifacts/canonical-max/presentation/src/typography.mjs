export const TYPOGRAPHY_PROFILES = Object.freeze(["body", "instruction", "heading", "button", "badge", "code"]);

const NBSP = "\u00A0";
const PROTECTED_TOKEN = /`[^`\n]+`|(?:https?:\/\/|www\.)[^\s]+|[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}|(?:[A-Za-z]:[\\/]|\.{0,2}\/)[^\s]+/gu;
const RU_SINGLE_LETTERS = new Set(["а", "в", "и", "к", "о", "с", "у", "я"]);
const RU_SHORT_WORDS = new Set(["во", "до", "за", "из", "ко", "на", "не", "об", "от", "по", "со"]);
const EN_SHORT_WORDS = new Set(["an", "the", "at", "by", "in", "of", "on", "or", "to"]);
const COMPACT_PROFILES = new Set(["instruction", "heading", "button"]);
const RU_UNITS = "(?:%|°[CFС]|мс|сек\\.?|мин\\.?|ч|мм|см|м|км|КБ|МБ|ГБ|кбит\\/с|Мбит\\/с)";

export function resolveMissionTextLayout(config, override) {
  return ["left", "justify", "justify-4", "adaptive"].includes(override) ? override : config?.typography?.missionTextLayout ?? "adaptive";
}

function isJustifiedMissionCopy(element) {
  return element.matches?.(".mission-description, .mission-summary")
    && element.closest?.('[data-mission-text-layout="justify"], [data-mission-text-layout="justify-4"], [data-mission-text-layout="adaptive"]');
}

export function inferTypographyProfile(key) {
  if (/(?:^|\.)(?:primary|start|finish|back|retry|leave|continue)$/.test(key)) return "button";
  if (/(?:^|\.)(?:status|number|time|step)(?:\.|$)/.test(key) || key.includes("eyebrow")) return "badge";
  if (/(?:^|\.)(?:title|name|learnMore)$/.test(key) || key.startsWith("screen.")) return "heading";
  if (/^onboarding\.steps\.\d+\.body$/.test(key) || key.includes(".objectives.") || key.startsWith("mission.feedback.")) return "instruction";
  return "body";
}

export function formatTypography(value, language, profile = "body") {
  const text = String(value ?? "");
  if (!TYPOGRAPHY_PROFILES.includes(profile)) throw new Error(`typography: неизвестный профиль ${profile}`);
  if (profile === "code" || !text || !["ru", "en"].includes(language)) return text;

  const protectedValues = [];
  let formatted = text.replace(PROTECTED_TOKEN, (token) => {
    const marker = `\uE000${protectedValues.length}\uE001`;
    protectedValues.push(token);
    return marker;
  });

  formatted = language === "ru"
    ? formatRussian(formatted, profile)
    : formatEnglish(formatted, profile);

  return formatted.replace(/\uE000(\d+)\uE001/gu, (_, index) => protectedValues[Number(index)]);
}

function formatRussian(text, profile) {
  let formatted = text
    .replace(/№[ \t]*(?=\d|\{)/gu, `№${NBSP}`)
    .replace(new RegExp(`(\\d+(?:[.,]\\d+)?) +(?=${RU_UNITS}(?=[\\s,.!?;:]|$))`, "gu"), `$1${NBSP}`);

  formatted = bindWordsToFollowingText(formatted, (word, source, offset) => {
    const normalized = word.toLocaleLowerCase("ru");
    if (RU_SINGLE_LETTERS.has(normalized)) {
      if ((word === "А" || word === "A") && precedingWord(source, offset).toLocaleLowerCase("ru").startsWith("точк")) return false;
      return true;
    }
    return ["instruction", "heading", "button"].includes(profile) && RU_SHORT_WORDS.has(normalized);
  });
  return formatted;
}

function formatEnglish(text, profile) {
  const withApostrophes = text
    .replace(/(?<=\p{L})'(?=\p{L})/gu, "’")
    .replace(/(\d+(?:[.,]\d+)?) +(?=(?:ms|s|min|h|mm|cm|m|km|KB|MB|GB|°[CF])(?:[\s,.!?;:]|$))/gu, `$1${NBSP}`);
  return bindWordsToFollowingText(withApostrophes, (word, source, offset) => {
    if (word === "I") return true;
    if (word === "A" && precedingWord(source, offset).toLocaleLowerCase("en") === "point") return false;
    return word.toLocaleLowerCase("en") === "a"
      || (COMPACT_PROFILES.has(profile) && EN_SHORT_WORDS.has(word.toLocaleLowerCase("en")));
  });
}

function bindWordsToFollowingText(text, shouldBind) {
  return text.replace(/(?:^|(?<=[\s([{«„“]))([\p{L}]+) +(?=\S)/gu, (match, word, offset, source) => (
    shouldBind(word, source, offset) ? `${word}${NBSP}` : match
  ));
}

function precedingWord(source, offset) {
  return source.slice(0, offset).match(/([\p{L}]+)\s*$/u)?.[1] || "";
}

export function lintWording(raw) {
  const errors = [];
  const warnings = [];
  const entries = raw?.entries && typeof raw.entries === "object" && !Array.isArray(raw.entries) ? raw.entries : {};
  for (const [key, translations] of Object.entries(entries)) {
    for (const language of ["ru", "en"]) {
      const value = translations?.[language];
      if (typeof value !== "string") continue;
      const location = `${key}.${language}`;
      addObjectiveCopyErrors(errors, value, language, location);
      addEditorialWarnings(warnings, value, language, key, location);
    }
  }
  return { errors, warnings };
}

export function auditTypographyLayout(root, language) {
  if (!root?.querySelectorAll) return [];
  const issues = [];
  const elements = root.querySelectorAll(".ui-copy-heading, .ui-copy-body, .ui-copy-instruction, .ui-copy-button, .ui-copy-badge, [data-copy-profile]");
  for (const element of elements) {
    const profile = element.dataset.copyProfile || (element.classList.contains("ui-copy-heading") ? "heading"
      : element.classList.contains("ui-copy-instruction") ? "instruction"
        : element.classList.contains("ui-copy-button") ? "button"
          : element.classList.contains("ui-copy-badge") ? "badge" : "body");
    if (element.scrollWidth > element.clientWidth + 1 || element.scrollHeight > element.clientHeight + 1) {
      issues.push({ code: "overflow", profile, element, message: "текст выходит за границы компонента" });
    }
    const lines = renderedWordLines(element);
    for (const line of lines.slice(0, -1)) {
      const lastWord = line.words.at(-1)?.text.replace(/[«»„“.,!?:;()[\]]/gu, "") || "";
      if (isUnsafeLineEnding(lastWord, language, profile)) {
        issues.push({ code: "hanging-word", profile, element, word: lastWord, message: `строка заканчивается коротким словом «${lastWord}»` });
      }
    }
    if (profile === "heading" && lines.length > 1) {
      const previousWidth = lines.at(-2)?.width || 0;
      const lastWidth = lines.at(-1)?.width || 0;
      if (previousWidth && lastWidth / previousWidth < 0.32) issues.push({ code: "heading-orphan", profile, element, message: "последняя строка заголовка слишком короткая" });
    }
  }
  return issues;
}

export function balanceShortSentenceStarts(root) {
  if (!root?.querySelectorAll) return 0;
  let inserted = 0;
  for (const element of root.querySelectorAll(".ui-copy-body, .ui-copy-instruction")) {
    if (isJustifiedMissionCopy(element)) {
      for (const br of element.querySelectorAll("br[data-copy-sentence-break]")) br.remove();
      continue;
    }
    if (element.querySelector?.("br[data-copy-sentence-break]")) continue;
    const candidates = findShortSentenceStartBreaks(renderedWordLines(element));
    for (const candidate of candidates.reverse()) {
      if (!candidate?.node?.parentNode) continue;
      const tail = candidate.start > 0 ? candidate.node.splitText(candidate.start) : candidate.node;
      const br = element.ownerDocument.createElement("br");
      br.dataset.copySentenceBreak = "";
      tail.parentNode.insertBefore(br, tail);
      inserted += 1;
    }
  }
  return inserted;
}

export function findShortSentenceStartBreaks(lines) {
  const breaks = [];
  for (const line of lines) {
    for (let index = 0; index < line.words.length - 1; index += 1) {
      if (!/[\p{L}\p{N}]\.[»”)]?$/u.test(line.words[index].text)) continue;
      const trailing = line.words.slice(index + 1);
      if (trailing.length <= 2) {
        breaks.push(trailing[0]);
        break;
      }
    }
  }
  return breaks;
}

function renderedWordLines(element) {
  const document = element.ownerDocument;
  if (!document?.createRange || !document?.createTreeWalker) return [];
  const showText = globalThis.NodeFilter?.SHOW_TEXT ?? 4;
  const walker = document.createTreeWalker(element, showText);
  const words = [];
  while (walker.nextNode()) {
    const node = walker.currentNode;
    for (const match of node.data.matchAll(/\S+/gu)) {
      const range = document.createRange();
      range.setStart(node, match.index);
      range.setEnd(node, match.index + match[0].length);
      const rects = [...range.getClientRects()];
      for (const [index, rect] of rects.entries()) {
        if (rect.width || rect.height) words.push({ text: index === rects.length - 1 ? match[0] : "", node, start: match.index, top: Math.round(rect.top), left: rect.left, right: rect.right });
      }
    }
  }
  const grouped = new Map();
  for (const word of words) {
    const line = grouped.get(word.top) || [];
    line.push(word);
    grouped.set(word.top, line);
  }
  return [...grouped.entries()].sort(([left], [right]) => left - right).map(([, lineWords]) => ({
    words: lineWords.sort((left, right) => left.left - right.left),
    width: Math.max(...lineWords.map((word) => word.right)) - Math.min(...lineWords.map((word) => word.left)),
  }));
}

function isUnsafeLineEnding(word, language, profile) {
  if (!word) return false;
  if (language === "en") return word === "I" || word.toLocaleLowerCase("en") === "a"
    || (COMPACT_PROFILES.has(profile) && EN_SHORT_WORDS.has(word.toLocaleLowerCase("en")));
  const normalized = word.toLocaleLowerCase("ru");
  return RU_SINGLE_LETTERS.has(normalized) || (["instruction", "heading", "button"].includes(profile) && RU_SHORT_WORDS.has(normalized));
}

function addObjectiveCopyErrors(errors, value, language, location) {
  const checks = [
    [/^\s|\s$/u, "outer-whitespace", "пробел в начале или конце строки"],
    [/\t/u, "tab", "табуляция в plain-text строке"],
    [/ {2,}/u, "double-space", "двойной обычный пробел"],
    [/\s+[,.!?:;]/u, "space-before-punctuation", "пробел перед знаком препинания"],
    [/&(?:[A-Za-z][A-Za-z0-9]+|#\d+|#x[0-9A-Fa-f]+);/u, "html-entity", "HTML entity в plain-text wording"],
    [/<\/?[A-Za-z][^>]*>/u, "html", "HTML в plain-text wording"],
    [/\p{L} +-[ \t]+\p{L}/u, "spaced-hyphen", "дефис с пробелами вместо тире"],
  ];
  if (language === "ru") {
    checks.push([/№(?![\u00A0\u202F])[ \t]*(?=\d|\{)/u, "number-sign-spacing", "после № требуется неразрывный пробел"]);
    checks.push([/\d(?:[.,]\d+)?%(?!\p{L})/u, "percent-spacing", "перед % требуется пробел"]);
  }
  for (const [pattern, code, message] of checks) if (pattern.test(value)) errors.push({ level: "error", code, location, message });
  for (const [open, close, name] of [["«", "»", "кавычки-ёлочки"], ["“", "”", "английские кавычки"], ["(", ")", "круглые скобки"], ["[", "]", "квадратные скобки"]]) {
    if (count(value, open) !== count(value, close)) errors.push({ level: "error", code: "unpaired-delimiter", location, message: `непарные ${name}` });
  }
}

function addEditorialWarnings(warnings, value, language, key, location) {
  const profile = inferTypographyProfile(key);
  if (/"[^"\n]+"/u.test(value)) warnings.push({ level: "warning", code: "straight-quotes", location, message: "прямые кавычки в пользовательском тексте" });
  if (/[!?]{2,}/u.test(value)) warnings.push({ level: "warning", code: "repeated-punctuation", location, message: "повторяющийся знак ! или ?" });
  const isMissionDescription = /^content\.missions\.[^.]+\.description$/u.test(key);
  if (!isMissionDescription && /\.(?:[ \t]*(?:\n|$)| +(?=\p{Lu}))/u.test(value)) warnings.push({ level: "warning", code: "terminal-period", location, message: "точка вне подробного описания миссии" });
  // The 24px onboarding heading spans the stage, unlike compact card titles.
  const lengthBudget = key === "onboarding.title" ? 110 : { button: 44, heading: 82, badge: 34 }[profile];
  if (lengthBudget && value.replace(/\{[^}]+\}/g, "000").length > lengthBudget) warnings.push({ level: "warning", code: "length-budget", location, message: `строка длиннее бюджета профиля ${profile} (${lengthBudget})` });
  const weak = language === "ru" ? /\b(?:осуществить|произвести|имеется возможность)\b/iu : /\b(?:you can|in order to)\b/iu;
  if (weak.test(value)) warnings.push({ level: "warning", code: "weak-wording", location, message: "формулировка требует редакторской проверки" });
}

function count(value, token) {
  return value.split(token).length - 1;
}

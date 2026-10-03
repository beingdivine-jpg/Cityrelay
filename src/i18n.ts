import { useSyncExternalStore } from "react";
import polish from "./locales/pl.json";
import polishPatterns from "./locales/pl-patterns.json";
export type Language = "en" | "pl";
export const LANGUAGE_KEY = "elsewhere.language";
const messages: Record<string, string> = polish;
const caseMessages = new Map(
  Object.entries(messages).map(([k, v]) => [k.toLowerCase(), v]),
);
const normalize = (text: string) => text.replace(/\s+/g, " ").trim();
let language: Language = "en";
try {
  if (
    typeof window !== "undefined" &&
    localStorage.getItem(LANGUAGE_KEY) === "pl"
  )
    language = "pl";
} catch {
  /* Language switching still works without storage. */
}
const listeners = new Set<() => void>();
export const getLanguage = () => language;
export const locale = () => (language === "pl" ? "pl-PL" : "en-GB");
export function setLanguage(next: Language) {
  language = next;
  try {
    localStorage.setItem(LANGUAGE_KEY, next);
  } catch {
    /* Keep the selection for this session. */
  }
  if (typeof document !== "undefined") document.documentElement.lang = next;
  listeners.forEach((listener) => listener());
}
function subscribe(listener: () => void) {
  listeners.add(listener);
  const sync = (event: StorageEvent) => {
    if (
      event.key === LANGUAGE_KEY &&
      (event.newValue === "pl" || event.newValue === "en")
    ) {
      language = event.newValue;
      document.documentElement.lang = language;
      listeners.forEach((fn) => fn());
    }
  };
  if (typeof window !== "undefined") window.addEventListener("storage", sync);
  return () => {
    listeners.delete(listener);
    if (typeof window !== "undefined")
      window.removeEventListener("storage", sync);
  };
}
export function useLanguage() {
  return useSyncExternalStore(subscribe, getLanguage, () => "en" as Language);
}
if (typeof document !== "undefined") document.documentElement.lang = language;
// Only known product messages are translated. Unrecognized prose is retained verbatim.
const escapeRegex = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const patterns = Object.entries(polishPatterns).map(([source, translation]) => {
  const slots: string[] = [];
  const expression = source
    .split(/(\{\d+\})/)
    .map((part) => {
      if (/^\{\d+\}$/.test(part)) {
        slots.push(part);
        return "(.*?)";
      }
      return escapeRegex(part);
    })
    .join("");
  return {
    regex: new RegExp("^" + expression + "$"),
    multiline:
      source.includes("eligible submissions inform") ||
      source.includes("topic-relevant approaches retrieved"),
    slots,
    translation,
  };
});
export function translateText(
  text: string,
  target: Language = language,
  depth = 0,
): string {
  if (target === "en" || !text.trim() || depth > 5) return text;
  const normalized = normalize(text);
  const exact = messages[normalized];
  const insensitive = caseMessages.get(normalized.toLowerCase());
  const translated =
    exact ||
    (insensitive
      ? normalized === normalized.toUpperCase()
        ? insensitive.toLocaleUpperCase("pl-PL")
        : insensitive
      : undefined);
  const preserve = (value: string) =>
    (text.match(/^\s*/)?.[0] || "") + value + (text.match(/\s*$/)?.[0] || "");
  if (translated) return preserve(translated);
  for (const pattern of patterns) {
    if (text.includes("\n") && !pattern.multiline) continue;
    const match = normalized.match(pattern.regex);
    if (match)
      return preserve(
        pattern.translation.replace(/\{\d+\}/g, (slot) =>
          translateText(
            match[pattern.slots.indexOf(slot) + 1] || "",
            target,
            depth + 1,
          ),
        ),
      );
  }
  // Local agent output and evidence lists contain independently translated lines.
  for (const separator of ["\n", "; ", " · "]) {
    if (text.includes(separator))
      return text
        .split(separator)
        .map((part) => translateText(part, target, depth + 1))
        .join(separator);
  }
  return text;
}
/** Translate display values only; never mutate stored models or React elements. */
export function t<T>(value: T): T {
  if (typeof value === "string") return translateText(value) as T;
  if (Array.isArray(value)) return value.map((item) => t(item)) as T;
  return value;
}

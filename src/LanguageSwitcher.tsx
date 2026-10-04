import { setLanguage, useLanguage } from "./i18n";
export default function LanguageSwitcher() {
  const language = useLanguage();
  return (
    <div
      className="language-switcher"
      role="group"
      aria-label={language === "pl" ? "Język interfejsu" : "Interface language"}
    >
      <button
        type="button"
        lang="pl"
        aria-pressed={language === "pl"}
        aria-label="Przełącz na język polski"
        onClick={() => setLanguage("pl")}
      >
        Polski
      </button>
      <span aria-hidden="true">/</span>
      <button
        type="button"
        lang="en"
        aria-pressed={language === "en"}
        aria-label="Switch to English"
        onClick={() => setLanguage("en")}
      >
        English
      </button>
    </div>
  );
}

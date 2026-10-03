import { Component, type ReactNode } from "react";
import { t } from "./i18n";
export default class ErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <main className="page-width safety-page" role="alert">
        <h1>{t("We could not open this view.")}</h1>
        <p>
          {t(
            "Your saved work has not been reset. Reload the page to try again.",
          )}
        </p>
        <button className="button" onClick={() => window.location.reload()}>
          {t("Reload page")}
        </button>
        <a href="/account">{t("Account & backup")}</a>
      </main>
    ) : (
      this.props.children
    );
  }
}

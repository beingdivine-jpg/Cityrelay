import { t } from "./i18n";
import { Link } from "react-router-dom";
import { Icon } from "./components";
import { lazy, Suspense } from "react";
const CityAtlas = lazy(() => import("./CityAtlas"));
export default function Home() {
  return (
    <div className="atlas-home">
      <section className="atlas-hero">
        <div className="page-width atlas-hero-inner">
          <div className="atlas-hero-copy">
            <span className="atlas-eyebrow">
              <i />
              {t("CIVIC INTELLIGENCE, SHARED")}
            </span>
            <h1>
              {t("Cities learn")}
              <br />
              {t("from cities.")}
              <span aria-hidden="true">↗</span>
            </h1>
            <p>
              {t(
                "Your next move starts with the people here—and the knowledge out there.",
              )}
            </p>
            <div className="atlas-hero-actions">
              <Link className="atlas-primary" to="/demo">
                {t("Explore the Kraków demo")}
                <Icon size={20} />
              </Link>
              <span>{t("Step into the role of a municipal advisor.")}</span>
              <Link className="atlas-secondary" to="/enter">
                {t("Bring your own city")} <span>↗</span>
              </Link>
            </div>
          </div>
          <Suspense
            fallback={
              <div className="atlas-loading">
                {t("Loading the city atlas…")}
              </div>
            }
          >
            <CityAtlas />
          </Suspense>
          <div className="atlas-hero-baseline">
            <span>{t("LOCAL QUESTIONS. SHARED KNOWLEDGE.")}</span>
            <a href="#how-it-works">{t("Discover the approach")} ↓</a>
            <span>{t("INDEPENDENT / HUMAN-LED")}</span>
          </div>
        </div>
      </section>
      <section className="atlas-method page-width" id="how-it-works">
        <div className="atlas-method-intro">
          <span className="atlas-eyebrow">
            {t("A CLEAR LINE FROM CONCERN TO ACTION")}
          </span>
          <h2>
            {t("Listen closely.")}
            <br />
            <span>{t("Look further.")}</span>
          </h2>
          <p>
            {t(
              "Elsewhere helps municipal teams turn resident concerns into a source-backed pilot. Five agents organise the evidence. Your team makes the decision.",
            )}
          </p>
        </div>
        <div className="atlas-method-steps">
          {[
            [
              "01",
              "The local picture",
              "Start with residents’ concerns and the context your municipal team shares.",
            ],
            [
              "02",
              "The wider perspective",
              "Follow the agents as they check documented projects, compare local conditions and make the unknowns visible.",
            ],
            [
              "03",
              "A considered next move",
              "Shape a practical pilot with evidence, responsibilities and the questions still to resolve.",
            ],
          ].map(([n, title, body]) => (
            <article key={n}>
              <span>{n}</span>
              <div>
                <h3>{t(title)}</h3>
                <p>{t(body)}</p>
              </div>
              <span aria-hidden="true">↗</span>
            </article>
          ))}
        </div>
      </section>
      <section className="atlas-demo-invitation page-width">
        <div>
          <span className="atlas-eyebrow">{t("YOUR FIRST INVESTIGATION")}</span>
          <h2>{t("Take a seat in Kraków.")}</h2>
          <p>
            {t(
              "Resident voices. Real city sources. A decision that stays yours.",
            )}
          </p>
        </div>
        <Link className="atlas-primary" to="/demo">
          {t("Open the guided demo")}
          <Icon size={22} />
        </Link>
      </section>
      <div className="atlas-disclosure page-width">
        <p>
          {t(
            "The demo uses sample resident reports, real project sources and visible local analysis. Live source checks are real requests. AI research is optional and requires a connection.",
          )}
        </p>
        <Link to="/about">{t("Sources & method")} ↗</Link>
      </div>
    </div>
  );
}

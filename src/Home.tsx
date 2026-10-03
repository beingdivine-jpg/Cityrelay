import { t } from "./i18n";
import { Link } from "react-router-dom";
import { Icon } from "./components";
import ExchangeScene from "./ExchangeScene";

export default function Home() {
  return (
    <div className="studio-home">
      <section className="exchange-hero page-width">
        <div className="exchange-copy">
          <span className="studio-kicker">
            <i />
            {t("A RESEARCH STUDIO FOR CITY TEAMS")}
          </span>
          <h1>
            {t("Good ideas")}
            <br />
            {t("deserve")}
            <br />
            <em>{t("another city.")}</em>
          </h1>
          <p className="exchange-intro">
            {t(
              "Turn residents’ concerns into a practical plan, with lessons from cities that have tried it before.",
            )}
          </p>
          <Link className="studio-cta" to="/demo">
            <span>
              {t("See it work in Kraków")}
              <small>{t("A guided demo. No account needed.")}</small>
            </span>
            <Icon size={26} />
          </Link>
          <Link className="studio-text-link" to="/enter">
            {t("I’m here for my own city")} <span>↗</span>
          </Link>
        </div>
        <ExchangeScene />
        <div className="hero-footnote">
          <span>{t("REAL CITY PROJECTS. HUMAN JUDGEMENT.")}</span>
          <a href="#how-it-works">
            {t("How does it work?")} <span>↓</span>
          </a>
          <span>{t("Illustration of ideas in motion")}</span>
        </div>
      </section>
      <section className="studio-method" id="how-it-works">
        <div className="page-width">
          <div className="studio-section-heading">
            <span className="studio-kicker">
              {t("FROM A LOCAL CONCERN TO A LOCAL PLAN")}
            </span>
            <h2>
              {t("A little outside perspective.")}
              <br />
              <em>{t("A very local next step.")}</em>
            </h2>
            <p>
              {t(
                "You bring the knowledge of your place. The research connects it to experience elsewhere. You decide what is worth trying.",
              )}
            </p>
          </div>
          <div className="studio-method-grid">
            {[
              [
                "01",
                "Listen to your city.",
                "Start with residents’ concerns and the context your municipal team shares.",
                "◉",
              ],
              [
                "02",
                "Follow the research.",
                "Watch five agents organise the input, check documented projects and show what fits—and what is still unknown.",
                "✳",
              ],
              [
                "03",
                "Make a considered move.",
                "Choose an approach and shape an editable pilot, with sources and the questions your team must resolve.",
                "↗",
              ],
            ].map(([n, title, body, glyph]) => (
              <article key={n}>
                <span className="method-no">{n}</span>
                <span className="method-glyph" aria-hidden="true">
                  {glyph}
                </span>
                <h3>{t(title)}</h3>
                <p>{t(body)}</p>
              </article>
            ))}
          </div>
          <div className="studio-honesty">
            <span aria-hidden="true">✳</span>
            <p>
              {t(
                "The demo uses sample resident reports, real project sources and visible local analysis. Live source checks are real requests. AI research is optional and requires a connection.",
              )}
            </p>
            <Link to="/about">{t("Sources & method")} ↗</Link>
          </div>
        </div>
      </section>
      <section className="studio-invitation page-width">
        <span className="studio-kicker">{t("TAKE THE ADVISOR’S SEAT")}</span>
        <h2>
          {t("Start with Kraków.")}
          <br />
          <em>{t("Leave with a possibility.")}</em>
        </h2>
        <Link className="studio-cta" to="/demo">
          <span>
            {t("Open the guided demo")}
            <small>{t("Resident voices → research → your pilot")}</small>
          </span>
          <Icon size={26} />
        </Link>
      </section>
    </div>
  );
}

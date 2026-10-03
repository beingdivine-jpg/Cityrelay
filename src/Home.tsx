import { t as tr } from "./i18n";
import { Link } from "react-router-dom";
import { Icon } from "./components";
import CityScene from "./CityScene";
export default function Home() {
  return (
    <div className="landing">
      <section className="hero page-width">
        <div className="hero-copy">
          <span className="hero-eyebrow">
            <i />
            {tr(" CIVIC INTELLIGENCE. WITH PEOPLE AT ITS HEART.")}
          </span>
          <h1>
            {tr("Great ideas")}
            <br />
            {tr("start somewhere.")}
            <br />
            <span>{tr("Bring them here.")}</span>
          </h1>
          <p>
            {tr(
              "For municipal advisors turning local needs into practical pilots.",
            )}
            <br className="desktop-break" />
            {tr(" Compare documented city projects. See why they fit.")}
            <br className="desktop-break" />
            {tr(
              " Leave with a proposal, sources and the questions to resolve.",
            )}
          </p>
          <Link className="hero-cta" to="/enter">
            {tr("Start with your challenge")}
            {tr(" ")}
            <span>
              <Icon size={23} />
            </span>
          </Link>
          <a className="hero-secondary" href="#how-it-works">
            {tr("Meet a different way of thinking ")}
            <span>{tr("↓")}</span>
          </a>
        </div>
        <div className="hero-art">
          <CityScene />
          <div className="hero-art-note">
            <span>{tr("01 — A SHARED IDEA")}</span>
            <p>
              {tr("Same inspiration.")}
              <br />
              <strong>{tr("Entirely your place.")}</strong>
            </p>
          </div>
        </div>
        <div className="hero-baseline">
          <span>{tr("LOCAL KNOWLEDGE. COLLECTIVE PROGRESS.")}</span>
          <a href="#how-it-works">
            {tr("SCROLL TO DISCOVER ")}
            <span>{tr("↓")}</span>
          </a>
        </div>
      </section>
      <section className="landing-agent-band">
        <div className="page-width">
          <div>
            <span className="eyebrow">
              {tr("A VISIBLE PATH FROM CONCERN TO POSSIBILITY")}
            </span>
            <h2>
              {tr("Your city speaks.")}
              <br />
              {tr("Your agents connect the dots.")}
            </h2>
            <p>
              {tr(
                "Resident voices and municipal knowledge meet a research workflow you can inspect. Each handoff has an input, evidence and a clear next step.",
              )}
            </p>
          </div>
          <div className="landing-agent-chain">
            {tr(
              [
                ["01", "Listen", "Resident reports"],
                ["02", "Understand", "Shared local context"],
                ["03", "Research", "Documented city ideas"],
                ["04", "Check", "Local conditions"],
                ["05", "Brief", "Advisor review"],
              ].map(([n, t, d]) => (
                <article key={n}>
                  <span>{tr(n)}</span>
                  <div>
                    <strong>{tr(t)}</strong>
                    <small>{tr(d)}</small>
                  </div>
                  <i>{tr("↗")}</i>
                </article>
              )),
            )}
            <small>
              {tr(
                "Local analysis works now. Live AI research connects through the server-side research service.",
              )}
            </small>
          </div>
        </div>
      </section>
      <section className="landing-method" id="how-it-works">
        <div className="page-width">
          <div className="method-intro">
            <span className="eyebrow">
              {tr("A LITTLE PERSPECTIVE GOES A LONG WAY")}
            </span>
            <h2>
              {tr("Your municipality is unique.")}
              <br />
              <span>{tr("Its challenges are shared.")}</span>
            </h2>
            <p>
              {tr(
                "A cooler street. A more accessible service. A river with room to breathe. Someone else’s experience can be the beginning of your next good decision.",
              )}
            </p>
          </div>
          <div className="method-track">
            <article>
              <span>{tr("01 / START HERE")}</span>
              <h3>{tr("Know your place.")}</h3>
              <p>
                {tr(
                  "Frame the challenge, the people it affects, and the resources you already have.",
                )}
              </p>
              <div className="method-symbol symbol-context">
                <i />
                <i />
                <i />
                <i />
              </div>
            </article>
            <article>
              <span>{tr("02 / LOOK ELSEWHERE")}</span>
              <h3>{tr("Find a new perspective.")}</h3>
              <p>
                {tr(
                  "Explore documented projects. See the evidence and the conditions behind them.",
                )}
              </p>
              <div className="method-symbol symbol-connections">
                <i />
                <i />
                <i />
              </div>
            </article>
            <article>
              <span>{tr("03 / MAKE IT LOCAL")}</span>
              <h3>{tr("Move forward, thoughtfully.")}</h3>
              <p>
                {tr(
                  "Check the fit, ask better questions, and shape a pilot your team can review.",
                )}
              </p>
              <div className="method-symbol symbol-local">{tr("↗")}</div>
            </article>
          </div>
        </div>
      </section>
      <section className="landing-invitation page-width">
        <div>
          <span className="eyebrow">
            {tr("FROM INSPIRATION TO A LOCAL DECISION")}
          </span>
          <h2>
            {tr("Big possibilities.")}
            <br />
            <span>{tr("A clear next step.")}</span>
          </h2>
        </div>
        <div>
          <p>
            {tr(
              "Bring a real challenge from your municipality. Or step into a guided example to see how it feels to work this way.",
            )}
          </p>
          <Link className="button" to="/enter">
            {tr("Enter the workspace ")}
            <Icon />
          </Link>
          <Link className="quiet-link" to="/about">
            {tr("Explore our sources and approach ")}
            <Icon size={16} />
          </Link>
        </div>
      </section>
    </div>
  );
}

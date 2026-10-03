import { Link } from "react-router-dom";
import { Icon } from "./components";
import CityScene from "./CityScene";
export default function Home() {
  return (
    <div className="landing">
      <section className="hero page-width">
        <div className="hero-copy">
          <span className="hero-eyebrow">
            <i /> CIVIC INTELLIGENCE. WITH PEOPLE AT ITS HEART.
          </span>
          <h1>
            Great ideas
            <br />
            start somewhere.
            <br />
            <span>Bring them here.</span>
          </h1>
          <p>
            A team of agents. The knowledge of your municipality.
            <br className="desktop-break" /> Turn resident needs into
            source-backed research.
            <br className="desktop-break" /> See the process. Make the local
            decision.
          </p>
          <Link className="hero-cta" to="/enter">
            Find your next move{" "}
            <span>
              <Icon size={23} />
            </span>
          </Link>
          <a className="hero-secondary" href="#how-it-works">
            Meet a different way of thinking <span>↓</span>
          </a>
        </div>
        <div className="hero-art">
          <CityScene />
          <div className="hero-art-note">
            <span>01 — A SHARED IDEA</span>
            <p>
              Same inspiration.
              <br />
              <strong>Entirely your place.</strong>
            </p>
          </div>
        </div>
        <div className="hero-baseline">
          <span>LOCAL KNOWLEDGE. COLLECTIVE PROGRESS.</span>
          <a href="#how-it-works">
            SCROLL TO DISCOVER <span>↓</span>
          </a>
        </div>
      </section>
      <section className="landing-agent-band">
        <div className="page-width">
          <div>
            <span className="eyebrow">
              A VISIBLE PATH FROM CONCERN TO POSSIBILITY
            </span>
            <h2>
              Your city speaks.
              <br />
              Your agents connect the dots.
            </h2>
            <p>
              Resident voices and municipal knowledge meet a research workflow
              you can inspect. Each handoff has an input, evidence and a clear
              next step.
            </p>
          </div>
          <div className="landing-agent-chain">
            {[
              ["01", "Listen", "Resident reports"],
              ["02", "Understand", "Shared local context"],
              ["03", "Research", "Documented city ideas"],
              ["04", "Check", "Local conditions"],
              ["05", "Brief", "Advisor review"],
            ].map(([n, t, d]) => (
              <article key={n}>
                <span>{n}</span>
                <div>
                  <strong>{t}</strong>
                  <small>{d}</small>
                </div>
                <i>↗</i>
              </article>
            ))}
            <small>
              Local analysis works now. Live AI research connects through the
              server-side research service.
            </small>
          </div>
        </div>
      </section>
      <section className="landing-method" id="how-it-works">
        <div className="page-width">
          <div className="method-intro">
            <span className="eyebrow">
              A LITTLE PERSPECTIVE GOES A LONG WAY
            </span>
            <h2>
              Your municipality is unique.
              <br />
              <span>Its challenges are shared.</span>
            </h2>
            <p>
              A cooler street. A more accessible service. A river with room to
              breathe. Someone else’s experience can be the beginning of your
              next good decision.
            </p>
          </div>
          <div className="method-track">
            <article>
              <span>01 / START HERE</span>
              <h3>Know your place.</h3>
              <p>
                Frame the challenge, the people it affects, and the resources
                you already have.
              </p>
              <div className="method-symbol symbol-context">
                <i />
                <i />
                <i />
                <i />
              </div>
            </article>
            <article>
              <span>02 / LOOK ELSEWHERE</span>
              <h3>Find a new perspective.</h3>
              <p>
                Explore documented projects. See the evidence and the conditions
                behind them.
              </p>
              <div className="method-symbol symbol-connections">
                <i />
                <i />
                <i />
              </div>
            </article>
            <article>
              <span>03 / MAKE IT LOCAL</span>
              <h3>Move forward, thoughtfully.</h3>
              <p>
                Check the fit, ask better questions, and shape a pilot your team
                can review.
              </p>
              <div className="method-symbol symbol-local">↗</div>
            </article>
          </div>
        </div>
      </section>
      <section className="landing-invitation page-width">
        <div>
          <span className="eyebrow">FROM INSPIRATION TO A LOCAL DECISION</span>
          <h2>
            Big possibilities.
            <br />
            <span>A clear next step.</span>
          </h2>
        </div>
        <div>
          <p>
            Bring a real challenge from your municipality. Or step into a guided
            example to see how it feels to work this way.
          </p>
          <Link className="button" to="/enter">
            Enter the workspace <Icon />
          </Link>
          <Link className="quiet-link" to="/about">
            Explore our sources and approach <Icon size={16} />
          </Link>
        </div>
      </section>
    </div>
  );
}

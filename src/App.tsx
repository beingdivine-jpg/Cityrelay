import { useEffect, useRef, useState } from "react";
import {
  BrowserRouter,
  Link,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { AppContext, Button, Icon, Logo } from "./components";
import { loadState, saveState, seedState, STORAGE_KEY } from "./storage";
import type { AppState, CommunityProfile } from "./model";
import Home from "./Home";
import Entry from "./Entry";
import Profile from "./Profile";
import Workspace, { Missing } from "./Workspace";
import MatchDetail from "./MatchDetail";
import Plan from "./Plan";
import { LiveProvider } from "./LiveContext";
import { SourceList } from "./SourceList";
import { sources } from "./sources";
import CitySignals from "./CitySignals";
import CityData from "./CityData";
import ResidentSpace from "./ResidentSpace";
import AgentStudio from "./AgentStudio";
import Opportunities from "./Opportunities";
import CityMonitor from "./CityMonitor";
import { CivicMonitor } from "./CivicContext";
function About() {
  return (
    <div className="about-page page-width">
      <Link className="quiet-link" to="/">
        <Icon name="back" size={16} /> The idea
      </Link>
      <span className="eyebrow">A CLEAR VIEW OF THE EVIDENCE</span>
      <h1>
        Good decisions need
        <br />
        <span className="blue-text">more than a good story.</span>
      </h1>
      <div className="about-intro">
        <p>
          Elsewhere helps municipal teams understand ideas in context, test
          their local fit, and prepare a pilot. The final judgement belongs to
          the people who know the place.
        </p>
        <p>
          Our approach draws on URBACT’s understand–adapt–reuse process and
          public-sector innovation practice. This is an independent hackathon
          project; no affiliation with the source cities is implied.
        </p>
      </div>
      <div className="about-principles">
        <section>
          <span>01</span>
          <h2>
            Real projects.
            <br />
            Visible sources.
          </h2>
          <p>
            The project catalogue links to municipal, public-agency and research
            sources. Historical figures retain their dates. Sources are checked
            manually. Source monitoring can detect page changes; an optional AI
            scout searches approved public sources. Neither is a verified global
            project feed.
          </p>
        </section>
        <section>
          <span>02</span>
          <h2>
            Local questions.
            <br />
            Honest unknowns.
          </h2>
          <p>
            Transfer checks and suggested pilots are planning tools. A result in
            one city is not a prediction for another. Costs, staff, site
            suitability and delivery dates need local confirmation.
          </p>
        </section>
        <section>
          <span>03</span>
          <h2>
            Current context.
            <br />
            Clear boundaries.
          </h2>
          <p>
            The Kraków walkthrough connects IMGW observations and Open-Meteo
            forecasts. Report and retrieval times are visible. A failed request
            shows an unavailable state. Weather is context, not an official
            alert or a ranking signal.
          </p>
        </section>
      </div>
      <details className="about-storage">
        <summary>How this preview handles your workspace</summary>
        <p>
          Your advisor identity, city brief, questions and pilot save in this
          browser. This is device-saved access, not authenticated account
          access. Nothing is sent to another city. Public weather requests use
          fixed Kraków coordinates; your notes are not included. Earlier
          prototype data remains separately preserved. Resident submissions,
          contributors, access choices and research history also save on this
          device. Live AI requires a server-side connection and per-run consent;
          only shared context and permitted reports/documents are sent to
          OpenAI. Source monitoring runs while this workspace is open, with
          explicit failures and review notices.
        </p>
        <p>
          Open-Meteo’s non-commercial service is attributed in the interface. A
          commercial release needs appropriate provider terms, secure account
          infrastructure and shared storage. The animated city is an original
          conceptual illustration, not a map or a representation of a specific
          city.
        </p>
      </details>
      <section className="source-directory">
        <div className="section-title">
          <div>
            <span className="eyebrow">THE RESEARCH NOTEBOOK</span>
            <h2>Follow the evidence.</h2>
          </div>
          <span>Checked 3 October 2026</span>
        </div>
        <SourceList
          ids={sources.filter((s) => s.id !== "world-map").map((s) => s.id)}
        />
      </section>
    </div>
  );
}
function ResetDialog({
  onClose,
  onReset,
}: {
  onClose: () => void;
  onReset: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    dialog.current?.showModal();
  }, []);
  return (
    <dialog ref={dialog} onCancel={onClose} aria-labelledby="reset-title">
      <span className="eyebrow">A FRESH START</span>
      <h2 id="reset-title">Reset this workspace?</h2>
      <p>
        Your locally saved profiles, plans, questions and observations in this
        version will be removed. Export anything you need to keep first.
      </p>
      <div className="actions">
        <Button secondary onClick={onClose}>
          Keep my work
        </Button>
        <Button onClick={onReset}>
          Reset workspace <Icon />
        </Button>
      </div>
    </dialog>
  );
}
function Shell() {
  const [initial] = useState(loadState);
  const [state, setState] = useState<AppState>(initial.state);
  const [error, setError] = useState(initial.error);
  const [blocked, setBlocked] = useState(!!initial.error);
  const [toast, setToast] = useState("");
  const [reset, setReset] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const landing = location.pathname === "/";
  const working = location.pathname.startsWith("/community/");
  useEffect(() => {
    const sync = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY || !event.newValue) return;
      const incoming = loadState({ getItem: () => event.newValue });
      if (!incoming.error) {
        setState(incoming.state);
        setBlocked(false);
        setError("");
      }
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);
  useEffect(() => {
    if (!blocked) setError(saveState(state));
  }, [state, blocked]);
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(""), 5000);
      return () => clearTimeout(t);
    }
  }, [toast]);
  useEffect(() => {
    document.title = `Elsewhere — ${landing ? "Great ideas. Local possibilities." : location.pathname === "/enter" ? "Your municipal workspace" : location.pathname.endsWith("/plan") ? "Your pilot brief" : "Municipal innovation workspace"}`;
    if (location.hash) {
      requestAnimationFrame(() =>
        document.getElementById(location.hash.slice(1))?.scrollIntoView(),
      );
    } else {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      document.getElementById("main-content")?.focus({ preventScroll: true });
    }
  }, [location.pathname, location.hash, landing]);
  const update = (fn: (s: AppState) => AppState) => setState(fn);
  const saveProfile = (p: CommunityProfile) =>
    update((s) => ({
      ...s,
      profiles: s.profiles.some((x) => x.id === p.id)
        ? s.profiles.map((x) => (x.id === p.id ? p : x))
        : [...s.profiles, p],
    }));
  const active = state.profiles.find(
    (p) => p.id === state.advisor?.activeCommunityId,
  );
  return (
    <AppContext.Provider
      value={{ state, update, notify: setToast, saveProfile }}
    >
      <div
        className={`app ${landing ? "app-landing" : ""} ${working ? "app-working" : ""}`}
      >
        <a className="skip-link" href="#main-content">
          Skip to content
        </a>
        <header className="site-header page-width">
          <Logo />
          {working ? (
            <div className="workspace-identity">
              <span>CIVIC INTELLIGENCE</span>
              <Link to="/enter">
                {active?.name || "Municipal advisor"} <span>⌄</span>
              </Link>
            </div>
          ) : (
            <nav aria-label="Main navigation">
              <Link to="/#how-it-works">The approach</Link>
              <Link to="/about">Our sources</Link>
            </nav>
          )}
          <Link
            className="header-entry"
            to={
              working
                ? "/enter"
                : state.advisor
                  ? `/community/${state.advisor.activeCommunityId}`
                  : "/enter"
            }
          >
            {working ? (
              <>
                <span className="advisor-avatar">
                  {state.advisor?.name === "Municipal advisor"
                    ? "MA"
                    : state.advisor?.name.slice(0, 2).toUpperCase() || "MA"}
                </span>
                <span>Advisor workspace</span>
              </>
            ) : (
              <>
                {state.advisor ? "Open workspace" : "Enter workspace"}
                <Icon size={18} />
              </>
            )}
          </Link>
        </header>
        {error && (
          <div className="storage-warning page-width" role="alert">
            {error}
          </div>
        )}
        {active && <CivicMonitor id={active.id} />}
        <main id="main-content" tabIndex={-1}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/enter" element={<Entry />} />
            <Route path="/start" element={<Profile />} />
            <Route path="/about" element={<About />} />
            <Route path="/community/:id" element={<CitySignals />} />
            <Route path="/community/:id/brief" element={<Workspace />} />
            <Route path="/community/:id/data" element={<CityData />} />
            <Route path="/community/:id/agents" element={<AgentStudio />} />
            <Route
              path="/community/:id/reports"
              element={<ResidentSpace intake />}
            />
            <Route
              path="/community/:id/opportunities"
              element={<Opportunities />}
            />
            <Route path="/community/:id/monitor" element={<CityMonitor />} />
            <Route path="/report/:id" element={<ResidentSpace />} />
            <Route
              path="/community/:id/matches"
              element={<Workspace matchesOnly />}
            />
            <Route
              path="/community/:id/matches/:matchId"
              element={<MatchDetail />}
            />
            <Route path="/community/:id/plan" element={<Plan />} />
            <Route path="*" element={<Missing />} />
          </Routes>
        </main>
        <footer className="site-footer page-width">
          <Logo />
          <p>Shared ideas. Local possibilities.</p>
          <div>
            <Link to="/about">Sources & method</Link>
            {!landing && (
              <button onClick={() => setReset(true)}>
                Reset local workspace
              </button>
            )}
            <span>INDEPENDENT HACKATHON PROJECT / 2026</span>
          </div>
        </footer>
        {toast && (
          <div className="toast" role="status">
            <Icon name="check" size={17} />
            {toast}
            <button
              className="icon-button"
              aria-label="Dismiss notification"
              onClick={() => setToast("")}
            >
              <Icon name="close" size={16} />
            </button>
          </div>
        )}
        {reset && (
          <ResetDialog
            onClose={() => setReset(false)}
            onReset={() => {
              setState(seedState());
              setBlocked(false);
              setError("");
              setReset(false);
              navigate("/enter");
              setToast("Your local workspace has been reset.");
            }}
          />
        )}
      </div>
    </AppContext.Provider>
  );
}
export default function App() {
  return (
    <LiveProvider>
      <BrowserRouter>
        <Shell />
      </BrowserRouter>
    </LiveProvider>
  );
}

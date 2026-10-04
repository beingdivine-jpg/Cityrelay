import JuryTour from "./JuryTour";
import { t as tr, useLanguage } from "./i18n";
import LanguageSwitcher from "./LanguageSwitcher";
import { lazy, Suspense, useEffect, useRef, useState } from "react";
import {
  createBrowserRouter,
  RouterProvider,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import { Link, useNavigate } from "./navigation";
import { AppContext, Button, Icon, Logo } from "./components";
import { loadState, saveState, seedState, STORAGE_KEY } from "./storage";
import type { AppState, CommunityProfile } from "./model";
import Home from "./Home";
import { ErrorFallback } from "./ErrorBoundary";
import Entry from "./Entry";
import DemoStart from "./DemoStart";
import { DEMO_ID, demoDisclosure } from "./demo";
const Profile = lazy(() => import("./Profile"));
import Workspace, { Missing } from "./Workspace";
const MatchDetail = lazy(() => import("./MatchDetail"));
const Plan = lazy(() => import("./Plan"));
import { LiveProvider } from "./LiveContext";
import { SourceList } from "./SourceList";
import { sources } from "./sources";
import CitySignals from "./CitySignals";
const CityData = lazy(() => import("./CityData"));
const ResidentSpace = lazy(() => import("./ResidentSpace"));
const AgentStudio = lazy(() => import("./AgentStudio"));
const Opportunities = lazy(() => import("./Opportunities"));
const CityMonitor = lazy(() => import("./CityMonitor"));
import { CivicMonitor } from "./CivicContext";
import Challenge from "./Challenge";
import { SharedProvider, useShared } from "./SharedContext";
const SharedResident = lazy(() => import("./SharedResident"));
const SharedIntake = lazy(() => import("./SharedIntake"));
import WorkspaceSafety from "./WorkspaceSafety";
function About() {
  return (
    <div className="about-page page-width">
      <Link className="quiet-link" to="/">
        <Icon name="back" size={16} />
        {tr(" The idea")}
      </Link>
      <span className="eyebrow">{tr("A CLEAR VIEW OF THE EVIDENCE")}</span>
      <h1>
        {tr("Good decisions need")}
        <br />
        <span className="blue-text">{tr("more than a good story.")}</span>
      </h1>
      <div className="about-intro">
        <p>
          {tr(
            "Elsewhere helps municipal teams understand ideas in context, test their local fit, and prepare a pilot. The final judgement belongs to the people who know the place.",
          )}
        </p>
        <p>
          {tr(
            "Our approach draws on URBACT’s understand–adapt–reuse process and public-sector innovation practice. This is an independent hackathon project; no affiliation with the source cities is implied.",
          )}
        </p>
      </div>
      <div className="about-principles">
        <section>
          <span>{tr("01")}</span>
          <h2>
            {tr("Real projects.")}
            <br />
            {tr("Visible sources.")}
          </h2>
          <p>
            {tr(
              "The project catalogue links to municipal, public-agency and research sources. Historical figures retain their dates. Sources are checked manually. Source monitoring can detect page changes; an optional AI scout searches approved public sources. Neither is a verified global project feed.",
            )}
          </p>
        </section>
        <section>
          <span>{tr("02")}</span>
          <h2>
            {tr("Local questions.")}
            <br />
            {tr("Honest unknowns.")}
          </h2>
          <p>
            {tr(
              "Transfer checks and suggested pilots are planning tools. A result in one city is not a prediction for another. Costs, staff, site suitability and delivery dates need local confirmation.",
            )}
          </p>
        </section>
        <section>
          <span>{tr("03")}</span>
          <h2>
            {tr("Current context.")}
            <br />
            {tr("Clear boundaries.")}
          </h2>
          <p>
            {tr(
              "The Kraków walkthrough connects IMGW observations and Open-Meteo forecasts. Report and retrieval times are visible. A failed request shows an unavailable state. Weather is context, not an official alert or a ranking signal.",
            )}
          </p>
        </section>
      </div>
      <details className="about-storage">
        <summary>{tr("How this preview handles your workspace")}</summary>
        <p>
          {tr(
            "Local exploration stays in this browser. Signing in does not upload it: creating a shared copy is a separate action. Connected team workspaces use authenticated membership and explicit shared saves. Public resident forms deliver to the named team only when its owner enables intake. Municipal affiliation remains self-declared. Live AI needs per-run consent; only permitted inputs reach OpenAI. Source checks produce review notices, not automatic approvals. Daily background checks run only when the connected service is configured.",
          )}
        </p>
        <p>
          {tr(
            "Open-Meteo’s non-commercial service is attributed in the interface. A commercial release needs appropriate provider terms, secure account infrastructure and shared storage. The atlas uses Natural Earth geography and approximate city locations. Project diagrams are conceptual illustrations, not site plans.",
          )}
        </p>
      </details>
      <section className="source-directory">
        <div className="section-title">
          <div>
            <span className="eyebrow">{tr("THE RESEARCH NOTEBOOK")}</span>
            <h2>{tr("Follow the evidence.")}</h2>
          </div>
          <span>{tr("Checked 3 October 2026")}</span>
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
      <span className="eyebrow">{tr("A FRESH START")}</span>
      <h2 id="reset-title">{tr("Reset this workspace?")}</h2>
      <p>
        {tr(
          "Your locally saved profiles, plans, questions and observations in this version will be removed. Export anything you need to keep first.",
        )}
      </p>
      <div className="actions">
        <Button secondary onClick={onClose}>
          {tr("Keep my work")}
        </Button>
        <Button onClick={onReset}>
          {tr("Reset workspace ")}
          <Icon />
        </Button>
      </div>
    </dialog>
  );
}
function Shell() {
  const language = useLanguage();
  const [initial] = useState(loadState);
  const [localState, setState] = useState<AppState>(initial.state);
  const shared = useShared();
  const state = shared.state || localState;
  const [error, setError] = useState(initial.error);
  const [blocked, setBlocked] = useState(!!initial.error);
  const readSaved = () => {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch {
      return null;
    }
  };
  const savedText = useRef(readSaved());
  const savedState = useRef(JSON.stringify(initial.state));
  const localRef = useRef(localState);
  localRef.current = localState;
  const restoreState = (next: AppState) => {
    savedText.current = readSaved();
    savedState.current = JSON.stringify(next);
    setState(next);
    setBlocked(false);
    setError("");
  };
  const [toast, setToast] = useState("");
  const [reset, setReset] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const landing = location.pathname === "/";
  const working = location.pathname.startsWith("/community/");
  useEffect(() => {
    const sync = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY || !event.newValue) return;
      const incoming = loadState({
        getItem: () => event.newValue,
      });
      if (!incoming.error) {
        if (JSON.stringify(localRef.current) !== savedState.current) {
          setBlocked(true);
          setError(
            "Another tab changed this workspace. Download your current work, then reload the saved version from Account & backup.",
          );
          return;
        }
        savedText.current = event.newValue;
        savedState.current = JSON.stringify(incoming.state);
        setState(incoming.state);
        setBlocked(false);
        setError("");
      }
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);
  useEffect(() => {
    if (blocked) return;
    if (readSaved() !== savedText.current) {
      setBlocked(true);
      setError(
        "Another tab changed this workspace. Download your current work, then reload the saved version from Account & backup.",
      );
      return;
    }
    const failure = saveState(localState);
    setError(failure);
    if (!failure) {
      savedText.current = readSaved();
      savedState.current = JSON.stringify(localState);
    }
  }, [localState, blocked]);
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(""), 5000);
      return () => clearTimeout(t);
    }
  }, [toast]);
  useEffect(() => {
    const pageNames: Record<string, string> = {
      challenge: "Your challenge",
      agents: "Agent studio",
      opportunities: "Opportunities",
      plan: "Your pilot brief",
      data: "Team & data",
      reports: "Resident inbox",
      monitor: "Monitoring",
      brief: "Municipal brief",
      account: "Account & backup",
      enter: "Your municipal workspace",
      about: "Sources & method",
    };
    const segments = location.pathname.split("/").filter(Boolean);
    document.title = `Elsewhere — ${tr(landing ? "Great ideas. Local possibilities." : pageNames[segments.at(-1) || ""] || "Municipal innovation workspace")}`;
  }, [location.pathname, landing, language]);
  useEffect(() => {
    if (location.hash) {
      requestAnimationFrame(() =>
        document.getElementById(location.hash.slice(1))?.scrollIntoView(),
      );
    } else {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: "instant",
      });
      document.getElementById("main-content")?.focus({
        preventScroll: true,
      });
    }
  }, [location.pathname, location.hash, landing]);
  const update = (fn: (s: AppState) => AppState) =>
    shared.workspace ? shared.update(fn) : setState(fn);
  const saveProfile = (p: CommunityProfile) =>
    update((s) => ({
      ...s,
      profiles: s.profiles.some((x) => x.id === p.id)
        ? s.profiles.map((x) => (x.id === p.id ? p : x))
        : [...s.profiles, p],
    }));
  const routeCity = location.pathname.match(
    /^\/(?:community|report)\/([^/]+)/,
  )?.[1];
  const active = state.profiles.find(
    (p) => p.id === (routeCity || state.advisor?.activeCommunityId),
  );
  return (
    <AppContext.Provider
      value={{
        state,
        update,
        notify: setToast,
        saveProfile,
        restoreState,
      }}
    >
      <div
        className={`app ${landing ? "app-landing" : ""} ${working ? "app-working" : ""}`}
      >
        <a className="skip-link" href="#main-content">
          {tr("Skip to content")}
        </a>
        <header className="site-header page-width">
          <Logo />
          {tr(
            working ? (
              <div className="workspace-identity">
                <span>{tr("CIVIC INTELLIGENCE")}</span>
                <Link to="/enter">
                  {tr(active?.name || "Municipal advisor")}{" "}
                  <span>{tr("⌄")}</span>
                </Link>
              </div>
            ) : (
              <nav aria-label={tr("Main navigation")}>
                <Link to="/#how-it-works">{tr("The approach")}</Link>
                <Link to="/about">{tr("Our sources")}</Link>
              </nav>
            ),
          )}
          <Link
            className="header-entry"
            to={working ? "/account" : "/demo?tour=demo"}
          >
            {tr(
              working ? (
                <>
                  <span className="advisor-avatar">
                    {tr(
                      state.advisor?.name === "Municipal advisor"
                        ? "↗"
                        : state.advisor?.name.slice(0, 2).toUpperCase() || "↗",
                    )}
                  </span>
                  <span>
                    {tr(shared.workspace ? "Shared account" : "Account")}
                  </span>
                </>
              ) : (
                <>
                  {tr("Demo Walkthrough")}
                  <Icon size={18} />
                </>
              ),
            )}
          </Link>
          <LanguageSwitcher />
        </header>
        {tr(
          error && (
            <div className="storage-warning page-width" role="alert">
              {tr(error)}
            </div>
          ),
        )}
        {working && active && <CivicMonitor id={active.id} />}
        {!landing && !location.pathname.startsWith("/resident/") && (
          <div className="workspace-status page-width" role="status">
            <span className="status-dot" />
            <strong>
              {active && `${active.name} · `}
              {tr(
                active?.id === DEMO_ID
                  ? "Guided demo"
                  : shared.workspace
                    ? "Shared workspace"
                    : "Local preview",
              )}
            </strong>
            <span>
              {shared.user
                ? `${tr("Signed in as")} ${shared.user.email}`
                : tr("Not signed in")}
            </span>
            <span>
              {tr(
                shared.workspace
                  ? shared.pending
                    ? "Unsaved shared changes"
                    : "Saved to your shared account"
                  : error
                    ? "Changes are not saved"
                    : "Saved on this device",
              )}
            </span>
            {shared.workspace && (
              <button
                disabled={!shared.pending || shared.saving}
                onClick={() => void shared.save()}
              >
                {tr(shared.saving ? "Saving…" : "Save shared changes")}
              </button>
            )}
            {active?.id === DEMO_ID && (
              <details className="workspace-demo-note">
                <summary>{tr("Sample data. Real sources.")}</summary>
                <p>{tr(demoDisclosure)}</p>
              </details>
            )}
            <Link to="/account">{tr("Account & backup")}</Link>
          </div>
        )}
        {shared.error && (
          <p className="page-width form-error" role="alert">
            {tr(shared.error)}
          </p>
        )}
        <main id="main-content" tabIndex={-1}>
          <div className="route-scene" key={location.pathname}>
            {shared.opening ? (
              <p className="page-width" role="status">
                {tr("Loading shared workspace…")}
              </p>
            ) : (
              <Suspense
                fallback={
                  <p className="page-width" role="status">
                    {tr("Loading workspace…")}
                  </p>
                }
              >
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/demo" element={<DemoStart />} />
                  <Route
                    path="/resident/:id"
                    element={<SharedResident key={location.pathname} />}
                  />
                  <Route path="/account" element={<WorkspaceSafety />} />
                  <Route
                    path="/community/:id/challenge"
                    element={<Challenge key={location.pathname} />}
                  />
                  <Route path="/enter" element={<Entry />} />
                  <Route path="/start" element={<Profile />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/community/:id" element={<CitySignals />} />
                  <Route path="/community/:id/brief" element={<Workspace />} />
                  <Route path="/community/:id/data" element={<CityData />} />
                  <Route
                    path="/community/:id/agents"
                    element={<AgentStudio key={location.pathname} />}
                  />
                  <Route
                    path="/community/:id/reports"
                    element={
                      shared.workspace ? (
                        <SharedIntake />
                      ) : (
                        <ResidentSpace intake />
                      )
                    }
                  />
                  <Route
                    path="/community/:id/opportunities"
                    element={<Opportunities />}
                  />
                  <Route
                    path="/community/:id/monitor"
                    element={<CityMonitor />}
                  />
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
              </Suspense>
            )}
          </div>
        </main>
        <footer className="site-footer page-width">
          <Logo />
          <p>{tr("Shared ideas. Local possibilities.")}</p>
          <div>
            <Link to="/about">{tr("Sources & method")}</Link>
            {tr(
              !landing && !shared.workspace && (
                <button onClick={() => setReset(true)}>
                  {tr("Reset local workspace")}
                </button>
              ),
            )}
            <span>{tr("INDEPENDENT HACKATHON PROJECT / 2026")}</span>
          </div>
        </footer>
        {tr(
          toast && (
            <div className="toast" role="status">
              <Icon name="check" size={17} />
              {tr(toast)}
              <button
                className="icon-button"
                aria-label={tr("Dismiss notification")}
                onClick={() => setToast("")}
              >
                <Icon name="close" size={16} />
              </button>
            </div>
          ),
        )}
        {tr(
          reset && (
            <ResetDialog
              onClose={() => setReset(false)}
              onReset={() => {
                restoreState(seedState());
                setBlocked(false);
                setError("");
                setReset(false);
                navigate("/enter");
                setToast("Your local workspace has been reset.");
              }}
            />
          ),
        )}
      </div>
      <JuryTour />
    </AppContext.Provider>
  );
}
const router = createBrowserRouter([
  {
    path: "*",
    errorElement: <ErrorFallback />,
    element: (
      <SharedProvider>
        <LiveProvider>
          <Shell />
        </LiveProvider>
      </SharedProvider>
    ),
  },
]);
export default function App() {
  return <RouterProvider router={router} />;
}

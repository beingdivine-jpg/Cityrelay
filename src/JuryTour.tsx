import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { Link, useNavigate } from "./navigation";
import { useApp, Icon } from "./components";
import { useShared } from "./SharedContext";
import { t, useLanguage } from "./i18n";
import { juryCopy } from "./juryCopy";
import { runFingerprint } from "./civicEngine";
import {
  advanceJuryStep,
  juryRoot,
  juryRoute,
  jurySteps,
  type JuryStep,
  type JuryEvent,
  type JuryAction,
} from "./juryTourModel";
import "./jury.css";
const storageKey = "elsewhere.jury.v1";
type Progress = { step: JuryStep; caseId: string; minimized: boolean };
function readProgress(): Progress | null {
  try {
    const value = JSON.parse(sessionStorage.getItem(storageKey) || "null");
    if (!value || !jurySteps.includes(value.step)) return null;
    return {
      step: value.step === "run" ? "launch" : value.step,
      caseId: typeof value.caseId === "string" ? value.caseId : "",
      minimized: !!value.minimized,
    };
  } catch {
    return null;
  }
}
function positionTarget(target: HTMLElement, smooth = false) {
  const narrow = window.matchMedia("(max-width: 1099px)").matches;
  const anchor =
    narrow && target.dataset.tour === "reality"
      ? target.querySelector<HTMLElement>("button") || target
      : target;
  const guide = document.querySelector<HTMLElement>(".jury-coach");
  const room =
    window.innerHeight -
    (narrow ? guide?.getBoundingClientRect().height || 0 : 0);
  const rect = anchor.getBoundingClientRect();
  window.scrollBy({
    top: rect.top - Math.max(28, (room - rect.height) / 2),
    behavior:
      smooth && !window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "smooth"
        : "instant",
  });
}
export default function JuryTour() {
  useLanguage();
  const location = useLocation(),
    navigate = useNavigate();
  const { state } = useApp();
  const shared = useShared();
  const [progress, setProgress] = useState<Progress | null>(readProgress);
  const [intro, setIntro] = useState(false);
  const [agent, setAgent] = useState({ name: "", waiting: false });
  const [stopped, setStopped] = useState(false);
  const modal = useRef<HTMLDialogElement>(null);
  const [targetFound, setTargetFound] = useState(false);
  const [locate, setLocate] = useState(0);
  const copy = progress ? juryCopy[progress.step] : null;
  const expected = progress ? juryRoute(progress.step, progress.caseId) : "";
  const onRoute = location.pathname === expected;
  const visible = !!progress && !intro && !shared.workspace;
  const expanded = visible && !progress.minimized;
  const advance = (action: JuryAction) =>
    setProgress((p) =>
      p ? { ...p, step: advanceJuryStep(p.step, action) } : p,
    );
  useEffect(() => {
    try {
      if (progress)
        sessionStorage.setItem(storageKey, JSON.stringify(progress));
      else sessionStorage.removeItem(storageKey);
    } catch {
      /* The guide still works without storage. */
    }
  }, [progress]);
  useEffect(() => {
    if (
      location.pathname === juryRoot &&
      new URLSearchParams(location.search).get("tour") === "jury" &&
      !shared.workspace
    ) {
      setIntro(true);
      navigate(juryRoot, { replace: true });
    }
  }, [location.pathname, location.search, shared.workspace, navigate]);
  useEffect(() => {
    if (intro) {
      modal.current?.showModal();
      modal.current?.querySelector<HTMLButtonElement>(".button")?.focus();
    }
  }, [intro]);
  useEffect(() => {
    const event = (e: Event) => {
      if (!location.pathname.startsWith(juryRoot)) return;
      const detail = (e as CustomEvent<JuryEvent>).detail;
      if ("action" in detail) {
        if (detail.action === "stopped") setStopped(true);
        if (detail.action === "started") setStopped(false);
        advance(detail.action);
      } else setAgent({ name: detail.agent, waiting: detail.waiting });
    };
    window.addEventListener("elsewhere:jury", event);
    return () => window.removeEventListener("elsewhere:jury", event);
  }, [location.pathname]);
  useEffect(() => {
    const p = location.pathname;
    if (p !== `${juryRoot}/agents`) advance("stopped");
    if (p === `${juryRoot}/data`) advance("data");
    if (p === `${juryRoot}/agents`) advance("agents");
    if (p === `${juryRoot}/opportunities`) advance("findings");
    if (p.startsWith(`${juryRoot}/matches/`)) {
      setProgress((old) =>
        old
          ? {
              ...old,
              caseId: p.split("/").at(-1)!,
              step: advanceJuryStep(old.step, "case"),
            }
          : old,
      );
    }
    if (p === `${juryRoot}/plan`) advance("pilot");
  }, [location.pathname]);
  useEffect(() => {
    document.body.classList.toggle("jury-expanded", !!expanded);
    return () => document.body.classList.remove("jury-expanded");
  }, [expanded]);
  useEffect(() => {
    if (!expanded || !onRoute || !copy?.target) {
      setTargetFound(false);
      return;
    }
    let current: HTMLElement | null = null;
    let scrolled = false;
    const selector = `[data-tour="${progress?.step === "run" && agent.waiting ? "handoff" : copy.target}"]`;
    const find = () => {
      const next = document.querySelector<HTMLElement>(selector);
      if (next === current) return;
      current?.classList.remove("jury-highlight");
      current = next;
      setTargetFound(!!next);
      if (next) {
        next.classList.add("jury-highlight");
        if (!scrolled) {
          scrolled = true;
          positionTarget(next);
        }
      }
    };
    // Observe lazy routes and panels; no timers simulate completion.
    const observer = new MutationObserver(find);
    observer.observe(document.getElementById("main-content") || document.body, {
      childList: true,
      subtree: true,
    });
    const frame = requestAnimationFrame(find);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      current?.classList.remove("jury-highlight");
    };
  }, [
    expanded,
    onRoute,
    copy?.target,
    progress?.step,
    agent.waiting,
    locate,
    location.pathname,
  ]);
  useEffect(() => {
    document.querySelector(".jury-coach")?.scrollTo({ top: 0 });
  }, [progress?.step]);
  useEffect(() => {
    const minimize = (e: KeyboardEvent) => {
      if (
        e.key === "Escape" &&
        expanded &&
        !document.querySelector("dialog[open]")
      )
        setProgress((p) => p && { ...p, minimized: true });
    };
    document.addEventListener("keydown", minimize);
    return () => document.removeEventListener("keydown", minimize);
  }, [expanded]);
  const exit = () => {
    setIntro(false);
    setProgress(null);
  };
  const start = () => {
    setProgress({ step: "listen", caseId: "", minimized: false });
    setIntro(false);
    setStopped(false);
    navigate(juryRoot);
  };
  function showTarget() {
    if (!onRoute) {
      navigate(expected);
      return;
    }
    const target = document.querySelector<HTMLElement>(
      `[data-tour="${progress?.step === "run" && agent.waiting ? "handoff" : copy?.target}"]`,
    );
    if (target) positionTarget(target, true);
    if (target?.matches("button, a, input"))
      target.focus({ preventScroll: true });
    else
      target
        ?.querySelector<HTMLElement>("button, a, input")
        ?.focus({ preventScroll: true });
    setLocate((n) => n + 1);
  }
  // A browser reload cancels a run. Resume at launch; a saved completed run can still be inspected.
  const demo = state.civic?.["krakow-demo"];
  const profile = state.profiles.find((p) => p.id === "krakow-demo");
  const latest = demo?.runs[0];
  const completedRun =
    latest?.status === "complete" &&
    profile &&
    demo &&
    latest.fingerprint === runFingerprint(profile, demo);
  return (
    <>
      {intro && (
        <dialog
          ref={modal}
          className="jury-intro"
          aria-labelledby="jury-intro-title"
          onCancel={exit}
          onClose={() => setIntro(false)}
        >
          <button
            className="jury-close"
            aria-label={t("Close walkthrough")}
            onClick={exit}
          >
            <Icon name="close" />
          </button>
          <span className="jury-kicker">{t("JURY WALKTHROUGH / KRAKÓW")}</span>
          <div className="jury-orbit" aria-hidden="true">
            ↗
          </div>
          <h2 id="jury-intro-title">{t("Take the advisor’s seat.")}</h2>
          <p>
            {t(
              "A guided journey from resident concerns to a downloadable pilot. Short messages show what to do and why. You make each click; the guide waits for the work.",
            )}
          </p>
          <ol>
            <li>{t("Listen & inspect the inputs")}</li>
            <li>{t("Follow the five agents")}</li>
            <li>{t("Check the fit & shape a pilot")}</li>
          </ol>
          <p className="jury-honesty">
            {t(
              "Allow around 6–10 minutes, depending on source responses. No sign-in is needed. Resident reports and planning assumptions are samples; project sources are real. Existing demo work is preserved.",
            )}
          </p>
          <button className="button" autoFocus onClick={start}>
            {t("Begin the walkthrough")} <Icon />
          </button>
          <button className="quiet-link" onClick={exit}>
            {t("Explore freely instead")}
          </button>
        </dialog>
      )}
      {visible &&
        progress &&
        copy &&
        (progress.minimized ? (
          <button
            className="jury-resume"
            onClick={() => setProgress((p) => p && { ...p, minimized: false })}
          >
            <Icon name="chat" size={18} /> {t("Resume jury guide")}{" "}
            <span>
              {jurySteps.indexOf(progress.step) + 1}/{jurySteps.length}
            </span>
          </button>
        ) : (
          <aside
            className="jury-coach"
            aria-label={t("Jury walkthrough guide")}
            onKeyDown={(e) => {
              if (e.key === "Escape")
                setProgress((p) => p && { ...p, minimized: true });
            }}
          >
            <header>
              <span className="jury-kicker">{t("YOUR WALKTHROUGH")}</span>
              <div>
                <button
                  aria-label={t("Minimize walkthrough")}
                  onClick={() =>
                    setProgress((p) => p && { ...p, minimized: true })
                  }
                >
                  −
                </button>
                <button aria-label={t("Close walkthrough")} onClick={exit}>
                  <Icon name="close" size={16} />
                </button>
              </div>
            </header>
            <div
              className="jury-progress"
              aria-label={t("Walkthrough progress")}
            >
              {jurySteps.map((s, i) => (
                <i
                  key={s}
                  className={
                    i <= jurySteps.indexOf(progress.step) ? "visited" : ""
                  }
                />
              ))}
            </div>
            <span className="jury-count">
              {t("Kraków / advisor journey")}{" "}
              <b>
                {String(jurySteps.indexOf(progress.step) + 1).padStart(2, "0")}{" "}
                / 12
              </b>
            </span>
            <div
              className="jury-message"
              key={progress.step}
              aria-live="polite"
            >
              <span className="jury-avatar" aria-hidden="true">
                e↗
              </span>
              <h2>{t(copy.title)}</h2>
              <p>{t(copy.body)}</p>
            </div>
            {progress.step === "run" && agent.name && (
              <div className="jury-agent" role="status">
                <i />
                {t(agent.name)} ·{" "}
                {t(agent.waiting ? "Handoff ready" : "Working now")}
              </div>
            )}
            {stopped && progress.step === "launch" && (
              <p className="jury-recovery">
                {t(
                  "The run stopped. Its logs are saved. Start another investigation to continue the walkthrough.",
                )}
              </p>
            )}
            {progress.step !== "done" ? (
              <>
                <div className="jury-instruction">
                  <span>↳ {t("YOUR NEXT ACTION")}</span>
                  <p>
                    {t(
                      onRoute
                        ? copy.action
                        : "You stepped away from this part of the journey. Return when you are ready; your edits are kept.",
                    )}
                  </p>
                </div>
                <button className="jury-show" onClick={showTarget}>
                  {t(!onRoute ? "Return to this step" : "Show me where")}{" "}
                  <Icon size={17} />
                </button>
                {onRoute &&
                  !targetFound &&
                  ["reality", "shape"].includes(progress.step) && (
                    <p className="jury-recovery">
                      {t(
                        "If the highlighted control is not visible, reopen this step below.",
                      )}
                    </p>
                  )}
                {progress.step === "access" && (
                  <Link className="jury-show" to={`${juryRoot}/agents`}>
                    {t("Continue to the agent studio")} <Icon size={17} />
                  </Link>
                )}
                {["reality", "shape"].includes(progress.step) && (
                  <button
                    className="quiet-link"
                    onClick={() => {
                      navigate(
                        `${expected}#${progress.step === "reality" ? "tour-fit" : "tour-adapt"}`,
                      );
                      setLocate((n) => n + 1);
                    }}
                  >
                    {t("Reopen this step")}
                  </button>
                )}
                {progress.step === "launch" && completedRun && (
                  <button
                    className="quiet-link"
                    onClick={() =>
                      setProgress((p) => p && { ...p, step: "compare" })
                    }
                  >
                    {t("Use the completed investigation")}
                  </button>
                )}
                {progress.step === "run" && !onRoute && (
                  <button
                    className="quiet-link"
                    onClick={() => {
                      setProgress((p) => p && { ...p, step: "launch" });
                      navigate(`${juryRoot}/agents`);
                    }}
                  >
                    {t("Restart interrupted research")}
                  </button>
                )}
              </>
            ) : (
              <div className="jury-finish">
                <button className="button" onClick={exit}>
                  {t("Keep exploring")} <Icon />
                </button>
                <button className="quiet-link" onClick={start}>
                  {t("Rehearse again")}
                </button>
                <Link to={`${juryRoot}/monitor`} onClick={exit}>
                  {t("Explore source monitoring")} ↗
                </Link>
              </div>
            )}
            <footer>
              {t("Your clicks move the journey forward.")}
              <br />
              {t("You can minimize or close the guide at any time.")}
            </footer>
          </aside>
        ))}
    </>
  );
}

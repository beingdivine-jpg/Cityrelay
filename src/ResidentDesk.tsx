import { useState } from "react";
import { Link } from "./navigation";
import { t } from "./i18n";
import { CommunityNav, Icon } from "./components";
import { summarizeReports, topicLabels } from "./civicEngine";
import type { CommunityProfile } from "./model";
import type { CivicWorkspace, CivicTopic } from "./civicModel";

export default function ResidentDesk({
  profile,
  civic,
}: {
  profile: CommunityProfile;
  civic: CivicWorkspace;
}) {
  const signals = summarizeReports(civic.reports);
  const [chosen, setChosen] = useState<CivicTopic>(signals[0]?.topic || "heat");
  const active = signals.find((s) => s.topic === chosen) || signals[0];
  const reports = civic.reports.filter(
    (r) =>
      r.topic === active?.topic &&
      r.kind === "complaint" &&
      r.status === "received" &&
      !r.duplicateOf,
  );
  const [page, setPage] = useState(0);
  const report = reports[page % Math.max(reports.length, 1)];
  const root = `/community/${profile.id}`;
  return (
    <div className="page-width resident-desk">
      <CommunityNav profile={profile} />
      <header className="desk-heading">
        <div>
          <span className="studio-kicker">{t("YOU’RE ADVISING KRAKÓW")}</span>
          <h1>
            {t("First, listen.")}
            <br />
            <em>{t("What needs to change?")}</em>
          </h1>
        </div>
        <div className="desk-heading-action">
          <p>
            {t(
              "Begin with the voices below. Then follow the research to see what another city’s experience could offer Kraków.",
            )}
          </p>
          <Link to={`${root}/agents`}>
            {t("Next: research")} <Icon size={18} />
          </Link>
        </div>
      </header>
      <section
        className="resident-worktable"
        aria-label={t("Explore the sample resident concerns")}
      >
        <div className="concern-index">
          <span className="studio-kicker">{t("THE SAMPLE INBOX")}</span>
          <p>{t("Choose a topic to hear a concern.")}</p>
          <div role="group" aria-label={t("Resident concern topics")}>
            {signals.map((s) => (
              <button
                key={s.topic}
                aria-pressed={active?.topic === s.topic}
                onClick={() => {
                  setChosen(s.topic);
                  setPage(0);
                }}
              >
                <span>{t(topicLabels[s.topic])}</span>
                <strong>{s.count}</strong>
                <Icon size={18} />
              </button>
            ))}
          </div>
          <small>
            {t("Counts exclude duplicates and reports awaiting review.")}
          </small>
          <Link to={`${root}/reports`}>
            {t("Open the complete inbox")} <Icon size={17} />
          </Link>
        </div>
        <div className={`resident-note topic-${active?.topic || "heat"}`}>
          <div className="note-meta">
            <span>{t("SAMPLE RESIDENT VOICE")}</span>
            <span>{report?.area || profile.name}</span>
          </div>
          <div className="quote-mark" aria-hidden="true">
            “
          </div>
          {report ? (
            <>
              <h2>
                {report.provenance === "demo" ? t(report.title) : report.title}
              </h2>
              <p>
                {report.provenance === "demo"
                  ? t(report.detail)
                  : report.detail}
              </p>
            </>
          ) : (
            <h2>{t("No eligible resident submissions.")}</h2>
          )}
          <div className="note-pagination">
            <span>
              {String(
                reports.length ? (page % reports.length) + 1 : 0,
              ).padStart(2, "0")}{" "}
              / {String(reports.length).padStart(2, "0")}
            </span>
            <button
              disabled={reports.length < 2}
              onClick={() => setPage((p) => p + 1)}
            >
              {t("Another voice")} <Icon size={20} />
            </button>
          </div>
        </div>
        <div className="desk-margin">
          <span className="desk-asterisk" aria-hidden="true">
            ✳
          </span>
          <p>
            {t("A concern is a starting point.")}
            <br />
            <em>{t("Evidence comes next.")}</em>
          </p>
          <span className="desk-small-note">
            {t("Illustrative reports. Real city sources.")}
          </span>
        </div>
      </section>
      <section className="desk-next">
        <div>
          <span className="studio-kicker">
            {t("NEXT / FOLLOW THE RESEARCH")}
          </span>
          <h2>{t("Let’s see what we can learn.")}</h2>
          <p>
            {t(
              "The agents will group these concerns, inspect the city context and compare documented responses. You can follow every step.",
            )}
          </p>
        </div>
        <Link className="studio-cta" to={`${root}/agents`}>
          <span>
            {t("Open the research room")}
            <small>{t("You control each handoff.")}</small>
          </span>
          <Icon size={25} />
        </Link>
      </section>
      <div className="desk-tools">
        <span>
          {civic.reports.length} {t("sample reports")} ·{" "}
          {civic.reports.filter((r) => r.kind === "idea").length}{" "}
          {t("resident ideas")}
        </span>
        <Link to={`${root}/data`}>
          {t("Meet the team & inspect the data")} ↗
        </Link>
        <Link to={`${root}/monitor`}>{t("Source monitoring")} ↗</Link>
      </div>
    </div>
  );
}

import { t as tr } from "./i18n";
import { useState } from "react";
import { Link, useNavigate } from "./navigation";
import { Button, Icon, TextField, SelectField, useApp } from "./components";
import { newProfile } from "./data";
import type { Setting } from "./model";
import { useShared } from "./SharedContext";
export default function Entry() {
  const { state, update } = useApp();
  const shared = useShared();
  const navigate = useNavigate();
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState(""),
    [city, setCity] = useState(""),
    [setting, setSetting] = useState<Setting>("city");
  const saved = state.profiles.filter(
    (p) => p.id !== "krakow" && p.id !== "krakow-demo" && p.name.trim(),
  );
  function enter(id: string, mode: "guided" | "own") {
    update((s) => ({
      ...s,
      advisor: {
        name: name.trim() || s.advisor?.name || "Municipal advisor",
        role: "Municipal innovation advisor",
        activeCommunityId: id,
        entryMode: mode,
      },
    }));
    navigate(`/community/${id}/challenge`);
  }
  function create() {
    const p = newProfile();
    p.name = city.trim();
    if (!p.name) return;
    p.setting = setting;
    p.authorityType = "Unknown";
    p.problems = [];
    p.goals.outcome = "all";
    update((s) => ({
      ...s,
      profiles: [...s.profiles, p],
      advisor: {
        name: name.trim() || s.advisor?.name || "Municipal advisor",
        role: "Municipal innovation advisor",
        activeCommunityId: p.id,
        entryMode: "own",
      },
    }));
    navigate(`/community/${p.id}/challenge`);
  }
  return (
    <div className="entry-page page-width">
      <Link className="quiet-link" to="/">
        <Icon name="back" size={16} />
        {tr(" Back to the idea")}
      </Link>
      <div className="entry-layout">
        <div className="entry-intro">
          <span className="eyebrow">
            {tr("THE MUNICIPAL INNOVATION WORKSPACE")}
          </span>
          <h1>
            {tr("Your place.")}
            <br />
            {tr("Your perspective.")}
            <br />
            <span className="blue-text">{tr("Your next move.")}</span>
          </h1>
          <p>
            {tr(
              "You help your municipality turn possibilities into practical change. Start with the place you advise.",
            )}
          </p>
          <div className="entry-role">
            <span className="role-symbol">{tr("↗")}</span>
            <div>
              <strong>{tr("Municipal innovation advisor")}</strong>
              <span>
                {tr("Resident voices. Agent research. Your judgement.")}
              </span>
            </div>
          </div>
          <p className="entry-storage">
            {tr(
              shared.workspace
                ? "Your team workspace is open. Continue there, or return to local exploration from Account & backup."
                : "Explore on this device first. Sign in to create a shared team workspace and receive resident reports.",
            )}
          </p>
          <Link className="button secondary" to="/account">
            {tr(shared.user ? "Account & backup" : "Sign in to collaborate")}
          </Link>
        </div>
        <div className="entry-options">
          {tr(
            creating ? (
              <form
                className="entry-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  create();
                }}
              >
                <button
                  type="button"
                  className="quiet-link"
                  onClick={() => setCreating(false)}
                >
                  <Icon name="back" size={16} />
                  {tr(" Choose another way")}
                </button>
                <h2>{tr("Where do you work?")}</h2>
                <TextField
                  label={tr("Municipality")}
                  value={city}
                  onChange={setCity}
                  required
                  placeholder={tr("Your city, town or village")}
                />
                <div className="form-grid">
                  <TextField
                    label={tr("Your name (optional)")}
                    value={name}
                    onChange={setName}
                    placeholder={tr("What should we call you?")}
                  />
                  <SelectField
                    label={tr("Community setting")}
                    value={setting}
                    onChange={(v) => setSetting(v as Setting)}
                    options={{
                      city: "City",
                      town: "Town",
                      village: "Village",
                      mixed: "Mixed municipality",
                    }}
                  />
                </div>
                <p className="micro">
                  {tr(
                    "You’ll shape the challenge next. You can leave resources unknown until you have the information.",
                  )}
                </p>
                <Button type="submit">
                  {tr("Create my workspace ")}
                  <Icon />
                </Button>
              </form>
            ) : (
              <>
                {tr(
                  state.advisor && (
                    <Link
                      className="resume-workspace"
                      to={`/community/${state.advisor.activeCommunityId}`}
                    >
                      <span>{tr("WELCOME BACK")}</span>
                      <strong>
                        {tr("Continue in")}
                        {tr(" ")}
                        {tr(
                          state.profiles.find(
                            (p) => p.id === state.advisor?.activeCommunityId,
                          )?.name || "your workspace",
                        )}
                      </strong>
                      <Icon />
                    </Link>
                  ),
                )}
                <Link
                  className="entry-choice guided-choice demo-choice"
                  to="/demo"
                >
                  <span className="choice-number">
                    {tr("START HERE / INTERACTIVE DEMO")}
                  </span>
                  <span className="choice-title">
                    {tr("Step inside Kraków.")}
                  </span>
                  <span className="choice-description">
                    {tr(
                      "A populated sample inbox, a visible agent investigation and a pilot you can shape. Follow the complete story.",
                    )}
                  </span>
                  <span className="demo-choice-stats">
                    {tr("18 sample reports · 5 agents · real city sources")}
                  </span>
                  <span className="choice-action">
                    {tr("Explore the Kraków demo")} <Icon />
                  </span>
                </Link>
                <button
                  className="entry-choice own-choice"
                  disabled={!!shared.workspace}
                  onClick={() => setCreating(true)}
                >
                  <span className="choice-number">
                    {tr("01 / YOUR MUNICIPALITY")}
                  </span>
                  <span className="choice-title">
                    {tr("Bring your")}
                    <br />
                    {tr("own challenge.")}
                  </span>
                  <span className="choice-description">
                    {tr(
                      "Set up your place and build a brief around what matters to your residents.",
                    )}
                  </span>
                  <span className="choice-action">
                    {tr("Start my workspace ")}
                    <Icon />
                  </span>
                </button>
              </>
            ),
          )}
          {tr(
            saved.length > 0 && (
              <details className="saved-workspaces">
                <summary>
                  {tr("Other workspaces on this device ")}
                  <span>{tr(saved.length)}</span>
                </summary>
                {tr(
                  saved.map((p) => (
                    <button key={p.id} onClick={() => enter(p.id, "own")}>
                      {p.name}
                      <Icon size={17} />
                    </button>
                  )),
                )}
              </details>
            ),
          )}
        </div>
      </div>
    </div>
  );
}

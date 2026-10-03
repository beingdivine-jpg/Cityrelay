import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button, Icon, TextField, SelectField, useApp } from "./components";
import { newProfile } from "./data";
import type { Setting } from "./model";
export default function Entry() {
  const { state, update } = useApp();
  const navigate = useNavigate();
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState(""),
    [city, setCity] = useState(""),
    [setting, setSetting] = useState<Setting>("city");
  const saved = state.profiles.filter(
    (p) => p.id !== "krakow" && p.name.trim(),
  );
  function enter(id: string, mode: "guided" | "own") {
    update((s) => ({
      ...s,
      advisor: {
        name: name.trim() || "Municipal advisor",
        role: "Municipal innovation advisor",
        activeCommunityId: id,
        entryMode: mode,
      },
    }));
    navigate(`/community/${id}/data`);
  }
  function create() {
    const p = newProfile();
    p.name = city.trim();
    if (!p.name) return;
    p.setting = setting;
    p.authorityType = `${p.name} municipal team`;
    p.problems = ["heat"];
    p.goals.outcome = "all";
    update((s) => ({
      ...s,
      profiles: [...s.profiles, p],
      advisor: {
        name: name.trim() || "Municipal advisor",
        role: "Municipal innovation advisor",
        activeCommunityId: p.id,
        entryMode: "own",
      },
    }));
    navigate(`/community/${p.id}/data`);
  }
  return (
    <div className="entry-page page-width">
      <Link className="quiet-link" to="/">
        <Icon name="back" size={16} /> Back to the idea
      </Link>
      <div className="entry-layout">
        <div className="entry-intro">
          <span className="eyebrow">THE MUNICIPAL INNOVATION WORKSPACE</span>
          <h1>
            Your place.
            <br />
            Your perspective.
            <br />
            <span className="blue-text">Your next move.</span>
          </h1>
          <p>
            You help your municipality turn possibilities into practical change.
            Start with the place you advise.
          </p>
          <div className="entry-role">
            <span className="role-symbol">↗</span>
            <div>
              <strong>Municipal innovation advisor</strong>
              <span>Resident voices. Agent research. Your judgement.</span>
            </div>
          </div>
          <p className="entry-storage">
            This preview saves your workspace on this device. No password or
            account is required.
          </p>
        </div>
        <div className="entry-options">
          {creating ? (
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
                <Icon name="back" size={16} /> Choose another way
              </button>
              <h2>Where do you work?</h2>
              <TextField
                label="Municipality"
                value={city}
                onChange={setCity}
                required
                placeholder="Your city, town or village"
              />
              <div className="form-grid">
                <TextField
                  label="Your name (optional)"
                  value={name}
                  onChange={setName}
                  placeholder="What should we call you?"
                />
                <SelectField
                  label="Community setting"
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
                You’ll shape the challenge next. You can leave resources unknown
                until you have the information.
              </p>
              <Button type="submit">
                Create my workspace <Icon />
              </Button>
            </form>
          ) : (
            <>
              {state.advisor && (
                <Link
                  className="resume-workspace"
                  to={`/community/${state.advisor.activeCommunityId}`}
                >
                  <span>WELCOME BACK</span>
                  <strong>
                    Continue in{" "}
                    {state.profiles.find(
                      (p) => p.id === state.advisor?.activeCommunityId,
                    )?.name || "your workspace"}
                  </strong>
                  <Icon />
                </Link>
              )}
              <button
                className="entry-choice own-choice"
                onClick={() => setCreating(true)}
              >
                <span className="choice-number">01 / YOUR MUNICIPALITY</span>
                <span className="choice-title">
                  Bring your
                  <br />
                  own challenge.
                </span>
                <span className="choice-description">
                  Set up your place and build a brief around what matters to
                  your residents.
                </span>
                <span className="choice-action">
                  Start my workspace <Icon />
                </span>
              </button>
              <button
                className="entry-choice guided-choice"
                onClick={() => enter("krakow", "guided")}
              >
                <span className="choice-number">JUST EXPLORING?</span>
                <span className="choice-title">
                  Let’s simplify it.
                  <br />
                  Try Kraków.
                </span>
                <span className="choice-description">
                  Take the advisor’s seat in a guided example, with real local
                  context and documented projects.
                </span>
                <span className="choice-action">
                  Enter the walkthrough <Icon />
                </span>
              </button>
            </>
          )}
          {saved.length > 0 && (
            <details className="saved-workspaces">
              <summary>
                Other workspaces on this device <span>{saved.length}</span>
              </summary>
              {saved.map((p) => (
                <button key={p.id} onClick={() => enter(p.id, "own")}>
                  {p.name}
                  <Icon size={17} />
                </button>
              ))}
            </details>
          )}
        </div>
      </div>
    </div>
  );
}

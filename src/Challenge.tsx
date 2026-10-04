import { useState } from "react";
import { useParams } from "react-router-dom";
import { useNavigate, Link } from "./navigation";
import { t as tr } from "./i18n";
import { Button, CommunityNav, Icon, TextField, useApp } from "./components";
import { Missing } from "./Workspace";
import type { Domain } from "./model";
export default function Challenge() {
  const { id } = useParams();
  const { state, saveProfile } = useApp();
  const navigate = useNavigate();
  const profile = state.profiles.find((p) => p.id === id);
  const [topic, setTopic] = useState<Domain | "">(profile?.problems[0] || "");
  const [objective, setObjective] = useState(profile?.goals.objective || "");
  const [error, setError] = useState("");
  if (!profile) return <Missing />;
  const choices: [Domain, string, string][] = [
    ["heat", "Heat & shade", "Comfortable public places during hot weather."],
    [
      "water",
      "Rain & water",
      "Public spaces that cope with rain and flooding.",
    ],
    [
      "services",
      "Public services",
      "Help people reach the services they need.",
    ],
    [
      "unknown",
      "Another challenge",
      "Describe your need. We will show gaps in our evidence.",
    ],
  ];
  return (
    <div className="page-width challenge-page">
      <CommunityNav profile={profile} />
      <div className="challenge-layout">
        <div>
          <span className="eyebrow">{tr("START WITH ONE REAL NEED")}</span>
          <h1>
            {tr("What would you like")}
            <br />
            <span className="blue-text">{tr("to change?")}</span>
          </h1>
          <p>
            {tr(
              "Choose a starting point. You can add residents’ voices and your team’s knowledge as you go.",
            )}
          </p>
          {profile.id === "krakow" && (
            <p className="agent-notice">
              {tr(
                "Kraków walkthrough: heat is an example planning challenge, not a measured ranking of residents’ concerns.",
              )}
            </p>
          )}
          <div className="journey-preview">
            <span>01</span>
            <strong>{tr("Your challenge")}</strong>
            <span>02</span>
            <strong>{tr("Evidence & research")}</strong>
            <span>03</span>
            <strong>{tr("Compare approaches")}</strong>
            <span>04</span>
            <strong>{tr("Your pilot brief")}</strong>
          </div>
          <p className="micro">
            {tr(
              "You will leave with a draft action, supporting sources and the local questions still to resolve.",
            )}
          </p>
        </div>
        <form
          className="challenge-form"
          onSubmit={(e) => {
            e.preventDefault();
            if (!topic) {
              setError("Choose a challenge to continue.");
              return;
            }
            if (topic === "unknown" && objective.trim().length < 10) {
              setError("Describe your challenge in at least 10 characters.");
              return;
            }
            saveProfile({
              ...profile,
              problems: [topic],
              goals: {
                ...profile.goals,
                outcome: "all",
                objective: objective.trim(),
              },
              updatedAt: new Date().toISOString(),
            });
            navigate(`/community/${id}/agents`);
          }}
        >
          <fieldset>
            <legend>{tr("Your starting priority")}</legend>
            <div className="challenge-choices">
              {choices.map(([key, label, description]) => (
                <label key={key} className={topic === key ? "selected" : ""}>
                  <input
                    type="radio"
                    name="challenge"
                    value={key}
                    checked={topic === key}
                    onChange={() => {
                      setTopic(key);
                      setError("");
                    }}
                  />
                  <span>
                    <strong>{tr(label)}</strong>
                    <small>{tr(description)}</small>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
          <TextField
            label={tr("What would a useful improvement look like?")}
            hint={tr(
              "Use your own words. Resources and permissions can remain unknown for now.",
            )}
            value={objective}
            onChange={setObjective}
            multiline
          />
          {error && (
            <p role="alert" className="form-error">
              {tr(error)}
            </p>
          )}
          <Button type="submit">
            {tr("Explore the evidence")} <Icon />
          </Button>
          <Link className="quiet-link" to={`/community/${id}`}>
            {tr("Review resident signals first")}
          </Link>
        </form>
      </div>
    </div>
  );
}

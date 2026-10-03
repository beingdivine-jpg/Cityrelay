import { useEffect, useRef, useState, type DragEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  assetLabels,
  budgetLabels,
  newProfile,
  outcomesFor,
  staffLabels,
} from "./data";
import { Button, Icon, SelectField, TextField, useApp } from "./components";
import type {
  Asset,
  Budget,
  CommunityProfile,
  Domain,
  Knowledge,
  Setting,
  Staff,
} from "./model";
export default function Profile() {
  const { state, saveProfile } = useApp();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(() =>
    state.profiles.find((p) => p.id === params.get("edit"))
      ? structuredClone(
          state.profiles.find((p) => p.id === params.get("edit"))!,
        )
      : newProfile(),
  );
  const [step, setStep] = useState(0);
  const [fileError, setFileError] = useState("");
  const [reading, setReading] = useState(false);
  const stepHeading = useRef<HTMLHeadingElement>(null);
  const previousStep = useRef(step);
  useEffect(() => {
    if (previousStep.current !== step) {
      stepHeading.current?.focus({ preventScroll: true });
      stepHeading.current?.scrollIntoView({
        block: "start",
        behavior: "instant",
      });
      previousStep.current = step;
    }
  }, [step]);
  function patch(change: Partial<CommunityProfile>) {
    const next = {
      ...profile,
      ...change,
      updatedAt: new Date().toISOString(),
      fieldProvenance: {
        ...profile.fieldProvenance,
        ...Object.fromEntries(
          Object.keys(change).map((key) => [key, "local user entry" as const]),
        ),
      },
    };
    setProfile(next);
    saveProfile(next);
    if (!params.get("edit"))
      navigate(`/start?edit=${next.id}`, { replace: true });
  }
  const readFile = async (file?: File) => {
    setFileError("");
    if (!file) return;
    if (
      !file.name.toLowerCase().endsWith(".txt") ||
      (file.type &&
        !["text/plain", "application/octet-stream"].includes(file.type))
    ) {
      setFileError(
        "Please choose a plain-text .txt file. PDF and Word files are not supported.",
      );
      return;
    }
    if (file.size > 100 * 1024) {
      setFileError("That file is too large. Choose a .txt file up to 100 KB.");
      return;
    }
    setReading(true);
    try {
      const text = await file.text();
      if (text.includes("\0")) throw Error();
      patch({ note: text });
    } catch {
      setFileError(
        "We could not read that file as plain text. Try saving it as a UTF-8 .txt file.",
      );
    } finally {
      setReading(false);
    }
  };
  const drop = (e: DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files.length !== 1)
      setFileError("Please drop one .txt file at a time.");
    else void readFile(e.dataTransfer.files[0]);
  };
  return (
    <div className="wrap profile-page">
      <Link className="quiet-link" to={`/community/${profile.id}`}>
        <Icon name="back" size={16} /> Back to your brief
      </Link>
      <div className="profile-layout">
        <aside className="profile-heading">
          <span className="eyebrow">A little context goes a long way</span>
          <h1>
            Start with <br />
            <em>your place.</em>
          </h1>
          <p>The most useful ideas connect with what’s already here.</p>
          <ol className="step-nav">
            {["Our place", "Our situation", "Our direction"].map((title, i) => (
              <li
                key={title}
                className={step === i ? "current" : step > i ? "completed" : ""}
              >
                <button
                  onClick={() => setStep(i)}
                  aria-current={step === i ? "step" : undefined}
                >
                  <span>{step > i ? "✓" : `0${i + 1}`}</span>
                  {title}
                </button>
              </li>
            ))}
          </ol>
          <p className="micro">
            Your municipal context. Edits stay on this device. “Unknown” is
            always a valid starting point.
          </p>
        </aside>
        <form
          className="profile-form"
          onSubmit={(e) => {
            e.preventDefault();
            if (step < 2) setStep(step + 1);
            else {
              saveProfile(profile);
              navigate(`/community/${profile.id}`);
            }
          }}
        >
          <span className="eyebrow">Step {step + 1} of 3</span>
          <h2 ref={stepHeading} tabIndex={-1}>
            {["Our place", "Our situation", "Our direction"][step]}
          </h2>
          <p className="form-intro">
            {
              [
                "Help us compare the kind of place you serve. Your community setting and responsible authority are separate details.",
                "Help us find ideas that can work with your resources. Missing information will stay visible in the assessment.",
                "Choose the direction of your next step. This filters approaches by intended outcome and keeps unverified delivery requirements visible.",
              ][step]
            }
          </p>
          {step === 0 && (
            <>
              <TextField
                label="Community name"
                value={profile.name}
                onChange={(name) => patch({ name })}
                placeholder="Your community"
                required
              />
              <div className="form-grid">
                <SelectField
                  label="Community setting"
                  value={profile.setting}
                  onChange={(v) => patch({ setting: v as Setting })}
                  options={{
                    unknown: "Not yet known",
                    city: "City",
                    town: "Town",
                    village: "Village",
                    mixed: "Mixed communities",
                  }}
                />
                <TextField
                  label="Responsible authority"
                  value={profile.authorityType}
                  onChange={(authorityType) => patch({ authorityType })}
                  hint="For example, municipal council or parish council."
                />
              </div>
              <TextField
                label="Settlement pattern"
                value={profile.context.pattern}
                onChange={(pattern) =>
                  patch({ context: { ...profile.context, pattern } })
                }
              />
              <SelectField
                label="Approximate population"
                value={profile.context.population}
                onChange={(population) =>
                  patch({ context: { ...profile.context, population } })
                }
                options={Object.fromEntries(
                  [
                    "Unknown",
                    "Under 1,000",
                    "1,000–5,000",
                    "5,000–10,000",
                    "10,000–25,000",
                    "25,000–50,000",
                    "50,000–100,000",
                    "Over 100,000",
                  ].map((x) => [x, x]),
                )}
              />
              <TextField
                label="Relevant geography"
                value={profile.context.geography}
                onChange={(geography) =>
                  patch({ context: { ...profile.context, geography } })
                }
                multiline
                placeholder="For example: dense river valley, or dispersed rural hamlets"
              />
            </>
          )}
          {step === 1 && (
            <>
              <SelectField
                label="Priority problem"
                value={profile.problems[0]}
                onChange={(v) =>
                  patch({
                    problems: [v as Domain],
                    goals: { ...profile.goals, outcome: "all" },
                  })
                }
                options={{
                  unknown: "Not yet known",
                  heat: "Heat preparedness",
                  water: "Rain and water resilience",
                  services: "Access to essential services",
                }}
              />
              <TextField
                label="What makes this a priority?"
                value={profile.priorities.join("\n")}
                onChange={(v) => patch({ priorities: v.split("\n") })}
                multiline
              />
              <div className="form-grid">
                <SelectField
                  label="Available pilot budget"
                  value={profile.resources.budget}
                  onChange={(v) =>
                    patch({
                      resources: { ...profile.resources, budget: v as Budget },
                    })
                  }
                  options={budgetLabels}
                />
                <SelectField
                  label="Staff availability"
                  value={profile.resources.staff}
                  onChange={(v) =>
                    patch({
                      resources: { ...profile.resources, staff: v as Staff },
                    })
                  }
                  options={staffLabels}
                />
              </div>
              <h3>What can you build on?</h3>
              <div className="form-grid">
                {Object.entries(assetLabels).map(([key, label]) => (
                  <SelectField
                    key={key}
                    label={label}
                    value={profile.assets[key as Asset]}
                    onChange={(v) =>
                      patch({
                        assets: { ...profile.assets, [key]: v as Knowledge },
                      })
                    }
                    options={{
                      unknown: "Unknown / needs checking",
                      yes: "Available",
                      no: "Not available",
                    }}
                  />
                ))}
              </div>
              <TextField
                label="Existing initiatives"
                value={profile.existingInitiatives.join("\n")}
                onChange={(v) => patch({ existingInitiatives: v.split("\n") })}
                multiline
                hint="One per line. These help identify opportunities to reuse existing work."
              />
              <TextField
                label="Current restrictions"
                value={profile.restrictions}
                onChange={(restrictions) => patch({ restrictions })}
                multiline
                hint="Retained for local review. Free-text restrictions are not automatically interpreted by the matching rules."
              />
            </>
          )}
          {step === 2 && (
            <>
              <SelectField
                label="Desired outcome"
                value={profile.goals.outcome}
                onChange={(outcome) =>
                  patch({ goals: { ...profile.goals, outcome } })
                }
                options={
                  outcomesFor(profile.problems[0]) as Record<string, string>
                }
              />
              <TextField
                label="Your ambition"
                value={profile.goals.ambition}
                onChange={(ambition) =>
                  patch({ goals: { ...profile.goals, ambition } })
                }
                multiline
                placeholder="What would you like to be different?"
              />
              <SelectField
                label="Planning horizon"
                value={profile.goals.horizon}
                onChange={(horizon) =>
                  patch({ goals: { ...profile.goals, horizon } })
                }
                options={{
                  unknown: "Not yet known",
                  "3": "Next 3 days",
                  "30": "Next month",
                  "90": "Next 3 months",
                  "365": "Next year",
                  "1095": "Next 3 years",
                }}
              />
              <TextField
                label="Measurable pilot objective"
                value={profile.goals.objective}
                onChange={(objective) =>
                  patch({ goals: { ...profile.goals, objective } })
                }
                multiline
                placeholder="For example: trial four sessions and record access barriers."
              />
              <div
                className="note-drop"
                onDragOver={(e) => e.preventDefault()}
                onDrop={drop}
              >
                <Icon name="book" />
                <div>
                  <label htmlFor="note-file">Attach a strategy note</label>
                  <p>
                    Choose or drop one .txt file · up to 100 KB · read locally
                  </p>
                  <input
                    id="note-file"
                    type="file"
                    accept=".txt,text/plain"
                    onChange={(e) => void readFile(e.target.files?.[0])}
                  />
                </div>
              </div>
              {reading && <p role="status">Reading your text file…</p>}
              {fileError && (
                <p className="form-error" role="alert">
                  {fileError}
                </p>
              )}
              <TextField
                label="Review or paste your note"
                value={profile.note}
                onChange={(note) => patch({ note: note.slice(0, 102400) })}
                multiline
                hint="Attached as a note only. No AI analysis, automatic field extraction or upload takes place."
              />
            </>
          )}
          <div className="profile-bottom">
            {step > 0 ? (
              <Button secondary onClick={() => setStep(step - 1)}>
                <Icon name="back" /> Back
              </Button>
            ) : (
              <span className="micro">Changes save locally as you go.</span>
            )}
            <Button type="submit">
              {step === 2 ? "Find relevant approaches" : "Continue"} <Icon />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

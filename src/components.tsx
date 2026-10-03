import { t as tr } from "./i18n";
import { createContext, useContext, useId, type ReactNode } from "react";
import { Link, NavLink } from "react-router-dom";
import type { AppState, CommunityProfile, MatchAssessment } from "./model";
export const AppContext = createContext<{
  state: AppState;
  update: (fn: (s: AppState) => AppState) => void;
  notify: (message: string) => void;
  saveProfile: (p: CommunityProfile) => void;
}>({} as never);
export const useApp = () => useContext(AppContext);
export function Icon({
  name = "arrow",
  size = 20,
}: {
  name?:
    | "arrow"
    | "back"
    | "sun"
    | "pin"
    | "check"
    | "plus"
    | "download"
    | "copy"
    | "close"
    | "edit"
    | "leaf"
    | "chat"
    | "book";
  size?: number;
}) {
  const paths = {
    arrow: (
      <>
        <path d="M4 12h15m-6-6 6 6-6 6" />
      </>
    ),
    back: <path d="M20 12H5m6-6-6 6 6 6" />,
    sun: (
      <>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5" />
      </>
    ),
    pin: (
      <>
        <path d="M19 10c0 6-7 11-7 11S5 16 5 10a7 7 0 1 1 14 0Z" />
        <circle cx="12" cy="10" r="2" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    plus: <path d="M12 5v14M5 12h14" />,
    download: (
      <>
        <path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5" />
      </>
    ),
    copy: (
      <>
        <rect x="8" y="8" width="12" height="13" rx="2" />
        <path d="M16 8V3H3v13h5" />
      </>
    ),
    close: <path d="m6 6 12 12M6 18 18 6" />,
    edit: (
      <>
        <path d="m4 16 12-12 4 4L8 20H4v-4Zm9-9 4 4" />
      </>
    ),
    leaf: (
      <>
        <path d="M20 3C7 2 2 7 5 15s16 5 15-12Z" />
        <path d="m3 21 12-12" />
      </>
    ),
    chat: (
      <>
        <path d="M21 11a9 9 0 0 1-9 9H3l1-6a9 9 0 1 1 17-3Z" />
        <path d="M8 10h8m-8 4h5" />
      </>
    ),
    book: (
      <>
        <path d="M12 5v16M3 3l9 2 9-2v16l-9 2-9-2V3Z" />
      </>
    ),
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {tr(paths[name])}
    </svg>
  );
}
export function Logo() {
  return (
    <Link className="wordmark" to="/" aria-label={tr("Elsewhere home")}>
      <svg
        width="30"
        height="30"
        viewBox="0 0 32 32"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M4 27 27 4M6 4h21v21M4 15v12h12"
          stroke="currentColor"
          strokeWidth="3.5"
        />
      </svg>
      <span>{tr("elsewhere")}</span>
    </Link>
  );
}
export function Button({
  children,
  to,
  secondary = false,
  onClick,
  type = "button",
  disabled = false,
}: {
  children: ReactNode;
  to?: string;
  secondary?: boolean;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
}) {
  const className = `button ${secondary ? "secondary" : ""}`;
  return to ? (
    <Link className={className} to={to}>
      {tr(children)}
    </Link>
  ) : (
    <button
      className={className}
      onClick={onClick}
      type={type}
      disabled={disabled}
    >
      {tr(children)}
    </button>
  );
}
export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: (id: string) => ReactNode;
}) {
  const id = useId();
  return (
    <div className="field">
      <label htmlFor={id}>{tr(label)}</label>
      {tr(children(id))}
      {tr(
        hint && (
          <p id={`${id}-hint`} className="field-hint">
            {tr(hint)}
          </p>
        ),
      )}
    </div>
  );
}
export function SelectField({
  label,
  value,
  options,
  onChange,
  hint,
}: {
  label: string;
  value: string;
  options: Record<string, string>;
  onChange: (value: string) => void;
  hint?: string;
}) {
  return (
    <Field label={tr(label)} hint={hint}>
      {tr((id) => (
        <select
          id={id}
          aria-describedby={hint ? `${id}-hint` : undefined}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          {tr(
            Object.entries(options).map(([key, text]) => (
              <option key={key} value={key}>
                {tr(text)}
              </option>
            )),
          )}
        </select>
      ))}
    </Field>
  );
}
export function TextField({
  label,
  value,
  onChange,
  multiline = false,
  hint,
  required = false,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  hint?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <Field label={tr(label)} hint={hint}>
      {tr((id) =>
        multiline ? (
          <textarea
            id={id}
            aria-describedby={hint ? `${id}-hint` : undefined}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={3}
            required={required}
            placeholder={tr(placeholder)}
          />
        ) : (
          <input
            id={id}
            aria-describedby={hint ? `${id}-hint` : undefined}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            required={required}
            placeholder={tr(placeholder)}
          />
        ),
      )}
    </Field>
  );
}
export const Tag = ({
  children,
  kind = "",
}: {
  children: ReactNode;
  kind?: string;
}) => <span className={`tag ${kind}`}>{tr(children)}</span>;
export function Status({ assessment }: { assessment: MatchAssessment }) {
  return (
    <Tag
      kind={
        assessment.category === "Worth exploring"
          ? "positive"
          : assessment.category === "Needs confirmation"
            ? "unknown"
            : "blocked"
      }
    >
      <span className="status-dot" />
      {tr(assessment.category)}
    </Tag>
  );
}
export function CommunityNav({ profile }: { profile: CommunityProfile }) {
  const { state } = useApp();
  return (
    <div className="civic-navigation">
      <div className="community-nav">
        <div className="community-identity">
          <span className="community-initial">
            {tr(profile.name.slice(0, 1) || "↗")}
          </span>
          <div>
            <strong>{tr(profile.name || "Your municipality")}</strong>
            <span>
              {tr(
                state.advisor?.entryMode === "guided" && profile.id === "krakow"
                  ? "Guided municipal workspace"
                  : "Municipal intelligence workspace",
              )}
            </span>
          </div>
        </div>
        <nav aria-label={tr("Your innovation journey")}>
          <NavLink end to={`/community/${profile.id}`}>
            <span>{tr("01")}</span>
            {tr(" City signals")}
          </NavLink>
          <NavLink to={`/community/${profile.id}/agents`}>
            <span>{tr("02")}</span>
            {tr(" Agent studio")}
          </NavLink>
          <NavLink to={`/community/${profile.id}/opportunities`}>
            <span>{tr("03")}</span>
            {tr(" Opportunities")}
          </NavLink>
          <NavLink to={`/community/${profile.id}/plan`}>
            <span>{tr("04")}</span>
            {tr(" Pilot plan")}
          </NavLink>
        </nav>
      </div>
      <div className="civic-utility-nav">
        <div>
          <Link to={`/community/${profile.id}/data`}>{tr("Team & data")}</Link>
          <Link to={`/community/${profile.id}/brief`}>
            {tr("Municipal brief")}
          </Link>
          <Link to={`/community/${profile.id}/monitor`}>
            {tr("Monitoring")}
            {tr(" ")}
            <span>
              {tr(
                state.civic?.[profile.id]?.notices.filter((n) => !n.read)
                  .length || 0,
              )}
            </span>
          </Link>
        </div>
        <Link to={`/report/${profile.id}`}>
          <Icon name="chat" size={14} />
          {tr(" Resident space ")}
          <Icon size={14} />
        </Link>
      </div>
    </div>
  );
}
export function EmptyState({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="empty-state">
      <Icon name="leaf" size={34} />
      <h2>{tr(title)}</h2>
      <div>{tr(children)}</div>
    </div>
  );
}
export function Readiness({ assessment }: { assessment: MatchAssessment }) {
  return (
    <div className="readiness-list">
      {tr(
        assessment.readiness.map((check) => (
          <div key={check.key} className="readiness-row">
            <span className={`readiness-symbol ${check.state}`}>
              {tr(
                check.state === "met"
                  ? "✓"
                  : check.state === "unknown"
                    ? "?"
                    : "−",
              )}
            </span>
            <div>
              <div className="readiness-label">
                <strong>{tr(check.label)}</strong>
                <span>
                  {tr(
                    check.state === "met"
                      ? "Met"
                      : check.state === "unmet"
                        ? "Unmet"
                        : "Unknown",
                  )}
                </span>
              </div>
              <p>{tr(check.explanation)}</p>
            </div>
          </div>
        )),
      )}
    </div>
  );
}

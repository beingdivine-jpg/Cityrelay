import { getSource } from "./sources";
export function SourceList({
  ids,
  compact = false,
}: {
  ids: string[];
  compact?: boolean;
}) {
  return (
    <div className={`source-list ${compact ? "source-list-compact" : ""}`}>
      {ids.map((id) => {
        const s = getSource(id);
        return s ? (
          <a key={id} href={s.url} target="_blank" rel="noreferrer">
            <span className="source-type">{s.kind}</span>
            <strong>
              {s.title} <span aria-hidden="true">↗</span>
            </strong>
            <small>
              {s.publisher} · {s.published}
            </small>
            {!compact && <small>Source checked {s.checked}</small>}
          </a>
        ) : null;
      })}
    </div>
  );
}

import { t as tr } from "./i18n";
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
      {tr(
        ids.map((id) => {
          const s = getSource(id);
          return s ? (
            <a key={id} href={s.url} target="_blank" rel="noreferrer">
              <span className="source-type">{tr(s.kind)}</span>
              <strong>
                {s.title} <span aria-hidden="true">{tr("↗")}</span>
              </strong>
              <small>
                {s.publisher}
                {tr(" · ")}
                {tr(s.published)}
              </small>
              {tr(
                !compact && (
                  <small>
                    {tr("Source checked ")}
                    {tr(s.checked)}
                  </small>
                ),
              )}
            </a>
          ) : null;
        }),
      )}
    </div>
  );
}

import { useEffect, useState } from "react";
import world from "./worldMap.json";
import { examples } from "./data";
import { getSource } from "./sources";
import { t } from "./i18n";
const project = (coordinates: [number, number]) => [
  (coordinates[0] + 180) * 2.5,
  (85 - coordinates[1]) * 2.5,
];
// Keep dateline-crossing rings continuous instead of filling a band across the map.
const geography = world.flatMap((country) => {
  let crossesDateline = false;
  const path = country.path
    .split("M")
    .filter(Boolean)
    .map((ring) => {
      let previous: number | undefined;
      let offset = 0;
      const points = [...ring.matchAll(/(-?[\d.]+),(-?[\d.]+)/g)].map(
        (match) => {
          const raw = Number(match[1]);
          if (
            previous !== undefined &&
            Math.abs(raw + offset - previous) > 450
          ) {
            offset += raw + offset > previous ? -900 : 900;
            crossesDateline = true;
          }
          previous = raw + offset;
          return `${previous},${match[2]}`;
        },
      );
      return `M${points.join("L")}Z`;
    })
    .join("");
  return (crossesDateline ? [-900, 0, 900] : [0]).map((offset) => ({
    key: `${country.id}-${offset}`,
    path,
    offset,
  }));
});
/** Existing Natural Earth geography and documented city locations. */
export default function CityAtlas() {
  const [selected, setSelected] = useState(0);
  const [paused, setPaused] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  useEffect(() => {
    if (paused) return;
    const timer = setInterval(
      () => setSelected((s) => (s + 1) % examples.length),
      8000,
    );
    return () => clearInterval(timer);
  }, [paused]);
  const example = examples[selected];
  const source = getSource(example.sources[0])!;
  const [x, y] = project(example.origin.coordinates);
  return (
    <section
      className={`city-atlas ${paused ? "atlas-paused" : ""}`}
      aria-label={t("Explore a documented city idea")}
    >
      <div className="atlas-caption">
        <span>{t("THE CITY-TO-CITY ATLAS")}</span>
        <button onClick={() => setPaused(!paused)} aria-pressed={paused}>
          {t(paused ? "Play motion" : "Pause motion")} {paused ? "▷" : "Ⅱ"}
        </button>
      </div>
      <div className="atlas-map">
        <svg viewBox="170 30 600 370" aria-hidden="true">
          <defs>
            <pattern
              id="city-atlas-grid"
              width="25"
              height="25"
              patternUnits="userSpaceOnUse"
            >
              <circle cx="1" cy="1" r=".6" fill="currentColor" />
            </pattern>
          </defs>
          <rect
            x="170"
            y="30"
            width="600"
            height="370"
            fill="url(#city-atlas-grid)"
            opacity=".2"
          />
          <g className="atlas-land">
            {geography.map((country) => (
              <path
                key={country.key}
                d={country.path}
                transform={`translate(${country.offset} 0)`}
              />
            ))}
          </g>
          <path className="atlas-crosshair" d={`M${x} 30V400M170 ${y}H770`} />
          {examples.map((item, i) => {
            const [cx, cy] = project(item.origin.coordinates);
            return (
              <g
                key={item.id}
                className={
                  selected === i ? "atlas-point selected" : "atlas-point"
                }
              >
                <circle cx={cx} cy={cy} r={selected === i ? 5 : 3} />
                {selected === i && (
                  <>
                    <circle className="atlas-ring" cx={cx} cy={cy} r="17" />
                    <circle
                      className="atlas-ring outer"
                      cx={cx}
                      cy={cy}
                      r="29"
                    />
                  </>
                )}
              </g>
            );
          })}
          <text x="184" y="384" className="atlas-coordinate">
            {example.origin.coordinates[1].toFixed(2)}° /{" "}
            {example.origin.coordinates[0].toFixed(2)}°
          </text>
          <path d="M744 352V380M730 366H758" className="atlas-crosshair" />
        </svg>
      </div>
      <div className="atlas-project" aria-live={paused ? "polite" : "off"}>
        <span className="atlas-index">
          {String(selected + 1).padStart(2, "0")}
          <small> / 05</small>
        </span>
        <div>
          <h2>{t(example.origin.name)}</h2>
          <p>{t(example.shortTitle)}</p>
        </div>
        <a
          href={source.url}
          target="_blank"
          rel="noreferrer"
          aria-label={`${t("Read the city source")} · ${example.origin.name}`}
        >
          ↗
        </a>
      </div>
      <div className="atlas-places">
        {examples.map((item, i) => (
          <button
            key={item.id}
            aria-pressed={selected === i}
            onClick={() => {
              setSelected(i);
              setPaused(true);
            }}
          >
            {t(item.origin.name)}
          </button>
        ))}
      </div>
      <div className="atlas-credit">
        <span>{t("Documented projects. Approximate city locations.")}</span>
        <a href={getSource("world-map")!.url} target="_blank" rel="noreferrer">
          Natural Earth ↗
        </a>
      </div>
    </section>
  );
}

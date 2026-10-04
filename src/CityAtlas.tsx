import { useEffect, useRef, useState } from "react";
import { examples } from "./data";
import { getSource } from "./sources";
import { t } from "./i18n";
import IdeaGlobe from "./IdeaGlobe";
import "./globe.css";
const tour = [0, 2, 4, 3, 1];
const reducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;
/** Real documented projects in an animated editorial globe, not a live discovery feed. */
export default function CityAtlas() {
  const [selected, setSelected] = useState(0);
  const [reduced, setReduced] = useState(reducedMotion);
  const [paused, setPaused] = useState(reducedMotion);
  const [turn, setTurn] = useState(0);
  const [visible, setVisible] = useState(true);
  const [pageVisible, setPageVisible] = useState(() => !document.hidden);
  const section = useRef<HTMLElement>(null);
  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const change = () => {
      setReduced(preference.matches);
      if (preference.matches) setPaused(true);
    };
    const visibility = () => setPageVisible(!document.hidden);
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold: 0.1 },
    );
    if (section.current) observer.observe(section.current);
    preference.addEventListener("change", change);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      observer.disconnect();
      preference.removeEventListener("change", change);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, []);
  const moving = !paused && !reduced && visible && pageVisible;
  useEffect(() => {
    if (!moving) return;
    const timer = setTimeout(
      () => setSelected(tour[(tour.indexOf(selected) + 1) % tour.length]),
      7000,
    );
    return () => clearTimeout(timer);
  }, [moving, selected]);
  const example = examples[selected],
    source = getSource(example.sources[0])!;
  const next = tour[(tour.indexOf(selected) + 1) % tour.length];
  const choose = (index: number) => {
    setSelected(index);
    setTurn(0);
    setPaused(true);
  };
  const rotate = (amount: number) => {
    setPaused(true);
    setTurn((value) => value + amount);
  };
  return (
    <section
      ref={section}
      className={`city-atlas globe-atlas ${moving ? "globe-moving" : "atlas-paused"}`}
      aria-label={t("Explore a documented city idea")}
    >
      <div className="atlas-caption">
        <span>
          <i className="orbit-status" />
          {t("IDEAS IN ORBIT")}
        </span>
        <button
          onClick={() => setPaused((value) => !value)}
          aria-pressed={paused}
          disabled={reduced}
        >
          {t(
            reduced
              ? "Reduced motion"
              : paused
                ? "Play motion"
                : "Pause motion",
          )}{" "}
          <span aria-hidden="true">{paused ? "▷" : "Ⅱ"}</span>
        </button>
      </div>
      <div className="globe-stage">
        <div className="globe-side-label" aria-hidden="true">
          {t("LOCAL KNOWLEDGE / WORLDWIDE")}
        </div>
        <IdeaGlobe
          selected={selected}
          paused={!moving}
          reduced={reduced}
          turn={turn}
          onTurn={rotate}
        />
        <div className="globe-navigation" aria-label={t("Turn the globe")}>
          <button
            onClick={() => rotate(-0.45)}
            aria-label={t("Rotate globe left")}
          >
            ←
          </button>
          <span>{t("Turn the world")}</span>
          <button
            onClick={() => rotate(0.45)}
            aria-label={t("Rotate globe right")}
          >
            →
          </button>
        </div>
        <span className="globe-scale" aria-hidden="true">
          {String(examples.length).padStart(2, "0")}{" "}
          {t("CITIES / SHARED POSSIBILITIES")}
        </span>
      </div>
      <div className="globe-discovery" aria-live={paused ? "polite" : "off"}>
        <div className="globe-discovery-heading">
          <span>{t("IN THE SPOTLIGHT")}</span>
          <span>
            {String(selected + 1).padStart(2, "0")} /{" "}
            {String(examples.length).padStart(2, "0")}
          </span>
        </div>
        <div className="atlas-project" key={example.id}>
          <div>
            <h2>{t(example.origin.name)}</h2>
            <p>{t(example.shortTitle)}</p>
          </div>
          <a
            href={source.url}
            target="_blank"
            rel="noreferrer"
            aria-label={`${t("Read the city source")} · ${t(example.origin.name)}`}
          >
            ↗
          </a>
        </div>
        <div className="globe-tour-track">
          <i key={`${selected}-${moving}`} />
        </div>
        <button className="globe-next" onClick={() => choose(next)}>
          <span>{t("Next perspective")}</span>
          <strong>{t(examples[next].origin.name)} ↗</strong>
        </button>
      </div>
      <div className="atlas-places" aria-label={t("Choose a city")}>
        {examples.map((item, i) => (
          <button
            key={item.id}
            aria-pressed={selected === i}
            onClick={() => choose(i)}
          >
            {t(item.origin.name)}
          </button>
        ))}
      </div>
      <div className="atlas-credit">
        <span>
          {t("Documented ideas. Animated connections, not a live feed.")}
        </span>
        <a href={getSource("world-map")!.url} target="_blank" rel="noreferrer">
          Natural Earth ↗
        </a>
      </div>
    </section>
  );
}

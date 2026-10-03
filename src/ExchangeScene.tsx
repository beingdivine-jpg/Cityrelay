import { useState } from "react";
import { t } from "./i18n";
import { getSource } from "./sources";
import { examples } from "./data";

const places = ["barcelona-shelters", "helsinki-info", "paris-oasis"];
/** An original moving illustration of knowledge exchange, not a map or a live feed. */
export default function ExchangeScene() {
  const [selected, setSelected] = useState(0);
  const [paused, setPaused] = useState(false);
  const example = examples.find((e) => e.id === places[selected])!;
  const source = getSource(example.sources[0]);
  return (
    <div
      className={`exchange-scene scene-${selected} ${paused ? "motion-paused" : ""}`}
    >
      <div className="exchange-topline">
        <span>{t("THE IDEA EXCHANGE")}</span>
        <button onClick={() => setPaused(!paused)} aria-pressed={paused}>
          {t(paused ? "Play motion" : "Pause motion")}{" "}
          <span aria-hidden="true">{paused ? "▷" : "Ⅱ"}</span>
        </button>
      </div>
      <div className="exchange-drawing" aria-hidden="true">
        <svg viewBox="0 0 680 590" fill="none">
          <defs>
            <pattern
              id="exchange-hatch"
              width="7"
              height="7"
              patternUnits="userSpaceOnUse"
              patternTransform="rotate(30)"
            >
              <path d="M0 0V7" stroke="currentColor" strokeOpacity=".13" />
            </pattern>
          </defs>
          <ellipse
            cx="355"
            cy="305"
            rx="269"
            ry="209"
            fill="#ddd989"
            transform="rotate(-16 355 305)"
          />
          <ellipse
            cx="365"
            cy="329"
            rx="231"
            ry="154"
            stroke="#765263"
            strokeWidth="1"
            strokeDasharray="3 8"
            transform="rotate(-16 365 329)"
          />
          <path
            className="exchange-route"
            d="M115 157C271 4 634 181 570 383C516 552 238 536 226 418C215 313 471 350 452 252C435 166 225 94 115 157Z"
            stroke="#532d40"
            strokeWidth="2"
          />
          <circle
            className="travelling-idea"
            r="10"
            fill="#d94629"
            stroke="#f5d8b8"
            strokeWidth="5"
          />
          <g className="exchange-sun">
            <circle cx="542" cy="137" r="55" fill="#dd522f" />
            <path
              d="M542 66V207M471 137H613M492 87L592 187M492 187L592 87"
              stroke="#dd522f"
              strokeWidth="2"
            />
            <circle
              cx="542"
              cy="137"
              r="37"
              stroke="#f5d8b8"
              strokeDasharray="2 6"
              strokeWidth="2"
            />
          </g>
          <g className="city-print">
            <path
              d="M171 345L369 241L523 333L327 446Z"
              fill="#542f42"
              opacity=".15"
            />
            <path
              d="M155 325L352 222L514 313L318 422Z"
              fill="#f4b390"
              stroke="#532d40"
              strokeWidth="1.5"
            />
            <path
              d="M155 325V346L318 442V422Z"
              fill="#db704a"
              stroke="#532d40"
              strokeWidth="1.5"
            />
            <path
              d="M318 422L514 313V334L318 442Z"
              fill="#bb7052"
              stroke="#532d40"
              strokeWidth="1.5"
            />
            <path
              d="M246 286L408 374M187 344L386 239M283 389L475 286"
              stroke="#fff0d0"
              strokeWidth="12"
            />
            <path
              d="M246 286L408 374M187 344L386 239M283 389L475 286"
              stroke="#9d6857"
              strokeWidth="1"
              strokeDasharray="5 7"
            />
            <g className="print-library">
              <path
                d="M291 290V176L365 136L429 174V287L354 330Z"
                fill="#f7e8c9"
                stroke="#532d40"
                strokeWidth="2"
              />
              <path
                d="M354 214L429 174V287L354 330Z"
                fill="#cebfda"
                stroke="#532d40"
                strokeWidth="2"
              />
              <path
                d="M282 176L365 126L440 172L354 223Z"
                fill="#df5738"
                stroke="#532d40"
                strokeWidth="2"
              />
              <path
                d="M291 176L365 135L429 173"
                stroke="#f4bd9b"
                strokeWidth="2"
              />
              <path
                d="M310 224V200L324 208V232ZM331 236V212L345 220V244ZM310 263V240L324 248V271ZM331 275V252L345 260V283Z"
                fill="#7e677e"
              />
              <path
                d="M368 231V216L386 206V221ZM395 216V201L414 191V206ZM368 259V244L386 234V249ZM395 244V229L414 219V234Z"
                fill="#694563"
              />
              <path
                d="M376 317V281Q387 266 398 268V305"
                fill="#694563"
                stroke="#532d40"
                strokeWidth="1.5"
              />
            </g>
            <g className="print-house">
              <path
                d="M213 305V250L249 229L279 249V304L245 324Z"
                fill="#f9e7be"
                stroke="#532d40"
                strokeWidth="2"
              />
              <path
                d="M245 271L279 249V304L245 324Z"
                fill="#e8bb69"
                stroke="#532d40"
                strokeWidth="2"
              />
              <path
                d="M205 251L225 220L252 210L285 248L246 274Z"
                fill="#9c6681"
                stroke="#532d40"
                strokeWidth="2"
              />
              <path
                d="M222 281V265L233 272V288M255 291V278L266 271V284"
                fill="#694563"
              />
            </g>
            <g className="print-trees">
              <path
                d="M431 319V279M455 332V302M270 357V318"
                stroke="#532d40"
                strokeWidth="3"
              />
              <ellipse
                cx="431"
                cy="263"
                rx="23"
                ry="35"
                fill="#7f8960"
                stroke="#532d40"
                strokeWidth="1.5"
              />
              <ellipse
                cx="455"
                cy="293"
                rx="18"
                ry="27"
                fill="#a2aa70"
                stroke="#532d40"
                strokeWidth="1.5"
              />
              <ellipse
                cx="270"
                cy="307"
                rx="21"
                ry="29"
                fill="#8f9d67"
                stroke="#532d40"
                strokeWidth="1.5"
              />
              <path
                d="M431 243V290M455 278V310M270 290V331"
                stroke="#532d40"
                strokeWidth="1"
              />
            </g>
            <path
              d="M162 325L318 414L509 310"
              stroke="#fff0d0"
              strokeWidth="2"
            />
          </g>
          <g className="exchange-seed">
            <path
              d="M105 393C54 373 83 321 111 350C142 311 186 354 143 389C189 417 142 464 119 423C95 465 52 417 105 393Z"
              fill="#ad8eb5"
              stroke="#532d40"
              strokeWidth="1.5"
            />
            <circle
              cx="121"
              cy="391"
              r="14"
              fill="#f5d8b8"
              stroke="#532d40"
              strokeWidth="1.5"
            />
          </g>
          <path
            d="M491 491L523 477M514 466L523 477L520 488"
            stroke="#532d40"
            strokeWidth="2"
          />
          <path
            d="M105 181L77 203M90 207L77 203L78 188"
            stroke="#532d40"
            strokeWidth="2"
          />
          <ellipse
            cx="355"
            cy="305"
            rx="269"
            ry="209"
            fill="url(#exchange-hatch)"
            transform="rotate(-16 355 305)"
            pointerEvents="none"
          />
        </svg>
        <span className="exchange-label origin-label">
          {t(example.origin.name)}
          <small>{t("An idea, elsewhere")}</small>
        </span>
        <span className="exchange-label destination-label">
          {t("Your city")}
          <small>{t("A possibility, here")}</small>
        </span>
      </div>
      <div
        className="exchange-selector"
        aria-label={t("Explore a documented city idea")}
      >
        {places.map((id, i) => (
          <button
            key={id}
            aria-pressed={selected === i}
            onClick={() => setSelected(i)}
          >
            <span>{String(i + 1).padStart(2, "0")}</span>
            {t(examples.find((e) => e.id === id)!.origin.name)}
          </button>
        ))}
      </div>
      <div className="exchange-source" aria-live="polite">
        <span>{t(example.shortTitle)}</span>
        <a href={source?.url} target="_blank" rel="noreferrer">
          {t("Read the city source")} ↗
        </a>
      </div>
    </div>
  );
}

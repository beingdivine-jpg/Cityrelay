import world from "./worldMap.json";
import { examples } from "./data";
const project = (lon: number, lat: number) => [
  (lon + 180) * 2.5,
  (85 - lat) * 2.5,
];
const labels: Record<string, { x: number; y: number }> = {
  "barcelona-shelters": { x: 395, y: 219 },
  "paris-oasis": { x: 351, y: 58 },
  "medellin-corridors": { x: 191, y: 302 },
  "singapore-bishan": { x: 731, y: 305 },
};
export default function WorldRelay({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (id: string) => void;
}) {
  const [kx, ky] = project(19.9366, 50.0614);
  return (
    <div className="world-relay">
      <div className="world-map-top">
        <span>THE SHARED IDEAS ATLAS</span>
        <span>KRAKÓW ↔ THE WORLD</span>
      </div>
      <div className="world-map-canvas">
        <svg viewBox="0 0 900 460" fill="none" aria-hidden="true">
          <defs>
            <pattern
              id="atlas-grid"
              width="50"
              height="50"
              patternUnits="userSpaceOnUse"
            >
              <path d="M0 50V0h50" stroke="#c5cbb8" strokeWidth=".7" />
            </pattern>
          </defs>
          <rect
            width="900"
            height="460"
            fill="url(#atlas-grid)"
            opacity=".45"
          />
          <g fill="#dce2c6" stroke="#f5f2e9" strokeWidth=".6">
            {world.map((c) => (
              <path key={c.id} d={c.path} />
            ))}
          </g>
          {examples.map((e) => {
            const [x, y] = project(...e.origin.coordinates);
            const l = labels[e.id];
            return (
              <g key={e.id}>
                <path
                  d={`M${x} ${y}Q${(x + kx) / 2} ${Math.min(y, ky) - 75} ${kx} ${ky}`}
                  stroke={selected === e.id ? "#a64c37" : "#9cae85"}
                  strokeWidth={selected === e.id ? "2" : "1"}
                  strokeDasharray="4 5"
                  opacity={selected === e.id ? 1 : 0.5}
                />
                <path
                  d={`M${x} ${y}L${l.x} ${l.y}`}
                  stroke="#869875"
                  strokeWidth=".8"
                />
                <circle
                  cx={x}
                  cy={y}
                  r={selected === e.id ? 7 : 4}
                  fill={selected === e.id ? "#a64c37" : "#5c7a58"}
                  stroke="#f7f3e9"
                  strokeWidth="2"
                />
                {selected === e.id && (
                  <circle cx={x} cy={y} r="15" stroke="#a64c37" opacity=".4" />
                )}
              </g>
            );
          })}
          <circle cx={kx} cy={ky} r="19" stroke="#23584b" opacity=".25" />
          <circle
            cx={kx}
            cy={ky}
            r="7"
            fill="#23584b"
            stroke="#fffdf6"
            strokeWidth="2"
          />
          <path d={`M${kx} ${ky}l29-44h57`} stroke="#23584b" />
          <text
            x={kx + 63}
            y={ky - 53}
            fill="#23584b"
            fontSize="24"
            fontFamily="Georgia"
            fontStyle="italic"
          >
            Kraków
          </text>
          <text
            x={kx + 64}
            y={ky - 35}
            fill="#52634e"
            fontSize="9"
            letterSpacing="1.4"
          >
            YOUR STARTING POINT
          </text>
          <text x="47" y="416" fill="#788768" fontSize="9" letterSpacing="2">
            REAL PLACES. IDEAS THAT CAN TRAVEL.
          </text>
          <path d="M798 71V35m-6 10 6-10 6 10" stroke="#8d9b7b" />
          <text x="794" y="27" fill="#657455" fontSize="11">
            N
          </text>
        </svg>
        <div className="world-city-buttons" aria-label="Explore real projects">
          {examples.map((e) => (
            <button
              key={e.id}
              aria-pressed={selected === e.id}
              onClick={() => onSelect(e.id)}
              style={{
                left: `${labels[e.id].x / 9}%`,
                top: `${labels[e.id].y / 4.6}%`,
              }}
            >
              <strong>{e.origin.name}</strong>
              <small>{e.shortTitle}</small>
              <span>{selected === e.id ? "↗" : "+"}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="world-map-credit">
        <a
          href="https://github.com/topojson/world-atlas"
          target="_blank"
          rel="noreferrer"
        >
          Natural Earth geography ↗
        </a>
        <span>
          City locations approximate · Connections show learning, not
          partnerships
        </span>
      </div>
    </div>
  );
}

import { t } from "./i18n";
import { projectPresentation } from "./projectPresentation";
/** Original concept diagrams, not architectural plans of the source projects. */
export default function ProjectArt({ id }: { id: string }) {
  const p =
    projectPresentation[id] || projectPresentation["barcelona-shelters"];
  const tree = (x: number, y: number, i: number) => (
    <g key={i}>
      <circle
        cx={x}
        cy={y}
        r="18"
        fill="#cddb9c"
        fillOpacity=".15"
        stroke="#b2c594"
      />
      <path
        d={`M${x - 5} ${y}h10M${x} ${y - 5}v10`}
        stroke="#b2c594"
        strokeWidth=".6"
      />
    </g>
  );
  return (
    <div className={`project-art project-art-${id}`} aria-hidden="true">
      <svg viewBox="0 0 500 320" fill="none">
        <defs>
          <pattern
            id={`diagram-grid-${id}`}
            width="22"
            height="22"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="1" cy="1" r=".7" fill="#9bb491" fillOpacity=".4" />
          </pattern>
        </defs>
        <rect width="500" height="320" fill="#173c34" />
        <rect
          x="25"
          y="25"
          width="450"
          height="270"
          fill={`url(#diagram-grid-${id})`}
        />
        <g stroke="#8faa80" strokeWidth="1.1">
          {(id === "barcelona-shelters" || id === "helsinki-info") && (
            <>
              <path d="M112 80H350V226H273M237 226H112V80ZM112 149H172M200 149H263V80M263 149H350M172 80V122M172 171V226M263 174V226" />
              <path d="M107 75H355V231H277M233 231H107V75" strokeWidth="2" />
              <path
                d="M237 226V189A37 37 0 0 1 274 226"
                strokeDasharray="3 4"
              />
              {id === "barcelona-shelters" ? (
                <>
                  <rect
                    x="205"
                    y="166"
                    width="30"
                    height="30"
                    fill="#ddea87"
                    stroke="none"
                  />
                  <path
                    d="M25 264H220V196"
                    stroke="#ddea87"
                    strokeDasharray="4 5"
                  />
                  {tree(397, 112, 0)}
                  {tree(397, 176, 1)}
                </>
              ) : (
                <>
                  <circle
                    cx="219"
                    cy="173"
                    r="20"
                    fill="#ddea87"
                    stroke="none"
                  />
                  <path
                    d="M219 166V184M219 157V160"
                    stroke="#173c34"
                    strokeWidth="3"
                  />
                  {[0, 1, 2, 3].map((i) => (
                    <path key={i} d={`M${287 + i * 14} 99v27`} />
                  ))}
                </>
              )}
            </>
          )}
          {id === "paris-oasis" && (
            <>
              <path d="M110 74H372V232H110V74ZM122 85H360V220H122V85" />
              <path d="M201 85V141H288V85M133 186H194V209" />
              <path
                d="M236 220C240 164 340 208 360 150"
                stroke="#9dc9bc"
                strokeWidth="9"
              />
              {[
                [157, 121],
                [164, 165],
                [313, 119],
                [284, 175],
              ].map(([x, y], i) => tree(x, y, i))}
            </>
          )}
          {id === "medellin-corridors" && (
            <>
              <path d="M60 86H439M60 131H439M60 187H439M60 232H439" />
              <path d="M60 159H439" strokeDasharray="7 9" />
              <path d="M119 39V76M229 39V76M341 39V76M119 240V277M229 240V277M341 240V277" />
              {[96, 157, 218, 279, 340, 401].flatMap((x, i) => [
                tree(x, 107, i),
                tree(x, 210, i + 6),
              ])}
            </>
          )}
          {id === "singapore-bishan" && (
            <>
              <path
                d="M82 235C190 162 164 56 250 86S306 260 409 115"
                stroke="#86bbad"
                strokeWidth="26"
              />
              <path
                d="M82 235C190 162 164 56 250 86S306 260 409 115"
                stroke="#d3e6bb"
                strokeWidth="1"
                strokeDasharray="3 7"
              />
              <path
                d="M82 269C211 170 177 116 223 122S273 283 422 176"
                strokeDasharray="4 5"
              />
              {[
                [105, 145],
                [135, 93],
                [235, 210],
                [324, 82],
                [384, 245],
              ].map(([x, y], i) => tree(x, y, i))}
            </>
          )}
        </g>
        <path
          d="M31 48V31H48M452 31H469V48M469 272V289H452M48 289H31V272"
          stroke="#abc29d"
        />
        <text
          x="41"
          y="277"
          fill="#a3bc99"
          fontSize="10"
          fontFamily="Manrope,Arial,sans-serif"
          letterSpacing="1"
        >
          {t("CONCEPT DIAGRAM")}
        </text>
        <text
          x="425"
          y="277"
          fill="#e0ed91"
          fontSize="19"
          fontFamily="monospace"
        >
          {p.code}
        </text>
      </svg>
    </div>
  );
}

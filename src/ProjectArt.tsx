import { t as tr } from "./i18n";
import { projectPresentation } from "./projectPresentation";
export default function ProjectArt({ id }: { id: string }) {
  const p =
    projectPresentation[id] || projectPresentation["barcelona-shelters"];
  return (
    <div
      className={`project-art project-art-${id}`}
      style={{
        background: p.colour,
      }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 500 340" fill="none">
        <defs>
          <pattern
            id={`grid-${id}`}
            width="28"
            height="28"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M28 0H0V28"
              stroke="#142045"
              strokeWidth=".5"
              opacity=".17"
            />
          </pattern>
        </defs>
        <rect width="500" height="340" fill={`url(#grid-${id})`} />
        <g transform="translate(247 142) rotate(-29) skewX(27) scale(1 .82)">
          {tr(
            Array.from(
              {
                length: 5,
              },
              (_, row) =>
                Array.from(
                  {
                    length: 5,
                  },
                  (_, col) => {
                    const x = (col - 2) * 44,
                      y = (row - 2) * 44;
                    const central = row === 2 || col === 2;
                    return (
                      <g key={`${row}-${col}`}>
                        <path
                          d={`M${x} ${y + 6}h32v32h-32Z`}
                          fill="#243347"
                          opacity=".1"
                        />
                        <rect
                          x={x}
                          y={y}
                          width="32"
                          height="32"
                          rx="1"
                          fill={central ? "#2444db" : "#f5f5ed"}
                          stroke="#243347"
                          strokeWidth=".6"
                        />
                        {tr(
                          !central && (
                            <rect
                              x={x + 7}
                              y={y + 7}
                              width="18"
                              height="18"
                              fill={p.colour}
                              stroke="#243347"
                              strokeWidth=".5"
                            />
                          ),
                        )}
                        {tr(
                          central && (
                            <circle
                              cx={x + 16}
                              cy={y + 16}
                              r="4"
                              fill="#e7ff8e"
                            />
                          ),
                        )}
                      </g>
                    );
                  },
                ),
            ),
          )}
        </g>
        <path d="M70 285h65m-6-6 6 6-6 6" stroke="#142045" />
        <text
          x="365"
          y="285"
          fontFamily="Arial"
          fontWeight="700"
          fontSize="38"
          fill="#142045"
        >
          {tr(p.code)}
        </text>
      </svg>
      <span>{tr("AN IDEA TO ADAPT")}</span>
    </div>
  );
}

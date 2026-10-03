import { t } from "./i18n";
import { projectPresentation } from "./projectPresentation";
const colours: Record<string, string> = {
  "barcelona-shelters": "#d8d995",
  "paris-oasis": "#d7c1d4",
  "medellin-corridors": "#c6cfaa",
  "helsinki-info": "#e9b99a",
  "singapore-bishan": "#bbcdc3",
};
/** Original project motifs; these are illustrations, not photographs of sites. */
export default function ProjectArt({ id }: { id: string }) {
  const p =
    projectPresentation[id] || projectPresentation["barcelona-shelters"];
  const tree = (x: number, y: number, key: string) => (
    <g key={key}>
      <path d={`M${x} ${y + 5}v58`} stroke="#57384c" strokeWidth="3" />
      <ellipse
        cx={x}
        cy={y}
        rx="28"
        ry="42"
        fill="#82936b"
        stroke="#57384c"
        strokeWidth="1.5"
      />
      <path
        d={`M${x} ${y - 20}v60m0-32 13-10m-13 28-11-12`}
        stroke="#57384c"
        strokeWidth="1.3"
      />
    </g>
  );
  return (
    <div
      className={`project-art project-art-${id}`}
      style={{ background: colours[id] || colours["barcelona-shelters"] }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 500 340" fill="none">
        <circle cx="250" cy="151" r="121" fill="#f7e7c3" fillOpacity=".55" />
        <ellipse
          cx="250"
          cy="245"
          rx="125"
          ry="18"
          fill="#57384c"
          opacity=".1"
        />
        {id === "barcelona-shelters" && (
          <>
            <path
              d="M139 211L250 143L360 207L248 270Z"
              fill="#f0ca9d"
              stroke="#57384c"
              strokeWidth="2"
            />
            <path
              d="M170 196V116L242 75L326 123V210L248 255Z"
              fill="#f7e7c3"
              stroke="#57384c"
              strokeWidth="2"
            />
            <path
              d="M248 163L326 123V210L248 255Z"
              fill="#c0a7c3"
              stroke="#57384c"
              strokeWidth="2"
            />
            <path
              d="M158 116L242 64L341 120L248 175Z"
              fill="#ba5439"
              stroke="#57384c"
              strokeWidth="2"
            />
            <path
              d="M190 150V177M216 167V194M274 198V227M300 184V213"
              stroke="#7e5876"
              strokeWidth="12"
            />
            <circle cx="358" cy="74" r="29" fill="#bc5736" />
            <path d="M358 34V114M318 74H398" stroke="#bc5736" strokeWidth="2" />
          </>
        )}
        {id === "paris-oasis" && (
          <>
            <path
              d="M136 204L248 149L371 216L248 273Z"
              fill="#ce976e"
              stroke="#57384c"
              strokeWidth="2"
            />
            <path
              d="M168 216L243 180L316 219L244 253Z"
              fill="#dadb9b"
              stroke="#57384c"
              strokeWidth="2"
            />
            {tree(197, 141, "a")}
            {tree(295, 157, "b")}
            <path
              d="M239 224l20-10 18 9-20 10Z"
              fill="#f4dec0"
              stroke="#57384c"
            />
            <path
              d="M233 232l-18 9m71-14 17 9"
              stroke="#57384c"
              strokeWidth="2"
            />
          </>
        )}
        {id === "helsinki-info" && (
          <>
            <path
              d="M141 115L250 145L359 115V237L250 265L141 236Z"
              fill="#f7e9c8"
              stroke="#57384c"
              strokeWidth="2"
            />
            <path
              d="M250 145V265L359 237V115Z"
              fill="#d3bfd4"
              stroke="#57384c"
              strokeWidth="2"
            />
            <path
              d="M163 142L230 160M163 160L220 176M163 181L230 200M163 203L220 218M269 161L335 144M269 182L327 166M269 204L335 186M269 226L325 209"
              stroke="#896782"
              strokeWidth="3"
            />
            <path
              d="M126 101L250 137L374 101M127 248L250 281L374 250"
              stroke="#57384c"
              strokeWidth="2"
            />
            <path
              d="M227 96L250 62L273 96M239 86V109H261V86"
              fill="#bd573a"
              stroke="#57384c"
              strokeWidth="2"
            />
          </>
        )}
        {id === "medellin-corridors" && (
          <>
            <path
              d="M137 222L318 143L367 180L185 263Z"
              fill="#dbd89c"
              stroke="#57384c"
              strokeWidth="2"
            />
            <path d="M167 241L342 166" stroke="#f6e5c4" strokeWidth="17" />
            <path
              d="M167 241L342 166"
              stroke="#57384c"
              strokeDasharray="7 7"
              strokeWidth="1.5"
            />
            {tree(171, 150, "c")}
            {tree(231, 127, "d")}
            {tree(291, 99, "e")}
            {tree(314, 182, "f")}
          </>
        )}
        {id === "singapore-bishan" && (
          <>
            <path
              d="M119 201L248 131L382 205L250 280Z"
              fill="#a7b780"
              stroke="#57384c"
              strokeWidth="2"
            />
            <path
              d="M204 154C295 175 189 202 277 220S282 245 277 265"
              stroke="#517c7d"
              strokeWidth="25"
            />
            <path
              d="M204 154C295 175 189 202 277 220S282 245 277 265"
              stroke="#d8e4d2"
              strokeWidth="2"
            />
            {tree(167, 156, "g")}
            {tree(325, 159, "h")}
            <path
              d="M232 217l27-16 17 10-26 15Z"
              fill="#edc595"
              stroke="#57384c"
              strokeWidth="2"
            />
          </>
        )}
        <path
          d="M51 285H104M94 277L104 285L94 293"
          stroke="#57384c"
          strokeWidth="1.5"
        />
        <text
          x="369"
          y="295"
          fontFamily="Georgia,serif"
          fontStyle="italic"
          fontSize="37"
          fill="#57384c"
        >
          {p.code}
        </text>
      </svg>
      <span>{t("AN IDEA TO ADAPT")}</span>
    </div>
  );
}

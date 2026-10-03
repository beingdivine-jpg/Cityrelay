import type { Setting } from "./model";

function Building({
  x,
  y,
  w = 27,
  d = 23,
  h = 30,
  roof = "#a6644c",
}: {
  x: number;
  y: number;
  w?: number;
  d?: number;
  h?: number;
  roof?: string;
}) {
  return (
    <g
      transform={`translate(${x} ${y})`}
      stroke="#52664f"
      strokeWidth="1"
      strokeLinejoin="round"
    >
      <path
        d={`M0 0 ${w} ${-w * 0.38} ${w + d} ${(d - w) * 0.38} ${d} ${d * 0.38}Z`}
        fill={roof}
      />
      <path
        d={`M0 0 ${d} ${d * 0.38} ${d} ${d * 0.38 + h} 0 ${h}Z`}
        fill="#e7dcc1"
      />
      <path
        d={`M${d} ${d * 0.38} ${w + d} ${(d - w) * 0.38} ${w + d} ${(d - w) * 0.38 + h} ${d} ${d * 0.38 + h}Z`}
        fill="#f9f5e8"
      />
      {Array.from({ length: Math.max(1, Math.floor(h / 16)) }, (_, i) => (
        <path
          key={i}
          d={`M${d + 6} ${d * 0.38 + 8 + i * 13}v5m9-8v5`}
          stroke="#758273"
          strokeWidth="2.5"
        />
      ))}
      <path d="M6 10v5m8-2v5" stroke="#ac9f80" strokeWidth="2" />
    </g>
  );
}
function Tree({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <ellipse cx="4" cy="10" rx="13" ry="5" fill="#536c4020" />
      <path d="M0-9v24" stroke="#6f7251" strokeWidth="2" />
      <path
        d="M0-23C-18-9-14 10 0 9 17 10 17-7 0-23Z"
        fill="#9eb083"
        stroke="#7d9364"
        strokeWidth="1"
      />
      <path d="M0-15V7" stroke="#84976d" strokeWidth="1" />
    </g>
  );
}
export function PlaceDrawing({
  setting = "city",
  x = 0,
  y = 0,
  scale = 1,
}: {
  setting?: Setting;
  x?: number;
  y?: number;
  scale?: number;
}) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <path d="m-85 66 155-58 103 48-148 63Z" fill="#d8ddbe" stroke="#b2bd97" />
      <path
        d="m-68 55 144 50M-30 90 118 31"
        stroke="#f5f0df"
        strokeWidth="10"
      />
      {setting === "city" ? (
        <>
          <Building x={5} y={-17} w={28} d={26} h={62} roof="#bac2a8" />
          <Building x={52} y={-1} w={23} h={47} />
          <Building x={-43} y={20} w={30} h={38} roof="#c9cca8" />
          <Building x={-5} y={48} w={45} d={30} h={26} />
          <Building x={67} y={50} w={29} h={34} roof="#b6c1a3" />
          <Tree x={-67} y={41} />
          <Tree x={114} y={57} s={0.9} />
          <Tree x={42} y={101} s={0.75} />
        </>
      ) : setting === "town" ? (
        <>
          <Building x={-24} y={12} w={31} d={27} h={30} />
          <Building x={24} y={1} w={24} h={42} roof="#b4bea0" />
          <Building x={10} y={65} w={42} d={27} h={24} />
          <Building x={78} y={42} w={23} h={26} />
          <Tree x={-56} y={57} />
          <Tree x={103} y={22} />
          <Tree x={-9} y={98} s={0.8} />
        </>
      ) : (
        <>
          <Building x={-27} y={23} w={28} d={22} h={22} />
          <Building x={62} y={26} w={25} h={23} />
          <Building x={8} y={70} w={35} d={23} h={25} roof="#b4bea0" />
          <Tree x={-57} y={27} />
          <Tree x={17} y={13} />
          <Tree x={109} y={65} />
          <Tree x={62} y={105} s={0.9} />
        </>
      )}
    </g>
  );
}
export function TransferDrawing({ from, to }: { from: Setting; to: Setting }) {
  return (
    <svg
      className="transfer-drawing"
      viewBox="0 0 800 225"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M247 130C350 22 420 208 549 113"
        stroke="#ac533a"
        strokeWidth="2"
        strokeDasharray="5 8"
      />
      <path d="m529 111 22 1-7 20" stroke="#ac533a" strokeWidth="2" />
      <PlaceDrawing setting={from} x={135} y={45} scale={1.08} />
      <PlaceDrawing setting={to} x={599} y={43} scale={1.08} />
      <circle cx="390" cy="110" r="24" fill="#f7f3e9" stroke="#ac533a" />
      <path d="M378 110h23m-7-7 7 7-7 7" stroke="#ac533a" strokeWidth="1.5" />
    </svg>
  );
}

export function KrakowDrawing() {
  return (
    <div className="krakow-drawing">
      <svg
        viewBox="0 0 680 270"
        fill="none"
        role="img"
        aria-label="An illustrative skyline inspired by Kraków, not a site plan"
      >
        <circle cx="464" cy="103" r="76" fill="#e6e6b5" />
        <path
          d="M-20 228c129-68 207 44 339-4s259-26 388 12"
          stroke="#c3d9cc"
          strokeWidth="30"
        />
        <path
          d="M-20 228c129-68 207 44 339-4s259-26 388 12"
          stroke="#e1e9d9"
          strokeWidth="19"
        />
        <path d="m94 199 204-66 276 71-209 56Z" fill="#dce2c6" />
        <PlaceDrawing setting="town" x={135} y={99} scale={0.9} />
        <PlaceDrawing setting="town" x={425} y={109} scale={0.8} />
        <g stroke="#637257" strokeWidth="1.2" strokeLinejoin="round">
          <path d="M283 177V57l23-11 22 11v125Z" fill="#dbccb0" />
          <path d="m283 57 22-35 23 35-22-10Z" fill="#67866d" />
          <path d="M295 33v-13l10-12 10 12v13m-10-25V0" fill="#739277" />
          <path d="M352 192V78l18-8 19 8v124Z" fill="#e9dec2" />
          <path d="m352 78 18-36 19 36-19-8Z" fill="#a2644d" />
          <path d="m328 182 24 10V104l-24-12Z" fill="#ede5cf" />
          <path d="m312 94 16-16 28 27-28-13Z" fill="#a2644d" />
          <path
            d="M292 85v15m16-19v15m-16 19v15m16-19v15m54-23v14m14-8v14"
            stroke="#7e8063"
            strokeWidth="4"
          />
          <circle cx="304" cy="64" r="5" fill="#f5edcf" />
          <path d="M303 60v5l3 2" strokeWidth=".8" />
          <path d="m243 183 57-15 88 28-51 22Z" fill="#eee4cc" />
        </g>
        <g fill="#9eaf80" stroke="#81996a">
          <path d="M411 154c-29 21-15 44 0 32 21 11 27-14 0-32Z" />
          <path d="M230 122c-27 23-14 45 0 33 18 10 24-14 0-33Z" />
        </g>
        <path d="M411 175v32m-181-59v27" stroke="#768262" strokeWidth="2" />
        <path
          d="M550 83h69m-31-20v42"
          stroke="#ac533a"
          strokeWidth="1"
          opacity=".65"
        />
      </svg>
      <span>50.06° N · 19.94° E / KRAKÓW</span>
      <small>Illustrative skyline</small>
    </div>
  );
}

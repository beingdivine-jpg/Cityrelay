import { useEffect, useRef } from "react";
import world from "./worldMap.json";
import { t, useLanguage } from "./i18n";
import { examples } from "./data";
import {
  globeArc,
  globePoint,
  nearestAngle,
  type Vector3,
} from "./globeGeometry";

const cities = examples.map((item) => globePoint(...item.origin.coordinates));
const rings = world.flatMap((country) =>
  country.path
    .split("M")
    .filter(Boolean)
    .map((ring) =>
      [...ring.matchAll(/(-?[\d.]+),(-?[\d.]+)/g)].map(
        (match) => [Number(match[1]), Number(match[2])] as [number, number],
      ),
    ),
);
const borders = rings.map((ring) =>
  ring.map(([x, y]) => globePoint(x / 2.5 - 180, 85 - y / 2.5)),
);
let landPoints: Vector3[] | undefined;
function getLandPoints() {
  if (landPoints) return landPoints;
  const mask = document.createElement("canvas");
  mask.width = 900;
  mask.height = 450;
  const ctx = mask.getContext("2d", { willReadFrequently: true });
  if (!ctx) return borders.flat();
  // Unwrap the flat source rings before sampling, including the date line.
  ctx.fillStyle = "#fff";
  for (const ring of rings) {
    let prior: number | undefined,
      offset = 0;
    const points = ring.map(([x, y]) => {
      if (prior !== undefined && Math.abs(x + offset - prior) > 450)
        offset += x + offset > prior ? -900 : 900;
      prior = x + offset;
      return [prior, y];
    });
    for (const shift of [-900, 0, 900]) {
      ctx.beginPath();
      points.forEach(([x, y], i) =>
        i ? ctx.lineTo(x + shift, y) : ctx.moveTo(x + shift, y),
      );
      ctx.closePath();
      ctx.fill();
    }
  }
  const pixels = ctx.getImageData(0, 0, 900, 450).data;
  landPoints = [];
  const count = 18000,
    golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < count; i++) {
    const y = 1 - ((i + 0.5) / count) * 2,
      radius = Math.sqrt(1 - y * y),
      angle = golden * i;
    const point: Vector3 = [
      radius * Math.sin(angle),
      y,
      radius * Math.cos(angle),
    ];
    const longitude = (Math.atan2(point[0], point[2]) * 180) / Math.PI,
      latitude = (Math.asin(y) * 180) / Math.PI;
    const px = Math.floor((longitude + 180) * 2.5),
      py = Math.floor((85 - latitude) * 2.5);
    if (py >= 0 && py < 450 && pixels[(py * 900 + px) * 4 + 3] > 100)
      landPoints.push(point);
  }
  return landPoints;
}
const grid: Vector3[][] = [];
for (let latitude = -60; latitude <= 60; latitude += 30)
  grid.push(
    Array.from({ length: 121 }, (_, i) => globePoint(i * 3 - 180, latitude)),
  );
for (let longitude = -180; longitude < 180; longitude += 30)
  grid.push(
    Array.from({ length: 61 }, (_, i) => globePoint(longitude, i * 3 - 90)),
  );
const routes = cities.map((from, i) =>
  Array.from({ length: 81 }, (_, j) =>
    globeArc(from, cities[(i + 2) % cities.length], j / 80),
  ),
);

/** Canvas-only decorative motion; the city controls and evidence links are real DOM. */
export default function IdeaGlobe({
  selected,
  paused,
  reduced,
  turn,
  onTurn,
}: {
  selected: number;
  paused: boolean;
  reduced: boolean;
  turn: number;
  onTurn: (amount: number) => void;
}) {
  const language = useLanguage();
  const canvas = useRef<HTMLCanvasElement>(null);
  const settings = useRef({ selected, paused, reduced, turn });
  settings.current = { selected, paused, reduced, turn };
  const redraw = useRef<() => void>(() => {});
  const drag = useRef<{ x: number; id: number } | null>(null);
  useEffect(
    () => redraw.current(),
    [selected, paused, reduced, turn, language],
  );
  useEffect(() => {
    const element = canvas.current;
    if (!element) return;
    const ctx = element.getContext("2d");
    if (!ctx) return;
    const land = getLandPoints();
    let width = 600,
      height = 420,
      ratio = 1,
      frame = 0,
      last = 0,
      phase = 0;
    let yaw = -0.12,
      pitch = 0.38,
      targetYaw = yaw,
      targetPitch = pitch,
      selection = -1,
      lastTurn = 0,
      wasPaused = settings.current.paused;
    let cosYaw = Math.cos(yaw),
      sinYaw = Math.sin(yaw),
      cosPitch = Math.cos(pitch),
      sinPitch = Math.sin(pitch);
    const projectPoint = ([x, y, z]: Vector3): Vector3 => {
      const depth = z * cosYaw - x * sinYaw;
      return [
        x * cosYaw + z * sinYaw,
        y * cosPitch - depth * sinPitch,
        y * sinPitch + depth * cosPitch,
      ];
    };
    let visible = true,
      disposed = false;
    const drawLine = (
      points: Vector3[],
      radius: number,
      cx: number,
      cy: number,
    ) => {
      let open = false;
      ctx.beginPath();
      for (const point of points) {
        const [x, y, z] = projectPoint(point);
        const outside = x * x + y * y > 1.01;
        if (z > 0 || outside) {
          if (open) ctx.lineTo(cx + x * radius, cy - y * radius);
          else ctx.moveTo(cx + x * radius, cy - y * radius);
          open = true;
        } else open = false;
      }
      ctx.stroke();
    };
    const render = (time: number) => {
      frame = 0;
      if (disposed || !visible || document.hidden) return;
      // Cap decorative rendering at 30 fps, leaving time for page interaction.
      if (last && time - last < 1000 / 30) {
        frame = requestAnimationFrame(render);
        return;
      }
      const state = settings.current,
        dt = last ? Math.min((time - last) / 1000, 0.06) : 0;
      last = time;
      if (
        state.paused &&
        !wasPaused &&
        selection === state.selected &&
        lastTurn === state.turn
      ) {
        targetYaw = yaw;
        targetPitch = pitch;
      }
      wasPaused = state.paused;
      if (selection !== state.selected) {
        selection = state.selected;
        lastTurn = state.turn;
        targetYaw = nearestAngle(
          yaw,
          (-examples[selection].origin.coordinates[0] * Math.PI) / 180,
        );
        targetPitch =
          ((examples[selection].origin.coordinates[1] * Math.PI) / 180) * 0.65;
      }
      if (lastTurn !== state.turn) {
        targetYaw += state.turn - lastTurn;
        lastTurn = state.turn;
      }
      if (!state.paused && !state.reduced) {
        phase += dt;
        targetYaw += dt * 0.045;
      }
      if (state.reduced) {
        yaw = targetYaw;
        pitch = targetPitch;
      } else {
        yaw += (targetYaw - yaw) * Math.min(1, dt * 3);
        pitch += (targetPitch - pitch) * Math.min(1, dt * 3);
      }
      cosYaw = Math.cos(yaw);
      sinYaw = Math.sin(yaw);
      cosPitch = Math.cos(pitch);
      sinPitch = Math.sin(pitch);
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      ctx.clearRect(0, 0, width, height);
      const radius = Math.min(width * 0.32, height * 0.405),
        cx = width * 0.5,
        cy = height * 0.49;
      const glow = ctx.createRadialGradient(
        cx,
        cy,
        radius * 0.75,
        cx,
        cy,
        radius * 1.32,
      );
      glow.addColorStop(0, "rgba(160,195,124,.07)");
      glow.addColorStop(0.75, "rgba(160,195,124,.08)");
      glow.addColorStop(1, "rgba(160,195,124,0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, width, height);
      const ocean = ctx.createRadialGradient(
        cx - radius * 0.35,
        cy - radius * 0.4,
        0,
        cx,
        cy,
        radius,
      );
      ocean.addColorStop(0, "#2a5748");
      ocean.addColorStop(0.8, "#1b4138");
      ocean.addColorStop(1, "#102f2b");
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fillStyle = ocean;
      ctx.fill();
      ctx.strokeStyle = "rgba(177,206,145,.55)";
      ctx.lineWidth = 0.65;
      ctx.stroke();
      ctx.lineWidth = 0.55;
      ctx.strokeStyle = "rgba(148,183,155,.18)";
      for (const line of grid) drawLine(line, radius, cx, cy);
      ctx.strokeStyle = "rgba(157,189,130,.25)";
      ctx.lineWidth = 0.65;
      for (const border of borders) drawLine(border, radius, cx, cy);
      const dots = Array.from({ length: 8 }, () => new Path2D());
      for (const point of land) {
        const [x, y, z] = projectPoint(point);
        if (z <= 0) continue;
        const dot = dots[Math.min(7, Math.floor(z * 8))],
          size = 0.5 + z * 0.85;
        dot.moveTo(cx + x * radius + size, cy - y * radius);
        dot.arc(cx + x * radius, cy - y * radius, size, 0, Math.PI * 2);
      }
      dots.forEach((path, index) => {
        ctx.fillStyle = `rgba(195,216,152,${0.18 + ((index + 0.5) / 8) * 0.66})`;
        ctx.fill(path);
      });
      routes.forEach((route, i) => {
        ctx.lineWidth = i === selection ? 1.35 : 0.75;
        ctx.strokeStyle =
          i === selection ? "rgba(232,243,154,.85)" : "rgba(150,198,182,.4)";
        drawLine(route, radius, cx, cy);
        for (let j = 0; j < 2; j++) {
          const progress = (phase * 0.16 + i * 0.19 + j * 0.5) % 1;
          const [x, y, z] = projectPoint(
            globeArc(cities[i], cities[(i + 2) % cities.length], progress),
          );
          if (z <= 0 && x * x + y * y <= 1.01) continue;
          ctx.fillStyle = i === selection ? "#eff6a5" : "#9accb6";
          ctx.shadowColor = ctx.fillStyle;
          ctx.shadowBlur = 9;
          ctx.beginPath();
          ctx.arc(
            cx + x * radius,
            cy - y * radius,
            i === selection ? 2.4 : 1.6,
            0,
            Math.PI * 2,
          );
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      });
      cities.forEach((point, i) => {
        const [x, y, z] = projectPoint(point);
        if (z <= 0.05) return;
        const px = cx + x * radius,
          py = cy - y * radius;
        ctx.fillStyle = i === selection ? "#f0f7a6" : "#acccb2";
        ctx.beginPath();
        ctx.arc(px, py, i === selection ? 4 : 2.4, 0, Math.PI * 2);
        ctx.fill();
        if (i === selection) {
          ctx.strokeStyle = "rgba(226,240,159,.65)";
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.arc(px, py, 9, 0, Math.PI * 2);
          ctx.stroke();
          const right = px < cx + radius * 0.4;
          const labelX = right
            ? Math.min(width - 100, px + 26)
            : Math.max(20, px - 26);
          ctx.beginPath();
          ctx.moveTo(px + (right ? 10 : -10), py);
          ctx.lineTo(labelX, py - 22);
          ctx.stroke();
          ctx.font = "10px Manrope, sans-serif";
          ctx.textAlign = right ? "left" : "right";
          const label = t(examples[i].origin.name).toLocaleUpperCase();
          const size = ctx.measureText(label).width;
          ctx.fillStyle = "rgba(16,47,41,.93)";
          ctx.fillRect(labelX - (right ? 5 : size + 5), py - 39, size + 10, 22);
          ctx.fillStyle = "#ecf4c7";
          ctx.fillText(label, labelX, py - 24);
        }
      });
      // Instrument-like orbit marks remain decorative, with no fake scan counters.
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(-0.3);
      ctx.scale(1, 0.36);
      ctx.strokeStyle = "rgba(180,205,153,.2)";
      ctx.lineWidth = 0.8;
      ctx.setLineDash([2, 8]);
      ctx.beginPath();
      ctx.arc(0, 0, radius * 1.36, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
      const moving =
        Math.abs(targetYaw - yaw) > 0.0005 ||
        Math.abs(targetPitch - pitch) > 0.0005;
      if ((!state.paused && !state.reduced) || moving)
        frame = requestAnimationFrame(render);
    };
    const wake = () => {
      if (!disposed && !frame) {
        last = 0;
        frame = requestAnimationFrame(render);
      }
    };
    redraw.current = wake;
    const resize = new ResizeObserver(() => {
      const rect = element.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      ratio = Math.min(window.devicePixelRatio || 1, 2);
      element.width = Math.round(width * ratio);
      element.height = Math.round(height * ratio);
      wake();
    });
    resize.observe(element);
    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible) wake();
        else {
          cancelAnimationFrame(frame);
          frame = 0;
        }
      },
      { threshold: 0.05 },
    );
    observer.observe(element);
    document.addEventListener("visibilitychange", wake);
    wake();
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      resize.disconnect();
      observer.disconnect();
      document.removeEventListener("visibilitychange", wake);
      redraw.current = () => {};
    };
  }, []);
  return (
    <canvas
      ref={canvas}
      className="idea-globe-canvas"
      aria-hidden="true"
      onPointerDown={(event) => {
        if (event.pointerType !== "mouse") return;
        drag.current = { x: event.clientX, id: event.pointerId };
        event.currentTarget.setPointerCapture(event.pointerId);
      }}
      onPointerMove={(event) => {
        if (!drag.current) return;
        const delta = event.clientX - drag.current.x;
        drag.current.x = event.clientX;
        onTurn(delta * 0.008);
      }}
      onPointerUp={(event) => {
        drag.current = null;
        if (event.currentTarget.hasPointerCapture(event.pointerId))
          event.currentTarget.releasePointerCapture(event.pointerId);
      }}
      onPointerCancel={() => {
        drag.current = null;
      }}
    />
  );
}

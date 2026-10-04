import { expect, it } from "vitest";
import {
  globeArc,
  globePoint,
  nearestAngle,
  rotatePoint,
} from "./globeGeometry";
it("centres each documented coordinate with the corresponding globe rotation", () => {
  for (const [lon, lat] of [
    [2.1734, 41.3851],
    [-75.5812, 6.2442],
    [103.8198, 1.3521],
    [179, 60],
  ]) {
    const [x, y, z] = rotatePoint(
      globePoint(lon, lat),
      (-lon * Math.PI) / 180,
      (lat * Math.PI) / 180,
    );
    expect(x).toBeCloseTo(0, 8);
    expect(y).toBeCloseTo(0, 8);
    expect(z).toBeCloseTo(1, 8);
  }
});
it("keeps routes attached to their cities and raises the midpoint above the surface", () => {
  const from = globePoint(2, 41),
    to = globePoint(-75, 6);
  expect(globeArc(from, to, 0)).toEqual(from);
  globeArc(from, to, 1).forEach((value, i) =>
    expect(value).toBeCloseTo(to[i], 8),
  );
  expect(Math.hypot(...globeArc(from, to, 0.5))).toBeCloseTo(1.2, 8);
});
it("crosses the date line by the short rotation without flipping geography", () => {
  const current = (179 * Math.PI) / 180,
    target = (-179 * Math.PI) / 180;
  expect(nearestAngle(current, target) - current).toBeCloseTo(
    (2 * Math.PI) / 180,
    8,
  );
  const middle = globeArc(globePoint(179, 0), globePoint(-179, 0), 0.5);
  expect(middle[2]).toBeLessThan(-1);
});
it("handles an identical source and destination without invalid points", () => {
  expect(globeArc(globePoint(0, 0), globePoint(0, 0), 0.5)).toEqual([
    0, 0, 1.2,
  ]);
});

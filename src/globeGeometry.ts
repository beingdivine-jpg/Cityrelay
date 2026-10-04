export type Vector3 = [number, number, number];
const radians = Math.PI / 180;
export function globePoint(longitude: number, latitude: number): Vector3 {
  const lat = latitude * radians,
    lon = longitude * radians;
  return [
    Math.cos(lat) * Math.sin(lon),
    Math.sin(lat),
    Math.cos(lat) * Math.cos(lon),
  ];
}
export function rotatePoint(
  [x, y, z]: Vector3,
  yaw: number,
  pitch: number,
): Vector3 {
  const horizontal = x * Math.cos(yaw) + z * Math.sin(yaw);
  const depth = z * Math.cos(yaw) - x * Math.sin(yaw);
  return [
    horizontal,
    y * Math.cos(pitch) - depth * Math.sin(pitch),
    y * Math.sin(pitch) + depth * Math.cos(pitch),
  ];
}
export function nearestAngle(current: number, target: number) {
  return (
    current + Math.atan2(Math.sin(target - current), Math.cos(target - current))
  );
}
/** A conceptual knowledge path between documented city coordinates, not an actual partnership. */
export function globeArc(
  from: Vector3,
  to: Vector3,
  progress: number,
): Vector3 {
  const angle = Math.acos(
    Math.max(
      -1,
      Math.min(
        1,
        from.reduce((sum, value, i) => sum + value * to[i], 0),
      ),
    ),
  );
  const denominator = Math.sin(angle);
  const a =
    angle < 0.0001
      ? 1 - progress
      : Math.sin((1 - progress) * angle) / denominator;
  const b =
    angle < 0.0001 ? progress : Math.sin(progress * angle) / denominator;
  const lift = 1 + Math.sin(progress * Math.PI) * 0.2;
  return from.map((v, i) => (v * a + to[i] * b) * lift) as Vector3;
}

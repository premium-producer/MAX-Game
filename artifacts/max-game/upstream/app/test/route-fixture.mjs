// Deterministic candidates along the short spherical arc between real endpoints.
// Longitude/latitude interpolation takes Arctic routes around the wrong side of
// the pole. This builds test data only; completion is checked by the real engine.
export function routeCandidates(mission) {
  const path = mission.topology.paths[0];
  const vector = ({ latitude, longitude }) => {
    const lat = latitude * Math.PI / 180, lon = longitude * Math.PI / 180;
    return [Math.cos(lat) * Math.cos(lon), Math.sin(lat), Math.cos(lat) * Math.sin(lon)];
  };
  const a = vector(mission.endpoints[path.from]), b = vector(mission.endpoints[path.to]);
  const angle = Math.acos(Math.max(-1, Math.min(1, a.reduce((sum, value, i) => sum + value * b[i], 0))));
  if (Math.PI - angle < 1e-6) throw new Error(`${mission.id}: antipodal endpoints need an explicit route fixture`);
  return path.steps.map((step, i) => {
    const t = (i + 1) / (path.steps.length + 1);
    const v = angle < 1e-6 ? a : a.map((value, axis) =>
      (value * Math.sin((1 - t) * angle) + b[axis] * Math.sin(t * angle)) / Math.sin(angle));
    const limit = step.type === 'satellite' ? 90 : 82;
    return {
      id: i + 1, type: step.type,
      latitude: Math.max(-limit, Math.min(limit, Math.asin(Math.max(-1, Math.min(1, v[1]))) * 180 / Math.PI)),
      longitude: Math.atan2(v[2], v[0]) * 180 / Math.PI,
      altitude: step.type === 'satellite' ? .34 : .08, droppedAt: 0,
    };
  });
}

import { Vector3 } from "three";

// Reused numerical adapter. Records are ephemeral and consumed synchronously.
// Projection uses the final render camera, including zoom and viewOffset.
export class ConnectionProjector {
  constructor(earthRadius = 3) {
    this.earthRadius = earthRadius;
    this.center = new Vector3(); this.sample = new Vector3(); this.projected = new Vector3();
    this.right = new Vector3(); this.up = new Vector3(); this.ray = new Vector3();
    this.snapshot = { nodes: Object.create(null), revision: 0, timestamp: 0, interacting: false, hidden: false };
    this.changed = false; this.generation = 0;
  }
  begin(camera, width, height, _uiBounds, mission, placements, now, interacting, hidden = false) {
    this.camera = camera; this.width = width; this.height = height;
    camera.updateMatrixWorld(true);
    this.right.set(1, 0, 0).applyQuaternion(camera.quaternion);
    this.up.set(0, 1, 0).applyQuaternion(camera.quaternion);
    const s = this.snapshot;
    this.changed = s.mission !== mission || s.placements !== placements || s.interacting !== interacting || s.hidden !== hidden || now - s.timestamp > 120 || now < s.timestamp;
    s.mission = mission; s.placements = placements; s.timestamp = now; s.interacting = interacting; s.hidden = hidden;
    this.generation++;
  }
  occluded(point) {
    if (this.earthRadius <= 0) return false;
    const origin = this.camera.position;
    this.ray.copy(point).sub(origin);
    const length = this.ray.length(); this.ray.divideScalar(length || 1);
    const b = origin.dot(this.ray), c = origin.lengthSq() - this.earthRadius ** 2;
    const discriminant = b * b - c;
    return discriminant >= 0 && -b - Math.sqrt(discriminant) > 0 && -b - Math.sqrt(discriminant) < length - 0.002;
  }
  add(id, root, stemHeight, radius, iconRadius, blocked = false) {
    const s = this.snapshot;
    const old = s.nodes[id] || (s.nodes[id] = { x: NaN, y: NaN, radius: NaN, iconRadius: NaN });
    this.center.copy(root).addScaledVector(this.up, stemHeight);
    this.projected.copy(this.center).project(this.camera);
    const x = (this.projected.x + 1) * this.width / 2, y = (1 - this.projected.y) * this.height / 2;
    let eligible = !blocked && Number.isFinite(x) && Number.isFinite(y) && this.projected.z > -1 && this.projected.z < 1;
    let reason = eligible ? "" : "clipped";
    this.sample.copy(this.center).addScaledVector(this.right, radius).project(this.camera);
    const projectedRadius = Math.hypot((this.sample.x + 1) * this.width / 2 - x, (1 - this.sample.y) * this.height / 2 - y);
    const projectedIcon = projectedRadius * iconRadius / radius;
    if (!Number.isFinite(projectedRadius) || projectedRadius <= 0) { eligible = false; reason = "radius"; }
    // Five rays reject icons hidden even partly by the globe. Ground roots
    // must also be on the visible hemisphere, independently of stem height.
    if (this.occluded(this.center) || (stemHeight > 0 && this.occluded(root))) { eligible = false; reason = "earth"; }
    for (let i = 0; i < 4 && eligible; i++) {
      this.sample.copy(this.center).addScaledVector(i < 2 ? this.right : this.up, (i % 2 ? 1 : -1) * iconRadius);
      if (this.occluded(this.sample)) { eligible = false; reason = "earth"; }
    }
    // Only the camera viewport and game geometry constrain projected links.
    // UI panels/masks must never change eligibility or reset the victory hold.
    if (x - projectedIcon < 0 || x + projectedIcon > this.width
      || y - projectedIcon < 0 || y + projectedIcon > this.height) { eligible = false; reason = "viewport"; }
    // Keep the last published sample until movement exceeds a subpixel bound.
    if (!Number.isFinite(old.x) || Math.abs(old.x - x) > 0.02 || Math.abs(old.y - y) > 0.02
      || Math.abs(old.radius - projectedRadius) > 0.02 || Math.abs(old.iconRadius - projectedIcon) > 0.02 || old.eligible !== eligible) {
      old.x = x; old.y = y; old.radius = projectedRadius; old.iconRadius = projectedIcon; old.eligible = eligible; old.reason = reason;
      this.changed = true;
    }
    old.generation = this.generation;
  }
  finish() {
    for (const id in this.snapshot.nodes) if (this.snapshot.nodes[id].generation !== this.generation) { delete this.snapshot.nodes[id]; this.changed = true; }
    if (this.changed) this.snapshot.revision++;
    return this.snapshot;
  }
}

import { SURFACE } from "./surface-map.mjs";

export function placementSurfaceFor(type) {
  return type?.placementSurface ?? (type?.behavior === "orbital" ? "any" : "land");
}

// Null is allowed; a stable reason code means rejected. No allocations/readback.
export function surfaceRejection(type, latitude, longitude, surfaceMap) {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return "invalid-coordinate";
  const policy = placementSurfaceFor(type);
  if (policy === "any") return null;
  if (!surfaceMap) return "unavailable";
  const surface = surfaceMap.sample(latitude, longitude);
  if (surface !== SURFACE.LAND && surface !== SURFACE.WATER) return "unavailable";
  if (policy === "land" && surface === SURFACE.WATER) return "water";
  if (policy === "water" && surface === SURFACE.LAND) return "land";
  return null;
}

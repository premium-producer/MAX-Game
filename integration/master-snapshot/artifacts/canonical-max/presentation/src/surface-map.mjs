export const SURFACE_MANIFEST = "./earth/Earth_Surface_4K.json";
export const SURFACE = Object.freeze({ LAND: 0, WATER: 1, UNKNOWN: 2 });

// Coordinates are geographic, independent of camera, texture style and DPR.
export function createSurfaceMap(manifest, bytes) {
  if (manifest?.schemaVersion !== 1 || manifest.encoding !== "water-bitset-lsb"
    || manifest.origin !== "north-west" || manifest.width !== 4096 || manifest.height !== 2048
    || manifest.data !== "Earth_Surface_4K.bin" || !/^[a-f0-9]{64}$/.test(manifest.sha256 || "")
    || manifest.byteLength !== 1048576 || !(bytes instanceof Uint8Array) || bytes.length !== manifest.byteLength) {
    throw new Error("Invalid gameplay surface mask");
  }
  // Own the data: a caller retaining the input buffer cannot change the rules.
  const data = bytes.slice(), width = manifest.width, height = manifest.height;
  return Object.freeze({
    version: manifest.sha256,
    sample(latitude, longitude) {
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || Math.abs(latitude) > 90) return SURFACE.UNKNOWN;
      const u = (((longitude + 180) % 360) + 360) % 360 / 360;
      const x = Math.floor(u * width);
      const y = Math.min(height - 1, Math.max(0, Math.floor((90 - latitude) / 180 * height)));
      const index = y * width + x;
      return (data[index >> 3] >> (index & 7)) & 1;
    },
  });
}

export async function loadSurfaceMap(fetchImpl = fetch, digest = (bytes) => crypto.subtle.digest("SHA-256", bytes)) {
  const response = await fetchImpl(SURFACE_MANIFEST, { cache: "no-store" });
  if (!response.ok) throw new Error(`Surface manifest: HTTP ${response.status}`);
  const manifest = await response.json();
  // Never follow a URL supplied by the manifest.
  const dataResponse = await fetchImpl("./earth/Earth_Surface_4K.bin", { cache: "no-store" });
  if (!dataResponse.ok) throw new Error(`Surface mask: HTTP ${dataResponse.status}`);
  const bytes = new Uint8Array(await dataResponse.arrayBuffer());
  const map = createSurfaceMap(manifest, bytes);
  const hash = [...new Uint8Array(await digest(bytes))].map((v) => v.toString(16).padStart(2, "0")).join("");
  if (hash !== manifest.sha256) throw new Error("Surface mask checksum mismatch");
  return map;
}

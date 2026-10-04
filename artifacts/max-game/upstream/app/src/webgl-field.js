import { fitMissionMarkerSafeArea } from "./mission-marker-safe-area.mjs";
import { isPlacementTap, isCanvasTap, TAP_SLOP_PX } from "./placement-input.mjs";
import { SCREEN_APPEARANCE, screenObjectSize, screenFieldRadius } from "./screen-appearance.mjs";
import { ConnectionProjector } from "./connection-projection.mjs";
import { MissionMenuReveal } from "./mission-menu-reveal.mjs";
import { loadEarthContours, earthContourById, createContourSwitcher } from "./earth-contours.mjs";
import { EARTH_TEXTURES, prepareTasks, withTimeout, yieldToBrowser } from "./asset-preparation.mjs";
import { waitForGpu } from "./gpu-preparation.mjs";
import * as THREE from "three";
import { SVGLoader } from "three/addons/loaders/SVGLoader.js";
import { LineMaterial } from "three/addons/lines/LineMaterial.js";
import { LineSegments2 } from "three/addons/lines/LineSegments2.js";
import { LineSegmentsGeometry } from "three/addons/lines/LineSegmentsGeometry.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import * as BufferGeometryUtils from "three/addons/utils/BufferGeometryUtils.js";
import { OBJECT_SETTINGS, signalRadiusFor, SATELLITE_DEFAULT_ALTITUDE as ORBIT_ALTITUDE, SATELLITE_MAX_ALTITUDE, SATELLITE_MIN_ALTITUDE } from "./mission-game.mjs";
import { ITEM_TYPES, pointIconSource, isOrbitalType, altitudeSettingsFor } from "./mission-game.mjs";
import { DEFAULT_ICONS } from "./object-catalog.mjs";
import { DEFAULT_CAMERA_IDLE_MOTION, DEFAULT_EARTH_STYLE } from "./ui-shell-config.mjs";

export const EARTH_RADIUS = 3;
export const EARTH_WIDTH_SEGMENTS = 160;
export const EARTH_HEIGHT_SEGMENTS = 96;
export const GROUND_ALTITUDE = 0.08;
export { ORBIT_ALTITUDE };
export { SATELLITE_MAX_ALTITUDE, SATELLITE_MIN_ALTITUDE };
export const SATELLITE_DRAG_MARGIN = 0.045;
export const SATELLITE_ALTITUDE_DRAG_SPAN = 0.55;
export const GROUND_NODE_STEM_HEIGHT = 0.23;
export const NODE_SURFACE_ALTITUDE = 0.012;
export const SURFACE_LINK_ALTITUDE = 0.035;
export const MAP_CAMERA_DISTANCE = 7.2;
export const MAX_DRAWING_BUFFER_PIXELS = 3840 * 2160;
export const EMISSIVE_BLOOM_HIGH_MAX_WIDTH = 1920;
export const EMISSIVE_BLOOM_HIGH_MAX_HEIGHT = 1080;
export const EMISSIVE_BLOOM_MEDIUM_MAX_WIDTH = 1280;
export const EMISSIVE_BLOOM_MEDIUM_MAX_HEIGHT = 720;
export const WORLD_HDR_MSAA_FULL_RES_PIXELS = 1920 * 1080;
export const DEFAULT_SIGNAL_LINK_STYLE = Object.freeze({
  strandCount: 5,
  segmentCount: 80,
  particleCount: 32,
  flowSpeed: 0.19,
  waveAmplitude: 0.009,
  waveFrequency: 3.25,
  strandSpacing: 0.0045,
});
export const DEFAULT_NODE_ICON_BACKDROP_STYLE = Object.freeze({
  color: "#07111f",
  opacity: 0.9,
  radius: 0.127,
});
export function resolveRenderPixelRatio(
  logicalWidth,
  logicalHeight,
  displayWidth,
  displayHeight,
  devicePixelRatio = 1,
  maxDrawingBufferPixels = MAX_DRAWING_BUFFER_PIXELS,
) {
  const width = Math.max(1, Number(logicalWidth) || 1);
  const height = Math.max(1, Number(logicalHeight) || 1);
  const renderedWidth = Math.max(1, Number(displayWidth) || width);
  const renderedHeight = Math.max(1, Number(displayHeight) || height);
  const cssScale = Math.min(renderedWidth / width, renderedHeight / height);
  const requestedRatio = Math.max(0.25, cssScale * Math.max(0.25, Number(devicePixelRatio) || 1));
  const pixelBudget = Math.max(1, Number(maxDrawingBufferPixels) || MAX_DRAWING_BUFFER_PIXELS);
  const maximumRatio = Math.sqrt(pixelBudget / (width * height));
  return Math.max(0.25, Math.min(requestedRatio, maximumRatio));
}

export function resolveEmissiveBloomSize(
  drawingBufferWidth,
  drawingBufferHeight,
  quality = "high",
) {
  const width = Math.max(1, Number(drawingBufferWidth) || 1);
  const height = Math.max(1, Number(drawingBufferHeight) || 1);
  if (quality === "off") return { width: 1, height: 1 };
  const maxWidth = quality === "medium" ? EMISSIVE_BLOOM_MEDIUM_MAX_WIDTH : EMISSIVE_BLOOM_HIGH_MAX_WIDTH;
  const maxHeight = quality === "medium" ? EMISSIVE_BLOOM_MEDIUM_MAX_HEIGHT : EMISSIVE_BLOOM_HIGH_MAX_HEIGHT;
  const scale = Math.min(1, maxWidth / width, maxHeight / height);
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

export function resolveWorldMsaaSamples(
  drawingBufferWidth,
  drawingBufferHeight,
  maxSamples = 4,
) {
  const supportedSamples = Math.max(0, Math.floor(Number(maxSamples) || 0));
  if (supportedSamples < 2) return 0;
  const pixels = Math.max(1, Number(drawingBufferWidth) || 1) * Math.max(1, Number(drawingBufferHeight) || 1);
  const requestedSamples = pixels <= WORLD_HDR_MSAA_FULL_RES_PIXELS ? 4 : 2;
  return Math.min(requestedSamples, supportedSamples);
}

export function projectedEarthDiscRadius(
  cameraDistance,
  radius = EARTH_RADIUS,
  planeHalfSize = EARTH_RADIUS * 1.4,
  planeDepth = cameraDistance,
) {
  const distance = Math.max(radius + 0.001, Number(cameraDistance) || radius + 0.001);
  const depth = Math.max(0.001, Number(planeDepth) || distance);
  const projectedRadius = radius * depth / Math.sqrt(distance * distance - radius * radius);
  return THREE.MathUtils.clamp(projectedRadius / Math.max(radius, planeHalfSize), 0, 1);
}
export const REFERENCE_CAMERA = Object.freeze({
  position: Object.freeze([0, 2.31, MAP_CAMERA_DISTANCE]),
  target: Object.freeze([0, 2.31, 0]),
  fov: 38,
  minDistance: MAP_CAMERA_DISTANCE,
  maxDistance: MAP_CAMERA_DISTANCE,
});
export const RUSSIA_VIEW = Object.freeze({
  rotation: Object.freeze([0.38, -3.31, -0.02]),
  maxWestAngle: THREE.MathUtils.degToRad(13),
  maxEastAngle: THREE.MathUtils.degToRad(10),
  maxNorthAngle: THREE.MathUtils.degToRad(12),
  maxSouthAngle: THREE.MathUtils.degToRad(10),
  verticalCenteringPx: 128,
  endpoints: Object.freeze({
    A: Object.freeze({ latitude: 55.75, longitude: 37.62 }),
    B: Object.freeze({ latitude: 58, longitude: 120 }),
  }),
});

export function resolveEarthOrbitPreferences(source = {}) {
  const limits = source.limitsDegrees || {};
  const degrees = (direction, fallback) => {
    const value = Number(limits[direction]);
    return Number.isFinite(value) ? THREE.MathUtils.clamp(value, 0, 180) : THREE.MathUtils.radToDeg(fallback);
  };
  return {
    west: THREE.MathUtils.degToRad(degrees("west", RUSSIA_VIEW.maxWestAngle)),
    east: THREE.MathUtils.degToRad(degrees("east", RUSSIA_VIEW.maxEastAngle)),
    north: THREE.MathUtils.degToRad(degrees("north", RUSSIA_VIEW.maxNorthAngle)),
    south: THREE.MathUtils.degToRad(degrees("south", RUSSIA_VIEW.maxSouthAngle)),
    centerRussia: source.centerRussia !== false,
    verticalCenteringPx: Math.max(0, Number(source.verticalCenteringPx ?? RUSSIA_VIEW.verticalCenteringPx) || 0),
  };
}

export function verticalCenteringOffset(
  pitch,
  southLimit = RUSSIA_VIEW.maxSouthAngle,
  northLimit = RUSSIA_VIEW.maxNorthAngle,
  maximum = RUSSIA_VIEW.verticalCenteringPx,
) {
  if (!Number.isFinite(pitch)) return 0;
  const limit = pitch < 0 ? southLimit : northLimit;
  if (!Number.isFinite(limit) || limit <= 0) return 0;
  // Negative pitch raises the camera toward the north pole. Keep the orbit
  // workspace above the globe instead of pulling the globe into the header.
  return THREE.MathUtils.clamp(Math.abs(pitch) / limit, 0, 1) * maximum;
}

// Fit complete endpoint markers, not just their geographic anchors. These
// helpers reuse caller-owned output and one scratch vector in the render loop.
const endpointCameraPoint = new THREE.Vector3();
export function endpointVerticalBounds(position, size, camera, height, out = {}) {
  endpointCameraPoint.copy(position).applyMatrix4(camera.matrixWorldInverse);
  const focal = height / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2));
  const lowY = endpointCameraPoint.y - 0.12 * size;
  const highY = endpointCameraPoint.y + (GROUND_NODE_STEM_HEIGHT + 0.09) * size;
  const nearDepth = Math.max(camera.near, -endpointCameraPoint.z - 0.12 * size);
  const farDepth = Math.max(camera.near, -endpointCameraPoint.z + 0.12 * size);
  out.top = height / 2 - Math.max(focal * highY / nearDepth, focal * highY / farDepth);
  out.bottom = height / 2 - Math.min(focal * lowY / nearDepth, focal * lowY / farDepth);
  return out;
}

export function fitEndpointSafeArea(top, bottom, safeTop, safeBottom, height, preferredOffset, out = {}) {
  const available = Math.max(1, safeBottom - safeTop);
  out.zoom = Math.min(1, available / Math.max(1, bottom - top));
  const scaledTop = height / 2 + (top - height / 2) * out.zoom;
  const scaledBottom = height / 2 + (bottom - height / 2) * out.zoom;
  out.offset = THREE.MathUtils.clamp(preferredOffset, safeTop - scaledTop, safeBottom - scaledBottom);
  return out;
}

export const ORBIT_MOTION = Object.freeze({
  sensitivity: 0.52,
  followRate: 9,
  friction: 7,
  softZone: THREE.MathUtils.degToRad(4),
  maxVelocity: THREE.MathUtils.degToRad(95),
});
export function cameraSettleProgress(progress) {
  const value = THREE.MathUtils.clamp(Number(progress) || 0, 0, 1);
  return value < 0.5 ? 4 * value ** 3 : 1 - ((-2 * value + 2) ** 3) / 2;
}

export function cameraIdleSway(target, phase, blend, yawAmplitude, pitchAmplitude) {
  const easedBlend = cameraSettleProgress(blend);
  target.set(
    yawAmplitude * easedBlend * (Math.sin(phase) * 0.78 + Math.sin(phase * 0.47 + 1.3) * 0.22),
    pitchAmplitude * easedBlend * (Math.sin(phase * 0.73 + 0.8) * 0.82 + Math.sin(phase * 0.31 + 2.1) * 0.18),
  );
  return target;
}
export function nearestEquivalentAngle(angle, reference) {
  return angle + Math.round((reference - angle) / (Math.PI * 2)) * Math.PI * 2;
}

export function softBoundaryFactor(value, delta, negativeLimit, positiveLimit = negativeLimit, softZone = ORBIT_MOTION.softZone) {
  if (!delta) return 1;
  const limit = delta > 0 ? positiveLimit : negativeLimit;
  const remaining = Math.max(0, delta > 0 ? limit - value : value + limit);
  if (remaining >= softZone) return 1;
  const normalized = THREE.MathUtils.clamp(remaining / softZone, 0, 1);
  return normalized * normalized * (3 - 2 * normalized);
}

const GLOBE_ROTATION = new THREE.Euler(...RUSSIA_VIEW.rotation);
const GLOBE_QUATERNION = new THREE.Quaternion().setFromEuler(GLOBE_ROTATION);
const MAP_ALIGNMENT_QUATERNION = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI / 2, 0));
const GEO_TO_SCENE_QUATERNION = GLOBE_QUATERNION.clone().multiply(MAP_ALIGNMENT_QUATERNION);
const INVERSE_GEO_TO_SCENE_QUATERNION = GEO_TO_SCENE_QUATERNION.clone().invert();
const linkFrameScratch = { cameraUp: new THREE.Vector3() };

export const NODE_TRANSITION_RATE = 6.5;
const RUSSIA_BORDER_SVG_WIDTH = 6000;
const RUSSIA_BORDER_SVG_HEIGHT = 3000;

function russiaBorderLinePositions(svgData, radius = EARTH_RADIUS * 1.002) {
  const positions = [];
  const appendPoint = (point) => {
    const phi = (point.x / RUSSIA_BORDER_SVG_WIDTH) * Math.PI * 2;
    const theta = (point.y / RUSSIA_BORDER_SVG_HEIGHT) * Math.PI;
    const sinTheta = Math.sin(theta);
    positions.push(
      -radius * Math.cos(phi) * sinTheta,
      radius * Math.cos(theta),
      radius * Math.sin(phi) * sinTheta,
    );
  };
  for (const path of svgData.paths) {
    for (const subPath of path.subPaths) {
      const points = subPath.getPoints(1);
      for (let index = 1; index < points.length; index += 1) {
        const start = points[index - 1];
        const end = points[index];
        if (Math.abs(start.x - end.x) > RUSSIA_BORDER_SVG_WIDTH * 0.5) continue;
        appendPoint(start);
        appendPoint(end);
      }
    }
  }
  return new Float32Array(positions);
}

export function nodeVisualTarget(state) {
  return {
    signal: state === "drop" ? 0 : 1,
    linked: state === "link" ? 1 : 0,
    wrong: state === "wrong" ? 1 : 0,
  };
}

export function signalLinkColor(firstState, secondState, successfulClosing = false) {
  if (successfulClosing) return 0x5ce6ae;
  if (firstState === "wrong" || secondState === "wrong") return 0xf55257;
  if (firstState === "link" || secondState === "link") return 0x5ce6ae;
  return 0x659dfc;
}

const NODE_VERTEX_SHADER = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const NODE_SELECTION_GLSL = `const vec3 selectionColor = vec3(101.0, 157.0, 252.0) / 255.0;`;
const NODE_ACCENT_GLSL = `
  vec3 nodeAccent(float linked, float wrong) {
    vec3 accent = mix(vec3(0.25, 0.49, 0.82), vec3(0.22, 0.95, 0.65), linked);
    return mix(accent, vec3(0.95, 0.26, 0.29), wrong);
  }
`;
const NODE_FRAGMENT_SHADER = `
  uniform float uTime;
  uniform float uSignal;
  uniform float uLinked;
  uniform float uWrong;
  uniform float uPresence;
  uniform float uSelection;
  uniform float uCoreRadius;
  uniform float uAuraWidth;
  uniform float uWaveStart;
  uniform float uWaveEnd;
  varying vec2 vUv;
  ${NODE_ACCENT_GLSL}
  ${NODE_SELECTION_GLSL}

  float band(float value, float center, float width) {
    float edge = max(fwidth(value) * 1.35, 0.00075);
    return 1.0 - smoothstep(width - edge, width + edge, abs(value - center));
  }

  void main() {
    float distanceToCenter = distance(vUv, vec2(0.5));
    if (distanceToCenter > 0.5) discard;

    vec3 accent = nodeAccent(uLinked, uWrong);

    float coreEdge = max(fwidth(distanceToCenter) * 1.35, 0.00075);
    float core = 1.0 - smoothstep(uCoreRadius - coreEdge, uCoreRadius + coreEdge, distanceToCenter);
    float coreBorder = band(distanceToCenter, uCoreRadius + 0.002, 0.006);
    float aura = exp(-pow((distanceToCenter - (uCoreRadius + uAuraWidth * 0.22)) / uAuraWidth, 2.0));
    float waves = 0.0;

    float speed = uTime * 0.28;
    for (int index = 0; index < 4; index++) {
      float phase = fract(speed + float(index) * 0.25);
      float radius = mix(min(uWaveStart, uWaveEnd), uWaveEnd, phase);
      waves += band(distanceToCenter, radius, 0.0045) * pow(1.0 - phase, 0.65);
    }
    waves *= uSignal;

    vec3 color = vec3(0.025, 0.04, 0.065) * core;
    color += vec3(0.94, 0.97, 1.0) * coreBorder * (1.0 - uSelection);
    float statusMix = max(uLinked, uWrong);
    color += accent * aura * mix(mix(0.18, 0.3, uSignal), 0.7, statusMix) * (1.0 - uSelection);
    color += accent * waves;
    float alpha = max(core * 0.98, max(coreBorder, max(aura * 0.42, waves * 0.82)));
    gl_FragColor = vec4(color, alpha * uPresence);
  }
`;

class SoftOrbitControls {
  constructor(camera, domElement, target, limits, idleMotion = null, reducedMotionQuery = null, onOrbitGestureStart = null) {
    this.camera = camera;
    this.domElement = domElement;
    this.target = target.clone();
    this.targetTarget = target.clone();
    this.limits = limits;
    this.freeOrbit = limits.freeOrbit === true;
    this.preciseOrbit = limits.preciseOrbit === true;
    this.centerRussia = limits.centerRussia !== false;
    this.verticalCenteringPx = limits.verticalCenteringPx;
    this.enabled = true;
    this.pointerId = null;
    this.lastPointer = null;
    this.gestureStart = null;
    this.gestureAnnounced = false;
    this.onOrbitGestureStart = onOrbitGestureStart;
    this.dragAxis = "orbit";
    this.velocityYaw = 0;
    this.velocityPitch = 0;
    this.velocityRoll = 0;
    this.cameraEuler = new THREE.Euler(0, 0, 0, "YXZ");
    this.cameraQuaternion = new THREE.Quaternion();
    this.cameraOffset = new THREE.Vector3();
    this.cameraUp = new THREE.Vector3();
    this.panRight = new THREE.Vector3();
    this.panUp = new THREE.Vector3();
    this.panDelta = new THREE.Vector3();
    this.fov = camera.fov;
    this.targetFov = this.fov;
    this.viewTransition = null;
    this.idleMotion = idleMotion ? {
      delay: Math.max(0, Number(idleMotion.delayMs ?? DEFAULT_CAMERA_IDLE_MOTION.delayMs)) / 1000,
      fade: Math.max(0.001, Number(idleMotion.fadeMs ?? DEFAULT_CAMERA_IDLE_MOTION.fadeMs)) / 1000,
      angularSpeed: (Math.PI * 2) / (Math.max(1, Number(idleMotion.periodMs ?? DEFAULT_CAMERA_IDLE_MOTION.periodMs)) / 1000),
      yawAmplitude: THREE.MathUtils.degToRad(Math.max(0, Number(idleMotion.yawDegrees ?? DEFAULT_CAMERA_IDLE_MOTION.yawDegrees))),
      pitchAmplitude: THREE.MathUtils.degToRad(Math.max(0, Number(idleMotion.pitchDegrees ?? DEFAULT_CAMERA_IDLE_MOTION.pitchDegrees))),
    } : null;
    this.reducedMotionQuery = reducedMotionQuery;
    this.idleElapsed = 0;
    this.idleBlend = 0;
    this.idlePhase = 0;
    this.idleOffset = new THREE.Vector2();
    this.onUserActivity = () => { this.idleElapsed = 0; };
    this.onReducedMotionChange = (event) => {
      if (!event.matches) return;
      this.idleBlend = 0;
      this.idleOffset.set(0, 0);
      this.applyCamera();
    };

    const spherical = new THREE.Spherical().setFromVector3(camera.position.clone().sub(this.target));
    this.radius = spherical.radius;
    this.targetRadius = this.radius;
    this.yawCenter = spherical.theta;
    this.pitchCenter = spherical.phi - Math.PI / 2;
    this.rollCenter = 0;
    this.yaw = this.yawCenter;
    this.pitch = this.pitchCenter;
    this.roll = this.rollCenter;
    this.targetYaw = this.yaw;
    this.targetPitch = this.pitch;
    this.targetRoll = this.roll;

    this.onPointerDown = (event) => {
      const panDrag = this.freeOrbit && event.button === 0 && event.shiftKey;
      const rollDrag = this.freeOrbit && (event.button === 2 || (event.button === 0 && event.altKey));
      if (!this.enabled || event.isPrimary === false || this.pointerId !== null || (event.button !== 0 && !rollDrag)) return;
      if (this.tapGesture?.pointerId !== event.pointerId) this.tapGesture = null;
      this.viewTransition = null;
      this.targetYaw = this.yaw;
      this.targetPitch = this.pitch;
      this.targetRoll = this.roll;
      this.targetRadius = this.radius;
      this.targetTarget.copy(this.target);
      this.pointerId = event.pointerId;
      this.dragAxis = panDrag ? "pan" : rollDrag ? "roll" : "orbit";
      this.lastPointer = { x: event.clientX, y: event.clientY, time: event.timeStamp };
      this.gestureStart = { x: event.clientX, y: event.clientY };
      this.gestureAnnounced = false;
      this.velocityYaw = 0;
      this.velocityPitch = 0;
      this.velocityRoll = 0;
      this.domElement.setPointerCapture?.(event.pointerId);
      event.preventDefault();
    };
    this.onPointerMove = (event) => {
      if (!this.enabled || event.pointerId !== this.pointerId || !this.lastPointer) return;
      if (this.tapGesture) {
        // The game handler runs first and owns the irreversible tap/swipe decision.
        // Pending taps never rotate the camera or accumulate release inertia.
        if (this.tapGesture.multitouch || !this.tapGesture.swiped) return;
        if (!this.gestureAnnounced) {
          const dx = event.clientX - this.tapGesture.x;
          const dy = event.clientY - this.tapGesture.y;
          const distance = Math.hypot(dx, dy);
          // Consume only the distance beyond the dead zone: no jump at handoff.
          const deadZone = Math.min(1, this.tapGesture.slopPx / distance);
          this.lastPointer.x = this.tapGesture.x + dx * deadZone;
          this.lastPointer.y = this.tapGesture.y + dy * deadZone;
        }
      }
      if (!this.gestureAnnounced && this.gestureStart && Math.hypot(event.clientX - this.gestureStart.x, event.clientY - this.gestureStart.y) > 5) {
        this.gestureAnnounced = true;
        this.onOrbitGestureStart?.();
      }
      const elapsedMs = Math.max(8, event.timeStamp - this.lastPointer.time);
      const sensitivity = (Math.PI * 2 * ORBIT_MOTION.sensitivity) / Math.max(640, this.domElement.clientHeight);
      const yawDelta = -(event.clientX - this.lastPointer.x) * sensitivity;
      const pitchDelta = -(event.clientY - this.lastPointer.y) * sensitivity;
      const seconds = elapsedMs / 1000;
      if (this.dragAxis === "pan") {
        const pixelsToWorld = 2 * this.radius * Math.tan(THREE.MathUtils.degToRad(this.fov) / 2)
          / Math.max(1, this.domElement.clientHeight);
        this.panRight.set(1, 0, 0).applyQuaternion(this.camera.quaternion);
        this.panUp.set(0, 1, 0).applyQuaternion(this.camera.quaternion);
        this.panDelta.copy(this.panRight).multiplyScalar(-(event.clientX - this.lastPointer.x) * pixelsToWorld);
        this.panDelta.addScaledVector(this.panUp, (event.clientY - this.lastPointer.y) * pixelsToWorld);
        this.targetTarget.add(this.panDelta);
      } else if (this.dragAxis === "roll") {
        const rollDelta = yawDelta;
        this.targetRoll += rollDelta;
        this.velocityRoll = this.preciseOrbit ? 0 : THREE.MathUtils.clamp(rollDelta / seconds, -ORBIT_MOTION.maxVelocity, ORBIT_MOTION.maxVelocity);
      } else {
        const appliedYaw = yawDelta * this.yawBoundaryFactor(this.targetYaw, yawDelta);
        const appliedPitch = pitchDelta * this.pitchBoundaryFactor(this.targetPitch, pitchDelta);
        this.targetYaw = this.clampYaw(this.targetYaw + appliedYaw);
        this.targetPitch = this.clampPitch(this.targetPitch + appliedPitch);
        this.velocityYaw = this.preciseOrbit ? 0 : THREE.MathUtils.clamp(appliedYaw / seconds, -ORBIT_MOTION.maxVelocity, ORBIT_MOTION.maxVelocity);
        this.velocityPitch = this.preciseOrbit ? 0 : THREE.MathUtils.clamp(appliedPitch / seconds, -ORBIT_MOTION.maxVelocity, ORBIT_MOTION.maxVelocity);
      }
      if (this.preciseOrbit) {
        this.yaw = this.targetYaw;
        this.pitch = this.targetPitch;
        this.roll = this.targetRoll;
        this.target.copy(this.targetTarget);
        this.applyCamera();
      }
      this.lastPointer = { x: event.clientX, y: event.clientY, time: event.timeStamp };
      event.preventDefault();
    };
    this.onPointerUp = (event) => {
      if (event.pointerId !== this.pointerId) return;
      this.pointerId = null;
      this.lastPointer = null;
      this.gestureStart = null;
      this.gestureAnnounced = false;
      this.tapGesture = null;
      if (event.type === "pointercancel") this.velocityYaw = this.velocityPitch = this.velocityRoll = 0;
      if (this.domElement.hasPointerCapture?.(event.pointerId)) this.domElement.releasePointerCapture(event.pointerId);
    };
    this.onWheel = (event) => {
      if (!this.enabled || !this.freeOrbit || this.screenConnections) return;
      const scale = Math.exp(event.deltaY * 0.001);
      this.setRadius(THREE.MathUtils.clamp(this.targetRadius * scale, this.limits.minRadius, this.limits.maxRadius), true);
      event.preventDefault();
    };
    this.onContextMenu = (event) => { if (this.freeOrbit) event.preventDefault(); };

    domElement.addEventListener("pointerdown", this.onPointerDown);
    domElement.addEventListener("pointermove", this.onPointerMove);
    domElement.addEventListener("pointerup", this.onPointerUp);
    domElement.addEventListener("pointercancel", this.onPointerUp);
    domElement.addEventListener("wheel", this.onWheel, { passive: false });
    domElement.addEventListener("contextmenu", this.onContextMenu);
    if (this.idleMotion) {
      window.addEventListener("pointermove", this.onUserActivity, { capture: true, passive: true });
      window.addEventListener("pointerdown", this.onUserActivity, { capture: true, passive: true });
      window.addEventListener("wheel", this.onUserActivity, { capture: true, passive: true });
      window.addEventListener("keydown", this.onUserActivity, true);
      window.addEventListener("focus", this.onUserActivity);
      this.reducedMotionQuery?.addEventListener?.("change", this.onReducedMotionChange);
    }
    this.applyCamera();
  }

  applyCamera() {
    if (Math.abs(this.camera.fov - this.fov) > 0.0001) {
      this.camera.fov = this.fov;
      this.camera.updateProjectionMatrix();
    }
    const cameraPitch = this.clampPitch(this.pitch + this.idleOffset.y);
    const cameraYaw = this.clampYaw(this.yaw + this.idleOffset.x);
    this.cameraEuler.set(cameraPitch, cameraYaw, this.roll, "YXZ");
    this.cameraQuaternion.setFromEuler(this.cameraEuler);
    this.camera.position.copy(this.cameraOffset.set(0, 0, this.radius).applyQuaternion(this.cameraQuaternion).add(this.target));
    this.camera.up.copy(this.cameraUp.set(0, 1, 0).applyQuaternion(this.cameraQuaternion));
    this.camera.lookAt(this.target);
  }

  update(delta) {
    this.updateIdleMotion(delta);
    if (!this.enabled) {
      this.velocityYaw = 0;
      this.velocityPitch = 0;
      this.velocityRoll = 0;
      this.applyCamera();
      return;
    }
    if (this.viewTransition && this.pointerId === null) {
      const transition = this.viewTransition;
      transition.elapsed = Math.min(transition.duration, transition.elapsed + delta);
      const progress = cameraSettleProgress(transition.elapsed / transition.duration);
      this.target.lerpVectors(transition.startTarget, transition.endTarget, progress);
      this.yaw = THREE.MathUtils.lerp(transition.startYaw, transition.endYaw, progress);
      this.pitch = THREE.MathUtils.lerp(transition.startPitch, transition.endPitch, progress);
      this.roll = THREE.MathUtils.lerp(transition.startRoll, transition.endRoll, progress);
      this.radius = THREE.MathUtils.lerp(transition.startRadius, transition.endRadius, progress);
      this.fov = THREE.MathUtils.lerp(transition.startFov, transition.endFov, progress);
      if (transition.elapsed >= transition.duration) this.viewTransition = null;
      this.applyCamera();
      return;
    }
    if (this.pointerId === null && !this.preciseOrbit) {
      const yawStep = this.velocityYaw * delta;
      const pitchStep = this.velocityPitch * delta;
      const rollStep = this.velocityRoll * delta;
      this.targetYaw = this.clampYaw(this.targetYaw + yawStep * this.yawBoundaryFactor(this.targetYaw, yawStep));
      this.targetPitch = this.clampPitch(this.targetPitch + pitchStep * this.pitchBoundaryFactor(this.targetPitch, pitchStep));
      this.targetRoll += rollStep;
      const friction = Math.exp(-ORBIT_MOTION.friction * delta);
      this.velocityYaw *= friction;
      this.velocityPitch *= friction;
      this.velocityRoll *= friction;
      if (Math.abs(this.velocityYaw) < 0.0001) this.velocityYaw = 0;
      if (Math.abs(this.velocityPitch) < 0.0001) this.velocityPitch = 0;
      if (Math.abs(this.velocityRoll) < 0.0001) this.velocityRoll = 0;
    }

    this.target.x = THREE.MathUtils.damp(this.target.x, this.targetTarget.x, ORBIT_MOTION.followRate, delta);
    this.target.y = THREE.MathUtils.damp(this.target.y, this.targetTarget.y, ORBIT_MOTION.followRate, delta);
    this.target.z = THREE.MathUtils.damp(this.target.z, this.targetTarget.z, ORBIT_MOTION.followRate, delta);
    this.yaw = THREE.MathUtils.damp(this.yaw, this.targetYaw, ORBIT_MOTION.followRate, delta);
    this.pitch = THREE.MathUtils.damp(this.pitch, this.targetPitch, ORBIT_MOTION.followRate, delta);
    this.roll = THREE.MathUtils.damp(this.roll, this.targetRoll, ORBIT_MOTION.followRate, delta);
    this.radius = THREE.MathUtils.damp(this.radius, this.targetRadius, 4.5, delta);
    this.fov = THREE.MathUtils.damp(this.fov, this.targetFov, ORBIT_MOTION.followRate, delta);
    this.applyCamera();
  }

  updateIdleMotion(delta) {
    if (this.screenConnections) { this.resetIdleMotion(true); return; }
    if (!this.idleMotion) return;
    this.idleElapsed += delta;
    const active = !this.reducedMotionQuery?.matches && this.idleElapsed >= this.idleMotion.delay;
    const blendStep = delta / this.idleMotion.fade;
    this.idleBlend = THREE.MathUtils.clamp(this.idleBlend + (active ? blendStep : -blendStep), 0, 1);
    if (this.idleBlend <= 0) {
      this.idleOffset.set(0, 0);
      return;
    }
    this.idlePhase += delta * this.idleMotion.angularSpeed;
    cameraIdleSway(
      this.idleOffset,
      this.idlePhase,
      this.idleBlend,
      this.idleMotion.yawAmplitude,
      this.idleMotion.pitchAmplitude,
    );
  }

  resetIdleMotion(immediate = false) {
    this.idleElapsed = 0;
    if (!immediate) return;
    this.idleBlend = 0;
    this.idleOffset.set(0, 0);
  }

  setRadius(radius, immediate = false) {
    this.resetIdleMotion(true);
    this.viewTransition = null;
    this.targetRadius = radius;
    if (immediate) this.radius = radius;
    this.applyCamera();
  }

  setFov(fov, immediate = false) {
    this.resetIdleMotion(true);
    this.viewTransition = null;
    this.targetFov = THREE.MathUtils.clamp(fov, 15, 100);
    if (immediate) this.fov = this.targetFov;
    this.applyCamera();
  }

  clampYaw(value) {
    if (this.freeOrbit) return value;
    return THREE.MathUtils.clamp(value, this.yawCenter - this.limits.east, this.yawCenter + this.limits.west);
  }

  clampPitch(value) {
    if (this.freeOrbit) return value;
    return THREE.MathUtils.clamp(value, this.pitchCenter - this.limits.south, this.pitchCenter + this.limits.north);
  }

  yawBoundaryFactor(value, delta) {
    return this.freeOrbit ? 1 : softBoundaryFactor(value - this.yawCenter, delta, this.limits.east, this.limits.west);
  }

  pitchBoundaryFactor(value, delta) {
    return this.freeOrbit ? 1 : softBoundaryFactor(value - this.pitchCenter, delta, this.limits.south, this.limits.north);
  }

  setEarthOrbitPreferences(source) {
    const next = resolveEarthOrbitPreferences(source);
    Object.assign(this.limits, { west: next.west, east: next.east, north: next.north, south: next.south });
    this.centerRussia = next.centerRussia;
    this.verticalCenteringPx = next.verticalCenteringPx;
    if (!this.freeOrbit) {
      this.targetYaw = this.clampYaw(this.targetYaw);
      this.targetPitch = this.clampPitch(this.targetPitch);
    }
  }

  setViewState(view, immediate = false, durationMs = 0) {
    if (!view?.target) return;
    this.resetIdleMotion(true);
    const target = new THREE.Vector3().fromArray(view.target);
    let distance = Number(view.distance);
    let pitch = Number(view.rotation?.[0]);
    let yaw = Number(view.rotation?.[1]);
    let roll = Number(view.rotation?.[2]);
    let fov = Number(view.fov ?? REFERENCE_CAMERA.fov);
    if (![distance, pitch, yaw, roll].every(Number.isFinite) && view.camera?.length === 3) {
      const offset = new THREE.Vector3().fromArray(view.camera).sub(target);
      if (offset.lengthSq() < 0.01) return;
      const spherical = new THREE.Spherical().setFromVector3(offset);
      distance = spherical.radius;
      pitch = spherical.phi - Math.PI / 2;
      yaw = spherical.theta;
      roll = 0;
    }
    if (![distance, pitch, yaw, roll, fov].every(Number.isFinite) || distance <= 0) return;
    fov = THREE.MathUtils.clamp(fov, 15, 100);
    if (!view.exact) {
      yaw = nearestEquivalentAngle(yaw, this.yaw);
      pitch = nearestEquivalentAngle(pitch, this.pitch);
      roll = nearestEquivalentAngle(roll, this.roll);
    }
    this.yawCenter = yaw;
    this.pitchCenter = pitch;
    this.rollCenter = roll;
    this.targetTarget.copy(target);
    this.targetRadius = distance;
    this.targetYaw = yaw;
    this.targetPitch = pitch;
    this.targetRoll = roll;
    this.targetFov = fov;
    this.velocityYaw = 0;
    this.velocityPitch = 0;
    this.velocityRoll = 0;
    if (immediate) {
      this.viewTransition = null;
      this.target.copy(target);
      this.radius = distance;
      this.yaw = yaw;
      this.pitch = pitch;
      this.roll = roll;
      this.fov = fov;
    } else if (Number(durationMs) > 0) {
      this.viewTransition = {
        duration: Math.max(0.001, Number(durationMs) / 1000),
        elapsed: 0,
        startTarget: this.target.clone(),
        endTarget: target.clone(),
        startRadius: this.radius,
        endRadius: distance,
        startYaw: this.yaw,
        endYaw: yaw,
        startPitch: this.pitch,
        endPitch: pitch,
        startRoll: this.roll,
        endRoll: roll,
        startFov: this.fov,
        endFov: fov,
      };
    } else {
      this.viewTransition = null;
    }
    this.applyCamera();
  }

  getViewState() {
    return {
      target: this.target.toArray(),
      rotation: [this.pitch, this.yaw, this.roll],
      distance: this.radius,
      fov: this.fov,
    };
  }

  dispose() {
    this.domElement.removeEventListener("pointerdown", this.onPointerDown);
    this.domElement.removeEventListener("pointermove", this.onPointerMove);
    this.domElement.removeEventListener("pointerup", this.onPointerUp);
    this.domElement.removeEventListener("pointercancel", this.onPointerUp);
    this.domElement.removeEventListener("wheel", this.onWheel);
    this.domElement.removeEventListener("contextmenu", this.onContextMenu);
    if (this.idleMotion) {
      window.removeEventListener("pointermove", this.onUserActivity, true);
      window.removeEventListener("pointerdown", this.onUserActivity, true);
      window.removeEventListener("wheel", this.onUserActivity, true);
      window.removeEventListener("keydown", this.onUserActivity, true);
      window.removeEventListener("focus", this.onUserActivity);
      this.reducedMotionQuery?.removeEventListener?.("change", this.onReducedMotionChange);
    }
  }
}

export async function createWebGLField({
  container,
  placements,
  network,
  itemTypes,
  endpoints = RUSSIA_VIEW.endpoints,
  selectedItem,
  preparedAssets = null,
  contourCatalog = null,
  startPaused = false,
  initialView,
  maxDrawingBufferPixels = MAX_DRAWING_BUFFER_PIXELS,
  earthStyle = DEFAULT_EARTH_STYLE,
  nodeIconBackdropStyle = DEFAULT_NODE_ICON_BACKDROP_STYLE,
  signalLinkStyle = DEFAULT_SIGNAL_LINK_STYLE,
  earthOrbit = {},
  cameraIdleMotion = null,
  onOrbitGestureStart = null,
  freeOrbit = false,
  preciseOrbit = false,
  onPlace,
  onSelectPlacement = null,
  onMove,
  onMovePreview = null,
  onMoveCancel = null,
  onConnectionFrame = null,
  placementRejection = () => null,
  onRemove,
}) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
  try {
  const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  renderer.domElement.className = "webgl-canvas";
  renderer.domElement.setAttribute("aria-label", "Трёхмерное игровое поле — перетащите спутник по глобусу; используйте ручку со стрелками для изменения высоты");
  container.replaceChildren(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x070b12);
  scene.fog = new THREE.FogExp2(0x070b12, 0.025);
  const camera = new THREE.PerspectiveCamera(REFERENCE_CAMERA.fov, 1, 0.1, 60);
  camera.position.fromArray(REFERENCE_CAMERA.position);
  if (initialView?.camera?.length === 3) camera.position.fromArray(initialView.camera);
  const presentationOffset = {
    current: new THREE.Vector2(),
    from: new THREE.Vector2(),
    target: new THREE.Vector2(),
    startedAt: 0,
    durationMs: 0,
  };
  let endpointSafeArea = null;
  let missionMarkerSafeArea = null, missionMarkerSafeEntries = [], missionMarkerSafeRects = [];
  const missionMarkerCameraPoint = new THREE.Vector3(), missionMarkerFit = {};
  const endpointBounds = {}, endpointFit = {};
  let appliedProjectionZoom = 1;
  let appliedProjectionWidth = 0;
  let appliedProjectionHeight = 0;
  let appliedProjectionX = Number.NaN;
  let appliedProjectionY = Number.NaN;

  const textureLoader = new THREE.TextureLoader();
  const svgLoader = new SVGLoader();
  const iconSources = preparedAssets?.icons || [...new Set([
    ...Object.values(DEFAULT_ICONS).map((icon) => icon.src),
    ...Object.values(itemTypes).map((item) => item.icon),
  ].filter(Boolean))];
  const iconGeometries = new Map(await Promise.all(iconSources.map(async (source) => [source,
    preparedAssets ? svgIconGeometry(svgLoader.parse(preparedAssets.get(source).text), 0.18)
      : await loadSvgIconGeometry(svgLoader, source, 0.18),
  ])));
  const contours = contourCatalog || preparedAssets?.contours || await loadEarthContours();
  const initialContour = earthContourById(contours, earthStyle.russiaContour);
  const loadContourPair = async (id, prepared = null) => {
    const variant = earthContourById(contours, id);
    const results = await Promise.allSettled([
      prepared ? Promise.resolve().then(() => {
        const texture = new THREE.Texture(prepared.get(variant.fill).image);
        texture.needsUpdate = true;
        return texture;
      }) : textureLoader.loadAsync(variant.fill),
      prepared ? Promise.resolve().then(() => svgLoader.parse(prepared.get(variant.border).text)) : svgLoader.loadAsync(variant.border),
    ]);
    const failed = results.find((result) => result.status === "rejected");
    if (failed) {
      if (results[0].status === "fulfilled") results[0].value.dispose();
      throw failed.reason;
    }
    const fill = results[0].value;
    const positions = russiaBorderLinePositions(results[1].value);
    if (!positions.length) { fill.dispose(); throw new Error("Контур не содержит линий"); }
    fill.colorSpace = THREE.NoColorSpace;
    fill.format = THREE.RedFormat;
    fill.wrapS = THREE.RepeatWrapping;
    fill.wrapT = THREE.ClampToEdgeWrapping;
    fill.minFilter = THREE.LinearMipmapLinearFilter;
    fill.magFilter = THREE.LinearFilter;
    fill.generateMipmaps = true;
    fill.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
    const geometry = new LineSegmentsGeometry();
    geometry.setPositions(positions);
    geometry.computeBoundingSphere();
    geometry.userData.shared = true;
    return { fill, geometry };
  };
  const initialContourPair = await loadContourPair(initialContour.id, preparedAssets);
  const geometryFor = (source, endpoint = false) => {
    if (!source) return null;
    const key = endpoint ? `endpoint:${source}` : source;
    if (!iconGeometries.has(key)) {
      const original = iconGeometries.get(source);
      if (original && endpoint) {
        const geometry = original.clone(); geometry.scale(0.1 / 0.18, 0.1 / 0.18, 1);
        geometry.userData.shared = true; iconGeometries.set(key, geometry);
      } else if (source.startsWith("data:image/svg+xml;charset=utf-8,")) {
        const data = svgLoader.parse(decodeURIComponent(source.slice(source.indexOf(",") + 1)));
        iconGeometries.set(key, svgIconGeometry(data, endpoint ? 0.1 : 0.18));
      }
    }
    return iconGeometries.get(key) || null;
  };
  // Keep both icon sizes resident: later missions must not reparse their SVGs.
  for (const source of iconSources) geometryFor(source, true);
  const pinnedIconKeys = new Set(iconGeometries.keys());
  const textures = await Promise.all(EARTH_TEXTURES.slice(0, 5).map(async (source) => {
    if (!preparedAssets) return textureLoader.loadAsync(source);
    const texture = new THREE.Texture(preparedAssets.get(source).image);
    texture.needsUpdate = true;
    return texture;
  }));
  const [earthTexture, earthIlluminationCore, earthSpecular, earthNormal, earthClouds] = textures;
  const russiaSurfaceMask = initialContourPair.fill;
  earthTexture.colorSpace = THREE.SRGBColorSpace;
  earthIlluminationCore.colorSpace = THREE.NoColorSpace;
  earthSpecular.colorSpace = THREE.NoColorSpace;
  earthNormal.colorSpace = THREE.NoColorSpace;
  earthClouds.colorSpace = THREE.NoColorSpace;
  earthClouds.format = THREE.RedFormat;
  for (const texture of [earthTexture, earthIlluminationCore, earthSpecular, earthNormal, earthClouds]) {
    texture.wrapS = THREE.RepeatWrapping;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = true;
    texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  }
  const earthUniforms = {
    ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog),
    uDayMap: { value: earthTexture },
    uSpecularMap: { value: earthSpecular },
    uNormalMap: { value: earthNormal },
    uCloudMap: { value: earthClouds },
    uCityMap: { value: earthIlluminationCore },
    uRussiaMask: { value: russiaSurfaceMask },
    uSunDirection: { value: new THREE.Vector3(-4, 5, 7).normalize() },
    uDayTint: { value: new THREE.Color() },
    uNightTint: { value: new THREE.Color() },
    uDayIntensity: { value: 1 },
    uAmbientIntensity: { value: 0.25 },
    uSaturation: { value: 1 },
    uTextureColorMix: { value: 0 },
    uTextureSaturation: { value: 1 },
    uSurfaceExposure: { value: 0.78 },
    uSurfaceGamma: { value: 1.16 },
    uSurfaceContrast: { value: 1.12 },
    uOceanColor: { value: new THREE.Color() },
    uOceanIntensity: { value: 0.78 },
    uRussiaSurfaceBoost: { value: 0.9 },
    uOutsideSurfaceDim: { value: 0.48 },
    uRussiaMaskFeather: { value: 1.35 },
    uTerminatorSoftness: { value: 0.2 },
    uSpecularIntensity: { value: 0.25 },
    uNormalStrength: { value: 0.36 },
    uCloudHighlights: { value: 0.2 },
    uCloudBlackPoint: { value: 0.16 },
    uCloudWhitePoint: { value: 0.58 },
    uCloudShadowIntensity: { value: 0.16 },
    uHazeColor: { value: new THREE.Color() },
    uHazeIntensity: { value: 0.2 },
    uHazePower: { value: 2.2 },
    uCityColor: { value: new THREE.Color() },
    uCityHotColor: { value: new THREE.Color() },
    uCityIntensity: { value: 1.65 },
    uCityHotIntensity: { value: 2.4 },
    uCityCoreStart: { value: 0.12 },
    uCityDayVisibility: { value: 0.12 },
    uCityBlackPoint: { value: 0.018 },
    uCityWhitePoint: { value: 0.34 },
    uCityGamma: { value: 1.1 },
    uCityHotPoint: { value: 0.58 },
    uCityLimbStart: { value: 0.035 },
    uCityLimbEnd: { value: 0.2 },
  };
  const earthMaterial = new THREE.ShaderMaterial({
    uniforms: earthUniforms,
    fog: true,
    vertexShader: `
      varying vec2 vEarthUv;
      varying vec3 vWorldNormal;
      varying vec3 vWorldTangent;
      varying vec3 vWorldBitangent;
      varying vec3 vWorldPosition;
      #include <fog_pars_vertex>
      void main() {
        vEarthUv = uv;
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vec4 mvPosition = viewMatrix * worldPosition;
        vWorldPosition = worldPosition.xyz;
        vWorldNormal = normalize(mat3(modelMatrix) * normal);
        vec3 tangentSeed = vec3(normal.z, 0.0, -normal.x);
        vec3 localTangent = length(tangentSeed) > 0.0001 ? normalize(tangentSeed) : vec3(1.0, 0.0, 0.0);
        vec3 localBitangent = normalize(cross(normal, localTangent));
        vWorldTangent = normalize(mat3(modelMatrix) * localTangent);
        vWorldBitangent = normalize(mat3(modelMatrix) * localBitangent);
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }
    `,
    fragmentShader: `
      uniform sampler2D uDayMap;
      uniform sampler2D uSpecularMap;
      uniform sampler2D uNormalMap;
      uniform sampler2D uCloudMap;
      uniform sampler2D uCityMap;
      uniform sampler2D uRussiaMask;
      uniform vec3 uSunDirection;
      uniform vec3 uDayTint;
      uniform vec3 uNightTint;
      uniform float uDayIntensity;
      uniform float uAmbientIntensity;
      uniform float uSaturation;
      uniform float uTextureColorMix;
      uniform float uTextureSaturation;
      uniform float uSurfaceExposure;
      uniform float uSurfaceGamma;
      uniform float uSurfaceContrast;
      uniform vec3 uOceanColor;
      uniform float uOceanIntensity;
      uniform float uRussiaSurfaceBoost;
      uniform float uOutsideSurfaceDim;
      uniform float uRussiaMaskFeather;
      uniform float uTerminatorSoftness;
      uniform float uSpecularIntensity;
      uniform float uNormalStrength;
      uniform float uCloudHighlights;
      uniform float uCloudBlackPoint;
      uniform float uCloudWhitePoint;
      uniform float uCloudShadowIntensity;
      uniform vec3 uHazeColor;
      uniform float uHazeIntensity;
      uniform float uHazePower;
      uniform vec3 uCityColor;
      uniform vec3 uCityHotColor;
      uniform float uCityIntensity;
      uniform float uCityHotIntensity;
      uniform float uCityCoreStart;
      uniform float uCityDayVisibility;
      uniform float uCityBlackPoint;
      uniform float uCityWhitePoint;
      uniform float uCityGamma;
      uniform float uCityHotPoint;
      uniform float uCityLimbStart;
      uniform float uCityLimbEnd;
      varying vec2 vEarthUv;
      varying vec3 vWorldNormal;
      varying vec3 vWorldTangent;
      varying vec3 vWorldBitangent;
      varying vec3 vWorldPosition;
      #include <common>
      #include <fog_pars_fragment>
      void main() {
        vec3 baseNormal = normalize(vWorldNormal);
        vec3 tangentNormal = texture2D(uNormalMap, vEarthUv).xyz * 2.0 - 1.0;
        tangentNormal.xy *= uNormalStrength;
        tangentNormal.z = max(tangentNormal.z, 0.08);
        vec3 normal = normalize(
          normalize(vWorldTangent) * tangentNormal.x
          + normalize(vWorldBitangent) * tangentNormal.y
          + baseNormal * tangentNormal.z
        );
        vec3 sunDirection = normalize(uSunDirection);
        vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
        float normalToSun = dot(baseNormal, sunDirection);
        float daylight = smoothstep(-uTerminatorSoftness, uTerminatorSoftness, normalToSun);
        float lambert = max(dot(normal, sunDirection), 0.0);

        vec3 daySample = texture2D(uDayMap, vEarthUv).rgb;
        float originalLuminance = dot(daySample, vec3(0.2126, 0.7152, 0.0722));
        vec3 originalColor = mix(vec3(originalLuminance), daySample, uTextureSaturation);
        vec3 gradedSample = pow(max(daySample, vec3(0.0)), vec3(uSurfaceGamma));
        float luminance = dot(gradedSample, vec3(0.2126, 0.7152, 0.0722));
        gradedSample = mix(vec3(luminance), gradedSample, uSaturation);
        gradedSample = max((gradedSample - 0.18) * uSurfaceContrast + 0.18, vec3(0.0));
        vec3 surfaceTint = mix(uNightTint, uDayTint, daylight);
        float surfaceLight = uAmbientIntensity + uDayIntensity * mix(0.08, 1.0, lambert);
        vec3 styledSurface = gradedSample * surfaceTint;
        vec3 surfaceColor = mix(styledSurface, originalColor, uTextureColorMix);
        vec3 outgoingLight = surfaceColor * surfaceLight * uSurfaceExposure;

        // Preserve the continuous data value: the same map defines the hard
        // land/water separation and the softer spatial distribution of sheen.
        float specularSample = clamp(texture2D(uSpecularMap, vEarthUv).r, 0.0, 1.0);
        float oceanMask = smoothstep(0.24, 0.82, specularSample);
        float oceanTextureDetail = smoothstep(0.005, 0.12, originalLuminance);
        vec3 oceanTonalColor = uOceanColor
          * uOceanIntensity
          * mix(0.74, 1.08, oceanTextureDetail)
          * mix(0.72, 1.0, daylight);
        // Ocean color is an authored tonal blend, not a lower clamp. This lets
        // the editor make water darker as well as lighter while retaining the
        // low-frequency detail of the diffuse map.
        outgoingLight = mix(outgoingLight, oceanTonalColor, oceanMask);

        float maximumChannel = max(daySample.r, max(daySample.g, daySample.b));
        float minimumChannel = min(daySample.r, min(daySample.g, daySample.b));
        float neutralSurface = 1.0 - clamp((maximumChannel - minimumChannel) * 4.0, 0.0, 1.0);
        float cloudMask = smoothstep(0.5, 0.88, luminance) * smoothstep(0.45, 0.92, neutralSurface);
        outgoingLight += vec3(0.64, 0.78, 1.0) * cloudMask * uCloudHighlights * (0.34 + 0.66 * daylight);

        float viewFacing = clamp(dot(baseNormal, viewDirection), 0.0, 1.0);
        // A direct map-driven sheen replaces the former tight Blinn-Phong lobe.
        // It follows all ocean pixels instead of collapsing into one hotspot;
        // view angle and broad daylight only modulate the mapped distribution.
        float mappedSpecular = smoothstep(0.08, 0.96, specularSample);
        float broadDayResponse = smoothstep(-0.42, 0.72, dot(normal, sunDirection));
        float grazingResponse = pow(1.0 - viewFacing, 1.35);
        float oceanSheen = mappedSpecular
          * mix(0.7, 1.0, grazingResponse)
          * mix(0.34, 1.0, broadDayResponse)
          * mix(0.28, 1.0, daylight);
        vec3 oceanSheenColor = mix(uOceanColor, vec3(0.58, 0.76, 1.0), 0.28);
        outgoingLight += oceanSheenColor * oceanSheen * uSpecularIntensity * 0.32;

        float rimHaze = pow(1.0 - viewFacing, uHazePower);
        float hazeAmount = rimHaze * uHazeIntensity * (0.22 + daylight * 0.78);
        outgoingLight += uHazeColor * hazeAmount * (0.25 + luminance * 0.75);

        // The fill SVG is geographic data, not a baked lighting effect. It
        // establishes the requested hierarchy: readable Russia, quiet context.
        float russiaRaw = texture2D(uRussiaMask, vEarthUv).r;
        float russiaEdge = max(fwidth(russiaRaw) * uRussiaMaskFeather, 1.0 / 255.0);
        float russiaMask = smoothstep(0.5 - russiaEdge, 0.5 + russiaEdge, russiaRaw);
        vec3 russiaStyled = gradedSample * mix(uNightTint, uDayTint, 0.82);
        vec3 russiaDetail = mix(russiaStyled, originalColor, uTextureColorMix)
          * uRussiaSurfaceBoost
          * (0.55 + luminance * 0.45);
        float landMask = 1.0 - oceanMask;
        float regionalDim = mix(uOutsideSurfaceDim, 1.0, russiaMask);
        outgoingLight = outgoingLight * mix(1.0, regionalDim, landMask)
          + russiaDetail * russiaMask;

        // The raised cloud shell casts a restrained, slightly offset shadow on
        // the surface. City emission is added afterwards and remains legible.
        float cloudShadowRaw = texture2D(uCloudMap, vEarthUv + vec2(-0.0018, 0.001)).r;
        float cloudShadow = smoothstep(uCloudBlackPoint, uCloudWhitePoint, cloudShadowRaw);
        outgoingLight *= 1.0 - cloudShadow * uCloudShadowIntensity * (0.35 + daylight * 0.65);

        // The source texture contains nearly black exposed rock around the
        // polar ice. Preserve it as detail, but keep it inside the same navy
        // value range instead of allowing isolated absolute-black patches.
        float polarLatitude = smoothstep(0.5, 0.82, abs(vEarthUv.y - 0.5) * 2.0);
        float polarLand = polarLatitude * landMask;
        vec3 polarLandFloor = mix(uNightTint, uDayTint, 0.38 + daylight * 0.32)
          * uSurfaceExposure
          * (0.22 + daylight * 0.12);
        outgoingLight = max(outgoingLight, polarLandFloor * polarLand);

        // The source is a sharp scalar data map. Color, thresholding, hot core,
        // day visibility and horizon attenuation stay fully runtime-controlled.
        // A small positive LOD bias keeps sub-pixel city clusters stable while
        // the globe or idle camera moves; the source remains a sharp data map.
        float cityRaw = texture2D(uCityMap, vEarthUv, 0.75).r;
        float cityAa = max(fwidth(cityRaw) * 1.5, 2.0 / 255.0);
        float citySource = smoothstep(uCityBlackPoint - cityAa, uCityWhitePoint + cityAa, cityRaw);
        citySource = pow(clamp(citySource, 0.0, 1.0), uCityGamma);
        float cityLimbFade = smoothstep(uCityLimbStart, uCityLimbEnd, viewFacing);
        float cityVisibility = mix(1.0, uCityDayVisibility, daylight) * cityLimbFade;
        float cityCore = smoothstep(uCityCoreStart, 1.0, citySource);
        float cityHot = smoothstep(uCityHotPoint, 1.0, citySource);
        vec3 cityColor = mix(uCityColor, uCityHotColor, cityHot);
        outgoingLight += cityColor * cityCore * cityVisibility * uCityIntensity;
        outgoingLight += uCityHotColor * cityHot * cityHot * cityVisibility * uCityHotIntensity;

        gl_FragColor = vec4(outgoingLight, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
        #include <fog_fragment>
      }
    `,
  });
  const earth = new THREE.Mesh(new THREE.SphereGeometry(EARTH_RADIUS, EARTH_WIDTH_SEGMENTS, EARTH_HEIGHT_SEGMENTS), earthMaterial);
  earth.rotation.copy(GLOBE_ROTATION);
  scene.add(earth);
  const cloudUniforms = {
    ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog),
    uMap: { value: earthClouds },
    uSunDirection: { value: earthUniforms.uSunDirection.value },
    uColor: { value: new THREE.Color() },
    uIntensity: { value: 0.75 },
    uOpacity: { value: 0.4 },
    uBlackPoint: { value: 0.16 },
    uWhitePoint: { value: 0.58 },
  };
  const cloudMaterial = new THREE.ShaderMaterial({
    uniforms: cloudUniforms,
    transparent: true,
    depthTest: true,
    depthWrite: false,
    blending: THREE.NormalBlending,
    vertexShader: `
      varying vec2 vCloudUv;
      varying vec3 vWorldNormal;
      varying vec3 vWorldPosition;
      #include <fog_pars_vertex>
      void main() {
        vCloudUv = uv;
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vec4 mvPosition = viewMatrix * worldPosition;
        vWorldNormal = normalize(mat3(modelMatrix) * normal);
        vWorldPosition = worldPosition.xyz;
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }
    `,
    fragmentShader: `
      uniform sampler2D uMap;
      uniform vec3 uSunDirection;
      uniform vec3 uColor;
      uniform float uIntensity;
      uniform float uOpacity;
      uniform float uBlackPoint;
      uniform float uWhitePoint;
      varying vec2 vCloudUv;
      varying vec3 vWorldNormal;
      varying vec3 vWorldPosition;
      #include <fog_pars_fragment>
      void main() {
        vec3 normal = normalize(vWorldNormal);
        vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
        float raw = texture2D(uMap, vCloudUv, 0.25).r;
        float aa = max(fwidth(raw) * 1.2, 1.0 / 255.0);
        float mask = smoothstep(uBlackPoint - aa, uWhitePoint + aa, raw);
        float viewFacing = clamp(dot(normal, viewDirection), 0.0, 1.0);
        float limbFade = smoothstep(0.025, 0.18, viewFacing);
        float lambert = max(dot(normal, normalize(uSunDirection)), 0.0);
        float silverLining = pow(1.0 - viewFacing, 2.2) * 0.22;
        float alpha = mask * uOpacity * limbFade;
        if (alpha < 0.001) discard;
        vec3 litCloud = uColor * uIntensity * (0.34 + lambert * 0.66 + silverLining);
        gl_FragColor = vec4(litCloud, alpha);
        #include <fog_fragment>
      }
    `,
  });
  const cloudLayer = new THREE.Mesh(
    new THREE.SphereGeometry(EARTH_RADIUS, 128, 80),
    cloudMaterial,
  );
  cloudLayer.rotation.copy(earth.rotation);
  cloudLayer.renderOrder = 2;
  scene.add(cloudLayer);
  const borderLineGeometry = initialContourPair.geometry;
  const borderCoreWhite = new THREE.Color(0xf7fbff);
  const borderGlowTint = new THREE.Color(0x5c9bfa);
  const borderCoreMaterial = new LineMaterial({
    color: borderCoreWhite,
    linewidth: 2,
    transparent: true,
    opacity: 1,
    blending: THREE.NormalBlending,
    depthWrite: false,
    toneMapped: false,
    alphaToCoverage: true,
  });
  const borderCore = new LineSegments2(borderLineGeometry, borderCoreMaterial);
  borderCore.rotation.copy(earth.rotation);
  borderCore.renderOrder = 2.9;
  scene.add(borderCore);

  // The SVG border and sharp city intensity data share one selective-emissive
  // target. Bloom is generated from the current camera every frame; no blurred
  // city-light texture or enlarged transparent Earth shell is involved.
  const borderBloomScene = new THREE.Scene();
  const borderBloomDepthMaterial = new THREE.MeshBasicMaterial({
    colorWrite: false,
    depthTest: true,
    depthWrite: true,
    // Push the depth-only occluder infinitesimally behind the coplanar city
    // emitter. Front-side lights stay stable; the far side remains occluded.
    polygonOffset: true,
    polygonOffsetFactor: 1,
    polygonOffsetUnits: 1,
  });
  const borderBloomDepthSphere = new THREE.Mesh(earth.geometry, borderBloomDepthMaterial);
  borderBloomDepthSphere.rotation.copy(earth.rotation);
  borderBloomDepthSphere.renderOrder = 0;
  borderBloomScene.add(borderBloomDepthSphere);
  const cityBloomUniforms = {
    uMap: { value: earthIlluminationCore },
    uSunDirection: { value: earthUniforms.uSunDirection.value },
    uColor: { value: earthUniforms.uCityColor.value },
    uHotColor: { value: earthUniforms.uCityHotColor.value },
    uIntensity: { value: 0.85 },
    uDayVisibility: { value: 0.12 },
    uTerminatorSoftness: { value: earthUniforms.uTerminatorSoftness.value },
    uBlackPoint: { value: 0.018 },
    uWhitePoint: { value: 0.34 },
    uGamma: { value: 1.1 },
    uGlowStart: { value: 0.055 },
    uHotPoint: { value: 0.58 },
    uLimbStart: { value: 0.035 },
    uLimbEnd: { value: 0.2 },
  };
  const cityBloomEmitterMaterial = new THREE.ShaderMaterial({
    uniforms: cityBloomUniforms,
    depthTest: true,
    depthWrite: false,
    toneMapped: false,
    vertexShader: `
      varying vec2 vCityUv;
      varying vec3 vWorldNormal;
      varying vec3 vWorldPosition;
      void main() {
        vCityUv = uv;
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;
        vWorldNormal = normalize(mat3(modelMatrix) * normal);
        gl_Position = projectionMatrix * viewMatrix * worldPosition;
      }
    `,
    fragmentShader: `
      uniform sampler2D uMap;
      uniform vec3 uSunDirection;
      uniform vec3 uColor;
      uniform vec3 uHotColor;
      uniform float uIntensity;
      uniform float uDayVisibility;
      uniform float uTerminatorSoftness;
      uniform float uBlackPoint;
      uniform float uWhitePoint;
      uniform float uGamma;
      uniform float uGlowStart;
      uniform float uHotPoint;
      uniform float uLimbStart;
      uniform float uLimbEnd;
      varying vec2 vCityUv;
      varying vec3 vWorldNormal;
      varying vec3 vWorldPosition;
      void main() {
        vec3 normal = normalize(vWorldNormal);
        vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
        float daylight = smoothstep(
          -uTerminatorSoftness,
          uTerminatorSoftness,
          dot(normal, normalize(uSunDirection))
        );
        float viewFacing = clamp(dot(normal, viewDirection), 0.0, 1.0);
        float limbFade = smoothstep(uLimbStart, uLimbEnd, viewFacing);
        float raw = texture2D(uMap, vCityUv, 0.75).r;
        float aa = max(fwidth(raw) * 1.5, 2.0 / 255.0);
        float source = smoothstep(uBlackPoint - aa, uWhitePoint + aa, raw);
        source = pow(clamp(source, 0.0, 1.0), uGamma);
        float visibility = mix(1.0, uDayVisibility, daylight) * limbFade;
        float glowSource = smoothstep(uGlowStart, 1.0, source);
        float energy = glowSource * visibility * uIntensity;
        if (energy < 0.001) discard;
        float hot = smoothstep(uHotPoint, 1.0, source);
        gl_FragColor = vec4(mix(uColor, uHotColor, hot) * energy, 1.0);
      }
    `,
  });
  const cityBloomEmitter = new THREE.Mesh(earth.geometry, cityBloomEmitterMaterial);
  cityBloomEmitter.rotation.copy(earth.rotation);
  cityBloomEmitter.renderOrder = 1;
  borderBloomScene.add(cityBloomEmitter);
  const borderBloomEmitterMaterial = new LineMaterial({
    color: 0xffffff,
    linewidth: 3,
    transparent: false,
    blending: THREE.NoBlending,
    depthTest: true,
    depthWrite: false,
    toneMapped: false,
    alphaToCoverage: true,
  });
  const borderBloomEmitter = new LineSegments2(borderLineGeometry, borderBloomEmitterMaterial);
  borderBloomEmitter.rotation.copy(earth.rotation);
  borderBloomEmitter.renderOrder = 2;
  borderBloomScene.add(borderBloomEmitter);
  const contourSwitcher = createContourSwitcher({
    initial: { id: initialContour.id, resource: initialContourPair },
    load: (id) => loadContourPair(id),
    apply: ({ fill, geometry }) => {
      renderer.initTexture(fill);
      // Fill, visible core and bloom source always switch as one pair.
      earthUniforms.uRussiaMask.value = fill;
      borderCore.geometry = geometry;
      borderBloomEmitter.geometry = geometry;
    },
    release: ({ fill, geometry }) => { fill.dispose(); geometry.dispose(); },
  });

  const borderBloomRenderTarget = new THREE.WebGLRenderTarget(1, 1, {
    type: THREE.HalfFloatType,
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    depthBuffer: true,
    stencilBuffer: false,
  });
  borderBloomRenderTarget.texture.colorSpace = THREE.NoColorSpace;
  borderBloomRenderTarget.texture.name = "XSputnik.borderBloomSource";
  const borderBloomRenderPass = new RenderPass(borderBloomScene, camera, null, 0x000000, 0);
  const borderBloomPass = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.7, 0.42, 0.01);
  const borderBloomComposer = new EffectComposer(renderer, borderBloomRenderTarget);
  borderBloomComposer.setPixelRatio(1);
  borderBloomComposer.renderToScreen = false;
  borderBloomComposer.addPass(borderBloomRenderPass);
  borderBloomComposer.addPass(borderBloomPass);

  const borderGlowOverlayUniforms = {
    uMap: { value: borderBloomComposer.readBuffer.texture },
    uOpacity: { value: 0.42 },
  };
  const borderGlowOverlayGeometry = new THREE.PlaneGeometry(2, 2);
  const borderGlowOverlayMaterial = new THREE.ShaderMaterial({
    uniforms: borderGlowOverlayUniforms,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthTest: false,
    depthWrite: false,
    toneMapped: false,
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position.xy, 0.0, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D uMap;
      uniform float uOpacity;
      varying vec2 vUv;
      void main() {
        vec3 bloomSample = texture2D(uMap, vUv).rgb;
        gl_FragColor = vec4(bloomSample * uOpacity, 1.0);
      }
    `,
  });
  const borderGlowOverlayScene = new THREE.Scene();
  const borderGlowOverlayCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const borderGlowOverlay = new THREE.Mesh(borderGlowOverlayGeometry, borderGlowOverlayMaterial);
  borderGlowOverlay.frustumCulled = false;
  borderGlowOverlayScene.add(borderGlowOverlay);
  let selectiveBloomActive = true;
  let emissiveBloomQuality = "high";
  let emissiveBloomNeedsResize = true;
  const borderBloomDrawingBufferSize = new THREE.Vector2();
  const earthHdrTarget = new THREE.WebGLRenderTarget(1, 1, {
    type: THREE.HalfFloatType,
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    depthBuffer: true,
    stencilBuffer: false,
    samples: resolveWorldMsaaSamples(1, 1, renderer.capabilities.maxSamples),
  });
  earthHdrTarget.texture.colorSpace = THREE.NoColorSpace;
  earthHdrTarget.texture.name = "XSputnik.earthHDR";
  const outputPass = new OutputPass();
  outputPass.renderToScreen = true;

  const atmosphereUniforms = {
    uColor: { value: new THREE.Color() },
    uIntensity: { value: 0.7 },
    uPower: { value: 2.25 },
  };
  const atmosphere = new THREE.Mesh(
    new THREE.SphereGeometry(EARTH_RADIUS * 1.012, EARTH_WIDTH_SEGMENTS, EARTH_HEIGHT_SEGMENTS),
    new THREE.ShaderMaterial({
      uniforms: atmosphereUniforms,
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      depthWrite: false,
      vertexShader: `varying vec3 vNormal; varying vec3 vWorldPosition; void main(){ vNormal=normalize(mat3(modelMatrix)*normal); vec4 world=modelMatrix*vec4(position,1.0); vWorldPosition=world.xyz; gl_Position=projectionMatrix*viewMatrix*world; }`,
      fragmentShader: `
        uniform vec3 uColor;
        uniform float uIntensity;
        uniform float uPower;
        varying vec3 vNormal;
        varying vec3 vWorldPosition;
        void main() {
          vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
          float rim = 1.0 - abs(dot(normalize(vNormal), viewDirection));
          float core = pow(rim, uPower * 1.45);
          float alpha = core * uIntensity * 0.46;
          gl_FragColor = vec4(uColor * (0.7 + core * 0.5), alpha);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }
      `,
    }),
  );
  const atmosphereHaloUniforms = {
    uColor: { value: atmosphereUniforms.uColor.value },
    uIntensity: { value: 0.7 },
    uDiscRadius: { value: 0.78 },
    uInnerFeather: { value: 0.025 },
    uOuterFeather: { value: 0.17 },
    uSunBias: { value: 0.3 },
  };
  const atmosphereHalo = new THREE.Mesh(
    new THREE.PlaneGeometry(EARTH_RADIUS * 2.8, EARTH_RADIUS * 2.8),
    new THREE.ShaderMaterial({
      uniforms: atmosphereHaloUniforms,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthTest: false,
      depthWrite: false,
      toneMapped: false,
      vertexShader: `varying vec2 vHaloUv; void main(){ vHaloUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
      fragmentShader: `
        uniform vec3 uColor;
        uniform float uIntensity;
        uniform float uDiscRadius;
        uniform float uInnerFeather;
        uniform float uOuterFeather;
        uniform float uSunBias;
        varying vec2 vHaloUv;
        void main() {
          float radius = length(vHaloUv - 0.5) * 2.0;
          float radiusDerivative = max(fwidth(radius), 0.0001);
          float seamOverlap = radiusDerivative * 1.5;
          float innerWidth = max(uInnerFeather, radiusDerivative * 2.0);
          float outerWidth = max(uOuterFeather, radiusDerivative * 2.0);
          float innerFade = smoothstep(
            uDiscRadius - innerWidth - seamOverlap,
            uDiscRadius - seamOverlap,
            radius
          );
          float outerFade = 1.0 - smoothstep(
            uDiscRadius + seamOverlap,
            uDiscRadius + outerWidth + seamOverlap,
            radius
          );
          float halo = innerFade * outerFade;
          float lightSide = smoothstep(-0.75, 0.75, (vHaloUv.x - 0.5) * 2.0);
          halo *= mix(1.0, 0.72 + 0.56 * lightSide, uSunBias);
          float alpha = halo * uIntensity * 0.28;
          gl_FragColor = vec4(uColor * halo * 0.72, alpha);
        }
      `,
    }),
  );
  atmosphereHalo.renderOrder = -1;
  scene.add(atmosphereHalo, atmosphere);
  const atmosphereCameraForward = new THREE.Vector3();
  const atmosphereCameraToCenter = new THREE.Vector3();
  const updateEarthStyle = (source = {}) => {
    const style = { ...DEFAULT_EARTH_STYLE, ...source };
    earthUniforms.uDayTint.value.set(style.dayTint);
    earthUniforms.uNightTint.value.set(style.nightTint);
    earthUniforms.uDayIntensity.value = Number(style.dayIntensity);
    earthUniforms.uAmbientIntensity.value = Number(style.ambientIntensity);
    earthUniforms.uSaturation.value = Number(style.saturation);
    earthUniforms.uTextureColorMix.value = Number(style.textureColorMix);
    earthUniforms.uTextureSaturation.value = Number(style.textureSaturation);
    earthUniforms.uSurfaceExposure.value = Number(style.surfaceExposure);
    earthUniforms.uSurfaceGamma.value = Number(style.surfaceGamma);
    earthUniforms.uSurfaceContrast.value = Number(style.surfaceContrast);
    earthUniforms.uOceanColor.value.set(style.oceanColor);
    earthUniforms.uOceanIntensity.value = Number(style.oceanIntensity);
    earthUniforms.uRussiaSurfaceBoost.value = Number(style.russiaSurfaceBoost);
    earthUniforms.uOutsideSurfaceDim.value = Number(style.outsideSurfaceDim);
    earthUniforms.uRussiaMaskFeather.value = Number(style.russiaMaskFeather);
    earthUniforms.uTerminatorSoftness.value = Number(style.terminatorSoftness);
    earthUniforms.uSpecularIntensity.value = Number(style.specularIntensity);
    earthUniforms.uNormalStrength.value = Number(style.normalStrength);
    earthUniforms.uCloudHighlights.value = Number(style.cloudHighlights);
    const cloudBlackPoint = THREE.MathUtils.clamp(Number(style.cloudBlackPoint), 0, 0.999);
    const cloudWhitePoint = THREE.MathUtils.clamp(Math.max(Number(style.cloudWhitePoint), cloudBlackPoint + 0.001), 0.001, 1);
    earthUniforms.uCloudBlackPoint.value = cloudBlackPoint;
    earthUniforms.uCloudWhitePoint.value = cloudWhitePoint;
    earthUniforms.uCloudShadowIntensity.value = Number(style.cloudShadowIntensity);
    cloudUniforms.uColor.value.set(style.cloudColor);
    cloudUniforms.uIntensity.value = Number(style.cloudIntensity);
    cloudUniforms.uOpacity.value = Number(style.cloudOpacity);
    cloudUniforms.uBlackPoint.value = cloudBlackPoint;
    cloudUniforms.uWhitePoint.value = cloudWhitePoint;
    cloudLayer.scale.setScalar((EARTH_RADIUS + Number(style.cloudAltitude)) / EARTH_RADIUS);
    earthUniforms.uHazeColor.value.set(style.hazeColor);
    earthUniforms.uHazeIntensity.value = Number(style.hazeIntensity);
    earthUniforms.uHazePower.value = Number(style.hazePower);
    const cityBlackPoint = THREE.MathUtils.clamp(Number(style.cityLightsBlackPoint), 0, 0.999);
    const cityWhitePoint = THREE.MathUtils.clamp(Math.max(Number(style.cityLightsWhitePoint), cityBlackPoint + 0.001), 0.001, 1);
    const cityLimbStart = THREE.MathUtils.clamp(Number(style.cityLightsLimbStart), 0, 0.999);
    const cityLimbEnd = THREE.MathUtils.clamp(Math.max(Number(style.cityLightsLimbEnd), cityLimbStart + 0.001), 0.001, 1);
    earthUniforms.uCityColor.value.set(style.cityLightsColor);
    earthUniforms.uCityHotColor.value.set(style.cityLightsHotColor);
    earthUniforms.uCityIntensity.value = Number(style.cityLightsIntensity);
    earthUniforms.uCityHotIntensity.value = Number(style.cityLightsHotIntensity);
    earthUniforms.uCityCoreStart.value = Number(style.cityLightsCoreStart);
    earthUniforms.uCityDayVisibility.value = Number(style.cityLightsDayVisibility);
    earthUniforms.uCityBlackPoint.value = cityBlackPoint;
    earthUniforms.uCityWhitePoint.value = cityWhitePoint;
    earthUniforms.uCityGamma.value = Number(style.cityLightsGamma);
    earthUniforms.uCityHotPoint.value = Number(style.cityLightsHotPoint);
    earthUniforms.uCityLimbStart.value = cityLimbStart;
    earthUniforms.uCityLimbEnd.value = cityLimbEnd;
    cityBloomUniforms.uIntensity.value = Number(style.cityLightsGlowIntensity);
    cityBloomUniforms.uDayVisibility.value = Number(style.cityLightsDayVisibility);
    cityBloomUniforms.uTerminatorSoftness.value = Number(style.terminatorSoftness);
    cityBloomUniforms.uBlackPoint.value = cityBlackPoint;
    cityBloomUniforms.uWhitePoint.value = cityWhitePoint;
    cityBloomUniforms.uGamma.value = Number(style.cityLightsGamma);
    cityBloomUniforms.uGlowStart.value = Number(style.cityLightsGlowStart);
    cityBloomUniforms.uHotPoint.value = Number(style.cityLightsHotPoint);
    cityBloomUniforms.uLimbStart.value = cityLimbStart;
    cityBloomUniforms.uLimbEnd.value = cityLimbEnd;
    const borderIntensity = Number(style.borderIntensity);
    const borderGlowIntensity = Number(style.borderGlowIntensity);
    const borderCoreWidth = Number(style.borderCoreWidth);
    const cityGlowIntensity = Number(style.cityLightsGlowIntensity);
    const bloomRadius = Number(style.emissiveBloomRadius);
    const bloomStrength = Number(style.emissiveBloomStrength);
    if (emissiveBloomQuality !== style.emissiveBloomQuality) emissiveBloomNeedsResize = true;
    emissiveBloomQuality = style.emissiveBloomQuality;
    const bloomAllowed = emissiveBloomQuality !== "off" && bloomRadius > 0.001 && bloomStrength > 0.001;
    const borderBloomEnabled = bloomAllowed && borderIntensity > 0.001 && borderGlowIntensity > 0.001;
    const cityBloomEnabled = bloomAllowed && cityGlowIntensity > 0.001;
    borderGlowTint.set(style.borderColor);
    borderCoreMaterial.color.copy(borderGlowTint).lerp(borderCoreWhite, 0.94).multiplyScalar(Number(style.borderCoreIntensity));
    borderCoreMaterial.linewidth = borderCoreWidth;
    borderCoreMaterial.opacity = Math.min(1, borderIntensity);
    borderBloomEmitterMaterial.linewidth = Math.max(2.5, borderCoreWidth + 1);
    borderBloomEmitterMaterial.color
      .copy(borderGlowTint)
      .lerp(borderCoreWhite, 0.55)
      .multiplyScalar(Math.min(2, borderIntensity * borderGlowIntensity));
    borderBloomEmitter.visible = borderBloomEnabled;
    cityBloomEmitter.visible = cityBloomEnabled;
    borderBloomPass.strength = 1;
    borderBloomPass.radius = THREE.MathUtils.clamp(bloomRadius / 64, 0, 1);
    borderGlowOverlayUniforms.uOpacity.value = bloomStrength;
    selectiveBloomActive = borderBloomEnabled || cityBloomEnabled;
    atmosphereUniforms.uColor.value.set(style.atmosphereColor);
    atmosphereUniforms.uIntensity.value = Number(style.atmosphereIntensity);
    atmosphereUniforms.uPower.value = Number(style.atmospherePower);
    atmosphereHaloUniforms.uIntensity.value = Number(style.atmosphereIntensity);
    atmosphereHaloUniforms.uInnerFeather.value = Number(style.atmosphereInnerFeather);
    atmosphereHaloUniforms.uOuterFeather.value = Number(style.atmosphereOuterFeather);
    atmosphereHaloUniforms.uSunBias.value = Number(style.atmosphereSunBias);
  };
  updateEarthStyle(earthStyle);
  const stars = createStars();
  scene.add(stars);

  const nodeLayer = new THREE.Group();
  const linkLayer = new THREE.Group();
  const endpointLayer = new THREE.Group();
  const missionMarkerLayer = new THREE.Group();
  const satelliteDragGuide = createSatelliteDragGuide();
  // Gameplay markers are the foreground of the same WebGL world. Rendering
  // them after the Earth border keeps that border below their translucent
  // backdrops, matching the visual stacking of the DOM mission cards.
  const gameplayForegroundScene = new THREE.Scene();
  gameplayForegroundScene.add(
    linkLayer,
    missionMarkerLayer,
    nodeLayer,
    endpointLayer,
    satelliteDragGuide.group,
  );
  const gameplayOcclusionScene = new THREE.Scene();
  const gameplayOcclusionMaterial = new THREE.MeshBasicMaterial({
    colorWrite: false,
    depthTest: true,
    depthWrite: true,
  });
  const gameplayOcclusionEarth = new THREE.Mesh(earth.geometry, gameplayOcclusionMaterial);
  gameplayOcclusionEarth.rotation.copy(earth.rotation);
  gameplayOcclusionScene.add(gameplayOcclusionEarth);
  const missionMarkersById = new Map();
  const missionMenuReveal = new MissionMenuReveal();
  let onMissionBasesPresence = null;
  let previousMissionBasesPresence = -1;
  const syncMissionSurfaceMarkers = (markers = []) => {
    const desiredIds = new Set(markers.map((marker) => String(marker.id)));
    for (const [id, group] of missionMarkersById) {
      if (desiredIds.has(id)) continue;
      missionMarkerLayer.remove(group);
      disposeObject(group);
      missionMarkersById.delete(id);
    }
    for (const marker of markers) {
      const id = String(marker.id);
      let group = missionMarkersById.get(id);
      if (!group) {
        group = createMissionSurfaceAnchor();
        missionMarkersById.set(id, group);
        missionMarkerLayer.add(group);
      }
      const frame = missionMarkerFrame(marker);
      group.position.copy(frame.anchorPosition);
      group.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), frame.surfaceNormal);
      setMissionSurfaceAnchorStatus(group, marker.status, marker.active);
      applyMissionSurfaceReveal(group, missionMenuReveal.bases, missionMenuReveal.waves);
    }
  };
  let screenConnections = false, hybridConnections = false;
  const endpointGroupsByLabel = new Map();
  let endpointKey = "";
  const syncEndpoints = (nextEndpoints = {}) => {
    const nextKey = JSON.stringify([nextEndpoints, screenConnections, hybridConnections, SCREEN_APPEARANCE, Object.values(nextEndpoints).map(pointIconSource), OBJECT_SETTINGS["endpoint:A"].size, OBJECT_SETTINGS["endpoint:B"].size]);
    if (nextKey === endpointKey) return;
    endpointKey = nextKey;
    for (const group of endpointGroupsByLabel.values()) {
      group.userData.removing = true;
      group.userData.targetPresence = 0;
    }
    endpointGroupsByLabel.clear();
    for (const [key, endpoint] of Object.entries(nextEndpoints)) {
      const customIcon = pointIconSource(endpoint);
      const group = addEndpoint(
        endpointLayer,
        geometryFor(customIcon, true),
        endpoint.latitude,
        endpoint.longitude,
        endpoint.size ?? (OBJECT_SETTINGS[`endpoint:${key}`] || OBJECT_SETTINGS["endpoint:A"]).size,
        nodeIconBackdropStyle,
      );
      group.userData.signalRadius = signalRadiusFor(endpoint, OBJECT_SETTINGS[`endpoint:${key}`] ? `endpoint:${key}` : "endpoint:A");
      group.userData.connectionId = `endpoint:${key}`;
      group.userData.appearanceType = OBJECT_SETTINGS[`endpoint:${key}`] ? `endpoint:${key}` : "endpoint:A";
      group.userData.baseSize = group.scale.x;
      group.userData.baseSignalRadius = group.userData.signalRadius;
      applyEndpointAppearance(group, screenConnections && !hybridConnections);
      endpointGroupsByLabel.set(key, group);
    }
  };
  syncEndpoints(endpoints);

  const nodeMeshes = [];
  const pruneIconCache = () => {
    const used = new Set();
    for (const layer of [nodeLayer, endpointLayer]) layer.traverse((object) => { if (object.geometry) used.add(object.geometry); });
    for (const [key, geometry] of iconGeometries) {
      if (pinnedIconKeys.has(key) || key.startsWith("./icons/") || used.has(geometry)) continue;
      geometry.dispose(); iconGeometries.delete(key);
    }
  };
  const nodesById = new Map();
  const linksByKey = new Map();
  let currentSelectedItem = selectedItem;
  let tapControls = false;
  let selectedPlacementId = null;
  let draggedNode = null;
  let movePreviewPending = false;
  let hoveredHitTarget = null;

  const rebuildNodeHitTargets = () => {
    nodeMeshes.length = 0;
    for (const group of nodesById.values()) {
      if (!group.userData.removing) nodeMeshes.push(...(tapControls ? group.userData.surfaceHitTargets : group.userData.hitTargets));
    }
  };
  const syncNodes = (nextPlacements, nextNetwork) => {
    const desiredIds = new Set(nextPlacements.map((placement) => placement.id));
    for (const [id, group] of nodesById) {
      if (desiredIds.has(id)) continue;
      if (draggedNode?.id === id) {
        draggedNode = null;
        satelliteDragGuide.group.visible = false;
      }
      group.userData.removing = true;
      group.userData.targetPresence = 0;
    }

    for (const placement of nextPlacements) {
      let group = nodesById.get(placement.id);
      if (group && group.userData.isOrbital !== isOrbitalType(placement.type)) {
        nodeLayer.remove(group); disposeObject(group); group = null;
      }
      if (!group) {
        const item = ITEM_TYPES[placement.type];
        group = createNode(placement, nextNetwork.states[placement.id], geometryFor(item.icon), nodeIconBackdropStyle);
        nodesById.set(placement.id, group);
        nodeLayer.add(group);
      }
      setNodeScreenConnections(group, screenConnections, hybridConnections);
      if (tapControls && group.userData.altitudeHandle) group.userData.altitudeHandle.group.visible = false;
      group.userData.icon.geometry = geometryFor(ITEM_TYPES[placement.type].icon);
      group.userData.removing = false;
      group.userData.targetPresence = 1;

      const handle = group.userData.placement;
      Object.assign(handle, placement);
      handle.placementBlocked = placement.placementBlocked || null;
      handle.group = group;
      if (draggedNode?.id !== placement.id) {
        handle.preview = null;
        updateNodeTransform(group, placement);
      }
      group.userData.targetVisual = nodeVisualTarget(placement.placementBlocked ? "wrong" : nextNetwork.states[placement.id]);
      setNodeAnchorSelected(group, tapControls && placement.id === selectedPlacementId);
    }

    rebuildNodeHitTargets();
  };

  const syncLinks = (nextPlacements, nextNetwork, nextEndpoints = {}) => {
    const desiredKeys = new Set();
    const resolveLinkGroup = (id) => typeof id === "string" && id.startsWith("endpoint:")
      ? endpointGroupsByLabel.get(id.slice("endpoint:".length))
      : nodesById.get(id);

    for (const [index, link] of nextNetwork.links.entries()) {
      if (!resolveLinkGroup(link.a) || !resolveLinkGroup(link.b)) continue;
      const key = linkKey(link.a, link.b);
      desiredKeys.add(key);
      const color = signalLinkColor(nextNetwork.states[link.a], nextNetwork.states[link.b], link.closing === true && link.correct === true);
      let entry = linksByKey.get(key);
      if (!entry) {
        entry = createSignalLinkVisual(color, index, signalLinkStyle);
        linkLayer.add(entry.group);
        linksByKey.set(key, entry);
      }
      entry.firstId = link.a;
      entry.secondId = link.b;
      entry.screen = link.screen === true;
      entry.surface = link.surface === true && !entry.screen;
      for (const material of entry.strandMaterials) material.depthTest = !entry.screen;
      entry.particleMaterial.depthTest = !entry.screen;
      entry.offset = index * 0.23;
      entry.targetColor.set(color);
      entry.removing = false;
    }

    for (const [key, entry] of linksByKey) {
      if (!desiredKeys.has(key)) entry.removing = true;
    }
  };

  const syncDynamic = (nextPlacements, nextNetwork, nextEndpoints = {}) => {
    syncNodes(nextPlacements, nextNetwork);
    syncLinks(nextPlacements, nextNetwork, nextEndpoints);
  };

  syncDynamic(placements, network, endpoints);

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let controls = null;
  let pointerStart = null;
  let moved = false;

  const updatePointer = (clientX, clientY) => {
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    return rect;
  };

  const geoFromPointer = (clientX, clientY, type, referenceGeo = null, altitudeOverride = null) => {
    const rect = updatePointer(clientX, clientY);
    if (clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom) return null;
    const altitude = isOrbitalType(type) ? altitudeOverride ?? altitudeSettingsFor(type).defaultAltitude : GROUND_ALTITUDE;
    const referencePosition = isOrbitalType(type) && referenceGeo ? geoToSceneVector(referenceGeo) : null;
    const hit = intersectSphereContinuously(raycaster.ray, EARTH_RADIUS + altitude, referencePosition);
    return hit ? vectorToGeo(hit.clone().applyQuaternion(INVERSE_GEO_TO_SCENE_QUATERNION), altitude) : null;
  };

  const satelliteSurfaceGeoFromPointer = (clientX, clientY, placement) => {
    const rect = renderer.domElement.getBoundingClientRect();
    const marginX = rect.width * SATELLITE_DRAG_MARGIN;
    const marginY = rect.height * SATELLITE_DRAG_MARGIN;
    const safeX = THREE.MathUtils.clamp(clientX, rect.left + marginX, rect.right - marginX);
    const safeY = THREE.MathUtils.clamp(clientY, rect.top + marginY, rect.bottom - marginY);
    updatePointer(safeX, safeY);
    const altitude = THREE.MathUtils.clamp(
      Number(placement.dragStartGeo?.altitude ?? placement.altitude ?? ORBIT_ALTITUDE),
      altitudeSettingsFor(placement.type).minAltitude,
      altitudeSettingsFor(placement.type).maxAltitude,
    );
    const referenceGeo = placement.preview || placement.dragStartGeo || placement;
    const referencePosition = geoToSceneVector(referenceGeo);
    const hit = intersectVisibleSphereContinuously(
      raycaster.ray,
      EARTH_RADIUS + altitude,
      camera.position,
      referencePosition,
    );
    // At the silhouette or behind Earth keep the last visible orbital point.
    // An out-of-canvas release is still rejected by dragGeoFromPointer.
    if (!hit) return satellitePositionIsVisible(referencePosition, camera.position) ? referenceGeo : null;
    return vectorToGeo(hit.clone().applyQuaternion(INVERSE_GEO_TO_SCENE_QUATERNION), altitude);
  };

  const satelliteAltitudeGeoFromPointer = (clientY, placement) => {
    const rect = renderer.domElement.getBoundingClientRect();
    const startGeo = placement.dragStartGeo || placement;
    return {
      latitude: startGeo.latitude,
      longitude: startGeo.longitude,
      altitude: satelliteAltitudeFromPointer(
        startGeo.altitude ?? ORBIT_ALTITUDE,
        placement.dragStartPointer?.y ?? clientY,
        clientY,
        rect.height,
        altitudeSettingsFor(placement.type),
      ),
    };
  };

  const setHoveredHitTarget = (hitTarget, force = false) => {
    if (!force && hoveredHitTarget === hitTarget) return;
    hoveredHitTarget = hitTarget;
    for (const group of nodesById.values()) {
      const handle = group.userData.altitudeHandle;
      const active = hitTarget?.userData.placement?.group === group || draggedNode?.group === group
        || tapControls && group.userData.placement.id === selectedPlacementId;
      group.userData.targetInteraction = active ? 1 : 0;
      setNodeAnchorSelected(group, tapControls && group.userData.placement.id === selectedPlacementId);
      if (handle) setSatelliteAltitudeHandleActive(handle, hitTarget === handle.hitTarget || draggedNode?.dragMode === "altitude" && draggedNode.group === group);
    }
    renderer.domElement.style.cursor = tapControls ? hitTarget ? "pointer" : currentSelectedItem || selectedPlacementId != null ? "crosshair" : "default" : hitTarget
      ? hitTarget.userData.dragMode === "altitude" ? "ns-resize" : "grab"
      : currentSelectedItem ? "crosshair" : "default";
  };

  const onPointerDown = (event) => {
    if (event.isPrimary === false) { if (pointerStart) pointerStart.multitouch = true; return; }
    if (pointerStart) { if (event.pointerId !== pointerStart.pointerId) pointerStart.multitouch = true; return; }
    if (event.button !== 0 || (freeOrbit && (event.altKey || event.shiftKey))) return;
    const rect = updatePointer(event.clientX, event.clientY);
    const hit = raycaster.intersectObjects(nodeMeshes, false)[0];
    pointerStart = { x: event.clientX, y: event.clientY, pointerId: event.pointerId, item: currentSelectedItem };
    moved = false;
    if (tapControls) {
      // CSS pixels, independent of render resolution. Finger/pen jitter gets a
      // larger allowance; both camera and object input share this exact token.
      pointerStart.slopPx = TAP_SLOP_PX * (["touch", "pen"].includes(event.pointerType) ? 2 : 1);
      pointerStart.swiped = false;
      controls.tapGesture = pointerStart;
      pointerStart.selectedPlacementId = selectedPlacementId;
      pointerStart.hitId = hit?.object.userData.placement.id ?? null;
      renderer.domElement.setPointerCapture?.(event.pointerId);
      // Let SoftOrbitControls receive this gesture: a slide rotates Earth,
      // while the short-tap release below selects or relocates equipment.
      return;
    }
    if (!hit) return;
    draggedNode = hit.object.userData.placement;
    draggedNode.dragMode = hit.object.userData.dragMode || "surface";
    draggedNode.preview = null;
    draggedNode.dragStartGeo = {
      latitude: draggedNode.latitude,
      longitude: draggedNode.longitude,
      altitude: draggedNode.altitude ?? ORBIT_ALTITUDE,
    };
    draggedNode.dragOriginGeo = { ...draggedNode.dragStartGeo };
    draggedNode.dragStartPointer = { x: event.clientX, y: event.clientY };
    const projectedAnchor = draggedNode.group.position.clone().project(camera);
    const anchorClientX = rect.left + (projectedAnchor.x + 1) * 0.5 * rect.width;
    const anchorClientY = rect.top + (1 - projectedAnchor.y) * 0.5 * rect.height;
    draggedNode.grabOffset = {
      x: event.clientX - anchorClientX,
      y: event.clientY - anchorClientY,
    };
    if (isOrbitalType(draggedNode.type) && !screenConnections) {
      satelliteDragGuide.group.visible = true;
      updateSatelliteDragGuide(satelliteDragGuide, draggedNode.group.position);
    }
    setHoveredHitTarget(hit.object);
    controls.enabled = false;
    renderer.domElement.setPointerCapture?.(event.pointerId);
    event.stopImmediatePropagation();
    event.preventDefault();
  };
  const dragGeoFromPointer = (event, node) => {
    const rect = renderer.domElement.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) return null;
    const anchorPointer = dragAnchorPointer(event.clientX, event.clientY, node.grabOffset);
    return isOrbitalType(node.type)
      ? node.dragMode === "altitude" && !screenConnections
        ? satelliteAltitudeGeoFromPointer(event.clientY, node)
        : satelliteSurfaceGeoFromPointer(anchorPointer.x, anchorPointer.y, node)
      : geoFromPointer(anchorPointer.x, anchorPointer.y, node.type, node.preview || node);
  };
  const onPointerMove = (event) => {
    if (!pointerStart) {
      updatePointer(event.clientX, event.clientY);
      setHoveredHitTarget(raycaster.intersectObjects(nodeMeshes, false)[0]?.object || null);
      return;
    }
    if (event.pointerId !== pointerStart.pointerId) return;
    moved ||= Math.hypot(event.clientX - pointerStart.x, event.clientY - pointerStart.y) > (pointerStart.slopPx ?? TAP_SLOP_PX);
    if (tapControls) pointerStart.swiped = moved;
    if (!draggedNode) return;
    const geo = dragGeoFromPointer(event, draggedNode);
    draggedNode.placementBlocked = geo ? placementRejection(draggedNode.type, geo) : "outside";
    renderer.domElement.style.cursor = draggedNode.placementBlocked ? "not-allowed" : "grabbing";
    if (!geo) return;
    draggedNode.preview = geo;
    movePreviewPending = true;
    updateNodeTransform(draggedNode.group, geo);
    if (isOrbitalType(draggedNode.type) && !screenConnections) updateSatelliteDragGuide(satelliteDragGuide, draggedNode.group.position);
    event.stopImmediatePropagation();
  };
  const finishNodeDrag = (event, cancelled = false) => {
    if (!pointerStart || event.pointerId !== pointerStart.pointerId) return;
    if (tapControls) {
      const start = pointerStart;
      pointerStart = null;
      if (renderer.domElement.hasPointerCapture?.(event.pointerId)) renderer.domElement.releasePointerCapture(event.pointerId);
      if (!isCanvasTap(start, event, { moved, cancelled, rect: renderer.domElement.getBoundingClientRect() })
        || document.elementFromPoint(event.clientX, event.clientY) !== renderer.domElement
        || start.item !== currentSelectedItem || start.selectedPlacementId !== selectedPlacementId) return;
      updatePointer(event.clientX, event.clientY);
      const hitId = raycaster.intersectObjects(nodeMeshes, false)[0]?.object.userData.placement.id ?? null;
      if (hitId !== start.hitId) return;
      if (hitId != null) { onSelectPlacement?.(hitId); return; }
      const selectedNode = selectedPlacementId == null ? null : nodesById.get(selectedPlacementId)?.userData.placement;
      const item = selectedNode?.type || currentSelectedItem;
      if (!item) return;
      const geo = geoFromPointer(event.clientX, event.clientY, item, null, selectedNode?.altitude ?? null);
      if (!geo) return;
      if (selectedNode) onMove(selectedNode.id, geo);
      else onPlace(item, geo);
      return;
    }
    const activeNode = draggedNode;
    // Recompute at release: never commit a stale last-valid preview.
    const candidate = !cancelled && activeNode && (moved || activeNode.preview) ? dragGeoFromPointer(event, activeNode) : null;
    movePreviewPending = false;
    draggedNode = null;
    if (renderer.domElement.hasPointerCapture?.(event.pointerId)) renderer.domElement.releasePointerCapture(event.pointerId);
    if (controls) controls.enabled = true;
    if (activeNode) {
      // Restore first. A rejected reducer action may return the same run and
      // otherwise leave the mesh stranded in its transient drag position.
      updateNodeTransform(activeNode.group, activeNode.dragOriginGeo);
      activeNode.preview = null;
      activeNode.placementBlocked = null;
      activeNode.group.userData.icon.material.color.setHex(0xffffff);
      if (candidate) onMove(activeNode.id, candidate);
      else onMoveCancel?.(activeNode.id);
    } else if (isPlacementTap(pointerStart, event, { moved, cancelled, item: currentSelectedItem, rect: renderer.domElement.getBoundingClientRect() })
      && document.elementFromPoint(event.clientX, event.clientY) === renderer.domElement) {
      const geo = geoFromPointer(event.clientX, event.clientY, currentSelectedItem);
      if (geo) onPlace(currentSelectedItem, geo);
    }
    pointerStart = null;
    satelliteDragGuide.group.visible = false;
    if (activeNode) {
      activeNode.dragMode = null;
      activeNode.dragStartGeo = null;
      activeNode.dragStartPointer = null;
      activeNode.dragOriginGeo = null;
    }
    setHoveredHitTarget(null);
  };
  const onPointerUp = (event) => finishNodeDrag(event);
  const onPointerCancel = (event) => finishNodeDrag(event, true);
  const onPointerLeave = () => {
    if (!pointerStart) setHoveredHitTarget(null);
  };
  const onWheel = (event) => {
    if (screenConnections || !draggedNode || !isOrbitalType(draggedNode.type) || draggedNode.dragMode === "altitude") return;
    const currentGeo = draggedNode.preview || draggedNode.dragStartGeo || draggedNode;
    const altitude = THREE.MathUtils.clamp(
      (currentGeo.altitude ?? ORBIT_ALTITUDE) - event.deltaY * 0.0015,
      altitudeSettingsFor(draggedNode.type).minAltitude,
      altitudeSettingsFor(draggedNode.type).maxAltitude,
    );
    const geo = { latitude: currentGeo.latitude, longitude: currentGeo.longitude, altitude };
    draggedNode.dragStartGeo.altitude = altitude;
    draggedNode.preview = geo;
    movePreviewPending = true;
    updateNodeTransform(draggedNode.group, geo);
    updateSatelliteDragGuide(satelliteDragGuide, draggedNode.group.position);
    event.preventDefault();
  };
  const onDoubleClick = (event) => {
    if (tapControls) return;
    updatePointer(event.clientX, event.clientY);
    const hit = raycaster.intersectObjects(nodeMeshes, false)[0];
    if (hit) onRemove(hit.object.userData.placement.id);
  };
  renderer.domElement.addEventListener("pointerdown", onPointerDown);
  renderer.domElement.addEventListener("pointermove", onPointerMove);
  renderer.domElement.addEventListener("pointerup", onPointerUp);
  renderer.domElement.addEventListener("pointercancel", onPointerCancel);
  renderer.domElement.addEventListener("pointerleave", onPointerLeave);
  renderer.domElement.addEventListener("wheel", onWheel, { passive: false });
  renderer.domElement.addEventListener("dblclick", onDoubleClick);

  const orbitTarget = new THREE.Vector3().fromArray(REFERENCE_CAMERA.target);
  if (initialView?.target?.length === 3) orbitTarget.fromArray(initialView.target);
  const orbitPreferences = resolveEarthOrbitPreferences(earthOrbit);
  controls = new SoftOrbitControls(
    camera,
    renderer.domElement,
    orbitTarget,
    {
      west: orbitPreferences.west,
      east: orbitPreferences.east,
      north: orbitPreferences.north,
      south: orbitPreferences.south,
      centerRussia: orbitPreferences.centerRussia,
      verticalCenteringPx: orbitPreferences.verticalCenteringPx,
      freeOrbit,
      preciseOrbit,
      minRadius: 4,
      maxRadius: 14,
    },
    cameraIdleMotion,
    reducedMotionQuery,
    onOrbitGestureStart,
  );
  if (initialView) controls.setViewState(freeOrbit ? { ...initialView, exact: true } : initialView, true);

  const connectionProjector = new ConnectionProjector(EARTH_RADIUS);
  const connectionSize = new THREE.Vector2();
  let connectionEndpoints = null, connectionEndpointEntries = [];
  const clock = new THREE.Clock();
  let elapsed = 0;
  let animationFrame = 0;
  const animate = () => {
    animationFrame = requestAnimationFrame(animate);
    const delta = Math.min(clock.getDelta(), 0.05);
    elapsed += delta;
    if (movePreviewPending && draggedNode?.preview && onMovePreview) {
      movePreviewPending = false;
      onMovePreview(draggedNode.id, draggedNode.preview);
    }
    controls.update(delta);
    updatePresentationOffset(performance.now());
    applyPresentationOffset();
    onConnectionFrame?.();
    atmosphereHalo.quaternion.copy(camera.quaternion);
    stars.rotation.y += delta * 0.0035;
    stars.rotation.x = Math.sin(elapsed * 0.035) * 0.008;
    const finishedNodes = [];
    for (const group of nodeLayer.children) {
      const { billboard, material, icon, altitudeHandle, visual, targetVisual } = group.userData;
      billboard.quaternion.copy(camera.quaternion);
      updateConnectionContour(group, group.userData.screenConnections && connectionProjector.snapshot.nodes[group.userData.placement.id]?.eligible, camera.quaternion);
      group.userData.presence = THREE.MathUtils.damp(group.userData.presence, group.userData.targetPresence, NODE_TRANSITION_RATE, delta);
      group.userData.interaction = THREE.MathUtils.damp(group.userData.interaction, group.userData.targetInteraction, NODE_TRANSITION_RATE * 1.35, delta);
      visual.signal = THREE.MathUtils.damp(visual.signal, targetVisual.signal, NODE_TRANSITION_RATE, delta);
      visual.linked = THREE.MathUtils.damp(visual.linked, targetVisual.linked, NODE_TRANSITION_RATE, delta);
      visual.wrong = THREE.MathUtils.damp(visual.wrong, targetVisual.wrong, NODE_TRANSITION_RATE, delta);
      material.uniforms.uTime.value = elapsed;
      material.uniforms.uSignal.value = visual.signal;
      material.uniforms.uLinked.value = visual.linked;
      const placementBlocked = Boolean(group.userData.placement.placementBlocked);
      material.uniforms.uWrong.value = placementBlocked ? 1 : visual.wrong;
      icon.material.color.setHex(placementBlocked ? 0xff8588 : 0xffffff);
      material.uniforms.uPresence.value = group.userData.presence;
      icon.material.opacity = group.userData.presence;
      applyMaterialPresence(group.userData.supportMaterials, group.userData.presence);
      updateNodeSelection(group, delta, reducedMotionQuery.matches);
      const interactionScale = group.userData.presence * (1 + group.userData.interaction * 0.055);
      billboard.scale.setScalar(interactionScale);
      if (altitudeHandle) updateSatelliteAltitudeHandleMotion(altitudeHandle, delta, group.userData.presence);
      if (group.userData.removing && group.userData.presence < 0.008) finishedNodes.push(group);
    }
    for (const group of missionMarkersById.values()) {
      const material = group.userData.broadcastMaterial;
      if (group.userData.broadcastPlate?.visible && material) {
        material.uniforms.uTime.value = reducedMotionQuery.matches ? 0 : elapsed;
      }
    }
    for (const group of finishedNodes) {
      nodeLayer.remove(group);
      nodesById.delete(group.userData.placement.id);
      disposeObject(group);
    }
    const finishedEndpoints = [];
    for (const group of endpointLayer.children) {
      group.userData.billboard.quaternion.copy(camera.quaternion);
      updateConnectionContour(group, controls.screenConnections && !hybridConnections && connectionProjector.snapshot.nodes[group.userData.connectionId]?.eligible, camera.quaternion);
      group.userData.presence = THREE.MathUtils.damp(group.userData.presence, group.userData.targetPresence, NODE_TRANSITION_RATE, delta);
      applyMaterialPresence(group.userData.visualMaterials, group.userData.presence);
      if (group.userData.removing && group.userData.presence < 0.008) finishedEndpoints.push(group);
    }
    for (const group of finishedEndpoints) {
      endpointLayer.remove(group);
      disposeObject(group);
    }
    if (finishedNodes.length || finishedEndpoints.length) pruneIconCache();
    const finishedLinks = [];
    const colorBlend = 1 - Math.exp(-NODE_TRANSITION_RATE * delta);
    for (const [key, entry] of linksByKey) {
      const firstGroup = resolveVisualLinkGroup(entry.firstId, nodesById, endpointGroupsByLabel);
      const secondGroup = resolveVisualLinkGroup(entry.secondId, nodesById, endpointGroupsByLabel);
      if (!firstGroup || !secondGroup) entry.removing = true;
      entry.opacity = THREE.MathUtils.damp(entry.opacity, entry.removing ? 0 : 1, NODE_TRANSITION_RATE, delta);
      if (firstGroup && secondGroup) {
        iconLinkAnchor(firstGroup.position, firstGroup.userData.stemHeight || 0, camera.quaternion, entry.startAnchor);
        iconLinkAnchor(secondGroup.position, secondGroup.userData.stemHeight || 0, camera.quaternion, entry.endAnchor);
        updateSignalLinkVisual(entry, firstGroup.position, secondGroup.position, camera, reducedMotionQuery.matches ? 0 : elapsed);
      }
      for (let index = 0; index < entry.strandMaterials.length; index += 1) {
        const material = entry.strandMaterials[index];
        material.opacity = entry.opacity * (index === entry.centerStrand ? 0.64 : 0.34);
        material.color.lerp(entry.targetColor, colorBlend);
      }
      entry.particleMaterial.uniforms.uOpacity.value = entry.opacity * 0.96;
      entry.particleMaterial.uniforms.uColor.value.lerp(entry.targetColor, colorBlend);
      if (entry.removing && entry.opacity < 0.005) finishedLinks.push(key);
    }
    for (const key of finishedLinks) {
      const entry = linksByKey.get(key);
      linkLayer.remove(entry.group);
      disposeObject(entry.group);
      linksByKey.delete(key);
    }
    missionMenuReveal.update(delta * 1000, nodeLayer.children.length === 0 && endpointLayer.children.length === 0 && linksByKey.size === 0, reducedMotionQuery.matches);
    for (const group of missionMarkersById.values()) applyMissionSurfaceReveal(group, missionMenuReveal.bases, missionMenuReveal.waves);
    if (previousMissionBasesPresence !== missionMenuReveal.bases) {
      previousMissionBasesPresence = missionMenuReveal.bases;
      onMissionBasesPresence?.(missionMenuReveal.bases);
    }
    atmosphereHalo.quaternion.copy(camera.quaternion);
    camera.getWorldDirection(atmosphereCameraForward);
    const atmospherePlaneDepth = atmosphereCameraToCenter
      .copy(atmosphereHalo.position)
      .sub(camera.position)
      .dot(atmosphereCameraForward);
    atmosphereHaloUniforms.uDiscRadius.value = projectedEarthDiscRadius(
      camera.position.distanceTo(atmosphereHalo.position),
      EARTH_RADIUS,
      EARTH_RADIUS * 1.4,
      atmospherePlaneDepth,
    );
    if (emissiveBloomNeedsResize) {
      renderer.getDrawingBufferSize(borderBloomDrawingBufferSize);
      const bloomSize = resolveEmissiveBloomSize(borderBloomDrawingBufferSize.x, borderBloomDrawingBufferSize.y, emissiveBloomQuality);
      borderBloomComposer.setSize(bloomSize.width, bloomSize.height);
      emissiveBloomNeedsResize = false;
    }
    renderFrame(delta);
  };

  const renderFrame = (delta = 0) => {
    if (selectiveBloomActive) borderBloomComposer.render(delta);
    renderer.setRenderTarget(earthHdrTarget);
    renderer.clear();
    renderer.render(scene, camera);
    const previousAutoClear = renderer.autoClear;
    renderer.autoClear = false;
    if (selectiveBloomActive) renderer.render(borderGlowOverlayScene, borderGlowOverlayCamera);
    renderer.setRenderTarget(null);
    outputPass.render(renderer, null, earthHdrTarget, delta, false);
    renderer.clearDepth();
    renderer.render(gameplayOcclusionScene, camera);
    renderer.render(gameplayForegroundScene, camera);
    renderer.autoClear = previousAutoClear;
  };

  const resize = () => {
    const width = Math.max(1, container.clientWidth);
    const height = Math.max(1, container.clientHeight);
    const rect = renderer.domElement.getBoundingClientRect();
    const pixelRatio = resolveRenderPixelRatio(
      width,
      height,
      rect.width,
      rect.height,
      window.devicePixelRatio || 1,
      maxDrawingBufferPixels,
    );
    renderer.setDrawingBufferSize(width, height, pixelRatio);
    renderer.getDrawingBufferSize(borderBloomDrawingBufferSize);
    const borderBloomSize = resolveEmissiveBloomSize(borderBloomDrawingBufferSize.x, borderBloomDrawingBufferSize.y, emissiveBloomQuality);
    borderBloomComposer.setSize(borderBloomSize.width, borderBloomSize.height);
    emissiveBloomNeedsResize = false;
    earthHdrTarget.samples = resolveWorldMsaaSamples(
      borderBloomDrawingBufferSize.x,
      borderBloomDrawingBufferSize.y,
      renderer.capabilities.maxSamples,
    );
    earthHdrTarget.setSize(borderBloomDrawingBufferSize.x, borderBloomDrawingBufferSize.y);
    camera.aspect = width / height;
    appliedProjectionWidth = 0;
    applyPresentationOffset();
  };

  const applyPresentationOffset = () => {
    const width = Math.max(1, container.clientWidth);
    const height = Math.max(1, container.clientHeight);
    let offsetX = -presentationOffset.current.x;
    const pitchOffset = controls?.centerRussia
      ? verticalCenteringOffset(controls?.pitch - controls?.pitchCenter, controls.limits.south, controls.limits.north, controls.verticalCenteringPx)
      : 0;
    let verticalOffset = presentationOffset.current.y + pitchOffset;
    let zoom = 1;
    if (endpointSafeArea && endpointGroupsByLabel.size) {
      camera.updateMatrixWorld(true);
      let top = Infinity, bottom = -Infinity;
      for (const group of endpointGroupsByLabel.values()) {
        endpointVerticalBounds(group.position, group.scale.y, camera, height, endpointBounds);
        top = Math.min(top, endpointBounds.top);
        bottom = Math.max(bottom, endpointBounds.bottom);
      }
      fitEndpointSafeArea(top, bottom, endpointSafeArea.top * height, endpointSafeArea.bottom * height, height, verticalOffset, endpointFit);
      verticalOffset = endpointFit.offset;
      zoom = endpointFit.zoom;
    }
    if (missionMarkerSafeArea && missionMarkerSafeEntries.length) {
      camera.updateMatrixWorld(true);
      const focal = height / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2));
      for (const entry of missionMarkerSafeEntries) {
        missionMarkerCameraPoint.copy(entry.position).applyMatrix4(camera.matrixWorldInverse);
        const depth = Math.max(camera.near, -missionMarkerCameraPoint.z);
        const x = width / 2 + focal * missionMarkerCameraPoint.x / depth;
        const y = height / 2 - focal * missionMarkerCameraPoint.y / depth;
        entry.card.left = entry.card.right = x;
        entry.card.top = entry.card.bottom = y;
        // Conservative camera-space envelope around the entire 0.11 world-unit base.
        const radius = 0.12, near = Math.max(camera.near, depth - radius), far = depth + radius;
        entry.base.left = width / 2 + Math.min(focal * (missionMarkerCameraPoint.x - radius) / near, focal * (missionMarkerCameraPoint.x - radius) / far);
        entry.base.right = width / 2 + Math.max(focal * (missionMarkerCameraPoint.x + radius) / near, focal * (missionMarkerCameraPoint.x + radius) / far);
        entry.base.top = height / 2 - Math.max(focal * (missionMarkerCameraPoint.y + radius) / near, focal * (missionMarkerCameraPoint.y + radius) / far);
        entry.base.bottom = height / 2 - Math.min(focal * (missionMarkerCameraPoint.y - radius) / near, focal * (missionMarkerCameraPoint.y - radius) / far);
      }
      fitMissionMarkerSafeArea(missionMarkerSafeRects, missionMarkerSafeArea, width, height,
        presentationOffset.current.x, verticalOffset, missionMarkerFit);
      offsetX = -missionMarkerFit.x;
      verticalOffset = missionMarkerFit.y;
      zoom = missionMarkerFit.zoom;
    }
    const offsetY = -verticalOffset;
    if (
      Math.abs(zoom - appliedProjectionZoom) < 0.000001
      && width === appliedProjectionWidth
      && height === appliedProjectionHeight
      && Math.abs(offsetX - appliedProjectionX) < 0.01
      && Math.abs(offsetY - appliedProjectionY) < 0.01
    ) return;
    appliedProjectionZoom = zoom;
    camera.zoom = zoom;
    appliedProjectionWidth = width;
    appliedProjectionHeight = height;
    appliedProjectionX = offsetX;
    appliedProjectionY = offsetY;
    if (Math.abs(offsetX) < 0.01 && Math.abs(offsetY) < 0.01) camera.clearViewOffset();
    else camera.setViewOffset(width, height, offsetX, offsetY, width, height);
    camera.updateProjectionMatrix();
  };

  const updatePresentationOffset = (now) => {
    if (presentationOffset.durationMs <= 0) return;
    const progress = THREE.MathUtils.clamp((now - presentationOffset.startedAt) / presentationOffset.durationMs, 0, 1);
    const eased = progress * progress * (3 - 2 * progress);
    presentationOffset.current.lerpVectors(presentationOffset.from, presentationOffset.target, eased);
    if (progress >= 1) presentationOffset.durationMs = 0;
  };
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(container);
  resize();
  let started = false;
  const start = () => { if (!started) { started = true; clock.getDelta(); animate(); } };
  if (!startPaused) start();
  let gpuPrepared = false;
  const warmupRoot = new THREE.Group();

  return {
    resize,
    start,
    async prepareGPU(onProgress = () => {}) {
      if (gpuPrepared) return;
      // These representatives pin shader programs for objects created later by gameplay.
      for (const [type, item] of Object.entries(itemTypes)) {
        warmupRoot.add(createNode({ id: `warmup:${type}`, type, latitude: 55, longitude: 90,
          altitude: isOrbitalType(type) ? ORBIT_ALTITUDE : GROUND_ALTITUDE }, "link", geometryFor(item.icon), nodeIconBackdropStyle));
      }
      for (const source of iconSources) addEndpoint(warmupRoot, geometryFor(source, true), 55, 90, 1, nodeIconBackdropStyle);
      const surfaceAnchor = createMissionSurfaceAnchor();
      setMissionSurfaceAnchorStatus(surfaceAnchor, "open", true);
      warmupRoot.add(surfaceAnchor, createSignalLinkVisual(signalLinkColor("link", "link"), 0, signalLinkStyle).group);
      warmupRoot.traverse((object) => { object.visible = true; object.frustumCulled = false; });
      gameplayForegroundScene.add(warmupRoot);
      const compile = (target, view, renderTarget = null) => async () => {
        renderer.setRenderTarget(renderTarget);
        await withTimeout(() => renderer.compileAsync(target, view), 60000, "Shader preparation");
        renderer.setRenderTarget(null);
      };
      const tasks = [
        ...[...textures, initialContourPair.fill].map((texture) => async () => { renderer.initTexture(texture); await yieldToBrowser(); }),
        compile(scene, camera, earthHdrTarget),
        compile(borderBloomScene, camera, borderBloomComposer.readBuffer),
        compile(borderGlowOverlayScene, borderGlowOverlayCamera, earthHdrTarget),
        compile(gameplayOcclusionScene, camera),
        compile(gameplayForegroundScene, camera),
        async () => {
          // Exercise the actual postprocessing chain, including internal fullscreen shaders.
          renderer.initRenderTarget(earthHdrTarget);
          renderFrame();
          gameplayForegroundScene.remove(warmupRoot);
          renderFrame();
          await waitForGpu(renderer.getContext());
        },
      ];
      let shaderFailure = null;
      const previousShaderError = renderer.debug.onShaderError;
      renderer.debug.onShaderError = (gl, program) => { shaderFailure = new Error(`Shader preparation failed: ${gl.getProgramInfoLog(program)}`); };
      try {
        await prepareTasks(tasks, onProgress, 1);
        if (shaderFailure) throw shaderFailure;
        gpuPrepared = true;
      } finally {
        renderer.debug.onShaderError = previousShaderError;
        renderer.setRenderTarget(null); gameplayForegroundScene.remove(warmupRoot);
      }
    },
    beginMissionMenuReveal(baseDurationMs, waveDurationMs, cardLeadMs, onBasesPresence) {
      missionMenuReveal.begin(baseDurationMs, waveDurationMs, cardLeadMs);
      onMissionBasesPresence = onBasesPresence;
      previousMissionBasesPresence = 0;
      onMissionBasesPresence?.(0);
      for (const group of missionMarkersById.values()) applyMissionSurfaceReveal(group, 0, 0);
    },
    missionMenuCardsStarted() { missionMenuReveal.cardsStarted = true; },
    cancelMissionMenuReveal() { missionMenuReveal.cancel(); onMissionBasesPresence = null; },
    setMissionMarkers(markers) { syncMissionSurfaceMarkers(markers); },
    setMissionMarkerSafeArea(area, cards = []) {
      missionMarkerSafeArea = area;
      missionMarkerSafeEntries = area ? cards.map(card => ({
        position: missionMarkersById.get(String(card.id))?.position,
        card: { left: 0, right: 0, top: 0, bottom: 0, padLeft: card.width / 2 + 2, padRight: card.width / 2 + 2,
          padTop: card.height + card.stem + 2, padBottom: 0 },
        base: { left: 0, right: 0, top: 0, bottom: 0, padLeft: 0, padRight: 0, padTop: 0, padBottom: 0 },
      })).filter(entry => entry.position) : [];
      missionMarkerSafeRects = missionMarkerSafeEntries.flatMap(entry => [entry.card, entry.base]);
      applyPresentationOffset();
    },
    pickGeo(clientX, clientY) { return geoFromPointer(clientX, clientY, "editor-anchor"); },
    projectDrop(clientX, clientY, type) { return geoFromPointer(clientX, clientY, type); },
    setTapControls({ enabled, selectedId = null }) {
      if (tapControls !== enabled) {
        if (pointerStart) finishNodeDrag({ pointerId: pointerStart.pointerId }, true);
        if (controls.pointerId !== null) controls.onPointerUp({ pointerId: controls.pointerId });
        controls.velocityYaw = controls.velocityPitch = controls.velocityRoll = 0;
        tapControls = enabled;
        controls.enabled = true;
      }
      selectedPlacementId = enabled ? selectedId : null;
      rebuildNodeHitTargets();
      for (const group of nodesById.values()) {
        const handle = group.userData.altitudeHandle;
        if (handle) handle.group.visible = !tapControls && !screenConnections;
      }
      setHoveredHitTarget(hoveredHitTarget, true);
    },
    setCameraDistance(distance, immediate = false) { controls.setRadius(distance, immediate); },
    setEndpointSafeArea(area) { endpointSafeArea = area; applyPresentationOffset(); },
    setPresentationOffset(x, y, durationMs = 0, immediate = false) {
      presentationOffset.from.copy(presentationOffset.current);
      presentationOffset.target.set(Number(x) || 0, Number(y) || 0);
      presentationOffset.startedAt = performance.now();
      presentationOffset.durationMs = immediate ? 0 : Math.max(0, Number(durationMs) || 0);
      if (immediate || presentationOffset.durationMs === 0) presentationOffset.current.copy(presentationOffset.target);
      applyPresentationOffset();
    },
    projectGeo(geo) {
      const world = geoToSceneVector({ ...geo, altitude: geo.altitude ?? NODE_SURFACE_ALTITUDE });
      const normal = world.clone().normalize();
      const towardsCamera = camera.position.clone().sub(world).normalize();
      const projected = world.clone().project(camera);
      return {
        x: (projected.x + 1) / 2,
        y: (1 - projected.y) / 2,
        visible: normal.dot(towardsCamera) > 0 && projected.z > -1 && projected.z < 1,
      };
    },
    update({ placements: nextPlacements, network: nextNetwork, selectedItem: nextSelectedItem, endpoints: nextEndpoints = endpoints }) {
      currentSelectedItem = nextSelectedItem;
      syncEndpoints(nextEndpoints);
      syncDynamic(nextPlacements, nextNetwork, nextEndpoints);
      pruneIconCache();
    },
    setScreenConnections(enabled, groundClassic = false) {
      hybridConnections = Boolean(enabled && groundClassic);
      screenConnections = Boolean(enabled);
      controls.screenConnections = screenConnections;
      if (screenConnections) {
        controls.resetIdleMotion(true);
        satelliteDragGuide.group.visible = false;
      }
      for (const group of nodesById.values()) setNodeScreenConnections(group, screenConnections, hybridConnections);
      for (const group of endpointGroupsByLabel.values()) applyEndpointAppearance(group, screenConnections && !hybridConnections);
      rebuildNodeHitTargets();
      setHoveredHitTarget(null);
    },
    captureConnections(run, mission, bounds, now, blocked = false, logicalWidth = 0) {
      renderer.getSize(connectionSize);
      if (logicalWidth > 0) connectionSize.multiplyScalar(logicalWidth / connectionSize.x);
      const moving = blocked || Boolean(draggedNode) || controls.pointerId !== null || Boolean(controls.viewTransition)
        || Math.abs(controls.velocityYaw) + Math.abs(controls.velocityPitch) + Math.abs(controls.velocityRoll) > 0.0001
        || Math.abs(controls.yaw - controls.targetYaw) + Math.abs(controls.pitch - controls.targetPitch) > 0.0001;
      connectionProjector.begin(camera, connectionSize.x, connectionSize.y, bounds, run.mission, run.placements, now, moving, document.hidden);
      if (connectionEndpoints !== mission.endpoints) {
        connectionEndpoints = mission.endpoints;
        connectionEndpointEntries = Object.entries(mission.endpoints).map(([id, point]) => {
          const key = `endpoint:${id}`;
          return [id, point, key, OBJECT_SETTINGS[key] ? key : "endpoint:A"];
        });
      }
      for (const [id, point, key, type] of connectionEndpointEntries) {
        const group = endpointGroupsByLabel.get(id);
        if (!group || group.userData.removing) continue;
        connectionProjector.add(key, group.position, group.userData.stemHeight, group.userData.signalRadius, 0.084 * group.scale.x);
      }
      for (const p of run.placements) {
        const group = nodesById.get(p.id);
        if (!group || group.userData.removing) continue;
        connectionProjector.add(p.id, group.position, group.userData.stemHeight, group.userData.signalRadius, 0.127 * group.scale.x, p.placementBlocked);
      }
      return connectionProjector.finish();
    },
    getViewState() { return controls.getViewState(); },
    setViewState(view, immediate = false, durationMs = 0) { controls.setViewState(view, immediate || reducedMotionQuery.matches, durationMs); },
    setEarthOrbitPreferences(preferences) { controls.setEarthOrbitPreferences(preferences); applyPresentationOffset(); },
    setEarthStyle(style) {
      updateEarthStyle(style);
      return contourSwitcher.select(style.russiaContour ?? DEFAULT_EARTH_STYLE.russiaContour);
    },
    getEarthContourId() { return contourSwitcher.activeId; },
    dispose() {
      disposeObject(warmupRoot);
      cancelAnimationFrame(animationFrame);
      onMissionBasesPresence = null;
      missionMenuReveal.cancel();
      resizeObserver.disconnect();
      controls.dispose();
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      renderer.domElement.removeEventListener("pointermove", onPointerMove);
      renderer.domElement.removeEventListener("pointerup", onPointerUp);
      renderer.domElement.removeEventListener("pointercancel", onPointerCancel);
      renderer.domElement.removeEventListener("pointerleave", onPointerLeave);
      renderer.domElement.removeEventListener("wheel", onWheel);
      renderer.domElement.removeEventListener("dblclick", onDoubleClick);
      for (const renderScene of [scene, gameplayForegroundScene]) {
        renderScene.traverse((object) => {
          if (!object.geometry?.userData?.shared) object.geometry?.dispose?.();
          if (Array.isArray(object.material)) object.material.forEach((material) => material.dispose());
          else object.material?.dispose?.();
        });
      }
      earthTexture.dispose();
      earthIlluminationCore.dispose();
      earthSpecular.dispose();
      earthNormal.dispose();
      earthClouds.dispose();
      contourSwitcher.dispose();
      borderBloomPass.dispose();
      borderBloomComposer.dispose();
      earthHdrTarget.dispose();
      outputPass.dispose();
      borderBloomEmitterMaterial.dispose();
      cityBloomEmitterMaterial.dispose();
      borderBloomDepthMaterial.dispose();
      gameplayOcclusionMaterial.dispose();
      borderGlowOverlayGeometry.dispose();
      borderGlowOverlayMaterial.dispose();
      for (const geometry of iconGeometries.values()) geometry.dispose();
      renderer.dispose();
    },
  };
  } catch (error) {
    renderer.dispose();
    renderer.forceContextLoss();
    renderer.domElement.remove();
    throw error;
  }
}

export function geoToVector({ latitude, longitude, altitude = GROUND_ALTITUDE }) {
  const latitudeRadians = THREE.MathUtils.degToRad(latitude);
  const longitudeRadians = THREE.MathUtils.degToRad(longitude);
  const radius = EARTH_RADIUS + altitude;
  return new THREE.Vector3(
    radius * Math.cos(latitudeRadians) * Math.sin(longitudeRadians),
    radius * Math.sin(latitudeRadians),
    radius * Math.cos(latitudeRadians) * Math.cos(longitudeRadians),
  );
}

function vectorToGeo(vector, altitude) {
  const direction = vector.clone().normalize();
  return {
    latitude: THREE.MathUtils.radToDeg(Math.asin(direction.y)),
    longitude: THREE.MathUtils.radToDeg(Math.atan2(direction.x, direction.z)),
    altitude,
  };
}

function geoToSceneVector(geo) {
  return geoToVector(geo).applyQuaternion(GEO_TO_SCENE_QUATERNION);
}

export function createNode(placement, state, iconGeometry, iconBackdropStyle = DEFAULT_NODE_ICON_BACKDROP_STYLE) {
  const group = new THREE.Group();
  const visual = nodeVisualTarget(state);
  const coverageRadius = signalRadiusFor(placement);
  const size = OBJECT_SETTINGS[placement.type].size;
  const plateSize = Math.max(coverageRadius / size, 0.19) / 0.49;
  const coreRadius = 0.127 / plateSize;
  const stemHeight = nodeStemHeight(placement.type);
  const isSatellite = isOrbitalType(placement.type);
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uSignal: { value: visual.signal },
      uLinked: { value: visual.linked },
      uWrong: { value: visual.wrong },
      uPresence: { value: 0 },
      uSelection: { value: 0 },
      uCoreRadius: { value: coreRadius },
      uAuraWidth: { value: 0.06 / plateSize },
      uWaveStart: { value: Math.min(0.42, coreRadius + 0.05 / plateSize) },
      uWaveEnd: { value: coverageRadius / size / plateSize },
    },
    vertexShader: NODE_VERTEX_SHADER,
    fragmentShader: NODE_FRAGMENT_SHADER,
    transparent: true,
    depthWrite: false,
    depthTest: isSatellite,
    blending: THREE.AdditiveBlending,
  });
  const billboard = new THREE.Group();
  const plate = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), material);
  plate.scale.set(plateSize, plateSize, 1);
  plate.position.y = stemHeight;
  plate.renderOrder = 9;
  // Draw solid sRGB selection ink after additive waves, with a translucent halo.
  // Adding the requested color to Earth/light pixels would shift it toward cyan.
  const selectionOutline = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.ShaderMaterial({
    uniforms: material.uniforms,
    vertexShader: NODE_VERTEX_SHADER,
    fragmentShader: `
      uniform float uCoreRadius;
      uniform float uAuraWidth;
      uniform float uPresence;
      uniform float uSelection;
      varying vec2 vUv;
      ${NODE_SELECTION_GLSL}
      void main() {
        float distanceToCenter = distance(vUv, vec2(0.5));
        float edge = max(fwidth(distanceToCenter) * 1.35, 0.00075);
        float border = 1.0 - smoothstep(0.006 - edge, 0.006 + edge, abs(distanceToCenter - (uCoreRadius + 0.002)));
        float halo = exp(-pow((distanceToCenter - (uCoreRadius + 0.002)) / uAuraWidth, 2.0));
        float alpha = max(border, halo * 0.35) * uPresence * uSelection;
        gl_FragColor = vec4(selectionColor, alpha);
      }
    `,
    transparent: true, depthWrite: false, depthTest: isSatellite,
    blending: THREE.NormalBlending, toneMapped: false,
  }));
  selectionOutline.position.z = 0.001;
  selectionOutline.renderOrder = 11;
  selectionOutline.visible = false;
  plate.add(selectionOutline);
  const iconBackdropMaterial = new THREE.MeshBasicMaterial({
    color: iconBackdropStyle.color,
    transparent: true,
    opacity: iconBackdropStyle.opacity,
    depthWrite: false,
    depthTest: isSatellite,
    side: THREE.DoubleSide,
    toneMapped: false,
  });
  iconBackdropMaterial.userData.baseOpacity = iconBackdropStyle.opacity;
  const iconBackdrop = new THREE.Mesh(new THREE.CircleGeometry(iconBackdropStyle.radius, 64), iconBackdropMaterial);
  iconBackdrop.position.set(0, stemHeight, 0.008);
  iconBackdrop.renderOrder = 8;
  const icon = new THREE.Mesh(iconGeometry, new THREE.MeshBasicMaterial({
    color: 0xf4f8ff,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    depthTest: isSatellite,
    side: THREE.DoubleSide,
    toneMapped: false,
  }));
  icon.position.y = stemHeight;
  icon.position.z = 0.015;
  icon.renderOrder = 10;
  billboard.add(iconBackdrop, plate, icon);
  const altitudeHandle = isSatellite ? createSatelliteAltitudeHandle() : null;
  if (altitudeHandle) billboard.add(altitudeHandle.group);
  group.add(billboard);
  const anchor = stemHeight > 0 ? createNodeAnchor({ includeMoveIndicator: true }) : null;
  if (anchor) group.add(anchor.group);
  const stem = stemHeight > 0 ? createVerticalNodeStem(stemHeight) : null;
  if (stem) billboard.add(stem.group);
  const hitTarget = new THREE.Mesh(
    new THREE.PlaneGeometry(0.4, 0.4),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, depthTest: false, side: THREE.DoubleSide }),
  );
  hitTarget.position.y = stemHeight;
  hitTarget.position.z = 0.02;
  billboard.add(hitTarget);
  const placementHandle = { ...placement, group, preview: null, grabOffset: { x: 0, y: 0 } };
  const surfaceHitTargets = [hitTarget, ...(anchor?.hitTargets || []), ...(stem?.hitTargets || [])];
  for (const target of surfaceHitTargets) {
    target.userData.placement = placementHandle;
    target.userData.dragMode = "surface";
  }
  if (altitudeHandle) {
    altitudeHandle.hitTarget.userData.placement = placementHandle;
    altitudeHandle.hitTarget.userData.dragMode = "altitude";
  }
  const hitTargets = [...surfaceHitTargets, ...(altitudeHandle ? [altitudeHandle.hitTarget] : [])];
  const supportMaterials = [
    iconBackdropMaterial,
    ...(anchor?.group.userData.visualMaterials || []),
    ...(stem?.visualMaterials || []),
  ];
  group.userData = {
    isOrbital: isSatellite,
    billboard,
    plate,
    selectionOutline,
    iconBackdrop,
    anchor,
    altitudeHandle,
    material,
    icon,
    hitTarget,
    hitTargets,
    worldHitTargets: hitTargets,
    surfaceHitTargets,
    supportMaterials,
    placement: placementHandle,
    signalRadius: coverageRadius,
    stemHeight: stemHeight * size,
    presence: 0,
    targetPresence: 1,
    interaction: 0,
    targetInteraction: 0,
    selection: 0,
    targetSelection: 0,
    removing: false,
    visual: { ...visual },
    targetVisual: { ...visual },
  };
  attachConnectionContour(group);
  updateNodeTransform(group, placement);
  return group;
}

// Hiding the handle alone does not disable Three.js raycasting against its
// explicit hit-target list. Switch both drawing and picking as one policy.
export function setNodeScreenConnections(group, enabled, groundClassic = false) {
  const data = group.userData;
  enabled = Boolean(enabled && (!groundClassic || data.isOrbital));
  if (data.screenConnections !== Boolean(enabled)) {
    data.screenConnections = Boolean(enabled);
    updateNodeTransform(group, data.placement);
  }
  if (!data.isOrbital) return;
  data.altitudeHandle.group.visible = !enabled;
  data.hitTargets = enabled ? data.surfaceHitTargets : data.worldHitTargets;
  if (enabled) setSatelliteAltitudeHandleActive(data.altitudeHandle, false);
}

export function nodeStemHeight(type) {
  return isOrbitalType(type) ? 0 : GROUND_NODE_STEM_HEIGHT;
}

export function dragAnchorPointer(clientX, clientY, grabOffset = { x: 0, y: 0 }) {
  return {
    x: clientX - (Number(grabOffset.x) || 0),
    y: clientY - (Number(grabOffset.y) || 0),
  };
}

export function satelliteAltitudeFromPointer(startAltitude, startClientY, clientY, viewportHeight, settings = { minAltitude: SATELLITE_MIN_ALTITUDE, maxAltitude: SATELLITE_MAX_ALTITUDE }) {
  const usablePixels = Math.max(160, viewportHeight * SATELLITE_ALTITUDE_DRAG_SPAN);
  const altitudeRange = settings.maxAltitude - settings.minAltitude;
  return THREE.MathUtils.clamp(
    startAltitude + ((startClientY - clientY) / usablePixels) * altitudeRange,
    settings.minAltitude,
    settings.maxAltitude,
  );
}

export function intersectSphereContinuously(ray, radius, referencePosition = null) {
  const intersections = sphereRayIntersections(ray, radius);
  if (!intersections.length) return null;
  if (!referencePosition || intersections.length === 1) return intersections[0];
  return intersections.reduce((closest, point) => (
    point.distanceToSquared(referencePosition) < closest.distanceToSquared(referencePosition) ? point : closest
  ));
}

function sphereRayIntersections(ray, radius) {
  const projection = -ray.origin.dot(ray.direction);
  const distanceSquared = ray.origin.lengthSq() - projection * projection;
  const radiusSquared = radius * radius;
  if (distanceSquared > radiusSquared) return [];
  const halfChord = Math.sqrt(Math.max(0, radiusSquared - distanceSquared));
  const distances = [projection - halfChord, projection + halfChord].filter((distance) => distance >= 0);
  return distances.map((distance) => ray.at(distance, new THREE.Vector3()));
}

export function satellitePositionIsVisible(position, cameraPosition) {
  const toCandidate = position.clone().sub(cameraPosition);
  const candidateDistance = toCandidate.length();
  const sightRay = new THREE.Ray(cameraPosition.clone(), toCandidate.normalize());
  const earthHit = intersectSphereContinuously(sightRay, EARTH_RADIUS + 0.01);
  return !earthHit || cameraPosition.distanceTo(earthHit) >= candidateDistance - 0.01;
}

export function intersectVisibleSphereContinuously(ray, radius, cameraPosition, referencePosition = null) {
  // Select the continuous branch BEFORE visibility filtering. Otherwise an
  // occluded far intersection makes the node teleport to the near branch.
  const candidate = intersectSphereContinuously(ray, radius, referencePosition);
  return candidate && satellitePositionIsVisible(candidate, cameraPosition) ? candidate : null;
}

export function constrainSatellitePosition(position, cameraPosition) {
  const minimumRadius = EARTH_RADIUS + SATELLITE_MIN_ALTITUDE;
  const maximumRadius = EARTH_RADIUS + SATELLITE_MAX_ALTITUDE;
  const constrained = position.clone();
  const currentRadius = constrained.length();
  if (currentRadius < minimumRadius) constrained.setLength(minimumRadius);
  if (currentRadius > maximumRadius) constrained.setLength(maximumRadius);

  const toCandidate = constrained.clone().sub(cameraPosition);
  const candidateDistance = toCandidate.length();
  const sightRay = new THREE.Ray(cameraPosition.clone(), toCandidate.normalize());
  const earthHit = intersectSphereContinuously(sightRay, EARTH_RADIUS + 0.01);
  if (earthHit && cameraPosition.distanceTo(earthHit) < candidateDistance - 0.01) {
    return intersectSphereContinuously(sightRay, minimumRadius) || constrained;
  }
  return constrained;
}

function createSatelliteAltitudeHandle() {
  const group = new THREE.Group();
  group.position.set(0.235, 0, 0.035);
  group.renderOrder = 11;

  const backgroundMaterial = new THREE.MeshBasicMaterial({
    color: 0x07111f,
    transparent: true,
    opacity: 0.58,
    depthWrite: false,
    depthTest: true,
    side: THREE.DoubleSide,
  });
  const background = new THREE.Mesh(new THREE.PlaneGeometry(0.13, 0.25), backgroundMaterial);
  background.renderOrder = 10;
  group.add(background);

  const arrowMaterial = new THREE.LineBasicMaterial({
    color: 0x79acff,
    transparent: true,
    opacity: 0.78,
    depthWrite: false,
    depthTest: true,
    blending: THREE.AdditiveBlending,
  });
  const arrowGeometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, -0.082, 0.004), new THREE.Vector3(0, 0.082, 0.004),
    new THREE.Vector3(-0.027, 0.055, 0.004), new THREE.Vector3(0, 0.086, 0.004),
    new THREE.Vector3(0, 0.086, 0.004), new THREE.Vector3(0.027, 0.055, 0.004),
    new THREE.Vector3(-0.027, -0.055, 0.004), new THREE.Vector3(0, -0.086, 0.004),
    new THREE.Vector3(0, -0.086, 0.004), new THREE.Vector3(0.027, -0.055, 0.004),
  ]);
  const arrows = new THREE.LineSegments(arrowGeometry, arrowMaterial);
  arrows.renderOrder = 11;
  group.add(arrows);

  const hitTarget = new THREE.Mesh(
    new THREE.PlaneGeometry(0.18, 0.31),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, depthTest: false, side: THREE.DoubleSide }),
  );
  hitTarget.position.z = 0.012;
  group.add(hitTarget);
  return {
    group,
    hitTarget,
    backgroundMaterial,
    arrowMaterial,
    activity: 0,
    targetActivity: 0,
    idleBackgroundColor: new THREE.Color(0x07111f),
    activeBackgroundColor: new THREE.Color(0x17345f),
    idleArrowColor: new THREE.Color(0x79acff),
    activeArrowColor: new THREE.Color(0xd9e8ff),
  };
}

function setSatelliteAltitudeHandleActive(handle, active) {
  handle.targetActivity = active ? 1 : 0;
}

function updateSatelliteAltitudeHandleMotion(handle, delta, presence = 1) {
  handle.activity = THREE.MathUtils.damp(handle.activity, handle.targetActivity, NODE_TRANSITION_RATE * 1.45, delta);
  handle.backgroundMaterial.opacity = THREE.MathUtils.lerp(0.58, 0.9, handle.activity) * presence;
  handle.backgroundMaterial.color.lerpColors(handle.idleBackgroundColor, handle.activeBackgroundColor, handle.activity);
  handle.arrowMaterial.opacity = THREE.MathUtils.lerp(0.78, 1, handle.activity) * presence;
  handle.arrowMaterial.color.lerpColors(handle.idleArrowColor, handle.activeArrowColor, handle.activity);
  handle.group.scale.setScalar(THREE.MathUtils.lerp(1, 1.06, handle.activity));
}

function createSatelliteDragGuide() {
  const group = new THREE.Group();
  group.visible = false;
  const linePositions = new Float32Array(6);
  const lineGeometry = new THREE.BufferGeometry();
  lineGeometry.setAttribute("position", new THREE.BufferAttribute(linePositions, 3));
  const line = new THREE.Line(
    lineGeometry,
    new THREE.LineDashedMaterial({
      color: 0x8ab5ff,
      transparent: true,
      opacity: 0.72,
      depthWrite: false,
      depthTest: true,
      dashSize: 0.06,
      gapSize: 0.035,
      blending: THREE.AdditiveBlending,
    }),
  );
  line.renderOrder = 10;
  group.add(line);

  const footprint = new THREE.Group();
  for (const [radius, opacity] of [[0.055, 0.88], [0.09, 0.52], [0.128, 0.25]]) {
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(radius - 0.006, radius, 64),
      new THREE.MeshBasicMaterial({
        color: 0x8ab5ff,
        transparent: true,
        opacity,
        depthWrite: false,
        depthTest: true,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
      }),
    );
    ring.position.z = 0.003;
    ring.renderOrder = 10;
    footprint.add(ring);
  }
  const beacon = new THREE.Mesh(
    new THREE.CircleGeometry(0.027, 48),
    new THREE.MeshBasicMaterial({ color: 0xeaf3ff, transparent: true, opacity: 0.95, depthWrite: false, depthTest: true, side: THREE.DoubleSide }),
  );
  beacon.position.z = 0.006;
  beacon.renderOrder = 11;
  footprint.add(beacon);
  group.add(footprint);
  return { group, line, footprint };
}

function updateSatelliteDragGuide(guide, satellitePosition) {
  const normal = satellitePosition.clone().normalize();
  const surfacePoint = normal.clone().multiplyScalar(EARTH_RADIUS + NODE_SURFACE_ALTITUDE);
  const positions = guide.line.geometry.attributes.position.array;
  positions.set(surfacePoint.toArray(), 0);
  positions.set(satellitePosition.toArray(), 3);
  guide.line.geometry.attributes.position.needsUpdate = true;
  guide.line.computeLineDistances();
  guide.footprint.position.copy(surfacePoint);
  guide.footprint.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);
}

function createNodeAnchor({ includeHitTarget = true, includeMoveIndicator = false } = {}) {
  const anchor = new THREE.Group();
  const restingBase = new THREE.Group();
  anchor.add(restingBase);
  const statusMaterials = [];
  const materialOptions = { color: 0xcfe3ff, transparent: true, depthWrite: false, depthTest: true, blending: THREE.AdditiveBlending, toneMapped: false };
  for (const [radius, opacity] of [[0.055, 0.78], [0.082, 0.48], [0.11, 0.25]]) {
    const material = new THREE.MeshBasicMaterial({ ...materialOptions, opacity, side: THREE.DoubleSide });
    material.userData.baseOpacity = opacity;
    statusMaterials.push(material);
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(radius - 0.006, radius, 64),
      material,
    );
    ring.position.z = 0.004;
    ring.renderOrder = 7;
    restingBase.add(ring);
  }

  const beaconMaterial = new THREE.MeshBasicMaterial({ ...materialOptions, color: 0xf4f8ff, opacity: 0.96, side: THREE.DoubleSide });
  beaconMaterial.userData.baseOpacity = 0.96;
  const beacon = new THREE.Mesh(
    new THREE.CircleGeometry(0.032, 48),
    beaconMaterial,
  );
  beacon.position.z = 0.008;
  beacon.renderOrder = 8;
  restingBase.add(beacon);

  let moveArrows = null;
  if (includeMoveIndicator) {
    // Four filled arrows share the base's tangent plane and existing hit area.
    const shapes = [];
    for (let direction = 0; direction < 4; direction += 1) {
      const angle = direction * Math.PI / 2;
      const shape = new THREE.Shape();
      const points = [[-0.009, 0.018], [0.009, 0.018], [0.009, 0.074],
        [0.029, 0.074], [0, 0.116], [-0.029, 0.074], [-0.009, 0.074]];
      points.forEach(([x, y], index) => {
        const px = x * Math.cos(angle) - y * Math.sin(angle);
        const py = x * Math.sin(angle) + y * Math.cos(angle);
        if (index === 0) shape.moveTo(px, py);
        else shape.lineTo(px, py);
      });
      shape.closePath();
      shapes.push(shape);
    }
    const material = new THREE.ShaderMaterial({
      uniforms: { uOpacity: { value: 0 } },
      vertexShader: NODE_VERTEX_SHADER,
      fragmentShader: `
        uniform float uOpacity;
        ${NODE_SELECTION_GLSL}
        void main() { gl_FragColor = vec4(selectionColor, uOpacity); }
      `,
      transparent: true, depthWrite: false, depthTest: true,
      blending: THREE.NormalBlending, toneMapped: false, side: THREE.DoubleSide,
    });
    material.userData.baseOpacity = 1;
    moveArrows = new THREE.Mesh(new THREE.ShapeGeometry(shapes), material);
    moveArrows.position.z = 0.008;
    moveArrows.renderOrder = 11;
    moveArrows.visible = false;
    anchor.add(moveArrows);
  }

  const hitTargets = [];
  if (includeHitTarget) {
    const baseHitTarget = new THREE.Mesh(
      new THREE.CircleGeometry(0.13, 24),
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, depthTest: false, side: THREE.DoubleSide }),
    );
    baseHitTarget.position.z = 0.012;
    anchor.add(baseHitTarget);
    hitTargets.push(baseHitTarget);
  }
  anchor.userData.statusMaterials = statusMaterials;
  anchor.userData.beaconMaterial = beaconMaterial;
  anchor.userData.visualMaterials = [...statusMaterials, beaconMaterial, ...(moveArrows ? [moveArrows.material] : [])];
  return { group: anchor, hitTargets, restingBase, moveArrows };
}

export function setNodeAnchorSelected(group, selected) {
  group.userData.targetSelection = selected && !group.userData.removing ? 1 : 0;
}

export function updateNodeSelection(group, delta, reducedMotion = false) {
  const data = group.userData;
  const target = data.removing ? 0 : data.targetSelection;
  let selection = reducedMotion ? target : THREE.MathUtils.damp(data.selection, target, NODE_TRANSITION_RATE * 1.35, delta);
  if (Math.abs(selection - target) < 0.001) selection = target;
  data.selection = selection;
  data.material.uniforms.uSelection.value = selection;
  data.selectionOutline.visible = selection > 0;
  const anchor = data.anchor;
  if (!anchor?.moveArrows) return;
  anchor.restingBase.visible = selection < 1;
  anchor.moveArrows.visible = selection > 0;
  const presence = data.presence;
  applyMaterialPresence(anchor.group.userData.statusMaterials, presence * (1 - selection));
  const beacon = anchor.group.userData.beaconMaterial;
  beacon.opacity = beacon.userData.baseOpacity * presence * (1 - selection);
  anchor.moveArrows.material.uniforms.uOpacity.value = presence * selection;
}

function createVerticalNodeStem(stemHeight, headRadius = 0.125) {
  const group = new THREE.Group();
  const stemMaterial = new THREE.LineBasicMaterial({ color: 0xcfe3ff, transparent: true, opacity: 0.72, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending });
  stemMaterial.userData.baseOpacity = 0.72;
  const stem = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0.012, 0.006),
      new THREE.Vector3(0, Math.max(0.02, stemHeight - headRadius), 0.006),
    ]),
    stemMaterial,
  );
  stem.renderOrder = 7;
  group.add(stem);
  const stemHitTarget = new THREE.Mesh(
    new THREE.PlaneGeometry(0.09, stemHeight),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, depthTest: false, side: THREE.DoubleSide }),
  );
  stemHitTarget.position.y = stemHeight * 0.5;
  stemHitTarget.position.z = 0.01;
  group.add(stemHitTarget);
  return { group, hitTargets: [stemHitTarget], visualMaterials: [stemMaterial] };
}

function applyMaterialPresence(materials = [], presence = 1) {
  for (let index = 0; index < materials.length; index += 1) {
    const material = materials[index];
    material.opacity = material.userData.baseOpacity * presence;
  }
}

export function updateNodeTransform(group, placement) {
  const type = placement.type || group.userData.placement.type;
  const size = screenObjectSize(type, OBJECT_SETTINGS[type].size, group.userData.screenConnections);
  const coverageRadius = screenFieldRadius(signalRadiusFor(placement, type), group.userData.screenConnections);
  const plateSize = Math.max(coverageRadius / size, 0.19) / 0.49;
  group.scale.setScalar(size);
  group.userData.stemHeight = nodeStemHeight(type) * size;
  group.userData.signalRadius = coverageRadius;
  group.userData.plate.scale.set(plateSize, plateSize, 1);
  const uniforms = group.userData.material.uniforms;
  uniforms.uCoreRadius.value = 0.127 / plateSize;
  uniforms.uAuraWidth.value = 0.06 / plateSize;
  uniforms.uWaveStart.value = Math.min(0.42, 0.177 / plateSize);
  uniforms.uWaveEnd.value = coverageRadius / size / plateSize;
  const { anchorPosition, surfaceNormal } = nodeMarkerFrame(placement, type);
  const { anchor, billboard } = group.userData;
  group.position.copy(anchorPosition);
  billboard.position.set(0, 0, 0);
  if (anchor) anchor.group.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), surfaceNormal);
}

export function nodeMarkerFrame(placement, type = placement.type) {
  const stemHeight = nodeStemHeight(type);
  const anchorPosition = geoToSceneVector(stemHeight > 0 ? { ...placement, altitude: NODE_SURFACE_ALTITUDE } : placement);
  const surfaceNormal = anchorPosition.clone().normalize();
  return { anchorPosition, surfaceNormal };
}

export function missionMarkerFrame(position) {
  const anchorPosition = geoToSceneVector({ ...position, altitude: NODE_SURFACE_ALTITUDE });
  return { anchorPosition, surfaceNormal: anchorPosition.clone().normalize() };
}

function createBroadcastMaterial({ linked = false, depthTest = true } = {}) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uSignal: { value: 1 },
      uLinked: { value: linked ? 1 : 0 },
      uWrong: { value: 0 },
      uPresence: { value: 1 },
      uSelection: { value: 0 },
      uCoreRadius: { value: 0.07 },
      uAuraWidth: { value: 0.055 },
      uWaveStart: { value: 0.14 },
      uWaveEnd: { value: 0.48 },
    },
    vertexShader: NODE_VERTEX_SHADER,
    fragmentShader: NODE_FRAGMENT_SHADER,
    transparent: true,
    depthWrite: false,
    depthTest,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
  });
}

function createMissionSurfaceAnchor() {
  const group = createNodeAnchor({ includeHitTarget: false }).group;
  const broadcastMaterial = createBroadcastMaterial({ linked: false, depthTest: true });
  const broadcastPlate = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), broadcastMaterial);
  broadcastPlate.scale.setScalar(0.72);
  broadcastPlate.position.z = 0.002;
  broadcastPlate.renderOrder = 6;
  broadcastPlate.visible = false;
  group.add(broadcastPlate);
  group.userData.broadcastMaterial = broadcastMaterial;
  group.userData.broadcastPlate = broadcastPlate;
  return group;
}

export function setMissionSurfaceAnchorStatus(group, status, active = false) {
  const color = status === "completed" ? 0x21c994 : status === "locked" ? 0x78869b : 0xcfe3ff;
  const visibility = status === "locked" || status === "completed" ? 0.8 : 1;
  group.userData.statusVisibility = visibility;
  for (const material of group.userData.statusMaterials) {
    material.color.setHex(color);
    material.opacity = material.userData.baseOpacity * visibility;
  }
  group.userData.beaconMaterial.color.setHex(status === "completed" ? 0xd8fff1 : 0xf4f8ff);
  group.userData.beaconMaterial.opacity = group.userData.beaconMaterial.userData.baseOpacity * visibility;
  group.userData.broadcastPlate.visible = status === "open" && active === true;
}

export function applyMissionSurfaceReveal(group, bases, waves) {
  group.visible = bases > 0;
  const presence = bases * (group.userData.statusVisibility ?? 1);
  for (const material of group.userData.statusMaterials) material.opacity = material.userData.baseOpacity * presence;
  const beacon = group.userData.beaconMaterial;
  beacon.opacity = beacon.userData.baseOpacity * presence;
  group.userData.broadcastMaterial.uniforms.uPresence.value = waves;
}

function resolveVisualLinkGroup(id, nodesById, endpointGroupsByLabel) {
  return typeof id === "string" && id.startsWith("endpoint:")
    ? endpointGroupsByLabel.get(id.slice("endpoint:".length))
    : nodesById.get(id);
}

export function iconLinkAnchor(rootPosition, stemHeight, cameraQuaternion, target = new THREE.Vector3()) {
  linkFrameScratch.cameraUp.set(0, 1, 0).applyQuaternion(cameraQuaternion);
  return target.copy(rootPosition).addScaledVector(linkFrameScratch.cameraUp, stemHeight);
}

function createSignalLinkVisual(color, index, sourceStyle) {
  const style = {
    strandCount: Math.max(1, Math.round(sourceStyle.strandCount)),
    segmentCount: Math.max(8, Math.round(sourceStyle.segmentCount)),
    particleCount: Math.max(1, Math.round(sourceStyle.particleCount)),
    flowSpeed: Math.max(0.01, Number(sourceStyle.flowSpeed)),
    waveAmplitude: Math.max(0, Number(sourceStyle.waveAmplitude)),
    waveFrequency: Math.max(1, Number(sourceStyle.waveFrequency)),
    strandSpacing: Math.max(0, Number(sourceStyle.strandSpacing ?? DEFAULT_SIGNAL_LINK_STYLE.strandSpacing)),
  };
  const group = new THREE.Group();
  const strandMaterials = [];
  const strandAttributes = [];
  const pointCount = style.segmentCount + 1;
  for (let strandIndex = 0; strandIndex < style.strandCount; strandIndex += 1) {
    const positions = new Float32Array(pointCount * 3);
    const geometry = new THREE.BufferGeometry();
    const attribute = new THREE.BufferAttribute(positions, 3);
    attribute.setUsage(THREE.DynamicDrawUsage);
    geometry.setAttribute("position", attribute);
    const material = new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      depthTest: true,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
    });
    const strand = new THREE.Line(geometry, material);
    strand.frustumCulled = false;
    strand.renderOrder = 6;
    group.add(strand);
    strandMaterials.push(material);
    strandAttributes.push(attribute);
  }
  const particlePositions = new Float32Array(style.particleCount * 3);
  const particleGeometry = new THREE.BufferGeometry();
  const particleAttribute = new THREE.BufferAttribute(particlePositions, 3);
  particleAttribute.setUsage(THREE.DynamicDrawUsage);
  particleGeometry.setAttribute("position", particleAttribute);
  const particleMaterial = new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color(color) },
      uOpacity: { value: 0 },
    },
    transparent: true,
    depthWrite: false,
    depthTest: true,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
    vertexShader: `
      void main() {
        vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = clamp(34.0 / max(1.0, -viewPosition.z), 4.0, 10.0);
        gl_Position = projectionMatrix * viewPosition;
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      uniform float uOpacity;
      void main() {
        float radius = distance(gl_PointCoord, vec2(0.5));
        float edge = max(fwidth(radius) * 1.25, 0.015);
        float alpha = 1.0 - smoothstep(0.34 - edge, 0.5, radius);
        float glow = 1.0 - smoothstep(0.0, 0.5, radius);
        gl_FragColor = vec4(uColor * (0.9 + glow * 0.75), alpha * uOpacity);
      }
    `,
  });
  const particles = new THREE.Points(particleGeometry, particleMaterial);
  particles.frustumCulled = false;
  particles.renderOrder = 7;
  group.add(particles);
  return {
    group,
    style,
    strandMaterials,
    strandAttributes,
    particleMaterial,
    particleAttribute,
    centerStrand: Math.floor(style.strandCount / 2),
    centerPositions: new Float32Array(pointCount * 3),
    normalPositions: new Float32Array(pointCount * 3),
    binormalPositions: new Float32Array(pointCount * 3),
    startAnchor: new THREE.Vector3(),
    endAnchor: new THREE.Vector3(),
    midpoint: new THREE.Vector3(),
    surfaceStart: new THREE.Vector3(),
    surfaceEnd: new THREE.Vector3(),
    sample: new THREE.Vector3(),
    tangent: new THREE.Vector3(),
    normal: new THREE.Vector3(),
    binormal: new THREE.Vector3(),
    viewDirection: new THREE.Vector3(),
    targetColor: new THREE.Color(color),
    offset: index * 0.23,
    opacity: 0,
    removing: false,
    surface: false,
    surfaceAngle: 0,
    surfaceSinAngle: 0,
  };
}

function updateSignalLinkVisual(entry, firstRoot, secondRoot, camera, elapsed) {
  const { style } = entry;
  const segments = style.segmentCount;
  entry.surfaceStart.copy(firstRoot).normalize();
  entry.surfaceEnd.copy(secondRoot).normalize();
  entry.surfaceAngle = Math.acos(THREE.MathUtils.clamp(entry.surfaceStart.dot(entry.surfaceEnd), -1, 1));
  entry.surfaceSinAngle = Math.sin(entry.surfaceAngle);
  entry.midpoint.copy(entry.startAnchor).add(entry.endAnchor).multiplyScalar(0.5).normalize()
    .multiplyScalar(Math.max(firstRoot.length(), secondRoot.length()) + 0.34);

  if (entry.screen) {
    // A common camera depth makes the accepted link straight in the view.
    const depth = entry.sample.copy(entry.startAnchor).add(entry.endAnchor).multiplyScalar(0.5).project(camera).z;
    entry.startAnchor.project(camera); entry.startAnchor.z = depth; entry.startAnchor.unproject(camera);
    entry.endAnchor.project(camera); entry.endAnchor.z = depth; entry.endAnchor.unproject(camera);
    entry.midpoint.copy(entry.startAnchor).add(entry.endAnchor).multiplyScalar(0.5);
  }
  for (let pointIndex = 0; pointIndex <= segments; pointIndex += 1) {
    const t = pointIndex / segments;
    sampleSignalCenter(entry, t, entry.sample);
    const offset = pointIndex * 3;
    entry.centerPositions[offset] = entry.sample.x;
    entry.centerPositions[offset + 1] = entry.sample.y;
    entry.centerPositions[offset + 2] = entry.sample.z;
  }

  for (let pointIndex = 0; pointIndex <= segments; pointIndex += 1) {
    const offset = pointIndex * 3;
    const previousOffset = Math.max(0, pointIndex - 1) * 3;
    const nextOffset = Math.min(segments, pointIndex + 1) * 3;
    entry.tangent.set(
      entry.centerPositions[nextOffset] - entry.centerPositions[previousOffset],
      entry.centerPositions[nextOffset + 1] - entry.centerPositions[previousOffset + 1],
      entry.centerPositions[nextOffset + 2] - entry.centerPositions[previousOffset + 2],
    ).normalize();
    entry.sample.fromArray(entry.centerPositions, offset);
    entry.viewDirection.copy(camera.position).sub(entry.sample).normalize();
    entry.normal.crossVectors(entry.tangent, entry.viewDirection).normalize();
    if (entry.normal.lengthSq() < 0.000001) entry.normal.set(1, 0, 0).applyQuaternion(camera.quaternion);
    entry.binormal.crossVectors(entry.tangent, entry.normal).normalize();
    entry.normal.toArray(entry.normalPositions, offset);
    entry.binormal.toArray(entry.binormalPositions, offset);
  }

  const strandCenter = (style.strandCount - 1) * 0.5;
  for (let strandIndex = 0; strandIndex < style.strandCount; strandIndex += 1) {
    const positions = entry.strandAttributes[strandIndex].array;
    const lane = (strandIndex - strandCenter) * style.strandSpacing;
    const phase = strandIndex * 0.82 + entry.offset * Math.PI * 2;
    for (let pointIndex = 0; pointIndex <= segments; pointIndex += 1) {
      const t = pointIndex / segments;
      const offset = pointIndex * 3;
      const envelope = Math.sin(Math.PI * t);
      const wavePhase = t * style.waveFrequency * Math.PI * 2 - elapsed * 3.2 + phase;
      const lateral = (lane + Math.sin(wavePhase) * style.waveAmplitude) * envelope;
      const depth = Math.cos(wavePhase * 0.73) * style.waveAmplitude * 0.24 * envelope;
      positions[offset] = entry.centerPositions[offset] + entry.normalPositions[offset] * lateral + entry.binormalPositions[offset] * depth;
      positions[offset + 1] = entry.centerPositions[offset + 1] + entry.normalPositions[offset + 1] * lateral + entry.binormalPositions[offset + 1] * depth;
      positions[offset + 2] = entry.centerPositions[offset + 2] + entry.normalPositions[offset + 2] * lateral + entry.binormalPositions[offset + 2] * depth;
    }
    entry.strandAttributes[strandIndex].needsUpdate = true;
  }

  const particlePositions = entry.particleAttribute.array;
  for (let particleIndex = 0; particleIndex < style.particleCount; particleIndex += 1) {
    const t = (elapsed * style.flowSpeed + particleIndex / style.particleCount + entry.offset) % 1;
    const scaled = t * segments;
    const firstIndex = Math.floor(scaled);
    const secondIndex = Math.min(segments, firstIndex + 1);
    const mix = scaled - firstIndex;
    const firstOffset = firstIndex * 3;
    const secondOffset = secondIndex * 3;
    const targetOffset = particleIndex * 3;
    const lane = ((particleIndex % style.strandCount) - strandCenter) * style.strandSpacing;
    const glowWave = Math.sin(t * style.waveFrequency * Math.PI * 2 - elapsed * 3.2 + particleIndex) * style.waveAmplitude;
    const lateral = (lane + glowWave) * Math.sin(Math.PI * t);
    for (let axis = 0; axis < 3; axis += 1) {
      const center = THREE.MathUtils.lerp(entry.centerPositions[firstOffset + axis], entry.centerPositions[secondOffset + axis], mix);
      const normal = THREE.MathUtils.lerp(entry.normalPositions[firstOffset + axis], entry.normalPositions[secondOffset + axis], mix);
      particlePositions[targetOffset + axis] = center + normal * lateral;
    }
  }
  entry.particleAttribute.needsUpdate = true;
}

function sampleSignalCenter(entry, t, target) {
  if (!entry.surface) {
    const inverse = 1 - t;
    return target.copy(entry.startAnchor).multiplyScalar(inverse * inverse)
      .addScaledVector(entry.midpoint, 2 * inverse * t)
      .addScaledVector(entry.endAnchor, t * t);
  }
  if (entry.surfaceAngle < 0.000001 || Math.abs(entry.surfaceSinAngle) < 0.000001) {
    target.copy(entry.surfaceStart).lerp(entry.surfaceEnd, t).normalize().multiplyScalar(EARTH_RADIUS + SURFACE_LINK_ALTITUDE);
  } else {
    target.copy(entry.surfaceStart).multiplyScalar(Math.sin((1 - t) * entry.surfaceAngle) / entry.surfaceSinAngle)
      .addScaledVector(entry.surfaceEnd, Math.sin(t * entry.surfaceAngle) / entry.surfaceSinAngle)
      .normalize()
      .multiplyScalar(EARTH_RADIUS + SURFACE_LINK_ALTITUDE);
  }
  if (t < 0.16) target.lerp(entry.startAnchor, 1 - THREE.MathUtils.smoothstep(t / 0.16, 0, 1));
  else if (t > 0.84) target.lerp(entry.endAnchor, THREE.MathUtils.smoothstep((t - 0.84) / 0.16, 0, 1));
  return target;
}

function linkKey(firstId, secondId) {
  return firstId < secondId ? `${firstId}:${secondId}` : `${secondId}:${firstId}`;
}

export function createConnectionCurve(first, second, surface = false) {
  const start = geoToSceneVector(first);
  const end = geoToSceneVector(second);
  if (surface) {
    const startDirection = start.clone().normalize();
    const endDirection = end.clone().normalize();
    const angle = Math.acos(THREE.MathUtils.clamp(startDirection.dot(endDirection), -1, 1));
    const sinAngle = Math.sin(angle);
    const radius = EARTH_RADIUS + SURFACE_LINK_ALTITUDE;
    const points = Array.from({ length: 33 }, (_, index) => {
      const t = index / 32;
      if (angle < 1e-6 || Math.abs(sinAngle) < 1e-6) return startDirection.clone().lerp(endDirection, t).normalize().multiplyScalar(radius);
      return startDirection.clone().multiplyScalar(Math.sin((1 - t) * angle) / sinAngle)
        .addScaledVector(endDirection, Math.sin(t * angle) / sinAngle)
        .normalize()
        .multiplyScalar(radius);
    });
    return new THREE.CatmullRomCurve3(points, false, "centripetal");
  }
  const midpoint = start.clone().add(end).multiplyScalar(0.5).normalize();
  const lift = Math.max(start.length(), end.length()) + 0.34;
  midpoint.multiplyScalar(lift);
  return new THREE.QuadraticBezierCurve3(start, midpoint, end);
}

export function applyEndpointAppearance(group, enabled) {
  const data = group.userData;
  const size = screenObjectSize(data.appearanceType, data.baseSize, enabled);
  group.scale.setScalar(size);
  data.stemHeight = GROUND_NODE_STEM_HEIGHT * size;
  data.signalRadius = screenFieldRadius(data.baseSignalRadius, enabled);
}

function addEndpoint(layer, glyphGeometry, latitude, longitude, size = 1, iconBackdropStyle = DEFAULT_NODE_ICON_BACKDROP_STYLE) {
  const group = new THREE.Group();
  group.scale.setScalar(size);
  const materialOptions = {
    transparent: true,
    depthWrite: false,
    depthTest: true,
    side: THREE.DoubleSide,
    toneMapped: false,
  };
  const markerCenterY = GROUND_NODE_STEM_HEIGHT;
  const billboard = new THREE.Group();
  const markerFill = new THREE.Mesh(
    new THREE.CircleGeometry(0.084, 96),
    new THREE.MeshBasicMaterial({ ...materialOptions, color: iconBackdropStyle.color, opacity: iconBackdropStyle.opacity }),
  );
  markerFill.position.set(0, markerCenterY, 0.002);
  markerFill.renderOrder = 8;
  const markerBorder = new THREE.Mesh(
    new THREE.RingGeometry(0.079, 0.084, 96),
    new THREE.MeshBasicMaterial({ ...materialOptions, color: 0x659dfc, opacity: 1 }),
  );
  markerBorder.position.set(0, markerCenterY, 0.004);
  markerBorder.renderOrder = 9;
  const glyph = new THREE.Mesh(
    glyphGeometry || new THREE.BufferGeometry(),
    new THREE.MeshBasicMaterial({ ...materialOptions, color: 0xeff5ff, opacity: 1 }),
  );
  glyph.position.set(0, markerCenterY, 0.007);
  glyph.renderOrder = 10;
  billboard.add(markerFill, markerBorder, glyph);
  const stem = createVerticalNodeStem(markerCenterY, 0.084);
  billboard.add(stem.group);
  group.add(billboard);
  const anchor = createNodeAnchor({ includeHitTarget: false });
  const anchorPosition = geoToSceneVector({ latitude, longitude, altitude: NODE_SURFACE_ALTITUDE });
  const surfaceNormal = anchorPosition.clone().normalize();
  anchor.group.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), surfaceNormal);
  group.add(anchor.group);
  group.position.copy(anchorPosition);
  const visualMaterials = [
    markerFill.material,
    markerBorder.material,
    glyph.material,
    ...stem.visualMaterials,
    ...anchor.group.userData.visualMaterials,
  ];
  for (const material of visualMaterials) material.userData.baseOpacity = material.opacity;
  applyMaterialPresence(visualMaterials, 0);
  group.userData = {
    billboard,
    stemHeight: markerCenterY * size,
    visualMaterials,
    presence: 0,
    targetPresence: 1,
    removing: false,
  };
  attachConnectionContour(group);
  layer.add(group);
  return group;
}

async function loadSvgIconGeometry(loader, url, targetWidth) {
  const data = await loader.loadAsync(url);
  return svgIconGeometry(data, targetWidth);
}
export function svgIconGeometry(data, targetWidth = 0.18) {
  const parts = [];
  for (const path of data.paths) {
    const style = path.userData?.style || {};
    if (style.fill && style.fill !== "none") {
      for (const shape of SVGLoader.createShapes(path)) parts.push(new THREE.ShapeGeometry(shape, 18));
    }
    if (style.stroke && style.stroke !== "none") {
      for (const subPath of path.subPaths) {
        const geometry = SVGLoader.pointsToStroke(subPath.getPoints(24), style, 12, 0.0001);
        if (geometry) parts.push(geometry);
      }
    }
  }
  if (!parts.length) throw new Error("SVG не содержит отображаемой геометрии");
  const mergeable = parts.map((geometry) => geometry.index ? geometry.toNonIndexed() : geometry);
  const merged = BufferGeometryUtils.mergeGeometries(mergeable, false);
  for (const geometry of new Set([...parts, ...mergeable])) if (geometry !== merged) geometry.dispose();
  if (!merged) throw new Error("Не удалось объединить SVG-геометрию");
  merged.computeBoundingBox();
  const bounds = merged.boundingBox;
  const width = Math.max(0.0001, bounds.max.x - bounds.min.x);
  const height = Math.max(0.0001, bounds.max.y - bounds.min.y);
  const scale = targetWidth / Math.max(width, height);
  const centerX = (bounds.min.x + bounds.max.x) * 0.5;
  const centerY = (bounds.min.y + bounds.max.y) * 0.5;
  merged.translate(-centerX, -centerY, 0);
  merged.scale(scale, -scale, 1);
  merged.userData.shared = true;
  return merged;
}

function createStars() {
  const count = 500;
  const positions = new Float32Array(count * 3);
  for (let index = 0; index < count; index += 1) {
    const radius = 14 + (index % 17) * 0.31;
    const theta = index * 2.399963;
    const y = 1 - (index / (count - 1)) * 2;
    const width = Math.sqrt(1 - y * y);
    positions[index * 3] = Math.cos(theta) * width * radius;
    positions[index * 3 + 1] = y * radius;
    positions[index * 3 + 2] = Math.sin(theta) * width * radius;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  return new THREE.Points(geometry, new THREE.PointsMaterial({ color: 0x7994bd, size: 0.025, transparent: true, opacity: 0.62 }));
}

function disposeObject(root) {
  root.traverse((object) => {
    if (!object.geometry?.userData?.shared) object.geometry?.dispose?.();
    if (Array.isArray(object.material)) object.material.forEach((material) => material.dispose());
    else object.material?.dispose?.();
  });
}

function attachConnectionContour(group) {
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.995, 1.005, 96), new THREE.MeshBasicMaterial({
    color: 0x659dfc, transparent: true, opacity: 0, depthTest: false, depthWrite: false, toneMapped: false, side: THREE.DoubleSide,
  }));
  ring.visible = false;
  ring.renderOrder = 5;
  group.add(ring);
  group.userData.connectionContour = ring;
}
export function updateConnectionContour(group, enabled, quaternion) {
  const ring = group.userData.connectionContour;
  if (!ring) return;
  ring.visible = Boolean(enabled) && SCREEN_APPEARANCE.showRangeCircle !== false && !group.userData.removing;
  if (!ring.visible) return;
  ring.quaternion.copy(quaternion);
  ring.position.set(0, group.userData.stemHeight / group.scale.x, 0).applyQuaternion(quaternion);
  ring.scale.setScalar(group.userData.signalRadius / group.scale.x);
  ring.material.opacity = group.userData.presence * 0.4;
  ring.material.color.setHex(group.userData.targetVisual?.linked > 0 ? 0x4edbb5 : 0x659dfc);
}

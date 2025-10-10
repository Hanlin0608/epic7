import { PoseLandmarker, FilesetResolver, DrawingUtils } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/vision_bundle.mjs";

const MODEL_URL = "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/1/pose_landmarker_full.task";
const WASM_BASE = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm";

// Elements
const videoEl = document.getElementById("video");
const canvasEl = document.getElementById("canvas");
const ctx = canvasEl.getContext("2d");
const guideCanvas = document.getElementById("heroGuide") || document.getElementById("guide");
const guideCtx = guideCanvas ? guideCanvas.getContext("2d") : null;

const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const trainBtn = document.getElementById("trainBtn");
const modeSelect = document.getElementById("modeSelect");
const flowModeSelect = document.getElementById("flowMode");
const voiceToggle = document.getElementById("voiceToggle");
const statusEl = document.getElementById("status");
const fpsEl = document.getElementById("fps");
// Hide FPS display in the UI
fpsEl.style.display = "none";
const scoreEl = document.getElementById("score");
// Hide score display in the UI
scoreEl.style.display = "none";
const holdEl = document.getElementById("hold");
const completedEl = document.getElementById("completed");
const neckAngleEl = document.getElementById("neckAngle");
const hipAngleEl = document.getElementById("hipAngle");
const torsoTiltEl = document.getElementById("torsoTilt");
const verdictEl = document.getElementById("verdict");
const tipsEl = document.getElementById("tips");
const holdProgressFill = document.getElementById("holdProgressFill");

// Settings UI
const settingHoldSecEl = document.getElementById("settingHoldSec");
// reps removed
const settingPrimaryEl = document.getElementById("settingPrimary");
const settingPrimaryLabelEl = document.getElementById("settingPrimaryLabel");
const saveSettingsBtn = document.getElementById("saveSettingsBtn");
const resetSettingsBtn = document.getElementById("resetSettingsBtn");
const saveToast = document.getElementById("saveToast");
// Movement cards + mode buttons
const movementCardsEl = document.getElementById("movementCards");
const practiceModeBtn = document.getElementById("practiceModeBtn");
const scoreModeBtn = document.getElementById("scoreModeBtn");
// Hero elements
const moveLabelEl = document.getElementById("moveLabel");
const heroPracticeBtn = document.getElementById("heroPracticeBtn");
const heroPlayBtn = document.getElementById("heroPlayBtn");
const heroFinishBtn = document.getElementById("heroFinishBtn");
const heroTipEl = document.getElementById("heroTip");
const gameScoreEl = document.getElementById("gameScore");
// Settings modal elements
const settingBtn = document.getElementById("settingBtn");
const settingsModal = document.getElementById("settingsModal");
const modalHoldSec = document.getElementById("modalHoldSec");
// reps removed from modal
const modalCancelBtn = document.getElementById("modalCancelBtn");
const modalSaveBtn = document.getElementById("modalSaveBtn");
// voice moved to header icon
const voiceBtn = document.getElementById("voiceBtn");

// Celebration overlay
const celebrateEl = document.getElementById('celebrate');
const celebrateMsgEl = document.getElementById('celebrateMsg');

function showCelebration(message) {
  if (!celebrateEl || !celebrateMsgEl) return;
  celebrateMsgEl.textContent = message;
  // create sparks
  for (let i = 0; i < 18; i++) {
    const sp = document.createElement('div');
    sp.className = 'spark';
    const ang = (Math.PI * 2 * i) / 18;
    const r = 180 + Math.random()*60;
    sp.style.setProperty('--dx', `${Math.cos(ang) * r}px`);
    sp.style.setProperty('--dy', `${Math.sin(ang) * r}px`);
    celebrateEl.appendChild(sp);
    setTimeout(() => sp.remove(), 1200);
  }
  celebrateEl.style.display = 'flex';
  setTimeout(() => { celebrateEl.style.display = 'none'; }, 3000);
}

// Game page only

// State
let landmarker = null;
let stream = null;
let currentView = "game";
let rafId = null;
let drawingUtils = null;
let lastT = 0;
let lastDtSec = 0;
let smoothedFps = 0;
// Landmark smoothing buffer
let prevLandmarks = null;

// Thresholds per mode
const defaultThresholds = {
  chin_tuck: { primary: 55, label: "CVA threshold (°)", compare: ">=" },
  overhead_reach: { primary: 0.12, label: "Wrist above shoulder (norm)", compare: ">=" },
  side_bend: { primary: 12, label: "Side bend (°)", compare: ">=" },
  hamstring_hinge: { primary: 120, label: "Hip angle (°)", compare: "<=" },
  t_pose: { primary: 0.25, label: "Arm spread (norm)", compare: ">=" },
  // squat_hold removed from cards
  quad_stretch: { primary: 70, label: "Knee angle (°)", compare: "<=" },
  y_pose: { primary: 0.18, label: "Wrist above shoulder (norm)", compare: ">=" },
  high_knee_hold: { primary: 100, label: "Hip angle (°)", compare: "<=" },
  arm_circles: { primary: 0.10, label: "Wrist above shoulder (norm)", compare: ">=" },
  lunge: { primary: 110, label: "Front knee angle (°)", compare: "<=" },
};

function loadSettings() { try { const raw = localStorage.getItem("pose_demo_settings"); return raw ? JSON.parse(raw) : null; } catch { return null; } }
function saveSettings(s) { localStorage.setItem("pose_demo_settings", JSON.stringify(s)); }

let currentMode = "overhead_reach";
let flowMode = "manual"; // manual | auto
const exerciseOrder = [
  "overhead_reach",
  "side_bend",
  "hamstring_hinge",
  "t_pose",
  // removed lunge and quad_stretch from cards
  "y_pose",
  "high_knee_hold",
  "arm_circles",
];
let autoIndex = 0;
let userSettings = loadSettings() || { holdSeconds: 5, thresholds: { ...defaultThresholds } };
function getHoldTargetForMode() { return userSettings.holdSeconds || 5; }
function getRepsTarget() { return 1; }
function getPrimaryThreshold(mode) { return (userSettings.thresholds?.[mode]?.primary) ?? defaultThresholds[mode].primary; }
function getCompare(mode) { return (userSettings.thresholds?.[mode]?.compare) ?? defaultThresholds[mode].compare; }
function getPrimaryLabel(mode) { return (userSettings.thresholds?.[mode]?.label) ?? defaultThresholds[mode].label; }

let holdTargetSec = getHoldTargetForMode();
let holdSec = 0;
let completedCount = 0;
let completedTarget = getRepsTarget();
let requireRelease = false;
let training = false;
let practiceMode = true; // default practice mode on first load
let scoreMode = false;    // true when user chooses 计分模式
let totalScore = 0;
let totalSamples = 0;
let playStartMs = 0;
let overlayScorePercent = 0; // throttled & smoothed score for overlay
let lastOverlayUpdateMs = 0;
// Offscreen canvas for background blur
let blurCanvas = null; let blurCtx = null;

const tipsByMode = {
  overhead_reach: "Raise both arms overhead toward the ceiling without shrugging; hold.",
  side_bend: "Bend smoothly to one side while keeping the torso elongated; hold.",
  hamstring_hinge: "Hinge at the hips while keeping a neutral spine; hold.",
  t_pose: "Open both arms horizontally to shoulder height; relax neck and shoulders; hold.",
  // squat_hold removed from cards
  quad_stretch: "Stand on one leg and pull the opposite heel toward the glutes; keep knees together; hold.",
  y_pose: "Lift both arms into a wide 'Y' above shoulders; hold.",
  high_knee_hold: "Lift one knee above hip height and maintain balance; hold.",
  arm_circles: "Small overhead arm circles to mobilize the shoulders.",
  lunge: "Step into a lunge, front knee near 90°, knee tracks toes; hold.",
};

const cardDescriptions = {
  overhead_reach: "Shoulder mobility. Raise both arms.",
  side_bend: "Lateral flex. Bend smoothly.",
  hamstring_hinge: "Hip hinge. Neutral spine.",
  t_pose: "Posture & shoulder open.",
  quad_stretch: "Quad flexibility. Balance.",
  y_pose: "Scapular control. 'Y' raise.",
  high_knee_hold: "Hip flexion. Lift knee high.",
  arm_circles: "Shoulder mobility. Small overhead circles.",
  lunge: "Leg strength. Step into a lunge.",
};

function setStatus(text) { statusEl.textContent = text; }

// Utilities
function midpoint(a, b) { if (!a || !b) return null; return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }; }
function bestEar(landmarks) { const le = landmarks[7], re = landmarks[8]; const lv = le?.visibility ?? 0, rv = re?.visibility ?? 0; return (lv >= rv ? le || re : re || le); }
function computeCVAdeg(shoulderMid, ear) { if (!shoulderMid || !ear) return NaN; const dx = ear.x - shoulderMid.x; const dy = shoulderMid.y - ear.y; return Math.round(Math.max(0, Math.min(180, Math.atan2(dy, dx) * 180 / Math.PI))); }
function computeAngleDeg(a, b, c) { if (!a || !b || !c) return NaN; const v1x = a.x - b.x, v1y = a.y - b.y; const v2x = c.x - b.x, v2y = c.y - b.y; const dot = v1x * v2x + v1y * v2y; const n1 = Math.hypot(v1x, v1y), n2 = Math.hypot(v2x, v2y); if (!n1 || !n2) return NaN; let cos = dot / (n1 * n2); cos = Math.min(1, Math.max(-1, cos)); return Math.round(Math.acos(cos) * 180 / Math.PI); }
function compare(val, cmp, thr) { if (!Number.isFinite(val)) return false; if (cmp === ">=") return val >= thr; if (cmp === "<=") return val <= thr; return false; }

// Evaluators
function evalChinTuck(lm) { const thr = getPrimaryThreshold("chin_tuck"), cmp = getCompare("chin_tuck"); const shoulderMid = midpoint(lm[11], lm[12]); const ear = bestEar(lm); const cva = computeCVAdeg(shoulderMid, ear); const ok = compare(cva, cmp, thr); const score = ok ? 100 : Math.max(0, Math.min(100, Math.round((cva / Math.max(thr, 1e-6)) * 100))); return { primaryAngle: cva, ok, score }; }
function evalOverheadReach(lm) { const thr = getPrimaryThreshold("overhead_reach"), cmp = getCompare("overhead_reach"); const lS = lm[11], rS = lm[12], lW = lm[15], rW = lm[16]; if (!lS || !rS || !lW || !rW) return { ok:false, primaryAngle:NaN, score:0 }; const shoulderY = Math.min(lS.y, rS.y); const lM = Math.max(0, shoulderY - lW.y), rM = Math.max(0, shoulderY - rW.y); const avg = (lM + rM) / 2; const ok = compare(avg, cmp, thr); const score = ok ? 100 : Math.max(0, Math.min(100, Math.round((avg / Math.max(thr, 1e-6)) * 100))); return { ok, primaryAngle: Math.round(avg*100)/100, score }; }
function evalSideBend(lm) { const thr = getPrimaryThreshold("side_bend"), cmp = getCompare("side_bend"); const hipMid = midpoint(lm[23], lm[24]); const shoulderMid = midpoint(lm[11], lm[12]); if (!hipMid || !shoulderMid) return { ok:false, primaryAngle:NaN, score:0 }; const dx = shoulderMid.x - hipMid.x, dy = hipMid.y - shoulderMid.y; const tiltDeg = Math.abs(Math.atan2(Math.abs(dx), Math.max(1e-6, Math.abs(dy))) * 180 / Math.PI); const ok = compare(tiltDeg, cmp, thr); const score = Math.max(0, Math.min(100, Math.round((tiltDeg / Math.max(thr, 1e-6)) * 100))); return { ok, primaryAngle: Math.round(tiltDeg), score }; }
function evalHamstringHinge(lm) { const thr = getPrimaryThreshold("hamstring_hinge"), cmp = getCompare("hamstring_hinge"); const leftHip = computeAngleDeg(lm[11], lm[23], lm[25]); const rightHip = computeAngleDeg(lm[12], lm[24], lm[26]); const hip = Number.isFinite(leftHip) && Number.isFinite(rightHip) ? Math.min(leftHip, rightHip) : (Number.isFinite(leftHip) ? leftHip : rightHip); const ok = compare(hip, cmp, thr); const span = Math.max(1, Math.abs(180 - thr)); const score = Number.isFinite(hip) ? Math.max(0, Math.min(100, Math.round(((180 - hip) / span) * 100))) : 0; return { ok, primaryAngle: hip, score }; }
function evalTPose(lm) { const thr = getPrimaryThreshold("t_pose"), cmp = getCompare("t_pose"); const lS = lm[11], rS = lm[12], lW = lm[15], rW = lm[16]; if (!lS || !rS || !lW || !rW) return { ok:false, primaryAngle:NaN, score:0 }; const lSpread = Math.abs((lW.x ?? 0) - (lS.x ?? 0)); const rSpread = Math.abs((rW.x ?? 0) - (rS.x ?? 0)); const avg = (lSpread + rSpread) / 2; const ok = compare(avg, cmp, thr); const score = Math.max(0, Math.min(100, Math.round((avg / Math.max(thr, 1e-6)) * 100))); return { ok, primaryAngle: Math.round(avg * 100) / 100, score }; }
function evalSquatHold(lm) { const thr = getPrimaryThreshold("squat_hold"), cmp = getCompare("squat_hold"); const lk = computeAngleDeg(lm[23], lm[25], lm[27]); const rk = computeAngleDeg(lm[24], lm[26], lm[28]); const knee = Number.isFinite(lk) && Number.isFinite(rk) ? Math.min(lk, rk) : (Number.isFinite(lk) ? lk : rk); const ok = compare(knee, cmp, thr); const span = Math.max(1, Math.abs(thr)); const score = Number.isFinite(knee) ? Math.max(0, Math.min(100, Math.round(((Math.max(thr, 1) - Math.min(knee, thr)) / span) * 100))) : 0; return { ok, primaryAngle: knee, score }; }
function evalQuadStretch(lm) { const thr = getPrimaryThreshold("quad_stretch"), cmp = getCompare("quad_stretch"); const lk = computeAngleDeg(lm[23], lm[25], lm[27]); const rk = computeAngleDeg(lm[24], lm[26], lm[28]); const knee = Number.isFinite(lk) && Number.isFinite(rk) ? Math.min(lk, rk) : (Number.isFinite(lk) ? lk : rk); const ok = compare(knee, cmp, thr); const score = Number.isFinite(knee) ? Math.max(0, Math.min(100, Math.round(((Math.max(thr, 1) - Math.min(knee, thr)) / Math.max(1, thr)) * 100))) : 0; return { ok, primaryAngle: knee, score }; }
function evalYPose(lm) { const thr = getPrimaryThreshold("y_pose"), cmp = getCompare("y_pose"); const lS = lm[11], rS = lm[12], lW = lm[15], rW = lm[16]; if (!lS || !rS || !lW || !rW) return { ok:false, primaryAngle:NaN, score:0 }; const shoulderY = Math.min(lS.y, rS.y); const lM = Math.max(0, shoulderY - lW.y), rM = Math.max(0, shoulderY - rW.y); const avg = (lM + rM) / 2; const ok = compare(avg, cmp, thr); const score = Math.max(0, Math.min(100, Math.round((avg / Math.max(thr, 1e-6)) * 100))); return { ok, primaryAngle: Math.round(avg*100)/100, score }; }
// arm circles 评估：手腕高于肩的归一化高度（与 overhead_reach 相同口径）
function evalArmCircles(lm) { const thr = getPrimaryThreshold("arm_circles"), cmp = getCompare("arm_circles"); const lS = lm[11], rS = lm[12], lW = lm[15], rW = lm[16]; if (!lS || !rS || !lW || !rW) return { ok:false, primaryAngle:NaN, score:0 }; const shoulderY = Math.min(lS.y, rS.y); const lM = Math.max(0, shoulderY - lW.y), rM = Math.max(0, shoulderY - rW.y); const avg = (lM + rM) / 2; const ok = compare(avg, cmp, thr); const score = ok ? 100 : Math.max(0, Math.min(100, Math.round((avg / Math.max(thr, 1e-6)) * 100))); return { ok, primaryAngle: Math.round(avg*100)/100, score }; }

// lunge 评估：取较小的膝角作为前腿角度，目标越小越好
function evalLunge(lm) {
  const thr = getPrimaryThreshold("lunge"), cmp = getCompare("lunge");
  const lk = computeAngleDeg(lm[23], lm[25], lm[27]);
  const rk = computeAngleDeg(lm[24], lm[26], lm[28]);
  const frontKnee = Number.isFinite(lk) && Number.isFinite(rk) ? Math.min(lk, rk) : (Number.isFinite(lk) ? lk : rk);
  const ok = compare(frontKnee, cmp, thr);
  const score = Number.isFinite(frontKnee) ? Math.max(0, Math.min(100, Math.round(((Math.max(thr, 1) - Math.min(frontKnee, thr)) / Math.max(1, thr)) * 100))) : 0;
  return { ok, primaryAngle: frontKnee, score };
}
function evalHighKneeHold(lm) { const thr = getPrimaryThreshold("high_knee_hold"), cmp = getCompare("high_knee_hold"); const lh = computeAngleDeg(lm[11], lm[23], lm[25]); const rh = computeAngleDeg(lm[12], lm[24], lm[26]); const hipFlex = Number.isFinite(lh) && Number.isFinite(rh) ? Math.min(lh, rh) : (Number.isFinite(lh) ? lh : rh); const ok = compare(hipFlex, cmp, thr); const span = Math.max(1, Math.abs(thr)); const score = Number.isFinite(hipFlex) ? Math.max(0, Math.min(100, Math.round(((Math.max(thr, 1) - Math.min(hipFlex, thr)) / span) * 100))) : 0; return { ok, primaryAngle: hipFlex, score }; }

let voiceEnabled = true;
function updateVoiceUI() { try { if (!voiceBtn) return; voiceBtn.classList.toggle('muted', !voiceEnabled); } catch {} }
function speak(text) { 
  try { 
    if (!voiceEnabled) return; 
    const u = new SpeechSynthesisUtterance(text); 
    u.lang = "en-US"; 
    u.rate = 0.95; // Slightly slower for clarity
    u.pitch = 1.1; // Slightly higher pitch for friendliness
    u.volume = 1.0; // Full volume
    window.speechSynthesis.cancel(); 
    window.speechSynthesis.speak(u); 
  } catch {} 
}

function renderEval(mode, ev) {
  neckAngleEl.textContent = "-"; hipAngleEl.textContent = "-"; torsoTiltEl.textContent = "-";
  let verdictMsg = ""; let score = ev.score ?? 0;
  if (mode === "chin_tuck") { neckAngleEl.textContent = Number.isFinite(ev.primaryAngle) ? ev.primaryAngle : "-"; verdictMsg = ev.ok ? "Chin tuck OK" : "Tuck chin gently and retract head"; }
  else if (mode === "overhead_reach") { verdictMsg = ev.ok ? "Overhead reach OK" : "Raise arms higher, avoid shrugging"; }
  else if (mode === "side_bend") { torsoTiltEl.textContent = Number.isFinite(ev.primaryAngle) ? ev.primaryAngle : "-"; verdictMsg = ev.ok ? "Side bend OK" : "Bend further to the side smoothly"; }
  else if (mode === "hamstring_hinge") { hipAngleEl.textContent = Number.isFinite(ev.primaryAngle) ? ev.primaryAngle : "-"; verdictMsg = ev.ok ? "Hinge OK" : "Hinge from hips, keep neutral spine"; }
  else if (mode === "t_pose") { verdictMsg = ev.ok ? "T pose OK" : "Open arms horizontally to shoulder height"; }
  else if (mode === "lunge") { hipAngleEl.textContent = Number.isFinite(ev.primaryAngle) ? ev.primaryAngle : "-"; verdictMsg = ev.ok ? "Lunge OK" : "Bend front knee toward ~90°, track toes"; }
  else if (mode === "quad_stretch") { hipAngleEl.textContent = Number.isFinite(ev.primaryAngle) ? ev.primaryAngle : "-"; verdictMsg = ev.ok ? "Quad stretch OK" : "Bring heel closer to glutes, keep balance"; }
  else if (mode === "y_pose") { verdictMsg = ev.ok ? "Y raise OK" : "Lift arms into 'Y', wrists above shoulders"; }
  else if (mode === "lunge_hold") { verdictMsg = ev.ok ? "Lunge hold OK" : "Bend front knee toward ~90°, track toes"; }
  else if (mode === "high_knee_hold") { verdictMsg = ev.ok ? "High knee OK" : "Raise knee higher to reduce hip angle"; }
  verdictEl.textContent = verdictMsg; scoreEl.textContent = `Score: ${Math.round(score)}`; return verdictMsg;
}

// Camera + model init
async function createLandmarker() {
  if (landmarker) return landmarker;
  const resolver = await FilesetResolver.forVisionTasks(WASM_BASE);
  landmarker = await PoseLandmarker.createFromOptions(resolver, {
    baseOptions: { modelAssetPath: MODEL_URL },
    runningMode: "VIDEO",
    numPoses: 1,
    minPoseDetectionConfidence: 0.5,
    minPosePresenceConfidence: 0.5,
    minTrackingConfidence: 0.5,
  });
  drawingUtils = new DrawingUtils(ctx);
  return landmarker;
}

function updateFps(t) {
  if (lastT) { const dt = (t - lastT) / 1000; lastDtSec = dt; const fps = 1 / Math.max(1e-6, dt); smoothedFps = smoothedFps ? smoothedFps * 0.9 + fps * 0.1 : fps; fpsEl.textContent = `FPS: ${smoothedFps.toFixed(1)}`; }
  lastT = t;
}

function drawVideoMirrored() {
  ctx.save();
  ctx.scale(-1, 1);
  ctx.translate(-canvasEl.width, 0);
  ctx.drawImage(videoEl, 0, 0, canvasEl.width, canvasEl.height);
}

function drawVideoMirroredTo(targetCtx) {
  targetCtx.save();
  targetCtx.scale(-1, 1);
  targetCtx.translate(-canvasEl.width, 0);
  targetCtx.drawImage(videoEl, 0, 0, canvasEl.width, canvasEl.height);
  targetCtx.restore();
}

function loop(t = performance.now()) {
  rafId = requestAnimationFrame(loop);
  updateFps(t);
  ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
  drawVideoMirrored();

  let result = null;
  try { result = landmarker.detectForVideo(videoEl, t); } catch (e) { console.error(e); setStatus("Detection failed"); }

  if (result && result.landmarks && result.landmarks[0]) {
    const raw = result.landmarks[0];
    // Exponential smoothing to reduce flicker in fast arm moves (e.g., arm_circles)
    let lm = raw;
    try {
      if (prevLandmarks && prevLandmarks.length === raw.length) {
        const beta = 0.7; // higher means steadier
        lm = raw.map((p, i) => {
          const q = prevLandmarks[i] || p;
          return {
            x: q.x * beta + p.x * (1 - beta),
            y: q.y * beta + p.y * (1 - beta),
            z: (q.z ?? 0) * beta + (p.z ?? 0) * (1 - beta),
            visibility: Math.max(q.visibility ?? 0, p.visibility ?? 0),
          };
        });
      }
      prevLandmarks = lm;
    } catch {}

    drawingUtils.drawLandmarks(lm, { color: "#22d3ee", radius: 3 });
    drawingUtils.drawConnectors(lm, PoseLandmarker.POSE_CONNECTIONS, { color: "#818cf8", lineWidth: 2 });

    let ev = null;
    if (currentMode === "chin_tuck") ev = evalChinTuck(lm);
    else if (currentMode === "overhead_reach") ev = evalOverheadReach(lm);
    else if (currentMode === "side_bend") ev = evalSideBend(lm);
    else if (currentMode === "hamstring_hinge") ev = evalHamstringHinge(lm);
    else if (currentMode === "t_pose") ev = evalTPose(lm);
    else if (currentMode === "squat_hold") ev = evalSquatHold(lm);
    else if (currentMode === "quad_stretch") ev = evalQuadStretch(lm);
    else if (currentMode === "y_pose") ev = evalYPose(lm);
    else if (currentMode === "lunge") ev = evalLunge(lm);
    else if (currentMode === "arm_circles") ev = evalArmCircles(lm);
    else if (currentMode === "high_knee_hold") ev = evalHighKneeHold(lm);

    const verdictMsg = renderEval(currentMode, ev);
    if (ev && typeof ev.score === 'number') {
      const nowMs = performance.now();
      if (nowMs - lastOverlayUpdateMs >= 300) { // update at ~3 fps
        const target = Math.round(ev.score);
        overlayScorePercent = Math.round(overlayScorePercent * 0.7 + target * 0.3); // smooth
        lastOverlayUpdateMs = nowMs;
      }
    }

    // Gesture navigation: Hands down (hold 1s) -> next, Hands on shoulders (hold 1s) -> previous
    try {
      if (practiceMode) {
        const lS = lm[11], rS = lm[12];
        const lW = lm[15], rW = lm[16];
        const lH = lm[23], rH = lm[24]; // left hip, right hip
        const shoulderY = Math.min(lS?.y ?? 1, rS?.y ?? 1);
        const hipY = Math.max(lH?.y ?? 0, rH?.y ?? 0);
        const now = performance.now(); 
        if (!loop.gestureHoldStart) loop.gestureHoldStart = 0;
        if (!loop.lastGestureType) loop.lastGestureType = null;

        // Detect hands naturally down: both wrists below hips, arms relaxed
        function isHandsDown() {
          if (!lW || !rW) return false;
          const lBelowHip = lW.y > hipY - 0.05; // left wrist at or below hip
          const rBelowHip = rW.y > hipY - 0.05; // right wrist at or below hip
          const handsApart = Math.abs(lW.x - rW.x) > 0.15; // hands separated (not together)
          return lBelowHip && rBelowHip && handsApart;
        }
        
        // Detect hands on shoulders: each wrist near its respective shoulder
        function isHandsOnShoulders() {
          if (!lW || !rW || !lS || !rS) return false;
          const lDist = Math.hypot(lW.x - lS.x, lW.y - lS.y);
          const rDist = Math.hypot(rW.x - rS.x, rW.y - rS.y);
          return lDist < 0.15 && rDist < 0.15;
        }

        const handsDown = isHandsDown();
        const handsOnShoulders = isHandsOnShoulders();
        const currentGesture = handsDown ? 'down' : (handsOnShoulders ? 'shoulders' : null);

        // Track gesture hold duration and cooldown between switches
        if (!loop.lastGestureSwitchTime) loop.lastGestureSwitchTime = 0;
        const timeSinceLastSwitch = now - loop.lastGestureSwitchTime;
        
        if (currentGesture && currentGesture === loop.lastGestureType) {
          const holdDuration = now - loop.gestureHoldStart;
          if (holdDuration >= 3000 && timeSinceLastSwitch >= 3000) { // 3 second hold + 3 second cooldown
            if (currentGesture === 'down') {
              const idx = Math.max(0, exerciseOrder.indexOf(currentMode));
              const nextIdx = (idx + 1 + exerciseOrder.length) % exerciseOrder.length;
              const nextMode = exerciseOrder[nextIdx];
              navigateExercise(1);
              // Speak direction and tip for the new exercise
              const tip = tipsByMode[nextMode];
              speak(tip ? `Next movement! Tip: ${tip}` : 'Next movement!');
              loop.lastGestureSwitchTime = now;
            } else if (currentGesture === 'shoulders') {
              const idx = Math.max(0, exerciseOrder.indexOf(currentMode));
              const nextIdx = (idx - 1 + exerciseOrder.length) % exerciseOrder.length;
              const nextMode = exerciseOrder[nextIdx];
              navigateExercise(-1);
              // Speak direction and tip for the new exercise
              const tip = tipsByMode[nextMode];
              speak(tip ? `Previous movement! Tip: ${tip}` : 'Previous movement!');
              loop.lastGestureSwitchTime = now;
            }
            loop.gestureHoldStart = now + 3000; // prevent rapid trigger
            loop.lastGestureType = null;
          }
        } else {
          loop.gestureHoldStart = now;
          loop.lastGestureType = currentGesture;
        }
      }
    } catch {}

    if (scoreMode && ev && Number.isFinite(ev.score)) { totalScore += ev.score; totalSamples += 1; }

    if (training) {
      if (ev && ev.ok && !requireRelease) {
        holdSec += lastDtSec || 0;
        if (holdSec >= holdTargetSec) {
          completedCount += 1; requireRelease = true; holdSec = 0;
          completedEl.textContent = `Completed: ${completedCount}/${completedTarget}`;
          speak(verdictMsg + ", one rep done");
          try { const name = titleForMode(currentMode); showCelebration(`${name} completed!`); } catch {}
          if (completedCount >= completedTarget) {
            if (flowMode === "auto") {
              // advance to next exercise
              autoIndex = (exerciseOrder.indexOf(currentMode) + 1);
              if (autoIndex >= exerciseOrder.length) {
                training = false; trainBtn.textContent = "Start Training";
                if (scoreMode) {
                  const quality = Math.round(totalScore / Math.max(1, totalSamples));
                  const elapsedSec = Math.max(1, Math.round((performance.now() - playStartMs)/1000));
                  const speedFactor = Math.max(0, Math.min(100, Math.round(100 * (1 - Math.min(1, elapsedSec / (exerciseOrder.length * (holdTargetSec + 2)))))));
                  // More generous scoring: boost quality score and increase base score
                  const boostedQuality = Math.min(100, Math.round(quality * 1.3 + 15)); // 30% boost + 15 base points
                  const boostedSpeed = Math.min(100, Math.round(speedFactor * 1.2 + 10)); // 20% boost + 10 base points
                  const finalScore = Math.round(0.7 * boostedQuality + 0.3 * boostedSpeed);
                  verdictEl.textContent = `Final score: ${finalScore}`;
                  if (gameScoreEl) gameScoreEl.textContent = `Score: ${finalScore}`;
                  // Encouraging feedback based on score
                  let scoreMsg = finalScore >= 80 ? `Excellent work! Your final score is ${finalScore}!` :
                                 finalScore >= 60 ? `Great job! You scored ${finalScore}!` :
                                 finalScore >= 40 ? `Good effort! Your score is ${finalScore}. Keep practicing!` :
                                 `Nice try! You scored ${finalScore}. You'll do even better next time!`;
                  speak(scoreMsg);
                  scoreMode = false; totalScore = 0; totalSamples = 0;
                } else {
                  verdictEl.textContent = "All exercises done"; speak("Fantastic! You've completed all exercises!");
                }
              } else {
                currentMode = exerciseOrder[autoIndex];
                modeSelect.value = currentMode;
                if (moveLabelEl) moveLabelEl.textContent = `Move: ${titleForMode(currentMode)}`;
                holdTargetSec = getHoldTargetForMode();
                completedTarget = getRepsTarget();
                resetCounters();
                verdictEl.textContent = "Switched to next";
                speak("Switching to next exercise");
              }
            } else {
              // Manual practice mode: keep camera and detection running; allow continuous practice
              // Reset counters for next attempt, continue training
              completedCount = 0; requireRelease = true; holdSec = 0;
              completedEl.textContent = `Completed: ${completedCount}/${completedTarget}`;
              verdictEl.textContent = "Keep practicing or use sign to switch";
              speak("Good job. Keep practicing or try to play the game");
            }
          }
        }
      } else {
        if (!ev || !ev.ok) { if (requireRelease) requireRelease = false; holdSec = 0; }
      }
      holdEl.textContent = `Hold: ${holdSec.toFixed(1)}s / ${holdTargetSec}s`;
      if (holdProgressFill) { const pct = Math.max(0, Math.min(100, (holdSec / Math.max(1e-6, holdTargetSec)) * 100)); holdProgressFill.style.width = `${pct}%`; }
    } else {
      holdEl.textContent = `Hold: 0.0s / ${holdTargetSec}s`;
      if (holdProgressFill) holdProgressFill.style.width = "0%";
    }
  } else {
    verdictEl.textContent = "No person detected";
    scoreEl.textContent = "Score: -";
    neckAngleEl.textContent = "-"; hipAngleEl.textContent = "-"; torsoTiltEl.textContent = "-";
    holdEl.textContent = `Hold: 0.0s / ${holdTargetSec}s`;
    if (holdProgressFill) holdProgressFill.style.width = "0%";
  }

  // Optional: drawPoseMask and animated guide removed per request for a clean view
  ctx.restore();
  // Draw score overlay (not mirrored)
  try { drawFitOverlay(overlayScorePercent); } catch {}
}

async function start() {
  startBtn.disabled = true;
  try {
    await createLandmarker();
    setStatus("Requesting camera…");
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: 960, height: 720 } });
    videoEl.srcObject = stream;
    await videoEl.play();

    // Match canvas to video and fit inside hero circle
    const vw = videoEl.videoWidth || 960;
    const vh = videoEl.videoHeight || 720;
    // keep aspect ratio but clamp to available size
    const container = document.getElementById('heroCircle') || canvasEl.parentElement;
    const rect = container.getBoundingClientRect();
    const scale = Math.min(rect.width / vw, rect.height / vh);
    canvasEl.width = Math.round(vw * scale);
    canvasEl.height = Math.round(vh * scale);
  // init blur offscreen canvas
  blurCanvas = document.createElement('canvas'); blurCanvas.width = canvasEl.width; blurCanvas.height = canvasEl.height; blurCtx = blurCanvas.getContext('2d');

    setStatus("Running");
    stopBtn.disabled = false;
    trainBtn.disabled = false;

    if (!rafId) loop();
  } catch (e) {
    console.error(e);
    setStatus("Camera or model init failed");
    startBtn.disabled = false;
  }
}

function stop() {
  if (rafId) cancelAnimationFrame(rafId);
  rafId = null;
  if (stream) stream.getTracks().forEach(t => t.stop());
  stream = null;
  training = false; trainBtn.textContent = "Start Training";
  setStatus("Stopped");
  stopBtn.disabled = true; startBtn.disabled = false; trainBtn.disabled = true;
}

// Guide animator (left card)
function resizeGuide() {
  const rect = guideCanvas.getBoundingClientRect();
  const dpr = Math.max(1, Math.floor(window.devicePixelRatio || 1));
  guideCanvas.width = Math.max(1, Math.floor(rect.width * dpr));
  guideCanvas.height = Math.max(1, Math.floor(rect.height * dpr));
  guideCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
window.addEventListener("resize", resizeGuide);
resizeGuide();

function drawStickFigure(mode, phase) {
  // 为保证一致性：检测区复用 Movement Card 的火柴人渲染
  const g = guideCtx; if (!g || !guideCanvas) return; const W = guideCanvas.width / (window.devicePixelRatio || 1), H = guideCanvas.height / (window.devicePixelRatio || 1);
  // 关键：每帧清除引导画布，避免产生累积的“填充轨迹”
  g.clearRect(0, 0, W, H);
  // 放大检测区火柴人（不影响卡片）：scale 1.35，并略微上移
  renderStickFigure(g, W, H, phase, currentMode, 1.35, -H*0.06);
}

(function guideLoop() {
  const now = performance.now() / 1000; const phase = (now % 2) / 2; // 0..1
  drawStickFigure(currentMode, phase);
  requestAnimationFrame(guideLoop);
})();

function drawRoundedRect(g, x, y, w, h, r) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.lineTo(x + w - r, y);
  g.quadraticCurveTo(x + w, y, x + w, y + r);
  g.lineTo(x + w, y + h - r);
  g.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  g.lineTo(x + r, y + h);
  g.quadraticCurveTo(x, y + h, x, y + h - r);
  g.lineTo(x, y + r);
  g.quadraticCurveTo(x, y, x + r, y);
  g.closePath();
}

function drawFitOverlay(pct) {
  if (!Number.isFinite(pct) || !canvasEl) return;
  const g = ctx; const W = canvasEl.width, H = canvasEl.height;
  const label = `Fit: ${Math.max(0, Math.min(100, Math.round(pct)))}%`;
  const paddingX = 20, paddingY = 14; g.save(); g.font = '800 42px system-ui, -apple-system, Segoe UI, Roboto'; // Larger font
  const textW = g.measureText(label).width; const pillW = textW + paddingX * 2; const pillH = 64; // Larger pill
  const x = Math.round(W - pillW - 20); const y = 20; // top-right corner
  g.globalAlpha = 0.95; g.fillStyle = 'rgba(2,6,23,0.75)'; g.strokeStyle = 'rgba(148,163,184,0.7)';
  drawRoundedRect(g, x, y, pillW, pillH, 16); g.fill(); g.lineWidth = 2; g.stroke();
  g.globalAlpha = 1; g.fillStyle = '#f0f9ff'; g.textBaseline = 'middle'; g.fillText(label, x + paddingX, y + pillH / 2);
  g.restore();
}

// ---- Pose mask (guide frame) ----
function fillRotatedRect(ctx2, cx, cy, w, h, angleRad) {
  ctx2.save(); ctx2.translate(cx, cy); ctx2.rotate(angleRad); ctx2.fillRect(-w/2, -h/2, w, h); ctx2.restore();
}
function strokeRotatedRect(ctx2, cx, cy, w, h, angleRad) {
  ctx2.save(); ctx2.translate(cx, cy); ctx2.rotate(angleRad); ctx2.strokeRect(-w/2, -h/2, w, h); ctx2.restore();
}

function poseFrameParams(mode) {
  const base = { torso: 0.30, leg: 0.34, arm: 0.40, armAngle: Math.PI/6, legAngle: Math.PI/6, torsoTilt: 0 };
  if (mode === 't_pose') base.armAngle = 0;
  if (mode === 'y_pose' || mode === 'overhead_reach') base.armAngle = Math.PI/3;
  if (mode === 'side_bend') base.torsoTilt = -Math.PI/12;
  if (mode === 'hamstring_hinge') base.torsoTilt = -Math.PI/6;
  if (mode === 'lunge_hold') base.legAngle = Math.PI/12;
  return base;
}

function strokeRound(ctx2, x1,y1,x2,y2, lw) {
  ctx2.lineWidth = lw; ctx2.lineCap = 'round'; ctx2.beginPath(); ctx2.moveTo(x1,y1); ctx2.lineTo(x2,y2); ctx2.stroke();
}

function drawSmoothGuideFill(ctx2, mode) {
  const W = canvasEl.width, H = canvasEl.height; const cx = W/2, cy = H*0.62; const p = poseFrameParams(mode);
  const torsoLen = H * p.torso; const legLen = H * p.leg; const armLen = H * p.arm; const headR = H * 0.075;
  // Increase cutout thickness so clear area更大
  const lw = Math.max(32, H*0.13);
  ctx2.save(); ctx2.translate(cx, cy); ctx2.rotate(p.torsoTilt); ctx2.strokeStyle = '#000';
  // torso
  strokeRound(ctx2, 0,0, 0,-torsoLen, lw);
  // arms
  strokeRound(ctx2, 0,-torsoLen, -Math.cos(p.armAngle)*armLen, -torsoLen - Math.sin(p.armAngle)*armLen, lw);
  strokeRound(ctx2, 0,-torsoLen,  Math.cos(p.armAngle)*armLen, -torsoLen - Math.sin(p.armAngle)*armLen, lw);
  // legs
  strokeRound(ctx2, 0,0, -Math.sin(p.legAngle)*legLen,  Math.cos(p.legAngle)*legLen, lw);
  strokeRound(ctx2, 0,0,  Math.sin(p.legAngle)*legLen,  Math.cos(p.legAngle)*legLen, lw);
  ctx2.restore();
  // head (not tilted)
  ctx2.save(); ctx2.strokeStyle = '#000'; ctx2.lineWidth = headR*2; ctx2.beginPath(); ctx2.arc(cx, cy - torsoLen - headR*1.2, headR, 0, Math.PI*2); ctx2.stroke(); ctx2.restore();
}

function drawSmoothGuideOutline(ctx2, mode) {
  const W = canvasEl.width, H = canvasEl.height; const cx = W/2, cy = H*0.62; const p = poseFrameParams(mode);
  const torsoLen = H * p.torso; const legLen = H * p.leg; const armLen = H * p.arm; const headR = H * 0.075;
  const lw = Math.max(4, H*0.01);
  ctx2.save(); ctx2.translate(cx, cy); ctx2.rotate(p.torsoTilt); ctx2.strokeStyle = 'rgba(226,232,240,0.95)';
  strokeRound(ctx2, 0,0, 0,-torsoLen, lw);
  strokeRound(ctx2, 0,-torsoLen, -Math.cos(p.armAngle)*armLen, -torsoLen - Math.sin(p.armAngle)*armLen, lw);
  strokeRound(ctx2, 0,-torsoLen,  Math.cos(p.armAngle)*armLen, -torsoLen - Math.sin(p.armAngle)*armLen, lw);
  strokeRound(ctx2, 0,0, -Math.sin(p.legAngle)*legLen,  Math.cos(p.legAngle)*legLen, lw);
  strokeRound(ctx2, 0,0,  Math.sin(p.legAngle)*legLen,  Math.cos(p.legAngle)*legLen, lw);
  ctx2.restore();
  ctx2.save(); ctx2.strokeStyle = 'rgba(226,232,240,0.95)'; ctx2.lineWidth = lw; ctx2.beginPath(); ctx2.arc(cx, cy - torsoLen - headR*1.2, headR, 0, Math.PI*2); ctx2.stroke(); ctx2.restore();
}

function drawPoseMask(mode) {
  if (!blurCtx || !blurCanvas) return;
  // build blurred copy of the current frame
  blurCtx.clearRect(0,0,blurCanvas.width, blurCanvas.height);
  blurCtx.save(); blurCtx.filter = 'blur(8px)'; drawVideoMirroredTo(blurCtx); blurCtx.restore();
  // overlay blurred layer
  ctx.save();
  ctx.drawImage(blurCanvas, 0, 0);
  // punch hole for silhouette
  ctx.globalCompositeOperation = 'destination-out';
  drawSmoothGuideFill(ctx, mode);
  ctx.globalCompositeOperation = 'source-over';
  // outline to guide
  drawSmoothGuideOutline(ctx, mode);
  ctx.restore();
}

// animated thin white stick inside the clear region (uses the same pose params)
function drawGuideAnimatedOverlay(ctx2, mode, t) {
  const W = canvasEl.width, H = canvasEl.height; const cx = W/2, cy = H*0.62; const p = poseFrameParams(mode);
  const torsoLen = H * p.torso; const legLen = H * p.leg; const armLen = H * p.arm; const headR = H * 0.05;
  const baseA = p.armAngle, baseL = p.legAngle, tilt = p.torsoTilt;
  const phase = (t/1000)%2/2; const anim = Math.sin(phase*2*Math.PI)*0.12;
  const a = baseA + anim*(mode==='t_pose'?0.03:0.10);
  const leg = baseL + anim*0.06;
  ctx2.save(); ctx2.translate(cx, cy); ctx2.rotate(tilt); ctx2.strokeStyle = 'rgba(255,255,255,0.9)'; ctx2.lineWidth = Math.max(2, H*0.006); ctx2.lineCap='round';
  // torso
  ctx2.beginPath(); ctx2.moveTo(0,0); ctx2.lineTo(0,-torsoLen); ctx2.stroke();
  // arms
  ctx2.beginPath(); ctx2.moveTo(0,-torsoLen); ctx2.lineTo(-Math.cos(a)*armLen, -torsoLen - Math.sin(a)*armLen); ctx2.stroke();
  ctx2.beginPath(); ctx2.moveTo(0,-torsoLen); ctx2.lineTo( Math.cos(a)*armLen, -torsoLen - Math.sin(a)*armLen); ctx2.stroke();
  // legs
  ctx2.beginPath(); ctx2.moveTo(0,0); ctx2.lineTo(-Math.sin(leg)*legLen,  Math.cos(leg)*legLen); ctx2.stroke();
  ctx2.beginPath(); ctx2.moveTo(0,0); ctx2.lineTo( Math.sin(leg)*legLen,  Math.cos(leg)*legLen); ctx2.stroke();
  ctx2.restore();
  // head
  ctx2.save(); ctx2.strokeStyle = 'rgba(255,255,255,0.9)'; ctx2.lineWidth = Math.max(2, H*0.006); ctx2.beginPath(); ctx2.arc(cx, cy - torsoLen - headR*1.2, headR, 0, Math.PI*2); ctx2.stroke(); ctx2.restore();
}

// Controls
startBtn.addEventListener("click", start);
stopBtn.addEventListener("click", stop);
trainBtn.addEventListener("click", () => { training = !training; trainBtn.textContent = training ? "Pause" : "Start Training"; if (!training) { holdSec = 0; requireRelease = false; holdEl.textContent = `Hold: 0.0s / ${holdTargetSec}s`; } });
modeSelect.addEventListener("change", () => { currentMode = modeSelect.value; holdTargetSec = getHoldTargetForMode(); completedTarget = getRepsTarget(); resetCounters(); tipsEl.textContent = tipsByMode[currentMode] || "Choose an exercise and click 'Start Training'."; settingPrimaryLabelEl.textContent = getPrimaryLabel(currentMode); settingPrimaryEl.value = String(getPrimaryThreshold(currentMode)); if (moveLabelEl) moveLabelEl.textContent = `Move: ${titleForMode(currentMode)}`; });
flowModeSelect.addEventListener("change", () => { flowMode = flowModeSelect.value; if (flowMode === "auto") { autoIndex = Math.max(0, exerciseOrder.indexOf(currentMode)); } });
saveSettingsBtn.addEventListener("click", () => { const holdVal = Math.max(1, Math.min(600, Number(settingHoldSecEl.value) || 5)); const primaryVal = Number(settingPrimaryEl.value); userSettings.holdSeconds = holdVal; if (!userSettings.thresholds[currentMode]) userSettings.thresholds[currentMode] = { ...defaultThresholds[currentMode] }; userSettings.thresholds[currentMode].primary = primaryVal; saveSettings(userSettings); holdTargetSec = getHoldTargetForMode(); completedTarget = 1; resetCounters(); holdEl.textContent = `Hold: 0.0s / ${holdTargetSec}s`; completedEl.textContent = `Completed: ${completedCount}/${completedTarget}`; saveToast.style.display = "inline"; setTimeout(() => (saveToast.style.display = "none"), 1200); });
resetSettingsBtn.addEventListener("click", () => { userSettings = { holdSeconds: 5, thresholds: { ...defaultThresholds } }; saveSettings(userSettings); settingHoldSecEl.value = String(userSettings.holdSeconds); settingPrimaryLabelEl.textContent = getPrimaryLabel(currentMode); settingPrimaryEl.value = String(getPrimaryThreshold(currentMode)); holdTargetSec = getHoldTargetForMode(); completedTarget = 1; resetCounters(); });

function resetCounters() { holdSec = 0; completedCount = 0; requireRelease = false; holdEl.textContent = `Hold: ${holdSec.toFixed(1)}s / ${holdTargetSec}s`; completedEl.textContent = `Completed: ${completedCount}/${completedTarget}`; }
// Ensure progress resets initially
if (holdProgressFill) holdProgressFill.style.width = "0%";

if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { setStatus("Camera not supported in this browser"); startBtn.disabled = true; }

// Initialize settings UI
settingHoldSecEl.value = String(userSettings.holdSeconds);
// reps removed
settingPrimaryLabelEl.textContent = getPrimaryLabel(currentMode);
settingPrimaryEl.value = String(getPrimaryThreshold(currentMode));
completedTarget = 1;
resetCounters(); if (tipsEl) tipsEl.textContent = tipsByMode[currentMode]; if (moveLabelEl) moveLabelEl.textContent = "Please choose movement card"; if (heroTipEl) heroTipEl.textContent = `Tip: ${tipsByMode[currentMode]}`; setStatus('Practice mode');

// Movement cards rendering
function renderMovementCards() {
  if (!movementCardsEl) return;
  movementCardsEl.innerHTML = "";
  exerciseOrder.forEach((mode) => {
    const card = document.createElement("div"); card.className = "cardMove"; card.dataset.mode = mode;
    const title = document.createElement("h4"); title.textContent = titleForMode(mode);
    const anim = document.createElement("div"); anim.className = "anim";
    const canvas = document.createElement("canvas"); canvas.width = 300; canvas.height = 180; anim.appendChild(canvas);
    const p = document.createElement("p"); p.textContent = cardDescriptions[mode] || "";
    card.appendChild(title); card.appendChild(anim); card.appendChild(p);
    card.addEventListener("click", () => onCardClick(mode, card));
    movementCardsEl.appendChild(card);
    startCardAnimation(canvas, mode);
  });
}

function titleForMode(mode) {
  const names = {
    overhead_reach: "Overhead Reach",
    side_bend: "Side Bend",
    hamstring_hinge: "Hamstring Hinge",
    t_pose: "T Pose",
    quad_stretch: "Quad Stretch",
    y_pose: "Y Raise",
    high_knee_hold: "High Knee Hold",
    arm_circles: "Arm Circles",
    lunge: "Lunge",
  }; return names[mode] || mode;
}

function startCardAnimation(canvas, mode) {
  const g = canvas.getContext("2d");
  function drawFrame(ts) {
    const W = canvas.width, H = canvas.height; const phase = ((ts/1000) % 2)/2;
    g.clearRect(0,0,W,H);
    renderStickFigure(g, W, H, phase, mode);
    requestAnimationFrame(drawFrame);
  }
  requestAnimationFrame(drawFrame);
}

// 统一的火柴人渲染器（供 card 与检测区共用）
function renderStickFigure(g, W, H, phase, mode, scale = 1, yOffset = 0) {
  g.save(); g.translate(W/2, H*0.75 + yOffset); g.strokeStyle = "#94a3b8"; g.lineWidth = 4; g.lineCap = "round";
  const torsoLen = H*0.25*scale, legLen = H*0.22*scale, armLen = H*0.20*scale, headR = H*0.06*scale;
  const hip = {x:0, y:0}; const shoulder = {x:0, y:-torsoLen}; const head = {x:0, y:-torsoLen - headR*1.8};
  let lArm = {x:-armLen*0.9, y:-torsoLen - armLen*0.2}; let rArm = {x: armLen*0.9, y:-torsoLen - armLen*0.2};
  let lKnee = {x:-legLen*0.2, y: legLen*0.5}; let rKnee = {x: legLen*0.2, y: legLen*0.5};
  let lFoot = {x:-legLen*0.3, y: legLen}; let rFoot = {x: legLen*0.3, y: legLen};
  const s = Math.sin(phase * 2 * Math.PI);
  function drawTorso(){ g.beginPath(); g.moveTo(hip.x, hip.y); g.lineTo(shoulder.x, shoulder.y); g.stroke(); }
  function drawArms(){ g.beginPath(); g.moveTo(shoulder.x, shoulder.y); g.lineTo(lArm.x, lArm.y); g.stroke(); g.beginPath(); g.moveTo(shoulder.x, shoulder.y); g.lineTo(rArm.x, rArm.y); g.stroke(); }
  function drawLegs(){
    // 为避免脚尖处出现“残留点”，将最终端点抬高并去掉多余端点装饰
    const lfY = Math.min(lFoot.y, legLen*0.95);
    const rfY = Math.min(rFoot.y, legLen*0.95);
    g.beginPath(); g.moveTo(hip.x, hip.y); g.lineTo(lKnee.x, lKnee.y); g.lineTo(lFoot.x, lfY); g.stroke();
    g.beginPath(); g.moveTo(hip.x, hip.y); g.lineTo(rKnee.x, rKnee.y); g.lineTo(rFoot.x, rfY); g.stroke();
  }
  function drawHead(){ g.beginPath(); g.arc(head.x, head.y, headR, 0, Math.PI*2); g.stroke(); }
  if (mode === "chin_tuck") { const dy = -headR*0.45 * (0.5 + 0.5*s); drawTorso(); drawArms(); drawLegs(); g.beginPath(); g.arc(head.x, head.y + dy, headR, 0, Math.PI*2); g.stroke(); }
  else if (mode === "overhead_reach") { lArm = {x:-armLen*0.12, y:-torsoLen - armLen*(1.10+0.20*s)}; rArm = {x: armLen*0.12, y:-torsoLen - armLen*(1.10-0.20*s)}; drawTorso(); drawArms(); drawLegs(); drawHead(); }
  else if (mode === "side_bend") { const bend = 0.50*s; g.rotate(bend); drawTorso(); drawArms(); drawLegs(); drawHead(); }
  else if (mode === "hamstring_hinge") { const hinge = -0.90*(0.5+0.5*s); g.save(); g.translate(hip.x, hip.y); g.rotate(hinge); g.beginPath(); g.moveTo(0,0); g.lineTo(0,-torsoLen); g.stroke(); g.beginPath(); g.arc(0,-torsoLen - headR*1.8, headR, 0, Math.PI*2); g.stroke(); g.restore(); drawLegs(); }
  else if (mode === "t_pose") { lArm = {x:-armLen*1.35, y:-torsoLen - armLen*0.05*s}; rArm = {x: armLen*1.35, y:-torsoLen + armLen*0.05*s}; drawTorso(); drawArms(); drawLegs(); drawHead(); }
  else if (mode === "lunge") { let rKnee={x: legLen*0.60, y: legLen*0.60}, rFoot={x: legLen*0.95, y: legLen}; let lKnee={x:-legLen*0.30, y: legLen*0.85}, lFoot={x:-legLen*0.55, y: legLen}; drawTorso(); drawArms(); drawLegs(); drawHead(); }
  else if (mode === "quad_stretch") { lKnee = {x:-legLen*0.12, y: legLen*0.40}; lFoot = {x:-legLen*0.15, y: -legLen*0.05}; drawTorso(); drawArms(); drawLegs(); drawHead(); }
  else if (mode === "y_pose") { lArm = {x:-armLen*0.65, y:-torsoLen - armLen*(1.18+0.08*s)}; rArm = {x: armLen*0.65, y:-torsoLen - armLen*(1.18-0.08*s)}; drawTorso(); drawArms(); drawLegs(); drawHead(); }
    else if (mode === "arm_circles") {
      // 简单的肩周小圆：在头顶附近，双臂缓慢环绕（用左右臂角度的轻微摆动表示）
      const a0 = -Math.PI*0.55, a1 = -Math.PI*0.85; // 两臂角度范围
      const a = a0 + (a1-a0)*((s+1)/2);
      lArm = {x:-Math.cos(a)*armLen*0.9, y:-torsoLen - Math.sin(a)*armLen*0.9};
      rArm = {x: Math.cos(a)*armLen*0.9,  y:-torsoLen - Math.sin(a)*armLen*0.9};
      drawTorso(); drawArms(); drawLegs(); drawHead();
    }
  else if (mode === "high_knee_hold") {
    // 强化左腿抬膝的可见度：加大外展与高度，远离躯干
    lKnee = { x: -legLen*(0.45 + 0.05*s), y: legLen*(0.20 - 0.05*s) };
    lFoot = { x: -legLen*(0.55 + 0.05*s), y: legLen*(0.08 - 0.03*s) };
    drawTorso(); drawArms(); drawLegs(); drawHead();
  }
  else { drawTorso(); drawArms(); drawLegs(); drawHead(); }
  g.restore();
}

async function onCardClick(mode, cardEl) {
  document.querySelectorAll('.cardMove').forEach(el => el.classList.remove('active'));
  if (cardEl) cardEl.classList.add('active');
  currentMode = mode; modeSelect.value = currentMode; holdTargetSec = getHoldTargetForMode(); completedTarget = 1; resetCounters();
  if (moveLabelEl) moveLabelEl.textContent = `Move: ${titleForMode(currentMode)}`; if (heroTipEl) heroTipEl.textContent = `Tip: ${tipsByMode[currentMode]}`;
  if (practiceMode) {
    try { if (!stream) await start(); } catch {}
    training = true; trainBtn.textContent = "Pause"; 
    const tip = tipsByMode[currentMode];
    speak(tip ? `Let's do this! ${tip}` : "Let's start practicing!");
  } else {
    // Non-practice: only switch preview and tips
    tipsEl.textContent = tipsByMode[currentMode] || "Choose an exercise and click 'Start Training'.";
  }
}

// Mode buttons
if (practiceModeBtn) practiceModeBtn.addEventListener('click', () => { practiceMode = true; scoreMode = false; flowMode = 'manual'; setStatus('Practice mode'); updateHeroButtonsForPractice(); });
if (scoreModeBtn) scoreModeBtn.addEventListener('click', async () => {
  practiceMode = false; scoreMode = true; flowMode = 'auto'; autoIndex = 0; currentMode = exerciseOrder[0]; modeSelect.value = currentMode; holdTargetSec = getHoldTargetForMode(); completedTarget = 1; resetCounters(); totalScore = 0; totalSamples = 0; setStatus('Score mode');
  try { if (!stream) await start(); else { training = true; trainBtn.textContent = 'Pause'; } } catch {}
});

if (heroPracticeBtn) heroPracticeBtn.addEventListener('click', async () => { practiceMode = true; scoreMode = false; flowMode = 'manual'; setStatus('Practice mode'); try { if (!stream) await start(); } catch {} training = true; trainBtn.textContent = 'Pause'; updateHeroButtonsForPractice(); });
if (heroPlayBtn) heroPlayBtn.addEventListener('click', async () => {
  // Start score mode sequence: auto flow, 1 rep each, hold 3s
  practiceMode = false; scoreMode = true; flowMode = 'auto';
  autoIndex = 0; currentMode = exerciseOrder[0]; modeSelect.value = currentMode; if (moveLabelEl) moveLabelEl.textContent = `Move: ${titleForMode(currentMode)}`;
  holdTargetSec = 3; completedTarget = 1; resetCounters(); totalScore = 0; totalSamples = 0; setStatus('Score mode');
  try { if (!stream) await start(); } catch {}
  training = true; trainBtn.textContent = 'Pause';
  // hide setting while playing
  try { if (settingBtn) settingBtn.style.display = 'none'; } catch {}
  // In Play mode: hide Practice, show Finish
  updateHeroButtonsForPlay();
  // show score badge and reset timing
  if (gameScoreEl) { gameScoreEl.style.display = ''; gameScoreEl.textContent = 'Score: -'; }
  playStartMs = performance.now();
});
if (heroFinishBtn) heroFinishBtn.addEventListener('click', () => { training = false; trainBtn.textContent = 'Start Training'; speak('Session finished'); practiceMode = true; scoreMode = false; updateHeroButtonsForPractice(); });
// When finishing or stopping, show setting again
function showSettingButton() { try { if (settingBtn) settingBtn.style.display = ''; } catch {} }
heroFinishBtn && heroFinishBtn.addEventListener('click', showSettingButton);
stopBtn && stopBtn.addEventListener('click', () => { showSettingButton(); updateHeroButtonsForPractice(); });

// Settings modal behavior
function openSettings() {
  if (!settingsModal) return; settingsModal.style.display = 'flex';
  if (modalHoldSec) modalHoldSec.value = String(getHoldTargetForMode());
  if (modalVoice) modalVoice.checked = !!voiceToggle?.checked;
}
function closeSettings() { if (settingsModal) settingsModal.style.display = 'none'; }
if (settingBtn) settingBtn.addEventListener('click', openSettings);
if (voiceBtn) voiceBtn.addEventListener('click', () => { voiceEnabled = !voiceEnabled; updateVoiceUI(); localStorage.setItem('pose_demo_voice', JSON.stringify(voiceEnabled)); });
if (modalCancelBtn) modalCancelBtn.addEventListener('click', closeSettings);
if (modalSaveBtn) modalSaveBtn.addEventListener('click', () => {
  const holdVal = Math.max(1, Math.min(600, Number(modalHoldSec?.value) || getHoldTargetForMode()));
  userSettings.holdSeconds = holdVal; saveSettings(userSettings);
  holdTargetSec = getHoldTargetForMode(); completedTarget = getRepsTarget(); resetCounters();
  if (heroTipEl) heroTipEl.textContent = `Tip: ${tipsByMode[currentMode]}`;
  closeSettings();
});

// Load voice pref
try { const saved = localStorage.getItem('pose_demo_voice'); if (saved !== null) voiceEnabled = JSON.parse(saved); } catch {}
updateVoiceUI();
renderMovementCards();

// ---- UI helpers for hero buttons ----
function updateHeroButtonsForPractice() {
  if (heroPracticeBtn) heroPracticeBtn.style.display = '';
  if (heroFinishBtn) heroFinishBtn.style.display = 'none';
  // Play 按钮在练习模式下保持灰色（次要）
  if (heroPlayBtn) { heroPlayBtn.classList.remove('btnPrimary'); heroPlayBtn.classList.add('btnGhost'); }
  // Hide score badge in practice
  if (gameScoreEl) gameScoreEl.style.display = 'none';
}
function updateHeroButtonsForPlay() {
  if (heroPracticeBtn) heroPracticeBtn.style.display = 'none';
  if (heroFinishBtn) heroFinishBtn.style.display = '';
  // Play 按钮在播放模式下使用主色（绿色）
  if (heroPlayBtn) { heroPlayBtn.classList.remove('btnGhost'); heroPlayBtn.classList.add('btnPrimary'); }
  // Show score badge in play
  if (gameScoreEl) gameScoreEl.style.display = '';
}
// Default state on entry: Practice mode UI
updateHeroButtonsForPractice();

// ---- Keyboard navigation for Practice mode (no mouse required) ----
function getCardElForMode(mode) { try { return movementCardsEl?.querySelector(`.cardMove[data-mode="${mode}"]`); } catch { return null; } }
function navigateExercise(delta) {
  const idx = Math.max(0, exerciseOrder.indexOf(currentMode));
  const nextIdx = (idx + delta + exerciseOrder.length) % exerciseOrder.length;
  const nextMode = exerciseOrder[nextIdx];
  const cardEl = getCardElForMode(nextMode);
  onCardClick(nextMode, cardEl || null);
  try { cardEl?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' }); } catch {}
}
document.addEventListener('keydown', async (e) => {
  // Skip when user is focusing an input
  const tag = (document.activeElement?.tagName || '').toLowerCase();
  if (tag === 'input' || tag === 'select' || tag === 'textarea') return;

  if (practiceMode) {
    if (e.key === ' ') { // space: start/pause training
      e.preventDefault();
      try { if (!stream) await start(); } catch {}
      training = !training; trainBtn.textContent = training ? 'Pause' : 'Start Training';
    }
  }
});
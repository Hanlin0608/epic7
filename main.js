import { PoseLandmarker, FilesetResolver, DrawingUtils } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/vision_bundle.mjs";

const MODEL_URL = "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/1/pose_landmarker_full.task";
const WASM_BASE = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm";

// Elements
const videoEl = document.getElementById("video");
const canvasEl = document.getElementById("canvas");
const ctx = canvasEl.getContext("2d");
const guideCanvas = document.getElementById("guide");
const guideCtx = guideCanvas.getContext("2d");

const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const trainBtn = document.getElementById("trainBtn");
const modeSelect = document.getElementById("modeSelect");
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

// Settings UI
const settingHoldSecEl = document.getElementById("settingHoldSec");
const settingPrimaryEl = document.getElementById("settingPrimary");
const settingPrimaryLabelEl = document.getElementById("settingPrimaryLabel");
const saveSettingsBtn = document.getElementById("saveSettingsBtn");
const resetSettingsBtn = document.getElementById("resetSettingsBtn");
const saveToast = document.getElementById("saveToast");

// State
let landmarker = null;
let stream = null;
let rafId = null;
let drawingUtils = null;
let lastT = 0;
let lastDtSec = 0;
let smoothedFps = 0;

// Thresholds per mode
const defaultThresholds = {
  chin_tuck: { primary: 55, label: "CVA阈值(°)", compare: ">=" },
  glute_bridge: { primary: 170, label: "髋角阈值(°)", compare: ">=" },
  overhead_reach: { primary: 0.12, label: "手腕高于肩(归一化)", compare: ">=" },
  side_bend: { primary: 12, label: "侧屈角阈值(°)", compare: ">=" },
  hamstring_hinge: { primary: 120, label: "髋角阈值(°)", compare: "<=" },
};

function loadSettings() { try { const raw = localStorage.getItem("pose_demo_settings"); return raw ? JSON.parse(raw) : null; } catch { return null; } }
function saveSettings(s) { localStorage.setItem("pose_demo_settings", JSON.stringify(s)); }

let currentMode = "chin_tuck";
let userSettings = loadSettings() || { holdSeconds: 5, thresholds: { ...defaultThresholds } };
function getHoldTargetForMode() { return userSettings.holdSeconds || 5; }
function getPrimaryThreshold(mode) { return (userSettings.thresholds?.[mode]?.primary) ?? defaultThresholds[mode].primary; }
function getCompare(mode) { return (userSettings.thresholds?.[mode]?.compare) ?? defaultThresholds[mode].compare; }
function getPrimaryLabel(mode) { return (userSettings.thresholds?.[mode]?.label) ?? defaultThresholds[mode].label; }

let holdTargetSec = getHoldTargetForMode();
let holdSec = 0;
let completedCount = 0;
const completedTarget = 1;
let requireRelease = false;
let training = false;

const tipsByMode = {
  chin_tuck: "下巴微内收、头颈轻微后缩，使耳朵更接近肩膀正上方；达标保持 5 秒。",
  glute_bridge: "仰卧屈膝，收紧臀部抬高骨盆，肩-髋-膝接近一条直线；达标保持 5 秒。",
  overhead_reach: "站/坐直，双臂上举过肩，伸向天花板，避免耸肩；达标保持 5 秒。",
  side_bend: "站/坐直，向一侧平稳侧屈，保持躯干拉伸；达标保持 5 秒。",
  hamstring_hinge: "站立髋部折叠前屈，背部保持中立；达标保持 5 秒。",
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
function evalGluteBridge(lm) { const thr = getPrimaryThreshold("glute_bridge"), cmp = getCompare("glute_bridge"); const leftHip = computeAngleDeg(lm[11], lm[23], lm[25]); const rightHip = computeAngleDeg(lm[12], lm[24], lm[26]); const hip = Number.isFinite(leftHip) && Number.isFinite(rightHip) ? Math.max(leftHip, rightHip) : (Number.isFinite(leftHip) ? leftHip : rightHip); const ok = compare(hip, cmp, thr); const score = ok ? 100 : (Number.isFinite(hip) ? Math.max(0, Math.min(100, Math.round((hip / Math.max(thr, 1e-6)) * 100))) : 0); return { primaryAngle: hip, ok, score }; }
function evalOverheadReach(lm) { const thr = getPrimaryThreshold("overhead_reach"), cmp = getCompare("overhead_reach"); const lS = lm[11], rS = lm[12], lW = lm[15], rW = lm[16]; if (!lS || !rS || !lW || !rW) return { ok:false, primaryAngle:NaN, score:0 }; const shoulderY = Math.min(lS.y, rS.y); const lM = Math.max(0, shoulderY - lW.y), rM = Math.max(0, shoulderY - rW.y); const avg = (lM + rM) / 2; const ok = compare(avg, cmp, thr); const score = ok ? 100 : Math.max(0, Math.min(100, Math.round((avg / Math.max(thr, 1e-6)) * 100))); return { ok, primaryAngle: Math.round(avg*100)/100, score }; }
function evalSideBend(lm) { const thr = getPrimaryThreshold("side_bend"), cmp = getCompare("side_bend"); const hipMid = midpoint(lm[23], lm[24]); const shoulderMid = midpoint(lm[11], lm[12]); if (!hipMid || !shoulderMid) return { ok:false, primaryAngle:NaN, score:0 }; const dx = shoulderMid.x - hipMid.x, dy = hipMid.y - shoulderMid.y; const tiltDeg = Math.abs(Math.atan2(Math.abs(dx), Math.max(1e-6, Math.abs(dy))) * 180 / Math.PI); const ok = compare(tiltDeg, cmp, thr); const score = Math.max(0, Math.min(100, Math.round((tiltDeg / Math.max(thr, 1e-6)) * 100))); return { ok, primaryAngle: Math.round(tiltDeg), score }; }
function evalHamstringHinge(lm) { const thr = getPrimaryThreshold("hamstring_hinge"), cmp = getCompare("hamstring_hinge"); const leftHip = computeAngleDeg(lm[11], lm[23], lm[25]); const rightHip = computeAngleDeg(lm[12], lm[24], lm[26]); const hip = Number.isFinite(leftHip) && Number.isFinite(rightHip) ? Math.min(leftHip, rightHip) : (Number.isFinite(leftHip) ? leftHip : rightHip); const ok = compare(hip, cmp, thr); const span = Math.max(1, Math.abs(180 - thr)); const score = Number.isFinite(hip) ? Math.max(0, Math.min(100, Math.round(((180 - hip) / span) * 100))) : 0; return { ok, primaryAngle: hip, score }; }

function speak(text) { try { if (!voiceToggle.checked) return; const u = new SpeechSynthesisUtterance(text); u.lang = "zh-CN"; window.speechSynthesis.cancel(); window.speechSynthesis.speak(u); } catch {} }

function renderEval(mode, ev) {
  neckAngleEl.textContent = "-"; hipAngleEl.textContent = "-"; torsoTiltEl.textContent = "-";
  let verdictMsg = ""; let score = ev.score ?? 0;
  if (mode === "chin_tuck") { neckAngleEl.textContent = Number.isFinite(ev.primaryAngle) ? ev.primaryAngle : "-"; verdictMsg = ev.ok ? "下巴内收达标" : "继续收下巴，轻微后缩头颈"; }
  else if (mode === "glute_bridge") { hipAngleEl.textContent = Number.isFinite(ev.primaryAngle) ? ev.primaryAngle : "-"; verdictMsg = ev.ok ? "臀桥达标" : "抬高髋部，收紧臀部，保持躯干一条线"; }
  else if (mode === "overhead_reach") { verdictMsg = ev.ok ? "上举达标" : "双臂再高一点，避免耸肩"; }
  else if (mode === "side_bend") { torsoTiltEl.textContent = Number.isFinite(ev.primaryAngle) ? ev.primaryAngle : "-"; verdictMsg = ev.ok ? "侧屈达标" : "再向侧边缓慢拉伸"; }
  else if (mode === "hamstring_hinge") { hipAngleEl.textContent = Number.isFinite(ev.primaryAngle) ? ev.primaryAngle : "-"; verdictMsg = ev.ok ? "前屈达标" : "从髋部折叠前屈，背部中立"; }
  verdictEl.textContent = verdictMsg; scoreEl.textContent = `得分: ${Math.round(score)}`; return verdictMsg;
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

function loop(t = performance.now()) {
  rafId = requestAnimationFrame(loop);
  updateFps(t);
  ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
  drawVideoMirrored();

  let result = null;
  try { result = landmarker.detectForVideo(videoEl, t); } catch (e) { console.error(e); setStatus("检测调用失败"); }

  if (result && result.landmarks && result.landmarks[0]) {
    const lm = result.landmarks[0];
    drawingUtils.drawLandmarks(lm, { color: "#22d3ee", radius: 3 });
    drawingUtils.drawConnectors(lm, PoseLandmarker.POSE_CONNECTIONS, { color: "#818cf8", lineWidth: 2 });

    let ev = null;
    if (currentMode === "chin_tuck") ev = evalChinTuck(lm);
    else if (currentMode === "glute_bridge") ev = evalGluteBridge(lm);
    else if (currentMode === "overhead_reach") ev = evalOverheadReach(lm);
    else if (currentMode === "side_bend") ev = evalSideBend(lm);
    else if (currentMode === "hamstring_hinge") ev = evalHamstringHinge(lm);

    const verdictMsg = renderEval(currentMode, ev);

    if (training) {
      if (ev && ev.ok && !requireRelease) {
        holdSec += lastDtSec || 0;
        if (holdSec >= holdTargetSec) {
          completedCount += 1; requireRelease = true; holdSec = 0;
          completedEl.textContent = `完成: ${completedCount}/${completedTarget}`;
          speak(verdictMsg + "，完成一组");
          if (completedCount >= completedTarget) { training = false; trainBtn.textContent = "开始训练"; verdictEl.textContent = "本组完成"; speak("本组完成"); }
        }
      } else {
        if (!ev || !ev.ok) { if (requireRelease) requireRelease = false; holdSec = 0; }
      }
      holdEl.textContent = `保持: ${holdSec.toFixed(1)}s / ${holdTargetSec}s`;
    } else {
      holdEl.textContent = `保持: 0.0s / ${holdTargetSec}s`;
    }
  } else {
    verdictEl.textContent = "未检测到人体";
    scoreEl.textContent = "得分: -";
    neckAngleEl.textContent = "-"; hipAngleEl.textContent = "-"; torsoTiltEl.textContent = "-";
    holdEl.textContent = `保持: 0.0s / ${holdTargetSec}s`;
  }

  ctx.restore();
}

async function start() {
  startBtn.disabled = true;
  try {
    await createLandmarker();
    setStatus("请求摄像头…");
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: 960, height: 720 } });
    videoEl.srcObject = stream;
    await videoEl.play();

    // Match canvas to video
    canvasEl.width = videoEl.videoWidth || 960;
    canvasEl.height = videoEl.videoHeight || 720;

    setStatus("运行中");
    stopBtn.disabled = false;
    trainBtn.disabled = false;

    if (!rafId) loop();
  } catch (e) {
    console.error(e);
    setStatus("摄像头或模型初始化失败");
    startBtn.disabled = false;
  }
}

function stop() {
  if (rafId) cancelAnimationFrame(rafId);
  rafId = null;
  if (stream) stream.getTracks().forEach(t => t.stop());
  stream = null;
  training = false; trainBtn.textContent = "开始训练";
  setStatus("已停止");
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
  const g = guideCtx; const W = guideCanvas.width / (window.devicePixelRatio || 1), H = guideCanvas.height / (window.devicePixelRatio || 1);
  g.clearRect(0, 0, W, H);
  g.save(); g.translate(W/2, H*0.75); g.strokeStyle = "#94a3b8"; g.lineWidth = 6; g.lineCap = "round";

  const torsoLen = H*0.25, legLen = H*0.22, armLen = H*0.20, headR = H*0.06;
  const hip = {x:0, y:0}; const shoulder = {x:0, y:-torsoLen}; const head = {x:0, y:-torsoLen - headR*1.8};
  let lArm = {x:-armLen*0.9, y:-torsoLen - armLen*0.2}; let rArm = {x: armLen*0.9, y:-torsoLen - armLen*0.2};
  let lKnee = {x:-legLen*0.2, y: legLen*0.5}; let rKnee = {x: legLen*0.2, y: legLen*0.5};
  let lFoot = {x:-legLen*0.3, y: legLen}; let rFoot = {x: legLen*0.3, y: legLen};

  const s = Math.sin(phase * 2 * Math.PI);

  function drawTorso(){ g.beginPath(); g.moveTo(hip.x, hip.y); g.lineTo(shoulder.x, shoulder.y); g.stroke(); }
  function drawArms(){ g.beginPath(); g.moveTo(shoulder.x, shoulder.y); g.lineTo(lArm.x, lArm.y); g.stroke(); g.beginPath(); g.moveTo(shoulder.x, shoulder.y); g.lineTo(rArm.x, rArm.y); g.stroke(); }
  function drawLegs(){ g.beginPath(); g.moveTo(hip.x, hip.y); g.lineTo(lKnee.x, lKnee.y); g.lineTo(lFoot.x, lFoot.y); g.stroke(); g.beginPath(); g.moveTo(hip.x, hip.y); g.lineTo(rKnee.x, rKnee.y); g.lineTo(rFoot.x, rFoot.y); g.stroke(); }
  function drawHead(){ g.beginPath(); g.arc(head.x, head.y, headR, 0, Math.PI*2); g.stroke(); }

  if (mode === "chin_tuck") {
    const dy = -headR*0.2 * (0.5 + 0.5*s);
    drawTorso(); drawArms(); drawLegs();
    g.beginPath(); g.arc(head.x, head.y + dy, headR, 0, Math.PI*2); g.stroke();
  } else if (mode === "glute_bridge") {
    g.translate(0, -headR*0.2);
    const lift = 0.25 + 0.15 * (0.5 + 0.5*s);
    g.beginPath(); g.moveTo(-armLen, 0); g.lineTo(armLen, -lift*H*0.12); g.stroke();
    g.beginPath(); g.moveTo(armLen, -lift*H*0.12); g.lineTo(armLen*1.4, -lift*H*0.12); g.stroke();
    g.beginPath(); g.arc(-armLen*1.2, headR*0.2, headR, 0, Math.PI*2); g.stroke();
  } else if (mode === "overhead_reach") {
    lArm = {x:-armLen*0.1, y:-torsoLen - armLen*(0.85+0.1*s)};
    rArm = {x: armLen*0.1, y:-torsoLen - armLen*(0.85-0.1*s)};
    drawTorso(); drawArms(); drawLegs(); drawHead();
  } else if (mode === "side_bend") {
    const bend = 0.25*s; g.rotate(bend);
    drawTorso(); drawArms(); drawLegs(); drawHead();
  } else if (mode === "hamstring_hinge") {
    const hinge = -0.45*(0.5+0.5*s);
    g.save(); g.translate(hip.x, hip.y); g.rotate(hinge);
    g.beginPath(); g.moveTo(0,0); g.lineTo(0,-torsoLen); g.stroke();
    g.beginPath(); g.arc(0,-torsoLen - headR*1.8, headR, 0, Math.PI*2); g.stroke();
    g.beginPath(); g.moveTo(0,-torsoLen*0.6); g.lineTo(-armLen*0.1, -torsoLen*0.6 + armLen*0.8); g.stroke();
    g.beginPath(); g.moveTo(0,-torsoLen*0.6); g.lineTo( armLen*0.1, -torsoLen*0.6 + armLen*0.8); g.stroke();
    g.restore(); drawLegs();
  } else {
    drawTorso(); drawArms(); drawLegs(); drawHead();
  }

  g.restore();
}

(function guideLoop() {
  const now = performance.now() / 1000; const phase = (now % 2) / 2; // 0..1
  drawStickFigure(currentMode, phase);
  requestAnimationFrame(guideLoop);
})();

// Controls
startBtn.addEventListener("click", start);
stopBtn.addEventListener("click", stop);
trainBtn.addEventListener("click", () => { training = !training; trainBtn.textContent = training ? "暂停" : "开始训练"; if (!training) { holdSec = 0; requireRelease = false; holdEl.textContent = `保持: 0.0s / ${holdTargetSec}s`; } });
modeSelect.addEventListener("change", () => { currentMode = modeSelect.value; holdTargetSec = getHoldTargetForMode(); resetCounters(); tipsEl.textContent = tipsByMode[currentMode] || "选择一个动作并点击“开始训练”，保持达标 5 秒记 1 次。"; settingPrimaryLabelEl.textContent = getPrimaryLabel(currentMode); settingPrimaryEl.value = String(getPrimaryThreshold(currentMode)); });
saveSettingsBtn.addEventListener("click", () => { const holdVal = Math.max(1, Math.min(600, Number(settingHoldSecEl.value) || 5)); const primaryVal = Number(settingPrimaryEl.value); userSettings.holdSeconds = holdVal; if (!userSettings.thresholds[currentMode]) userSettings.thresholds[currentMode] = { ...defaultThresholds[currentMode] }; userSettings.thresholds[currentMode].primary = primaryVal; saveSettings(userSettings); holdTargetSec = getHoldTargetForMode(); resetCounters(); holdEl.textContent = `保持: 0.0s / ${holdTargetSec}s`; saveToast.style.display = "inline"; setTimeout(() => (saveToast.style.display = "none"), 1200); });
resetSettingsBtn.addEventListener("click", () => { userSettings = { holdSeconds: 5, thresholds: { ...defaultThresholds } }; saveSettings(userSettings); settingHoldSecEl.value = String(userSettings.holdSeconds); settingPrimaryLabelEl.textContent = getPrimaryLabel(currentMode); settingPrimaryEl.value = String(getPrimaryThreshold(currentMode)); holdTargetSec = getHoldTargetForMode(); resetCounters(); });

function resetCounters() { holdSec = 0; completedCount = 0; requireRelease = false; holdEl.textContent = `保持: ${holdSec.toFixed(1)}s / ${holdTargetSec}s`; completedEl.textContent = `完成: ${completedCount}/${completedTarget}`; }

if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { setStatus("此浏览器不支持摄像头"); startBtn.disabled = true; }

// Initialize settings UI
settingHoldSecEl.value = String(userSettings.holdSeconds);
settingPrimaryLabelEl.textContent = getPrimaryLabel(currentMode);
settingPrimaryEl.value = String(getPrimaryThreshold(currentMode));
resetCounters(); if (tipsEl) tipsEl.textContent = tipsByMode[currentMode]; 
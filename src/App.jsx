import { useState, useEffect, useRef, useCallback, useMemo, memo } from "react";

// ─── Sound System (Web Audio API — zero dependencies) ───────────────────────
const AudioCtx = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;
function getAudioCtx() {
  if (!audioCtx) audioCtx = new AudioCtx();
  return audioCtx;
}

function playCorrectSound() {
  try {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(523.25, ctx.currentTime);
    osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1);
    osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.4);
  } catch (e) {}
}

function playWrongSound() {
  try {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(200, ctx.currentTime);
    osc.frequency.setValueAtTime(150, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.3);
  } catch (e) {}
}

function playStreakSound(streak) {
  try {
    const ctx = getAudioCtx();
    const notes = [523.25, 587.33, 659.25, 698.46, 783.99];
    const noteIdx = Math.min(streak - 1, notes.length - 1);
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(notes[noteIdx], ctx.currentTime);
    osc.frequency.setValueAtTime(notes[noteIdx] * 1.5, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.5);
  } catch (e) {}
}

function playVictoryFanfare() {
  try {
    const ctx = getAudioCtx();
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.15);
      gain.gain.setValueAtTime(0.15, ctx.currentTime + i * 0.15);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.15 + 0.6);
      osc.start(ctx.currentTime + i * 0.15);
      osc.stop(ctx.currentTime + i * 0.15 + 0.6);
    });
  } catch (e) {}
}

// ─── Problem Data ───────────────────────────────────────────────────────────
const PROBLEMS = [
  { id: 1, type: "45-45-90", given: { leg1: "8" }, find: "hypotenuse", answer: "8sqrt(2)", difficulty: 1 },
  { id: 2, type: "30-60-90", given: { short: "4" }, find: "long", answer: "4sqrt(3)", difficulty: 1 },
  { id: 3, type: "30-60-90", given: { hyp: "12" }, find: "short", answer: "6", difficulty: 1 },
  { id: 4, type: "45-45-90", given: { hyp: "10sqrt(2)" }, find: "leg", answer: "10", difficulty: 1 },
  { id: 5, type: "30-60-90", given: { short: "3sqrt(2)" }, find: "hypotenuse", answer: "6sqrt(2)", difficulty: 2 },
  { id: 6, type: "45-45-90", given: { leg1: "5sqrt(3)" }, find: "hypotenuse", answer: "5sqrt(6)", difficulty: 2 },
  { id: 7, type: "30-60-90", given: { long: "9" }, find: "short", answer: "3sqrt(3)", difficulty: 2 },
  { id: 8, type: "45-45-90", given: { hyp: "14" }, find: "leg", answer: "7sqrt(2)", difficulty: 2 },
  { id: 9, type: "30-60-90", given: { hyp: "10sqrt(3)" }, find: "long", answer: "15", difficulty: 3 },
  { id: 10, type: "45-45-90", given: { leg1: "sqrt(6)" }, find: "hypotenuse", answer: "2sqrt(3)", difficulty: 3 },
  { id: 11, type: "30-60-90", given: { long: "6sqrt(3)" }, find: "hypotenuse", answer: "12", difficulty: 3 },
  { id: 12, type: "45-45-90", given: { hyp: "3sqrt(10)" }, find: "leg", answer: "3sqrt(5)", difficulty: 3 },
  { id: 13, type: "30-60-90", given: { short: "2sqrt(5)" }, find: "hypotenuse", answer: "4sqrt(5)", difficulty: 4 },
  { id: 14, type: "45-45-90", given: { leg1: "4sqrt(7)" }, find: "hypotenuse", answer: "4sqrt(14)", difficulty: 4 },
  { id: 15, type: "30-60-90", given: { hyp: "8sqrt(2)" }, find: "short", answer: "4sqrt(2)", difficulty: 4 },
  { id: 16, type: "30-60-90", given: { long: "2sqrt(21)" }, find: "hypotenuse", answer: "4sqrt(7)", difficulty: 4 },
];

const POINTS_MAP = { 1: 100, 2: 200, 3: 350, 4: 500 };

// ─── localStorage helpers ───────────────────────────────────────────────────
function loadProgress() {
  try {
    const data = JSON.parse(localStorage.getItem("srt_progress"));
    if (data && data.solved) return { solved: new Set(data.solved), score: data.score || 0, bestStreak: data.bestStreak || 0 };
  } catch (e) {}
  return null;
}

function saveProgress(solved, score, bestStreak) {
  try {
    localStorage.setItem("srt_progress", JSON.stringify({ solved: [...solved], score, bestStreak }));
  } catch (e) {}
}

// ─── Answer Parsing & Validation ────────────────────────────────────────────
function parseRadical(str) {
  if (!str) return null;
  str = str.replace(/\s+/g, "").toLowerCase();
  if (/^-?\d+(\.\d+)?$/.test(str)) return parseFloat(str);
  const match = str.match(/^(-?\d*\.?\d*)\*?sqrt\((\d+)\)$/);
  if (match) {
    const coeff = match[1] === "" || match[1] === "-" ? (match[1] === "-" ? -1 : 1) : parseFloat(match[1]);
    const radicand = parseInt(match[2]);
    return coeff * Math.sqrt(radicand);
  }
  const match2 = str.match(/^(-?\d*\.?\d*)\*?[√](\d+)$/);
  if (match2) {
    const coeff = match2[1] === "" ? 1 : parseFloat(match2[1]);
    const radicand = parseInt(match2[2]);
    return coeff * Math.sqrt(radicand);
  }
  return null;
}

function checkAnswer(userInput, correctAnswer) {
  const userVal = parseRadical(userInput);
  const correctVal = parseRadical(correctAnswer);
  if (userVal === null || correctVal === null) return false;
  return Math.abs(userVal - correctVal) < 0.001;
}

// ─── Format Display ─────────────────────────────────────────────────────────
function formatRadical(str) {
  if (!str) return "";
  const match = str.match(/^(\d*)sqrt\((\d+)\)$/);
  if (match) {
    const coeff = match[1] || "";
    const rad = match[2];
    return { coeff, rad };
  }
  return { plain: str };
}

function RadicalDisplay({ value, style = {} }) {
  const f = formatRadical(value);
  if (f.plain) return <span style={style}>{f.plain}</span>;
  return (
    <span style={style}>
      {f.coeff}<span style={{ fontSize: "0.85em" }}>√</span><span style={{ textDecoration: "overline", fontSize: "0.85em" }}>{f.rad}</span>
    </span>
  );
}

// ─── Confetti ───────────────────────────────────────────────────────────────
function Confetti({ active }) {
  const particles = useRef(null);
  if (!particles.current) {
    particles.current = Array.from({ length: 80 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 2,
      duration: 2 + Math.random() * 2,
      color: ["#00f0ff", "#ff00aa", "#ffcc00", "#00ff88", "#ff6644", "#aa66ff"][i % 6],
      size: 4 + Math.random() * 10,
      rotation: Math.random() * 360,
    }));
  }
  if (!active) return null;
  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 9999 }}>
      {particles.current.map(p => (
        <div key={p.id} style={{
          position: "absolute",
          left: `${p.x}%`,
          top: "-10px",
          width: p.size,
          height: p.size * 0.6,
          backgroundColor: p.color,
          borderRadius: p.size > 8 ? "50%" : "1px",
          animation: `confettiFall ${p.duration}s ease-in ${p.delay}s forwards`,
          transform: `rotate(${p.rotation}deg)`,
        }} />
      ))}
    </div>
  );
}

// ─── Mini Confetti (per-card solve burst) ───────────────────────────────────
const MINI_PARTICLES = Array.from({ length: 20 }, (_, i) => {
  const angle = (i / 20) * 360;
  const rad = (angle * Math.PI) / 180;
  const distance = 30 + Math.random() * 40;
  return {
    id: i,
    tx: Math.cos(rad) * distance,
    ty: Math.sin(rad) * distance,
    color: ["#00f0ff", "#ff00aa", "#ffcc00", "#00ff88"][i % 4],
    size: 3 + Math.random() * 4,
    delay: Math.random() * 0.2,
  };
});

function MiniConfetti({ active }) {
  if (!active) return null;
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 10, overflow: "hidden" }}>
      {MINI_PARTICLES.map(p => (
        <div key={p.id} style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: p.size,
          height: p.size,
          borderRadius: "50%",
          backgroundColor: p.color,
          animation: `miniExplode 0.6s ease-out ${p.delay}s forwards`,
          "--tx": `${p.tx}px`,
          "--ty": `${p.ty}px`,
          opacity: 0,
        }} />
      ))}
    </div>
  );
}

// ─── Floating Points Animation ──────────────────────────────────────────────
function FloatingPoints({ points, show }) {
  if (!show) return null;
  return (
    <div style={{
      position: "absolute",
      top: "40%",
      left: "50%",
      transform: "translateX(-50%)",
      animation: "floatUp 1s ease-out forwards",
      zIndex: 20,
      pointerEvents: "none",
    }}>
      <span style={{
        fontSize: 22,
        fontWeight: 900,
        fontFamily: "monospace",
        color: "#ffcc00",
        textShadow: "0 0 10px rgba(255,204,0,0.8)",
      }}>
        +{points}
      </span>
    </div>
  );
}

// ─── Triangle SVG Components ────────────────────────────────────────────────
function Triangle4590({ given, find, isCorrect }) {
  const w = 220, h = 190;
  const p1 = { x: 30, y: 160 };
  const p2 = { x: 190, y: 160 };
  const p3 = { x: 30, y: 30 };

  const givenKey = Object.keys(given)[0];
  const givenVal = given[givenKey];

  let labels = {};
  if (givenKey === "leg1" && find === "hypotenuse") {
    labels = { bottom: givenVal, left: givenVal, hyp: "?" };
  } else if (givenKey === "hyp" && find === "leg") {
    labels = { bottom: "?", left: "?", hyp: givenVal };
  }

  const accentColor = isCorrect === true ? "#00ff88" : isCorrect === false ? "#ff4466" : "#00f0ff";

  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", maxWidth: 220 }}>
      <polygon
        points={`${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y}`}
        fill="rgba(0,240,255,0.05)"
        stroke={accentColor}
        strokeWidth="2.5"
        style={{ transition: "stroke 0.3s" }}
      />
      <polyline
        points={`${p1.x + 18},${p1.y} ${p1.x + 18},${p1.y - 18} ${p1.x},${p1.y - 18}`}
        fill="none" stroke={accentColor} strokeWidth="1.5" opacity={0.6}
      />
      <text x={p2.x - 30} y={p2.y - 8} fill="#8899aa" fontSize="11" fontFamily="monospace">45°</text>
      <text x={p3.x + 8} y={p3.y + 20} fill="#8899aa" fontSize="11" fontFamily="monospace">45°</text>

      <text x={(p1.x + p2.x) / 2} y={p1.y + 18} fill="#e0e8f0" fontSize="13" fontWeight="600" textAnchor="middle" fontFamily="monospace">
        {labels.bottom === "?" ? "?" : ""}
      </text>
      {labels.bottom !== "?" && <RadicalSVG value={labels.bottom} x={(p1.x + p2.x) / 2} y={p1.y + 18} />}

      {labels.left === "?" ? (
        <text x={p1.x - 18} y={(p1.y + p3.y) / 2 + 4} fill={accentColor} fontSize="16" fontWeight="800" textAnchor="middle" fontFamily="monospace" transform={`rotate(-90, ${p1.x - 18}, ${(p1.y + p3.y) / 2 + 4})`}>?</text>
      ) : labels.left ? (
        <g transform={`translate(${p1.x - 18}, ${(p1.y + p3.y) / 2 + 4}) rotate(-90)`}>
          <RadicalSVG value={labels.left} x={0} y={0} />
        </g>
      ) : null}

      <g transform={`translate(${(p2.x + p3.x) / 2 + 12}, ${(p2.y + p3.y) / 2 - 2})`}>
        <RadicalSVG value={labels.hyp === "?" ? null : labels.hyp} x={0} y={0} color={labels.hyp === "?" ? accentColor : "#e0e8f0"} />
        {labels.hyp === "?" && <text x={0} y={0} fill={accentColor} fontSize="16" fontWeight="800" textAnchor="middle" fontFamily="monospace">?</text>}
      </g>
    </svg>
  );
}

function Triangle3060({ given, find, isCorrect }) {
  const w = 240, h = 190;
  const p1 = { x: 30, y: 165 };
  const p2 = { x: 200, y: 165 };
  const p3 = { x: 30, y: 30 };

  const givenKey = Object.keys(given)[0];
  const givenVal = given[givenKey];
  const accentColor = isCorrect === true ? "#00ff88" : isCorrect === false ? "#ff4466" : "#00f0ff";

  let labels = { short: "", long: "", hyp: "" };
  if (givenKey === "short") {
    labels.short = givenVal;
    labels.long = find === "long" ? "?" : "";
    labels.hyp = find === "hypotenuse" ? "?" : "";
  } else if (givenKey === "long") {
    labels.long = givenVal;
    labels.short = find === "short" ? "?" : "";
    labels.hyp = find === "hypotenuse" ? "?" : "";
  } else if (givenKey === "hyp") {
    labels.hyp = givenVal;
    labels.short = find === "short" ? "?" : "";
    labels.long = find === "long" ? "?" : "";
  }

  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", maxWidth: 240 }}>
      <polygon
        points={`${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y}`}
        fill="rgba(255,0,170,0.05)"
        stroke={accentColor}
        strokeWidth="2.5"
        style={{ transition: "stroke 0.3s" }}
      />
      <polyline
        points={`${p1.x + 18},${p1.y} ${p1.x + 18},${p1.y - 18} ${p1.x},${p1.y - 18}`}
        fill="none" stroke={accentColor} strokeWidth="1.5" opacity={0.6}
      />
      <text x={p2.x - 38} y={p2.y - 8} fill="#8899aa" fontSize="11" fontFamily="monospace">30°</text>
      <text x={p3.x + 8} y={p3.y + 22} fill="#8899aa" fontSize="11" fontFamily="monospace">60°</text>

      <g transform={`translate(${p1.x - 20}, ${(p1.y + p3.y) / 2 + 4})`}>
        {labels.short === "?" ? (
          <text x={0} y={0} fill={accentColor} fontSize="16" fontWeight="800" textAnchor="middle" fontFamily="monospace">?</text>
        ) : labels.short ? (
          <RadicalSVG value={labels.short} x={0} y={0} />
        ) : null}
      </g>

      <g transform={`translate(${(p1.x + p2.x) / 2}, ${p1.y + 18})`}>
        {labels.long === "?" ? (
          <text x={0} y={0} fill={accentColor} fontSize="16" fontWeight="800" textAnchor="middle" fontFamily="monospace">?</text>
        ) : labels.long ? (
          <RadicalSVG value={labels.long} x={0} y={0} />
        ) : null}
      </g>

      <g transform={`translate(${(p2.x + p3.x) / 2 + 14}, ${(p2.y + p3.y) / 2 - 4})`}>
        {labels.hyp === "?" ? (
          <text x={0} y={0} fill={accentColor} fontSize="16" fontWeight="800" textAnchor="middle" fontFamily="monospace">?</text>
        ) : labels.hyp ? (
          <RadicalSVG value={labels.hyp} x={0} y={0} />
        ) : null}
      </g>
    </svg>
  );
}

function RadicalSVG({ value, x, y, color = "#e0e8f0" }) {
  if (!value) return null;
  const f = formatRadical(value);
  if (f.plain) {
    return <text x={x} y={y} fill={color} fontSize="13" fontWeight="600" textAnchor="middle" fontFamily="monospace">{f.plain}</text>;
  }
  const coeffWidth = f.coeff ? f.coeff.length * 8 : 0;
  const totalWidth = coeffWidth + 10 + f.rad.length * 8;
  const startX = x - totalWidth / 2;
  return (
    <g>
      {f.coeff && <text x={startX + coeffWidth / 2} y={y} fill={color} fontSize="13" fontWeight="600" textAnchor="middle" fontFamily="monospace">{f.coeff}</text>}
      <text x={startX + coeffWidth + 5} y={y} fill={color} fontSize="12" textAnchor="middle" fontFamily="monospace">√</text>
      <text x={startX + coeffWidth + 10 + f.rad.length * 4} y={y} fill={color} fontSize="12" fontWeight="600" textAnchor="middle" fontFamily="monospace" textDecoration="overline">{f.rad}</text>
    </g>
  );
}

// ─── Hint System (progressive — more detail per attempt) ────────────────────
function getHint(problem, attempts) {
  const { type, given, find } = problem;
  const hints = [];

  if (type === "45-45-90") {
    if (find === "hypotenuse") {
      hints.push("In a 45-45-90 triangle, hypotenuse = leg × √2");
      hints.push(`Multiply ${given.leg1} by √2`);
      hints.push("Remember: a√b × √2 = a√(b×2). Simplify if possible!");
    }
    if (find === "leg") {
      hints.push("In a 45-45-90 triangle, each leg = hypotenuse ÷ √2");
      hints.push(`Divide ${given.hyp} by √2, then rationalize`);
      hints.push("To rationalize: multiply top and bottom by √2");
    }
  }
  if (type === "30-60-90") {
    const givenKey = Object.keys(given)[0];
    if (givenKey === "short" && find === "long") {
      hints.push("Long leg = short leg × √3");
      hints.push(`Multiply ${given.short} by √3`);
    }
    if (givenKey === "short" && find === "hypotenuse") {
      hints.push("Hypotenuse = short leg × 2");
      hints.push(`Double ${given.short}`);
    }
    if (givenKey === "long" && find === "short") {
      hints.push("Short leg = long leg ÷ √3. Rationalize!");
      hints.push(`Divide ${given.long} by √3, multiply top & bottom by √3`);
      hints.push("√3 ÷ √3 = 1 and √3 × √3 = 3");
    }
    if (givenKey === "long" && find === "hypotenuse") {
      hints.push("First find the short leg (÷ √3), then double it.");
      hints.push(`Short = ${given.long} ÷ √3 (rationalize!), then × 2`);
    }
    if (givenKey === "hyp" && find === "short") {
      hints.push("Short leg = hypotenuse ÷ 2");
      hints.push(`Just divide ${given.hyp} by 2`);
    }
    if (givenKey === "hyp" && find === "long") {
      hints.push("Find the short leg (÷ 2), then multiply by √3");
      hints.push(`Short = ${given.hyp} ÷ 2, then long = short × √3`);
    }
  }

  const idx = Math.min(attempts, hints.length - 1);
  return hints[idx] || hints[hints.length - 1] || "Use the special right triangle ratios!";
}

// ─── Mystery Image (Geometric Mandala) ──────────────────────────────────────
function MysteryImage({ solvedCount }) {
  const gridSize = 4;
  const cells = [];
  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      const idx = row * gridSize + col;
      cells.push({ row, col, idx, revealed: idx < solvedCount });
    }
  }

  return (
    <div style={{ position: "relative", width: "100%", maxWidth: 320, aspectRatio: "1", margin: "0 auto" }}>
      <svg viewBox="0 0 320 320" style={{ width: "100%", height: "100%", position: "absolute", borderRadius: 16 }}>
        <defs>
          <radialGradient id="bg_grad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#1a0033" />
            <stop offset="100%" stopColor="#0a001a" />
          </radialGradient>
          <linearGradient id="neon1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00f0ff" />
            <stop offset="100%" stopColor="#ff00aa" />
          </linearGradient>
          <linearGradient id="neon2" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffcc00" />
            <stop offset="100%" stopColor="#00ff88" />
          </linearGradient>
          <linearGradient id="neon3" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ff6644" />
            <stop offset="100%" stopColor="#aa66ff" />
          </linearGradient>
        </defs>
        <rect width="320" height="320" fill="url(#bg_grad)" rx="16" />
        <g transform="translate(160,160)">
          {[0,30,60,90,120,150,180,210,240,270,300,330].map((angle, i) => (
            <g key={`ray-${i}`} transform={`rotate(${angle})`}>
              <line x1="0" y1="0" x2="0" y2="-140" stroke="url(#neon1)" strokeWidth="1.5" opacity="0.6" />
              <polygon points="0,-120 -8,-100 8,-100" fill="url(#neon2)" opacity="0.4" />
            </g>
          ))}
          <circle cx="0" cy="0" r="120" fill="none" stroke="url(#neon1)" strokeWidth="2" opacity="0.5" />
          <circle cx="0" cy="0" r="90" fill="none" stroke="url(#neon3)" strokeWidth="2" opacity="0.6" />
          <circle cx="0" cy="0" r="60" fill="none" stroke="url(#neon2)" strokeWidth="2.5" opacity="0.7" />
          <circle cx="0" cy="0" r="30" fill="none" stroke="#ff00aa" strokeWidth="2" opacity="0.8" />
          {[0,60,120,180,240,300].map((angle, i) => (
            <g key={`hex-${i}`} transform={`rotate(${angle})`}>
              <rect x="-6" y="-80" width="12" height="12" rx="2" fill={i % 2 === 0 ? "#00f0ff" : "#ff00aa"} opacity="0.7" transform="rotate(45,-6,-80)" />
            </g>
          ))}
          {[0,45,90,135,180,225,270,315].map((angle, i) => (
            <g key={`tri-${i}`} transform={`rotate(${angle})`}>
              <polygon points="0,-50 -12,-70 12,-70" fill="none" stroke={i % 2 === 0 ? "#ffcc00" : "#00ff88"} strokeWidth="1.5" opacity="0.6" />
            </g>
          ))}
          <polygon points="0,-20 6,-8 18,-6 9,4 12,18 0,11 -12,18 -9,4 -18,-6 -6,-8" fill="url(#neon1)" opacity="0.9" />
          <text y="145" textAnchor="middle" fill="#00f0ff" fontSize="14" fontWeight="700" fontFamily="monospace" opacity="0.9">
            ▲ TRIANGLE MASTER ▲
          </text>
        </g>
      </svg>
      <div style={{
        position: "absolute", inset: 0,
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gridTemplateRows: "repeat(4, 1fr)",
        gap: 2,
        borderRadius: 16,
        overflow: "hidden",
      }}>
        {cells.map(cell => (
          <div
            key={cell.idx}
            style={{
              backgroundColor: cell.revealed ? "transparent" : "#0d1117",
              transition: "all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)",
              opacity: cell.revealed ? 0 : 1,
              transform: cell.revealed ? "scale(0) rotateY(180deg)" : "scale(1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: cell.revealed ? "none" : "1px solid rgba(0,240,255,0.1)",
            }}
          >
            {!cell.revealed && (
              <span style={{
                color: "rgba(0,240,255,0.2)",
                fontSize: 20,
                fontWeight: 800,
                fontFamily: "monospace",
              }}>
                {cell.idx + 1}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Level System ───────────────────────────────────────────────────────────
function getLevel(solved) {
  if (solved >= 16) return { title: "TRIANGLE LEGEND", emoji: "👑", color: "#ffcc00" };
  if (solved >= 12) return { title: "Geometry Wizard", emoji: "🧙", color: "#aa66ff" };
  if (solved >= 8) return { title: "Triangle Pro", emoji: "🔥", color: "#ff6644" };
  if (solved >= 4) return { title: "Shape Solver", emoji: "⚡", color: "#00f0ff" };
  if (solved >= 1) return { title: "Math Explorer", emoji: "🔍", color: "#00ff88" };
  return { title: "Ready to Start", emoji: "▲", color: "#556677" };
}

// ─── Streak Display ─────────────────────────────────────────────────────────
function StreakBadge({ streak, bestStreak }) {
  if (streak === 0 && bestStreak === 0) return null;
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 16,
      marginBottom: 8,
    }}>
      {streak > 0 && (
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "4px 14px",
          background: streak >= 5 ? "rgba(255,102,68,0.15)" : streak >= 3 ? "rgba(255,204,0,0.12)" : "rgba(0,255,136,0.1)",
          border: `1px solid ${streak >= 5 ? "rgba(255,102,68,0.4)" : streak >= 3 ? "rgba(255,204,0,0.3)" : "rgba(0,255,136,0.2)"}`,
          borderRadius: 20,
          animation: streak >= 3 ? "streakPulse 0.8s ease-in-out infinite" : "none",
        }}>
          <span style={{ fontSize: streak >= 5 ? 20 : 16 }}>
            {streak >= 5 ? "🔥" : streak >= 3 ? "⚡" : "✨"}
          </span>
          <span style={{
            fontFamily: "monospace",
            fontWeight: 800,
            fontSize: 14,
            color: streak >= 5 ? "#ff6644" : streak >= 3 ? "#ffcc00" : "#00ff88",
          }}>
            {streak} streak!
          </span>
        </div>
      )}
      {bestStreak > 0 && (
        <div style={{ fontSize: 11, fontFamily: "monospace", color: "#556677" }}>
          Best: {bestStreak}
        </div>
      )}
    </div>
  );
}

// ─── Problem Card ───────────────────────────────────────────────────────────
function ProblemCard({ problem, index, solved, onSolve, onWrongAnswer }) {
  const [input, setInput] = useState("");
  const [status, setStatus] = useState(null);
  const [focused, setFocused] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [shake, setShake] = useState(false);
  const [showMiniConfetti, setShowMiniConfetti] = useState(false);
  const [showPoints, setShowPoints] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const inputRef = useRef(null);

  const isSolved = solved.has(problem.id);

  const handleSubmit = () => {
    if (isSolved) return;
    if (!input.trim()) {
      // Flash the input border to signal "type something"
      setShake(true);
      setTimeout(() => setShake(false), 500);
      inputRef.current?.focus();
      return;
    }
    const correct = checkAnswer(input.trim(), problem.answer);
    if (correct) {
      setStatus("correct");
      setShowMiniConfetti(true);
      setShowPoints(true);
      setTimeout(() => setShowMiniConfetti(false), 700);
      setTimeout(() => setShowPoints(false), 1200);
      onSolve(problem.id, attempts);
    } else {
      setStatus("wrong");
      setShake(true);
      setAttempts(prev => prev + 1);
      playWrongSound();
      onWrongAnswer();
      setTimeout(() => setShake(false), 500);
      setTimeout(() => setStatus(null), 1500);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSubmit();
  };

  const difficultyStars = "★".repeat(problem.difficulty) + "☆".repeat(4 - problem.difficulty);
  const accentColor = isSolved ? "#00ff88" : status === "wrong" ? "#ff4466" : "#00f0ff";
  const borderColor = status === "wrong" ? "#ff4466" : focused ? "#00f0ff" : "rgba(0,240,255,0.25)";
  const pointsValue = POINTS_MAP[problem.difficulty];
  const TriangleComponent = problem.type === "45-45-90" ? Triangle4590 : Triangle3060;

  return (
    <div className="problem-card" style={{
      background: isSolved
        ? "linear-gradient(135deg, rgba(0,255,136,0.08), rgba(0,240,255,0.05))"
        : "linear-gradient(135deg, rgba(13,17,23,0.9), rgba(22,27,34,0.95))",
      border: `1.5px solid ${isSolved ? "rgba(0,255,136,0.3)" : "rgba(0,240,255,0.15)"}`,
      borderRadius: 16,
      padding: "20px 16px 16px",
      position: "relative",
      overflow: "hidden",
      animation: shake ? "shakeCard 0.4s ease-in-out" : isSolved ? "solvedPulse 0.6s ease-out" : "none",
      transition: "all 0.3s ease",
    }}>
      <MiniConfetti active={showMiniConfetti} />
      <FloatingPoints points={pointsValue} show={showPoints} />

      {/* Problem number badge */}
      <div style={{
        position: "absolute", top: 10, left: 12,
        background: isSolved ? "#00ff88" : accentColor,
        color: "#0d1117",
        fontSize: 11,
        fontWeight: 800,
        fontFamily: "monospace",
        padding: "2px 8px",
        borderRadius: 6,
      }}>
        #{index + 1}
      </div>

      {/* Points badge */}
      <div style={{
        position: "absolute", top: 28, left: 12,
        fontSize: 9,
        fontFamily: "monospace",
        color: isSolved ? "#00ff88" : "#556677",
        fontWeight: 600,
      }}>
        {isSolved ? `+${pointsValue}` : `${pointsValue} pts`}
      </div>

      {/* Difficulty */}
      <div style={{
        position: "absolute", top: 10, right: 12,
        fontSize: 10,
        color: "#ffcc00",
        letterSpacing: 1,
      }}>
        {difficultyStars}
      </div>

      {/* Type badge */}
      <div style={{ textAlign: "center", marginTop: 24, marginBottom: 8 }}>
        <span style={{
          fontSize: 10,
          fontFamily: "monospace",
          fontWeight: 700,
          color: problem.type === "45-45-90" ? "#00f0ff" : "#ff00aa",
          letterSpacing: 2,
          textTransform: "uppercase",
          background: problem.type === "45-45-90" ? "rgba(0,240,255,0.1)" : "rgba(255,0,170,0.1)",
          padding: "3px 10px",
          borderRadius: 4,
        }}>
          {problem.type}
        </span>
      </div>

      {/* Triangle */}
      <div style={{ display: "flex", justifyContent: "center", margin: "8px 0" }}>
        <TriangleComponent
          given={problem.given}
          find={problem.find}
          isCorrect={isSolved ? true : status === "wrong" ? false : null}
        />
      </div>

      {/* Find label */}
      <div style={{
        textAlign: "center",
        fontSize: 11,
        color: "#8899aa",
        fontFamily: "monospace",
        marginBottom: 8,
      }}>
        Find the <span style={{ color: accentColor, fontWeight: 700 }}>{problem.find === "leg" ? "legs" : problem.find === "short" ? "short leg" : problem.find === "long" ? "long leg" : "hypotenuse"}</span>
      </div>

      {/* Input or solved state */}
      {isSolved ? (
        <div style={{ textAlign: "center", padding: "10px 0" }}>
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            background: "rgba(0,255,136,0.1)",
            padding: "8px 16px",
            borderRadius: 10,
            border: "1px solid rgba(0,255,136,0.3)",
          }}>
            <span style={{ fontSize: 18 }}>✓</span>
            <RadicalDisplay value={problem.answer} style={{ color: "#00ff88", fontWeight: 700, fontSize: 16, fontFamily: "monospace" }} />
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "center" }}>
          <div style={{ display: "flex", gap: 6, width: "100%", maxWidth: 200 }}>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder="e.g. 4sqrt(3)"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
              aria-label={`Answer for problem ${index + 1}: find the ${problem.find}`}
              style={{
                flex: 1,
                background: "rgba(0,0,0,0.4)",
                border: `1.5px solid ${borderColor}`,
                borderRadius: 8,
                padding: "8px 12px",
                color: "#e0e8f0",
                fontSize: 14,
                fontFamily: "monospace",
                outline: "none",
                transition: "border-color 0.3s",
                minWidth: 0,
              }}
            />
            <button
              onClick={handleSubmit}
              className="go-btn"
              aria-label="Submit answer"
              style={{
                background: "linear-gradient(135deg, #00f0ff, #00aa88)",
                border: "none",
                borderRadius: 8,
                padding: "8px 14px",
                color: "#0d1117",
                fontWeight: 800,
                fontSize: 13,
                cursor: "pointer",
                fontFamily: "monospace",
                whiteSpace: "nowrap",
                transition: "transform 0.1s, box-shadow 0.2s",
              }}
            >
              GO
            </button>
          </div>

          <button
            onClick={() => setShowHint(!showHint)}
            style={{
              background: "none",
              border: "none",
              color: "#556677",
              fontSize: 11,
              cursor: "pointer",
              fontFamily: "monospace",
              padding: "4px 8px",
              transition: "color 0.2s",
            }}
            onMouseEnter={(e) => e.target.style.color = "#ffcc00"}
            onMouseLeave={(e) => e.target.style.color = "#556677"}
          >
            {showHint ? "hide hint" : `💡 hint${attempts > 0 ? ` (${attempts} wrong)` : ""}`}
          </button>

          {showHint && (
            <div style={{
              fontSize: 11,
              color: "#ffcc00",
              fontFamily: "monospace",
              textAlign: "center",
              padding: "6px 10px",
              background: "rgba(255,204,0,0.08)",
              borderRadius: 8,
              lineHeight: 1.4,
              maxWidth: 200,
              animation: "fadeInUp 0.2s ease-out",
            }}>
              {getHint(problem, attempts)}
            </div>
          )}

          {status === "wrong" && (
            <div style={{ fontSize: 11, color: "#ff4466", fontFamily: "monospace", animation: "fadeInUp 0.2s ease-out" }}>
              {attempts >= 3 ? "Check the hint for more detail!" : "Not quite — try again!"}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main App ───────────────────────────────────────────────────────────────
export default function App() {
  const saved = useMemo(() => loadProgress(), []);
  const [solved, setSolved] = useState(saved ? saved.solved : new Set());
  const [score, setScore] = useState(saved ? saved.score : 0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(saved ? saved.bestStreak : 0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [completedJustNow, setCompletedJustNow] = useState(false);
  const [shuffled, setShuffled] = useState(false);
  const [problemOrder, setProblemOrder] = useState(PROBLEMS.map((_, i) => i));
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  useEffect(() => {
    saveProgress(solved, score, bestStreak);
  }, [solved, score, bestStreak]);

  const handleSolve = useCallback((problemId, attempts) => {
    setSolved(prev => {
      const next = new Set(prev);
      next.add(problemId);
      if (next.size === 16) {
        setShowConfetti(true);
        setCompletedJustNow(true);
        playVictoryFanfare();
        setTimeout(() => setShowConfetti(false), 6000);
      }
      return next;
    });

    const problem = PROBLEMS.find(p => p.id === problemId);
    const basePoints = POINTS_MAP[problem.difficulty];
    const firstTryBonus = attempts === 0 ? Math.round(basePoints * 0.5) : 0;

    setStreak(prev => {
      const newStreak = prev + 1;
      const streakBonus = newStreak >= 5 ? Math.round(basePoints * 0.3) : newStreak >= 3 ? Math.round(basePoints * 0.15) : 0;
      const totalPoints = basePoints + firstTryBonus + streakBonus;
      setScore(s => s + totalPoints);

      setBestStreak(best => {
        const newBest = Math.max(best, newStreak);
        return newBest;
      });
      if (newStreak >= 3) playStreakSound(newStreak);
      else playCorrectSound();
      return newStreak;
    });
  }, []);

  const handleWrongAnswer = useCallback(() => {
    setStreak(0);
  }, []);

  const handleShuffle = () => {
    if (shuffled) {
      setProblemOrder(PROBLEMS.map((_, i) => i));
    } else {
      const order = PROBLEMS.map((_, i) => i);
      for (let i = order.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [order[i], order[j]] = [order[j], order[i]];
      }
      setProblemOrder(order);
    }
    setShuffled(!shuffled);
  };

  const handleReset = () => {
    setSolved(new Set());
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setCompletedJustNow(false);
    setShowResetConfirm(false);
    localStorage.removeItem("srt_progress");
  };

  const level = getLevel(solved.size);
  const progress = (solved.size / 16) * 100;

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(180deg, #070b14 0%, #0d1117 30%, #0a0f1a 100%)",
      color: "#e0e8f0",
      fontFamily: "'Segoe UI', system-ui, sans-serif",
      padding: "0 0 60px",
    }}>
      <style>{`
        @keyframes shakeCard {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }
        @keyframes solvedPulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.03); box-shadow: 0 0 30px rgba(0,255,136,0.3); }
          100% { transform: scale(1); }
        }
        @keyframes confettiFall {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes headerGlow {
          0%, 100% { text-shadow: 0 0 20px rgba(0,240,255,0.4); }
          50% { text-shadow: 0 0 40px rgba(0,240,255,0.8), 0 0 80px rgba(255,0,170,0.3); }
        }
        @keyframes completedGlow {
          0%, 100% { box-shadow: 0 0 20px rgba(255,204,0,0.3), inset 0 0 20px rgba(255,204,0,0.05); }
          50% { box-shadow: 0 0 40px rgba(255,204,0,0.6), inset 0 0 40px rgba(255,204,0,0.1); }
        }
        @keyframes streakPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        @keyframes miniExplode {
          0% { transform: translate(0, 0) scale(1); opacity: 1; }
          100% { transform: translate(var(--tx), var(--ty)) scale(0); opacity: 0; }
        }
        @keyframes floatUp {
          0% { opacity: 1; transform: translateX(-50%) translateY(0); }
          100% { opacity: 0; transform: translateX(-50%) translateY(-60px); }
        }
        @keyframes rainbowShift {
          0% { filter: hue-rotate(0deg); }
          100% { filter: hue-rotate(360deg); }
        }
        .problem-card {
          cursor: default;
          will-change: transform;
        }
        .problem-card:hover {
          box-shadow: 0 8px 24px rgba(0,0,0,0.3);
        }
        /* Only apply hover lift when not animating */
        .problem-card:not([style*="shakeCard"]):not([style*="solvedPulse"]):hover {
          transform: translateY(-2px);
        }
        .go-btn:hover {
          transform: scale(1.05);
          box-shadow: 0 0 12px rgba(0,240,255,0.4);
        }
        .go-btn:active {
          transform: scale(0.95);
        }
        button { -webkit-tap-highlight-color: transparent; }
        input { -webkit-tap-highlight-color: transparent; }
        input::placeholder { color: rgba(136,153,170,0.5); }
        @media (max-width: 480px) {
          .problem-card { padding: 16px 12px 12px !important; }
        }
      `}</style>

      <Confetti active={showConfetti} />

      {/* Header */}
      <div style={{
        textAlign: "center",
        padding: "32px 20px 24px",
        borderBottom: "1px solid rgba(0,240,255,0.1)",
        background: "linear-gradient(180deg, rgba(0,240,255,0.03) 0%, transparent 100%)",
      }}>
        <div style={{
          fontSize: 11,
          fontFamily: "monospace",
          letterSpacing: 4,
          color: "#556677",
          marginBottom: 8,
          textTransform: "uppercase",
        }}>
          Interactive Geometry
        </div>
        <h1 style={{
          fontSize: "clamp(22px, 5vw, 36px)",
          fontWeight: 900,
          margin: 0,
          background: "linear-gradient(135deg, #00f0ff 0%, #ff00aa 50%, #ffcc00 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          animation: "headerGlow 3s ease-in-out infinite",
          lineHeight: 1.2,
        }}>
          Special Right Triangles
        </h1>
        <div style={{
          fontSize: "clamp(14px, 3vw, 18px)",
          fontWeight: 300,
          color: "#8899aa",
          marginTop: 4,
          fontFamily: "monospace",
        }}>
          Mystery Puzzle
        </div>

        <div style={{
          marginTop: 16,
          padding: "8px 16px",
          background: "rgba(0,240,255,0.06)",
          borderRadius: 10,
          display: "inline-block",
          border: "1px solid rgba(0,240,255,0.1)",
        }}>
          <span style={{ fontSize: 11, color: "#8899aa", fontFamily: "monospace" }}>
            Type answers like: <span style={{ color: "#00f0ff" }}>4sqrt(3)</span> or <span style={{ color: "#00f0ff" }}>12</span> &nbsp;|&nbsp; First-try = bonus points!
          </span>
        </div>
      </div>

      {/* Progress & Level Section */}
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "20px 16px" }}>
        {/* Score */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          marginBottom: 4,
        }}>
          <span style={{
            fontSize: 12,
            fontFamily: "monospace",
            color: "#556677",
            letterSpacing: 2,
            textTransform: "uppercase",
          }}>Score</span>
          <span style={{
            fontSize: 22,
            fontWeight: 900,
            fontFamily: "monospace",
            color: "#ffcc00",
            textShadow: "0 0 10px rgba(255,204,0,0.3)",
            minWidth: 60,
            textAlign: "center",
          }}>
            {score.toLocaleString()}
          </span>
        </div>

        <StreakBadge streak={streak} bestStreak={bestStreak} />

        {/* Level badge */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          marginBottom: 12,
        }}>
          <span style={{ fontSize: 24 }}>{level.emoji}</span>
          <span style={{
            fontSize: 16,
            fontWeight: 800,
            fontFamily: "monospace",
            color: level.color,
            letterSpacing: 1,
          }}>
            {level.title}
          </span>
        </div>

        {/* Progress bar */}
        <div
          role="progressbar"
          aria-valuenow={solved.size}
          aria-valuemin={0}
          aria-valuemax={16}
          aria-label={`Progress: ${solved.size} of 16 problems solved`}
          style={{
          position: "relative",
          height: 14,
          background: "rgba(0,240,255,0.08)",
          borderRadius: 7,
          overflow: "hidden",
          border: "1px solid rgba(0,240,255,0.15)",
          maxWidth: 400,
          margin: "0 auto",
        }}>
          <div style={{
            height: "100%",
            width: `${progress}%`,
            background: solved.size === 16
              ? "linear-gradient(90deg, #ffcc00, #ff6644, #ff00aa, #aa66ff, #00f0ff)"
              : "linear-gradient(90deg, #00f0ff, #00ff88)",
            borderRadius: 7,
            transition: "width 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)",
            boxShadow: "0 0 10px rgba(0,240,255,0.4)",
            animation: solved.size === 16 ? "rainbowShift 3s linear infinite" : "none",
          }} />
        </div>
        <div style={{
          textAlign: "center",
          fontSize: 12,
          fontFamily: "monospace",
          color: "#556677",
          marginTop: 6,
        }}>
          {solved.size} / 16 solved
        </div>

        {/* Action buttons */}
        <div style={{
          display: "flex",
          justifyContent: "center",
          gap: 10,
          marginTop: 12,
        }}>
          <button
            onClick={handleShuffle}
            style={{
              background: "rgba(0,240,255,0.08)",
              border: "1px solid rgba(0,240,255,0.2)",
              borderRadius: 8,
              padding: "6px 14px",
              color: shuffled ? "#ffcc00" : "#8899aa",
              fontSize: 11,
              fontFamily: "monospace",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            {shuffled ? "🔀 Shuffled" : "🔀 Shuffle"}
          </button>
          {solved.size > 0 && (
            <button
              onClick={() => setShowResetConfirm(true)}
              style={{
                background: "rgba(255,68,102,0.08)",
                border: "1px solid rgba(255,68,102,0.2)",
                borderRadius: 8,
                padding: "6px 14px",
                color: "#ff4466",
                fontSize: 11,
                fontFamily: "monospace",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              🔄 Reset
            </button>
          )}
        </div>

        {showResetConfirm && (
          <div style={{
            textAlign: "center",
            marginTop: 8,
            padding: "10px 16px",
            background: "rgba(255,68,102,0.1)",
            border: "1px solid rgba(255,68,102,0.3)",
            borderRadius: 10,
            animation: "fadeInUp 0.2s ease-out",
          }}>
            <span style={{ fontSize: 12, color: "#ff4466", fontFamily: "monospace" }}>
              Reset all progress?
            </span>
            <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 8 }}>
              <button onClick={handleReset} style={{
                background: "#ff4466", border: "none", borderRadius: 6,
                padding: "4px 16px", color: "#fff", fontSize: 11,
                fontWeight: 700, fontFamily: "monospace", cursor: "pointer",
              }}>Yes, reset</button>
              <button onClick={() => setShowResetConfirm(false)} style={{
                background: "rgba(255,255,255,0.1)", border: "none", borderRadius: 6,
                padding: "4px 16px", color: "#8899aa", fontSize: 11,
                fontFamily: "monospace", cursor: "pointer",
              }}>Cancel</button>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div style={{
        maxWidth: 1200,
        margin: "0 auto",
        padding: "0 16px",
        display: "flex",
        flexDirection: "column",
        gap: 32,
      }}>
        {/* Mystery Image */}
        <div style={{
          animation: completedJustNow ? "completedGlow 1.5s ease-in-out infinite" : "none",
          borderRadius: 20,
          padding: 4,
        }}>
          <div style={{ textAlign: "center", marginBottom: 12 }}>
            <span style={{
              fontSize: 12,
              fontFamily: "monospace",
              letterSpacing: 3,
              color: "#556677",
              textTransform: "uppercase",
            }}>
              {solved.size === 16 ? "🏆 Mystery Revealed! 🏆" : "▲ Mystery Image ▲"}
            </span>
          </div>
          <MysteryImage solvedCount={solved.size} />
        </div>

        {/* Reference cards */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: 12,
          maxWidth: 600,
          margin: "0 auto",
          width: "100%",
        }}>
          <div style={{
            background: "rgba(0,240,255,0.05)",
            border: "1px solid rgba(0,240,255,0.15)",
            borderRadius: 12,
            padding: "12px 16px",
            textAlign: "center",
          }}>
            <div style={{ fontSize: 11, fontFamily: "monospace", color: "#00f0ff", fontWeight: 700, marginBottom: 4, letterSpacing: 2 }}>45-45-90</div>
            <div style={{ fontSize: 13, fontFamily: "monospace", color: "#8899aa" }}>
              Legs: <span style={{ color: "#e0e8f0" }}>x</span> &nbsp;|&nbsp; Hyp: <span style={{ color: "#e0e8f0" }}>x√2</span>
            </div>
          </div>
          <div style={{
            background: "rgba(255,0,170,0.05)",
            border: "1px solid rgba(255,0,170,0.15)",
            borderRadius: 12,
            padding: "12px 16px",
            textAlign: "center",
          }}>
            <div style={{ fontSize: 11, fontFamily: "monospace", color: "#ff00aa", fontWeight: 700, marginBottom: 4, letterSpacing: 2 }}>30-60-90</div>
            <div style={{ fontSize: 13, fontFamily: "monospace", color: "#8899aa" }}>
              Short: <span style={{ color: "#e0e8f0" }}>x</span> &nbsp;|&nbsp; Long: <span style={{ color: "#e0e8f0" }}>x√3</span> &nbsp;|&nbsp; Hyp: <span style={{ color: "#e0e8f0" }}>2x</span>
            </div>
          </div>
        </div>

        {/* Problems Grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
          gap: 16,
        }}>
          {problemOrder.map((orderIdx, displayIdx) => {
            const problem = PROBLEMS[orderIdx];
            return (
              <div key={problem.id} style={{
                animation: `fadeInUp 0.4s ease-out ${displayIdx * 0.05}s both`,
              }}>
                <ProblemCard
                  problem={problem}
                  index={orderIdx}
                  solved={solved}
                  onSolve={handleSolve}
                  onWrongAnswer={handleWrongAnswer}
                />
              </div>
            );
          })}
        </div>

        {/* Completion message */}
        {solved.size === 16 && (
          <div style={{
            textAlign: "center",
            padding: "32px 20px",
            animation: "fadeInUp 0.6s ease-out",
          }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>👑</div>
            <h2 style={{
              fontSize: 28,
              fontWeight: 900,
              background: "linear-gradient(135deg, #ffcc00, #ff6644)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              margin: "0 0 8px",
            }}>
              TRIANGLE LEGEND!
            </h2>
            <p style={{ color: "#8899aa", fontFamily: "monospace", fontSize: 14, margin: "0 0 4px" }}>
              You mastered all 16 special right triangle problems.
            </p>
            <p style={{
              color: "#ffcc00",
              fontFamily: "monospace",
              fontSize: 18,
              fontWeight: 800,
              margin: "8px 0 0",
            }}>
              Final Score: {score.toLocaleString()}
            </p>
            {bestStreak > 0 && (
              <p style={{ color: "#ff6644", fontFamily: "monospace", fontSize: 13, margin: "4px 0 0" }}>
                Best Streak: {bestStreak} 🔥
              </p>
            )}
            <button
              onClick={() => setShowResetConfirm(true)}
              style={{
                marginTop: 20,
                background: "linear-gradient(135deg, #00f0ff, #ff00aa)",
                border: "none",
                borderRadius: 10,
                padding: "10px 28px",
                color: "#fff",
                fontSize: 14,
                fontWeight: 800,
                fontFamily: "monospace",
                cursor: "pointer",
                letterSpacing: 1,
              }}
            >
              🔄 Play Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

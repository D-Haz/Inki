/*
  Sand Dune Wind Simulation (Mic Reactive)
  - Particles advected by curl-noise + mic-driven wind
  - Edge wrapping (toroidal)
  - Reset button to reseed dunes
  - Graceful fallback if microphone is unavailable
*/

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d', { alpha: true });

let devicePixelRatioScale = 1;
let width = 0;
let height = 0;

function resizeCanvas() {
  devicePixelRatioScale = Math.min(window.devicePixelRatio || 1, 2);
  width = Math.floor(window.innerWidth * devicePixelRatioScale);
  height = Math.floor(window.innerHeight * devicePixelRatioScale);
  canvas.width = width;
  canvas.height = height;
  canvas.style.width = `${Math.floor(width / devicePixelRatioScale)}px`;
  canvas.style.height = `${Math.floor(height / devicePixelRatioScale)}px`;

  // Redraw background fade base
  ctx.fillStyle = 'rgba(0,0,0,1)';
  ctx.fillRect(0, 0, width, height);
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// --------------------- Utility: Hash-based Value Noise 2D + FBM ---------------------
function hash32(x, y) {
  // 2D integer hash → [0,1)
  let h = x * 374761393 + y * 668265263; // large primes
  h = (h ^ (h >>> 13)) * 1274126177;
  h = (h ^ (h >>> 16)) >>> 0;
  return h / 4294967296;
}

function valueNoise2D(x, y) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;

  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);

  const n00 = hash32(xi, yi);
  const n10 = hash32(xi + 1, yi);
  const n01 = hash32(xi, yi + 1);
  const n11 = hash32(xi + 1, yi + 1);

  const nx0 = n00 * (1 - u) + n10 * u;
  const nx1 = n01 * (1 - u) + n11 * u;
  return nx0 * (1 - v) + nx1 * v;
}

function fbm2D(x, y, octaves = 4, lacunarity = 2.0, gain = 0.5) {
  let amp = 0.5;
  let freq = 1.0;
  let sum = 0.0;
  for (let i = 0; i < octaves; i++) {
    sum += amp * valueNoise2D(x * freq, y * freq);
    freq *= lacunarity;
    amp *= gain;
  }
  return sum;
}

// Curl from scalar noise field s(x,y): v = (ds/dy, -ds/dx)
function curlNoise2D(x, y, t) {
  const scale = 0.0018; // spatial scale of dunes
  const timeDrift = t * 0.00008; // slow evolution

  const eps = 0.001;
  const s = (xx, yy) => fbm2D(xx * scale + timeDrift, yy * scale - timeDrift, 4, 2.0, 0.52);

  const s_x1 = s(x + eps, y);
  const s_x0 = s(x - eps, y);
  const s_y1 = s(x, y + eps);
  const s_y0 = s(x, y - eps);

  const ds_dx = (s_x1 - s_x0) / (2 * eps);
  const ds_dy = (s_y1 - s_y0) / (2 * eps);

  let vx = ds_dy;
  let vy = -ds_dx;

  // Normalize to consistent magnitude
  const mag = Math.hypot(vx, vy) + 1e-6;
  vx /= mag;
  vy /= mag;
  return { x: vx, y: vy };
}

// --------------------- Microphone loudness as wind ---------------------
let audioContext = null;
let analyser = null;
let micTimeData = null;
let micReady = false;
let windStrength = 0; // 0..1

async function initAudio() {
  if (micReady) return;
  try {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
      },
      video: false,
    });

    analyser = audioContext.createAnalyser();
    analyser.fftSize = 1024;
    const source = audioContext.createMediaStreamSource(stream);
    source.connect(analyser);
    micTimeData = new Uint8Array(analyser.fftSize);

    micReady = true;
  } catch (err) {
    // Mic not available; simulate gentle breeze
    console.warn('Microphone unavailable; falling back to ambient breeze.', err);
    micReady = false;
  }
}

function estimateMicLoudness() {
  if (!micReady || !analyser || !micTimeData) {
    // Ambient breeze with slow variation
    const t = performance.now() * 0.0003;
    const ambient = 0.08 + 0.04 * Math.sin(t) + 0.02 * Math.sin(t * 0.71);
    return Math.max(0, ambient);
  }
  analyser.getByteTimeDomainData(micTimeData);
  let sumSquares = 0;
  for (let i = 0; i < micTimeData.length; i++) {
    const v = (micTimeData[i] - 128) / 128; // -1..1
    sumSquares += v * v;
  }
  const rms = Math.sqrt(sumSquares / micTimeData.length); // 0..~1
  // Map RMS to a more sensitive curve for "blows"
  const boosted = Math.min(1, Math.pow(rms * 3.2, 1.2));
  return boosted;
}

// Auto-init audio on first interaction
function initAudioOnFirstInteraction() {
  const once = async () => {
    try {
      await initAudio();
      if (audioContext && audioContext.state === 'suspended') {
        await audioContext.resume();
      }
    } catch (_) {}
  };
  window.addEventListener('pointerdown', once, { once: true });
  window.addEventListener('keydown', once, { once: true });
}
initAudioOnFirstInteraction();

// --------------------- Particle system ---------------------
const sandColor = '#e6d7a4';
const particleAlpha = 0.08; // each particle is very faint
const backgroundFadeAlpha = 0.08; // how quickly trails fade

let particleCount = 0;
let posX = null;
let posY = null;
let velX = null;
let velY = null;

function computeDesiredParticleCount() {
  const pixels = width * height;
  // about 1 particle per ~1500 device pixels, clamped
  return Math.max(1500, Math.min(9000, Math.floor(pixels / 1500)));
}

function seedDunes() {
  particleCount = computeDesiredParticleCount();
  posX = new Float32Array(particleCount);
  posY = new Float32Array(particleCount);
  velX = new Float32Array(particleCount);
  velY = new Float32Array(particleCount);

  // Create a few mounds near lower half
  const numMounds = 3 + Math.floor(Math.random() * 3);
  const mounds = [];
  for (let i = 0; i < numMounds; i++) {
    const cx = (0.15 + 0.7 * Math.random()) * width;
    const cy = (0.55 + 0.35 * Math.random()) * height;
    const radius = (0.06 + Math.random() * 0.1) * Math.min(width, height);
    mounds.push({ cx, cy, radius });
  }

  for (let i = 0; i < particleCount; i++) {
    const m = mounds[i % mounds.length];
    const angle = Math.random() * Math.PI * 2;
    const r = m.radius * Math.sqrt(Math.random());
    posX[i] = m.cx + Math.cos(angle) * r;
    posY[i] = m.cy + Math.sin(angle) * r;

    // Small random initial velocity
    velX[i] = (Math.random() - 0.5) * 0.2;
    velY[i] = (Math.random() - 0.5) * 0.2;
  }
}
seedDunes();

// Reset button and hotkey
const resetButton = document.getElementById('resetButton');
resetButton.addEventListener('click', () => {
  seedDunes();
});
window.addEventListener('keydown', (e) => {
  if (e.key.toLowerCase() === 'r') {
    seedDunes();
  }
});

// --------------------- Simulation loop ---------------------
let lastTime = performance.now();

function step() {
  const now = performance.now();
  const dtMs = now - lastTime;
  lastTime = now;
  const dt = Math.min(33, dtMs) / 1000; // seconds, clamp

  // Background fade for trails
  ctx.fillStyle = `rgba(20, 19, 17, ${backgroundFadeAlpha})`;
  ctx.fillRect(0, 0, width, height);

  // Update wind strength
  const targetWind = estimateMicLoudness(); // 0..1
  const smoothing = 0.08;
  windStrength = windStrength + (targetWind - windStrength) * smoothing;

  // Global wind vector: mostly to the right, slight lift that grows with wind
  const windAngle = 0.02 + 0.12 * windStrength; // radians
  const windSpeed = 20 + 240 * Math.pow(windStrength, 1.4); // pixels/s under device pixel ratio
  const globalWindX = Math.cos(windAngle) * windSpeed;
  const globalWindY = Math.sin(windAngle) * (windSpeed * 0.35);

  // Draw particles
  ctx.globalCompositeOperation = 'lighter';
  ctx.fillStyle = sandColor;
  ctx.globalAlpha = particleAlpha;

  const flowStrength = 35; // pixels/s from curl noise
  const drag = 0.92; // velocity retention per frame (approx)

  for (let i = 0; i < particleCount; i++) {
    const x = posX[i];
    const y = posY[i];

    const flow = curlNoise2D(x, y, now);

    // accelerate by flow and wind
    velX[i] += (flow.x * flowStrength + globalWindX) * dt;
    velY[i] += (flow.y * flowStrength + globalWindY) * dt;

    // damping for soft sand effect
    velX[i] *= drag;
    velY[i] *= drag;

    // integrate
    let nx = x + velX[i] * dt;
    let ny = y + velY[i] * dt;

    // wrap
    if (nx < 0) nx += width;
    if (nx >= width) nx -= width;
    if (ny < 0) ny += height;
    if (ny >= height) ny -= height;

    posX[i] = nx;
    posY[i] = ny;

    // render
    // small soft particle; a 1.5x1.5 rect is fast and looks good at DPR scaling
    ctx.fillRect(nx, ny, 1.5, 1.5);
  }

  ctx.globalAlpha = 1.0;
  ctx.globalCompositeOperation = 'source-over';

  requestAnimationFrame(step);
}

requestAnimationFrame(step);

// Try to kick off audio init after short delay for some browsers
setTimeout(() => {
  initAudio().catch(() => {});
}, 300);
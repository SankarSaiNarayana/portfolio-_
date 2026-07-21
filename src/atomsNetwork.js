/**
 * Atoms network — a constellation of drifting nodes joined by faint lines
 * (the Stack Overflow-style "connected atoms" background), tuned to the
 * site's cobalt/cyan palette. Runs on a fixed canvas behind the glass
 * panels so the backdrop blur has real moving detail to refract.
 *
 * Reduce-motion: the constellation stays and keeps a very slow, spacelike
 * drift (a quarter of the normal speed) with no cursor-reactive lines —
 * calm ambient depth instead of an attention-grabbing animation.
 *
 * Perf: node count scales with viewport area, the loop pauses when the
 * tab is hidden, and rendering is capped at 2x devicePixelRatio.
 */

const LINK_DIST = 170;
const MOUSE_DIST = 200;
const MAX_SPEED = 0.16;
const CALM_FACTOR = 0.25; // drift speed under reduce-motion
const SCROLL_PARALLAX = 0.18; // how much the field slides as the page scrolls
const DENSITY = 1 / 13500; // nodes per px² (capped below)
const MAX_NODES = 150;

const NODE_COLORS = [
  [140, 210, 255], // ice blue
  [66, 199, 255], // accent cyan
  [110, 140, 250], // soft indigo
];

let canvas = null;
let ctx = null;
let nodes = [];
let rafId = 0;
let running = false;
let calmMode = false;
let detach = null;
let scrollOffset = 0;
const mouse = { x: null, y: null };

function motionDisabled() {
  return (
    window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
    document.documentElement.classList.contains('reduce-motion-user')
  );
}

function rand(min, max) {
  return min + Math.random() * (max - min);
}

function seedNodes(w, h) {
  const count = Math.min(MAX_NODES, Math.max(34, Math.round(w * h * DENSITY)));
  nodes = Array.from({ length: count }, () => ({
    x: rand(0, w),
    y: rand(0, h),
    vx: rand(-MAX_SPEED, MAX_SPEED),
    vy: rand(-MAX_SPEED, MAX_SPEED),
    r: rand(1.6, 3.2),
    c: NODE_COLORS[(Math.random() * NODE_COLORS.length) | 0],
  }));
}

function resize() {
  if (!canvas) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = window.innerWidth;
  const h = window.innerHeight;
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  seedNodes(w, h);
}

function update(speed) {
  const w = window.innerWidth;
  const h = window.innerHeight;
  for (const n of nodes) {
    n.x += n.vx * speed;
    n.y += n.vy * speed;
    // Drift through the edges and re-enter on the other side.
    if (n.x < -14) n.x = w + 14;
    else if (n.x > w + 14) n.x = -14;
    if (n.y < -14) n.y = h + 14;
    else if (n.y > h + 14) n.y = -14;
  }
}

function draw(withMouse) {
  const w = window.innerWidth;
  const h = window.innerHeight;
  ctx.clearRect(0, 0, w, h);

  // Scroll parallax: the field slides up as the page scrolls down, wrapping
  // around, so every section reveals a different slice of the constellation.
  const span = h + 28;
  const off = scrollOffset * SCROLL_PARALLAX;
  const pts = nodes.map((n) => ({
    x: n.x,
    y: ((((n.y - off + 14) % span) + span) % span) - 14,
    r: n.r,
    c: n.c,
  }));

  ctx.lineWidth = 1.1;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i];
    for (let j = i + 1; j < pts.length; j++) {
      const b = pts[j];
      const dx = a.x - b.x;
      const dy = a.y - b.y;
      const d2 = dx * dx + dy * dy;
      if (d2 > LINK_DIST * LINK_DIST) continue;
      const alpha = (1 - Math.sqrt(d2) / LINK_DIST) * 0.4;
      ctx.strokeStyle = `rgba(96, 178, 255, ${alpha.toFixed(3)})`;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }

    // Lines reaching toward the cursor make the field feel alive.
    if (withMouse && mouse.x !== null) {
      const dx = a.x - mouse.x;
      const dy = a.y - mouse.y;
      const d2 = dx * dx + dy * dy;
      if (d2 < MOUSE_DIST * MOUSE_DIST) {
        const alpha = (1 - Math.sqrt(d2) / MOUSE_DIST) * 0.48;
        ctx.strokeStyle = `rgba(66, 199, 255, ${alpha.toFixed(3)})`;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(mouse.x, mouse.y);
        ctx.stroke();
      }
    }
  }

  for (const n of pts) {
    const [r, g, b] = n.c;
    // Soft halo behind each node, then the bright core.
    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.14)`;
    ctx.beginPath();
    ctx.arc(n.x, n.y, n.r * 2.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.9)`;
    ctx.beginPath();
    ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
    ctx.fill();
  }
}

function loop() {
  if (!running) return;
  if (motionDisabled() !== calmMode) {
    // Preference flipped mid-flight: restart in the right mode.
    stopAtomsNetwork();
    startAtomsNetwork();
    return;
  }
  update(calmMode ? CALM_FACTOR : 1);
  draw(!calmMode);
  rafId = requestAnimationFrame(loop);
}

export function stopAtomsNetwork() {
  running = false;
  calmMode = false;
  cancelAnimationFrame(rafId);
  rafId = 0;
  if (detach) {
    detach();
    detach = null;
  }
  if (ctx && canvas) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
  canvas?.classList.remove('is-on');
}

export function startAtomsNetwork() {
  if (running) return;
  canvas = document.getElementById('atoms-bg');
  if (!canvas) return;
  ctx = canvas.getContext('2d');
  if (!ctx) return;

  resize();
  canvas.classList.add('is-on');
  running = true;
  calmMode = motionDisabled();

  const onVisibility = () => {
    if (document.hidden) {
      cancelAnimationFrame(rafId);
      rafId = 0;
    } else if (running && !rafId) {
      rafId = requestAnimationFrame(loop);
    }
  };
  const onScroll = () => {
    scrollOffset = window.scrollY;
  };
  scrollOffset = window.scrollY;

  window.addEventListener('resize', resize, { passive: true });
  window.addEventListener('scroll', onScroll, { passive: true });
  document.addEventListener('visibilitychange', onVisibility);

  if (calmMode) {
    // Reduce-motion: keep the slow spacelike drift, skip cursor tracking.
    detach = () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('scroll', onScroll);
      document.removeEventListener('visibilitychange', onVisibility);
    };
    rafId = requestAnimationFrame(loop);
    return;
  }

  const onMove = (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  };
  const onLeave = () => {
    mouse.x = null;
    mouse.y = null;
  };

  window.addEventListener('pointermove', onMove, { passive: true });
  window.addEventListener('pointerleave', onLeave);
  window.addEventListener('blur', onLeave);

  detach = () => {
    window.removeEventListener('resize', resize);
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerleave', onLeave);
    window.removeEventListener('blur', onLeave);
    document.removeEventListener('visibilitychange', onVisibility);
  };

  rafId = requestAnimationFrame(loop);
}

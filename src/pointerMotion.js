const MAX_RX = 4.25;
const MAX_RY = 5.75;
/** Lower = slower, smoother tilt toward the pointer */
const LERP = 0.032;

function motionDisabled() {
  return (
    window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
    document.documentElement.classList.contains('reduce-motion-user')
  );
}

let rafId = 0;
let detachListeners = null;

function resetScene() {
  const scene = document.getElementById('scene');
  const ambient = document.querySelector('.ambient');
  const panels = document.querySelectorAll('.hero-panels .panel');
  document.body.classList.remove('has-pointer-fx');
  document.documentElement.style.setProperty('--tilt-z', '0deg');
  if (scene) scene.style.transform = '';
  if (ambient) {
    ambient.style.removeProperty('--spot-x');
    ambient.style.removeProperty('--spot-y');
  }
  panels.forEach((el) => {
    el.style.removeProperty('--parallax-x');
    el.style.removeProperty('--parallax-y');
  });
}

export function stopPointerMotion() {
  if (detachListeners) {
    detachListeners();
    detachListeners = null;
  }
  cancelAnimationFrame(rafId);
  rafId = 0;
  resetScene();
}

export function startPointerMotion() {
  if (motionDisabled()) return;
  if (!window.matchMedia('(pointer: fine)').matches) return;
  if (detachListeners) return;

  const scene = document.getElementById('scene');
  const cursorGlow = document.querySelector('.cursor-glow');
  const ambient = document.querySelector('.ambient');
  if (!scene || !cursorGlow) return;

  const panels = document.querySelectorAll('.hero-panels .panel');
  const depthMults = [1, -0.62, 0.78];

  document.body.classList.add('has-pointer-fx');
  document.documentElement.style.setProperty('--tilt-z', '0deg');

  let targetMx = 0.5;
  let targetMy = 0.38;
  let targetRx = 0;
  let targetRy = 0;

  let curMx = targetMx;
  let curMy = targetMy;
  let curRx = 0;
  let curRy = 0;

  function resetTargets() {
    targetMx = 0.5;
    targetMy = 0.38;
    targetRx = 0;
    targetRy = 0;
  }

  function onMove(e) {
    const w = window.innerWidth || 1;
    const h = window.innerHeight || 1;
    targetMx = e.clientX / w;
    targetMy = e.clientY / h;
    const nx = targetMx * 2 - 1;
    const ny = targetMy * 2 - 1;
    targetRx = -ny * MAX_RX;
    targetRy = nx * MAX_RY;

    cursorGlow.style.left = `${e.clientX}px`;
    cursorGlow.style.top = `${e.clientY}px`;
  }

  function tick() {
    if (motionDisabled()) {
      stopPointerMotion();
      return;
    }

    curMx += (targetMx - curMx) * LERP;
    curMy += (targetMy - curMy) * LERP;
    curRx += (targetRx - curRx) * LERP;
    curRy += (targetRy - curRy) * LERP;

    const nx = curMx * 2 - 1;
    const ny = curMy * 2 - 1;
    const tiltZ = (curMx - 0.5) * 9;
    document.documentElement.style.setProperty('--tilt-z', `${tiltZ}deg`);

    scene.style.transform = `rotateX(${curRx}deg) rotateY(${curRy}deg) translateZ(0)`;

    if (ambient) {
      ambient.style.setProperty('--spot-x', `${curMx * 100}%`);
      ambient.style.setProperty('--spot-y', `${curMy * 100}%`);
    }

    panels.forEach((el, i) => {
      const m = depthMults[i] ?? 0.55;
      el.style.setProperty('--parallax-x', `${nx * 11 * m}px`);
      el.style.setProperty('--parallax-y', `${ny * 9 * m}px`);
    });

    rafId = requestAnimationFrame(tick);
  }

  function onMouseOut(e) {
    if (!e.relatedTarget && e.clientY <= 0) resetTargets();
  }

  window.addEventListener('mousemove', onMove, { passive: true });
  window.addEventListener('blur', resetTargets);
  document.addEventListener('mouseout', onMouseOut);

  detachListeners = () => {
    window.removeEventListener('mousemove', onMove);
    window.removeEventListener('blur', resetTargets);
    document.removeEventListener('mouseout', onMouseOut);
  };

  rafId = requestAnimationFrame(tick);
}

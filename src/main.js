import { startPointerMotion, stopPointerMotion } from './pointerMotion.js';
import { initTheme } from './theme.js';
import { initVisitorCount } from './visitorCount.js';

const MOTION_STORAGE_KEY = 'portfolio-reduce-motion';

function prefersLessMotion() {
  return (
    window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
    document.documentElement.classList.contains('reduce-motion-user')
  );
}

function syncReduceMotionToggleUi() {
  const toggle = document.getElementById('reduce-motion-toggle');
  if (!toggle) return;
  const on = document.documentElement.classList.contains('reduce-motion-user');
  toggle.setAttribute('aria-pressed', on ? 'true' : 'false');
}

function applyStoredMotionPreference() {
  if (localStorage.getItem(MOTION_STORAGE_KEY) === '1') {
    document.documentElement.classList.add('reduce-motion-user');
  }
  syncReduceMotionToggleUi();
}

applyStoredMotionPreference();
initTheme();
initVisitorCount();
startPointerMotion();
/** Work section carousel — auto-drift + prev/next controls */
function initWorkCarousel() {
  const viewport = document.getElementById('work-carousel-viewport');
  const track = document.getElementById('work-carousel');
  const wrapper = document.querySelector('.projects-carousel-wrapper');
  const prevBtn = document.querySelector('.carousel-btn--prev');
  const nextBtn = document.querySelector('.carousel-btn--next');

  if (!viewport || !track || !prevBtn || !nextBtn) return;

  const scrollBehavior = () => (prefersLessMotion() ? 'auto' : 'smooth');
  const AUTO_SPEED = 0.45;
  let paused = false;
  let pauseTimer = null;
  let rafId = null;

  function getScrollStep() {
    const card = track.querySelector('.work-card:not([aria-hidden="true"])');
    if (!card) return 360;
    const gap = parseFloat(getComputedStyle(track).gap) || 24;
    return card.offsetWidth + gap;
  }

  function getLoopWidth() {
    return track.scrollWidth / 2;
  }

  function normalizeScroll() {
    const loopWidth = getLoopWidth();
    if (loopWidth <= 0) return;
    if (viewport.scrollLeft >= loopWidth) {
      viewport.scrollLeft -= loopWidth;
    } else if (viewport.scrollLeft < 0) {
      viewport.scrollLeft += loopWidth;
    }
  }

  function updateButtons() {
    const maxScroll = viewport.scrollWidth - viewport.clientWidth;
    const loopWidth = getLoopWidth();
    const pos = loopWidth > 0 ? viewport.scrollLeft % loopWidth : viewport.scrollLeft;
    prevBtn.disabled = maxScroll <= 0 || pos <= 4;
    nextBtn.disabled = maxScroll <= 0;
  }

  const carousel = wrapper?.querySelector('.work-carousel');

  function setDrifting(on) {
    carousel?.classList.toggle('is-drifting', on);
  }

  function pauseAuto(ms = 0) {
    paused = true;
    setDrifting(false);
    if (pauseTimer) window.clearTimeout(pauseTimer);
    if (ms > 0) {
      pauseTimer = window.setTimeout(() => {
        paused = false;
        pauseTimer = null;
        if (!prefersLessMotion()) setDrifting(true);
      }, ms);
    }
  }

  function scrollByStep(direction) {
    viewport.scrollBy({
      left: direction * getScrollStep(),
      behavior: scrollBehavior(),
    });
    window.setTimeout(normalizeScroll, prefersLessMotion() ? 0 : 420);
  }

  function autoTick() {
    if (!prefersLessMotion() && !paused) {
      viewport.scrollLeft += AUTO_SPEED;
      normalizeScroll();
      updateButtons();
    }
    rafId = window.requestAnimationFrame(autoTick);
  }

  prevBtn.addEventListener('click', () => {
    scrollByStep(-1);
    pauseAuto(5000);
  });
  nextBtn.addEventListener('click', () => {
    scrollByStep(1);
    pauseAuto(5000);
  });
  viewport.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      scrollByStep(-1);
      pauseAuto(5000);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      scrollByStep(1);
      pauseAuto(5000);
    }
  });
  viewport.addEventListener(
    'scroll',
    () => {
      normalizeScroll();
      updateButtons();
    },
    { passive: true }
  );
  viewport.addEventListener('wheel', () => pauseAuto(4000), { passive: true });
  viewport.addEventListener('touchstart', () => pauseAuto(), { passive: true });
  viewport.addEventListener('touchend', () => pauseAuto(4000), { passive: true });

  wrapper?.addEventListener('mouseenter', () => {
    paused = true;
    setDrifting(false);
  });
  wrapper?.addEventListener('mouseleave', () => {
    if (!pauseTimer) {
      paused = false;
      if (!prefersLessMotion()) setDrifting(true);
    }
  });
  wrapper?.addEventListener('focusin', () => pauseAuto());
  wrapper?.addEventListener('focusout', () => pauseAuto(2500));

  window.addEventListener('resize', updateButtons);
  updateButtons();

  if (!prefersLessMotion()) {
    setDrifting(true);
    rafId = window.requestAnimationFrame(autoTick);
  } else {
    setDrifting(false);
  }

  document.getElementById('reduce-motion-toggle')?.addEventListener('click', () => {
    if (prefersLessMotion()) {
      if (rafId) window.cancelAnimationFrame(rafId);
      rafId = null;
      paused = true;
    } else if (!rafId) {
      paused = false;
      rafId = window.requestAnimationFrame(autoTick);
    }
  });
}

initWorkCarousel();
/** In-page anchors: smooth scroll + hash (footer “reduce motion” no longer disables this). */
document.addEventListener(
  'click',
  (e) => {
    const link = e.target.closest?.('a[href^="#"]');
    if (!link || link.classList.contains('skip-link')) return;
    const href = link.getAttribute('href');
    if (!href || href === '#') return;
    const id = href === '#top' ? 'top' : href.slice(1);
    const el = document.getElementById(id);
    if (!el) return;
    e.preventDefault();
    const instant = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollIntoView({ behavior: instant ? 'auto' : 'smooth', block: 'start' });
    history.pushState(null, '', href);
  },
  true
);

document.querySelector('.skip-link')?.addEventListener('click', () => {
  queueMicrotask(() => {
    document.getElementById('top')?.focus({ preventScroll: false });
  });
});

const yearEl = document.getElementById('year');
if (yearEl) {
  yearEl.textContent = String(new Date().getFullYear());
}

const nav = document.querySelector('.nav');
const navToggle = document.querySelector('.nav-toggle');
const navMenu = document.getElementById('nav-menu');

function setNavOpen(open) {
  if (!nav || !navToggle || !navMenu) return;
  nav.classList.toggle('is-open', open);
  navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  navToggle.setAttribute(
    'aria-label',
    open ? 'Close menu' : 'Open menu'
  );
}

navToggle?.addEventListener('click', () => {
  const open = !nav?.classList.contains('is-open');
  setNavOpen(open);
});

navMenu?.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => setNavOpen(false));
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') setNavOpen(false);
});

const reduceMotionMq = window.matchMedia('(prefers-reduced-motion: reduce)');
reduceMotionMq.addEventListener('change', () => {
  if (prefersLessMotion()) {
    stopPointerMotion();
    document.querySelectorAll('.reveal').forEach((el) => {
      el.classList.add('is-visible');
    });
  } else if (!document.documentElement.classList.contains('reduce-motion-user')) {
    startPointerMotion();
  }
});

document.getElementById('reduce-motion-toggle')?.addEventListener('click', () => {
  const next = !document.documentElement.classList.contains('reduce-motion-user');
  document.documentElement.classList.toggle('reduce-motion-user', next);
  if (next) localStorage.setItem(MOTION_STORAGE_KEY, '1');
  else localStorage.removeItem(MOTION_STORAGE_KEY);
  syncReduceMotionToggleUi();
  if (next) {
    stopPointerMotion();
    document.querySelectorAll('.reveal').forEach((el) => {
      el.classList.add('is-visible');
    });
  } else {
    startPointerMotion();
  }
});

function initHeroNameTyping() {
  const el = document.getElementById('hero-name');
  if (!el) return;

  /** Typing is decorative; skip only for system reduced-motion (not footer toggle). */
  const systemReduceMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches;
  if (systemReduceMotion) return;

  const full =
    el.textContent.trim() ||
    el.getAttribute('aria-label')?.trim() ||
    '';
  if (!full) return;

  let started = false;
  let mo;
  let io;
  let failTimer;

  const cleanup = () => {
    mo?.disconnect();
    io?.disconnect();
    if (failTimer) window.clearTimeout(failTimer);
  };

  const start = () => {
    if (started) return;
    started = true;
    cleanup();

    el.textContent = '';
    const typed = document.createElement('span');
    typed.className = 'hero-name__typed';
    const cursor = document.createElement('span');
    cursor.className = 'hero-name__cursor';
    cursor.setAttribute('aria-hidden', 'true');
    el.appendChild(typed);
    el.appendChild(cursor);

    let i = 0;
    const msPerChar = full.length > 30 ? 34 : 46;
    const tick = () => {
      if (i > full.length) {
        el.classList.add('hero-name--done');
        window.setTimeout(() => {
          cursor.classList.add('hero-name__cursor--hide');
        }, 1400);
        return;
      }
      typed.textContent = full.slice(0, i);
      i += 1;
      window.setTimeout(tick, msPerChar);
    };
    tick();
  };

  if (el.classList.contains('is-visible')) {
    queueMicrotask(start);
    return;
  }

  mo = new MutationObserver(() => {
    if (el.classList.contains('is-visible')) start();
  });
  mo.observe(el, { attributes: true, attributeFilter: ['class'] });

  io = new IntersectionObserver(
    (entries) => {
      if (entries.some((e) => e.isIntersecting)) start();
    },
    { threshold: 0.02, rootMargin: '0px 0px 20% 0px' }
  );
  io.observe(el);

  failTimer = window.setTimeout(() => {
    if (!started) start();
  }, 4000);
}

const revealEls = document.querySelectorAll('.reveal');

if (!prefersLessMotion() && revealEls.length) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.08 }
  );
  revealEls.forEach((el) => observer.observe(el));
} else {
  revealEls.forEach((el) => el.classList.add('is-visible'));
}

initHeroNameTyping();

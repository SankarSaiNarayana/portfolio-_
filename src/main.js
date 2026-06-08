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
/** Work section — slow rightward auto-scroll + prev/next controls */
function initWorkCarousel() {
  const viewport = document.getElementById('work-carousel-viewport');
  const track = document.getElementById('work-carousel');
  const carousel = document.querySelector('.work-carousel');
  const wrapper = document.querySelector('.projects-carousel-wrapper');
  const prevBtn = document.querySelector('.carousel-btn--prev');
  const nextBtn = document.querySelector('.carousel-btn--next');

  if (!viewport || !track || !carousel || !prevBtn || !nextBtn || !wrapper) {
    return;
  }

  const LOOP_DURATION_MS = 72000;
  let pauseTimer = null;
  let hoverPaused = false;
  let marqueeAnim = null;

  function getCardStep() {
    const card =
      track.querySelector('.work-card:not([aria-hidden="true"])') ??
      track.querySelector('.work-card');
    if (!card) return 360;
    const gap = parseFloat(getComputedStyle(track).gap) || 24;
    return card.offsetWidth + gap;
  }

  function getLoopWidth() {
    return track.scrollWidth / 2;
  }

  function getTrackAnimation() {
    return marqueeAnim ?? track.getAnimations()[0] ?? null;
  }

  function stopMarquee() {
    marqueeAnim?.cancel();
    marqueeAnim = null;
    track.style.transform = '';
    carousel.classList.remove('is-auto', 'is-paused');
  }

 function startMarquee() {
    stopMarquee();
    carousel.classList.add('is-auto');
    carousel.classList.remove('is-static');

    // To move rightwards smoothly, we start halfway through (-50%) 
    // and move back into the default view index layout (0%)
    marqueeAnim = track.animate(
      [
        { transform: 'translateX(-50%)' },
        { transform: 'translateX(0%)' },
      ],
      {
        duration: LOOP_DURATION_MS,
        iterations: Infinity,
        easing: 'linear',
      }
    );

    if (hoverPaused || pauseTimer) {
      marqueeAnim.pause();
      carousel.classList.add('is-paused');
    }
  }

  function setStaticMode() {
    stopMarquee();
    carousel.classList.add('is-static');
    viewport.scrollLeft = 0;
  }

  function setPaused(on) {
    carousel.classList.toggle('is-paused', on);
    const anim = getTrackAnimation();
    if (!anim) return;
    if (on) anim.pause();
    else anim.play();
  }

  function pauseAuto(ms = 0) {
    setPaused(true);
    if (pauseTimer) window.clearTimeout(pauseTimer);
    if (ms > 0) {
      pauseTimer = window.setTimeout(() => {
        pauseTimer = null;
        if (!hoverPaused && !prefersLessMotion()) setPaused(false);
      }, ms);
    }
  }

  function resumeAuto() {
    if (pauseTimer) window.clearTimeout(pauseTimer);
    pauseTimer = null;
    if (!hoverPaused && !prefersLessMotion()) setPaused(false);
  }

  function nudge(direction) {
    if (prefersLessMotion()) {
      viewport.scrollBy({
        left: direction * getCardStep(),
        behavior: 'smooth',
      });
      updateButtons();
      return;
    }

    const anim = getTrackAnimation();
    const loopWidth = getLoopWidth();
    if (!anim || loopWidth <= 0) return;

    const duration =
      typeof anim.effect?.getTiming === 'function'
        ? anim.effect.getTiming().duration
        : LOOP_DURATION_MS;
        
    // Inverted direction multiplier here because animation timeline steps backward when tracking right
    const delta = -direction * getCardStep() * (duration / loopWidth);
    anim.currentTime =
      ((((anim.currentTime ?? 0) + delta) % duration) + duration) % duration;
    pauseAuto(5000);
  }
  
  function updateButtons() {
    if (!carousel.classList.contains('is-static')) {
      prevBtn.disabled = false;
      nextBtn.disabled = false;
      return;
    }
    const maxScroll = viewport.scrollWidth - viewport.clientWidth;
    prevBtn.disabled = maxScroll <= 0 || viewport.scrollLeft <= 4;
    nextBtn.disabled = maxScroll <= 0 || viewport.scrollLeft >= maxScroll - 4;
  }

  function applyMotionMode() {
    if (prefersLessMotion()) {
      setStaticMode();
    } else {
      startMarquee();
      setPaused(hoverPaused || Boolean(pauseTimer));
    }
    updateButtons();
  }

  prevBtn.addEventListener('click', () => nudge(-1));
  nextBtn.addEventListener('click', () => nudge(1));

  viewport.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      nudge(-1);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      nudge(1);
    }
  });

  viewport.addEventListener('scroll', updateButtons, { passive: true });

  wrapper.addEventListener('mouseenter', () => {
    hoverPaused = true;
    setPaused(true);
  });
  wrapper.addEventListener('mouseleave', () => {
    hoverPaused = false;
    resumeAuto();
  });
  wrapper.addEventListener('focusin', () => setPaused(true));
  wrapper.addEventListener('focusout', () => pauseAuto(2500));

  window.addEventListener('resize', () => {
    if (!prefersLessMotion()) {
      const anim = getTrackAnimation();
      const progress =
        anim && anim.effect?.getTiming
          ? (anim.currentTime ?? 0) /
            (anim.effect.getTiming().duration || LOOP_DURATION_MS)
          : 0;
      startMarquee();
      const nextAnim = getTrackAnimation();
      if (nextAnim && progress > 0) {
        nextAnim.currentTime =
          progress * (nextAnim.effect?.getTiming?.().duration ?? LOOP_DURATION_MS);
      }
      setPaused(hoverPaused || Boolean(pauseTimer));
    }
    updateButtons();
  });

  document.getElementById('reduce-motion-toggle')?.addEventListener('click', () => {
    window.setTimeout(applyMotionMode, 0);
  });

  applyMotionMode();
}

initWorkCarousel();

/** Work card hover magnify effect with smooth lift-and-scale animation */
function initWorkCardHover() {
  document.querySelectorAll('.work-card').forEach((card) => {
    card.addEventListener('mouseenter', () => {
      // Apply transform directly
      card.style.transform = 'translateY(-12px) scale(1.08)';
      card.classList.add('is-hovered');
    });
    card.addEventListener('mouseleave', () => {
      // Reset transform
      card.style.transform = '';
      card.classList.remove('is-hovered');
    });
  });
}

initWorkCardHover();

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

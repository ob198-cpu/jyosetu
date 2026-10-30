(() => {
  'use strict';
  const root = document.documentElement;
  root.classList.add('motion-ready');
  const opening = document.querySelector('.opening');
  const stage = document.querySelector('.opening-stage');
  const work = document.querySelector('.services');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const narrow = matchMedia('(max-width: 700px)');
  let queued = false;
  const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
  const smooth = p => p * p * (3 - 2 * p);
  function paint() {
    queued = false;
    const stopped = reduced.matches;
    const travel = opening.offsetHeight - stage.offsetHeight;
    const p = stopped || travel <= 0 ? 0 : clamp(-opening.getBoundingClientRect().top / travel);
    const ease = smooth(clamp(p / .85));
    const switched = p >= .52;
    root.style.setProperty('--open', p.toFixed(4));
    root.style.setProperty('--cut-top', `${(narrow.matches ? 55 : 53) * (1-ease)}%`);
    root.style.setProperty('--cut-bottom', `${(narrow.matches ? 0 : 14) * (1-ease)}%`);
    root.style.setProperty('--photo-scale', (1.08 - .08 * ease).toFixed(4));
    root.style.setProperty('--photo-top', `${18 * (1-ease)}%`);
    // Time-based short handover: stopping mid-scroll never leaves both headlines faint.
    root.style.setProperty('--title-opacity', switched ? '0' : '1');
    root.style.setProperty('--shift', switched ? '-30px' : '0px');
    root.style.setProperty('--reveal-opacity', switched ? '1' : '0');
    const workProgress = stopped ? 0 : clamp((innerHeight - work.getBoundingClientRect().top) / innerHeight);
    work.style.setProperty('--arrow-travel', `${8 * workProgress}px`);
  }
  function schedule() { if (!queued) { queued = true; requestAnimationFrame(paint); } }
  function updateMode() {
    // Keep the OS accessibility preference after the user-requested control removal.
    root.classList.toggle('motion-off', reduced.matches);
    schedule();
  }
  reduced.addEventListener('change', updateMode);
  narrow.addEventListener('change', schedule);
  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', schedule, { passive: true });
  addEventListener('pageshow', schedule);
  updateMode();
})();

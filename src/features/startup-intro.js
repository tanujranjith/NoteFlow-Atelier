/* ================================================================
   Sutra — Startup Intro  (src/features/startup-intro.js)

   Shows a brief branded overlay once per browser session.
   Dismissed by: clicking, tapping, Escape, or Enter.
   Auto-dismisses after TOTAL_MS milliseconds.

   Audio: synthesized via Web Audio API (no file required).
   ────────────────────────────────────────────────────────
   To swap in a custom audio file instead:
     1. Place a compressed MP3 at  assets/startup-sound.mp3
        (target ≤ 80 KB — approximately 1.5 s at 48 kbps).
     2. Replace the call to synthesizeStartupChime() below
        with:
          var snd = new Audio('assets/startup-sound.mp3');
          snd.volume = 0.35;
          snd.play().catch(function() {}); // ignore autoplay block
   ────────────────────────────────────────────────────────
   Session key: 'sutra_intro_played' in sessionStorage.
   ================================================================ */

(function () {
  'use strict';

  /* ── constants ──────────────────────────────────────────────── */

  var SESSION_KEY   = 'sutra_intro_played';
  var TOTAL_MS      = 2000;   // full sequence: animations + hold
  var REDUCED_MS    = 600;    // under prefers-reduced-motion
  var EXIT_MS       = 520;    // overlay fade-out duration (ms)
  var AUDIO_DELAY   = 350;    // ms after init before chime plays

  /* ── motion helpers ─────────────────────────────────────────── */

  function prefersReducedMotion() {
    try {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch (_) { return false; }
  }

  function isMotionReduced() {
    var mi = (document.documentElement.dataset.motionintensity || '').toLowerCase();
    return prefersReducedMotion() || mi === 'off' || mi === 'reduced';
  }

  /* ── settings ───────────────────────────────────────────────── */

  /**
   * Read startup.playSound from localStorage.
   * app.js writes 'sutra_startup_sound' = '1' to localStorage whenever
   * preferences are applied (applyWorkspacePreferences), so the flag is
   * available immediately on the next page load — before app.js initializes.
   * Defaults to false (opt-in).
   */
  function isSoundEnabled() {
    try { return localStorage.getItem('sutra_startup_sound') === '1'; } catch (_) {}
    return false;
  }

  /* ── audio synthesis ────────────────────────────────────────── */

  /**
   * Synthesize a soft three-note rising chime (C-major: C5 / E5 / G5)
   * using the Web Audio API.  Total duration ≈ 1.4 s.
   * Gracefully no-ops if the browser blocks autoplay.
   */
  function synthesizeStartupChime() {
    try {
      var AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      var ctx = new AudioCtx();

      /* Master gain — soft attack → sustained → gentle release */
      var master = ctx.createGain();
      master.gain.setValueAtTime(0, ctx.currentTime);
      master.gain.linearRampToValueAtTime(0.10, ctx.currentTime + 0.09);
      master.gain.linearRampToValueAtTime(0.10, ctx.currentTime + 0.55);
      master.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.4);
      master.connect(ctx.destination);

      /* Three staggered sine oscillators — C5, E5, G5 */
      var freqs = [523.25, 659.25, 783.99];
      freqs.forEach(function (freq, i) {
        var osc  = ctx.createOscillator();
        var gain = ctx.createGain();
        var t0   = ctx.currentTime + i * 0.065;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t0);

        gain.gain.setValueAtTime(0, t0);
        gain.gain.linearRampToValueAtTime(0.34, t0 + 0.07);
        gain.gain.linearRampToValueAtTime(0.34, t0 + 0.55);
        gain.gain.exponentialRampToValueAtTime(0.001, t0 + 1.4);

        osc.connect(gain);
        gain.connect(master);
        osc.start(t0);
        osc.stop(t0 + 1.5);
      });
    } catch (_) {
      /* Autoplay blocked or no Web Audio — visual intro continues silently. */
    }
  }

  /* ── core ───────────────────────────────────────────────────── */

  function initStartupIntro() {
    /* Skip if already played during this browser session */
    if (sessionStorage.getItem(SESSION_KEY)) return;

    var overlay = document.getElementById('sutraStartupIntro');
    if (!overlay) return;

    /* Mark immediately — prevents a race-condition double-play if the
       user triggers a rapid reload before the overlay dismisses. */
    sessionStorage.setItem(SESSION_KEY, '1');

    var reduced    = isMotionReduced();
    var totalMs    = reduced ? REDUCED_MS : TOTAL_MS;
    var dismissed  = false;
    var exitTimer  = null;
    var audioTimer = null;

    /* ── audio ── */
    if (!reduced) {
      audioTimer = setTimeout(function () {
        audioTimer = null;
        if (!dismissed && isSoundEnabled()) {
          synthesizeStartupChime();
        }
      }, AUDIO_DELAY);
    }

    /* ── dismiss logic ── */
    function dismiss(fast) {
      if (dismissed) return;
      dismissed = true;

      /* Cancel pending timers */
      if (exitTimer  !== null) { clearTimeout(exitTimer);  exitTimer  = null; }
      if (audioTimer !== null) { clearTimeout(audioTimer); audioTimer = null; }

      /* Remove interaction listeners */
      overlay.removeEventListener('click',      onSkipClick);
      overlay.removeEventListener('touchstart', onSkipTouch);
      document.removeEventListener('keydown',   onKeySkip, true);

      /* Fade-out transition */
      var dur = fast ? 100 : EXIT_MS;
      overlay.style.transition = 'opacity ' + (dur / 1000).toFixed(2) + 's cubic-bezier(0.22, 1, 0.36, 1)';
      overlay.classList.add('intro-exiting');

      /* Remove from layout after transition; restore focus */
      setTimeout(function () {
        overlay.style.display = 'none';
        overlay.setAttribute('aria-hidden', 'true');
        /* Move focus into the main app — never leave it trapped */
        var target = document.querySelector(
          '#sidebarToggle, ' +
          '.app-container [tabindex="0"], ' +
          '.app-container button:not([disabled]):not([aria-hidden="true"])'
        );
        if (target) {
          try { target.focus({ preventScroll: true }); } catch (_) {}
        }
      }, dur + 30);
    }

    /* ── skip handlers ── */
    function onSkipClick(e) {
      /* Ignore right-click / middle-click */
      if (e && typeof e.button === 'number' && e.button !== 0) return;
      dismiss(false);
    }

    function onSkipTouch() {
      dismiss(false);
    }

    function onKeySkip(e) {
      if (e.key === 'Escape' || e.key === 'Enter') {
        e.stopPropagation();
        dismiss(false);
      }
    }

    overlay.addEventListener('click',      onSkipClick);
    overlay.addEventListener('touchstart', onSkipTouch, { passive: true });
    document.addEventListener('keydown',   onKeySkip, true);

    /* Auto-dismiss after full sequence */
    exitTimer = setTimeout(function () { dismiss(false); }, totalMs);
  }

  /* ── boot ───────────────────────────────────────────────────── */

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initStartupIntro);
  } else {
    initStartupIntro();
  }

  /* ── dev/test helper ────────────────────────────────────────── */

  /**
   * window.SutraStartupIntro.replay()
   * Call from the browser console to re-run the intro without reloading.
   */
  window.SutraStartupIntro = {
    replay: function () {
      sessionStorage.removeItem(SESSION_KEY);
      var overlay = document.getElementById('sutraStartupIntro');
      if (!overlay) { console.warn('Startup intro element not found.'); return; }
      overlay.style.display = '';
      overlay.style.transition = '';
      overlay.style.opacity = '';
      overlay.classList.remove('intro-exiting');
      overlay.setAttribute('aria-hidden', 'false');
      /* Re-run init on next tick so event loop is clear */
      setTimeout(initStartupIntro, 0);
    }
  };
})();

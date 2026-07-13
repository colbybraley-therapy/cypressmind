/* ============================================================================
   Cypress Mind — Therapist Overlay (single-device sessions)
   Home: src/activities/_shared/therapist-overlay.js

   A deliberately quiet handle in a screen corner that reveals therapist
   controls only after a LONG-PRESS — a curious client tapping around the
   activity won't stumble into them. Injects its own scoped DOM + CSS
   (class-prefixed `cm-to-`); brand tokens fall back to the Cypress palette.

   Two ways to use it:

   1) Activity whose therapist UI is already a self-contained drawer
      (WheelDrawer, CypressDrawer) — long-press just reveals it:

        var overlay = TherapistOverlay({ onReveal: function () { WheelDrawer.open(); } });
        overlay.mount();

   2) Activity that renders therapist controls into a container — the shell
      provides a full-screen overlay with a Close button:

        var overlay = TherapistOverlay({
          renderDrawerContent: function (container) { renderMyControls(container); },
        });
        overlay.mount();

   Options:
     longPressMs          hold duration before revealing (default 600)
     position             'bottom-right' (default) | 'bottom-left' |
                          'top-right' | 'top-left' — configurable because some
                          activities already own a corner (e.g. the Wheel's
                          dev badge sits bottom-right)
     mountPoint           element to append to (default document.body)
     onReveal             called on long-press instead of opening the shell
     renderDrawerContent  fn(container) that fills the shell overlay
   ========================================================================== */
(function (global) {
  'use strict';

  var CSS = [
    '.cm-to-handle{position:fixed;width:30px;height:30px;border-radius:50%;',
    '  background:var(--hunter,#355E3B);opacity:.14;z-index:9997;border:none;padding:0;',
    '  touch-action:none;-webkit-touch-callout:none;-webkit-user-select:none;user-select:none;',
    '  transition:opacity .25s ease,transform .25s ease}',
    '.cm-to-handle.cm-to-pressing{opacity:.4;transform:scale(1.25)}',
    '.cm-to-pos-bottom-right{bottom:12px;right:12px}',
    '.cm-to-pos-bottom-left{bottom:12px;left:12px}',
    '.cm-to-pos-top-right{top:12px;right:12px}',
    '.cm-to-pos-top-left{top:12px;left:12px}',
    '.cm-to-overlay{position:fixed;inset:0;z-index:10000;display:none;overflow-y:auto;',
    '  background:var(--off-white,#F8FAF9);padding:24px;',
    '  font-family:var(--font-body,"DM Sans",system-ui,sans-serif)}',
    '.cm-to-overlay.cm-to-show{display:block}',
    '.cm-to-close{position:sticky;top:0;float:right;z-index:1;cursor:pointer;',
    '  background:var(--hunter,#355E3B);color:#fff;border:none;border-radius:8px;',
    '  padding:9px 18px;font:600 13px var(--font-body,"DM Sans",system-ui,sans-serif)}',
  ].join('\n');

  function injectStyles() {
    if (document.getElementById('cm-to-styles')) return;
    var s = document.createElement('style');
    s.id = 'cm-to-styles';
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  var MOVE_SLOP_PX = 12;   // finger drift beyond this cancels the long-press

  function TherapistOverlay(opts) {
    opts = opts || {};
    var longPressMs = opts.longPressMs || 600;
    var position = opts.position || 'bottom-right';
    var mountPoint = opts.mountPoint || document.body;

    var handle = null, overlay = null, pressTimer = null, pressStart = null;
    var api = { mount: mount, open: open, close: close, destroy: destroy, isOpen: isOpen };

    function mount() {
      if (handle) return api;
      injectStyles();

      handle = document.createElement('button');
      handle.type = 'button';
      handle.className = 'cm-to-handle cm-to-pos-' + position;
      handle.setAttribute('aria-label', 'Therapist controls (press and hold)');
      mountPoint.appendChild(handle);

      handle.addEventListener('pointerdown', startPress);
      handle.addEventListener('pointerup', cancelPress);
      handle.addEventListener('pointerleave', cancelPress);
      handle.addEventListener('pointercancel', cancelPress);
      handle.addEventListener('pointermove', maybeCancelOnDrift);
      // iPad long-press summons the callout/context menu — suppress it here
      handle.addEventListener('contextmenu', function (e) { e.preventDefault(); });
      return api;
    }

    function startPress(e) {
      e.preventDefault();
      pressStart = { x: e.clientX, y: e.clientY };
      handle.classList.add('cm-to-pressing');
      clearTimeout(pressTimer);
      pressTimer = setTimeout(function () {
        cancelPress();
        reveal();
      }, longPressMs);
    }

    function cancelPress() {
      clearTimeout(pressTimer);
      pressTimer = null;
      pressStart = null;
      if (handle) handle.classList.remove('cm-to-pressing');
    }

    function maybeCancelOnDrift(e) {
      if (!pressStart) return;
      var dx = e.clientX - pressStart.x, dy = e.clientY - pressStart.y;
      if (dx * dx + dy * dy > MOVE_SLOP_PX * MOVE_SLOP_PX) cancelPress();
    }

    function reveal() {
      if (opts.onReveal) { opts.onReveal(); return; }
      open();
    }

    function open() {
      if (!opts.renderDrawerContent) return;
      if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'cm-to-overlay';
        mountPoint.appendChild(overlay);
      }
      overlay.innerHTML = '';
      var closeBtn = document.createElement('button');
      closeBtn.type = 'button';
      closeBtn.className = 'cm-to-close';
      closeBtn.textContent = 'Close';
      closeBtn.addEventListener('click', close);
      overlay.appendChild(closeBtn);
      opts.renderDrawerContent(overlay);
      overlay.classList.add('cm-to-show');
    }

    function close() {
      if (overlay) overlay.classList.remove('cm-to-show');
    }

    function isOpen() {
      return !!(overlay && overlay.classList.contains('cm-to-show'));
    }

    function destroy() {
      cancelPress();
      if (handle) { handle.remove(); handle = null; }
      if (overlay) { overlay.remove(); overlay = null; }
    }

    return api;
  }

  global.TherapistOverlay = TherapistOverlay;
})(typeof window !== 'undefined' ? window : this);

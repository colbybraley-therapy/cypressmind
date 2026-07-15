/* ============================================================================
   Cypress Mind — Therapist Controls + Overlay shell
   Home: src/activities/_shared/therapist-overlay.js

   TWO layers, one source of truth for therapist controls:

   renderTherapistControls(container, sessionState, transport)
     Pure render + event wiring for the shared controls — pause, nudge,
     unlock, end, plus a live feed of client activity (choices, heat level,
     notes). Renders into WHATEVER container it's given; makes no assumption
     about being an overlay. Joins the session engine as role 'therapist'
     over the transport it's handed, so the same panel works:
       • same-device: LocalTransport inside the activity page (below)
       • cross-device: SupabaseTransport in therapist-view.html (iPhone)
     sessionState: { code, client, activity, sessionId, announcePaired }
     Returns { engine, destroy }.
     announcePaired: sends a lightweight 'paired' hello on join so the iPad
     setup screen can show "Therapist connected" (therapist-view only).

   TherapistOverlay(opts)
     The single-device shell: a deliberately quiet handle in a screen corner
     that reveals controls only after a LONG-PRESS — a curious client tapping
     around the activity won't stumble into them. Injects scoped DOM + CSS
     (class-prefixed `cm-to-`); brand tokens fall back to the Cypress palette.

     Three ways to use it:

     1) Activity whose therapist UI is already a self-contained drawer
        (WheelDrawer, CypressDrawer) — long-press just reveals it:

          TherapistOverlay({ onReveal: function () { WheelDrawer.open(); } }).mount();

     2) Activity that renders custom controls into a container:

          TherapistOverlay({
            renderDrawerContent: function (container) { renderMyControls(container); },
          }).mount();

     3) The shared controls, no custom code — long-press opens the shell and
        renderTherapistControls() fills it:

          TherapistOverlay({
            sessionState: { code: CODE, client: 'J.M.' },
            transport: sharedLocalTransport,
          }).mount();

     Options:
       longPressMs          hold duration before revealing (default 600)
       position             'bottom-right' (default) | 'bottom-left' |
                            'top-right' | 'top-left' — configurable because some
                            activities already own a corner (e.g. the Wheel's
                            dev badge sits bottom-right)
       mountPoint           element to append to (default document.body)
       onReveal             called on long-press instead of opening the shell
       renderDrawerContent  fn(container) that fills the shell overlay
       sessionState/transport  see renderTherapistControls above
   ========================================================================== */
(function (global) {
  'use strict';

  /* ════════════════════════════════════════════════════════════════════════
     Shared therapist controls
     ════════════════════════════════════════════════════════════════════════ */

  var TC_CSS = [
    '.cm-tc{--tc-hunter:var(--hunter,#355E3B);--tc-deep:var(--hunter-deep,#26432C);',
    '  --tc-ochre:var(--ochre,#C99A3B);--tc-ochre-soft:var(--ochre-soft,#E0BC72);',
    '  --tc-on:var(--on-dark,#EDEAE0);--tc-on-soft:rgba(237,234,224,.62);',
    '  --tc-line:rgba(237,234,224,.14);',
    '  font-family:var(--font-body,"DM Sans",system-ui,sans-serif);',
    '  background:var(--tc-deep);color:var(--tc-on);border-radius:14px;',
    '  display:flex;flex-direction:column;min-height:0;height:100%;overflow:hidden}',
    '.cm-tc *{box-sizing:border-box}',
    '@keyframes cm-tc-pulse{0%{box-shadow:0 0 0 0 rgba(127,224,160,.55)}70%{box-shadow:0 0 0 8px rgba(127,224,160,0)}100%{box-shadow:0 0 0 0 rgba(127,224,160,0)}}',
    '@keyframes cm-tc-rise{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}',
    '.cm-tc-h{padding:18px 20px 14px;border-bottom:1px solid var(--tc-line);flex:0 0 auto}',
    '.cm-tc-r1{display:flex;align-items:center;gap:10px}',
    '.cm-tc-dot{width:9px;height:9px;border-radius:50%;background:var(--tc-on-soft);flex:0 0 auto;transition:background .3s}',
    '.cm-tc.cm-tc-live .cm-tc-dot{background:#7FE0A0;animation:cm-tc-pulse 2.2s infinite}',
    '.cm-tc-title{font-family:var(--font-head,"Playfair Display",Georgia,serif);font-size:18px;font-weight:600;color:#fff;margin:0}',
    '.cm-tc-elapsed{margin-left:auto;font-variant-numeric:tabular-nums;color:var(--tc-on-soft);font-weight:600;font-size:13px}',
    '.cm-tc-sub{display:flex;align-items:center;gap:10px;margin-top:10px;font-size:12.5px;color:var(--tc-on-soft)}',
    '.cm-tc-sub b{color:#fff;font-weight:600}',
    '.cm-tc-act{margin-left:auto;font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:var(--tc-ochre-soft);font-weight:700}',
    '.cm-tc-controls{padding:14px 20px;border-bottom:1px solid var(--tc-line);flex:0 0 auto}',
    '.cm-tc-label{font-size:10px;letter-spacing:.16em;text-transform:uppercase;color:var(--tc-on-soft);font-weight:700;margin-bottom:10px}',
    '.cm-tc-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:9px}',
    '.cm-tc-btn{display:flex;align-items:center;justify-content:center;gap:8px;background:rgba(237,234,224,.06);',
    '  border:1px solid var(--tc-line);color:var(--tc-on);border-radius:11px;padding:14px 12px;',
    '  font:600 14px var(--font-body,"DM Sans",system-ui,sans-serif);cursor:pointer;transition:.16s;',
    '  min-height:52px;-webkit-tap-highlight-color:transparent}',
    '.cm-tc-btn:active{transform:scale(.97);background:rgba(237,234,224,.14)}',
    '.cm-tc-btn.cm-tc-unlock{background:rgba(127,224,160,.12);border-color:rgba(127,224,160,.4);color:#BFEFD2}',
    '.cm-tc-btn.cm-tc-end{grid-column:1/-1;background:rgba(201,154,59,.14);border-color:rgba(201,154,59,.4);color:var(--tc-ochre-soft)}',
    '.cm-tc-hint{margin-top:9px;font-size:11.5px;color:var(--tc-on-soft);min-height:15px}',
    '.cm-tc-feedwrap{flex:1 1 auto;display:flex;flex-direction:column;min-height:0}',
    '.cm-tc-fhead{padding:14px 20px 6px;flex:0 0 auto;display:flex;align-items:center}',
    '.cm-tc-feed{flex:1 1 auto;overflow-y:auto;padding:4px 20px 18px;-webkit-overflow-scrolling:touch}',
    '.cm-tc-empty{color:var(--tc-on-soft);font-size:13px;font-style:italic;padding:12px 0}',
    '.cm-tc-ev{padding:9px 0;border-bottom:1px solid var(--tc-line);animation:cm-tc-rise .4s both}',
    '.cm-tc-ev:last-child{border-bottom:none}',
    '.cm-tc-ev .cm-tc-t{font-size:11px;color:var(--tc-on-soft);font-variant-numeric:tabular-nums}',
    '.cm-tc-ev .cm-tc-body{font-size:14px;line-height:1.45;margin-top:2px}',
    '.cm-tc-ev .cm-tc-body b{color:#fff;font-weight:600}',
    '.cm-tc-ev.cm-tc-note .cm-tc-body{font-style:italic;color:var(--tc-ochre-soft)}',
    '.cm-tc-ev.cm-tc-you .cm-tc-body{color:var(--tc-on-soft)}',
  ].join('\n');

  function injectControlStyles() {
    if (document.getElementById('cm-tc-styles')) return;
    var s = document.createElement('style');
    s.id = 'cm-tc-styles';
    s.textContent = TC_CSS;
    document.head.appendChild(s);
  }

  function esc(v) {
    return String(v == null ? '' : v).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  function fmtClock(sec) {
    sec = Math.max(0, sec | 0);
    return String((sec / 60) | 0).padStart(2, '0') + ':' + String(sec % 60).padStart(2, '0');
  }

  /* One readable feed line per engine event; unknown types degrade to a
     generic "type" line so new activities show up without edits here. */
  function describeEvent(e) {
    var d = e.detail || {};
    switch (e.type) {
      case 'spin_landed':
        return { cls: '', html: 'Landed on <b>' + esc(d.word) + '</b>' +
          (d.family ? ' · ' + esc(d.family) : '') +
          (d.intensity ? ' · ' + esc(d.intensity) : '') };
      case 'pool_size':
        return { cls: '', html: 'Word pool ready · <b>' + esc(d.total) + '</b> words' };
      case 'enter':   return { cls: '', html: 'Entered <b>' + esc(d.label || e.room) + '</b>' };
      case 'leave':   return { cls: '', html: 'Left <b>' + esc(d.label || e.room) + '</b>' + (d.completed ? ' · completed' : '') };
      case 'reflect': return { cls: '', html: 'Feeling: <b>' + esc(d.label || d.feeling) + '</b>' };
      case 'choice':  return { cls: '', html: esc(d.label || 'Choice') + ' → <b>' + esc(d.value) + '</b>' };
      case 'note':    return { cls: 'cm-tc-note', html: '“' + esc(d.text) + '”' };
      case 'heat':
      case 'heat_level':
        return { cls: '', html: 'Heat level: <b>' + esc(d.level != null ? d.level : d.value) + '</b>' };
      case 'system':
        return d.ended ? { cls: '', html: 'Client ended the session' } : null;
      default:
        return { cls: '', html: esc(e.type).replace(/_/g, ' ') };
    }
  }

  function renderTherapistControls(container, sessionState, transport) {
    sessionState = sessionState || {};
    var E = global.CypressSessionEngine;
    if (!E) throw new Error('[TherapistControls] cypress-session-engine.js not loaded');
    if (!sessionState.code) throw new Error('[TherapistControls] sessionState.code is required');

    injectControlStyles();

    var root = document.createElement('div');
    root.className = 'cm-tc';
    root.innerHTML =
      '<div class="cm-tc-h">' +
        '<div class="cm-tc-r1"><span class="cm-tc-dot"></span>' +
          '<h2 class="cm-tc-title">Live Session</h2>' +
          '<span class="cm-tc-elapsed" data-tc="elapsed">00:00</span></div>' +
        '<div class="cm-tc-sub"><span>Client · <b data-tc="client">' + esc(sessionState.client || 'Client') + '</b></span>' +
          '<span data-tc="conn">Waiting for client…</span>' +
          '<span class="cm-tc-act">' + esc(sessionState.activity || '') + '</span></div></div>' +
      '<div class="cm-tc-controls"><div class="cm-tc-label">Session controls</div>' +
        '<div class="cm-tc-grid">' +
          '<button type="button" class="cm-tc-btn" data-tc="pause">Pause</button>' +
          '<button type="button" class="cm-tc-btn" data-tc="nudge">Send nudge</button>' +
          '<button type="button" class="cm-tc-btn cm-tc-unlock" data-tc="unlock">Unlock next step</button>' +
          '<button type="button" class="cm-tc-btn cm-tc-end" data-tc="end">End session</button></div>' +
        '<div class="cm-tc-hint" data-tc="hint"></div></div>' +
      '<div class="cm-tc-feedwrap">' +
        '<div class="cm-tc-fhead"><div class="cm-tc-label">Live feed</div></div>' +
        '<div class="cm-tc-feed" data-tc="feed">' +
          '<div class="cm-tc-empty" data-tc="empty">Nothing yet — the feed fills as your client works through the activity.</div></div></div>';
    container.appendChild(root);

    function q(name) { return root.querySelector('[data-tc="' + name + '"]'); }
    var el = {
      elapsed: q('elapsed'), conn: q('conn'), hint: q('hint'),
      feed: q('feed'), empty: q('empty'),
      pause: q('pause'), nudge: q('nudge'), unlock: q('unlock'), end: q('end'),
    };

    var startedAt = null, ticking = null, connected = false, paused = false, hintTimer = null;

    function startClock() {
      if (ticking) return;
      ticking = setInterval(function () {
        el.elapsed.textContent = fmtClock(Math.round((Date.now() - startedAt) / 1000));
      }, 1000);
    }
    function markConnected() {
      if (connected) return;
      connected = true;
      root.classList.add('cm-tc-live');
      el.conn.textContent = 'Client connected';
      if (!startedAt) { startedAt = Date.now(); startClock(); }
    }
    function hint(text) {
      el.hint.textContent = text;
      clearTimeout(hintTimer);
      hintTimer = setTimeout(function () { el.hint.textContent = ''; }, 2500);
    }
    function feedLine(cls, html) {
      if (el.empty) { el.empty.remove(); el.empty = null; }
      var d = document.createElement('div');
      d.className = 'cm-tc-ev' + (cls ? ' ' + cls : '');
      var ts = startedAt ? fmtClock(Math.round((Date.now() - startedAt) / 1000)) : '--:--';
      d.innerHTML = '<div class="cm-tc-t">' + ts + '</div><div class="cm-tc-body">' + html + '</div>';
      el.feed.insertBefore(d, el.feed.firstChild);   // newest-first
    }

    var engine = E.join({
      role: 'therapist',
      code: sessionState.code,
      transport: transport,
      client: sessionState.client,
    });
    engine.onPresence(function (p) { if (p.who === 'client') markConnected(); });
    engine.onEvent(function (e) {
      markConnected();
      var line = describeEvent(e);
      if (line) feedLine(line.cls, line.html);
    });
    engine.onPhase(function () { markConnected(); });

    // Nice-to-have handshake: tell the iPad setup screen a phone has paired.
    // Rides the engine's own 'hello' vocabulary so no transport changes.
    if (sessionState.announcePaired) {
      transport.send({ code: sessionState.code, kind: 'hello', t: Date.now(), payload: { role: 'paired' } });
    }

    el.pause.onclick = function () {
      paused = !paused;
      engine.sendControl(paused ? 'pause' : 'resume', {});
      el.pause.textContent = paused ? 'Resume' : 'Pause';
      feedLine('cm-tc-you', paused ? 'You paused the session' : 'You resumed the session');
      hint(paused ? 'Paused' : 'Resumed');
    };
    el.nudge.onclick = function () {
      engine.sendControl('therapist_nudge', {});
      feedLine('cm-tc-you', 'You sent a nudge');
      hint('Nudge sent — no auto-release');
    };
    el.unlock.onclick = function () {
      engine.sendControl('unlock', {});
      feedLine('cm-tc-you', 'You unlocked the next step');
      hint('Next step released');
    };
    el.end.onclick = function () {
      if (!global.confirm('End this session for the client?')) return;
      engine.sendControl('end_session', {});
      feedLine('cm-tc-you', 'You ended the session');
      el.end.disabled = true;
      el.end.textContent = 'Session ended';
      if (sessionState.onEnd) { try { sessionState.onEnd(); } catch (e) {} }
    };

    return {
      engine: engine,
      destroy: function () {
        clearInterval(ticking); clearTimeout(hintTimer);
        try { engine.close(); } catch (e) {}
        root.remove();
      },
    };
  }

  /* ════════════════════════════════════════════════════════════════════════
     Long-press overlay shell (single-device sessions)
     ════════════════════════════════════════════════════════════════════════ */

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
    '.cm-to-controls-host{height:calc(100vh - 48px);max-width:520px;margin:0 auto}',
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
    var sharedControls = null;   // renderTherapistControls result, built once
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
      var hasContent = opts.renderDrawerContent || (opts.sessionState && opts.transport);
      if (!hasContent) return;
      if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'cm-to-overlay';
        mountPoint.appendChild(overlay);
      }
      var closeBtn;
      if (opts.renderDrawerContent) {
        overlay.innerHTML = '';
        closeBtn = makeCloseBtn();
        overlay.appendChild(closeBtn);
        opts.renderDrawerContent(overlay);
      } else if (!sharedControls) {
        // Shared controls keep their engine subscription across open/close,
        // so build once and just show/hide the shell after that.
        overlay.innerHTML = '';
        closeBtn = makeCloseBtn();
        overlay.appendChild(closeBtn);
        var host = document.createElement('div');
        host.className = 'cm-to-controls-host';
        overlay.appendChild(host);
        sharedControls = renderTherapistControls(host, opts.sessionState, opts.transport);
      }
      overlay.classList.add('cm-to-show');
    }

    function makeCloseBtn() {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'cm-to-close';
      b.textContent = 'Close';
      b.addEventListener('click', close);
      return b;
    }

    function close() {
      if (overlay) overlay.classList.remove('cm-to-show');
    }

    function isOpen() {
      return !!(overlay && overlay.classList.contains('cm-to-show'));
    }

    function destroy() {
      cancelPress();
      if (sharedControls) { sharedControls.destroy(); sharedControls = null; }
      if (handle) { handle.remove(); handle = null; }
      if (overlay) { overlay.remove(); overlay = null; }
    }

    return api;
  }

  global.TherapistOverlay = TherapistOverlay;
  global.renderTherapistControls = renderTherapistControls;
  TherapistOverlay.renderTherapistControls = renderTherapistControls;
})(typeof window !== 'undefined' ? window : this);

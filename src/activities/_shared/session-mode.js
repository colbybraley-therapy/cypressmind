/* ============================================================================
   Cypress Mind — Session Mode
   Home: src/activities/_shared/session-mode.js

   Single source of truth for whether a live session runs on:
     'dual'   — two devices: therapist dashboard + client device   [default]
     'single' — one shared device: client screen, with therapist controls
                behind a long-press overlay (therapist-overlay.js)

   Load AFTER cypress-session-engine.js and local-transport.js.

   How mode travels:
     • At launch: the dashboard appends &mode=single to the activity URL;
       client pages read it with fromUrl(). Same idiom as ?session= and
       ?supabase=1.
     • At rest: the shared `sessions` table has a session_mode column
       (db/add-session-mode.sql). getSessionMode/setSessionMode read/write it
       by session code; rows that predate the column read back as 'dual'.
   ========================================================================== */
(function (global) {
  'use strict';

  var MODES = { DUAL: 'dual', SINGLE: 'single' };

  function isValid(mode) { return mode === MODES.DUAL || mode === MODES.SINGLE; }

  /* Mode from the page URL (?mode=single). Defaults to dual. */
  function fromUrl(search) {
    try {
      var mode = new URLSearchParams(search || global.location.search).get('mode');
      return isValid(mode) ? mode : MODES.DUAL;
    } catch (e) { return MODES.DUAL; }
  }

  /* Reads session_mode off the sessions row for a code. Defaults to 'dual'
     when the row or column doesn't exist (backward compatible). */
  function getSessionMode(db, code) {
    return db.from('sessions').select('session_mode').eq('code', code).single()
      .then(function (res) {
        var m = res && res.data && res.data.session_mode;
        return isValid(m) ? m : MODES.DUAL;
      })
      .catch(function () { return MODES.DUAL; });
  }

  function setSessionMode(db, code, mode) {
    if (!isValid(mode)) return Promise.reject(new Error('Invalid session mode: ' + mode));
    return db.from('sessions').update({ session_mode: mode }).eq('code', code);
  }

  /* Factory: the ONLY place activity code should decide which transport to
     use. Single-device → LocalTransport (pass the SAME returned instance to
     both join() calls). Dual-device → Supabase when a client is supplied
     (real cross-device sync), else BroadcastChannel (same-browser tabs),
     else the engine's no-op transport. */
  function getTransport(opts) {
    opts = opts || {};
    if (opts.mode === MODES.SINGLE) {
      if (!global.LocalTransport) throw new Error('[SessionMode] local-transport.js not loaded');
      return global.LocalTransport();
    }
    var T = global.CypressSessionEngine && global.CypressSessionEngine.transports;
    if (!T) throw new Error('[SessionMode] cypress-session-engine.js not loaded');
    if (opts.supabase) return T.Supabase(opts.code, opts.supabase);
    if (typeof BroadcastChannel !== 'undefined') return T.BroadcastChannel(opts.code);
    return T.Null();
  }

  global.CypressSessionMode = {
    MODES: MODES,
    fromUrl: fromUrl,
    getSessionMode: getSessionMode,
    setSessionMode: setSessionMode,
    getTransport: getTransport,
  };
})(typeof window !== 'undefined' ? window : this);

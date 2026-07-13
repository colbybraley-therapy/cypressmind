/* ============================================================================
   Cypress Mind — LocalTransport
   Home: src/activities/_shared/local-transport.js

   Transport for SINGLE-DEVICE sessions: the therapist and client roles run in
   the same page, so "sending" a message just invokes the local listeners on
   the next microtask — no network hop. Delivery stays async so callers behave
   the same whether the transport is Local, BroadcastChannel, or Supabase.

   Mirrors the send / onMessage / close seam of the transports inside
   cypress-session-engine.js, so CypressSessionEngine.join() can take one via
   opts.transport with no other changes.

   Both roles must share the SAME instance — each join() registers its own
   listener on it. A sender also receives its own messages; the engine's role
   guards ('event' → therapist only, 'control' → client only) ignore those.

     var t = LocalTransport();
     var client    = CypressSessionEngine.join({ role:'client',    code: code, transport: t });
     var therapist = CypressSessionEngine.join({ role:'therapist', code: code, transport: t });

   Note: close() tears down the shared bus for BOTH roles — in single-device
   mode the whole page ends the session together, so that's the intent.
   ========================================================================== */
(function (global) {
  'use strict';

  function LocalTransport() {
    var listeners = [];
    var closed = false;
    return {
      send: function (msg) {
        Promise.resolve().then(function () {
          if (closed) return;
          listeners.slice().forEach(function (fn) {
            try { fn(msg); } catch (e) {}
          });
        });
      },
      onMessage: function (cb) {
        listeners.push(cb);
        return function () {                    // unsubscribe fn
          var i = listeners.indexOf(cb);
          if (i >= 0) listeners.splice(i, 1);
        };
      },
      close: function () { closed = true; listeners.length = 0; },
    };
  }

  global.LocalTransport = LocalTransport;
})(typeof window !== 'undefined' ? window : this);

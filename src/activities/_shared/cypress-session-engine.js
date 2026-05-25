/* ============================================================================
   Cypress Mind â Shared Session Engine
   Intended home: src/activities/_shared/cypress-session-engine.js

   One engine, two roles, one event timeline:
     â¢ role:'client'    â the activity (Breathing Garden, Willowmere, â¦).
                          Emits events. Builds the authoritative session model.
     â¢ role:'therapist' â the dashboard drawer. Subscribes to events, mirrors the
                          same session model, sends controls back to the client.

   The TRANSPORT is the only networking seam. Both roles join a channel keyed to
   the session code and exchange three message kinds: 'hello', 'event', 'control'.

     Today  â BroadcastChannelTransport  (same-origin tabs, zero infrastructure)
     Later  â SupabaseTransport          (same 3 methods: send / onMessage / close)

   Because both roles reduce the SAME event stream through applyEvent(), the
   summary rollup is identical on either side â the client computes it as it
   plays, the therapist reconstructs it from what arrives.
   ========================================================================== */
(function (global) {
  'use strict';

  /* ---- activity metadata (Breathing Garden; extend per-activity later) ---- */
  var ROOM_META = {
    koi:     { label: 'Koi Courtyard',     practice: '4-7-8 Breathing' },
    flower:  { label: 'Flower Garden',     practice: '5-4-3-2-1 Grounding' },
    sand:    { label: 'Raked Sand Garden', practice: 'Box Breathing' },
    bamboo:  { label: 'Bamboo Grove',      practice: 'Finger Tracing' },
    lantern: { label: 'Lantern Alcove',    practice: 'Color Breathing' },
    sky:     { label: 'Sky Platform',      practice: 'Muscle Relaxation' },
    tea:     { label: 'Tea Room',          practice: 'Alphabet Grounding' },
  };
  var FEELING_LABEL = { calmer: 'Calmer', same: 'About the same', unsettled: 'Still unsettled' };

  function newCode() { return 'GARDEN-' + Math.floor(1000 + Math.random() * 9000); }
  function now() { return Date.now(); }

  /* ----------------------------- transports ----------------------------- */
  function BroadcastChannelTransport(code) {
    var ch = new BroadcastChannel('cypress-session:' + code);
    return {
      send: function (msg) { ch.postMessage(msg); },
      onMessage: function (cb) { ch.onmessage = function (e) { cb(e.data); }; },
      close: function () { try { ch.close(); } catch (e) {} },
    };
  }

  /* A no-op transport so a page works standalone (no peer / unsupported env). */
  function NullTransport() {
    return { send: function () {}, onMessage: function () {}, close: function () {} };
  }

  /* Real cross-device transport. supabase = a supabase-js v2 client.
     Same interface as the others; queues outbound msgs until SUBSCRIBED. */
  function SupabaseTransport(code, supabase) {
    var channel = supabase.channel('cypress-session:' + code, {
      config: { broadcast: { self: false, ack: false } },
    });
    var handler = null, ready = false, queue = [];
    channel.on('broadcast', { event: 'msg' }, function (p) {
      if (handler && p && p.payload) handler(p.payload);
    });
    channel.subscribe(function (status) {
      if (status === 'SUBSCRIBED') {
        ready = true;
        while (queue.length) channel.send({ type: 'broadcast', event: 'msg', payload: queue.shift() });
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        console.warn('[SupabaseTransport] channel ' + status + ' for ' + code);
      }
    });
    return {
      send: function (msg) {
        if (ready) channel.send({ type: 'broadcast', event: 'msg', payload: msg });
        else queue.push(msg);
      },
      onMessage: function (cb) { handler = cb; },
      close: function () { try { supabase.removeChannel(channel); } catch (e) {} },
    };
  }

  /* Prefer Supabase when a client is supplied via join({ supabase }); fall back
     to BroadcastChannel (same-origin tabs), then a no-op. */
  function pickTransport(code, opts) {
    try { if (opts && opts.supabase) return SupabaseTransport(code, opts.supabase); } catch (e) {}
    try { if (typeof BroadcastChannel !== 'undefined') return BroadcastChannelTransport(code); } catch (e) {}
    return NullTransport();
  }

  /* --------------------------- event reducer ---------------------------- */
  function freshState(code, role, opts) {
    return {
      sessionCode: code,
      role: role,
      startedAt: now(),
      endedAt: null,
      paced: false,                       // self-guided until the therapist drives pacing
      client: (opts && opts.client) || 'J.M.',
      activity: (opts && opts.activity) || 'breathing-garden',
      rooms: [],                          // one entry per room visit â summary
      events: [],                         // flat timeline             â live feed
    };
  }

  function lastOpen(state, room) {
    for (var i = state.rooms.length - 1; i >= 0; i--) {
      if (state.rooms[i].room === room) return state.rooms[i];
    }
    return null;
  }

  /* The single source of truth for how an event changes the session model.
     Used by BOTH roles, so client + therapist always agree. */
  function applyEvent(state, e) {
    state.events.push(e);
    var d = e.detail || {};
    var v;
    switch (e.type) {
      case 'enter':
        state.rooms.push({
          room: e.room, label: d.label, practice: d.practice,
          enteredAt: e.t, leftAt: null, seconds: 0,
          cyclesCompleted: 0, cyclesTarget: 0, completed: false,
          reflection: { feeling: null, note: '' }, extra: {},
        });
        break;
      case 'reflect':
        v = lastOpen(state, e.room); if (v) v.reflection.feeling = d.feeling;
        break;
      case 'choice':
        v = lastOpen(state, e.room); if (v) v.extra[String(d.label || 'choice').replace(/\s+/g, '_')] = d.value;
        break;
      case 'note':
        v = lastOpen(state, e.room);
        if (v) { if (d.kind === 'let-go') v.extra.letGo = d.text; else v.reflection.note = d.text; }
        break;
      case 'leave':
        v = lastOpen(state, e.room);
        if (v) {
          v.leftAt = e.t; v.seconds = d.seconds || 0;
          v.cyclesCompleted = d.cyclesCompleted || 0;
          v.cyclesTarget = d.cyclesTarget || 0;
          v.completed = !!d.completed;
          if (d.extra) for (var k in d.extra) v.extra[k] = d.extra[k];
        }
        break;
      case 'system':
        if (d.ended) state.endedAt = e.t;
        break;
    }
    return e;
  }

  function summarize(state) {
    if (!state) return null;
    return {
      sessionCode: state.sessionCode,
      durationSec: Math.round(((state.endedAt || now()) - state.startedAt) / 1000),
      roomsVisited: state.rooms.map(function (r) { return r.label; }),
      rooms: state.rooms.map(function (r) {
        return {
          room: r.label, practice: r.practice, seconds: r.seconds,
          cycles: r.cyclesCompleted + '/' + r.cyclesTarget, completed: r.completed,
          feeling: r.reflection.feeling, note: r.reflection.note, extra: r.extra,
        };
      }),
    };
  }

  /* ------------------------------ session ------------------------------- */
  function join(opts) {
    opts = opts || {};
    var role = opts.role || 'client';
    var code = opts.code || newCode();
    var transport = opts.transport || pickTransport(code, opts);

    var listeners = { event: [], control: [], presence: [], phase: [] };
    function on(kind, fn) { (listeners[kind] || (listeners[kind] = [])).push(fn); return api; }
    function fire(kind, payload) {
      (listeners[kind] || []).forEach(function (fn) { try { fn(payload); } catch (e) {} });
    }

    var state = freshState(code, role, opts);

    transport.onMessage(function (msg) {
      if (!msg || msg.code !== code) return;
      if (msg.kind === 'event' && role === 'therapist') {
        applyEvent(state, msg.payload);
        fire('event', msg.payload);
      } else if (msg.kind === 'phase' && role === 'therapist') {
        fire('phase', msg.payload);          // ephemeral live state â NOT stored
      } else if (msg.kind === 'control' && role === 'client') {
        fire('control', msg.payload);
      } else if (msg.kind === 'hello') {
        if (role === 'therapist') { state.startedAt = msg.payload.startedAt || state.startedAt; state.client = msg.payload.client || state.client; }
        fire('presence', { who: msg.payload.role, at: msg.t });
      }
    });

    function send(kind, payload) { transport.send({ code: code, kind: kind, t: now(), payload: payload }); }

    /* --- client API (the activity emits) --- */
    function start() {
      state = freshState(code, role, opts);
      send('hello', { role: role, startedAt: state.startedAt, client: state.client });
      return state;
    }
    function emit(type, room, detail) {
      var e = { t: now(), type: type, room: room || null, detail: detail || {} };
      applyEvent(state, e);   // client keeps the authoritative model
      send('event', e);       // broadcast to the therapist
      fire('event', e);       // and to any in-page listener
      return e;
    }
    // Ephemeral live phase telemetry â broadcast for the now-card, never stored.
    function emitPhase(payload) { send('phase', payload || {}); }
    function end() {
      emit('system', null, { ended: true });
      return summarize(state);
    }

    /* --- therapist API (the dashboard controls) --- */
    function sendControl(type, payload) {
      var c = { type: type, payload: payload || {}, t: now() };
      send('control', c);
      fire('control', c);     // echo locally so the feed can show "you did X"
      return c;
    }

    var api = {
      code: code,
      role: role,
      // client
      start: start, emit: emit, emitPhase: emitPhase, end: end,
      // therapist
      sendControl: sendControl,
      // both
      on: on,
      onEvent: function (fn) { return on('event', fn); },
      onControl: function (fn) { return on('control', fn); },
      onPresence: function (fn) { return on('presence', fn); },
      onPhase: function (fn) { return on('phase', fn); },
      state: function () { return state; },
      summary: function () { return summarize(state); },
      close: function () { transport.close(); },
    };
    return api;
  }

  global.CypressSessionEngine = {
    join: join,
    newCode: newCode,
    applyEvent: applyEvent,
    summarize: summarize,
    ROOM_META: ROOM_META,
    FEELING_LABEL: FEELING_LABEL,
  };
})(typeof window !== 'undefined' ? window : this);

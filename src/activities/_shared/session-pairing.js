/* ============================================================================
   Cypress Mind — Session Pairing (therapist iPhone ↔ iPad short code)
   Home: src/activities/_shared/session-pairing.js

   The iPad shows a 6-digit numeric code at session start; the therapist types
   it into therapist-view.html on their phone. The code maps to a `sessions`
   row (db/add-session-pairing.sql adds session_code + code_expires_at), and
   from that row the phone learns the session's channel key (`code`) and joins
   the SAME Realtime channel the iPad activity uses — cypress-session:{code}
   via CypressSessionEngine. No activity code is involved.

   Expiry gates only the pairing window (30 min). A phone that has already
   paired keeps its Realtime subscription for the life of the session.

   All functions take a supabase-js v2 client first (same idiom as
   session-mode.js) and require an authenticated therapist — lookups and
   writes are scoped to therapist_id = auth.uid(). No UI logic in this file.
   ========================================================================== */
(function (global) {
  'use strict';

  var CODE_TTL_MS = 30 * 60 * 1000;
  var MAX_ATTEMPTS = 8;   // collision retries; 1e6 codes per therapist → ~never

  function randomCode() {
    // 6-digit numeric string, leading zeros allowed ("042913")
    var n;
    if (global.crypto && global.crypto.getRandomValues) {
      var buf = new Uint32Array(1);
      global.crypto.getRandomValues(buf);
      n = buf[0] % 1000000;
    } else {
      n = Math.floor(Math.random() * 1000000);
    }
    return String(n).padStart(6, '0');
  }

  function therapistId(db) {
    return db.auth.getSession().then(function (res) {
      var user = res && res.data && res.data.session && res.data.session.user;
      if (!user) throw new Error('[SessionPairing] not signed in');
      return user.id;
    });
  }

  /* Creates a 6-digit code for a session this therapist owns, unique among
     their own unexpired codes (per decision: no global uniqueness), writes
     session_code + code_expires_at, and resolves { code, expiresAt }.
     Resolves null when the pairing columns don't exist yet (migration unrun)
     so callers can report pairing as unavailable without breaking launch. */
  function generateSessionCode(db, sessionId) {
    return therapistId(db).then(function (uid) {
      function attempt(triesLeft) {
        var code = randomCode();
        return db.from('sessions').select('id')
          .eq('therapist_id', uid)
          .eq('session_code', code)
          .gt('code_expires_at', new Date().toISOString())
          .neq('id', sessionId)
          .limit(1)
          .then(function (res) {
            if (res.error) throw res.error;
            if (res.data && res.data.length) {
              if (triesLeft <= 0) throw new Error('[SessionPairing] could not find a free code');
              return attempt(triesLeft - 1);
            }
            var expiresAt = new Date(Date.now() + CODE_TTL_MS).toISOString();
            return db.from('sessions')
              .update({ session_code: code, code_expires_at: expiresAt })
              .eq('id', sessionId)
              .eq('therapist_id', uid)
              .then(function (up) {
                if (up.error) throw up.error;
                return { code: code, expiresAt: expiresAt };
              });
          });
      }
      return attempt(MAX_ATTEMPTS);
    }).catch(function (err) {
      // Column missing (migration unrun) → pairing unavailable, not fatal
      if (err && /session_code|code_expires_at/.test(err.message || '')) {
        console.warn('[SessionPairing] pairing columns missing — run db/add-session-pairing.sql');
        return null;
      }
      throw err;
    });
  }

  /* Finds this therapist's session for an unexpired code. Resolves the row
     ({ session_id, code, activity_type, client_id, session_mode }) on match,
     null on miss/expiry — the caller shows an inline error and lets the
     therapist retype. */
  function lookupSessionByCode(db, code) {
    code = String(code || '').trim();
    if (!/^\d{6}$/.test(code)) return Promise.resolve(null);
    return therapistId(db).then(function (uid) {
      return db.from('sessions')
        .select('id, code, activity_type, client_id, session_mode')
        .eq('therapist_id', uid)
        .eq('session_code', code)
        .gt('code_expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .then(function (res) {
          if (res.error || !res.data || !res.data.length) return null;
          var row = res.data[0];
          return {
            session_id: row.id,
            code: row.code,                    // channel key: cypress-session:{code}
            activity_type: row.activity_type,
            client_id: row.client_id,
            session_mode: row.session_mode || 'dual',
          };
        });
    });
  }

  /* iPad setup-screen convenience: if the displayed code has expired (or was
     never set), mint a fresh one; otherwise resolve the current one. */
  function regenerateCodeIfExpired(db, sessionId) {
    return db.from('sessions')
      .select('session_code, code_expires_at')
      .eq('id', sessionId)
      .single()
      .then(function (res) {
        var row = res && res.data;
        if (row && row.session_code && row.code_expires_at &&
            new Date(row.code_expires_at).getTime() > Date.now()) {
          return { code: row.session_code, expiresAt: row.code_expires_at };
        }
        return generateSessionCode(db, sessionId);
      });
  }

  global.CypressSessionPairing = {
    CODE_TTL_MS: CODE_TTL_MS,
    generateSessionCode: generateSessionCode,
    lookupSessionByCode: lookupSessionByCode,
    regenerateCodeIfExpired: regenerateCodeIfExpired,
  };
})(typeof window !== 'undefined' ? window : this);

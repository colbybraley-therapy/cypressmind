-- Therapist iPhone pairing: a short numeric code the iPad shows at session
-- start so the therapist's phone can find the session and join its Realtime
-- channel (src/activities/_shared/session-pairing.js + therapist-view.html).
--
-- session_code     6-digit numeric string, e.g. '482913'. Only unique among
--                  a single therapist's unexpired sessions — enforced in
--                  session-pairing.js, NOT globally here.
-- code_expires_at  now() + 30 min at generation. Gates the PAIRING WINDOW
--                  only; once the phone has joined the channel, the Realtime
--                  subscription outlives this timestamp.
--
-- Run once in the Supabase SQL editor. The app tolerates these columns being
-- absent (pairing UI reports itself unavailable), so deploy order is safe.

alter table sessions
  add column if not exists session_code text;

alter table sessions
  add column if not exists code_expires_at timestamptz;

-- lookupSessionByCode() filters on (therapist_id, session_code, expiry)
create index if not exists sessions_pairing_lookup
  on sessions (therapist_id, session_code)
  where session_code is not null;

-- RLS: the therapist can read and write pairing columns only on their own
-- rows. Policies are permissive (OR'd with whatever already exists), so this
-- widens nothing for anon activity pages and narrows nothing that works today.
-- If RLS is not enabled on sessions these are inert.
drop policy if exists "pairing: therapist reads own sessions" on sessions;
create policy "pairing: therapist reads own sessions"
  on sessions for select to authenticated
  using (therapist_id = auth.uid());

drop policy if exists "pairing: therapist updates own sessions" on sessions;
create policy "pairing: therapist updates own sessions"
  on sessions for update to authenticated
  using (therapist_id = auth.uid())
  with check (therapist_id = auth.uid());

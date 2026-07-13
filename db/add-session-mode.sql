-- Session mode: 'dual' (therapist device + client device, the default) or
-- 'single' (one shared device; therapist controls sit behind a long-press
-- overlay on the client screen — see src/activities/_shared/).
--
-- Run once in the Supabase SQL editor. Existing rows read back as 'dual'.
-- The app tolerates this column being absent (inserts retry without it),
-- so deploy order doesn't matter — but run it soon so single-device
-- sessions are tagged in the record.

alter table sessions
  add column if not exists session_mode text not null default 'dual'
  check (session_mode in ('dual', 'single'));

-- wheel_sessions rows are created directly by wheel-drawer.js; tag them too
-- so per-activity records carry the mode without a join.
alter table wheel_sessions
  add column if not exists session_mode text not null default 'dual'
  check (session_mode in ('dual', 'single'));

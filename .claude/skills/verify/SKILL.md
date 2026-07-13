---
name: verify
description: How to run and drive MindPlay (Cypress Mind) pages for verification — static server + headless Chrome via puppeteer-core.
---

# Verifying MindPlay changes

The app is plain static HTML pages with IIFE/global JS (no build step needed
for the therapist dashboard or activity pages; vite is only used for other
bundled parts).

## Serve

```bash
python3 -m http.server 8377   # from repo root; pages load fine as statics
```

## Drive

No playwright/puppeteer in the repo, but system Chrome exists. In a scratch
dir: `npm i puppeteer-core`, then launch with
`executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'`,
`headless: 'new'`. Canvas + requestAnimationFrame (the Wheel spin) work fine
headless.

## Flows worth driving

- **Wheel of Emotions (client)**: `/src/activities/tools/wheel-of-emotions/index.html?session=CODE`
  — click `.btn-primary` (Begin), then `#wheel-stage` to spin; landing takes a
  few seconds (poll for `#wd-landed.wd-show` or `#landed-card.visible`).
- **Single-device mode**: append `&mode=single&client=Name`. Therapist drawer
  is revealed by a long-press (~850ms mouse down/up) on `.cm-to-handle`.
- **Therapist dashboard**: `/therapist-dashboard.html` is auth-gated
  (Supabase login) — DOM assertions work, full drive needs credentials.

## Gotchas

- **Omit `?supabase=1` in tests** — with it, pages hit the real hosted
  Supabase (writes rows to `wheel_sessions` etc.). Without it, transports
  fall back to BroadcastChannel/LocalTransport and nothing leaves the page.
- Cross-tab checks (client portal, single-device save relay) use
  BroadcastChannel — open a second page on the same origin and listen there.
- Engine/transport logic can also be smoke-tested in node via `vm` with a
  shared fake `window` (the IIFEs attach to it), but treat that as a
  supplement, not the verification.

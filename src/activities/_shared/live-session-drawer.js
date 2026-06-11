/* ============================================================================
   Cypress Mind â Live Session Drawer (drop-in module)
   Home: src/activities/_shared/live-session-drawer.js

   Self-contained: injects its own scoped DOM + CSS (all class-prefixed `csd-`
   so it can't collide with your dashboard styles). Reads your brand tokens if
   they exist on :root (--hunter, --ochre, --font-head, â¦); falls back to the
   Cypress palette otherwise â so it inherits your real brand automatically.

   Requires cypress-session-engine.js to be loaded first (same page).

   ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
   USAGE â wire to an existing "Launch" button:

     <script src="../_shared/cypress-session-engine.js"></script>
     <script src="../_shared/live-session-drawer.js"></script>
     <script>
       launchBtn.addEventListener('click', function () {
         CypressDrawer.launch({
           activity: 'breathing-garden',
           clientView: '../tools/breathing-garden/index.html',  // path to the client game
           client: 'J.M.',          // optional label shown in the drawer
           // code: 'GARDEN-1234',  // optional; auto-generated if omitted
           // supabase: window.myClient  // optional; cross-device. omit = same-browser tabs
         });
       });
     </script>

   That single call: generates a session code, opens the client view in a new
   tab (code attached on the URL), joins the engine as therapist, and slides the
   drawer open. The collapsed handle appears only while a session is live.

   API:
     CypressDrawer.launch(opts)   start + open
     CypressDrawer.open()         open the drawer
     CypressDrawer.close()        collapse to the handle
     CypressDrawer.end()          end session, show summary
     CypressDrawer.onSave(fn)     fn(summary) when "Save to client record" clicked
     CypressDrawer.isLive()       boolean
   ========================================================================== */
(function (global) {
  'use strict';

  var ROOMS = [
    ['koi','Koi Courtyard','4-7-8 Breathing','\uD83D\uDC1F'],
    ['flower','Flower Garden','5-4-3-2-1 Grounding','\uD83C\uDF38'],
    ['sand','Raked Sand Garden','Box Breathing','\u25A6'],
    ['bamboo','Bamboo Grove','Finger Tracing','\uD83C\uDF8D'],
    ['lantern','Lantern Alcove','Color Breathing','\uD83C\uDFEE'],
    ['sky','Sky Platform','Muscle Relaxation','\u2601\uFE0F'],
    ['tea','Tea Room','Alphabet Grounding','\uD83C\uDF75'],
  ];
  var META = {}; ROOMS.forEach(function (r) { META[r[0]] = { label: r[1], practice: r[2], glyph: r[3] }; });
  var FEEL_CLASS = { calmer: 'calmer', same: 'same', unsettled: 'unsettled' };

  /* ---- scoped styles. Tokens fall back to Cypress brand if your :root
          doesn't define them, so the drawer matches your dashboard either way. */
  var CSS = `
  .csd-root{
    --csd-hunter:var(--hunter,#355E3B);
    --csd-hunter-deep:var(--hunter-deep,#26432C);
    --csd-royal-light:var(--royal-light,#5C7BD1);
    --csd-ochre:var(--ochre,#C99A3B);
    --csd-ochre-soft:var(--ochre-soft,#E0BC72);
    --csd-ink:var(--ink,#1F2A23);
    --csd-on:var(--on-dark,#EDEAE0);
    --csd-on-soft:rgba(237,234,224,.62);
    --csd-line:rgba(237,234,224,.14);
    --csd-head:var(--font-head,"Playfair Display",Georgia,serif);
    --csd-body:var(--font-body,"DM Sans",system-ui,sans-serif);
    --csd-ease:cubic-bezier(.4,0,.2,1);
    font-family:var(--csd-body);
  }
  .csd-root *{box-sizing:border-box}
  @keyframes csd-pulseG{0%{box-shadow:0 0 0 0 rgba(127,224,160,.55)}70%{box-shadow:0 0 0 8px rgba(127,224,160,0)}100%{box-shadow:0 0 0 0 rgba(127,224,160,0)}}
  @keyframes csd-spin{to{transform:rotate(360deg)}}
  @keyframes csd-rise{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}

  .csd-scrim{position:fixed;inset:0;z-index:2147483640;background:rgba(20,35,24,.18);backdrop-filter:blur(1px);opacity:0;visibility:hidden;transition:.45s var(--csd-ease)}
  .csd-scrim.csd-show{opacity:1;visibility:visible}

  .csd-handle{position:fixed;right:0;top:118px;z-index:2147483645;cursor:pointer;display:none;align-items:center;gap:11px;
    background:var(--csd-hunter-deep);color:var(--csd-on);border:none;padding:13px 18px 13px 16px;border-radius:13px 0 0 13px;
    box-shadow:-10px 8px 28px rgba(20,35,24,.26);font-family:var(--csd-body);transition:.3s var(--csd-ease)}
  .csd-handle.csd-avail{display:flex}
  .csd-handle:hover{padding-right:24px}
  .csd-handle .csd-pulse{width:9px;height:9px;border-radius:50%;background:#7FE0A0;animation:csd-pulseG 2.2s infinite}
  .csd-handle .csd-htxt{text-align:left;line-height:1.25}
  .csd-handle .csd-htxt b{display:block;font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:#9FE3B6;font-weight:700}
  .csd-handle .csd-htxt span{font-size:13px;font-weight:500}
  .csd-handle .csd-htime{font-variant-numeric:tabular-nums;color:var(--csd-on-soft)}
  .csd-open .csd-handle{opacity:0;visibility:hidden;transform:translateX(20px)}

  .csd-drawer{position:fixed;top:0;right:0;bottom:0;z-index:2147483646;width:432px;max-width:92vw;background:var(--csd-hunter-deep);color:var(--csd-on);
    box-shadow:-24px 0 60px rgba(20,35,24,.28);transform:translateX(100%);transition:transform .5s var(--csd-ease);display:flex;flex-direction:column}
  .csd-open .csd-drawer{transform:translateX(0)}
  .csd-drawer::before{content:"";position:absolute;inset:0;pointer-events:none;background:radial-gradient(120% 60% at 100% 0,rgba(92,123,209,.16),transparent 60%)}

  .csd-h{position:relative;padding:22px 24px 18px;border-bottom:1px solid var(--csd-line);flex:0 0 auto}
  .csd-h .csd-r1{display:flex;align-items:center;gap:10px}
  .csd-title{display:flex;align-items:center;gap:10px}
  .csd-title .csd-pulse{width:9px;height:9px;border-radius:50%;background:#7FE0A0;animation:csd-pulseG 2.2s infinite}
  .csd-title h2{font-family:var(--csd-head);font-size:19px;font-weight:600;color:#fff;margin:0}
  .csd-x{margin-left:auto;width:32px;height:32px;border-radius:9px;border:1px solid var(--csd-line);background:transparent;color:var(--csd-on-soft);cursor:pointer;display:grid;place-items:center;transition:.18s var(--csd-ease)}
  .csd-x:hover{background:rgba(237,234,224,.08);color:#fff}
  .csd-sub{display:flex;align-items:center;gap:14px;margin-top:14px;font-size:13px}
  .csd-sub .csd-client{font-weight:600;color:#fff}
  .csd-sub .csd-elapsed{margin-left:auto;font-variant-numeric:tabular-nums;color:var(--csd-on-soft);font-weight:600}
  .csd-meta{display:flex;align-items:center;gap:10px;margin-top:14px}
  .csd-code{display:flex;align-items:center;gap:9px;background:rgba(237,234,224,.07);border:1px solid var(--csd-line);border-radius:9px;padding:8px 11px;font-size:12.5px}
  .csd-code .csd-lbl{color:var(--csd-on-soft);letter-spacing:.08em;text-transform:uppercase;font-size:10px;font-weight:700}
  .csd-code .csd-val{font-weight:700;letter-spacing:.12em;color:#fff;font-variant-numeric:tabular-nums}
  .csd-copy{background:transparent;border:none;color:var(--csd-royal-light);cursor:pointer;font-size:12px;font-weight:600;display:flex;align-items:center;gap:5px;padding:2px}
  .csd-copy:hover{color:#fff}
  .csd-conn{display:flex;align-items:center;gap:7px;font-size:12px;color:var(--csd-on-soft);margin-left:auto}
  .csd-conn .csd-d{width:7px;height:7px;border-radius:50%;background:var(--csd-on-soft);transition:.3s}
  .csd-conn.csd-live .csd-d{background:#7FE0A0}

  .csd-now{padding:18px 24px;border-bottom:1px solid var(--csd-line);flex:0 0 auto}
  .csd-now .csd-actname{font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:var(--csd-ochre-soft);font-weight:700}
  .csd-nowcard{margin-top:11px;background:rgba(0,0,0,.16);border:1px solid var(--csd-line);border-radius:12px;padding:14px 15px;display:flex;align-items:center;gap:14px;min-height:72px}
  .csd-ring{width:42px;height:42px;flex:0 0 auto;border-radius:50%;border:2px solid rgba(127,224,160,.5);display:grid;place-items:center;position:relative}
  .csd-ring::after{content:"";position:absolute;inset:-2px;border-radius:50%;border:2px solid transparent;border-top-color:#7FE0A0;animation:csd-spin 6s linear infinite}
  .csd-ring b{font-size:15px;font-family:var(--csd-head);color:#fff}
  .csd-info b{font-family:var(--csd-head);font-size:17px;color:#fff;display:block}
  .csd-info span{font-size:12.5px;color:var(--csd-on-soft)}
  .csd-phase{margin-left:auto;text-align:right}
  .csd-phase .csd-p{font-size:13px;font-weight:600;color:#9FE3B6}
  .csd-phase .csd-c{font-size:11px;color:var(--csd-on-soft)}
  .csd-idle .csd-ring{opacity:.4}.csd-idle .csd-info b{color:var(--csd-on-soft)}

  .csd-controls{padding:16px 24px;border-bottom:1px solid var(--csd-line);flex:0 0 auto}
  .csd-clabel{font-size:10px;letter-spacing:.16em;text-transform:uppercase;color:var(--csd-on-soft);font-weight:700;margin-bottom:11px}
  .csd-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:9px}
  .csd-ctl{display:flex;align-items:center;gap:9px;background:rgba(237,234,224,.06);border:1px solid var(--csd-line);color:var(--csd-on);border-radius:10px;padding:11px 12px;font:500 13px var(--csd-body);cursor:pointer;transition:.16s var(--csd-ease);text-align:left}
  .csd-ctl:hover{background:rgba(237,234,224,.12);border-color:rgba(237,234,224,.28)}
  .csd-ctl:active{transform:scale(.98)}
  .csd-ctl svg{width:16px;height:16px;flex:0 0 auto;opacity:.85}
  .csd-ctl.csd-end{grid-column:1/-1;justify-content:center;background:rgba(201,154,59,.14);border-color:rgba(201,154,59,.4);color:var(--csd-ochre-soft);font-weight:600}
  .csd-ctl.csd-end:hover{background:rgba(201,154,59,.22)}

  .csd-rooms{padding:16px 24px 4px;border-bottom:1px solid var(--csd-line);flex:0 0 auto}
  .csd-rhead{display:flex;align-items:center;cursor:pointer;user-select:none}
  .csd-rhead .csd-clabel{margin-bottom:0}
  .csd-rhead .csd-chev{margin-left:auto;color:var(--csd-on-soft);transition:.25s var(--csd-ease)}
  .csd-rooms.csd-collapsed .csd-chev{transform:rotate(-90deg)}
  .csd-rlist{margin-top:13px;display:flex;flex-direction:column;gap:2px;max-height:230px;overflow:auto;transition:.3s var(--csd-ease)}
  .csd-rooms.csd-collapsed .csd-rlist{max-height:0;margin-top:0;overflow:hidden;opacity:0}
  .csd-room{display:flex;align-items:center;gap:11px;padding:9px 10px;border-radius:9px;cursor:pointer;transition:.15s var(--csd-ease)}
  .csd-room:hover{background:rgba(237,234,224,.07)}
  .csd-room .csd-ico{width:24px;height:24px;border-radius:7px;background:rgba(237,234,224,.08);display:grid;place-items:center;font-size:13px;flex:0 0 auto}
  .csd-room .csd-rn b{font-size:13px;font-weight:600;color:var(--csd-on);display:block;line-height:1.2}
  .csd-room .csd-rn span{font-size:11px;color:var(--csd-on-soft)}
  .csd-room .csd-send{margin-left:auto;font-size:11px;font-weight:600;color:var(--csd-royal-light);opacity:0;transition:.15s var(--csd-ease)}
  .csd-room:hover .csd-send{opacity:1}
  .csd-room.csd-current{background:rgba(127,224,160,.10)}
  .csd-room.csd-current .csd-ico{background:rgba(127,224,160,.18)}
  .csd-nowtag{margin-left:auto;font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#9FE3B6}

  .csd-feedwrap{flex:1 1 auto;display:flex;flex-direction:column;min-height:0}
  .csd-fhead{padding:16px 24px 8px;display:flex;align-items:center;gap:9px;flex:0 0 auto}
  .csd-fhead .csd-clabel{margin-bottom:0}
  .csd-fhead .csd-following{margin-left:auto;display:flex;align-items:center;gap:6px;font-size:11px;color:#9FE3B6;font-weight:600}
  .csd-feed{flex:1 1 auto;overflow:auto;padding:4px 24px 22px;position:relative}
  .csd-feed::before{content:"";position:absolute;left:33px;top:0;bottom:14px;width:1px;background:var(--csd-line)}
  .csd-empty{color:var(--csd-on-soft);font-size:13px;font-style:italic;padding:18px 2px}
  .csd-ev{position:relative;padding:9px 0 9px 26px;animation:csd-rise .45s var(--csd-ease) both}
  .csd-ev .csd-b{position:absolute;left:5px;top:13px;width:9px;height:9px;border-radius:50%;background:var(--csd-on-soft);border:2px solid var(--csd-hunter-deep);box-shadow:0 0 0 1px var(--csd-line)}
  .csd-ev .csd-t{font-size:11px;color:var(--csd-on-soft);font-variant-numeric:tabular-nums}
  .csd-ev .csd-body{font-size:13.5px;line-height:1.45;margin-top:2px;color:var(--csd-on)}
  .csd-ev .csd-body b{font-weight:600;color:#fff}
  .csd-pill{font-size:11px;color:var(--csd-on-soft);font-weight:600}
  .csd-ev.csd-progress .csd-b{background:#7FE0A0}
  .csd-ev.csd-choice .csd-b{background:var(--csd-royal-light)}
  .csd-ev.csd-choice .csd-body b{color:#BFD0F5}
  .csd-ev.csd-reflect .csd-b{background:var(--csd-ochre)}
  .csd-ev.csd-note .csd-b{background:var(--csd-ochre)}
  .csd-ev.csd-note .csd-body{font-style:italic;color:var(--csd-ochre-soft);background:rgba(201,154,59,.08);border-left:2px solid rgba(201,154,59,.5);padding:7px 11px;border-radius:0 8px 8px 0;margin-top:5px}
  .csd-ev.csd-therapist .csd-b{background:#fff}
  .csd-ev.csd-therapist .csd-body{color:var(--csd-on-soft)}
  .csd-ev.csd-system .csd-b{background:var(--csd-royal-light)}

  .csd-foot{flex:0 0 auto;padding:13px 24px;border-top:1px solid var(--csd-line);font-size:11.5px;color:var(--csd-on-soft);display:flex;align-items:center;gap:8px}

  .csd-summary{position:absolute;inset:0;z-index:5;background:var(--csd-hunter-deep);display:none;flex-direction:column;padding:24px}
  .csd-summary.csd-show{display:flex}
  .csd-summary h2{font-family:var(--csd-head);font-size:22px;color:#fff;margin:0 0 4px}
  .csd-summary .csd-smeta{font-size:12.5px;color:var(--csd-on-soft);margin-bottom:16px}
  .csd-rows{flex:1;overflow:auto}
  .csd-srow{border:1px solid var(--csd-line);border-radius:10px;padding:12px 13px;margin-bottom:9px;background:rgba(0,0,0,.14)}
  .csd-srow .csd-stop{display:flex;align-items:baseline;gap:8px}
  .csd-srow .csd-stop b{font-family:var(--csd-head);font-size:15px;color:#fff}
  .csd-srow .csd-feel{margin-left:auto;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em}
  .csd-feel.calmer{color:#7FE0A0}.csd-feel.same{color:var(--csd-on-soft)}.csd-feel.unsettled{color:var(--csd-ochre-soft)}
  .csd-srow .csd-smeta2{font-size:12px;color:var(--csd-on-soft);margin-top:3px}
  .csd-srow .csd-snote{font-style:italic;color:var(--csd-ochre-soft);font-size:12.5px;margin-top:7px}
  .csd-save{margin-top:14px;background:var(--csd-ochre);color:#1a1209;border:none;border-radius:10px;padding:12px;font:700 13px var(--csd-body);cursor:pointer}

  .csd-toast{position:fixed;bottom:26px;left:50%;transform:translateX(-50%) translateY(20px);z-index:2147483647;background:var(--csd-ink);color:#fff;padding:11px 20px;border-radius:10px;font-size:13px;font-weight:500;opacity:0;transition:.3s var(--csd-ease);box-shadow:0 12px 30px rgba(0,0,0,.25)}
  .csd-toast.csd-show{opacity:1;transform:translateX(-50%) translateY(0)}
  .csd-feed::-webkit-scrollbar,.csd-rlist::-webkit-scrollbar,.csd-rows::-webkit-scrollbar{width:8px}
  .csd-feed::-webkit-scrollbar-thumb,.csd-rlist::-webkit-scrollbar-thumb,.csd-rows::-webkit-scrollbar-thumb{background:rgba(237,234,224,.16);border-radius:8px}
  @media(max-width:640px){.csd-drawer{width:100%;max-width:100%}}
  .csd-basic .csd-garden-only{display:none!important}
  .csd-url-row{display:flex;align-items:center;gap:9px;margin-top:10px;padding:8px 11px;background:rgba(237,234,224,.07);border:1px solid var(--csd-line);border-radius:9px}
  .csd-url-row .csd-lbl{color:var(--csd-on-soft);letter-spacing:.08em;text-transform:uppercase;font-size:10px;font-weight:700;white-space:nowrap}
  .csd-url-row [data-csd=urlVal]{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:rgba(237,234,224,.8);font-family:monospace;font-size:11px}
  .csd-body-slot{flex:1 1 auto;overflow-y:auto;min-height:0;display:none}
  `;

  var I = function (svg) { return svg; }; // inline-svg helper for readability
  var SVG = {
    x:'<svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M5 5l10 10M15 5L5 15"/></svg>',
    copy:'<svg viewBox="0 0 20 20" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="7" y="7" width="9" height="9" rx="2"/><path d="M4 13V5a2 2 0 0 1 2-2h6"/></svg>',
    pause:'<svg viewBox="0 0 20 20" fill="currentColor"><rect x="5" y="4" width="3.5" height="12" rx="1"/><rect x="11.5" y="4" width="3.5" height="12" rx="1"/></svg>',
    play:'<svg viewBox="0 0 20 20" fill="currentColor"><path d="M6 4l11 6-11 6z"/></svg>',
    reflect:'<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M10 3v10m0 0l-3.5-3.5M10 13l3.5-3.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M4 16h12"/></svg>',
    back:'<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M9 4L4 9l5 5" stroke-linecap="round" stroke-linejoin="round"/><path d="M4 9h9a4 4 0 0 1 0 8h-2"/></svg>',
    bell:'<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M10 3a5 5 0 0 0-5 5c0 4-2 5-2 5h14s-2-1-2-5a5 5 0 0 0-5-5Z" stroke-linejoin="round"/><path d="M8.5 16a1.7 1.7 0 0 0 3 0" stroke-linecap="round"/></svg>',
    end:'<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="10" cy="10" r="7"/><path d="M7 7l6 6M13 7l-6 6" stroke-linecap="round"/></svg>',
    chev:'<svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M5 8l5 5 5-5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    save:'<svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 4h9l3 3v9H4z"/><path d="M7 4v4h6"/></svg>',
  };

  function build() {
    var root = document.createElement('div');
    root.className = 'csd-root';
    var style = document.createElement('style'); style.textContent = CSS; root.appendChild(style);

    var roomRows = ROOMS.map(function (r) {
      return '<div class="csd-room" data-room="'+r[0]+'"><div class="csd-ico">'+r[3]+'</div>'+
        '<div class="csd-rn"><b>'+r[1]+'</b><span>'+r[2]+'</span></div>'+
        '<span class="csd-tagslot"><span class="csd-send">Send \u2192</span></span></div>';
    }).join('');

    root.insertAdjacentHTML('beforeend',
      '<div class="csd-scrim" data-csd="scrim"></div>'+
      '<button class="csd-handle" data-csd="handle"><span class="csd-pulse"></span>'+
        '<span class="csd-htxt"><b>Live</b><span><span data-csd="handleRoom">Waiting\u2026</span> \u00b7 <span class="csd-htime" data-csd="handleTime">00:00</span></span></span></button>'+
      '<aside class="csd-drawer" data-csd="drawer">'+
        '<div class="csd-h"><div class="csd-r1"><div class="csd-title"><span class="csd-pulse"></span><h2>Live Session</h2></div>'+
          '<button class="csd-x" data-csd="close">'+SVG.x+'</button></div>'+
          '<div class="csd-sub"><span class="csd-client">Client \u00b7 <span data-csd="client">\u2014</span></span><span class="csd-elapsed" data-csd="elapsed">00:00</span></div>'+
          '<div class="csd-meta"><div class="csd-code"><span class="csd-lbl">Code</span><span class="csd-val" data-csd="code">\u2026</span>'+
            '<button class="csd-copy" data-csd="copy">'+SVG.copy+'Copy</button></div>'+
            '<div class="csd-conn" data-csd="conn"><span class="csd-d"></span> <span data-csd="connText">Waiting for client</span></div></div>'+
          '<div class="csd-url-row" data-csd="urlRow" style="display:none"><span class="csd-lbl">App</span>'+
            '<span data-csd="urlVal"></span><button class="csd-copy" data-csd="urlCopy">'+SVG.copy+'Copy URL</button></div>'+
          '<div class="csd-actname" data-csd="actName" style="margin-top:10px;font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:rgba(224,188,114,.8);font-weight:700"></div></div>'+
        '<div class="csd-body-slot" data-csd="bodySlot"></div>'+
        '<div class="csd-now csd-garden-only">'+
          '<div class="csd-nowcard csd-idle" data-csd="nowCard"><div class="csd-ring"><b data-csd="glyph">\u00b7</b></div>'+
            '<div class="csd-info"><b data-csd="nowRoom">No room yet</b><span data-csd="nowPractice">Waiting for the client to begin</span></div>'+
            '<div class="csd-phase"><div class="csd-p" data-csd="phase"></div><div class="csd-c" data-csd="phaseSub"></div></div></div></div>'+
        '<div class="csd-controls"><div class="csd-clabel">Session controls</div><div class="csd-grid">'+
          '<button class="csd-ctl csd-garden-only" data-ctl="pause">'+SVG.pause+'Pause</button>'+
          '<button class="csd-ctl csd-garden-only" data-ctl="goto_reflection">'+SVG.reflect+'To reflection</button>'+
          '<button class="csd-ctl csd-garden-only" data-ctl="return_hub">'+SVG.back+'Return to garden</button>'+
          '<button class="csd-ctl csd-garden-only" data-ctl="nudge">'+SVG.bell+'Send nudge</button>'+
          '<button class="csd-ctl csd-end" data-csd="end">'+SVG.end+'End session &amp; save summary</button></div></div>'+
        '<div class="csd-rooms csd-collapsed csd-garden-only" data-csd="rooms"><div class="csd-rhead" data-csd="roomsToggle"><div class="csd-clabel">Send client to a room</div><span class="csd-chev">'+SVG.chev+'</span></div>'+
          '<div class="csd-rlist">'+roomRows+'</div></div>'+
        '<div class="csd-feedwrap csd-garden-only"><div class="csd-fhead"><div class="csd-clabel">Live feed</div><div class="csd-following"><span class="csd-pulse" style="width:7px;height:7px"></span> following</div></div>'+
          '<div class="csd-feed" data-csd="feed"><div class="csd-empty" data-csd="empty">Nothing yet \u2014 the feed fills as the client moves through the garden.</div></div></div>'+
        '<div class="csd-foot csd-garden-only">'+SVG.save+' Ending the session folds this feed into a saved summary.</div>'+
        '<div class="csd-summary" data-csd="summary"><h2>Session summary</h2><div class="csd-smeta" data-csd="summaryMeta"></div>'+
          '<div class="csd-rows" data-csd="summaryRows"></div><button class="csd-save" data-csd="save">Save to client record</button></div>'+
      '</aside>'+
      '<div class="csd-toast" data-csd="toast"></div>');

    document.body.appendChild(root);
    return root;
  }

  /* ----------------------------- module ----------------------------- */
  var root, el = {}, engine = null, opts = {}, startedAt = null, ticking = null,
      connected = false, saveCb = null, endCb = null, paused = false;

  function q(name) { return root.querySelector('[data-csd="' + name + '"]'); }
  function fmt(s) { s = Math.max(0, s | 0); return String(s/60|0).padStart(2,'0')+':'+String(s%60).padStart(2,'0'); }
  function elapsed() { return startedAt ? Math.round((Date.now()-startedAt)/1000) : 0; }
  function toast(m) { el.toast.textContent = m; el.toast.classList.add('csd-show'); setTimeout(function(){ el.toast.classList.remove('csd-show'); }, 1500); }

  function ensureBuilt() {
    if (root) return;
    root = build();
    el = {
      scrim:q('scrim'), handle:q('handle'), drawer:q('drawer'), close:q('close'),
      client:q('client'), elapsed:q('elapsed'), code:q('code'), copy:q('copy'),
      conn:q('conn'), connText:q('connText'), actName:q('actName'), nowCard:q('nowCard'),
      glyph:q('glyph'), nowRoom:q('nowRoom'), nowPractice:q('nowPractice'),
      phase:q('phase'), phaseSub:q('phaseSub'), rooms:q('rooms'), roomsToggle:q('roomsToggle'),
      feed:q('feed'), empty:q('empty'), end:q('end'), summary:q('summary'),
      summaryMeta:q('summaryMeta'), summaryRows:q('summaryRows'), save:q('save'),
      handleRoom:q('handleRoom'), handleTime:q('handleTime'), toast:q('toast'),
      urlRow:q('urlRow'), urlVal:q('urlVal'), urlCopy:q('urlCopy'),
      bodySlot:q('bodySlot'),
    };

    el.handle.onclick = open;
    el.close.onclick = close;
    el.scrim.onclick = close;
    el.roomsToggle.onclick = function () { el.rooms.classList.toggle('csd-collapsed'); };
    el.copy.onclick = function () { if (navigator.clipboard) navigator.clipboard.writeText(opts.code).catch(function(){}); toast('Code copied'); };
    el.urlCopy.onclick = function () { if (navigator.clipboard) navigator.clipboard.writeText(opts.clientUrl || '').catch(function(){}); toast('URL copied'); };
    el.end.onclick = function () {
      if (opts.noEngine) {
        if (endCb) endCb();
        el.handle.classList.remove('csd-avail');
        close();
        reset();
      } else {
        control('end', {}, 'You ended the session'); showSummary();
      }
    };
    el.save.onclick = function () {
      var s = engine && engine.summary();
      if (saveCb) saveCb(s);
      if (engine) { try { engine.close(); } catch (e) {} engine = null; }
      el.handle.classList.remove('csd-avail');
      close();
      reset();
      toast('Saved to client record');
    };
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });

    Array.prototype.forEach.call(root.querySelectorAll('.csd-ctl[data-ctl]'), function (b) {
      b.onclick = function () {
        var t = b.dataset.ctl;
        if (t === 'pause') {        // toggle pause â resume
          paused = !paused;
          if (paused) { control('pause', {}, 'You paused the session'); b.innerHTML = SVG.play + 'Resume'; }
          else        { control('resume', {}, 'You resumed the session'); b.innerHTML = SVG.pause + 'Pause'; }
          return;
        }
        var labels = { goto_reflection:'You moved the client to reflection', return_hub:'You sent the client back to the garden', nudge:'You sent a nudge' };
        control(t, t === 'nudge' ? { text:'A gentle check-in from your guide.' } : {}, labels[t]);
      };
    });
    Array.prototype.forEach.call(root.querySelectorAll('.csd-room'), function (rm) {
      rm.onclick = function () { var room = rm.dataset.room; control('goto_room', { room:room }, 'You launched ' + (META[room] ? META[room].label : room)); };
    });
  }

  function open() { ensureBuilt(); root.classList.add('csd-open'); el.scrim.classList.add('csd-show'); }
  function close() { if (root) { root.classList.remove('csd-open'); el.scrim.classList.remove('csd-show'); } }

  function startClock() { if (ticking) return; ticking = setInterval(function () { el.elapsed.textContent = fmt(elapsed()); el.handleTime.textContent = fmt(elapsed()); }, 1000); }
  function setConnected() { connected = true; el.conn.classList.add('csd-live'); el.connText.textContent = 'Client connected'; }

  function feedLine(cls, ts, html) {
    if (el.empty) { el.empty.remove(); el.empty = null; }
    var d = document.createElement('div');
    d.className = 'csd-ev csd-' + cls;
    d.innerHTML = '<span class="csd-b"></span><div class="csd-t">'+ts+'</div><div class="csd-body">'+html+'</div>';
    el.feed.insertBefore(d, el.feed.firstChild);   // newest-first
  }
  function pill(room) { var m = META[room]; return m ? '<span class="csd-pill">'+m.label+'</span> \u00b7 ' : ''; }

  function setCurrentRoom(room) {
    var m = META[room]; if (!m) return;
    el.nowCard.classList.remove('csd-idle');
    el.glyph.textContent = m.glyph; el.nowRoom.textContent = m.label; el.nowPractice.textContent = m.practice;
    el.phase.textContent = 'starting\u2026'; el.phaseSub.textContent = '';   // cleared until first phase ping
    el.handleRoom.textContent = m.label;
    Array.prototype.forEach.call(root.querySelectorAll('.csd-room'), function (rm) {
      var is = rm.dataset.room === room;
      rm.classList.toggle('csd-current', is);
      rm.querySelector('.csd-tagslot').innerHTML = is ? '<span class="csd-nowtag">Here now</span>' : '<span class="csd-send">Send \u2192</span>';
    });
  }
  function setPhase(p) {                 // live breathing phase â now-card chip
    if (!p) return;
    if (el.phase) el.phase.textContent = p.label || '';
    if (el.phaseSub) el.phaseSub.textContent = p.sub || '';
  }

  function renderEvent(e) {
    if (!connected) setConnected();
    if (!startedAt) { startedAt = e.t; startClock(); }
    var ts = fmt(Math.round((e.t - startedAt) / 1000));
    var d = e.detail || {}, room = e.room;
    switch (e.type) {
      case 'enter':    setCurrentRoom(room); feedLine('progress', ts, pill(room) + 'entered'); break;
      case 'progress':
        if (d.completed) feedLine('progress', ts, pill(room) + 'completed <b>'+d.cycles+' of '+d.target+'</b>');
        else if (d.summary) feedLine('progress', ts, pill(room) + d.summary);
        break;
      case 'choice':   feedLine('choice', ts, pill(room) + d.label + ' \u2192 <b>'+d.value+'</b>'); break;
      case 'reflect':  feedLine('reflect', ts, pill(room) + 'felt <b>'+(d.label||d.feeling)+'</b>'); break;
      case 'note':     feedLine('note', ts, (d.kind === 'let-go' ? 'let go of: ' : '') + '\u201C'+d.text+'\u201D'); break;
      case 'system':   if (d.ended) feedLine('system', ts, 'Client ended the session'); break;
    }
  }

  function control(type, payload, feedText) {
    if (engine) engine.sendControl(type, payload);
    // these navigation controls auto-resume the client; reflect that on the button
    if (paused && (type === 'goto_room' || type === 'return_hub' || type === 'goto_reflection')) {
      paused = false;
      var pb = root.querySelector('.csd-ctl[data-ctl="pause"]'); if (pb) pb.innerHTML = SVG.pause + 'Pause';
    }
    feedLine('therapist', fmt(elapsed()), feedText || ('You: ' + type));
    toast(feedText || 'Sent');
  }

  function showSummary() {
    var sum = engine && engine.summary(); if (!sum) return;
    el.summaryMeta.textContent = sum.sessionCode + ' \u00b7 ' + fmt(sum.durationSec) + ' \u00b7 ' + sum.rooms.length + ' rooms';
    el.summaryRows.innerHTML = '';
    sum.rooms.forEach(function (r) {
      var feel = r.feeling ? '<span class="csd-feel '+(FEEL_CLASS[r.feeling]||'')+'">'+r.feeling+'</span>' : '';
      var extras = [];
      if (r.extra) {
        if (r.extra.calm_color) extras.push('calm: '+r.extra.calm_color);
        if (r.extra.release_color) extras.push('release: '+r.extra.release_color);
        if (r.extra.category) extras.push('grounding: '+r.extra.category);
        if (r.extra.regions && r.extra.regions.length) extras.push(r.extra.regions.length+' regions');
      }
      var note = r.note ? '<div class="csd-snote">\u201C'+r.note+'\u201D</div>'
        : (r.extra && r.extra.letGo ? '<div class="csd-snote">let go of: \u201C'+r.extra.letGo+'\u201D</div>' : '');
      el.summaryRows.insertAdjacentHTML('beforeend',
        '<div class="csd-srow"><div class="csd-stop"><b>'+r.room+'</b>'+feel+'</div>'+
        '<div class="csd-smeta2">'+r.practice+' \u00b7 '+r.cycles+' \u00b7 '+fmt(r.seconds)+(extras.length?' \u00b7 '+extras.join(' \u00b7 '):'')+(r.completed?'':' \u00b7 left early')+'</div>'+note+'</div>');
    });
    el.summary.classList.add('csd-show');
  }

  function reset() {
    startedAt = null; connected = false; paused = false;
    var pb = root.querySelector('.csd-ctl[data-ctl="pause"]'); if (pb) pb.innerHTML = SVG.pause + 'Pause';
    if (ticking) { clearInterval(ticking); ticking = null; }
    el.feed.innerHTML = '<div class="csd-empty" data-csd="empty">Nothing yet \u2014 the feed fills as the client moves through the garden.</div>';
    el.empty = q('empty');
    el.summary.classList.remove('csd-show');
    el.conn.classList.remove('csd-live'); el.connText.textContent = 'Waiting for client';
    el.nowCard.classList.add('csd-idle');
    el.glyph.textContent = '\u00b7'; el.nowRoom.textContent = 'No room yet'; el.nowPractice.textContent = 'Waiting for the client to begin';
    if (el.phase) el.phase.textContent = ''; if (el.phaseSub) el.phaseSub.textContent = '';
    el.handleRoom.textContent = 'Waiting\u2026'; el.elapsed.textContent = '00:00'; el.handleTime.textContent = '00:00';
    if (el.bodySlot) { el.bodySlot.innerHTML = ''; el.bodySlot.style.display = 'none'; }
  }

  function launch(o) {
    ensureBuilt();
    opts = o || {};
    endCb = null;

    var E = global.CypressSessionEngine;
    if (!opts.noEngine && !E) { console.error('[CypressDrawer] cypress-session-engine.js not loaded'); return null; }
    if (!opts.noEngine) {
      opts.code = opts.code || E.newCode();
    } else {
      opts.code = opts.code || Math.random().toString(36).substring(2, 8).toUpperCase();
    }

    reset();
    el.code.textContent = opts.code;
    el.client.textContent = opts.client || 'Client';
    if (opts.actName || opts.activityLabel) {
      if (el.actName) el.actName.textContent = opts.actName || opts.activityLabel;
    }

    // basic mode: hide garden-specific controls
    if (opts.hideGardenControls) root.classList.add('csd-basic');
    else root.classList.remove('csd-basic');

    // update end-button label to match mode
    var endBtn = root.querySelector('.csd-ctl.csd-end');
    if (endBtn) endBtn.innerHTML = SVG.end + (opts.noEngine ? 'End session' : 'End session &amp; save summary');

    // URL row
    if (opts.clientUrl && el.urlRow) {
      el.urlRow.style.display = 'flex';
      el.urlVal.textContent = opts.clientUrl;
    } else if (el.urlRow) {
      el.urlRow.style.display = 'none';
    }

    if (!opts.noEngine) {
      if (engine) { try { engine.close(); } catch (e) {} engine = null; }
      var joinOpts = { role:'therapist', code:opts.code };
      if (opts.supabase) joinOpts.supabase = opts.supabase;
      engine = E.join(joinOpts);
      engine.onEvent(renderEvent);
      engine.onPhase(setPhase);
      engine.onPresence(function () { if (!connected) setConnected(); });
    }

    el.handle.classList.add('csd-avail');

    // open the client view with the code (+ supabase flag if enabled)
    if (opts.clientView) {
      var sep = opts.clientView.indexOf('?') >= 0 ? '&' : '?';
      var url = opts.clientView + sep + 'session=' + encodeURIComponent(opts.code) + (opts.supabase ? '&supabase=1' : '');
      window.open(url, '_blank');
    }
    open();
    return opts.code;
  }

  function end() {
    if (engine) { control('end', {}, 'You ended the session'); showSummary(); }
  }

  global.CypressDrawer = {
    launch: launch,
    open: open,
    close: close,
    end: end,
    onSave: function (fn) { saveCb = fn; },
    onEnd:  function (fn) { endCb  = fn; },
    isLive: function () { return connected; },
    code: function () { return opts.code; },
    setStatus: function (text) { if (el.connText) el.connText.textContent = text; },
    markConnected: function () { setConnected(); },
    getBodySlot: function () { return el.bodySlot || null; },
    showBodySlot: function () {
      if (el.bodySlot) { el.bodySlot.style.display = 'flex'; el.bodySlot.style.flexDirection = 'column'; }
    },
  };
})(typeof window !== 'undefined' ? window : this);

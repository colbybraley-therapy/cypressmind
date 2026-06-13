/**
 * wheel-drawer.js – Cypress Mind
 * Live session drawer for the Wheel of Emotions activity.
 * Drop-in module, same pattern as live-session-drawer.js.
 *
 * Usage:
 *   <script src="../_shared/cypress-session-engine.js"></script>
 *   <script src="../tools/wheel-of-emotions/wheel-drawer.js"></script>
 *
 *   WheelDrawer.launch({
 *     client: 'J.M.',
 *     clientView: '../tools/wheel-of-emotions/index.html',
 *     // supabase: yourClient   // omit = same-browser BroadcastChannel
 *   });
 *
 *   WheelDrawer.onSave(function(summary) { /* save to Supabase *\/ });
 */
(function (global) {
  'use strict';

  /* ── DISCUSSION PROMPTS (family-keyed, 3 each) ── */
  const PROMPTS = {
    joy: [
      'What does this feeling feel like in your body when it shows up?',
      'Tell me about a recent moment that brought you this feeling.',
      'What helps you hold onto it when you notice it?',
    ],
    trust: [
      'Who in your life do you feel safest with? What makes them feel safe?',
      'Has this feeling ever been hard to give? What got in the way?',
      'What does it feel like when someone breaks your trust?',
    ],
    fear: [
      'What does this feeling feel like for you – is it loud or quiet?',
      "What's something you're scared of that you haven't told many people?",
      'When this feeling shows up, what do you usually do with it?',
    ],
    surprise: [
      'Tell me about a surprise that felt good – and one that didn\'t.',
      'How do you feel in your body right before something unexpected happens?',
      "What's the biggest surprise you've had this year?",
    ],
    sadness: [
      'Where do you feel this in your body?',
      'What does this feeling need from you when it visits?',
      "Is there something you're holding onto that we haven't talked about yet?",
    ],
    disgust: [
      'What kinds of things bring up this feeling for you?',
      'Does it ever show up toward yourself, not just things outside you?',
      'What do you think this feeling is trying to protect you from?',
    ],
    anger: [
      'What does this feel like right before it arrives – any warning signs?',
      'What usually sits underneath it when you look close?',
      'When it shows up, what does it want you to do?',
    ],
    anticipation: [
      'What are you looking forward to right now, even something small?',
      'Does waiting for things feel exciting or anxious for you – or both?',
      "What's something coming up that you have big feelings about?",
    ],
  };


  /* ── WORD DEFINITIONS (per word) ── */
  const DEFINITIONS = {
    // JOY
    happy:      'Feeling good inside — like things are going the way you want them to.',
    cheerful:   'A bright, upbeat mood — you feel light and easy.',
    content:    'Not too much, not too little — things feel just right.',
    warm:       'A cozy, gentle feeling — like being wrapped in something comfortable.',
    peaceful:   'Calm and still inside — nothing feels rushed or wrong.',
    thankful:   'Noticing something good and feeling glad it is there.',
    relieved:   'The worry or pressure lifted — you can breathe again.',
    playful:    'In the mood to have fun, joke around, or be silly.',
    silly:      'Laughing at small things — light and goofy in a good way.',
    proud:      'Feeling good about something you did or who you are.',
    grateful:   'Aware of something kind or good someone did, and glad for it.',
    loved:      'Feeling like someone really cares about you — you matter to them.',
    energized:  'Full of energy and ready to go — everything feels possible.',
    free:       'No pressure, no rules holding you back — you can just be yourself.',
    // TRUST
    safe:        'You know you will not get hurt here — physically or emotionally.',
    comfortable: 'Relaxed and at ease — no need to be on guard.',
    open:        'Ready to share or listen — not holding back.',
    accepted:    'People are okay with you as you are — you do not have to change.',
    included:    'You are part of what is happening — not on the outside looking in.',
    supported:   'Someone is with you — you do not have to carry it alone.',
    understood:  'Someone gets what you mean and how you feel.',
    valued:      'People notice you and think you matter.',
    close:       'A real connection with someone — like there is a bond between you.',
    seen:        'Someone actually noticed you — not just what you do, but who you are.',
    respected:   'People treat your thoughts and feelings like they matter.',
    belonging:   'You feel like you are part of something and you fit there.',
    // FEAR
    uneasy:   'A mild, hard-to-name feeling that something is not quite right.',
    shy:      'Unsure around people — you want to pull back a little.',
    nervous:  'Jumpy or on edge, often before something uncertain.',
    worried:  'Thinking a lot about something that might go wrong.',
    anxious:  'A restless, swirling feeling about what might happen.',
    tense:    'Your body or mind is tight — like you are bracing for something.',
    alone:    'No one feels nearby — like you are going through it by yourself.',
    unsafe:   'Something feels like a threat — like you could get hurt.',
    scared:   'Danger feels real and close — you want to get away from it.',
    dread:    'A heavy feeling about something bad you think is coming.',
    frozen:   'So overwhelmed that you cannot move or think — stuck.',
    panicked: 'Fear that takes over fast — heart racing, hard to think straight.',
    // SURPRISE
    curious:     'Something caught your interest and you want to know more.',
    unsure:      'You are not certain what to think or do yet.',
    confused:    'Things do not add up — you are trying to make sense of it.',
    startled:    'Something surprised you suddenly — like a jump, even a small one.',
    amazed:      'Something happened that is hard to believe — in a good way.',
    disoriented: 'Everything shifted and you are not sure where you stand.',
    shocked:     'Hit by something unexpected — takes a moment to absorb.',
    speechless:  'So surprised or moved that words will not come.',
    // SADNESS
    sad:          'A heavy, down feeling — something hurts inside.',
    disappointed: 'You hoped for something, and it did not happen.',
    lost:         'Uncertain and disconnected — not sure what to do or where you fit.',
    lonely:       'Feeling separate from others — like no one really sees you.',
    hurt:         'Something someone said or did left a wound inside.',
    excluded:     'Left out on purpose — like you were not chosen.',
    homesick:     'Missing a place, a person, or a feeling of home.',
    forgotten:    'Like people did not remember you were there or that you matter.',
    unwanted:     'Feeling like no one really wants you around.',
    empty:        'Hollow inside — like feelings have gone quiet but not in a good way.',
    heartbroken:  'A sharp, painful sadness — like something inside you broke.',
    grieving:     'Deep sadness after losing something or someone that mattered.',
    // DISGUST
    uncomfortable: 'Something feels off or wrong — you want to move away from it.',
    bothered:      'Something keeps getting on your nerves — it just does not sit right.',
    offended:      'Someone said or did something that felt disrespectful or wrong.',
    repulsed:      'A strong reaction — so turned off it almost feels physical.',
    disgusted:     'Really turned off by something — it feels deeply wrong.',
    // ANGER
    annoyed:      'Something small keeps bothering you — it is getting on your nerves.',
    frustrated:   'You are trying to get somewhere but something keeps blocking you.',
    mad:          'Something feels wrong or unfair and it fired you up.',
    ignored:      'You tried to be heard but nobody paid attention.',
    disrespected: 'Someone treated you like your feelings or opinions did not matter.',
    bitter:       'Anger mixed with hurt — something wounded you and you have not let go.',
    resentful:    'A slow-burning feeling about something unfair that was never fixed.',
    betrayed:     'Someone you trusted let you down in a way that really hurt.',
    furious:      'Very strong anger — hard to think straight through it.',
    enraged:      'Anger that has reached its peak — explosive and almost impossible to hold in.',
    // ANTICIPATION
    ready:     'Prepared and set — whatever comes, you can meet it.',
    waiting:   'In between — something is coming and you are holding on until it does.',
    hopeful:   'Believing something good could still happen.',
    eager:     'Ready and excited — you really want this thing to happen.',
    restless:  'Too much energy to sit still — the waiting feels hard.',
    excited:   'Energized and happy about something coming or happening.',
    impatient: 'The waiting feels too long — you want it to happen now.',
    dreading:  'A heavy feeling about something you really do not want to face.',
  };

  const FAMILY_COLORS = {
    joy:          '#F5C842',
    trust:        '#7DBF82',
    fear:         '#8A7FB5',
    surprise:     '#F4855A',
    sadness:      '#6A9CC7',
    disgust:      '#A3A84B',
    anger:        '#D95F6A',
    anticipation: '#E8A030',
  };

  const FAMILY_DARK = {
    joy:          '#9A7A10',
    trust:        '#2E6B33',
    fear:         '#3D2E7A',
    surprise:     '#8C3510',
    sadness:      '#1E4D7A',
    disgust:      '#4A4C10',
    anger:        '#7A1520',
    anticipation: '#7A4A00',
  };

  /* ── STATE ── */
  var engine   = null;
  var sbClient  = null;   // Supabase client for session save
  var dbRowId   = null;   // wheel_sessions row id once inserted
  var opts     = {};
  var saveCb   = null;
  var built    = false;
  var connected = false;
  var startedAt = null;
  var ticking   = null;
  var sessionLog = [];   // array of { word, family, note, landed_at, discussed_at }
  var currentLanded = null; // { word, family, intensity }

  /* ── DOM REFS ── */
  var el = {};

  /* ── CSS (scoped to wd- prefix) ── */
  var CSS = `
    /* ── Root ── */
    .wd-root * { box-sizing: border-box; margin: 0; padding: 0; }
    .wd-root {
      --wd-bg:      #1C1F1E;
      --wd-panel:   #252928;
      --wd-card:    #2E332F;
      --wd-border:  rgba(255,255,255,0.07);
      --wd-text:    #E8EAE8;
      --wd-muted:   #8A9288;
      --wd-hunter:  var(--hunter, #355E3B);
      --wd-green:   #4a9c54;
      --wd-radius:  12px;
      font-family: var(--font-body, 'DM Sans', sans-serif);
    }

    /* ── Handle (tab on left edge) ── */
    .wd-handle {
      position: fixed;
      right: 0; top: 50%;
      transform: translateY(-50%);
      width: 36px;
      background: var(--wd-hunter);
      border-radius: 8px 0 0 8px;
      padding: 14px 6px;
      cursor: pointer;
      z-index: 9998;
      display: none;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      box-shadow: -2px 0 12px rgba(0,0,0,0.3);
      transition: width 0.2s ease;
    }
    .wd-handle.wd-avail { display: flex; }
    .wd-handle-label {
      font-size: 10px;
      color: rgba(255,255,255,0.85);
      writing-mode: vertical-rl;
      text-orientation: mixed;
      letter-spacing: 0.08em;
      font-family: var(--font-head, 'Cinzel', serif);
    }
    .wd-handle-dot {
      width: 8px; height: 8px;
      border-radius: 50%;
      background: rgba(255,255,255,0.3);
    }
    .wd-handle-dot.wd-live { background: #5CD85A; animation: wdPulse 1.6s ease-in-out infinite; }
    @keyframes wdPulse { 0%,100%{opacity:1} 50%{opacity:0.4} }

    /* ── Drawer panel ── */
    .wd-drawer {
      position: fixed;
      right: 0; top: 0; bottom: 0;
      width: 360px;
      background: var(--wd-bg);
      z-index: 9999;
      transform: translateX(100%);
      transition: transform 0.3s cubic-bezier(0.4,0,0.2,1);
      display: flex;
      flex-direction: column;
      box-shadow: -4px 0 24px rgba(0,0,0,0.4);
      overflow: hidden;
    }
    .wd-drawer.wd-open { transform: translateX(0); }

    /* ── Header ── */
    .wd-header {
      background: var(--wd-hunter);
      padding: 16px 16px 14px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-shrink: 0;
    }
    .wd-header-left { display: flex; flex-direction: column; gap: 2px; }
    .wd-title {
      font-family: var(--font-head, 'Cinzel', serif);
      font-size: 13px;
      font-weight: 600;
      color: rgba(255,255,255,0.95);
      letter-spacing: 0.06em;
    }
    .wd-client-name {
      font-size: 11px;
      color: rgba(255,255,255,0.6);
    }
    .wd-header-right { display: flex; align-items: center; gap: 8px; }
    .wd-conn {
      display: flex; align-items: center; gap: 5px;
      font-size: 11px; color: rgba(255,255,255,0.55);
    }
    .wd-conn-dot {
      width: 7px; height: 7px; border-radius: 50%;
      background: rgba(255,255,255,0.25);
    }
    .wd-conn.wd-live .wd-conn-dot { background: #5CD85A; animation: wdPulse 1.6s ease-in-out infinite; }
    .wd-conn.wd-live .wd-conn-text { color: rgba(255,255,255,0.8); }
    .wd-close-btn {
      background: rgba(255,255,255,0.1);
      border: none; border-radius: 6px;
      width: 28px; height: 28px;
      cursor: pointer; color: rgba(255,255,255,0.7);
      font-size: 16px; line-height: 1;
      transition: background 0.15s;
      display: flex; align-items: center; justify-content: center;
    }
    .wd-close-btn:hover { background: rgba(255,255,255,0.18); }

    /* ── Status bar ── */
    .wd-status {
      background: var(--wd-panel);
      padding: 10px 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid var(--wd-border);
      flex-shrink: 0;
    }
    .wd-status-left { display: flex; flex-direction: column; gap: 2px; }
    .wd-status-label { font-size: 10px; color: var(--wd-muted); text-transform: uppercase; letter-spacing: 0.08em; }
    .wd-status-val { font-size: 13px; color: var(--wd-text); font-weight: 500; }
    .wd-elapsed { font-size: 20px; font-family: monospace; color: var(--wd-text); font-weight: 600; }

    /* ── Scroll body ── */
    .wd-body {
      flex: 1;
      min-height: 0;
      overflow-y: auto;
      padding: 14px 14px 20px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .wd-body::-webkit-scrollbar { width: 4px; }
    .wd-body::-webkit-scrollbar-track { background: transparent; }
    .wd-body::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }

    /* ── Waiting state ── */
    .wd-waiting {
      background: var(--wd-card);
      border: 1px solid var(--wd-border);
      border-radius: var(--wd-radius);
      padding: 20px 16px;
      text-align: center;
      color: var(--wd-muted);
      font-size: 13px;
      font-style: italic;
    }

    /* ── Landed card ── */
    .wd-landed {
      background: var(--wd-card);
      border-radius: var(--wd-radius);
      overflow: hidden;
      display: none;
    }
    .wd-landed.wd-show { display: block; }
    .wd-landed-top {
      padding: 14px 16px 12px;
      display: flex;
      align-items: center;
      gap: 12px;
      border-bottom: 1px solid var(--wd-border);
    }
    .wd-landed-swatch {
      width: 40px; height: 40px;
      border-radius: 50%;
      flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      font-size: 20px;
    }
    .wd-landed-info { flex: 1; }
    .wd-landed-word {
      font-family: var(--font-head, 'Cinzel', serif);
      font-size: 20px;
      font-weight: 600;
      line-height: 1.1;
    }
    .wd-landed-family {
      font-size: 11px;
      color: var(--wd-muted);
      text-transform: uppercase;
      letter-spacing: 0.08em;
      margin-top: 2px;
    }

    .wd-definition {
      font-size: 12px;
      color: var(--wd-muted);
      font-style: italic;
      line-height: 1.5;
      margin-top: 4px;
      padding: 6px 10px;
      background: rgba(255,255,255,0.04);
      border-radius: 6px;
      border-left: 2px solid rgba(255,255,255,0.1);
    }
    .wd-def-label {
      font-size: 9px;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: rgba(255,255,255,0.2);
      margin-bottom: 2px;
      font-style: normal;
    }
    .wd-spins-left {
      font-size: 11px;
      color: var(--wd-muted);
      text-align: right;
      flex-shrink: 0;
    }
    .wd-spins-num {
      font-size: 18px;
      font-weight: 600;
      color: var(--wd-text);
      display: block;
      line-height: 1;
    }

    /* Prompts */
    .wd-prompts { padding: 12px 16px; display: flex; flex-direction: column; gap: 8px; }
    .wd-prompts-label {
      font-size: 10px;
      color: var(--wd-muted);
      text-transform: uppercase;
      letter-spacing: 0.08em;
      margin-bottom: 2px;
    }
    .wd-prompt {
      background: var(--wd-panel);
      border: 1px solid var(--wd-border);
      border-radius: 8px;
      padding: 10px 12px;
      font-size: 13px;
      color: var(--wd-text);
      line-height: 1.5;
      cursor: pointer;
      transition: border-color 0.15s, background 0.15s;
      position: relative;
    }
    .wd-prompt:hover { border-color: rgba(255,255,255,0.18); background: #333836; }
    .wd-prompt.wd-used {
      opacity: 0.4;
      text-decoration: line-through;
      cursor: default;
    }

    /* Note field */
    .wd-note-wrap { padding: 0 16px 14px; }
    .wd-note-label {
      font-size: 10px;
      color: var(--wd-muted);
      text-transform: uppercase;
      letter-spacing: 0.08em;
      margin-bottom: 6px;
    }
    .wd-note {
      width: 100%;
      background: var(--wd-panel);
      border: 1px solid var(--wd-border);
      border-radius: 8px;
      padding: 9px 12px;
      font-size: 13px;
      color: var(--wd-text);
      font-family: var(--font-body, 'DM Sans', sans-serif);
      resize: none;
      outline: none;
      transition: border-color 0.15s;
      line-height: 1.4;
    }
    .wd-note::placeholder { color: var(--wd-muted); }
    .wd-note:focus { border-color: rgba(255,255,255,0.25); }

    /* Mark discussed button */
    .wd-mark-wrap { padding: 0 16px 16px; }
    .wd-mark-btn {
      width: 100%;
      background: var(--wd-hunter);
      border: none; border-radius: 10px;
      padding: 13px 16px;
      font-family: var(--font-head, 'Cinzel', serif);
      font-size: 13px;
      font-weight: 600;
      letter-spacing: 0.05em;
      color: rgba(255,255,255,0.95);
      cursor: pointer;
      transition: opacity 0.15s, transform 0.15s;
    }
    .wd-mark-btn:hover { opacity: 0.88; }
    .wd-mark-btn:active { transform: scale(0.98); }
    .wd-mark-btn:disabled { opacity: 0.35; cursor: default; }

    /* ── Session log ── */
    .wd-log-header {
      font-size: 10px;
      color: var(--wd-muted);
      text-transform: uppercase;
      letter-spacing: 0.08em;
      padding: 4px 2px;
    }
    .wd-log { display: flex; flex-direction: column; gap: 6px; }
    .wd-log-empty {
      font-size: 12px;
      color: var(--wd-muted);
      font-style: italic;
      padding: 4px 2px;
    }
    .wd-log-row {
      background: var(--wd-card);
      border-radius: 8px;
      padding: 8px 12px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .wd-log-dot {
      width: 10px; height: 10px;
      border-radius: 50%;
      flex-shrink: 0;
    }
    .wd-log-word {
      font-size: 13px;
      font-family: var(--font-head, 'Cinzel', serif);
      font-weight: 600;
      flex: 1;
    }
    .wd-log-note {
      font-size: 11px;
      color: var(--wd-muted);
      font-style: italic;
      max-width: 120px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    /* ── Footer controls ── */
    .wd-footer {
      flex-shrink: 0;
      background: var(--wd-panel);
      border-top: 1px solid var(--wd-border);
      padding: 12px 14px;
      display: flex;
      gap: 8px;
    }
    .wd-foot-btn {
      flex: 1;
      background: var(--wd-card);
      border: 1px solid var(--wd-border);
      border-radius: 8px;
      padding: 9px 8px;
      font-size: 12px;
      color: var(--wd-text);
      cursor: pointer;
      transition: background 0.15s;
      font-family: var(--font-body, 'DM Sans', sans-serif);
    }
    .wd-foot-btn:hover { background: #333836; }
    .wd-foot-btn.wd-end {
      background: rgba(217,95,106,0.15);
      border-color: rgba(217,95,106,0.3);
      color: #D95F6A;
    }
    .wd-foot-btn.wd-end:hover { background: rgba(217,95,106,0.25); }

    /* ── Summary ── */
    .wd-summary {
      display: none;
      flex-direction: column;
      gap: 12px;
      padding: 14px;
      flex: 1;
      min-height: 0;
      overflow-y: auto;
    }
    .wd-summary.wd-show { display: flex; }
    .wd-summary-title {
      font-family: var(--font-head, 'Cinzel', serif);
      font-size: 15px;
      font-weight: 600;
      color: var(--wd-text);
    }
    .wd-summary-row {
      background: var(--wd-card);
      border-radius: 8px;
      padding: 10px 14px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .wd-summary-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
    .wd-summary-word {
      font-family: var(--font-head, 'Cinzel', serif);
      font-size: 14px;
      font-weight: 600;
      flex: 1;
    }
    .wd-summary-meta { font-size: 11px; color: var(--wd-muted); }
    .wd-save-btn {
      background: var(--wd-hunter);
      border: none; border-radius: 10px;
      padding: 13px 16px;
      font-family: var(--font-head, 'Cinzel', serif);
      font-size: 13px; font-weight: 600; letter-spacing: 0.05em;
      color: rgba(255,255,255,0.95);
      cursor: pointer;
      transition: opacity 0.15s;
      width: 100%;
    }
    .wd-save-btn:hover { opacity: 0.88; }
  `;

  /* ── INJECT STYLES ── */
  function injectStyles() {
    if (document.getElementById('wd-styles')) return;
    var s = document.createElement('style');
    s.id = 'wd-styles';
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  /* ── BUILD DOM ── */
  function ensureBuilt() {
    if (built) return;
    injectStyles();

    var root = document.createElement('div');
    root.className = 'wd-root';
    root.innerHTML = `
      <!-- Handle -->
      <div class="wd-handle" id="wd-handle" onclick="WheelDrawer.open()">
        <div class="wd-handle-dot" id="wd-handle-dot"></div>
        <div class="wd-handle-label">Session</div>
      </div>

      <!-- Drawer -->
      <div class="wd-drawer" id="wd-drawer">

        <!-- Header -->
        <div class="wd-header">
          <div class="wd-header-left">
            <div class="wd-title">Wheel of Emotions</div>
            <div class="wd-client-name" id="wd-client-name">Client</div>
          </div>
          <div class="wd-header-right">
            <div class="wd-conn" id="wd-conn">
              <div class="wd-conn-dot"></div>
              <span class="wd-conn-text" id="wd-conn-text">Waiting for client</span>
            </div>
            <button class="wd-close-btn" onclick="WheelDrawer.close()">×</button>
          </div>
        </div>

        <!-- Status bar -->
        <div class="wd-status">
          <div class="wd-status-left">
            <div class="wd-status-label">Emotions explored</div>
            <div class="wd-status-val" id="wd-explored">0</div>
          </div>
          <div class="wd-status-left" style="text-align:center">
            <div class="wd-status-label">Remaining</div>
            <div class="wd-status-val" id="wd-remaining">–</div>
          </div>
          <div>
            <div class="wd-elapsed" id="wd-elapsed">00:00</div>
          </div>
        </div>

        <!-- Scrollable body -->
        <div class="wd-body" id="wd-body">

          <!-- Landed card (hidden until spin lands) -->
          <div class="wd-landed" id="wd-landed">
            <div class="wd-landed-top">
              <div class="wd-landed-swatch" id="wd-landed-swatch"></div>
              <div class="wd-landed-info">
                <div class="wd-landed-word" id="wd-landed-word">–</div>
                <div class="wd-landed-family" id="wd-landed-family"></div>
                <div class="wd-definition" id="wd-definition"><div class="wd-def-label">Definition</div><span id="wd-def-text"></span></div>
              </div>
              <div class="wd-spins-left">
                <span class="wd-spins-num" id="wd-spins-num">–</span>
                left
              </div>
            </div>

            <!-- Prompts -->
            <div class="wd-prompts">
              <div class="wd-prompts-label">Discussion prompts</div>
              <div class="wd-prompt" id="wd-prompt-0" onclick="WheelDrawer.togglePrompt(0)"></div>
              <div class="wd-prompt" id="wd-prompt-1" onclick="WheelDrawer.togglePrompt(1)"></div>
              <div class="wd-prompt" id="wd-prompt-2" onclick="WheelDrawer.togglePrompt(2)"></div>
            </div>

            <!-- Optional note -->
            <div class="wd-note-wrap">
              <div class="wd-note-label">Quick note (optional)</div>
              <textarea class="wd-note" id="wd-note" rows="2" placeholder="e.g. mentioned school, strong reaction…"></textarea>
            </div>

            <!-- Mark discussed -->
            <div class="wd-mark-wrap">
              <button class="wd-mark-btn" id="wd-mark-btn" onclick="WheelDrawer.markDiscussed()">
                Mark as Discussed ✓
              </button>
            </div>
          </div>

          <!-- Waiting state (shown when no slice is landed) -->
          <div class="wd-waiting" id="wd-waiting">
            Waiting for the client to spin…
          </div>

          <!-- Session log -->
          <div class="wd-log-header">Explored this session</div>
          <div class="wd-log" id="wd-log">
            <div class="wd-log-empty" id="wd-log-empty">Nothing yet.</div>
          </div>
        </div>

        <!-- Summary (replaces body on close) -->
        <div class="wd-summary" id="wd-summary">
          <div class="wd-summary-title">Session Summary</div>
          <div id="wd-summary-rows"></div>
          <button class="wd-save-btn" id="wd-save-btn" onclick="WheelDrawer.save()">
            Save to Client Record
          </button>
        </div>

        <!-- Footer -->
        <div class="wd-footer">
          <button class="wd-foot-btn" onclick="WheelDrawer.nudge()">Send Nudge</button>
          <button class="wd-foot-btn wd-end" onclick="WheelDrawer.end()">Close Session</button>
        </div>

      </div>
    `;

    document.body.appendChild(root);

    // Cache refs
    el.handle     = document.getElementById('wd-handle');
    el.handleDot  = document.getElementById('wd-handle-dot');
    el.drawer     = document.getElementById('wd-drawer');
    el.clientName = document.getElementById('wd-client-name');
    el.conn       = document.getElementById('wd-conn');
    el.connText   = document.getElementById('wd-conn-text');
    el.elapsed    = document.getElementById('wd-elapsed');
    el.explored   = document.getElementById('wd-explored');
    el.remaining  = document.getElementById('wd-remaining');
    el.landed     = document.getElementById('wd-landed');
    el.landedSwatch = document.getElementById('wd-landed-swatch');
    el.landedWord   = document.getElementById('wd-landed-word');
    el.landedFamily = document.getElementById('wd-landed-family');
    el.definition   = document.getElementById('wd-definition');
    el.defText      = document.getElementById('wd-def-text');
    el.spinsNum   = document.getElementById('wd-spins-num');
    el.prompts    = [0,1,2].map(i => document.getElementById('wd-prompt-' + i));
    el.note       = document.getElementById('wd-note');
    el.markBtn    = document.getElementById('wd-mark-btn');
    el.waiting    = document.getElementById('wd-waiting');
    el.log        = document.getElementById('wd-log');
    el.logEmpty   = document.getElementById('wd-log-empty');
    el.body       = document.getElementById('wd-body');
    el.summary    = document.getElementById('wd-summary');
    el.summaryRows = document.getElementById('wd-summary-rows');
    el.saveBtn    = document.getElementById('wd-save-btn');

    built = true;
  }

  /* ── TIMER ── */
  function fmt(s) {
    var m = Math.floor(s / 60);
    var sec = s % 60;
    return (m < 10 ? '0' : '') + m + ':' + (sec < 10 ? '0' : '') + sec;
  }

  function startTimer() {
    startedAt = Date.now();
    if (ticking) clearInterval(ticking);
    ticking = setInterval(function () {
      var secs = Math.floor((Date.now() - startedAt) / 1000);
      el.elapsed.textContent = fmt(secs);
    }, 1000);
  }

  /* ── CONNECTION ── */
  function setConnected() {
    connected = true;
    el.conn.classList.add('wd-live');
    el.connText.textContent = 'Client connected';
    el.handleDot.classList.add('wd-live');
    startTimer();
  }

  /* ── ENGINE EVENTS ── */
  function onEngineEvent(evt) {
    if (!evt) return;
    var d = evt.detail || {};

    if (evt.type === 'spin_landed') {
      showLanded({
        word:      d.word,
        family:    d.family,
        intensity: d.intensity,
        remaining: d.remaining,
        landed_at: d.landed_at,
      });
    }

    if (evt.type === 'pool_size') {
      el.remaining.textContent = d.total;
      if (sbClient && dbRowId && d.pool) {
        sbClient.from('wheel_sessions')
          .update({ word_pool: d.pool })
          .eq('id', dbRowId)
          .then(function(res) {
            if (res.error) console.warn('[WheelDrawer] pool save error:', res.error.message);
          });
      }
    }
  }

  /* ── LANDED STATE ── */
  function showLanded(data) {
    currentLanded = data;
    var color  = FAMILY_COLORS[data.family] || '#999';
    var dark   = FAMILY_DARK[data.family]   || '#333';
    var prompts = PROMPTS[data.family]       || [];

    el.landedSwatch.style.background = color + '33';
    el.landedSwatch.style.border     = '2px solid ' + color;
    el.landedSwatch.textContent       = getFamilySymbol(data.family);
    el.landedWord.textContent         = data.word;
    var defText = DEFINITIONS[data.word] || '';
    document.getElementById('wd-def-text').textContent = defText;
    document.getElementById('wd-definition').style.display = defText ? '' : 'none';
    el.landedWord.style.color         = color;
    el.landedFamily.textContent       = 'from ' + capitalize(data.family);
    el.spinsNum.textContent           = data.remaining !== undefined ? data.remaining : '–';

    // Populate prompts
    prompts.forEach(function (p, i) {
      el.prompts[i].textContent = p;
      el.prompts[i].classList.remove('wd-used');
    });

    el.note.value = '';
    el.markBtn.disabled = false;

    el.waiting.style.display = 'none';
    el.landed.classList.add('wd-show');
  }

  function hideLanded() {
    el.landed.classList.remove('wd-show');
    el.waiting.style.display = '';
    currentLanded = null;
  }

  /* ── MARK DISCUSSED ── */
  function markDiscussed() {
    if (!currentLanded) return;
    var note = el.note.value.trim();

    // Tell client screen to remove the slice
    if (engine) {
      engine.sendControl('mark_discussed', { word: currentLanded.word, note: note });
    }
    // Also call directly if same-tab demo
    if (global.markDiscussed) global.markDiscussed(note);

    // Log it
    var entry = {
      word:         currentLanded.word,
      family:       currentLanded.family,
      intensity:    currentLanded.intensity,
      note:         note,
      landed_at:    currentLanded.landed_at || new Date().toISOString(),
      discussed_at: new Date().toISOString(),
    };
    sessionLog.push(entry);
    addLogRow(entry);

    // Update counters
    el.explored.textContent = sessionLog.length;

    // Persist spin to Supabase
    if (sbClient && dbRowId) {
      sbClient.from('wheel_sessions')
        .update({
          spins:            sessionLog,
          emotions_visited: sessionLog.map(function(e) { return e.word; }),
        })
        .eq('id', dbRowId)
        .then(function(res) {
          if (res.error) console.warn('[WheelDrawer] spin update error:', res.error.message);
        });
    }

    hideLanded();
  }

  /* ── LOG ROW ── */
  function addLogRow(entry) {
    if (el.logEmpty) el.logEmpty.style.display = 'none';
    var color = FAMILY_COLORS[entry.family] || '#999';
    var row = document.createElement('div');
    row.className = 'wd-log-row';
    row.innerHTML =
      '<div class="wd-log-dot" style="background:' + color + '"></div>' +
      '<div class="wd-log-word" style="color:' + color + '">' + entry.word + '</div>' +
      (entry.note ? '<div class="wd-log-note">' + entry.note + '</div>' : '');
    el.log.appendChild(row);
  }

  /* ── TOGGLE PROMPT USED ── */
  function togglePrompt(i) {
    el.prompts[i].classList.toggle('wd-used');
  }

  /* ── NUDGE ── */
  function nudge() {
    if (engine) engine.sendControl('therapist_nudge', {});
  }

  var endCb = null;

  /* ── END SESSION ── */
  function end() {
    if (engine) engine.sendControl('end_session', {});
    if (ticking) { clearInterval(ticking); ticking = null; }
    if (endCb) endCb();
    showSummary();
  }

  /* ── SUMMARY ── */
  function showSummary() {
    el.body.style.display = 'none';
    el.summary.classList.add('wd-show');

    el.summaryRows.innerHTML = '';
    sessionLog.forEach(function (entry) {
      var color = FAMILY_COLORS[entry.family] || '#999';
      var row = document.createElement('div');
      row.className = 'wd-summary-row';
      row.style.marginBottom = '6px';
      row.innerHTML =
        '<div class="wd-summary-dot" style="background:' + color + '"></div>' +
        '<div class="wd-summary-word" style="color:' + color + '">' + entry.word + '</div>' +
        '<div class="wd-summary-meta">' + capitalize(entry.family) +
          (entry.note ? ' · ' + entry.note : '') + '</div>';
      el.summaryRows.appendChild(row);
    });

    if (sessionLog.length === 0) {
      el.summaryRows.innerHTML = '<div style="color:var(--wd-muted);font-size:13px;font-style:italic;padding:8px 0">No emotions were explored this session.</div>';
    }
  }

  /* ── SAVE ── */
  function save() {
    var secs = startedAt ? Math.floor((Date.now() - startedAt) / 1000) : 0;
    var summary = {
      client:            opts.client || null,
      spins:             sessionLog,
      emotions_visited:  sessionLog.map(function (e) { return e.word; }),
      session_duration_seconds: secs,
      closed_at:         new Date().toISOString(),
    };
    if (saveCb) saveCb(summary);

    // Final save to Supabase
    if (sbClient && dbRowId) {
      sbClient.from('wheel_sessions')
        .update({
          spins:                    sessionLog,
          emotions_visited:         sessionLog.map(function(e) { return e.word; }),
          session_duration_seconds: summary.session_duration_seconds,
          closed_at:                summary.closed_at,
        })
        .eq('id', dbRowId)
        .then(function(res) {
          if (res.error) {
            console.warn('[WheelDrawer] final save error:', res.error.message);
            el.saveBtn.textContent = 'Save failed – retry';
            el.saveBtn.disabled = false;
          } else {
            el.saveBtn.textContent = 'Saved ✓';
            el.saveBtn.disabled = true;
          }
        });
    } else {
      el.saveBtn.textContent = 'Saved ✓';
      el.saveBtn.disabled = true;
    }
  }

  /* ── OPEN / CLOSE ── */
  function open() {
    ensureBuilt();
    el.drawer.classList.add('wd-open');
  }

  function close() {
    el.drawer.classList.remove('wd-open');
  }

  /* ── LAUNCH ── */
  function launch(o) {
    ensureBuilt();
    opts = o || {};

    reset();
    el.clientName.textContent = opts.client || 'Client';
    el.handle.classList.add('wd-avail');

    // Capture Supabase client for DB save
    if (opts.supabase) sbClient = opts.supabase;

    // Wire engine if available
    var E = global.CypressSessionEngine;
    if (E) {
      if (engine) { try { engine.close(); } catch(err) {} engine = null; }
      var joinOpts = { role: 'therapist', code: opts.code || E.newCode() };
      if (opts.supabase) joinOpts.supabase = opts.supabase;
      engine = E.join(joinOpts);
      engine.onEvent(onEngineEvent);
      engine.onPresence(function () { if (!connected) setConnected(); });
      opts.code = joinOpts.code;
    }

    // Create the DB row immediately so we have an ID to update
    if (sbClient && opts.code) {
      sbClient.from('wheel_sessions')
        .insert({
          session_code: opts.code,
          word_pool:    [],       // filled in once client starts
          spins:        [],
          started_at:   new Date().toISOString(),
        })
        .select('id')
        .single()
        .then(function(res) {
          if (res.data) dbRowId = res.data.id;
          // Silently ignore RLS/table-missing errors — session data saves to session_responses instead
        });
    }

    // Open client view
    if (opts.clientView) {
      var sep = opts.clientView.indexOf('?') >= 0 ? '&' : '?';
      var url = opts.clientView + sep + 'session=' + encodeURIComponent(opts.code || 'demo') +
                (opts.supabase ? '&supabase=1' : '');
      window.open(url, '_blank');
    }

    open();
    return opts.code;
  }

  /* ── RESET ── */
  function reset() {
    connected = false;
    startedAt = null;
    sessionLog = [];
    currentLanded = null;
    dbRowId = null;
    if (ticking) { clearInterval(ticking); ticking = null; }

    if (!built) return;
    el.conn.classList.remove('wd-live');
    el.connText.textContent = 'Waiting for client';
    el.handleDot.classList.remove('wd-live');
    el.elapsed.textContent = '00:00';
    el.explored.textContent = '0';
    el.remaining.textContent = '–';
    el.log.innerHTML = '<div class="wd-log-empty" id="wd-log-empty">Nothing yet.</div>';
    el.logEmpty = document.getElementById('wd-log-empty');
    el.landed.classList.remove('wd-show');
    el.waiting.style.display = '';
    el.body.style.display = '';
    el.summary.classList.remove('wd-show');
    el.summaryRows.innerHTML = '';
    el.saveBtn.textContent = 'Save to Client Record';
    el.saveBtn.disabled = false;
  }

  /* ── HELPERS ── */
  function capitalize(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''; }

  function getFamilySymbol(family) {
    var symbols = {
      joy: '☀', trust: '🤝', fear: '🌀', surprise: '…',
      sadness: '🧊', disgust: '🌿', anger: '🔥', anticipation: '→'
    };
    return symbols[family] || '●';
  }

  /* ── PUBLIC API ── */
  global.WheelDrawer = {
    launch:         launch,
    open:           open,
    close:          close,
    end:            end,
    save:           save,
    markDiscussed:  markDiscussed,
    nudge:          nudge,
    togglePrompt:   togglePrompt,
    onSave:         function (fn) { saveCb = fn; },
    onEnd:          function (fn) { endCb  = fn; },
    isLive:         function () { return connected; },
    code:           function () { return opts.code; },
    // Called by client screen when a slice lands (same-tab mode)
    notifyLanded:   function (data) { ensureBuilt(); showLanded(data); },
  };

})(typeof window !== 'undefined' ? window : global);

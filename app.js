/* ============================================================
   Mind Play Therapy — Client Progress Tracker
   app.js (Supabase edition)
   ============================================================ */

const SUPABASE_URL = 'https://vfpxovpwwabisfjjqkpm.supabase.co';
const SUPABASE_KEY = 'sb_publishable_-cIPFr0xt1CfC8fwh0e_ew_Q6LIbcX5';
const db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const AVATARS = ["🐻","🦊","🐺","🐱","🐶","🐸","🦁","🐯","🐼","🦋","🌻","⭐","🍀","🎯","🏔"];
const COLORS  = ["#D3D1C7","#B5D4F4","#9FE1CB","#F4C0D1","#F5C4B3","#FAC775","#C0DD97","#CECBF6","#F7C1C1","#85B7EB"];

const ACTIVITY_TYPES = [
  { id: 'quiz',      icon: '🧠', name: 'Coping Skills Quiz'  },
  { id: 'breathing', icon: '🌬️', name: 'Breathing Garden'    },
  { id: 'journal',   icon: '📓', name: 'Reflection Journal'  },
  { id: 'emotions',  icon: '🎭', name: 'Emotion Explorer'    },
  { id: 'custom',    icon: '✏️', name: 'Custom'              },
];

let currentUser          = null;
let selectedAvatar       = AVATARS[0];
let selectedActivityType = null;
let viewingClient        = null;   // full client row object
let scoringActivity      = null;   // activity uuid string
let _clients             = [];     // cached for openClientById

/* ── Page navigation ── */
function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}
function closeOverlay(id) { document.getElementById(id).classList.remove('open'); }
function closeBg(e, id)   { if (e.target === document.getElementById(id)) closeOverlay(id); }

/* ── Sign-in dropdown ── */
function toggleSignIn() {
  const panel = document.getElementById('signin-panel');
  if (panel.classList.contains('open')) {
    closeSignIn();
  } else {
    panel.classList.add('open');
    document.getElementById('signin-nav-btn').classList.add('open');
    setTimeout(() => document.addEventListener('mousedown', _outsideSignIn), 10);
    setTimeout(() => document.getElementById('si-email').focus(), 60);
  }
}
function closeSignIn() {
  document.getElementById('signin-panel').classList.remove('open');
  document.getElementById('signin-nav-btn').classList.remove('open');
  document.removeEventListener('mousedown', _outsideSignIn);
}
function _outsideSignIn(e) {
  if (!document.getElementById('signin-wrap').contains(e.target)) closeSignIn();
}
function goToSignIn() {
  showPage('pg-landing');
  setTimeout(toggleSignIn, 80);
}

/* ── Auth ── */
async function doSignIn() {
  const email = document.getElementById('si-email').value.trim().toLowerCase();
  const pass  = document.getElementById('si-pass').value;
  const err   = document.getElementById('si-err');
  err.textContent = '';
  if (!email || !pass) { err.textContent = 'Please enter your email and password.'; return; }

  const { data, error } = await db.auth.signInWithPassword({ email, password: pass });
  if (error) { err.textContent = 'Incorrect email or password.'; return; }

  currentUser = data.user;
  closeSignIn();
  loadApp();
}

async function doSignUp() {
  const name  = document.getElementById('su-name').value.trim();
  const email = document.getElementById('su-email').value.trim().toLowerCase();
  const pass  = document.getElementById('su-pass').value;
  const pass2 = document.getElementById('su-pass2').value;
  const err   = document.getElementById('su-err');
  err.textContent = '';

  if (!name)           { err.textContent = 'Please enter your name.'; return; }
  if (!email)          { err.textContent = 'Please enter your email.'; return; }
  if (pass.length < 6) { err.textContent = 'Password must be at least 6 characters.'; return; }
  if (pass !== pass2)  { err.textContent = 'Passwords do not match.'; return; }

  const { data, error } = await db.auth.signUp({
    email,
    password: pass,
    options: { data: { full_name: name } }
  });

  if (error) { err.textContent = error.message; return; }

  currentUser = data.user;
  loadApp();
}

async function doSignOut() {
  await db.auth.signOut();
  currentUser = null;
  showPage('pg-landing');
}

async function doSignInWithGoogle() {
  const err = document.getElementById('si-err');
  if (err) err.textContent = '';
  const { error } = await db.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin + window.location.pathname }
  });
  if (error && err) { err.textContent = 'Google sign-in failed. Please try again.'; }
}

function loadApp() {
  const name = currentUser?.user_metadata?.full_name || currentUser?.email || '';
  document.getElementById('tb-name').textContent = name;
  renderClients();
  showPage('pg-app');
}

function showApp() {
  renderClients();
  showPage('pg-app');
}

/* ── Client roster ── */
async function renderClients() {
  const grid = document.getElementById('client-grid');
  grid.innerHTML = '<div class="empty" style="grid-column:1/-1">Loading...</div>';

  const { data: clients, error } = await db
    .from('clients')
    .select('*, activities(id, done)')
    .eq('user_id', currentUser.id)
    .order('created_at', { ascending: true });

  if (error) {
    grid.innerHTML = '<div class="empty" style="grid-column:1/-1">Error loading clients.</div>';
    return;
  }

  _clients = clients;
  document.getElementById('roster-label').textContent =
    clients.length ? `Clients (${clients.length})` : 'Clients';

  if (!clients.length) {
    grid.innerHTML = '<div class="empty">No clients yet — add one to get started.</div>';
    return;
  }

  grid.innerHTML = clients.map(c => {
    const acts  = c.activities || [];
    const done  = acts.filter(a => a.done).length;
    const pct   = acts.length ? Math.round(done / acts.length * 100) : 0;
    const color = COLORS[c.color_index % COLORS.length];
    return `
      <div class="client-card" onclick="openClientById('${c.id}')">
        <button class="del-client-btn" onclick="event.stopPropagation(); deleteClient('${c.id}')" title="Remove client">✕</button>
        <div class="av" style="background:${color}">${c.avatar}</div>
        <div class="cn">${c.name}</div>
        <div class="cs">Since ${new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</div>
        <div class="prog-bar-wrap"><div class="prog-bar" style="width:${pct}%"></div></div>
        <div style="font-size:10px;color:var(--color-text-tertiary);margin-top:4px;">${pct}% complete</div>
      </div>`;
  }).join('');
}

function openClientById(id) {
  const client = _clients.find(c => c.id === id);
  if (client) openClient(client);
}

async function deleteClient(id) {
  if (!confirm('Remove this client? Their activity data will also be deleted.')) return;
  await db.from('clients').delete().eq('id', id);
  renderClients();
}

function openAddClient() {
  selectedAvatar = AVATARS[0];
  document.getElementById('cl-name').value = '';
  const picker = document.getElementById('av-picker');
  picker.innerHTML = '';
  AVATARS.forEach((av, i) => {
    const d = document.createElement('div');
    d.className = 'av-opt' + (av === selectedAvatar ? ' sel' : '');
    d.style.background = COLORS[i % COLORS.length];
    d.textContent = av;
    d.onclick = () => {
      selectedAvatar = av;
      document.querySelectorAll('.av-opt').forEach(x => x.classList.remove('sel'));
      d.classList.add('sel');
    };
    picker.appendChild(d);
  });
  document.getElementById('add-client-overlay').classList.add('open');
  setTimeout(() => document.getElementById('cl-name').focus(), 50);
}

async function saveClient() {
  const name = document.getElementById('cl-name').value.trim();
  if (!name) { document.getElementById('cl-name').focus(); return; }

  const colorIndex = AVATARS.indexOf(selectedAvatar);
  const { error } = await db.from('clients').insert({
    user_id:     currentUser.id,
    name,
    avatar:      selectedAvatar,
    color_index: colorIndex >= 0 ? colorIndex : 0,
  });

  if (!error) {
    closeOverlay('add-client-overlay');
    renderClients();
  }
}

/* ── Client profile ── */
function openClient(client) {
  viewingClient = client;
  const color = COLORS[client.color_index % COLORS.length];
  document.getElementById('cp-av').textContent        = client.avatar;
  document.getElementById('cp-av').style.background   = color;
  document.getElementById('cp-name').textContent      = client.name;
  document.getElementById('cp-since').textContent     = 'Since ' + new Date(client.created_at)
    .toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  renderActivities();
  showPage('pg-client');
}

/* ── Activities ── */
async function renderActivities() {
  if (!viewingClient) return;

  const { data: activities, error } = await db
    .from('activities')
    .select('*, scores(score, logged_at)')
    .eq('client_id', viewingClient.id)
    .order('created_at', { ascending: true });

  if (error) return;

  const done      = activities.filter(a => a.done).length;
  const allScores = activities.flatMap(a => (a.scores || []).map(s => s.score));
  const avg       = allScores.length
    ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length)
    : null;

  document.getElementById('st-total').textContent = activities.length;
  document.getElementById('st-done').textContent  = done;
  document.getElementById('st-avg').textContent   = avg !== null ? avg + '%' : '—';

  const list = document.getElementById('lesson-list');
  if (!activities.length) {
    list.innerHTML = '<div class="empty" style="grid-column:unset">No activities yet — assign one above.</div>';
    return;
  }

  list.innerHTML = activities.map(a => {
    const sortedScores = (a.scores || []).sort((x, y) => new Date(y.logged_at) - new Date(x.logged_at));
    const lastScore    = sortedScores.length ? sortedScores[0].score : null;
    const lastDate     = sortedScores.length
      ? new Date(sortedScores[0].logged_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      : a.completed_at
        ? new Date(a.completed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : null;
    const safeName = a.name.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    return `
      <div class="lesson-row${a.done ? ' done' : ''}">
        <div class="check${a.done ? ' done' : ''}" onclick="toggleActivity('${a.id}', ${a.done})">
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
            <polyline points="2,6 4.5,8.5 9,3" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <div class="lesson-info">
          <div class="lesson-name">${a.activity_icon ? `<span class="lesson-act-icon">${a.activity_icon}</span>` : ''}${a.name}</div>
          <div class="lesson-meta">
            ${lastDate ? 'Last: ' + lastDate : 'Not started'}
            ${lastScore !== null ? ' · Score: ' + lastScore + '%' : ''}
          </div>
        </div>
        <div class="lesson-actions">
          <span class="lesson-score" onclick="openScore('${a.id}', '${safeName}')">Score</span>
          <button class="del-lesson" onclick="deleteActivity('${a.id}')" title="Remove activity">✕</button>
        </div>
      </div>`;
  }).join('');
}

async function toggleActivity(id, currentDone) {
  const update = { done: !currentDone };
  if (!currentDone) update.completed_at = new Date().toISOString();
  await db.from('activities').update(update).eq('id', id);
  renderActivities();
}

async function deleteActivity(id) {
  if (!confirm('Remove this activity?')) return;
  await db.from('activities').delete().eq('id', id);
  renderActivities();
}

function openAddLesson() {
  selectedActivityType = null;
  document.getElementById('ls-name').value = '';
  document.getElementById('custom-name-field').style.display = 'none';

  const picker = document.getElementById('activity-picker');
  picker.innerHTML = '';
  ACTIVITY_TYPES.forEach(at => {
    const d = document.createElement('div');
    d.className = 'act-type-opt';
    d.innerHTML = `<span class="act-type-icon">${at.icon}</span><span class="act-type-name">${at.name}</span>`;
    d.onclick = () => {
      document.querySelectorAll('.act-type-opt').forEach(x => x.classList.remove('sel'));
      d.classList.add('sel');
      selectedActivityType = at;
      const customField = document.getElementById('custom-name-field');
      if (at.id === 'custom') {
        customField.style.display = 'block';
        setTimeout(() => document.getElementById('ls-name').focus(), 50);
      } else {
        customField.style.display = 'none';
      }
    };
    picker.appendChild(d);
  });

  document.getElementById('add-lesson-overlay').classList.add('open');
}

async function saveLesson() {
  if (!selectedActivityType) return;
  const name = selectedActivityType.id === 'custom'
    ? document.getElementById('ls-name').value.trim()
    : selectedActivityType.name;
  if (!name) { document.getElementById('ls-name').focus(); return; }

  const { error } = await db.from('activities').insert({
    client_id:     viewingClient.id,
    user_id:       currentUser.id,
    name,
    activity_type: selectedActivityType.id,
    activity_icon: selectedActivityType.id !== 'custom' ? selectedActivityType.icon : null,
    done:          false,
  });

  if (!error) {
    closeOverlay('add-lesson-overlay');
    renderActivities();
  }
}

/* ── Score logging ── */
async function openScore(activityId, activityName) {
  scoringActivity = activityId;
  document.getElementById('score-modal-title').textContent = 'Score — ' + activityName.substring(0, 30);
  document.getElementById('score-input').value = '';

  const { data: scores } = await db
    .from('scores')
    .select('score, logged_at')
    .eq('activity_id', activityId)
    .order('logged_at', { ascending: true });

  const hist = document.getElementById('score-history');
  if (scores?.length) {
    hist.innerHTML = `
      <p class="history-heading">History</p>
      <div class="history-list">
        ${scores.map(s => `
          <div class="history-row">
            <span style="color:var(--color-text-secondary)">${new Date(s.logged_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            <span style="font-weight:500">${s.score}% <span class="tag-done">done</span></span>
          </div>`).join('')}
      </div>`;
  } else {
    hist.innerHTML = '<p style="font-size:12px;color:var(--color-text-tertiary);margin-top:.75rem;">No sessions logged yet.</p>';
  }

  document.getElementById('score-overlay').classList.add('open');
  setTimeout(() => document.getElementById('score-input').focus(), 50);
}

async function saveScore() {
  const val = parseInt(document.getElementById('score-input').value, 10);
  if (isNaN(val) || val < 0 || val > 100) { document.getElementById('score-input').focus(); return; }

  await db.from('scores').insert({ activity_id: scoringActivity, score: val });
  await db.from('activities').update({ done: true, completed_at: new Date().toISOString() }).eq('id', scoringActivity);

  closeOverlay('score-overlay');
  renderActivities();
}

/* ── Keyboard shortcuts ── */
document.getElementById('si-pass').addEventListener('keydown',  e => { if (e.key === 'Enter') doSignIn(); });
document.getElementById('su-pass2').addEventListener('keydown', e => { if (e.key === 'Enter') doSignUp(); });
document.getElementById('cl-name').addEventListener('keydown',  e => { if (e.key === 'Enter') saveClient(); });
document.getElementById('ls-name').addEventListener('keydown',  e => { if (e.key === 'Enter') saveLesson(); });
document.getElementById('score-input').addEventListener('keydown', e => { if (e.key === 'Enter') saveScore(); });

/* ── Session restore ── */
db.auth.getSession().then(({ data: { session } }) => {
  if (session?.user) {
    currentUser = session.user;
    loadApp();
  }
});

db.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN' && session?.user && !currentUser) {
    currentUser = session.user;
    loadApp();
  }
  if (event === 'SIGNED_OUT') {
    currentUser = null;
    showPage('pg-landing');
  }
});

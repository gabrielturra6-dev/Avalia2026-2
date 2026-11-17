const SIZES = [5, 4, 3, 3, 2];
const $ = id => document.getElementById(id);
const show = id => ['login', 'place', 'battle'].forEach(s => ($(s).hidden = s !== id));
let horizontal = true, placed = [], game = null, busy = false;

async function api(path, body) {
  const r = await fetch('/api/' + path, body ? { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) } : {});
  const d = await r.json().catch(() => ({}));
  if (!r.ok) { const e = new Error(d.error || 'Erro de rede.'); e.status = r.status; throw e; }
  return d;
}
const fail = e => { $('err').textContent = e.message; };
const keyOf = (x, y) => x + ',' + y;
const cells = (s) => Array.from({ length: s.size }, (_, i) => [s.x + (s.h ? i : 0), s.y + (s.h ? 0 : i)]);

function buildGrid(el, onClick, onOver) {
  el.replaceChildren();
  for (let y = 0; y < 10; y++) for (let x = 0; x < 10; x++) {
    const b = document.createElement('button');
    b.className = 'cell'; b.dataset.x = x; b.dataset.y = y;
    b.setAttribute('aria-label', `Linha ${y + 1}, coluna ${String.fromCharCode(65 + x)}`);
    if (onClick) b.onclick = () => onClick(x, y);
    if (onOver) { b.onmouseenter = () => onOver(x, y); b.onfocus = () => onOver(x, y); }
    el.appendChild(b);
  }
}
const cellEl = (el, x, y) => el.children[y * 10 + x];

// ---------- Posicionamento ----------
function fits(s) {
  const used = new Set(placed.flatMap(p => cells(p).map(c => keyOf(...c))));
  return cells(s).every(([x, y]) => x >= 0 && y >= 0 && x < 10 && y < 10 && !used.has(keyOf(x, y)));
}
function drawPlace(prev) {
  const g = $('pgrid');
  [...g.children].forEach(c => (c.className = 'cell'));
  placed.forEach(s => cells(s).forEach(([x, y]) => cellEl(g, x, y).classList.add('ship')));
  if (prev && placed.length < SIZES.length) {
    const ok = fits(prev);
    cells(prev).forEach(([x, y]) => x < 10 && y < 10 && cellEl(g, x, y).classList.add(ok ? 'preview' : 'bad'));
  }
  const left = SIZES.slice(placed.length);
  $('hint').textContent = left.length ? `Próximo navio: ${left[0]} células.` : 'Frota completa.';
  $('start').disabled = left.length > 0;
}
function startPlacement() {
  placed = []; show('place'); $('err').textContent = '';
  buildGrid($('pgrid'), (x, y) => {
    if (placed.length >= SIZES.length) return;
    const s = { size: SIZES[placed.length], x, y, h: horizontal };
    if (!fits(s)) return ($('err').textContent = 'Posição inválida.');
    $('err').textContent = ''; placed.push(s); drawPlace();
  }, (x, y) => drawPlace({ size: SIZES[placed.length], x, y, h: horizontal }));
  drawPlace();
}
function randomize() {
  placed = [];
  for (const size of SIZES) for (;;) {
    const s = { size, h: Math.random() < .5, x: Math.floor(Math.random() * 10), y: Math.floor(Math.random() * 10) };
    if (fits(s)) { placed.push(s); break; }
  }
  drawPlace();
}
function rotate() { horizontal = !horizontal; $('dir').textContent = horizontal ? 'horizontal' : 'vertical'; }

// ---------- Combate ----------
function render(g) {
  game = g; show('battle');
  buildGrid($('egrid'), fire); buildGrid($('mgrid'));
  const sunk = new Set(g.sunkEnemy.flatMap(s => cells(s).map(c => keyOf(...c))));
  g.myShots.forEach(s => {
    const c = cellEl($('egrid'), s.x, s.y);
    c.classList.add(s.hit ? 'hit' : 'water'); if (sunk.has(keyOf(s.x, s.y))) c.classList.add('sunk');
  });
  g.playerShips.forEach(s => cells(s).forEach(([x, y]) => cellEl($('mgrid'), x, y).classList.add('ship')));
  g.enemyShots.forEach(s => { const c = cellEl($('mgrid'), s.x, s.y); c.classList.remove('ship'); c.classList.add(s.hit ? 'hit' : 'water'); });
  const done = g.status === 'finished';
  $('again').hidden = !done;
  if (done) $('msg').textContent = g.winner === 'player' ? 'Vitória! A frota inimiga foi afundada.' : 'Derrota. Sua frota foi afundada.';
  else if (!$('msg').textContent) $('msg').textContent = 'Escolha uma coordenada nas águas inimigas.';
}
const label = { agua: 'água', acerto: 'acerto', afundado: 'navio afundado' };
async function fire(x, y) {
  if (busy || game.status !== 'active' || game.myShots.some(s => s.x === x && s.y === y)) return;
  busy = true; $('err').textContent = '';
  try {
    const d = await api('game/fire', { x, y });
    let m = `Seu tiro: ${label[d.result]}.`;
    if (d.enemyShot) m += ` Inimigo atirou em ${String.fromCharCode(65 + d.enemyShot.x)}${d.enemyShot.y + 1}: ${label[d.enemyShot.result]}.`;
    $('msg').textContent = m; render(d.game);
    if (d.game.status === 'finished') { $('msg').textContent = m + ' ' + $('msg').textContent; loadMe(true); loadBoard(); }
  } catch (e) { fail(e); } finally { busy = false; }
}

// ---------- Sessão e placar ----------
async function loadBoard() {
  try {
    const rows = (await api('status')).leaderboard;
    $('lb').replaceChildren(...rows.map(r => Object.assign(document.createElement('li'), { textContent: `${r.username} — ${r.wins}V / ${r.losses}D` })));
  } catch (e) { /* placar é opcional */ }
}
async function loadMe(onlyScore) {
  try {
    const d = await api('status');
    if (!d.user) return show('login');
    $('userbox').hidden = false; $('uname').textContent = d.user.name;
    $('score').textContent = `${d.user.wins}V / ${d.user.losses}D`;
    if (d.user.avatar) $('avatar').src = d.user.avatar; else $('avatar').hidden = true;
    if (onlyScore) return;
    if (d.game && d.game.status === 'active') { $('msg').textContent = ''; render(d.game); } else startPlacement();
  } catch (e) { if (e.status === 401) show('login'); else fail(e); }
}

$('rotate').onclick = rotate;
$('random').onclick = randomize;
$('reset').onclick = () => { placed = []; drawPlace(); };
$('start').onclick = async () => {
  try { $('msg').textContent = ''; render((await api('game/new', { ships: placed })).game); } catch (e) { fail(e); }
};
$('again').onclick = () => { $('msg').textContent = ''; startPlacement(); };
$('logout').onclick = async () => { await api('logout', {}); location.reload(); };
document.addEventListener('keydown', e => { if (e.key.toLowerCase() === 'r' && !$('place').hidden) rotate(); });
loadMe(); loadBoard();

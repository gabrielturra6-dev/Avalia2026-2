// Regras do jogo (servidor). Importado pelas Pages Functions; não é uma rota.
export const SIZES = [5, 4, 3, 3, 2];
export const N = 10;
export const json = (d, s = 200, h = {}) =>
  new Response(JSON.stringify(d), { status: s, headers: { 'content-type': 'application/json', ...h } });
export const getCookie = (req, n) =>
  (req.headers.get('cookie') || '').split(/;\s*/).map(c => c.split('=')).find(c => c[0] === n)?.[1];
export const cellsOf = s => Array.from({ length: s.size }, (_, i) => [s.x + (s.h ? i : 0), s.y + (s.h ? 0 : i)]);
export const inb = (x, y) => Number.isInteger(x) && Number.isInteger(y) && x >= 0 && y >= 0 && x < N && y < N;
export const fired = (shots, x, y) => shots.some(t => t[0] === x && t[1] === y);
export const isSunk = (s, shots) => cellsOf(s).every(([a, b]) => fired(shots, a, b));
export const shipAt = (ships, x, y) => ships.find(s => cellsOf(s).some(c => c[0] === x && c[1] === y));
export const allSunk = (ships, shots) => ships.every(s => isSunk(s, shots));

export function judge(ships, shots, x, y) {
  const s = shipAt(ships, x, y);
  if (!s) return 'agua';
  return isSunk(s, shots) ? 'afundado' : 'acerto';
}

export function validateFleet(ships) {
  if (!Array.isArray(ships) || ships.length !== SIZES.length) return 'Frota inválida.';
  const sizes = ships.map(s => s?.size).sort((a, b) => b - a);
  if (sizes.join() !== SIZES.join()) return 'Tamanhos de navios inválidos.';
  const used = new Set();
  for (const s of ships) {
    if (typeof s.h !== 'boolean' || !Number.isInteger(s.x) || !Number.isInteger(s.y)) return 'Dados de navio inválidos.';
    for (const [x, y] of cellsOf(s)) {
      if (!inb(x, y)) return 'Navio fora dos limites da malha 10x10.';
      if (used.has(x + ',' + y)) return 'Navios sobrepostos.';
      used.add(x + ',' + y);
    }
  }
  return null;
}

export function randomFleet() {
  const ships = [], used = new Set();
  for (const size of SIZES) {
    for (;;) {
      const h = Math.random() < 0.5, s = { size, h, x: Math.floor(Math.random() * N), y: Math.floor(Math.random() * N) };
      const cs = cellsOf(s);
      if (cs.every(([x, y]) => inb(x, y) && !used.has(x + ',' + y))) {
        cs.forEach(([x, y]) => used.add(x + ',' + y)); ships.push(s); break;
      }
    }
  }
  return ships;
}

// IA do computador: ataca vizinhos de acertos ainda não afundados; senão, aleatório.
export function aiPick(ships, shots) {
  const open = [];
  for (const [x, y] of shots) {
    const s = shipAt(ships, x, y);
    if (s && !isSunk(s, shots))
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]])
        if (inb(x + dx, y + dy) && !fired(shots, x + dx, y + dy)) open.push([x + dx, y + dy]);
  }
  if (open.length) return open[Math.floor(Math.random() * open.length)];
  const free = [];
  for (let x = 0; x < N; x++) for (let y = 0; y < N; y++) if (!fired(shots, x, y)) free.push([x, y]);
  return free[Math.floor(Math.random() * free.length)];
}

export async function currentUser(req, env) {
  const t = getCookie(req, 'sid');
  if (!t) return null;
  return env.DB.prepare(
    'SELECT u.* FROM sessions s JOIN discord_users u ON u.user_id=s.user_id WHERE s.token=? AND s.expires>?'
  ).bind(t, Date.now()).first();
}

export const loadGame = (env, uid) =>
  env.DB.prepare('SELECT * FROM games WHERE user_id=? ORDER BY id DESC LIMIT 1').bind(uid).first();

// O que o cliente pode ver: nunca a frota inimiga (exceto navios afundados ou fim de jogo).
export function view(g) {
  if (!g) return null;
  const ps = JSON.parse(g.player_ships), es = JSON.parse(g.enemy_ships);
  const pShots = JSON.parse(g.player_shots), eShots = JSON.parse(g.enemy_shots);
  const done = g.status === 'finished';
  return {
    id: g.id, status: g.status, winner: g.winner, playerShips: ps,
    myShots: pShots.map(([x, y]) => ({ x, y, hit: !!shipAt(es, x, y) })),
    enemyShots: eShots.map(([x, y]) => ({ x, y, hit: !!shipAt(ps, x, y) })),
    sunkEnemy: es.filter(s => done || isSunk(s, pShots)),
  };
}



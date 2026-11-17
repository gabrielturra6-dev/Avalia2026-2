// Smoke test do agente de teste. Uso: node tests/smoke.mjs https://p26-3a-c938-e66f-589c-7fd7.pages.dev
const base = (process.argv[2] || 'http://localhost:8788').replace(/\/$/, '');
let fails = 0;
const check = (n, ok) => { console.log(ok ? 'OK   ' : 'FALHA', n); if (!ok) fails++; };
const post = (p) => fetch(base + p, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' });

const html = await (await fetch(base + '/')).text();
check('rodapé contém a chave única', html.includes('P26-3A-C938-E66F-589C-7FD7'));
const st = await (await fetch(base + '/api/status')).json();
check('/api/status ok e D1 conectado', st.ok === true && st.d1Connected === true);
check('/api/status sem login não traz usuário nem partida', st.user === null && st.game === null);
check('game/new sem login = 401', (await post('/api/game/new')).status === 401);
check('game/fire sem login = 401', (await post('/api/game/fire')).status === 401);
const login = await fetch(base + '/api/auth/discord', { redirect: 'manual' });
check('login redireciona ao Discord', (login.headers.get('location') || '').startsWith('https://discord.com/'));
process.exit(fails ? 1 : 0);

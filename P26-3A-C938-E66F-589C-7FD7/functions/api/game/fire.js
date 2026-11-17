/** POST /api/game/fire — processa o disparo, responde "agua" | "acerto" | "afundado", joga o turno inimigo e atualiza o placar. */
import { currentUser, loadGame, view, inb, fired, judge, allSunk, aiPick } from "../../_game.js";

export async function onRequestPost({ request, env }) {
  const user = await currentUser(request, env);
  if (!user) return Response.json({ error: "Não autenticado." }, { status: 401 });
  const { x, y } = await request.json().catch(() => ({}));
  const g = await loadGame(env, user.user_id);
  if (!g || g.status !== "active") return Response.json({ error: "Nenhuma partida ativa." }, { status: 400 });
  if (!inb(x, y)) return Response.json({ error: "Coordenada inválida." }, { status: 400 });

  const ps = JSON.parse(g.player_ships), es = JSON.parse(g.enemy_ships);
  const pShots = JSON.parse(g.player_shots), eShots = JSON.parse(g.enemy_shots);
  if (fired(pShots, x, y)) return Response.json({ error: "Você já atirou aí." }, { status: 409 });

  pShots.push([x, y]);
  const result = judge(es, pShots, x, y);
  let enemyShot = null, status = "active", winner = null;
  if (allSunk(es, pShots)) { status = "finished"; winner = "player"; }
  else {
    const [ex, ey] = aiPick(ps, eShots);
    eShots.push([ex, ey]);
    enemyShot = { x: ex, y: ey, result: judge(ps, eShots, ex, ey) };
    if (allSunk(ps, eShots)) { status = "finished"; winner = "enemy"; }
  }
  const stmts = [env.DB.prepare("UPDATE games SET player_shots=?, enemy_shots=?, status=?, winner=? WHERE id=?")
    .bind(JSON.stringify(pShots), JSON.stringify(eShots), status, winner, g.id)];
  if (winner) stmts.push(env.DB.prepare(`UPDATE discord_users SET ${winner === "player" ? "wins=wins+1" : "losses=losses+1"} WHERE user_id=?`).bind(user.user_id));
  await env.DB.batch(stmts);
  return Response.json({ result, enemyShot, game: view(await loadGame(env, user.user_id)) });
}

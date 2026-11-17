/** POST /api/game/new — valida a frota no servidor e cria a partida (frota inimiga sorteada e oculta). */
import { currentUser, loadGame, validateFleet, randomFleet, view } from "../../_game.js";

export async function onRequestPost({ request, env }) {
  const user = await currentUser(request, env);
  if (!user) return Response.json({ error: "Não autenticado." }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const err = validateFleet(body.ships);
  if (err) return Response.json({ error: err }, { status: 400 });
  const ships = body.ships.map(({ size, x, y, h }) => ({ size, x, y, h }));
  const old = await loadGame(env, user.user_id);
  if (old && old.status === "active") // abandonar partida ativa conta como derrota
    await env.DB.batch([
      env.DB.prepare("UPDATE games SET status='finished', winner='enemy' WHERE id=?").bind(old.id),
      env.DB.prepare("UPDATE discord_users SET losses=losses+1 WHERE user_id=?").bind(user.user_id)]);
  await env.DB.prepare("INSERT INTO games (user_id, player_ships, enemy_ships, created_at) VALUES (?, ?, ?, ?)")
    .bind(user.user_id, JSON.stringify(ships), JSON.stringify(randomFleet()), Date.now()).run();
  return Response.json({ game: view(await loadGame(env, user.user_id)) });
}

/** GET /api/status — saúde da API/D1, usuário logado, partida atual (sem a frota inimiga) e placar geral. */
import { currentUser, loadGame, view } from "../_game.js";

export async function onRequestGet({ request, env }) {
  const out = {
    ok: true, chave: "P26-3A-C938-E66F-589C-7FD7", projectId: 3, projectTitle: "Batalha Naval Tático",
    d1Connected: false, discordOAuthConfigured: Boolean(env.DISCORD_CLIENT_ID),
    user: null, game: null, leaderboard: [], serverTimestamp: new Date().toISOString(),
  };
  if (!env.DB) return Response.json(out);
  try {
    const { results } = await env.DB.prepare(
      "SELECT username, avatar, wins, losses FROM discord_users ORDER BY wins DESC, losses ASC LIMIT 10").all();
    out.leaderboard = results;
    out.d1Connected = true;
    const u = await currentUser(request, env);
    if (u) {
      out.user = { id: u.user_id, name: u.username, avatar: u.avatar, wins: u.wins, losses: u.losses };
      out.game = view(await loadGame(env, u.user_id));
    }
  } catch { /* migração ainda não aplicada */ }
  return Response.json(out);
}

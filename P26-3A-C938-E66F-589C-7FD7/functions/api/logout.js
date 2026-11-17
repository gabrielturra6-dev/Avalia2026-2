/** POST /api/logout — encerra a sessão. */
import { getCookie } from "../_game.js";
export async function onRequestPost({ request, env }) {
  const t = getCookie(request, "sid");
  if (t) await env.DB.prepare("DELETE FROM sessions WHERE token=?").bind(t).run();
  return Response.json({ ok: true }, { headers: { "Set-Cookie": "sid=; Path=/; Max-Age=0" } });
}

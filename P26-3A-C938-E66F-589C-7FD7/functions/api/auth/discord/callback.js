/** /api/auth/discord/callback — troca o code, importa user_id/nome/avatar, grava no D1 e cria sessão. */
import { getCookie } from "../../../_game.js";

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const back = (e) => Response.redirect(new URL("/?auth_error=" + e, url.origin).href, 302);
  const code = url.searchParams.get("code");
  if (url.searchParams.get("error") || !code) return back("missing_code");
  if (url.searchParams.get("state") !== getCookie(request, "oauth_state")) return back("invalid_state");
  if (!env.DISCORD_CLIENT_ID || !env.DISCORD_CLIENT_SECRET) return back("missing_credentials");

  try {
    const tokenRes = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: env.DISCORD_CLIENT_ID, client_secret: env.DISCORD_CLIENT_SECRET,
        grant_type: "authorization_code", code,
        redirect_uri: new URL("/api/auth/discord/callback", url.origin).href,
      }),
    });
    if (!tokenRes.ok) return back("token_exchange_failed");
    const { access_token } = await tokenRes.json();
    const userRes = await fetch("https://discord.com/api/users/@me", { headers: { Authorization: `Bearer ${access_token}` } });
    if (!userRes.ok) return back("fetch_user_failed");
    const du = await userRes.json();
    const username = du.global_name || du.username;
    const avatar = du.avatar ? `https://cdn.discordapp.com/avatars/${du.id}/${du.avatar}.png?size=64` : "https://cdn.discordapp.com/embed/avatars/0.png";

    await env.DB.prepare(
      "INSERT INTO discord_users (user_id, username, avatar, updated_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP) ON CONFLICT(user_id) DO UPDATE SET username = excluded.username, avatar = excluded.avatar, updated_at = CURRENT_TIMESTAMP"
    ).bind(du.id, username, avatar).run();
    const token = crypto.randomUUID() + crypto.randomUUID();
    await env.DB.prepare("INSERT INTO sessions (token, user_id, expires) VALUES (?, ?, ?)").bind(token, du.id, Date.now() + 7 * 864e5).run();

    const h = new Headers({ Location: "/?login=success" });
    h.append("Set-Cookie", `sid=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=604800`);
    h.append("Set-Cookie", "oauth_state=; Path=/; Max-Age=0");
    return new Response(null, { status: 302, headers: h });
  } catch {
    return back("exception");
  }
}

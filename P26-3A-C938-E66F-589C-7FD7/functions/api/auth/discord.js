/** /api/auth/discord — inicia o login OAuth2 do Discord (com parâmetro state anti-CSRF). */
export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  if (!env.DISCORD_CLIENT_ID) {
    return Response.json({ configured: false, message: "Defina DISCORD_CLIENT_ID e DISCORD_CLIENT_SECRET nas variáveis do Cloudflare Pages." }, { status: 500 });
  }
  const state = crypto.randomUUID();
  const a = new URL("https://discord.com/api/oauth2/authorize");
  a.searchParams.set("client_id", env.DISCORD_CLIENT_ID);
  a.searchParams.set("redirect_uri", new URL("/api/auth/discord/callback", url.origin).href);
  a.searchParams.set("response_type", "code");
  a.searchParams.set("scope", "identify");
  a.searchParams.set("state", state);
  return new Response(null, { status: 302, headers: {
    Location: a.href,
    "Set-Cookie": `oauth_state=${state}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`,
  } });
}

interface Env {
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  KV: KVNamespace;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const code = url.searchParams.get('code');

  if (!code) {
    return new Response(JSON.stringify({ error: 'No code provided' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const redirectUri = `${url.origin}/auth-callback`;
    
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: env.GOOGLE_CLIENT_ID,
        client_secret: env.GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      })
    });

    const tokenData = await tokenResponse.json() as { access_token?: string; error?: string };

    if (!tokenData.access_token) {
      return new Response(JSON.stringify({ error: tokenData.error || 'Token exchange failed' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    });

    const userData = await userResponse.json() as { email?: string; name?: string; picture?: string };

    if (env.KV) {
      const currentUsers = parseInt(await env.KV.get('stats:users') || '50000');
      await env.KV.put('stats:users', String(currentUsers + 1));
    }

    const response = new Response(JSON.stringify({
      success: true,
      user: {
        email: userData.email,
        name: userData.name,
        avatar: userData.picture,
        provider: 'google',
        loginTime: new Date().toISOString()
      }
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': `session=${tokenData.access_token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=3600`
      }
    });

    return response;
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
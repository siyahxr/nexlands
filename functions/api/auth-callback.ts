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

  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
      return new Response(JSON.stringify({ 
          error: 'Cloudflare Secrets Eksik', 
          details: 'GOOGLE_CLIENT_ID veya GOOGLE_CLIENT_SECRET tanımlanmamış. Lütfen Cloudflare Pages Dashboard > Settings > Environment Variables kısmından ekleyin.' 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
  }

  try {
    const redirectUri = `${url.origin}/auth-callback`;
    
    // 1. Exchange code for token
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

    // 2. Fetch user info from Google
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    });

    const userData = await userResponse.json() as { email?: string; name?: string; picture?: string };

    if (!userData.email) {
      return new Response(JSON.stringify({ error: 'Could not retrieve user email' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 3. Process User logic
    const existingUserStr = await env.KV.get('user:' + userData.email);
    let finalUser;

    if (!existingUserStr) {
      // Create new user handle (username)
      let username = userData.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
      const isTaken = await env.KV.get('username:' + username);
      if (isTaken) username += Math.floor(Math.random() * 1000);

      finalUser = {
        email: userData.email,
        name: userData.name || 'Nexlands User',
        username: username,
        avatar: userData.picture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
        provider: 'google',
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
      };

      // Increment stats for new users
      const currentStats = await env.KV.get('stats:users');
      const nextCount = parseInt(currentStats || '0') + 1;

      await Promise.all([
        env.KV.put('user:' + userData.email, JSON.stringify(finalUser)),
        env.KV.put('username:' + username, userData.email),
        env.KV.put('stats:users', String(nextCount))
      ]);
    } else {
      // Update existing user last login
      const existingUser = JSON.parse(existingUserStr);
      finalUser = { 
        ...existingUser, 
        lastLogin: new Date().toISOString(),
        avatar: userData.picture || existingUser.avatar // Keep google pic fresh
      };
      await env.KV.put('user:' + userData.email, JSON.stringify(finalUser));
    }

    // 4. Return user and set session cookie
    return new Response(JSON.stringify({
      success: true,
      user: {
        email: finalUser.email,
        name: finalUser.name,
        username: finalUser.username,
        avatar: finalUser.avatar,
        provider: 'google'
      }
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': `session=${tokenData.access_token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=3600`
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Auth server error', details: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
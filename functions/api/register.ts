interface Env {
  KV: KVNamespace;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const { email, name, password } = await request.json();
    
    // Basic validation
    if (!email || !name || !password) {
      return new Response(JSON.stringify({ error: 'All fields are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (password.length < 6) {
      return new Response(JSON.stringify({ error: 'Password must be at least 6 characters' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const existingUser = await env.KV.get('user:' + email);
    if (existingUser) {
      return new Response(JSON.stringify({ error: 'User already exists' }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    let username = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
    const isUsernameTaken = await env.KV.get('username:' + username);
    if (isUsernameTaken) {
      username += Math.floor(Math.random() * 1000);
    }
    
    const user = {
      email,
      name,
      username,
      password,
      provider: 'email',
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
      createdAt: new Date().toISOString(),
      loginTime: new Date().toISOString()
    };
    
    const currentUsersRaw = await env.KV.get('stats:users');
    const currentUsers = parseInt(currentUsersRaw || '0');

    await Promise.all([
      env.KV.put('user:' + email, JSON.stringify(user)),
      env.KV.put('username:' + username, email),
      env.KV.put('stats:users', String(currentUsers + 1))
    ]);

    return new Response(JSON.stringify({
      success: true,
      user: {
        email: user.email,
        name: user.name,
        username: user.username,
        avatar: user.avatar,
        provider: 'email'
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Server error', details: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
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

    const user = {
      email,
      name,
      password, // Note: In production hashing is mandatory
      provider: 'email',
      createdAt: new Date().toISOString(),
      loginTime: new Date().toISOString()
    };
    
    await env.KV.put('user:' + email, JSON.stringify(user));
    
    // Efficiently increment stats
    const currentUsersRaw = await env.KV.get('stats:users');
    const currentUsers = parseInt(currentUsersRaw || '50000');
    await env.KV.put('stats:users', String(currentUsers + 1));

    return new Response(JSON.stringify({
      success: true,
      user: {
        email: user.email,
        name: user.name,
        provider: 'email'
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
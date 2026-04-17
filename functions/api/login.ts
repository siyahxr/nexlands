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
    const { email, password } = await request.json();
    
    if (!email || !password) {
      return new Response(JSON.stringify({ error: 'Email and password required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const userData = await env.KV.get('user:' + email);
    if (!userData) {
      return new Response(JSON.stringify({ error: 'Invalid email or password' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const user = JSON.parse(userData);
    
    // In a real app we would compare hashes. 
    // For now, checking if password matches.
    if (user.password !== password) {
      return new Response(JSON.stringify({ error: 'Invalid email or password' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Update login time
    user.loginTime = new Date().toISOString();
    await env.KV.put('user:' + email, JSON.stringify(user));

    return new Response(JSON.stringify({
      success: true,
      user: {
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        provider: user.provider || 'email'
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

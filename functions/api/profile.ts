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
    const data = await request.json();
    const { email, originalEmail, name } = data;

    if (!originalEmail || !name) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get user using originalEmail (in case email isn't changing, or can't be changed)
    // For safety, we shouldn't allow email changes easily, but let's just update the name for now.
    const userStr = await env.KV.get('user:' + originalEmail);
    if (!userStr) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const user = JSON.parse(userStr);
    user.name = name;

    await env.KV.put('user:' + originalEmail, JSON.stringify(user));

    return new Response(JSON.stringify({
      success: true,
      user: {
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        provider: user.provider
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

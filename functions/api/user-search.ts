interface Env {
  KV: KVNamespace;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const username = url.searchParams.get('username');

  if (!username) {
    return new Response(JSON.stringify({ error: 'Username required' }), { status: 400 });
  }

  try {
    const email = await env.KV.get('username:' + username.toLowerCase());
    if (!email) {
      return new Response(JSON.stringify({ success: false, error: 'User not found' }), { status: 404 });
    }

    const userStr = await env.KV.get('user:' + email);
    if (!userStr) {
      return new Response(JSON.stringify({ success: false, error: 'User data corrupted' }), { status: 404 });
    }

    const user = JSON.parse(userStr);
    return new Response(JSON.stringify({
      success: true,
      user: {
        name: user.name,
        username: user.username,
        avatar: user.avatar,
        email: user.email
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
  }
};

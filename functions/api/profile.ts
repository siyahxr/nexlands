interface Env {
  KV: KVNamespace;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  try {
    const { originalEmail, name, username, avatar } = await request.json();

    if (!originalEmail) {
      return new Response(JSON.stringify({ error: 'Kimlik bilgisi eksik' }), { status: 400 });
    }

    const userStr = await env.KV.get('user:' + originalEmail);
    if (!userStr) {
      return new Response(JSON.stringify({ error: 'Kullanıcı bulunamadı' }), { status: 404 });
    }

    const user = JSON.parse(userStr);
    const updates = [];
    
    // 1. Handle Username Change with Conflict Check
    if (username && username !== user.username) {
        const lowerUsername = username.toLowerCase();
        const isTaken = await env.KV.get('username:' + lowerUsername);
        
        if (isTaken && isTaken !== originalEmail) {
            return new Response(JSON.stringify({ error: 'Bu kullanıcı adı zaten alınmış.' }), { status: 409 });
        }
        
        // Update username mapping
        updates.push(env.KV.put('username:' + lowerUsername, originalEmail));
        user.username = username;
    }

    // 2. Apply other updates
    if (name) user.name = name;
    if (avatar) user.avatar = avatar;
    user.updatedAt = new Date().toISOString();

    // 3. Persist all changes
    updates.push(env.KV.put('user:' + originalEmail, JSON.stringify(user)));
    await Promise.all(updates);

    return new Response(JSON.stringify({
      success: true,
      user: {
        email: user.email,
        name: user.name,
        username: user.username,
        avatar: user.avatar,
        provider: user.provider
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Profil güncellenemedi', details: err.message }), { status: 500 });
  }
};

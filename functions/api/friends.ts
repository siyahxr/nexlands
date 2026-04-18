interface Env {
  KV: KVNamespace;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const userId = url.searchParams.get('userId'); // Current user's email

  // 1. Fetch relations (GET)
  if (request.method === 'GET') {
    if (!userId) return new Response(JSON.stringify({ error: 'UserId (email) gereklidir' }), { status: 400 });
    
    try {
      const relationsRaw = await env.KV.get(`relations:${userId}`);
      const relations = relationsRaw ? JSON.parse(relationsRaw) : [];
      return new Response(JSON.stringify({ success: true, relations }), {
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (e) {
      return new Response(JSON.stringify({ error: 'İlişkiler yüklenemedi' }), { status: 500 });
    }
  }

  // 2. Send Friend Request (POST)
  if (request.method === 'POST') {
    try {
      const { userId, targetUsername, userName, userAvatar } = await request.json() as any;
      if (!userId || !targetUsername) return new Response(JSON.stringify({ error: 'Veri eksik' }), { status: 400 });

      // Find target by username
      const targetEmail = await env.KV.get(`username:${targetUsername.toLowerCase()}`);
      if (!targetEmail) return new Response(JSON.stringify({ error: 'Kullanıcı bulunamadı' }), { status: 404 });
      if (targetEmail === userId) return new Response(JSON.stringify({ error: 'Kendini ekleyemezsin' }), { status: 400 });

      // Fetch target user and both parties' relations concurrently
      const [targetUserStr, senderRelRaw, targetRelRaw] = await Promise.all([
        env.KV.get(`user:${targetEmail}`),
        env.KV.get(`relations:${userId}`),
        env.KV.get(`relations:${targetEmail}`)
      ]);

      if (!targetUserStr) return new Response(JSON.stringify({ error: 'Hedef kullanıcı verisi bozuk' }), { status: 404 });
      const targetUser = JSON.parse(targetUserStr);

      const senderRel = senderRelRaw ? JSON.parse(senderRelRaw) : [];
      const targetRel = targetRelRaw ? JSON.parse(targetRelRaw) : [];

      if (senderRel.find((r: any) => r.email === targetEmail)) {
        return new Response(JSON.stringify({ error: 'Zaten bir bağlantı mevcut' }), { status: 400 });
      }

      // Add to sender (outgoing) and receiver (pending)
      senderRel.push({ email: targetEmail, name: targetUser.name, username: targetUser.username, avatar: targetUser.avatar, status: 'outgoing', timestamp: new Date().toISOString() });
      targetRel.push({ email: userId, name: userName, username: userId.split('@')[0], avatar: userAvatar, status: 'pending', timestamp: new Date().toISOString() });

      await Promise.all([
        env.KV.put(`relations:${userId}`, JSON.stringify(senderRel)),
        env.KV.put(`relations:${targetEmail}`, JSON.stringify(targetRel))
      ]);

      return new Response(JSON.stringify({ success: true }), { status: 201 });
    } catch (e) {
      return new Response(JSON.stringify({ error: 'İstek gönderilemedi' }), { status: 500 });
    }
  }

  // 3. Accept/Reject Request (PUT)
  if (request.method === 'PUT') {
    try {
      const { userId, targetEmail, action } = await request.json() as any;
      
      const [senderRelRaw, receiverRelRaw] = await Promise.all([
        env.KV.get(`relations:${userId}`),
        env.KV.get(`relations:${targetEmail}`)
      ]);

      if (!senderRelRaw || !receiverRelRaw) return new Response(JSON.stringify({ error: 'İlişki kaydı bulunamadı' }), { status: 404 });

      let senderRel = JSON.parse(senderRelRaw);
      let receiverRel = JSON.parse(receiverRelRaw);

      if (action === 'accept') {
        senderRel = senderRel.map((r: any) => r.email === targetEmail ? { ...r, status: 'accepted' } : r);
        receiverRel = receiverRel.map((r: any) => r.email === userId ? { ...r, status: 'accepted' } : r);
      } else {
        senderRel = senderRel.filter((r: any) => r.email !== targetEmail);
        receiverRel = receiverRel.filter((r: any) => r.email !== userId);
      }

      await Promise.all([
        env.KV.put(`relations:${userId}`, JSON.stringify(senderRel)),
        env.KV.put(`relations:${targetEmail}`, JSON.stringify(receiverRel))
      ]);

      return new Response(JSON.stringify({ success: true }));
    } catch (e) {
      return new Response(JSON.stringify({ error: 'İşlem başarısız' }), { status: 500 });
    }
  }

  return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
};

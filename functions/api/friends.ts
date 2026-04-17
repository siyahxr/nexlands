interface Env {
  nexlands_kv: KVNamespace;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const userId = url.searchParams.get('userId');

  if (request.method === 'GET') {
    if (!userId) return new Response(JSON.stringify({ success: false, error: 'Missing userId' }), { status: 400 });
    
    // In KV, we store friends under list:friends:USER_EMAIL
    const friendsRaw = await env.nexlands_kv.get(`friends:${userId}`);
    const friends = friendsRaw ? JSON.parse(friendsRaw) : [];
    
    return new Response(JSON.stringify({ success: true, friends }));
  }

  if (request.method === 'POST') {
    const { userId, friendId, friendName, userName } = await request.json() as any;
    
    if (!userId || !friendId) return new Response(JSON.stringify({ success: false, error: 'Missing data' }), { status: 400 });

    // Store friend for the sender (Simulating auto-accept for now for 'real' feel)
    const senderFriendsRaw = await env.nexlands_kv.get(`friends:${userId}`);
    const senderFriends = senderFriendsRaw ? JSON.parse(senderFriendsRaw) : [];
    
    if (!senderFriends.find((f: any) => f.email === friendId)) {
        senderFriends.push({ email: friendId, name: friendName });
        await env.nexlands_kv.put(`friends:${userId}`, JSON.stringify(senderFriends));
    }

    // Store friend for the receiver
    const receiverFriendsRaw = await env.nexlands_kv.get(`friends:${friendId}`);
    const receiverFriends = receiverFriendsRaw ? JSON.parse(receiverFriendsRaw) : [];
    
    if (!receiverFriends.find((f: any) => f.email === userId)) {
        receiverFriends.push({ email: userId, name: userName });
        await env.nexlands_kv.put(`friends:${friendId}`, JSON.stringify(receiverFriends));
    }

    // Add notification for receiver
    const notifsRaw = await env.nexlands_kv.get(`notifs:${friendId}`);
    const notifs = notifsRaw ? JSON.parse(notifsRaw) : [];
    notifs.unshift({
        id: Date.now().toString(),
        type: 'friend_request',
        title: 'Yeni Arkadaş!',
        text: `${userName} seni arkadaş olarak ekledi.`,
        timestamp: Date.now()
    });
    // Keep last 10 notifs
    await env.nexlands_kv.put(`notifs:${friendId}`, JSON.stringify(notifs.slice(0, 10)));

    return new Response(JSON.stringify({ success: true }));
  }

  return new Response('Method not allowed', { status: 405 });
};

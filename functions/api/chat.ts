interface Env {
  KV: KVNamespace;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const channel = url.searchParams.get('channel') || 'genel';
  const kvKey = `chat:${channel}`;

  // 1. Fetch messages (GET)
  if (request.method === 'GET') {
    try {
      const messagesStr = await env.KV.get(kvKey);
      const messages = messagesStr ? JSON.parse(messagesStr) : [];
      
      return new Response(JSON.stringify({ success: true, messages }), {
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store' // Critical for real-time polling
        }
      });
    } catch (e) {
      return new Response(JSON.stringify({ error: 'Mesajlar yüklenemedi' }), { status: 500 });
    }
  }

  // 2. Post new message (POST)
  if (request.method === 'POST') {
    try {
      const { text, authorName, authorEmail, authorAvatar } = await request.json();
      
      if (!text || !authorEmail) {
        return new Response(JSON.stringify({ error: 'Mesaj metni ve gönderen bilgisi eksik' }), { status: 400 });
      }

      const messagesStr = await env.KV.get(kvKey);
      let messages = messagesStr ? JSON.parse(messagesStr) : [];

      const newMessage = {
        id: Date.now(), // Numeric monotonic ID for easy sorting/filtering
        text: text.slice(0, 500), // Safety limit
        authorName: authorName || 'Maceracı',
        authorEmail,
        authorAvatar: authorAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${authorName}`,
        timestamp: new Date().toISOString()
      };

      messages.push(newMessage);

      // Keep only last 100 for high performance
      if (messages.length > 100) {
        messages = messages.slice(-100);
      }

      await env.KV.put(kvKey, JSON.stringify(messages));

      return new Response(JSON.stringify({ success: true, message: newMessage }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (e) {
      return new Response(JSON.stringify({ error: 'Mesaj gönderilemedi' }), { status: 500 });
    }
  }

  return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
};

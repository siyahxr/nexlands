interface Env {
  KV: KVNamespace;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const channel = url.searchParams.get('channel') || 'genel';
  const kvKey = 'chat:' + channel;

  if (request.method === 'GET') {
    try {
      const messagesStr = await env.KV.get(kvKey);
      const messages = messagesStr ? JSON.parse(messagesStr) : [];
      return new Response(JSON.stringify({ success: true, messages }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (e) {
      return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
    }
  }

  if (request.method === 'POST') {
    try {
      const data = await request.json();
      const { channel: bodyChannel, text, authorName, authorEmail, authorAvatar } = data;
      
      const targetChannel = bodyChannel || channel;
      const postKvKey = 'chat:' + targetChannel;

      if (!text || !authorEmail) {
        return new Response(JSON.stringify({ error: 'Missing fields' }), { status: 400 });
      }

      const messagesStr = await env.KV.get(postKvKey);
      let messages = messagesStr ? JSON.parse(messagesStr) : [];

      const newMessage = {
        id: Date.now().toString(),
        text,
        authorName: authorName || 'Kullanıcı',
        authorEmail,
        authorAvatar: authorAvatar || '',
        timestamp: new Date().toISOString()
      };

      messages.push(newMessage);

      // Keep only the last 50 messages to prevent KV value from getting too big
      if (messages.length > 50) {
        messages = messages.slice(messages.length - 50);
      }

      await env.KV.put(postKvKey, JSON.stringify(messages));

      return new Response(JSON.stringify({ success: true, message: newMessage }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (e) {
      return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
    }
  }

  return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
};

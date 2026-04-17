interface Env {
  KV: KVNamespace;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const kvKey = 'channels:list';

  // Default initial channels if list in KV is empty
  const defaultChannels = [
    { name: "Yazılım Kulübü", icon: "fa-laptop-code", color: "#60A5FA" },
    { name: "Bilim & Deney", icon: "fa-flask", color: "#34D399" },
    { name: "Tarih Tutkunları", icon: "fa-history", color: "#FBBF24" }
  ];

  if (request.method === 'GET') {
    try {
      const dataStr = await env.KV.get(kvKey);
      let channels = dataStr ? JSON.parse(dataStr) : defaultChannels;
      return new Response(JSON.stringify({ success: true, channels }), {
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
      const { name } = data;

      if (!name) {
        return new Response(JSON.stringify({ error: 'Missing channel name' }), { status: 400 });
      }

      const dataStr = await env.KV.get(kvKey);
      let channels = dataStr ? JSON.parse(dataStr) : defaultChannels;

      // Check if exists
      if (!channels.find((c: any) => c.name.toLowerCase() === name.toLowerCase())) {
        channels.unshift({
          name: name,
          icon: "fa-hashtag",
          color: "#A855F7" // Purple default for user created ones
        });
        
        await env.KV.put(kvKey, JSON.stringify(channels));
      }

      return new Response(JSON.stringify({ success: true, channels }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (e) {
      return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
    }
  }

  return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
};

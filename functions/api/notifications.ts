interface Env {
  nexlands_kv: KVNamespace;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const userId = url.searchParams.get('userId');

  if (request.method === 'GET') {
    if (!userId) return new Response(JSON.stringify({ success: false, error: 'Missing userId' }), { status: 400 });
    
    const notifsRaw = await env.nexlands_kv.get(`notifs:${userId}`);
    const notifications = notifsRaw ? JSON.parse(notifsRaw) : [];
    
    return new Response(JSON.stringify({ success: true, notifications }));
  }

  return new Response('Method not allowed', { status: 405 });
};

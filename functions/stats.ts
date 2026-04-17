interface Env {
  KV: KVNamespace;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { env } = context;
  
  const users = await env.KV.get('stats:users') || '50000';
  const games = await env.KV.get('stats:games') || '1200';
  const answers = await env.KV.get('stats:answers') || '100000';
  
  return new Response(JSON.stringify({
    users: parseInt(users),
    games: parseInt(games),
    answers: parseInt(answers),
    lastUpdated: new Date().toISOString()
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
};
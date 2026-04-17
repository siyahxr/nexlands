interface Env {
  KV: KVNamespace;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { env } = context;
  
  // Concurrent fetch for better performance
  const [users, games, answers] = await Promise.all([
    env.KV.get('stats:users'),
    env.KV.get('stats:games'),
    env.KV.get('stats:answers')
  ]);
  
  const stats = {
    users: parseInt(users || '50000'),
    games: parseInt(games || '1200'),
    answers: parseInt(answers || '100000'),
    lastUpdated: new Date().toISOString()
  };
  
  return new Response(JSON.stringify(stats), {
    headers: { 
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=60'
    }
  });
};
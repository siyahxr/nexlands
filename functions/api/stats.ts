interface Env {
  KV: KVNamespace;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { env } = context;
  
  try {
    // Optimization: Fetch counts as simple strings first
    const [users, games, answers] = await Promise.all([
      env.KV.get('stats:users'),
      env.KV.get('stats:games'),
      env.KV.get('stats:answers')
    ]);

    // Fast fallback to 0 if KV is empty
    const stats = {
      users: parseInt(users || '0'),
      games: parseInt(games || '0'),
      answers: parseInt(answers || '0'),
      lastUpdated: new Date().toISOString()
    };
    
    return new Response(JSON.stringify(stats), {
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=30'
      }
    });
  } catch (err) {
    // Fallback response on error to keep UI from breaking
    return new Response(JSON.stringify({ 
      users: 0, 
      games: 0, 
      answers: 0, 
      error: 'Backend sync error' 
    }), { 
      status: 200, // Still return 200 to not break frontend loaders
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
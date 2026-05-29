exports.handler = async (event) => {
  const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_KEY;

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify({
      ok: true,
      google_api_key: GOOGLE_API_KEY ? GOOGLE_API_KEY.substring(0, 8) + '...' : 'NAO DEFINIDA',
      supabase_url: SUPABASE_URL ? 'OK' : 'NAO DEFINIDA',
      supabase_key: SUPABASE_KEY ? 'OK' : 'NAO DEFINIDA'
    })
  };
};

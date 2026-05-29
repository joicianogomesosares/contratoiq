const CORS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: CORS, body: '' };
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_KEY;

  try {
    const { token } = JSON.parse(event.body);

    if (!token) {
      return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Token não informado.' }) };
    }

    const headers = {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json'
    };

    const tokenRes = await fetch(
      `${SUPABASE_URL}/rest/v1/tokens?token=eq.${encodeURIComponent(token)}&select=*`,
      { headers }
    );
    const tokenData = await tokenRes.json();

    if (!tokenData || tokenData.length === 0) {
      return { statusCode: 401, headers: CORS, body: JSON.stringify({ error: 'Token inválido.' }) };
    }

    const historicoRes = await fetch(
      `${SUPABASE_URL}/rest/v1/historico?token=eq.${encodeURIComponent(token)}&order=data_analise.desc&limit=20&select=*`,
      { headers }
    );
    const historico = await historicoRes.json();

    return {
      statusCode: 200,
      headers: CORS,
      body: JSON.stringify({ cliente: tokenData[0], historico: historico || [] })
    };

  } catch (err) {
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: err.message }) };
  }
};

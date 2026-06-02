const CORS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS'
};

async function supabaseReq(url, key, method, path, body) {
  const res = await fetch(`${url}/rest/v1/${path}`, {
    method,
    headers: {
      'apikey': key,
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json',
      'Prefer': method === 'POST' ? 'return=representation' : 'return=minimal'
    },
    body: body ? JSON.stringify(body) : undefined
  });
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: CORS, body: '' };

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_KEY;

  try {
    const { token } = event.httpMethod === 'GET'
      ? event.queryStringParameters
      : JSON.parse(event.body);

    if (!token) return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Token obrigatório.' }) };

    // Busca histórico do token ordenado por data
    const historico = await supabaseReq(SUPABASE_URL, SUPABASE_KEY, 'GET',
      `historico?token=eq.${encodeURIComponent(token)}&order=criado_em.desc&select=id,arquivo_nome,tipo_contrato,score,recomendacao,modo,foco,criado_em,resultado_json`
    );

    return { statusCode: 200, headers: CORS, body: JSON.stringify(historico || []) };

  } catch (err) {
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: err.message }) };
  }
};

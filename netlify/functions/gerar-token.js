const CORS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*'
};

const LIMITES = {
  teste: 5,
  lite: 300,
  starter: 1000,
  advanced: 3000,
  enterprise: 10000
};

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: CORS, body: 'Method Not Allowed' };
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_KEY;

  try {
    const { nome, email, plano, pagamento_id } = JSON.parse(event.body);

    if (!nome || !email || !plano) {
      return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'nome, email e plano são obrigatórios.' }) };
    }

    const ts = new Date().toISOString().replace(/[-:.TZ]/g, '').substring(0, 14);
    const token = `CIQ-${ts}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const limite = LIMITES[plano] || LIMITES.teste;

    const res = await fetch(`${SUPABASE_URL}/rest/v1/tokens`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        token, nome, email, plano,
        analises_limite: limite,
        analises_usadas: 0,
        ativo: true,
        pagamento_id: pagamento_id || null
      })
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Supabase: ${err}`);
    }

    return {
      statusCode: 200,
      headers: CORS,
      body: JSON.stringify({ sucesso: true, token, nome, email, plano, analises_limite: limite })
    };

  } catch (err) {
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: err.message }) };
  }
};

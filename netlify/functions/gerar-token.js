// ══════════════════════════════════════════════════
// Esta função é chamada automaticamente pelo Make.com
// após um pagamento confirmado no Mercado Pago.
// Gera o token, salva no Supabase e retorna para o Make.com
// que envia por email ao cliente.
// ══════════════════════════════════════════════════

const LIMITES = {
  starter: 100,
  advanced: 300,
  enterprise_lite: 1000,
  enterprise_pro: 3000
};

function gerarToken(plano) {
  const prefixo = 'CIQ';
  const ano = new Date().getFullYear();
  const tipo = plano.toUpperCase().replace('_', '').slice(0, 3);
  const aleatorio = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefixo}-${ano}-${tipo}-${aleatorio}`;
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { nome, email, plano, pagamento_id } = JSON.parse(event.body);

    if (!nome || !email || !plano) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'nome, email e plano são obrigatórios' })
      };
    }

    const token = gerarToken(plano);
    const limite = LIMITES[plano] || 100;

    // Salva no Supabase
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;

    const res = await fetch(`${supabaseUrl}/rest/v1/tokens`, {
      method: 'POST',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        token,
        nome,
        email,
        plano,
        analises_limite: limite,
        analises_usadas: 0,
        ativo: true,
        pagamento_id: pagamento_id || null,
        criado_em: new Date().toISOString()
      })
    });

    const salvo = await res.json();

    return {
      statusCode: 200,
      body: JSON.stringify({
        sucesso: true,
        token,
        nome,
        email,
        plano,
        analises_limite: limite,
        mensagem: `Token gerado com sucesso para ${nome}`
      })
    };

  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};

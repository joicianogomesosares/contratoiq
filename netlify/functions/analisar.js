exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { base64, mediaType, token } = JSON.parse(event.body);

    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_KEY = process.env.SUPABASE_KEY;

    // Valida token no Supabase
    const tokenCheck = await fetch(
      `${SUPABASE_URL}/rest/v1/tokens?token=eq.${token}&select=*`,
      { headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` } }
    );
    const tokenData = await tokenCheck.json();

    if (!tokenData || tokenData.length === 0) {
      return {
        statusCode: 401,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Token inválido. Entre em contato pelo WhatsApp (85) 99232-3262.' })
      };
    }

    const cliente = tokenData[0];

    if (!cliente.ativo) {
      return {
        statusCode: 401,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Token inativo. Entre em contato com o suporte.' })
      };
    }

    if (cliente.analises_usadas >= cliente.analises_limite) {
      return {
        statusCode: 402,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: `Limite de análises atingido (${cliente.analises_limite}/${cliente.analises_limite}). Faça upgrade do seu plano.` })
      };
    }

    // Análise com IA
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-opus-4-5',
        max_tokens: 8000,
        messages: [{
          role: 'user',
          content: [
            { type: 'document', source: { type: 'base64', media_type: mediaType, data: base64 } },
            { type: 'text', text: `Você é um advogado sênior especialista em direito empresarial brasileiro com 20 anos de experiência. Emita um PARECER JURÍDICO COMPLETO e PROFISSIONAL sobre o contrato enviado.

Retorne EXATAMENTE este JSON sem nada antes ou depois:

{
  "score": 0,
  "recomendacao": "ASSINAR",
  "resumo_executivo": "",
  "parecer_final": "",
  "identificacao": {
    "tipo_contrato": "",
    "natureza_juridica": "",
    "leis_aplicaveis": [],
    "data_assinatura": "",
    "vigencia": "",
    "valor_total": "",
    "foro": ""
  },
  "partes": [{"nome":"","qualificacao":"","papel":"","capacidade_juridica":"","observacoes":""}],
  "clausulas": [{"numero":"","titulo":"","resumo":"","risco":"baixo","consequencia_descumprimento":"","abusiva":false,"observacao_legal":""}],
  "legislacao_aplicavel": [{"lei":"","artigos":[],"aplicacao":"","impacto":""}],
  "obrigacoes": {"contratante":[],"contratada":[],"mutuas":[]},
  "prazos": [{"descricao":"","data_ou_prazo":"","consequencia":"","risco":"baixo"}],
  "riscos_financeiros": [{"descricao":"","valor_ou_percentual":"","condicao":"","risco":"baixo"}],
  "clausulas_ausentes": [{"clausula":"","importancia":"","risco_ausencia":"","sugestao":""}],
  "recomendacoes_praticas": [{"tipo":"INCLUIR","descricao":"","prioridade":"urgente","justificativa_legal":""}]
}

REGRAS:
- score: 0 a 100
- recomendacao: apenas "ASSINAR", "NEGOCIAR" ou "RECUSAR"
- risco: apenas "alto", "medio" ou "baixo"
- tipo: apenas "INCLUIR", "REMOVER", "NEGOCIAR" ou "ATENCAO"
- prioridade: apenas "urgente", "importante" ou "sugerido"
- Analise CADA clausula individualmente
- Verifique: Codigo Civil, CDC, CLT, LGPD e leis do setor
- parecer_final: minimo 5 paragrafos com fundamentacao legal` }
          ]
        }]
      })
    });

    const data = await response.json();

    // Salva no histórico
    const tipoContrato = (() => {
      try {
        const texto = data.content[0].text;
        const json = JSON.parse(texto.replace(/```json|```/g, '').trim());
        return json.identificacao?.tipo_contrato || 'Contrato';
      } catch { return 'Contrato'; }
    })();

    await fetch(`${SUPABASE_URL}/rest/v1/historico`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        token,
        cliente_nome: cliente.nome,
        tipo_contrato: tipoContrato,
        plano: cliente.plano,
        data_analise: new Date().toISOString()
      })
    });

    // Incrementa análises usadas
    await fetch(`${SUPABASE_URL}/rest/v1/tokens?token=eq.${token}`, {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ analises_usadas: cliente.analises_usadas + 1 })
    });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        ...data,
        analises_restantes: cliente.analises_limite - cliente.analises_usadas - 1,
        plano: cliente.plano
      })
    };

  } catch (err) {
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: err.message })
    };
  }
};

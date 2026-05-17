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
    const { base64, mediaType } = JSON.parse(event.body);

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
            { type: 'text', text: `Você é um advogado sênior especialista em direito empresarial brasileiro com 20 anos de experiência. Emita um PARECER JURÍDICO COMPLETO e PROFISSIONAL sobre o contrato enviado.\n\nRetorne EXATAMENTE este JSON sem nada antes ou depois:\n\n{\n  "score": 0,\n  "recomendacao": "ASSINAR",\n  "resumo_executivo": "",\n  "parecer_final": "",\n  "identificacao": {\n    "tipo_contrato": "",\n    "natureza_juridica": "",\n    "leis_aplicaveis": [],\n    "data_assinatura": "",\n    "vigencia": "",\n    "valor_total": "",\n    "foro": ""\n  },\n  "partes": [{"nome":"","qualificacao":"","papel":"","capacidade_juridica":"","observacoes":""}],\n  "clausulas": [{"numero":"","titulo":"","resumo":"","risco":"baixo","consequencia_descumprimento":"","abusiva":false,"observacao_legal":""}],\n  "legislacao_aplicavel": [{"lei":"","artigos":[],"aplicacao":"","impacto":""}],\n  "obrigacoes": {"contratante":[],"contratada":[],"mutuas":[]},\n  "prazos": [{"descricao":"","data_ou_prazo":"","consequencia":"","risco":"baixo"}],\n  "riscos_financeiros": [{"descricao":"","valor_ou_percentual":"","condicao":"","risco":"baixo"}],\n  "clausulas_ausentes": [{"clausula":"","importancia":"","risco_ausencia":"","sugestao":""}],\n  "recomendacoes_praticas": [{"tipo":"INCLUIR","descricao":"","prioridade":"urgente","justificativa_legal":""}]\n}\n\nREGRAS:\n- score: 0 a 100\n- recomendacao: apenas ASSINAR, NEGOCIAR ou RECUSAR\n- risco: apenas alto, medio ou baixo\n- tipo: apenas INCLUIR, REMOVER, NEGOCIAR ou ATENCAO\n- prioridade: apenas urgente, importante ou sugerido\n- Analise CADA clausula individualmente\n- Verifique: Codigo Civil, CDC, CLT, LGPD e leis do setor\n- parecer_final: minimo 5 paragrafos com fundamentacao legal` }
          ]
        }]
      })
    });

    const data = await response.json();

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(data)
    };

  } catch (err) {
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: err.message })
    };
  }
};

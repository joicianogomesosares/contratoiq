export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        }
      });
    }

    if (request.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405 });
    }

    try {
      const { base64, mediaType } = await request.json();

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': env.ANTHROPIC_API_KEY || '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',
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-opus-4-5',
          max_tokens: 8000,
          messages: [{
            role: 'user',
            content: [
              { type: 'document', source: { type: 'base64', media_type: mediaType, data: base64 } },
              { type: 'text', text: `Você é um advogado sênior especialista em direito empresarial brasileiro com 20 anos de experiência. Emita um PARECER JURÍDICO COMPLETO e PROFISSIONAL sobre o contrato enviado.\n\nRetorne EXATAMENTE este JSON sem nada antes ou depois:\n\n{\n  "score": 0,\n  "recomendacao": "ASSINAR",\n  "resumo_executivo": "",\n  "parecer_final": "",\n  "identificacao": {\n    "tipo_contrato": "",\n    "natureza_juridica": "",\n    "leis_aplicaveis": [],\n    "data_assinatura": "",\n    "vigencia": "",\n    "valor_total": "",\n    "foro": ""\n  },\n  "partes": [{"nome":"","qualificacao":"","papel":"","capacidade_juridica":"","observacoes":""}],\n  "clausulas": [{"numero":"","titulo":"","resumo":"","risco":"baixo","consequencia_descumprimento":"","abusiva":false,"observacao_legal":""}],\n  "legislacao_aplicavel": [{"lei":"","artigos":[],"aplicacao":"","impacto":""}],\n  "obrigacoes": {"contratante":[],"contratada":[],"mutuas":[]},\n  "prazos": [{"descricao":"","data_ou_prazo":"","consequencia":"","risco":"baixo"}],\n  "riscos_financeiros": [{"descricao":"","valor_ou_percentual":"","condicao":"","risco":"baixo"}],\n  "clausulas_ausentes": [{"clausula":"","importancia":"","risco_ausencia":"","sugestao":""}],\n  "recomendacoes_praticas": [{"tipo":"INCLUIR","descricao":"","prioridade":"urgente","justificativa_legal":""}]\n}\n\nREGRAS:\n- score: 0 a 100\n- recomendacao: apenas ASSINAR, NEGOCIAR ou RECUSAR\n- risco: apenas alto, medio ou baixo\n- Analise CADA clausula individualmente\n- Verifique: Codigo Civil, CDC, CLT, LGPD\n- parecer_final: minimo 5 paragrafos` }
            ]
          }]
        })
      });

      const data = await response.json();

      return new Response(JSON.stringify(data), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });

    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
  }
};

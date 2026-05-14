exports.handler = async (event) => {
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
        model: 'claude-sonnet-4-20250514',
        max_tokens: 8000,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'document',
              source: { type: 'base64', media_type: mediaType, data: base64 }
            },
            {
              type: 'text',
              text: `Você é um advogado sênior especialista em direito empresarial brasileiro com 20 anos de experiência. Emita um PARECER JURÍDICO COMPLETO e PROFISSIONAL sobre o contrato enviado.

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

  "partes": [
    {
      "nome": "",
      "qualificacao": "",
      "papel": "",
      "capacidade_juridica": "",
      "observacoes": ""
    }
  ],

  "clausulas": [
    {
      "numero": "",
      "titulo": "",
      "resumo": "",
      "risco": "baixo",
      "consequencia_descumprimento": "",
      "abusiva": false,
      "observacao_legal": ""
    }
  ],

  "legislacao_aplicavel": [
    {
      "lei": "",
      "artigos": [],
      "aplicacao": "",
      "impacto": ""
    }
  ],

  "obrigacoes": {
    "contratante": [],
    "contratada": [],
    "mutuas": []
  },

  "prazos": [
    {
      "descricao": "",
      "data_ou_prazo": "",
      "consequencia": "",
      "risco": "baixo"
    }
  ],

  "riscos_financeiros": [
    {
      "descricao": "",
      "valor_ou_percentual": "",
      "condicao": "",
      "risco": "baixo"
    }
  ],

  "clausulas_ausentes": [
    {
      "clausula": "",
      "importancia": "",
      "risco_ausencia": "",
      "sugestao": ""
    }
  ],

  "recomendacoes_praticas": [
    {
      "tipo": "INCLUIR",
      "descricao": "",
      "prioridade": "urgente",
      "justificativa_legal": ""
    }
  ]
}

REGRAS:
- score: 0 a 100 (0=extremamente arriscado, 100=excelente)
- recomendacao: apenas "ASSINAR", "NEGOCIAR" ou "RECUSAR"
- risco em clausulas/prazos/riscos_financeiros: apenas "alto", "medio" ou "baixo"
- tipo em recomendacoes_praticas: apenas "INCLUIR", "REMOVER", "NEGOCIAR" ou "ATENCAO"
- prioridade: apenas "urgente", "importante" ou "sugerido"
- Analise CADA clausula individualmente
- Verifique: Codigo Civil (Lei 10.406/2002), CDC (Lei 8.078/1990), CLT (Decreto-Lei 5.452/1943), LGPD (Lei 13.709/2018) e leis especificas do setor
- Identifique clausulas abusivas ou ilegais
- Liste O QUE FALTA no contrato
- parecer_final: minimo 5 paragrafos com fundamentacao legal completa
- Se campo nao encontrado: "Nao especificado no contrato"`
            }
          ]
        }]
      })
    });

    const data = await response.json();
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    };

  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};

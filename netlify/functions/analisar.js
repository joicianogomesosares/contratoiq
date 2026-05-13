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
        max_tokens: 2000,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'document',
              source: { type: 'base64', media_type: mediaType, data: base64 }
            },
            {
              type: 'text',
              text: `Você é um analista jurídico sênior especializado em contratos empresariais brasileiros.

Analise o contrato e retorne EXATAMENTE neste formato JSON, sem mais nada:
{
  "resumo": "resumo executivo em 2 linhas",
  "partes": "quem são as partes envolvidas",
  "objeto": "o que o contrato trata",
  "valor": "valores financeiros mencionados",
  "vigencia": "datas de início e fim",
  "riscos": [
    {"clausula": "descrição", "nivel": "alto"},
    {"clausula": "descrição", "nivel": "medio"},
    {"clausula": "descrição", "nivel": "baixo"}
  ],
  "recomendacoes": ["recomendação 1", "recomendação 2", "recomendação 3"],
  "score": 72
}`
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

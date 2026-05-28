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

  const CORS = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'
  };

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_KEY;
  const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

  const supabase = async (method, path, body) => {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
      method,
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': method === 'POST' ? 'return=representation' : 'return=minimal'
      },
      body: body ? JSON.stringify(body) : undefined
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Supabase ${method} ${path}: ${err}`);
    }
    return res.json().catch(() => null);
  };

  try {
    const { base64, mediaType, token } = JSON.parse(event.body);

    if (!token) {
      return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Token não informado.' }) };
    }

    // 1. Busca token no Supabase
    const tokens = await supabase('GET', `tokens?token=eq.${encodeURIComponent(token)}&select=*`);

    if (!tokens || tokens.length === 0) {
      return { statusCode: 401, headers: CORS, body: JSON.stringify({ error: 'Token inválido.' }) };
    }

    const registro = tokens[0];

    if (!registro.ativo) {
      return { statusCode: 403, headers: CORS, body: JSON.stringify({ error: 'Token inativo. Entre em contato com o suporte.' }) };
    }

    const restantes = registro.analises_limite - registro.analises_usadas;

    if (restantes <= 0) {
      return {
        statusCode: 402,
        headers: CORS,
        body: JSON.stringify({
          error: `Limite de análises atingido. Seu plano ${registro.plano} inclui ${registro.analises_limite} análises por mês.`,
          analises_restantes: 0
        })
      };
    }

    // 2. Incrementa ANTES de chamar a API (reserva o crédito)
    await supabase('PATCH', `tokens?token=eq.${encodeURIComponent(token)}`, {
      analises_usadas: registro.analises_usadas + 1
    });

    let resultado;

    try {
      // 3. Chama API Gemini
      const GEMINI_MODEL = 'gemini-2.5-pro';
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GOOGLE_API_KEY}`;

      const prompt = `Você é um advogado sênior brasileiro com 25 anos de experiência em direito empresarial, contratual, trabalhista, tributário e digital. Sua especialidade é análise de risco contratual com fundamentação precisa na legislação brasileira vigente.

Analise o contrato anexado com profundidade máxima e retorne EXCLUSIVAMENTE um JSON válido, sem texto antes ou depois, sem markdown, sem blocos de código.

IMPORTANTE: Cada campo deve ser preenchido com o máximo de detalhes possível. Respostas genéricas ou superficiais não são aceitáveis.

Retorne exatamente este JSON:

{
  "score": 0,
  "recomendacao": "ASSINAR",
  "resumo_executivo": "",
  "parecer_final": "",
  "identificacao": {
    "tipo_contrato": "",
    "natureza_juridica": "",
    "modalidade": "",
    "leis_aplicaveis": [],
    "data_assinatura": "",
    "vigencia_inicio": "",
    "vigencia_fim": "",
    "renovacao_automatica": false,
    "prazo_aviso_nao_renovacao": "",
    "valor_total": "",
    "valor_mensal": "",
    "forma_pagamento": "",
    "indice_reajuste": "",
    "foro": "",
    "arbitragem": false,
    "camara_arbitral": "",
    "lei_aplicavel_conflitos": ""
  },
  "partes": [
    {
      "nome": "",
      "tipo": "pessoa_juridica",
      "cnpj_cpf": "",
      "endereco": "",
      "representante_legal": "",
      "cpf_representante": "",
      "cargo_representante": "",
      "tem_poderes_suficientes": true,
      "observacao_poderes": "",
      "papel": "contratante",
      "capacidade_juridica": ""
    }
  ],
  "clausulas": [
    {
      "numero": "",
      "titulo": "",
      "transcricao_resumida": "",
      "analise_detalhada": "",
      "risco": "baixo",
      "abusiva": false,
      "nula_de_pleno_direito": false,
      "fundamento_legal": "",
      "artigos_violados": [],
      "jurisprudencia_relevante": "",
      "impacto_financeiro_estimado": "",
      "recomendacao_especifica": ""
    }
  ],
  "legislacao_aplicavel": [
    {
      "lei": "",
      "numero": "",
      "artigos": [],
      "aplicacao_ao_contrato": "",
      "risco_de_violacao": "baixo",
      "consequencia_violacao": ""
    }
  ],
  "obrigacoes": {
    "contratante": [{"descricao": "", "prazo": "", "penalidade_descumprimento": "", "risco": "baixo"}],
    "contratada": [{"descricao": "", "prazo": "", "penalidade_descumprimento": "", "risco": "baixo"}],
    "mutuas": []
  },
  "prazos_criticos": [
    {
      "descricao": "",
      "data_ou_prazo": "",
      "tipo": "entrega",
      "consequencia_perda": "",
      "valor_multa_associada": "",
      "risco": "baixo",
      "alerta": ""
    }
  ],
  "riscos_financeiros": [
    {
      "descricao": "",
      "tipo": "multa",
      "valor_ou_percentual": "",
      "condicao_acionamento": "",
      "probabilidade": "media",
      "risco": "medio",
      "mitigacao_possivel": ""
    }
  ],
  "passivo_trabalhista": {
    "risco_vinculo_empregaticio": false,
    "fundamento": "",
    "elementos_caracterizadores": [],
    "estimativa_passivo": "",
    "recomendacao": ""
  },
  "analise_lgpd": {
    "contrato_envolve_dados_pessoais": false,
    "tipo_dados_tratados": [],
    "papel_empresa": "controlador",
    "tem_dpa": false,
    "base_legal_tratamento": "",
    "riscos_lgpd": [],
    "recomendacoes_lgpd": [],
    "multa_potencial_anpd": ""
  },
  "analise_propriedade_intelectual": {
    "ha_cessao_de_pi": false,
    "escopo_cessao": "",
    "inclui_codigo_terceiros": false,
    "risco_licencas_opensource": false,
    "metodologias_protegidas": false,
    "recomendacao": ""
  },
  "clausulas_abusivas": [
    {
      "clausula": "",
      "descricao_abuso": "",
      "fundamento_legal": "",
      "artigo_especifico": "",
      "efeito_juridico": "",
      "e_nula_de_pleno_direito": false,
      "como_renegociar": ""
    }
  ],
  "clausulas_ausentes": [
    {
      "clausula": "",
      "importancia": "critica",
      "risco_ausencia": "",
      "fundamento_legal": "",
      "sugestao_redacao": ""
    }
  ],
  "analise_equilibrio_contratual": {
    "score_equilibrio": 0,
    "parte_mais_favorecida": "",
    "desequilibrios_identificados": [],
    "caracteriza_contrato_adesao": false,
    "protecoes_cdc_aplicaveis": false
  },
  "recomendacoes_praticas": [
    {
      "prioridade": "urgente",
      "tipo": "NEGOCIAR",
      "clausula_referencia": "",
      "descricao": "",
      "texto_sugerido": "",
      "justificativa_legal": "",
      "impacto_se_ignorado": ""
    }
  ],
  "checklist_antes_assinar": [
    {
      "item": "",
      "status": "pendente",
      "observacao": ""
    }
  ],
  "glossario_juridico": [
    {
      "termo": "",
      "definicao": "",
      "relevancia_para_este_contrato": ""
    }
  ]
}

REGRAS OBRIGATÓRIAS:

1. score: número inteiro de 0 a 100. 0 = risco máximo, 100 = contrato perfeito.
2. recomendacao: apenas ASSINAR, NEGOCIAR ou RECUSAR.
3. risco em todos os campos: apenas "alto", "medio" ou "baixo".
4. prioridade: apenas "urgente", "importante" ou "recomendado".
5. tipo nas recomendações: apenas NEGOCIAR, INCLUIR, REMOVER, ALTERAR ou ATENCAO.
6. resumo_executivo: mínimo 3 parágrafos cobrindo (a) identificação e natureza, (b) principais riscos com referência às cláusulas, (c) posicionamento geral. Inclua obrigatoriamente um parágrafo comparando a taxa ou condições do contrato com a média de mercado, citando BACEN ou PROCON quando aplicável.
7. parecer_final: mínimo 6 parágrafos em linguagem de parecer jurídico formal e claro. Cada parágrafo deve ter no máximo 5 linhas.
8. clausulas: analise CADA cláusula individualmente. Nunca agrupe cláusulas.
9. artigos_violados: sempre citar artigo específico com número e lei.
10. jurisprudencia_relevante: citar súmulas do STJ/STF quando aplicável.
11. nula_de_pleno_direito: distinguir de abusiva — nula dispensa declaração judicial.
12. sugestao_redacao nas clausulas_ausentes: fornecer texto jurídico sugerido.
13. checklist_antes_assinar: mínimo 10 itens. Cada item começa com verbo no imperativo.
14. glossario_juridico: definição em linguagem simples, máximo 2 frases, sem jargão.
15. analise_equilibrio_contratual: score_equilibrio de 0 a 100, onde 50 = equilíbrio perfeito.
16. Se qualquer campo não se aplicar, retorne string vazia ou array vazio, nunca null.
17. Responda EXCLUSIVAMENTE em português brasileiro formal e claro.
18. Nunca invente artigos de lei.

LEGISLAÇÃO PARA VERIFICAR SEMPRE:
- Código Civil (Lei 10.406/2002)
- CDC (Lei 8.078/1990)
- CLT (Decreto-Lei 5.452/1943)
- LGPD (Lei 13.709/2018)
- Lei de Software (Lei 9.609/1998)
- Lei de PI (Lei 9.279/1996)
- Lei de Locação (Lei 8.245/1991)
- Lei de Terceirização (Lei 13.429/2017)
- Marco Civil da Internet (Lei 12.965/2014)
- Lei de Superendividamento (Lei 14.181/2021)
- Lei do Crédito Consignado (Lei 10.820/2003)
- Lei da CCB (Lei 10.931/2004)`;

      const geminiResponse = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { inline_data: { mime_type: mediaType, data: base64 } },
              { text: prompt }
            ]
          }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 16000,
            responseMimeType: 'application/json'
          }
        })
      });

      const geminiData = await geminiResponse.json();
      
      // Tenta extrair o texto da resposta em múltiplos formatos
      const candidate = geminiData?.candidates?.[0];
      const part = candidate?.content?.parts?.[0];
      
      let rawText = '';
      if (part?.text) {
        rawText = part.text;
      } else if (typeof part === 'string') {
        rawText = part;
      } else if (geminiData?.text) {
        rawText = geminiData.text;
      }

      // Remove markdown se houver
      const cleanText = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

      if (!cleanText) {
        throw new Error(`Gemini retornou resposta vazia. Status: ${geminiResponse.status}. Raw: ${JSON.stringify(geminiData).substring(0, 300)}`);
      }

      try {
        resultado = JSON.parse(cleanText);
      } catch(e) {
        resultado = { error: 'Erro ao processar resposta da IA.', raw: rawText.substring(0, 500) };
      }

    } catch (apiErr) {
      // 4. API falhou — reverte o incremento
      await supabase('PATCH', `tokens?token=eq.${encodeURIComponent(token)}`, {
        analises_usadas: registro.analises_usadas
      }).catch(() => {});

      return {
        statusCode: 500,
        headers: CORS,
        body: JSON.stringify({ error: 'Erro ao processar o contrato. Sua análise não foi descontada. Tente novamente.' })
      };
    }

    // 5. Salva no histórico
    await supabase('POST', 'historico', {
      token,
      cliente_nome: registro.nome,
      arquivo_nome: 'contrato.pdf',
      tipo_contrato: 'Análise via plataforma',
      plano: registro.plano
    }).catch(() => {});

    const novasRestantes = registro.analises_limite - (registro.analises_usadas + 1);

    return {
      statusCode: 200,
      headers: CORS,
      body: JSON.stringify({ ...resultado, analises_restantes: novasRestantes })
    };

  } catch (err) {
    return {
      statusCode: 500,
      headers: CORS,
      body: JSON.stringify({ error: err.message })
    };
  }
};

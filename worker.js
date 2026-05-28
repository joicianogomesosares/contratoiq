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

    const CORS = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' };
    const SUPABASE_URL = env.SUPABASE_URL;
    const SUPABASE_KEY = env.SUPABASE_KEY;

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
      const { base64, mediaType, token } = await request.json();

      if (!token) {
        return new Response(JSON.stringify({ error: 'Token não informado.' }), { status: 400, headers: CORS });
      }

      const tokens = await supabase('GET', `tokens?token=eq.${encodeURIComponent(token)}&select=*`);

      if (!tokens || tokens.length === 0) {
        return new Response(JSON.stringify({ error: 'Token inválido.' }), { status: 401, headers: CORS });
      }

      const registro = tokens[0];

      if (!registro.ativo) {
        return new Response(JSON.stringify({ error: 'Token inativo. Entre em contato com o suporte.' }), { status: 403, headers: CORS });
      }

      const restantes = registro.analises_limite - registro.analises_usadas;

      if (restantes <= 0) {
        return new Response(JSON.stringify({
          error: `Limite de análises atingido. Seu plano ${registro.plano} inclui ${registro.analises_limite} análises por mês. Entre em contato para fazer upgrade.`,
          analises_restantes: 0
        }), { status: 402, headers: CORS });
      }

      await supabase('PATCH', `tokens?token=eq.${encodeURIComponent(token)}`, {
        analises_usadas: registro.analises_usadas + 1
      });

      let resultado;

      try {
        const GEMINI_MODEL = 'gemini-2.5-pro';
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${env.GOOGLE_API_KEY}`;
        
        // Debug: testa se o endpoint está acessível
        const testResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${env.GOOGLE_API_KEY}`);
        if (!testResponse.ok) {
          const testErr = await testResponse.text();
          return new Response(JSON.stringify({ error: `Endpoint inacessível: ${testResponse.status} - ${testErr.substring(0, 200)}` }), { status: 500, headers: CORS });
        }

        const response = await fetch(geminiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            contents: [{
              parts: [
                {
                  inline_data: {
                    mime_type: mediaType,
                    data: base64
                  }
                },
                { text: `Você é um advogado sênior brasileiro com 25 anos de experiência em direito empresarial, contratual, trabalhista, tributário e digital. Sua especialidade é análise de risco contratual com fundamentação precisa na legislação brasileira vigente.

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
    "contratante": [
      {
        "descricao": "",
        "prazo": "",
        "penalidade_descumprimento": "",
        "risco": "baixo"
      }
    ],
    "contratada": [
      {
        "descricao": "",
        "prazo": "",
        "penalidade_descumprimento": "",
        "risco": "baixo"
      }
    ],
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
6. resumo_executivo: mínimo 3 parágrafos cobrindo (a) identificação e natureza, (b) principais riscos com referência às cláusulas, (c) posicionamento geral. Inclua obrigatoriamente um parágrafo comparando a taxa ou condições do contrato com a média de mercado para o mesmo tipo de instrumento, citando como referência o BACEN ou PROCON quando aplicável.
7. parecer_final: mínimo 6 parágrafos em linguagem de parecer jurídico formal e claro. Cada parágrafo deve ter no máximo 5 linhas. Evite frases excessivamente rebuscadas — o parecer deve ser compreensível para um advogado júnior ou para um cliente leigo inteligente. Cubra obrigatoriamente: (a) identificação das partes e objeto, (b) equilíbrio contratual, (c) riscos financeiros, (d) conformidade legal, (e) pontos críticos ausentes, (f) conclusão fundamentada.
8. clausulas: analise CADA cláusula individualmente. Nunca agrupe cláusulas.
9. artigos_violados: sempre citar artigo específico com número e lei. Exemplo: "Art. 51, IV, da Lei 8.078/1990 (CDC)".
10. jurisprudencia_relevante: citar súmulas do STJ/STF quando aplicável. Exemplo: "Súmula 539 do STJ".
11. nula_de_pleno_direito: distinguir de "abusiva" — nula dispensa declaração judicial, abusiva pode ser anulada.
12. sugestao_redacao nas clausulas_ausentes: fornecer texto jurídico sugerido para incluir no contrato.
13. checklist_antes_assinar: mínimo 10 itens. Cada item deve começar com um verbo no imperativo e ser uma ação concreta que o cliente pode tomar hoje. Linguagem direta e simples. Exemplo correto: "Verifique se a taxa está acima da média de mercado consultando o site do BACEN." Exemplo errado: "Realização de cotejo comparativo frente ao mercado nacional."
14. glossario_juridico: incluir todos os termos técnicos do contrato. Cada definição deve ter no máximo 2 frases em linguagem simples acessível a um leigo sem formação jurídica. Proibido usar jargão jurídico nas definições. Exemplo correto: "Mútuo: contrato em que uma parte empresta dinheiro à outra, que se compromete a devolver com juros. Neste contrato, é o empréstimo feito pelo banco ao trabalhador." Exemplo errado: "Caracterização pura dos termos de transferências bilaterais entre agentes financeiros."
15. recomendacoes_praticas: cada recomendação deve incluir uma ação concreta e específica que o cliente pode tomar hoje. Elimine linguagem abstrata. O campo texto_sugerido deve conter sempre uma redação alternativa prática ou um passo a passo objetivo.
16. analise_equilibrio_contratual: score_equilibrio de 0 a 100, onde 50 = equilíbrio perfeito entre as partes.
17. Se qualquer campo não se aplicar, retorne string vazia "" ou array vazio [], nunca null.
18. Responda EXCLUSIVAMENTE em português brasileiro formal e claro.
19. Nunca invente artigos de lei. Se não tiver certeza do número exato, cite apenas a lei sem o artigo.

LEGISLAÇÃO PARA VERIFICAR SEMPRE:
- Código Civil (Lei 10.406/2002) — contratos em geral
- CDC (Lei 8.078/1990) — se houver relação de consumo
- CLT (Decreto-Lei 5.452/1943) — se houver risco trabalhista
- LGPD (Lei 13.709/2018) — se houver tratamento de dados pessoais
- Lei de Software (Lei 9.609/1998) — se envolver tecnologia
- Lei de PI (Lei 9.279/1996) — se envolver propriedade intelectual
- Lei de Locação (Lei 8.245/1991) — se for locação
- Lei de Terceirização (Lei 13.429/2017) — se houver prestação de serviços
- Marco Civil da Internet (Lei 12.965/2014) — se envolver serviços digitais
- Lei de Superendividamento (Lei 14.181/2021) — se houver crédito ao consumidor
- Lei do Crédito Consignado (Lei 10.820/2003) — se houver desconto em folha
- Lei da CCB (Lei 10.931/2004) — se for cédula de crédito bancário` }
              ]
            }],
            generationConfig: {
              temperature: 0.1,
              maxOutputTokens: 16000,
              responseMimeType: 'application/json'
            }
          })
        });

        const geminiData = await response.json();
        
        // Extrai o texto da resposta do Gemini
        const rawText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        
        // Remove markdown se houver
        const cleanText = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        
        try {
          resultado = JSON.parse(cleanText);
        } catch(e) {
          resultado = { error: 'Erro ao processar resposta da IA.', raw: rawText.substring(0, 500) };
        }

      } catch (apiErr) {
        await supabase('PATCH', `tokens?token=eq.${encodeURIComponent(token)}`, {
          analises_usadas: registro.analises_usadas
        }).catch(() => {});

        return new Response(JSON.stringify({
          error: 'Erro ao processar o contrato. Sua análise não foi descontada. Tente novamente.',
        }), { status: 500, headers: CORS });
      }

      await supabase('POST', 'historico', {
        token,
        cliente_nome: registro.nome,
        arquivo_nome: 'contrato.pdf',
        tipo_contrato: 'Análise via plataforma',
        plano: registro.plano
      }).catch(() => {});

      const novasRestantes = registro.analises_limite - (registro.analises_usadas + 1);

      return new Response(JSON.stringify({
        ...resultado,
        analises_restantes: novasRestantes
      }), { headers: CORS });

    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: CORS
      });
    }
  }
};

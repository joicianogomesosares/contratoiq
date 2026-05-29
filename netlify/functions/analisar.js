const CORS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

const PROMPT = `Você é um advogado sênior brasileiro com 25 anos de experiência em direito empresarial, contratual, trabalhista, tributário e digital. Analise o contrato anexado com profundidade máxima e retorne APENAS um JSON válido, sem texto antes ou depois, sem markdown.

Retorne este JSON preenchido:
{
  "score": 0,
  "recomendacao": "NEGOCIAR",
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
  "partes": [{"nome":"","tipo":"pessoa_juridica","cnpj_cpf":"","endereco":"","representante_legal":"","cpf_representante":"","cargo_representante":"","tem_poderes_suficientes":true,"observacao_poderes":"","papel":"contratante","capacidade_juridica":""}],
  "clausulas": [{"numero":"","titulo":"","transcricao_resumida":"","analise_detalhada":"","risco":"baixo","abusiva":false,"nula_de_pleno_direito":false,"fundamento_legal":"","artigos_violados":[],"jurisprudencia_relevante":"","impacto_financeiro_estimado":"","recomendacao_especifica":""}],
  "legislacao_aplicavel": [{"lei":"","numero":"","artigos":[],"aplicacao_ao_contrato":"","risco_de_violacao":"baixo","consequencia_violacao":""}],
  "obrigacoes": {
    "contratante": [{"descricao":"","prazo":"","penalidade_descumprimento":"","risco":"baixo"}],
    "contratada": [{"descricao":"","prazo":"","penalidade_descumprimento":"","risco":"baixo"}],
    "mutuas": []
  },
  "prazos_criticos": [{"descricao":"","data_ou_prazo":"","tipo":"entrega","consequencia_perda":"","valor_multa_associada":"","risco":"baixo","alerta":""}],
  "riscos_financeiros": [{"descricao":"","tipo":"multa","valor_ou_percentual":"","condicao_acionamento":"","probabilidade":"media","risco":"medio","mitigacao_possivel":""}],
  "passivo_trabalhista": {"risco_vinculo_empregaticio":false,"fundamento":"","elementos_caracterizadores":[],"estimativa_passivo":"","recomendacao":""},
  "analise_lgpd": {"contrato_envolve_dados_pessoais":false,"tipo_dados_tratados":[],"papel_empresa":"controlador","tem_dpa":false,"base_legal_tratamento":"","riscos_lgpd":[],"recomendacoes_lgpd":[],"multa_potencial_anpd":""},
  "analise_propriedade_intelectual": {"ha_cessao_de_pi":false,"escopo_cessao":"","inclui_codigo_terceiros":false,"risco_licencas_opensource":false,"metodologias_protegidas":false,"recomendacao":""},
  "clausulas_abusivas": [{"clausula":"","descricao_abuso":"","fundamento_legal":"","artigo_especifico":"","efeito_juridico":"","e_nula_de_pleno_direito":false,"como_renegociar":""}],
  "clausulas_ausentes": [{"clausula":"","importancia":"critica","risco_ausencia":"","fundamento_legal":"","sugestao_redacao":""}],
  "analise_equilibrio_contratual": {"score_equilibrio":50,"parte_mais_favorecida":"","desequilibrios_identificados":[],"caracteriza_contrato_adesao":false,"protecoes_cdc_aplicaveis":false},
  "recomendacoes_praticas": [{"prioridade":"urgente","tipo":"NEGOCIAR","clausula_referencia":"","descricao":"","texto_sugerido":"","justificativa_legal":"","impacto_se_ignorado":""}],
  "checklist_antes_assinar": [{"item":"","status":"pendente","observacao":""}],
  "glossario_juridico": [{"termo":"","definicao":"","relevancia_para_este_contrato":""}]
}

REGRAS OBRIGATORIAS:
1. score: 0-100. 0=risco maximo, 100=perfeito.
2. recomendacao: apenas ASSINAR, NEGOCIAR ou RECUSAR.
3. risco: apenas alto, medio ou baixo.
4. prioridade: apenas urgente, importante ou recomendado.
5. tipo nas recomendacoes: NEGOCIAR, INCLUIR, REMOVER, ALTERAR ou ATENCAO.
6. resumo_executivo: minimo 3 paragrafos. Inclua comparativo com media de mercado citando BACEN quando aplicavel.
7. parecer_final: minimo 6 paragrafos curtos (max 5 linhas cada), linguagem clara.
8. clausulas: analise CADA clausula individualmente, nunca agrupe.
9. artigos_violados: cite artigo especifico com numero e lei.
10. jurisprudencia_relevante: cite sumulas STJ/STF quando aplicavel.
11. nula_de_pleno_direito: distinga de abusiva. Nula dispensa declaracao judicial.
12. checklist: minimo 10 itens, cada um comecando com verbo no imperativo.
13. glossario: definicao em linguagem simples, maximo 2 frases, sem jargao.
14. analise_equilibrio_contratual: score_equilibrio de 0 a 100, onde 50=equilibrio perfeito.
15. Nunca retorne null. Use string vazia ou array vazio.
16. Responda EXCLUSIVAMENTE em portugues brasileiro formal e claro.
17. Nunca invente artigos de lei.

LEGISLACAO PARA VERIFICAR:
- Codigo Civil (Lei 10.406/2002)
- CDC (Lei 8.078/1990)
- CLT (Decreto-Lei 5.452/1943)
- LGPD (Lei 13.709/2018)
- Lei de Software (Lei 9.609/1998)
- Lei de PI (Lei 9.279/1996)
- Lei de Locacao (Lei 8.245/1991)
- Lei de Terceirizacao (Lei 13.429/2017)
- Marco Civil da Internet (Lei 12.965/2014)
- Lei de Superendividamento (Lei 14.181/2021)
- Lei do Credito Consignado (Lei 10.820/2003)
- Lei da CCB (Lei 10.931/2004)`;

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
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: CORS, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: CORS, body: 'Method Not Allowed' };
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_KEY;
  const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

  try {
    const { base64, mediaType, token } = JSON.parse(event.body);

    if (!token) {
      return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Token não informado.' }) };
    }

    // 1. Valida token no Supabase
    const tokens = await supabaseReq(SUPABASE_URL, SUPABASE_KEY, 'GET', `tokens?token=eq.${encodeURIComponent(token)}&select=*`);

    if (!tokens || tokens.length === 0) {
      return { statusCode: 401, headers: CORS, body: JSON.stringify({ error: 'Token inválido.' }) };
    }

    const reg = tokens[0];

    if (!reg.ativo) {
      return { statusCode: 403, headers: CORS, body: JSON.stringify({ error: 'Token inativo. Contate o suporte.' }) };
    }

    const restantes = reg.analises_limite - reg.analises_usadas;
    if (restantes <= 0) {
      return { statusCode: 402, headers: CORS, body: JSON.stringify({ error: `Limite atingido. Seu plano ${reg.plano} inclui ${reg.analises_limite} análises/mês.`, analises_restantes: 0 }) };
    }

    // 2. Reserva análise (incrementa antes)
    await supabaseReq(SUPABASE_URL, SUPABASE_KEY, 'PATCH', `tokens?token=eq.${encodeURIComponent(token)}`, {
      analises_usadas: reg.analises_usadas + 1
    });

    let resultado;

    try {
      // 3. Chama Gemini
      const geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${GOOGLE_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [
                { inline_data: { mime_type: mediaType, data: base64 } },
                { text: PROMPT }
              ]
            }],
            generationConfig: {
              temperature: 0.1,
              maxOutputTokens: 16384
            }
          })
        }
      );

      const geminiData = await geminiRes.json();
      const rawText = (geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || '')
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      if (!rawText) {
        const reason = geminiData?.candidates?.[0]?.finishReason || 'UNKNOWN';
        throw new Error(`Gemini retornou vazio. FinishReason: ${reason}`);
      }

      resultado = JSON.parse(rawText);

    } catch (apiErr) {
      // Rollback: desfaz o incremento
      await supabaseReq(SUPABASE_URL, SUPABASE_KEY, 'PATCH', `tokens?token=eq.${encodeURIComponent(token)}`, {
        analises_usadas: reg.analises_usadas
      }).catch(() => {});

      return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: 'Erro na análise. Sua análise não foi descontada. Tente novamente. Detalhe: ' + apiErr.message }) };
    }

    // 4. Salva histórico
    await supabaseReq(SUPABASE_URL, SUPABASE_KEY, 'POST', 'historico', {
      token,
      cliente_nome: reg.nome,
      arquivo_nome: 'contrato.pdf',
      tipo_contrato: resultado?.identificacao?.tipo_contrato || 'Análise de Contrato',
      plano: reg.plano
    }).catch(() => {});

    return {
      statusCode: 200,
      headers: CORS,
      body: JSON.stringify({ ...resultado, analises_restantes: reg.analises_limite - (reg.analises_usadas + 1) })
    };

  } catch (err) {
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: err.message }) };
  }
};

export default {
  async fetch(request, env) {

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        }
      });
    }

    const CORS = {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    };

    // GET — testa conexão com Gemini
    if (request.method === 'GET') {
      try {
        const inicio = Date.now();
        const testRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${env.GOOGLE_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: 'Diga apenas: ola' }] }],
              generationConfig: { maxOutputTokens: 500, temperature: 0 }
            })
          }
        );
        const tempo = Date.now() - inicio;
        const data = await testRes.json();
        const texto = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        const finish = data?.candidates?.[0]?.finishReason || '';
        return new Response(JSON.stringify({
          ok: testRes.ok,
          status_gemini: testRes.status,
          tempo_ms: tempo,
          texto,
          finish,
          has_key: !!env.GOOGLE_API_KEY
        }), { headers: CORS });
      } catch(e) {
        return new Response(JSON.stringify({ ok: false, erro: e.message }), { status: 500, headers: CORS });
      }
    }

    if (request.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405 });
    }

    const CORS = {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    };

    const SUPABASE_URL = env.SUPABASE_URL;
    const SUPABASE_KEY = env.SUPABASE_KEY;
    const GOOGLE_API_KEY = env.GOOGLE_API_KEY;

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
      const text = await res.text();
      return text ? JSON.parse(text) : null;
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
        return new Response(JSON.stringify({ error: 'Token inativo.' }), { status: 403, headers: CORS });
      }

      if ((registro.analises_limite - registro.analises_usadas) <= 0) {
        return new Response(JSON.stringify({ error: 'Limite de análises atingido.', analises_restantes: 0 }), { status: 402, headers: CORS });
      }

      await supabase('PATCH', `tokens?token=eq.${encodeURIComponent(token)}`, {
        analises_usadas: registro.analises_usadas + 1
      });

      let resultado;

      try {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${GOOGLE_API_KEY}`;

        const geminiResponse = await fetch(geminiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [
                { inline_data: { mime_type: mediaType, data: base64 } },
                { text: `Você é um advogado sênior brasileiro com 25 anos de experiência. Analise o contrato e retorne APENAS um JSON válido sem markdown.

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
  "obrigacoes": {"contratante":[{"descricao":"","prazo":"","penalidade_descumprimento":"","risco":"baixo"}],"contratada":[{"descricao":"","prazo":"","penalidade_descumprimento":"","risco":"baixo"}],"mutuas":[]},
  "prazos_criticos": [{"descricao":"","data_ou_prazo":"","tipo":"entrega","consequencia_perda":"","valor_multa_associada":"","risco":"baixo","alerta":""}],
  "riscos_financeiros": [{"descricao":"","tipo":"multa","valor_ou_percentual":"","condicao_acionamento":"","probabilidade":"media","risco":"medio","mitigacao_possivel":""}],
  "passivo_trabalhista": {"risco_vinculo_empregaticio":false,"fundamento":"","elementos_caracterizadores":[],"estimativa_passivo":"","recomendacao":""},
  "analise_lgpd": {"contrato_envolve_dados_pessoais":false,"tipo_dados_tratados":[],"papel_empresa":"controlador","tem_dpa":false,"base_legal_tratamento":"","riscos_lgpd":[],"recomendacoes_lgpd":[],"multa_potencial_anpd":""},
  "analise_propriedade_intelectual": {"ha_cessao_de_pi":false,"escopo_cessao":"","inclui_codigo_terceiros":false,"risco_licencas_opensource":false,"metodologias_protegidas":false,"recomendacao":""},
  "clausulas_abusivas": [{"clausula":"","descricao_abuso":"","fundamento_legal":"","artigo_especifico":"","efeito_juridico":"","e_nula_de_pleno_direito":false,"como_renegociar":""}],
  "clausulas_ausentes": [{"clausula":"","importancia":"critica","risco_ausencia":"","fundamento_legal":"","sugestao_redacao":""}],
  "analise_equilibrio_contratual": {"score_equilibrio":0,"parte_mais_favorecida":"","desequilibrios_identificados":[],"caracteriza_contrato_adesao":false,"protecoes_cdc_aplicaveis":false},
  "recomendacoes_praticas": [{"prioridade":"urgente","tipo":"NEGOCIAR","clausula_referencia":"","descricao":"","texto_sugerido":"","justificativa_legal":"","impacto_se_ignorado":""}],
  "checklist_antes_assinar": [{"item":"","status":"pendente","observacao":""}],
  "glossario_juridico": [{"termo":"","definicao":"","relevancia_para_este_contrato":""}]
}

REGRAS: score 0-100, recomendacao apenas ASSINAR/NEGOCIAR/RECUSAR, risco apenas alto/medio/baixo, analise cada clausula individualmente, cite artigos especificos, use linguagem clara em portugues brasileiro, glossario com definicoes simples de no maximo 2 frases, checklist com verbos no imperativo, parecer_final minimo 6 paragrafos, resumo_executivo minimo 3 paragrafos com comparativo de mercado.` }
              ]
            }],
            generationConfig: {
              temperature: 0.1,
              maxOutputTokens: 16384
            }
          })
        });

        const geminiData = await geminiResponse.json();
        const part = geminiData?.candidates?.[0]?.content?.parts?.[0];
        const rawText = (part?.text || '').replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

        if (!rawText) {
          throw new Error(`Gemini sem resposta. Finish: ${geminiData?.candidates?.[0]?.finishReason}. Tokens: ${JSON.stringify(geminiData?.usageMetadata)}`);
        }

        resultado = JSON.parse(rawText);

      } catch (apiErr) {
        await supabase('PATCH', `tokens?token=eq.${encodeURIComponent(token)}`, {
          analises_usadas: registro.analises_usadas
        }).catch(() => {});

        return new Response(JSON.stringify({ error: 'Erro na análise: ' + apiErr.message }), { status: 500, headers: CORS });
      }

      await supabase('POST', 'historico', {
        token,
        cliente_nome: registro.nome,
        arquivo_nome: 'contrato.pdf',
        tipo_contrato: 'Análise via plataforma',
        plano: registro.plano
      }).catch(() => {});

      const novasRestantes = registro.analises_limite - (registro.analises_usadas + 1);

      return new Response(JSON.stringify({ ...resultado, analises_restantes: novasRestantes }), { headers: CORS });

    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: CORS });
    }
  }
};

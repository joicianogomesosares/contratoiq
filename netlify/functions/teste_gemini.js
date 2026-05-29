exports.handler = async (event) => {
  const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

  try {
    const inicio = Date.now();

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${GOOGLE_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'Responda apenas: {"ok":true,"modelo":"gemini-2.5-pro"}' }] }],
          generationConfig: { maxOutputTokens: 100, temperature: 0 }
        })
      }
    );

    const tempo = Date.now() - inicio;
    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const finish = data?.candidates?.[0]?.finishReason || '';

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        ok: true,
        tempo_ms: tempo,
        texto: text,
        finish_reason: finish,
        status_gemini: res.status
      })
    };

  } catch (err) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ ok: false, erro: err.message })
    };
  }
};

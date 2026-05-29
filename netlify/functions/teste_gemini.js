exports.handler = async (event) => {
  const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GOOGLE_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'Responda apenas: {"ok":true,"modelo":"gemini-2.5-flash"}' }] }],
          generationConfig: { maxOutputTokens: 50, temperature: 0 }
        })
      }
    );

    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ ok: true, texto: text, status: res.status, finish: data?.candidates?.[0]?.finishReason })
    };

  } catch (err) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ ok: false, erro: err.message })
    };
  }
};

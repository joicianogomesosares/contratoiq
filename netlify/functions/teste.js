exports.handler = async (event) => {
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify({
      ok: true,
      method: event.httpMethod,
      has_api_key: !!process.env.ANTHROPIC_API_KEY,
      api_key_prefix: process.env.ANTHROPIC_API_KEY ? process.env.ANTHROPIC_API_KEY.substring(0, 15) : 'NOT SET'
    })
  };
};

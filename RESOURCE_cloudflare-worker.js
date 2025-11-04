// Copy this code into your Cloudflare Worker script

// Cloudflare Worker (module syntax)
// Deploy this with Wrangler or the Cloudflare dashboard. Store your OpenAI key as the secret named OPENAI_API_KEY.

export default {
  async fetch(request, env) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Content-Type": "application/json",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    let body;
    try {
      body = await request.json();
    } catch (e) {
      return new Response(JSON.stringify({ error: "Invalid JSON" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    const apiKey = env.OPENAI_API_KEY;
    if (!apiKey) {
      return new Response(
        JSON.stringify({
          error: "OpenAI API key is not configured on the Worker.",
        }),
        { status: 500, headers: corsHeaders }
      );
    }

    // Build messages: enforce the system prompt server-side for security
    const SYSTEM_PROMPT = `You are a product and routine assistant focused EXCLUSIVELY on L'Oréal products and beauty topics. Only answer questions about L'Oréal product names/lines, how to use them, routine recommendations, ingredient information (non-medical), comparisons within L'Oréal ranges, or retail/availability for L'Oréal brands. If the user asks anything outside that scope, politely refuse and give one short suggestion to rephrase.`;

    const userMessage = body.message || "";
    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userMessage },
    ];

    const apiUrl = "https://api.openai.com/v1/chat/completions";
    const payload = {
      model: body.model || "gpt-4o",
      messages,
      max_tokens: body.max_tokens || 800,
      temperature:
        typeof body.temperature === "number" ? body.temperature : 0.7,
    };

    try {
      const r = await fetch(apiUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!r.ok) {
        const text = await r.text();
        return new Response(
          JSON.stringify({ error: `OpenAI error ${r.status}: ${text}` }),
          { status: 502, headers: corsHeaders }
        );
      }

      const data = await r.json();
      const assistant =
        data?.choices?.[0]?.message?.content ??
        data?.choices?.[0]?.text ??
        null;

      return new Response(JSON.stringify({ reply: assistant, raw: data }), {
        headers: corsHeaders,
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: corsHeaders,
      });
    }
  },
};

/* DOM elements */
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const chatWindow = document.getElementById("chatWindow");

// Set initial message
chatWindow.textContent = "👋 Hello! How can I help you today?";
/* System prompt: assistant must only answer questions related to L'Oréal products/routines/recommendations.
  Strict behavior: If the user asks anything outside of L'Oréal products, beauty routines, ingredients, skin/hair/makeup/fragrance recommendations, or related retail/usage questions,
  the assistant MUST politely refuse and provide a short, helpful example of how to rephrase the question so it fits the allowed scope. */
const SYSTEM_PROMPT = `You are a product and routine assistant focused EXCLUSIVELY on L'Oréal products and beauty topics. Only answer questions about L'Oréal product names/lines, how to use them, routine recommendations, ingredient information (non-medical), comparisons within L'Oréal ranges, or retail/availability for L'Oréal brands.

If the user asks anything outside that scope (for example: politics, personal medical diagnoses, non-beauty how-to, or requests for general programming/code that are unrelated to product recommendations), you MUST politely refuse. Use a short, courteous refusal followed by one sentence suggesting how to rephrase to fit the allowed scope.

Refusal example (use this style): "I'm sorry — I can only help with L'Oréal products, routines, and beauty recommendations. If you'd like, ask me about L'Oréal skincare for dry skin, makeup for a natural look, or product comparisons like 'Garnier vs L'Oréal' within our brand ranges."`;

/* helper: append message to chat window */
function appendMessage(role, text) {
  const div = document.createElement("div");
  div.className = "msg " + (role === "user" ? "user" : "ai");
  div.textContent = text;
  chatWindow.appendChild(div);
  // auto-scroll
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

/* small helper to show temporary status */
function showStatus(text) {
  let el = document.getElementById("_status_msg");
  if (!el) {
    el = document.createElement("div");
    el.id = "_status_msg";
    el.style.opacity = "0.8";
    el.style.fontStyle = "italic";
    el.className = "msg ai";
    chatWindow.appendChild(el);
  }
  el.textContent = text;
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

/* Handle form submit */
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const text = (userInput.value || "").trim();
  if (!text) return;

  // show user message
  appendMessage("user", text);
  userInput.value = "";

  // show thinking status
  showStatus("Thinking... ✨");

  // Prefer calling a Cloudflare Worker (recommended). If not set, fall back to client-side key for local testing.
  const workerUrl = window.OPENAI_WORKER_URL;
  const key = window.OPENAI_API_KEY;

  if (!workerUrl && !key) {
    const s = document.getElementById("_status_msg");
    if (s) s.remove();
    appendMessage(
      "ai",
      "No backend configured. For secure use, deploy the provided Cloudflare Worker and set `window.OPENAI_WORKER_URL` to its URL in `secrets.js` (or use a server proxy). For quick local tests you can add `window.OPENAI_API_KEY` to `secrets.js` (not for public sites)."
    );
    return;
  }

  try {
    let assistant = null;

    if (workerUrl) {
      // Call the Cloudflare Worker which holds the secret server-side
      const resp = await fetch(workerUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          model: "gpt-4o",
          max_tokens: 800,
          temperature: 0.7,
        }),
      });

      if (!resp.ok) {
        const errText = await resp.text();
        throw new Error(`Worker error ${resp.status}: ${errText}`);
      }

      const data = await resp.json();
      assistant =
        data?.reply ??
        data?.choices?.[0]?.message?.content ??
        data?.choices?.[0]?.text ??
        null;
    } else {
      // Local key fallback (quick testing only)
      const resp = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: text },
          ],
          max_tokens: 800,
          temperature: 0.7,
        }),
      });

      if (!resp.ok) {
        const errText = await resp.text();
        throw new Error(`API error ${resp.status}: ${errText}`);
      }

      const data = await resp.json();
      assistant =
        data?.choices?.[0]?.message?.content ??
        data?.choices?.[0]?.text ??
        null;
    }

    const s = document.getElementById("_status_msg");
    if (s) s.remove();

    appendMessage("ai", assistant ?? "(no response)");
  } catch (err) {
    const s = document.getElementById("_status_msg");
    if (s) s.remove();
    appendMessage(
      "ai",
      `Request failed: ${err.message}. Consider deploying the Cloudflare Worker or using a server-side proxy.`
    );
    console.error(err);
  }
});

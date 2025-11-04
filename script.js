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

  // Ensure an API key is available (local dev only). Prefer a server proxy in production.
  const key = window.OPENAI_API_KEY;
  if (!key) {
    // remove status
    const s = document.getElementById("_status_msg");
    if (s) s.remove();
    appendMessage(
      "ai",
      "No API key found. For local testing copy `secrets.example.js` to `secrets.js` and add your key, or use a server-side proxy."
    );
    return;
  }

  try {
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
    // OpenAI responses for chat completions put the assistant text at data.choices[0].message.content
    const assistant =
      data?.choices?.[0]?.message?.content ??
      data?.choices?.[0]?.text ??
      "(no response)";

    // remove status
    const s = document.getElementById("_status_msg");
    if (s) s.remove();

    appendMessage("ai", assistant);
  } catch (err) {
    const s = document.getElementById("_status_msg");
    if (s) s.remove();
    appendMessage(
      "ai",
      `Request failed: ${err.message}. Consider using a server-side proxy instead of a client key.`
    );
    console.error(err);
  }
});

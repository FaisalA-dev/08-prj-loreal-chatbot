# Deploying the Cloudflare Worker (hide your OpenAI key)

This project includes `RESOURCE_cloudflare-worker.js` as an example Worker that securely stores your OpenAI API key and proxies requests from the client to OpenAI.

Overview

- Deploy the Worker and set the secret `OPENAI_API_KEY` in the Worker environment.
- Configure the client to use the Worker by setting `window.OPENAI_WORKER_URL` in `secrets.js` (or directly in `index.html` for testing).

Quick steps (Wrangler, recommended)

1. Install Wrangler (Cloudflare CLI):

   ```bash
   npm install -g wrangler
   ```

2. Login to Cloudflare:

   ```bash
   wrangler login
   ```

3. Create a `wrangler.toml` or use the dashboard. A minimal `wrangler.toml`:

   ```toml
   name = "loreal-chatbot-proxy"
   main = "RESOURCE_cloudflare-worker.js"
   compatibility_date = "2025-11-04"
   type = "javascript"
   ```

4. Publish the Worker (first time will guide you through setup):

   ```bash
   wrangler publish
   ```

5. Set the OpenAI API key as a secret on your Worker:

   ```bash
   wrangler secret put OPENAI_API_KEY
   # then paste your key when prompted
   ```

6. After publish, copy the Worker URL (e.g. `https://loreal-chatbot-proxy.your-domain.workers.dev`) and set it for local testing in `secrets.js`:

   ```js
   // secrets.js (local only)
   window.OPENAI_WORKER_URL =
     "https://loreal-chatbot-proxy.your-domain.workers.dev";
   ```

7. Serve the project locally and the client will call the Worker to get assistant replies.

Security notes

- Do NOT store `OPENAI_API_KEY` in client-side files.
- Cloudflare Worker secrets are stored encrypted and are not visible to clients.
- Add authentication or rate limits to your Worker if deploying publicly to prevent abuse.

If you want, I can create a minimal `wrangler.toml` and help you publish the Worker from this repo (you'll still authenticate to Cloudflare locally).

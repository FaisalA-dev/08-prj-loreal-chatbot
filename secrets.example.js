/*
  secrets.example.js — template only. DO NOT commit real API keys to source control.

  Usage (local development):
  1. Copy this file to `secrets.js` in the project root.
     cp secrets.example.js secrets.js

  2. Edit `secrets.js` and replace the placeholder with your real key.
     // secrets.js (DO NOT COMMIT)
     window.OPENAI_API_KEY = 'sk-REPLACE-WITH-YOUR-KEY';

  3. The repository's `.gitignore` already includes `secrets.js`, so it will be ignored by git.

  SECURITY NOTE:
  - Never commit your OpenAI key to a public repo. Client-side keys can be stolen and abused.
  - Prefer a server-side proxy or Cloudflare Worker that keeps the key secret on the server and forwards requests from the client.
*/

// Placeholder for local development only — replace with your own key when used locally.
window.OPENAI_API_KEY = 'sk-REPLACE-WITH-YOUR-KEY';

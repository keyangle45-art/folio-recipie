# Folio Recipes

AI-powered recipe app built with React + Vite + Claude API.

## Local Development

```bash
npm install
cp .env.example .env
# Add your Anthropic API key to .env
npm run dev
```

## Deploy to Vercel

1. Push this folder to a GitHub repo
2. Go to https://vercel.com → New Project → Import your repo
3. In Vercel project settings → Environment Variables → add:
   - `VITE_ANTHROPIC_API_KEY` = your key from https://console.anthropic.com
4. Deploy — done.

## Get Your Anthropic API Key

1. Go to https://console.anthropic.com
2. Sign up / log in
3. API Keys → Create Key
4. Copy and paste into Vercel env vars

## Freemium Logic

- Free users: 3 searches/day (tracked in localStorage)
- Paywall modal shown on limit — wire up Paystack to the upgrade button
- Bookmarks saved locally to localStorage

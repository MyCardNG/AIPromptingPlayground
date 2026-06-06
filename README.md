# Prompt Engineering Playground

An interactive demo app for learning prompt engineering with real Claude API calls — side-by-side prompt comparisons, structured JSON extraction, and copy-paste API patterns.

## Setup

### 1. Get an API key

This project uses [OpenRouter](https://openrouter.ai) to call Claude models. OpenRouter gives you a single key to access Claude and many other models.

1. Go to [openrouter.ai](https://openrouter.ai) and create a free account
2. Navigate to **Keys** and generate a new API key

### 2. Add your key

Create a `.env.local` file in the project root (this file is git-ignored and will never be committed):

```
VITE_OPENROUTER_API_KEY=your-key-here
```

### 3. Install and run

```bash
nvm use 22       # requires Node 22+
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Tabs

| Tab | What it shows |
|-----|---------------|
| Prompt Patterns | Same task, bad vs engineered prompt — run both side by side |
| Structured Output | Paste any text, get back clean JSON (meeting notes, bug reports, leads) |
| API Patterns | 4 production patterns with live runnable examples |

## Notes

- API calls are proxied through Vite's dev server — your key is never exposed in the browser
- `.env.local` is covered by `.gitignore` (`*.local`) — do not rename it to `.env`

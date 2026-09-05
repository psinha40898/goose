# Iteration

A local product demo for generating an initial ad creative, applying deterministic mock performance data, and producing one performance-informed iteration.

## Setup

Requires Node.js 20.9 or newer.

```bash
npm install
cp .env.example .env
npm run dev
```

Add real API keys to `.env` before generating a campaign. The keys are read only by server routes.

## Demo flow

1. Enter company and campaign context in **New**.
2. The run moves to **Pending** while the LLM creates an image prompt and fal generates iteration 0.
3. Open the result in **Completed** and run the optimized iteration.
4. Iteration 1 uses fixed mock CTR, CVR, and CPA data. CTR is treated as the primary creative signal, CVR as a weaker secondary signal, and CPA as context only because media cost heavily influences it.
5. Use **Reset demo** to clear all runs.

SQLite state is stored locally in `data/demo.db`.

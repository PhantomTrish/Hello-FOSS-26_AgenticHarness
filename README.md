# CodingHarness

An Agentic Coding CLI built with React, Ink, and TypeScript.

## Tech Stack

- **CLI / TUI**: [Ink 7](https://github.com/vadimdemedes/ink) & [React 19](https://react.dev/)
- **Language**: TypeScript (ESM / NodeNext)
- **Runner**: `tsx`

---

## Setup

```bash
# 1. Clone the repository
git clone https://github.com/Mrp1Dev/CodingHarness.git
cd CodingHarness

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env
# Add your GEMINI_API_KEY to .env

# 4. Run the development CLI
npm run dev
```

### Environment Variables

Create a `.env` file in the root directory (or copy from `.env.example`):

```env
# Required (active provider)
GEMINI_API_KEY=your_gemini_api_key_here

# Optional (if switching provider in src/ai/client.ts)
OPENROUTER_API_KEY=your_openrouter_api_key_here
```

> **Note:** A Gemini API key can be obtained for free from [Google AI Studio](https://aistudio.google.com/).

---

## Project Structure

```text
src/
├── index.tsx          # CLI entry point (Ink renderer)
├── ai/                # LLM client & chat logic
├── tui/               # Terminal UI components (React/Ink)
└── types/             # Shared TypeScript types
```

---

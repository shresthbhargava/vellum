<p align="center">
  <img src="https://img.shields.io/badge/Built%20With-FastAPI%20%2B%20Next.js%20%2B%20Groq-000?style=for-the-badge&logo=fastapi&logoColor=white" alt="Tech Stack" />
  <img src="https://img.shields.io/badge/Status-Active%20Development-amber?style=for-the-badge" alt="Status" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="License" />
</p>

<h1 align="center">
  <span style="color: #f59e0b;">▌</span> Vellum
</h1>

<p align="center">
  <strong>AI-Powered Startup Intelligence Platform</strong><br/>
  Transform raw startup ideas into production-grade Business Requirements Documents<br/>
  in under 60 seconds — with competitive analysis, quality scoring, and actionable insights.
</p>

---

## Table of Contents

- [The Problem](#the-problem)
- [What is Vellum](#what-is-vellum)
- [How It Works](#how-it-works)
- [Architecture](#architecture)
- [Edge Technology](#edge-technology)
- [Vellum Score](#vellum-score)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [API Reference](#api-reference)
- [Deployment](#deployment)
- [Roadmap](#roadmap)
- [License](#license)

---

## The Problem

Every year, **millions of founders** start building products without a structured plan. The result is predictable:

- **80% of startups fail**, and the #1 reason is **no market need** — a problem a solid BRD catches on day one.
- Writing a Business Requirements Document takes **3-5 days** for an experienced product manager, and **most early-stage founders don't have one**.
- Existing tools are broken for this use case:
  - **Notion / Google Docs** — blank pages, no structure, no intelligence
  - **Jira / Azure DevOps** — built for engineering teams managing sprints, not founders defining vision
  - **ChatGPT / Claude** — generic outputs, no structured format, no competitive context, no quality scoring
  - **Traditional BRD tools** — enterprise-only, expensive, require trained PMs

**There is no tool that takes a raw idea and produces a structured, scored, competitive-aware BRD in seconds.** Vellum fills this gap.

---

## What is Vellum

**Vellum** is an AI-powered platform that transforms unstructured startup ideas into comprehensive Business Requirements Documents (BRDs) using a multi-agent pipeline. It doesn't just generate text — it **extracts, enriches, generates, reviews, and scores** your startup's requirements in a single streaming pipeline.

### Who is it for?

| Audience | Use Case |
|---|---|
| **Solo Founders** | Go from idea → structured plan in 60 seconds before writing a single line of code |
| **Early-Stage Startups** | Generate investor-ready documentation for pitch decks and grant applications |
| **Hackathon Teams** | Rapidly spec out your project so the team can start building immediately |
| **Incubators / Accelerators** | Standardize how portfolio companies document their product vision |
| **Product Managers** | Jumpstart the BRD process and get AI-powered quality feedback |
| **Venture Capitalists** | Evaluate the structure and completeness of a founder's product thinking |

### Niche

Vellum operates in the **AI-native product intelligence** space — specifically the intersection of:
- **AI-assisted product management** (generative AI for documentation)
- **Startup tooling** (founder-focused, not enterprise-focused)
- **Competitive intelligence** (automated market analysis)

This niche is **underserved**: most AI writing tools focus on marketing copy or code generation. No one is building **structured product intelligence** for founders.

---

## How It Works

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐     ┌──────────────┐     ┌──────────────┐
│             │     │              │     │             │     │              │     │              │
│  Raw Idea   │────▶│  Extraction  │────▶│  Enrichment │────▶│    BRD       │────▶│   Quality    │
│  (text/     │     │  Agent       │     │  Agent      │     │  Generation  │     │   Review     │
│   image/    │     │              │     │              │     │  Agent       │     │   Agent      │
│   PDF)      │     │  • Name      │     │  • Competi- │     │              │     │              │
│             │     │  • Domain    │     │    tors     │     │  • Exec      │     │  • Per-      │
│             │     │  • Users     │     │  • Market   │     │    Summary   │     │    section   │
│             │     │  • Features  │     │    analysis │     │  • Features  │     │    scores    │
│             │     │  • Problem   │     │  • Idea     │     │  • User      │     │  • Overall   │
│             │     │    statement │     │    validn.  │     │    Stories   │     │    verdict   │
│             │     │  • Conf.     │     │              │     │  • SWOT      │     │  • Feedback  │
│             │     │    score     │     │              │     │  • Risks     │     │              │
│             │     │              │     │              │     │  • Timeline  │     │              │
└─────────────┘     └──────────────┘     └─────────────┘     └──────────────┘     └──────────────┘
                                                                                         │
                                                                                         ▼
                                                                               ┌──────────────┐
                                                                               │              │
                                                                               │    Vellum    │
                                                                               │    Score     │
                                                                               │   (0 - 100)  │
                                                                               │              │
                                                                               └──────────────┘
```

**Step-by-step:**

1. **Input** — User submits a startup idea (text, image, or PDF). Multimodal support uses vision models to extract text from screenshots and documents.

2. **Extraction Agent** — Structured extraction of business name, domain, target users, key features, problem statement, and confidence score using fine-tuned LLM prompts.

3. **Enrichment Agent** — Competitive landscape analysis, market maturity assessment, and idea validation. Identifies direct/indirect competitors with threat levels and pricing intelligence.

4. **BRD Generation Agent** — Produces a full Business Requirements Document with 11+ sections: executive summary, problem statement, objectives, scope, stakeholders, functional/non-functional requirements, user stories, technical architecture, SWOT analysis, risks, timeline, and success metrics.

5. **Quality Review Agent** — Independent LLM call that evaluates the BRD against the original input. Scores each section on accuracy, specificity, and completeness. Provides actionable improvement suggestions.

6. **Vellum Score** — Composite 0-100 score calculated from extraction confidence, per-section critic scores, overall quality, content depth, and validation results.

The entire pipeline runs as **Server-Sent Events (SSE)** — the user sees real-time progress as each agent completes.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        NETLIFY (CDN + SSR)                         │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                    Next.js 14 (App Router)                    │  │
│  │                                                               │  │
│  │  ┌─────────┐  ┌──────────┐  ┌──────────┐  ┌───────────────┐  │  │
│  │  │ Landing │  │ Generate │  │ Results  │  │    History    │  │  │
│  │  │   Page  │  │   Page   │  │   Page   │  │    Page      │  │  │
│  │  └─────────┘  └────┬─────┘  └────┬─────┘  └──────┬────────┘  │  │
│  │                    │              │               │           │  │
│  │  ┌─────────────────┴──────────────┴───────────────┘           │  │
│  │  │              Supabase Auth (SSR)                          │  │
│  │  │         Google + GitHub OAuth                              │  │
│  │  └───────────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────┬───────────────────────────────────┘  │
│                              │ SSE / REST                          │
└──────────────────────────────┼──────────────────────────────────────┘
                               │
┌──────────────────────────────┼──────────────────────────────────────┐
│                        RENDER (Backend)                            │
│  ┌───────────────────────────┴───────────────────────────────────┐  │
│  │                    FastAPI (Python 3.11)                       │  │
│  │                                                               │  │
│  │  ┌────────────┐  ┌────────────┐  ┌─────────────────────────┐  │  │
│  │  │  Pipeline  │  │  Sessions  │  │  Standalone Agents      │  │  │
│  │  │  Router    │  │  Router    │  │  (Extraction, BRD,      │  │  │
│  │  │  (SSE)     │  │  (CRUD)    │  │   Critic, Competitive)  │  │  │
│  │  └─────┬──────┘  └─────┬──────┘  └───────────┬─────────────┘  │  │
│  │        │               │                      │               │  │
│  │  ┌─────┴───────────────┴──────────────────────┴───────────┐   │  │
│  │  │                  Groq LLM Client                       │   │  │
│  │  │         (Llama 3.3 70B + 8B with fallback)             │   │  │
│  │  └────────────────────────┬──────────────────────────────┘   │  │
│  └───────────────────────────┼───────────────────────────────────┘  │
│                              │                                     │
│  ┌───────────────────────────┴───────────────────────────────────┐  │
│  │                  Supabase PostgreSQL                          │  │
│  │         (Sessions, Traces, BRD Data, Scores)                 │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

### Key Design Decisions

| Decision | Rationale |
|---|---|
| **SSE over WebSocket** | Simpler to implement, works through CDNs/proxies, no persistent connection overhead. One-directional (server → client) is all we need. |
| **Groq over OpenAI** | 10-20x faster inference on open-source models (Llama 3.3 70B). Sub-second time-to-first-token. Dramatically reduces pipeline latency. |
| **Supabase Auth over Clerk** | Clerk blocks `.netlify.app` domains in production. Supabase supports any domain with configurable OAuth providers. |
| **JWT verification without signature check** | Supabase migrated to per-project JWT Signing Keys, making legacy secret verification incompatible. Since only our frontend calls our API, skipping signature verification is acceptable. |
| **JSON columns over normalized tables** | BRD data has 15+ nested fields. Normalizing would need 10+ tables and complex JOINs. JSON keeps reads simple: dump the whole dict, query later. |
| **In-memory cache + DB fallback** | Freshly generated sessions are cached in-memory for instant retrieval. Older sessions fall through to PostgreSQL. No stale cache issues. |

---

## Edge Technology

Vellum leverages several cutting-edge technologies and patterns:

### 1. Multi-Agent AI Pipeline
Each pipeline step is a **specialized agent** with its own system prompt, model selection, and output schema. This is fundamentally different from a single monolithic LLM call:
- **Extraction Agent** uses the 8B model (fast, structured output)
- **BRD Generation Agent** uses the 70B model (creative, long-form)
- **Quality Review Agent** uses the 70B model with low temperature (evaluative, precise)
- **Competitive Agent** uses the 70B model (analytical, domain-aware)

### 2. Server-Sent Events (SSE) Streaming
The entire pipeline streams progress to the frontend in real-time. Users see each agent activate, process, and complete — not a spinner for 30 seconds. Each SSE event includes structured data (feature counts, confidence scores, competitor counts).

### 3. LLM-as-Judge Pattern
The Quality Review Agent is a separate LLM call that **evaluates** the BRD independently. This "LLM-as-Judge" pattern is emerging in AI research (Zheng et al., 2023) and provides:
- Transparent, per-section quality scores
- Actionable feedback (not just a number)
- Detection of hallucinated content

### 4. Composite AI Scoring (Vellum Score)
A weighted multi-signal scoring algorithm that combines:
- Extraction confidence (input understanding)
- Per-section critic scores (granular quality)
- Overall critic verdict (holistic assessment)
- Content depth analysis (shallow vs. comprehensive)
- Idea validation (market viability)

### 5. Multimodal Input Processing
Users can submit ideas as text, images (screenshots, whiteboard photos), or PDFs. The vision model extracts text from images before the pipeline processes it — enabling non-text ideation workflows.

### 6. Groq LPU Inference Engine
Vellum runs on **Groq's LPU (Language Processing Unit)** chips, which provide:
- **~500 tokens/second** generation speed (vs. ~50 tokens/sec on traditional GPUs)
- Sub-200ms time-to-first-token
- This makes the full 5-agent pipeline complete in **under 60 seconds** end-to-end

---

## Vellum Score

The **Vellum Score** is a composite 0-100 metric that summarizes BRD quality at a glance. It's calculated from multiple signals with dynamic weight redistribution.

### Scoring Components

| Component | Weight | What It Measures | Range |
|---|---|---|---|
| **Per-Section Critic Scores** | 35% | Average quality across all BRD sections (accuracy, specificity, completeness) | 0-100 |
| **Overall Critic Score** | 30% | Holistic BRD quality assessment | 0-100 |
| **Content Depth** | 20% | Character count of key sections + feature count bonus | 0-100 |
| **Extraction Confidence** | 15% | How well the AI understood the input | 0-100 |
| **Idea Validation** | 20% | Market viability and feasibility (when available) | 0-100 |

### Dynamic Weight Redistribution
When validation data is unavailable (validation agent not loaded), its weight is redistributed proportionally to the other components, ensuring the score always reflects available information.

### Score Interpretation

| Range | Color | Meaning |
|---|---|---|
| **75-100** | 🟢 Green | Strong BRD — well-structured, specific, and comprehensive |
| **50-74** | 🟡 Yellow | Acceptable — usable but has gaps or vague sections |
| **0-49** | 🔴 Red | Weak — significant issues, needs major revision |

---

## Key Features

### Core
- **One-Click BRD Generation** — Submit an idea, get a full BRD in under 60 seconds
- **Multimodal Input** — Text, images (screenshots, whiteboards), and PDF documents
- **Real-Time Pipeline Progress** — Watch each AI agent work via SSE streaming
- **Vellum Score** — Instant quality assessment with composite scoring algorithm

### Intelligence
- **Competitive Analysis** — Automated competitor identification with threat levels, pricing, and SWOT
- **Competitive Benchmarks** — Side-by-side feature comparison cards
- **Market Intelligence** — Market maturity assessment and positioning analysis
- **SWOT Analysis** — Auto-generated strengths, weaknesses, opportunities, threats

### Quality
- **Per-Section Quality Scores** — Each BRD section rated on accuracy, specificity, and completeness
- **Actionable Feedback** — Specific improvement suggestions, not just scores
- **Key Strengths Detection** — Highlights what the BRD does well

### Export & Share
- **Word Document Export** — Formatted .docx with professional styling
- **PDF Export** — Print-ready PDF with Vellum branding
- **Investor Score** — Quick investor-readiness assessment

### Platform
- **OAuth Authentication** — Google and GitHub sign-in via Supabase
- **Session History** — Browse and revisit past BRD generations
- **User-Scoped Data** — Each user sees only their own sessions
- **Idea Validation** — Standalone idea validation with multi-dimensional scoring

---

## Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| **Next.js 14** (App Router) | React framework with SSR, routing, and API integration |
| **TypeScript** | Type safety across the entire frontend |
| **Tailwind CSS** | Utility-first styling with dark theme |
| **Supabase Auth (SSR)** | Cookie-based authentication with Google/GitHub OAuth |
| **Framer Motion** | Smooth animations and page transitions |
| **Lucide React** | Icon library |
| **docx.js** | Client-side Word document generation |
| **html2pdf.js** | Client-side PDF generation |

### Backend
| Technology | Purpose |
|---|---|
| **FastAPI** (Python 3.11) | Async API framework with automatic OpenAPI docs |
| **Groq API** | Llama 3.3 70B and 8B models via LPU inference |
| **SQLAlchemy** | ORM for Supabase PostgreSQL |
| **python-jose** | JWT token verification for Supabase auth |
| **Pydantic** | Request/response validation and structured outputs |
| **Server-Sent Events** | Real-time streaming pipeline progress |

### Infrastructure
| Technology | Purpose |
|---|---|
| **Render** | Backend hosting (Docker deployment) |
| **Netlify** | Frontend hosting (CDN + SSR) |
| **Supabase** | PostgreSQL database + Auth + JWT management |
| **Groq Cloud** | LLM inference (LPU chips) |

---

## Getting Started

### Prerequisites
- Node.js 18+
- Python 3.11+
- Groq API key ([groq.com](https://groq.com))
- Supabase project with Auth configured ([supabase.com](https://supabase.com))

### Environment Variables

**Frontend (`.env.local`):**
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_API_URL=https://your-api.onrender.com
```

**Backend (`.env`):**
```env
GROQ_API_KEY=gsk_your_key
DATABASE_URL=postgresql://user:pass@host:5432/db
SUPABASE_JWT_SECRET=your-jwt-secret
GROQ_PRIMARY_MODEL=llama-3.3-70b-versatile
GROQ_FALLBACK_MODEL=llama-3.3-70b-versatile
```

### Local Setup

```bash
# Backend
cd vellum-ai-service
pip install -r requirements.txt
uvicorn app.main:app --reload

# Frontend
cd vellum-frontend
npm install
npm run dev
```

---

## API Reference

### Pipeline
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/stream` | SSE streaming BRD generation (primary) |
| `POST` | `/api/generate` | Synchronous BRD generation (fallback) |
| `GET` | `/api/results/{session_id}` | Retrieve full session results |
| `GET` | `/api/sessions/{session_id}/agents` | Get session with agent traces |

### Sessions
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/sessions` | List user's sessions (recent 20) |
| `GET` | `/api/sessions/{session_id}` | Get session detail |

### Standalone Agents
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/extraction` | Extract business data from text |
| `POST` | `/api/brd/draft` | Generate BRD from extracted data |
| `POST` | `/api/brd/critic` | Review and score a BRD draft |
| `POST` | `/api/multimodal-extraction` | Extract data from text + images |

### Authentication
All endpoints require `Authorization: Bearer <supabase_jwt>` header.

---

## Deployment

### Backend (Render)
1. Connect GitHub repo to Render
2. Set environment variables
3. Deploy as Docker service (Dockerfile included)

### Frontend (Netlify)
1. Connect GitHub repo to Netlify
2. Set environment variables
3. Build command: `npm run build`
4. Publish directory: `.next`

---

## Roadmap

- [x] Multi-agent BRD generation pipeline
- [x] Real-time SSE streaming progress
- [x] Competitive intelligence and benchmarking
- [x] Vellum Score composite scoring
- [x] Word and PDF export
- [x] Supabase Auth (Google + GitHub)
- [ ] **BRD refinement** — Iterate on specific sections with AI feedback
- [ ] **Team collaboration** — Share BRDs, add comments, version history
- [ ] **Template library** — Industry-specific BRD templates (SaaS, fintech, healthtech)
- [ ] **Investor dashboard** — Portfolio-wide BRD quality tracking
- [ ] **API access** — Let other tools integrate with Vellum's pipeline
- [ ] **Custom model support** — Bring your own OpenAI, Anthropic, or local model

---

## License

MIT License — free for personal and commercial use.
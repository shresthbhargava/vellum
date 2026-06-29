<div align="center">

# Vellum

**AI-Powered Startup Intelligence Platform**

*Validate ideas. Generate BRDs. Download PDFs. Leave.*

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115.0-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Next.js-15-111111?logo=nextdotjs&logoColor=white)](https://nextjs.org)
[![Python](https://img.shields.io/badge/Python-3.12+-3776AB?logo=python&logoColor=white)](https://python.org)
[![Groq](https://img.shields.io/badge/Groq-LLaMA_3.3-F55036?logo=groq&logoColor=white)](https://groq.com)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

</div>

---

## The Philosophy

**Come. Search. Go.**

Vellum is a zero-friction startup intelligence tool. No accounts. No sessions. No dashboards. You type a startup idea, and Vellum returns a production-grade Business Requirements Document (BRD) with an AI-derived quality score — ready to download as a PDF.

Every decision in Vellum's architecture optimizes for **speed to insight**. A user should go from "I have an idea" to holding a professional BRD in under 90 seconds.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                          USER BROWSER                              │
│                   Next.js (Port 3000)                              │
│  ┌──────────┐  ┌──────────────┐  ┌──────────┐  ┌───────────────┐  │
│  │  Home /  │  │  Validate   │  │ Generate │  │   Results     │  │
│  │  Landing │  │  Idea Page  │  │   Page   │  │   + PDF DL    │  │
│  └────┬─────┘  └──────┬───────┘  └────┬─────┘  └───────┬───────┘  │
│       └────────────────┼────────────────┼────────────────┘          │
│                     REST API (fetch)                              │
└─────────────────────────┬───────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     FastAPI Backend (Port 8500)                    │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │                    Pipeline Orchestrator                    │    │
│  │  Extract → Generate BRD → Quality Review → Validate → Score │    │
│  └──────────┬──────────┬──────────────┬────────────┬───────────┘    │
│             │          │              │            │                  │
│  ┌──────────▼──┐ ┌─────▼──────┐ ┌────▼─────┐ ┌──▼─────────────┐   │
│  │ Extraction  │ │    BRD     │ │  Critic  │ │   Validation   │   │
│  │  Service    │ │  Generator │ │  Service │ │    Service     │   │
│  │ (8b-fast)   │ │ (70b-vers) │ │(70b-vers)│ │  (70b-vers)   │   │
│  └─────────────┘ └────────────┘ └──────────┘ └────────────────┘   │
│             │          │              │            │                  │
│             └──────────┴──────────────┴────────────┘                  │
│                               │                                     │
│                    ┌──────────▼──────────┐                          │
│                    │   SQLAlchemy ORM    │                          │
│                    │   SQLite (vellum.db)│                          │
│                    └─────────────────────┘                          │
│                               │                                     │
│                    ┌──────────▼──────────┐                          │
│                    │  PDF Export (ReportLab)                         │
│                    └─────────────────────┘                          │
└─────────────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        Groq Cloud (LLMs)                           │
│  llama-3.3-70b-versatile  │  llama-3.1-8b-instant                 │
│  (BRD / Validation / Critic)  (Extraction)                          │
└─────────────────────────────────────────────────────────────────────┘
```

### How It Works

1. **Input** — User enters a startup idea (text) or uploads a document/image (multimodal).
2. **Extraction** — `llama-3.1-8b-instant` rapidly extracts structured fields: problem, target market, industry, key features.
3. **BRD Generation** — `llama-3.3-70b-versatile` produces a full Business Requirements Document with 12+ sections.
4. **Quality Review (Critic)** — A second `llama-3.3-70b-versatile` pass independently scores the BRD across 8 quality dimensions.
5. **Idea Validation** — Scores the raw idea across 5 dimensions: market viability, technical feasibility, innovation, scalability, revenue potential.
6. **Vellum Score** — Composite metric: `0.4 × validation_score + 0.6 × critic_score`. Green (≥7.5), Amber (≥5.5), Red (<5.5).
7. **PDF Export** — ReportLab generates a production-ready A4 PDF in-memory — no external services.

All pipeline state is persisted to SQLite via SQLAlchemy. Restart the server; sessions survive.

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|----------|
| **Frontend** | Next.js 15, React 19, Tailwind CSS 4 | Server-side rendered UI with amber/zinc design system |
| **Backend** | FastAPI 0.115, Python 3.12+, Pydantic v2 | High-performance async API with strict type validation |
| **ORM / DB** | SQLAlchemy 2.0, SQLite | Zero-config persistence with JSON column support |
| **LLM** | Groq API (llama-3.3-70b, llama-3.1-8b) | Sub-2s inference for extraction; deep reasoning for BRD |
| **PDF** | ReportLab 4.2 | Server-side A4 PDF generation, pure Python, in-memory |
| **Language** | i18n (EN / HI) | Client-side language switching, prompt language injection |

---

## Features

### Current (v2.1.0)

- **One-Shot BRD Generation** — Full Business Requirements Document from a single idea description
- **Multimodal Input** — Paste text or upload images/documents for extraction
- **Idea Validation Engine** — 5-dimension scoring with radar chart visualization
- **Vellum Score** — Weighted composite metric combining idea quality + BRD quality
- **Instant PDF Export** — Professional A4 PDF with cover page, tables, SWOT, timeline, and risk matrix
- **Zero-Friction UX** — No sign-up, no sessions, no dashboard. Come, search, go.
- **Bilingual Support** — English and Hindi with client-side switching
- **Persistent Storage** — SQLite-backed sessions that survive server restarts

### Design System

- **Theme**: Warm amber accents on neutral zinc backgrounds — not dark mode, not generic blue
- **Components**: `card-3d`, `glass-card`, `btn-3d-secondary` for depth and visual hierarchy
- **Typography**: Inter / system sans-serif stack, clean and readable
- **Layout**: Responsive grid with col-span patterns for score cards and content sections

---

## Project Structure

```

vellum/
├── ai-service/                     # FastAPI backend
│   ├── app/
│   │   ├── main.py                 # App entrypoint, lifespan, router registration
│   │   ├── database.py             # SQLAlchemy engine, SessionLocal, init_db()
│   │   ├── models/
│   │   │   └── db_models.py        # BRDSession, IdeaValidation ORM models
│   │   ├── routers/
│   │   │   ├── pipeline.py         # Core orchestrator, Vellum Score, DB helpers
│   │   │   ├── extraction.py       # POST /api/extract
│   │   │   ├── brd.py              # POST /api/generate/brd
│   │   │   ├── critic.py           # POST /api/critic
│   │   │   ├── multimodal.py       # POST /api/multimodal/extract
│   │   │   ├── validation.py       # POST /api/validate
│   │   │   └── export.py           # GET /api/export/pdf/{session_id}
│   │   ├── services/
│   │   │   └── pdf_export.py       # ReportLab PDF generation
│   │   └── prompts/                # System prompts for each LLM call
│   ├── requirements.txt
│   └── .env                        # GROQ_API_KEY
│
├── frontend/                       # Next.js frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx            # Landing page
│   │   │   ├── layout.tsx          # Root layout, fonts, metadata
│   │   │   ├── generate/page.tsx   # BRD generation interface
│   │   │   ├── validate/page.tsx   # Idea validation with radar chart
│   │   │   └── results/[sessionId]/page.tsx  # Results + PDF download
│   │   ├── components/
│   │   │   └── VellumScore.tsx     # Score ring component (color-coded)
│   │   └── globals.css             # Tailwind + custom CSS classes
│   ├── package.json
│   ├── tailwind.config.ts
│   └── next.config.ts
│
├── .gitignore
└── README.md
```

---

## Getting Started

### Prerequisites

- Python 3.12+
- Node.js 20+
- [Groq API Key](https://console.groq.com)

### Setup

```bash
# Clone the repository
git clone https://github.com/shresthbhargava/vellum.git
cd vellum

# --- Backend ---
cd ai-service
pip install -r requirements.txt
cp .env.example .env
# Edit .env and add your GROQ_API_KEY

# Start the backend
uvicorn app.main:app --reload --port 8500

# --- Frontend (new terminal) ---
cd frontend
npm install
npm run dev

# Open http://localhost:3000
```

The backend runs on **port 8500**, the frontend on **port 3000**. The frontend proxies API calls to the backend.

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/generate` | Full pipeline: extract → BRD → critic → score |
| `POST` | `/api/extract` | Extract structured data from idea text |
| `POST` | `/api/generate/brd` | Generate BRD from extracted data |
| `POST` | `/api/critic` | Quality review of generated BRD |
| `POST` | `/api/validate` | Validate idea across 5 dimensions |
| `POST` | `/api/multimodal/extract` | Extract from uploaded images/documents |
| `GET`  | `/api/export/pdf/{session_id}` | Download BRD as PDF |
| `GET`  | `/api/pipeline/{session_id}` | Retrieve full session data |

---

## Vellum Score

The composite quality metric that powers Vellum's output assessment:

```
Vellum Score = 0.4 × Validation Score + 0.6 × BRD Quality Score
```

- **Validation Score (40%)** — How strong is the idea itself? Assessed across market viability, technical feasibility, innovation, scalability, and revenue potential.
- **BRD Quality Score (60%)** — How well did the AI capture and structure the idea? Assessed across completeness, clarity, technical depth, market analysis, feasibility, structure, actionability, and professionalism.

Fallback logic: if only one score is available, it serves as the Vellum Score directly.

| Range | Color | Interpretation |
|-------|-------|---------------|
| ≥ 7.5 | 🟢 Green | Strong idea, well-structured BRD |
| ≥ 5.5 | 🟡 Amber | Decent foundation, needs refinement |
| < 5.5 | 🔴 Red | Significant gaps — iterate on the idea |

---

## Roadmap

### Near-Term

- [ ] **Financial Feasibility Analyzer** — ML-based loan eligibility scoring integrated into the validation pipeline. Assesses funding readiness with financial projections and risk metrics.
- [ ] **RAG Citation Layer** — Ground BRD outputs in real web sources. Every claim in the BRD back-linked to a cited source for credibility.

### Mid-Term

- [ ] **Competitor Deep Dive** — Automated competitive landscape analysis with market positioning maps and feature comparison matrices.
- [ ] **BRD Versioning** — Allow users to iterate on ideas and generate versioned BRDs with diff comparisons.
- [ ] **Multi-Language Expansion** — Support for 10+ Indian languages beyond English and Hindi.

### Long-Term

- [ ] **Investor Matchmaking** — Match validated ideas with relevant investor profiles and funding programs.
- [ ] **Collaborative BRD** — Real-time multi-user editing of generated BRDs.
- [ ] **API Access** — Public API for developers to integrate Vellum's intelligence into their own tools.

---

## Design Decisions

### Why Groq over OpenAI?

Sub-2-second inference on `llama-3.1-8b` for extraction, and high-quality reasoning on `llama-3.3-70b` for BRD generation — at a fraction of the cost. The two-model strategy (fast extraction + deep generation) is only practical with Groq's speed.

### Why SQLite over PostgreSQL?

Vellum is a stateless, single-server tool. SQLite gives zero-config persistence, no container dependency, and seamless server restarts. When (if) Vellum needs horizontal scaling, the SQLAlchemy ORM makes the migration to PostgreSQL a config change.

### Why ReportLab over browser-side PDF?

Server-side generation guarantees consistent formatting, handles complex tables and layouts reliably, and produces files optimized for print — not screenshots of a web page.

### Why no auth?

Vellum's philosophy is **zero friction**. Every additional step (sign-up, email verification, dashboard onboarding) is a user that doesn't convert. The product earns trust through output quality, not account walls.

---

## License

MIT — see [LICENSE](LICENSE) for details.

---

<div align="center">

Built with focus by [Shresth Bhargava](https://github.com/shresthbhargava)

**Vellum** — Come. Search. Go.

</div>

# 🧠 InsightGen AI — Agentic AI Data Scientist

> An end-to-end, full-stack Agentic AI platform that transforms raw datasets (CSV, Excel, SQL) into natural language insights, dynamic interactive visualizations, anomaly detection, predictive analytics, and executive business reports.

---

## 🌟 Core Philosophy: Zero Hallucination Analytics
Standard generative LLMs cannot reliably perform complex mathematical calculations or statistical queries. **InsightGen AI** solves this via the **Agentic Planner & Deterministic Executor Pattern**:
1. **User asks question** in natural language.
2. **Gemini API** plans the analysis against verified schema metadata.
3. **Python (Pandas/NumPy) & SQL** execute the deterministic calculations.
4. **Validation & Evidence Layer** verifies computation boundaries and produces verifiable proof.
5. **Gemini API** synthesizes verified results into actionable business recommendations and Plotly charts.

---

## 📁 Project Architecture

```text
InsightGen-AI/
├── docs/
│   └── PROJECT_BLUEPRINT.md    # Master Architecture, HLD, LLD & Sequence Diagrams
├── sample_data/
│   └── sample_sales.csv        # 20-row verified test dataset
├── backend/
│   ├── app/
│   │   ├── api/routes/         # Route handlers (/health, /api/datasets, /api/analysis)
│   │   ├── core/               # Configuration & security settings
│   │   ├── schemas/            # Pydantic request/response schemas
│   │   ├── services/           # Ingestion, profiling, AI planning, execution
│   │   └── main.py             # FastAPI entrypoint
│   ├── tests/                  # Unit and integration tests
│   ├── requirements.txt        # Backend dependencies
│   └── .env                    # Local configuration
├── frontend/                   # Next.js 14+ / React / TypeScript / Tailwind
│   ├── src/app/                # App router and UI views
│   └── src/components/         # Upload, Profiler, Query Chat & Plotly components
├── AGENTS.md                   # AI Agent & Developer conventions
└── README.md
```

---

## 🚀 Quick Start (Windows 11)

### 1. Prerequisites
- **Python 3.10+** (Tested on Python 3.14 / 3.12)
- **Node.js v18+** (Tested on Node v24.18)
- **PowerShell**

### 2. Backend Setup
```powershell
# Navigate to backend
cd backend

# Create & activate virtual environment
python -m venv venv
.\venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Run FastAPI development server
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```
- Interactive Swagger UI: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- Health Check: [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health)

### 3. Frontend Setup
```powershell
# Navigate to frontend
cd frontend

# Install dependencies & start Next.js dev server
npm install
npm run dev
```
- Web Application: [http://localhost:3000](http://localhost:3000)

---

## 📅 Milestone Roadmap Progress
- [x] **Day 1: Project Foundation & Architecture**
  - [x] High-Level Design (HLD) & Low-Level Design (LLD) Blueprint
  - [x] Modular folder structure established
  - [x] FastAPI server with `/health` endpoint & Pydantic schemas
  - [x] Environment configuration & git-hygiene (`.gitignore`, `.env.example`)
  - [x] Automated test suite foundation (`pytest backend/tests/test_health.py`)
- [x] **Day 2: Dataset Upload & Profiling MVP**
  - [x] Multi-part CSV & Excel upload endpoint (`/api/datasets/upload`)
  - [x] File validation (extensions, MIME, size, encoding, path traversal defense)
  - [x] Pandas profiling service (row/column count, nulls, duplicates, descriptive stats, data types)
  - [x] Frontend preview table & data health summary card with bundled sample data loader
- [x] **Milestone A: Hardened Upload & Profiling Workflow**
  - [x] Executable magic byte inspection (blocks fake `.csv` with `MZ` or binary nulls)
  - [x] Excel (.xlsx) OpenXML archive validation and engine support
  - [x] Dataset deletion endpoint (`DELETE /api/datasets/{id}`) with physical file cleanup
  - [x] Deterministic rounding consistency (`round_val` with ROUND_HALF_UP)
- [x] **Milestone B: First Gemini-Powered Analysis Workflow**
  - [x] Natural language analytical query endpoint (`POST /api/analysis/query`)
  - [x] Schema-aware AI planning (`PlannerService` with Gemini SDK + semantic fallback)
  - [x] Plan and operation security validator (`ValidatorService`)
  - [x] Trusted deterministic computation engine (`ExecutorService` via Pandas)
  - [x] Zero-hallucination result synthesizer (`SynthesizerService`)
  - [x] Frontend conversational data scientist box with suggested queries, verified answer cards, evidence ribbons, and dynamic charts
  - [x] Full automated test suite passing 100% (`15/15 passed in pytest`)
- [ ] **Next Steps (Phase 4+): Advanced Analytics, Persistence & ML**
  - [ ] Multi-turn conversational context & chat history
  - [ ] PostgreSQL persistence for users and saved analyses
  - [ ] Scikit-learn anomaly detection & time-series forecasting
  - [ ] PDF business report generation service

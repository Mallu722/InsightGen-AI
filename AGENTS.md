# AGENTS.md — Agent & Developer Guidelines for InsightGen AI

## Project Overview
InsightGen AI is an Agentic AI Data Scientist platform designed to ingest CSV/Excel datasets, profile them, translate natural language queries into verified structured analysis plans, execute deterministic computations via Python/SQL, and present interactive charts and reports.

## Core Rules for All Agents & Engineers
1. **Deterministic Execution over Hallucination**:
   - Never let an LLM directly generate or guess calculated numbers or statistical figures.
   - LLMs (Google Gemini via `google-genai`) are used solely for:
     a) Generating structured analysis plans (intent classification, column selection, required operations).
     b) Explaining verified numerical results in natural language.
2. **Security & Sandboxing**:
   - Never expose API keys (`GEMINI_API_KEY`, DB passwords) in frontend code or client bundles.
   - Do NOT run arbitrary string `eval()` or unvetted `exec()`. Always validate operations through `QueryValidator`.
   - File uploads must validate extension, MIME type, and size limits before processing.
3. **Architecture Boundaries**:
   - Keep business logic inside `backend/app/services/` and data models in `backend/app/schemas/` and `backend/app/database/`.
   - API route handlers (`backend/app/api/routes/`) should only perform request validation, route handling, calling services, and returning standard HTTP responses.
4. **Documentation Integrity**:
   - Keep `docs/PROJECT_BLUEPRINT.md` up-to-date when architectural decisions evolve.
   - Preserve existing docstrings, type annotations, and error handling.
5. **Testing & Verification**:
   - Always verify that endpoints and scripts actually run without errors before marking a task as complete.

# smart-notice-broad

Smart AI-powered digital notice board: **FastAPI** + **Next.js** + **SQLite** + optional **Gemini**.

## Run locally

**Backend** (from `backend/`, creates `./data/noticeboard.db`):

```bash
pip install -r requirements.txt
set PYTHONPATH=.
# PowerShell: $env:PYTHONPATH="."
uvicorn app.main:app --reload --port 8000
```

**Frontend** (from `frontend/`):

```bash
npm install
npm run dev
```

Open [http://localhost:3000/display](http://localhost:3000/display).

**SSR note:** the display page loads data in a Server Component. It calls FastAPI directly at `http://127.0.0.1:8000` (see `frontend/lib/server-api-base.ts`). Copy `frontend/.env.example` to `frontend/.env.local` and set `API_URL` if your API is elsewhere.

Next rewrites `/api/*` → `:8000` only help **browser** requests, not RSC `fetch` on the server.

Copy `backend/.env.example` to `backend/.env` and set `GEMINI_API_KEY` for AI routes.

## Repo layout

- `backend/` — REST API, SQLite models, display bundle builder, Gemini draft-notice
- `frontend/` — Display grid (RSC) + admin stub; `lib/grid-engine.ts` for layout math

See the assistant message in your IDE for full architecture, API schema, and roadmap.

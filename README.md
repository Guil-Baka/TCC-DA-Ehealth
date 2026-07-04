# TCC-DA

Aplicação full stack para apoio ao cuidado de pessoas com Alzheimer.

## Estrutura

- `backend/`: API FastAPI + SQLAlchemy + PostgreSQL
- `frontend/`: aplicação React + Vite + Tailwind

## Configuração rápida

### 1. Backend

No diretório `backend/`:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
```

Inicie a API:

```powershell
uvicorn main:app --reload
```

### 2. Frontend

No diretório `frontend/`:

```powershell
npm install
Copy-Item .env.example .env
npm run dev
```

## Variáveis de ambiente

### Backend (`backend/.env`)

- `DATABASE_URL`
- `JWT_SECRET_KEY`
- `ACCESS_TOKEN_EXPIRE_MINUTES`
- `ENVIRONMENT`
- `DB_STARTUP_MAX_RETRIES`
- `DB_STARTUP_RETRY_DELAY_SECONDS`
- `DB_SSL`

### Frontend (`frontend/.env`)

- `VITE_API_BASE_URL`

## Documentação detalhada

- Backend: `backend/README.md`
- Frontend: `frontend/README.md`

# TCC-DA

Aplicação full stack para apoio ao cuidado de pessoas com Alzheimer.

## Mudanças recentes

- O frontend agora evita usar `127.0.0.1` como API quando está rodando em host público.
- O domínio público do frontend deve consumir a API em `https://apida.guilam.dev.br`.
- O backend passou a aceitar `https://appda.guilam.dev.br` no CORS.
- Isso corrige o bloqueio de navegador por Private Network Access ao tentar acessar loopback a partir de uma origem pública.

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

Para expor o backend na rede local durante desenvolvimento:

```powershell
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 2. Frontend

No diretório `frontend/`:

```powershell
npm install
Copy-Item .env.example .env
npm run dev
```

Para expor o frontend na rede local durante desenvolvimento:

```powershell
npm run dev -- --host 0.0.0.0 --port 9000
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

## Ambientes

### Desenvolvimento local

- Frontend: `http://localhost:9000` ou `http://127.0.0.1:9000`
- Backend: `http://127.0.0.1:8000`
- Valor recomendado em `frontend/.env`:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

### Produção

- Frontend público: `https://appda.guilam.dev.br`
- Backend público: `https://apida.guilam.dev.br`
- Valor esperado no ambiente de build do frontend:

```env
VITE_API_BASE_URL=https://apida.guilam.dev.br
```

Observação: não use `127.0.0.1` em produção. Navegadores bloqueiam esse cenário quando o frontend está em origem pública.

## Documentação detalhada

- Backend: `backend/README.md`
- Frontend: `frontend/README.md`

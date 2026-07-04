# Frontend - Plataforma de Cuidado em Alzheimer

Aplicação React + Vite + Tailwind para consumo da API FastAPI do projeto TCC.

## Recursos implementados

- Página inicial institucional com foco em educação e suporte ao cuidador.
- Autenticação JWT completa (cadastro, login e sessão com token Bearer).
- Logout automático quando o token expira (tratamento global de 401).
- Dashboard interativo com métricas e gráficos (Recharts).
- Relatório geral e relatório por paciente no dashboard.
- Gráficos por tipo de sintoma e ranking de sintomas com maior ocorrência.
- Exportação do dashboard para PDF com base no filtro atual.
- Módulo de pacientes (listar, criar, editar, excluir).
- Agenda assistiva de medicamentos (listar, criar, editar, excluir).
- Registro de sintomas (listar, criar, editar, excluir) com categorias e múltipla seleção.
- Ajustes de fuso horário na visualização local de data/hora de registros.
- Exibição anônima de identificadores em telas analíticas.

## Tecnologias

- React 19 + TypeScript
- Vite
- Tailwind CSS
- Axios
- React Router
- Recharts
- Lucide React

## Configuracao

1. Instale dependências:

```bash
npm install
```

2. Configure variáveis de ambiente:

```bash
cp .env.example .env
```

No Windows (PowerShell):

```powershell
Copy-Item .env.example .env
```

3. Ajuste o endpoint da API se necessário no arquivo `.env`:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

## Execucao

### Desenvolvimento

```bash
npm run dev
```

### Build de producao

```bash
npm run build
```

### Preview local do build

```bash
npm run preview
```

## Integracao com backend

A API deve estar em execução com o servidor FastAPI.

Configure no backend as variáveis necessárias (principalmente `DATABASE_URL` e `JWT_SECRET_KEY`).

```env
JWT_SECRET_KEY=troque-esta-chave-em-producao
ACCESS_TOKEN_EXPIRE_MINUTES=60
```

Exemplo de start do backend no diretório `backend`:

```bash
uvicorn main:app --reload
```

## Comportamentos importantes

- Sessão expirada: em respostas `401` com contexto autenticado, o frontend limpa sessão e redireciona para login.
- Paginação de listagens: pacientes, agenda e registros usam `limit=1000` no frontend para evitar truncamento pelo padrão da API.
- Exportação PDF: as bibliotecas de PDF são carregadas sob demanda para reduzir tamanho do bundle inicial.

## Rotas frontend

- `/` - Contexto do projeto e diretrizes de privacidade
- `/auth` - Login e cadastro de cuidador
- `/inicio` - Página inicial autenticada
- `/dashboard` - Métricas, gráficos e exportação PDF
- `/pacientes` - CRUD de pacientes
- `/agenda` - Agenda de medicamentos
- `/registros` - Registros de sintomas

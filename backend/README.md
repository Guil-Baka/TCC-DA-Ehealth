# API FastAPI E-Health

API FastAPI assíncrona para gerenciamento de cuidadores, pacientes, agenda de medicamentos e registro de sintomas.

## Mudancas recentes

- O backend passou a aceitar `https://appda.guilam.dev.br` na configuração de CORS.
- Isso é necessário para o frontend publicado consumir a API pública `https://apida.guilam.dev.br`.
- O problema corrigido era o uso indevido de `127.0.0.1` pelo frontend em ambiente público, bloqueado pelo navegador por Private Network Access.

## Requisitos

- Python 3.10+
- pip
- PostgreSQL

## Configuração do Ambiente

### 1. Criar e ativar o ambiente virtual no Windows PowerShell

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

Se a execução de scripts estiver bloqueada, rode:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\.venv\Scripts\Activate.ps1
```

### 2. Instalar as dependências

```powershell
pip install -r requirements.txt
```

Observação: o backend usa `python-dotenv`, então variáveis em `.env` são carregadas automaticamente ao iniciar a aplicação.

### 3. Configurar variáveis de ambiente

Por padrão, a aplicação usa a variável de ambiente `DATABASE_URL`. Se ela não estiver definida, será usado este valor:

```text
postgresql+asyncpg://API:Guilherme2*@127.0.0.1/FastAPI-Ehealth
```

Você pode sobrescrever isso no Windows PowerShell assim:

```powershell
$env:DATABASE_URL="postgresql+asyncpg://usuario:senha@localhost/nome_do_banco"
```

Você também pode criar um arquivo `.env` na pasta `backend/` com as variáveis:

```text
DATABASE_URL=postgresql+asyncpg://user:password@127.0.0.1/database_name
JWT_SECRET_KEY=change-this-in-production
ACCESS_TOKEN_EXPIRE_MINUTES=60
ENVIRONMENT=development
DB_STARTUP_MAX_RETRIES=5
DB_STARTUP_RETRY_DELAY_SECONDS=1.5
DB_SSL=false
```

### Variáveis disponíveis

- `DATABASE_URL`: string de conexão PostgreSQL usando driver `asyncpg`.
- `JWT_SECRET_KEY`: segredo para assinatura de tokens JWT.
- `ACCESS_TOKEN_EXPIRE_MINUTES`: tempo de expiração do token de acesso.
- `ENVIRONMENT`: use `development` ou `production`.
- `DB_STARTUP_MAX_RETRIES`: número de retentativas na conexão de startup.
- `DB_STARTUP_RETRY_DELAY_SECONDS`: atraso base entre retentativas.
- `DB_SSL`: habilita SSL de conexão com o banco (`true`/`false`).

## Executar a aplicação

```powershell
uvicorn main:app --reload
```

Ou, se quiser expor a aplicação na rede local:

```powershell
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

A aplicação ficará disponível em:

- http://127.0.0.1:8000

## CORS e ambientes

### Desenvolvimento local

Origens liberadas para desenvolvimento:

- `http://localhost:9000`
- `http://127.0.0.1:9000`

Use esse cenário quando o frontend estiver rodando localmente e `frontend/.env` apontar para `http://127.0.0.1:8000`.

### Producao

Origem pública liberada:

- `https://appda.guilam.dev.br`

Use esse cenário quando o frontend publicado consumir a API pública em `https://apida.guilam.dev.br`.

Observação: liberar CORS não resolve chamadas do frontend público para `127.0.0.1`. Esse fluxo é bloqueado pelo navegador antes da API responder.

## Resiliência de startup do banco

Na inicialização, a API tenta criar/validar tabelas. Para reduzir falhas transitórias de conexão, há retentativa automática configurável por:

- `DB_STARTUP_MAX_RETRIES`
- `DB_STARTUP_RETRY_DELAY_SECONDS`

## Logging da aplicação

A aplicação grava logs estruturados em console e também persiste eventos na tabela `logs_aplicacao`.

Cada registro pode armazenar:

- nível do evento (`INFO`, `ERROR`, etc.)
- tipo do evento (`request_completed`, `request_error`)
- método e caminho HTTP
- status code e duração da requisição
- ID do usuário autenticado, IP e user-agent
- detalhes extras em JSON serializado

Endpoint disponível para consulta autenticada:

- `GET /logs-aplicacao/`

Esse endpoint retorna os logs mais recentes do usuário autenticado e aceita paginação via `skip` e `limit`.

## Modelos de Banco de Dados

O arquivo `main.py` cria automaticamente as tabelas ao iniciar a aplicação.

### `usuarios`

- `id_usuario` - chave primária
- `nome`
- `email`
- `senha_hash`

### `paciente`

- `id_paciente` - chave primária
- `id_usuario` - chave estrangeira para `usuarios.id_usuario`
- `iniciais`
- `estagio_doenca`
- `idade`

### `agenda_medicamentos`

- `id_agenda` - chave primária
- `id_paciente` - chave estrangeira para `paciente.id_paciente`
- `medicamento`
- `dosagem`
- `horario`

### `registro_sintomas`

- `id_registro` - chave primária
- `id_paciente` - chave estrangeira para `paciente.id_paciente`
- `data_registro`
- `sintomas_cognitivos`
- `sintomas_comportamentais`
- `sintomas_motores`
- `nivel_humor`

### `artigos_alzheimer`

- `id_artigo` - chave primária
- `titulo`
- `link`

## Endpoints

### Saúde

- `GET /`
  - Retorna uma mensagem simples de boas-vindas.

- `GET /health`
  - Retorna o status da aplicação.

### Artigos sobre Alzheimer

- `GET /artigos-alzheimer/`
  - Lista artigos sobre Alzheimer.
  - Aceita filtro por título com `q`.
  - Aceita paginação com `skip` e `limit`.

### Cuidadores

- `POST /usuarios/`
  - Cria um novo cuidador (requer autenticação).

- `GET /usuarios/`
  - Lista cuidadores com paginação via `skip` e `limit`.

- `GET /usuarios/{user_id}`
  - Busca um cuidador pelo ID.

- `PUT /usuarios/{user_id}`
  - Atualiza os dados do cuidador.

- `DELETE /usuarios/{user_id}`
  - Remove um cuidador.

### Pacientes

- `POST /pacientes/`
  - Cria um paciente vinculado a um cuidador.

- `GET /pacientes/`
  - Lista pacientes com paginação via `skip` e `limit`.

- `GET /pacientes/{id_paciente}`
  - Busca um paciente pelo ID.

- `PUT /pacientes/{id_paciente}`
  - Atualiza os dados de um paciente.

- `DELETE /pacientes/{id_paciente}`
  - Remove um paciente.

### Agenda de Medicamentos

- `POST /agenda-medicamentos/`
  - Cria uma agenda de medicamentos para um paciente.

- `GET /agenda-medicamentos/`
  - Lista agendas com paginação via `skip` e `limit`.

- `GET /agenda-medicamentos/{id_agenda}`
  - Busca uma agenda pelo ID.

- `PUT /agenda-medicamentos/{id_agenda}`
  - Atualiza uma agenda de medicamentos.

- `DELETE /agenda-medicamentos/{id_agenda}`
  - Remove uma agenda de medicamentos.

### Registro de Sintomas

- `POST /registro-sintomas/`
  - Cria um novo registro de sintomas para um paciente.

- `GET /registro-sintomas/`
  - Lista registros com paginação via `skip` e `limit`.

- `GET /registro-sintomas/{id_registro}`
  - Busca um registro pelo ID.

- `PUT /registro-sintomas/{id_registro}`
  - Atualiza um registro de sintomas.

- `DELETE /registro-sintomas/{id_registro}`
  - Remove um registro de sintomas.

## Exemplos de Requisição

### Criar cuidador

```json
{
  "nome": "João Silva",
  "email": "joao@example.com",
  "password": "SenhaSegura123!"
}
```

### Criar paciente

```json
{
  "id_usuario": 1,
  "iniciais": "MS",
  "estagio_doenca": "Inicial",
  "idade": 68
}
```

### Criar agenda de medicamentos

```json
{
  "id_paciente": 1,
  "medicamento": "Donepezila",
  "dosagem": "5 mg",
  "horario": "08:00:00"
}
```

### Criar registro de sintomas

```json
{
  "id_paciente": 1,
  "data_registro": "2026-07-03T10:30:00Z",
  "sintomas_cognitivos": "Esquecimento recente",
  "sintomas_comportamentais": "Irritabilidade",
  "sintomas_motores": "Marcha lenta",
  "nivel_humor": "Estável"
}
```

## Documentação Interativa da API

- Swagger UI: http://127.0.0.1:8000/docs
- ReDoc: http://127.0.0.1:8000/redoc

## Estrutura do Projeto

```text
.
|-- main.py
|-- .env.example
|-- requirements.txt
`-- README.md
```

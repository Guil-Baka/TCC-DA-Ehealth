from fastapi import FastAPI, Depends, HTTPException, status
from fastapi import Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel, EmailStr, Field, field_validator, ConfigDict
from sqlalchemy.orm import DeclarativeBase, mapped_column, Mapped, relationship
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy import select, ForeignKey, DateTime, Time, Integer, String, Text, desc
from sqlalchemy.exc import SQLAlchemyError
import bcrypt  # Substitui passlib com bcrypt
import json
import logging
import re
import os
import asyncio
from pathlib import Path
from datetime import datetime, time, timedelta, timezone
from typing import Optional, AsyncGenerator
from contextlib import asynccontextmanager
from jose import JWTError, jwt
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s %(message)s",
)
logger = logging.getLogger("tcc_da.backend")

# --- Configuração do Banco de Dados ---

DEFAULT_DATABASE_URL = "postgresql+asyncpg://user:password@127.0.0.1/database_name"
DEFAULT_JWT_SECRET_KEY = "change-this-in-production"

DATABASE_URL = os.environ.get(
    "DATABASE_URL", DEFAULT_DATABASE_URL
)

JWT_SECRET_KEY = os.environ.get(
    "JWT_SECRET_KEY", DEFAULT_JWT_SECRET_KEY
)
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.environ.get("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))
ENVIRONMENT = os.environ.get("ENVIRONMENT", "development").lower()
DB_STARTUP_MAX_RETRIES = int(os.environ.get("DB_STARTUP_MAX_RETRIES", "5"))
DB_STARTUP_RETRY_DELAY_SECONDS = float(
    os.environ.get("DB_STARTUP_RETRY_DELAY_SECONDS", "1.5")
)
DB_SSL_ENABLED = os.environ.get("DB_SSL", "false").lower() in {
    "1",
    "true",
    "yes",
    "on",
}

if ENVIRONMENT in {"production", "prod"}:
    if JWT_SECRET_KEY == DEFAULT_JWT_SECRET_KEY:
        raise RuntimeError("Defina JWT_SECRET_KEY com um valor seguro em producao.")
    if DATABASE_URL == DEFAULT_DATABASE_URL:
        raise RuntimeError("Defina DATABASE_URL com credenciais reais em producao.")

# Criar engine
engine = create_async_engine(
    DATABASE_URL,
    echo=True,  # Definir como False em produção
    pool_size=5,
    max_overflow=10,
    pool_pre_ping=True,
    pool_recycle=1800,
    connect_args={
        "timeout": 10,
        "command_timeout": 60,
        "ssl": DB_SSL_ENABLED,
    },
)

# Criar factory de sessões assíncronas
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

# Classe base para modelos declarativos


class Base(DeclarativeBase):
    pass


PROMPT_INJECTION_PATTERN = re.compile(
    r"(<\s*script|javascript:|data:text/html|ignore\s+previous\s+instructions|"
    r"system\s+prompt|developer\s+message|assistant\s*:|```)",
    re.IGNORECASE,
)


def validate_safe_text(value: str, field_name: str) -> str:
    """Bloquear payloads com padrão de injeção ou script em campos textuais."""
    normalized = value.strip()
    if not normalized:
        return normalized

    if PROMPT_INJECTION_PATTERN.search(normalized):
        raise ValueError(
            f"O campo '{field_name}' contém conteúdo não permitido."
        )

    return normalized


def serialize_log_details(**details: object) -> str | None:
    cleaned = {key: value for key, value in details.items() if value is not None}
    if not cleaned:
        return None
    return json.dumps(cleaned, ensure_ascii=False, default=str)


async def persist_log(
    *,
    level: str,
    event_type: str,
    message: str,
    method: str | None = None,
    path: str | None = None,
    status_code: int | None = None,
    duration_ms: int | None = None,
    user_id: int | None = None,
    ip_address: str | None = None,
    user_agent: str | None = None,
    details: dict[str, object] | None = None,
) -> None:
    try:
        async with AsyncSessionLocal() as session:
            session.add(
                LogAplicacao(
                    level=level.upper(),
                    event_type=event_type,
                    message=message,
                    method=method,
                    path=path,
                    status_code=status_code,
                    duration_ms=duration_ms,
                    user_id=user_id,
                    ip_address=ip_address,
                    user_agent=user_agent[:255] if user_agent else None,
                    details=serialize_log_details(**(details or {})),
                )
            )
            await session.commit()
    except Exception as exc:  # pragma: no cover - fallback defensivo
        logger.exception("Falha ao persistir log estruturado: %s", exc)

# --- Modelos ---


class Usuario(Base):
    __tablename__ = "usuarios"

    id_usuario: Mapped[int] = mapped_column(primary_key=True, index=True)
    nome: Mapped[str] = mapped_column(nullable=False)
    email: Mapped[str] = mapped_column(unique=True, nullable=False, index=True)
    senha_hash: Mapped[str] = mapped_column(nullable=False)

    pacientes: Mapped[list["Paciente"]] = relationship(
        back_populates="usuario",
        cascade="all, delete-orphan",
    )


class Paciente(Base):
    __tablename__ = "paciente"

    id_paciente: Mapped[int] = mapped_column(primary_key=True, index=True)
    id_usuario: Mapped[int] = mapped_column(
        ForeignKey("usuarios.id_usuario"),
        nullable=False,
        index=True,
    )
    iniciais: Mapped[str] = mapped_column(nullable=False)
    estagio_doenca: Mapped[str] = mapped_column(nullable=False)
    idade: Mapped[int] = mapped_column(nullable=False)

    usuario: Mapped["Usuario"] = relationship(back_populates="pacientes")
    agendas_medicamentos: Mapped[list["AgendaMedicamentos"]] = relationship(
        back_populates="paciente",
        cascade="all, delete-orphan",
    )
    registros_sintomas: Mapped[list["RegistroSintomas"]] = relationship(
        back_populates="paciente",
        cascade="all, delete-orphan",
    )


class AgendaMedicamentos(Base):
    __tablename__ = "agenda_medicamentos"

    id_agenda: Mapped[int] = mapped_column(primary_key=True, index=True)
    id_paciente: Mapped[int] = mapped_column(
        ForeignKey("paciente.id_paciente"),
        nullable=False,
        index=True,
    )
    medicamento: Mapped[str] = mapped_column(nullable=False)
    dosagem: Mapped[str] = mapped_column(nullable=False)
    horario: Mapped[Time] = mapped_column(Time, nullable=False)

    paciente: Mapped["Paciente"] = relationship(
        back_populates="agendas_medicamentos")


class RegistroSintomas(Base):
    __tablename__ = "registro_sintomas"

    id_registro: Mapped[int] = mapped_column(primary_key=True, index=True)
    id_paciente: Mapped[int] = mapped_column(
        ForeignKey("paciente.id_paciente"),
        nullable=False,
        index=True,
    )
    data_registro: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=datetime.utcnow,
    )
    sintomas_cognitivos: Mapped[str] = mapped_column(nullable=False)
    sintomas_comportamentais: Mapped[str] = mapped_column(nullable=False)
    sintomas_motores: Mapped[str] = mapped_column(nullable=False)
    nivel_humor: Mapped[str] = mapped_column(nullable=False)

    paciente: Mapped["Paciente"] = relationship(
        back_populates="registros_sintomas")


class LogAplicacao(Base):
    __tablename__ = "logs_aplicacao"

    id_log: Mapped[int] = mapped_column(primary_key=True, index=True)
    criado_em: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        index=True,
    )
    level: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    event_type: Mapped[str] = mapped_column(String(60), nullable=False, index=True)
    message: Mapped[str] = mapped_column(String(255), nullable=False)
    method: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)
    path: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    status_code: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    duration_ms: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    user_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("usuarios.id_usuario"),
        nullable=True,
        index=True,
    )
    ip_address: Mapped[Optional[str]] = mapped_column(String(45), nullable=True)
    user_agent: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    details: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    usuario: Mapped[Optional["Usuario"]] = relationship()

# --- Hash de Senha com bcrypt ---


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verificar uma senha simples contra uma senha hash."""
    try:
        return bcrypt.checkpw(
            plain_password.encode('utf-8'),
            hashed_password.encode('utf-8')
        )
    except ValueError:
        return False


def get_password_hash(password: str) -> str:
    """Hash de uma senha usando bcrypt."""
    # bcrypt tem limite de 72 bytes, então truncamos se necessário
    password_bytes = password.encode('utf-8')
    if len(password_bytes) > 72:
        password_bytes = password_bytes[:72]

    # Gerar salt e hash da senha
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode('utf-8')


def create_access_token(subject: str, expires_delta: Optional[timedelta] = None) -> str:
    """Criar token JWT de acesso."""
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    payload = {
        "sub": subject,
        "exp": expire,
    }
    return jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)

# --- Dependência de Banco de Dados ---


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Obter uma sessão de banco de dados."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> Usuario:
    """Validar token JWT e retornar usuário autenticado."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Não foi possível validar as credenciais.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        user_email: Optional[str] = payload.get("sub")
        if user_email is None:
            raise credentials_exception
    except JWTError as exc:
        raise credentials_exception from exc

    result = await db.execute(select(Usuario).where(Usuario.email == user_email))
    user = result.scalar_one_or_none()
    if user is None:
        raise credentials_exception

    return user

# --- Esquemas Pydantic ---


class UsuarioCreate(BaseModel):
    """Esquema para criar um novo cuidador."""
    nome: str = Field(..., min_length=1, max_length=100)
    email: EmailStr = Field(..., description="Endereço de email válido")
    password: str = Field(..., min_length=8, max_length=72,
                          description="Senha deve ter entre 8 e 72 caracteres")

    @field_validator('password')
    @classmethod
    def validate_password_bytes(cls, v):
        """Garantir que a senha não excede 72 bytes (limite do bcrypt)."""
        if len(v.encode('utf-8')) > 72:
            raise ValueError('Senha deve ter 72 bytes ou menos')
        return v

    @field_validator('nome')
    @classmethod
    def validate_nome(cls, v):
        return validate_safe_text(v, 'nome')

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "nome_completo": "João Silva",
                "email": "joao@example.com",
                "password": "SenhaSegura123!"
            }
        }
    )


class UserUpdate(BaseModel):
    """Esquema para atualizar um cuidador (senha é opcional)."""
    nome: str = Field(..., min_length=1, max_length=100)
    email: EmailStr = Field(..., description="Endereço de email válido")
    password: Optional[str] = Field(None, min_length=8, max_length=72,
                                    description="Senha (opcional, se fornecida deve ter 8-72 caracteres)")

    @field_validator('password')
    @classmethod
    def validate_password_bytes(cls, v):
        """Garantir que a senha não excede 72 bytes (limite do bcrypt)."""
        if v and len(v.encode('utf-8')) > 72:
            raise ValueError('Senha deve ter 72 bytes ou menos')
        return v

    @field_validator('nome')
    @classmethod
    def validate_nome(cls, v):
        return validate_safe_text(v, 'nome')

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "nome_completo": "João Silva",
                "email": "joao@example.com",
                "password": "SenhaSegura123!"
            }
        }
    )


class UserResponse(BaseModel):
    """Esquema de resposta do cuidador."""
    id_usuario: int
    nome: str
    email: str

    model_config = ConfigDict(from_attributes=True)


class UserLogin(BaseModel):
    """Esquema para login de cuidador."""
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class PacienteCreate(BaseModel):
    id_usuario: int
    iniciais: str = Field(..., min_length=1, max_length=10)
    estagio_doenca: str = Field(..., min_length=1, max_length=100)
    idade: int = Field(..., ge=0, le=130)

    @field_validator('iniciais', 'estagio_doenca')
    @classmethod
    def validate_text_fields(cls, v, info):
        return validate_safe_text(v, info.field_name)


class PacienteUpdate(BaseModel):
    id_usuario: int
    iniciais: str = Field(..., min_length=1, max_length=10)
    estagio_doenca: str = Field(..., min_length=1, max_length=100)
    idade: int = Field(..., ge=0, le=130)

    @field_validator('iniciais', 'estagio_doenca')
    @classmethod
    def validate_text_fields(cls, v, info):
        return validate_safe_text(v, info.field_name)


class PacienteResponse(BaseModel):
    id_paciente: int
    id_usuario: int
    iniciais: str
    estagio_doenca: str
    idade: int

    model_config = ConfigDict(from_attributes=True)


class AgendaMedicamentosCreate(BaseModel):
    id_paciente: int
    medicamento: str = Field(..., min_length=1, max_length=200)
    dosagem: str = Field(..., min_length=1, max_length=100)
    horario: time

    @field_validator('medicamento', 'dosagem')
    @classmethod
    def validate_text_fields(cls, v, info):
        return validate_safe_text(v, info.field_name)


class AgendaMedicamentosUpdate(BaseModel):
    id_paciente: int
    medicamento: str = Field(..., min_length=1, max_length=200)
    dosagem: str = Field(..., min_length=1, max_length=100)
    horario: time

    @field_validator('medicamento', 'dosagem')
    @classmethod
    def validate_text_fields(cls, v, info):
        return validate_safe_text(v, info.field_name)


class AgendaMedicamentosResponse(BaseModel):
    id_agenda: int
    id_paciente: int
    medicamento: str
    dosagem: str
    horario: time

    model_config = ConfigDict(from_attributes=True)


class RegistroSintomasCreate(BaseModel):
    id_paciente: int
    data_registro: datetime = Field(default_factory=datetime.utcnow)
    sintomas_cognitivos: str = Field(default="")
    sintomas_comportamentais: str = Field(default="")
    sintomas_motores: str = Field(default="")
    nivel_humor: str = Field(..., min_length=1, max_length=100)

    @field_validator(
        'sintomas_cognitivos',
        'sintomas_comportamentais',
        'sintomas_motores',
        'nivel_humor',
    )
    @classmethod
    def validate_text_fields(cls, v, info):
        return validate_safe_text(v, info.field_name)


class RegistroSintomasUpdate(BaseModel):
    id_paciente: int
    data_registro: datetime
    sintomas_cognitivos: str = Field(default="")
    sintomas_comportamentais: str = Field(default="")
    sintomas_motores: str = Field(default="")
    nivel_humor: str = Field(..., min_length=1, max_length=100)

    @field_validator(
        'sintomas_cognitivos',
        'sintomas_comportamentais',
        'sintomas_motores',
        'nivel_humor',
    )
    @classmethod
    def validate_text_fields(cls, v, info):
        return validate_safe_text(v, info.field_name)


class RegistroSintomasResponse(BaseModel):
    id_registro: int
    id_paciente: int
    data_registro: datetime
    sintomas_cognitivos: str
    sintomas_comportamentais: str
    sintomas_motores: str
    nivel_humor: str

    model_config = ConfigDict(from_attributes=True)


class LogAplicacaoResponse(BaseModel):
    id_log: int
    criado_em: datetime
    level: str
    event_type: str
    message: str
    method: Optional[str] = None
    path: Optional[str] = None
    status_code: Optional[int] = None
    duration_ms: Optional[int] = None
    user_id: Optional[int] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    details: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

# --- Inicialização do Banco de Dados ---


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Gerenciar inicialização e limpeza do banco de dados durante o ciclo de vida da aplicação."""
    # Inicialização: Criar tabelas do banco de dados com retentativa para instabilidades transitórias.
    for attempt in range(1, DB_STARTUP_MAX_RETRIES + 1):
        try:
            async with engine.begin() as conn:
                await conn.run_sync(Base.metadata.create_all)
            break
        except Exception as exc:
            if attempt >= DB_STARTUP_MAX_RETRIES:
                raise RuntimeError(
                    "Falha ao conectar no banco de dados durante a inicialização. "
                    "Verifique se o PostgreSQL está ativo e se DATABASE_URL está correta. "
                    "Se estiver em ambiente local, tente DB_SSL=false."
                ) from exc

            wait_seconds = DB_STARTUP_RETRY_DELAY_SECONDS * attempt
            print(
                "[startup] Conexao com banco falhou "
                f"(tentativa {attempt}/{DB_STARTUP_MAX_RETRIES}). "
                f"Erro: {type(exc).__name__}: {exc}. "
                f"Nova tentativa em {wait_seconds:.1f}s..."
            )
            await asyncio.sleep(wait_seconds)

    try:
        yield
    finally:
        # Encerramento: Fechar conexões com o banco de dados
        await engine.dispose()


# --- Aplicação FastAPI ---


app = FastAPI(
    title="API FastAPI E-Health",
    description="API para gerenciar usuários em um sistema de e-health",
    version="1.0.0",
    lifespan=lifespan
)

# Adicionar Middleware de Host Confiável
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=[
        "localhost",
        "127.0.0.1",
        "guilam.dev.br",
        "www.guilam.dev.br",
        "apida.guilam.dev.br",
        "appda.guilam.dev.br",
    ],
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:9000",
        "http://127.0.0.1:9000",
        "http://appda.guilam.dev.br",
        "https://appda.guilam.dev.br",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def application_logging_middleware(request: Request, call_next):
    started_at = datetime.now(timezone.utc)
    status_code = 500
    user_id: int | None = None
    request_path = request.url.path
    request_method = request.method
    client_host = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")
    authorization = request.headers.get("authorization")

    if authorization and authorization.lower().startswith("bearer "):
        token = authorization.split(" ", 1)[1].strip()
        try:
            payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
            user_email = payload.get("sub")
            if user_email:
                async with AsyncSessionLocal() as session:
                    result = await session.execute(
                        select(Usuario.id_usuario).where(Usuario.email == user_email)
                    )
                    user_id = result.scalar_one_or_none()
        except JWTError:
            user_id = None

    try:
        response = await call_next(request)
        status_code = response.status_code
        return response
    except Exception as exc:
        duration_ms = int((datetime.now(timezone.utc) - started_at).total_seconds() * 1000)
        await persist_log(
            level="ERROR",
            event_type="request_error",
            message=f"Erro ao processar {request_method} {request_path}",
            method=request_method,
            path=request_path,
            status_code=status_code,
            duration_ms=duration_ms,
            user_id=user_id,
            ip_address=client_host,
            user_agent=user_agent,
            details={"exception": type(exc).__name__, "error": str(exc)},
        )
        raise
    finally:
        duration_ms = int((datetime.now(timezone.utc) - started_at).total_seconds() * 1000)
        await persist_log(
            level="INFO",
            event_type="request_completed",
            message=f"{request_method} {request_path} finalizado com status {status_code}",
            method=request_method,
            path=request_path,
            status_code=status_code,
            duration_ms=duration_ms,
            user_id=user_id,
            ip_address=client_host,
            user_agent=user_agent,
            details={
                "query_params": dict(request.query_params),
                "has_auth_header": bool(authorization),
            },
        )

# --- Endpoints de Verificação de Saúde ---


@app.get("/")
async def read_root() -> dict[str, str]:
    """Endpoint raiz."""
    return {"message": "Olá, FastAPI!"}


@app.get("/health")
async def health_check() -> dict[str, str]:
    """Endpoint de verificação de saúde."""
    return {"status": "ok"}


# --- Endpoints de Autenticação ---


@app.post(
    "/auth/register",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Cadastrar cuidador e gerar token JWT"
)
async def register_user(
    user_data: UsuarioCreate,
    db: AsyncSession = Depends(get_db),
) -> TokenResponse:
    result = await db.execute(
        select(Usuario).where(Usuario.email == user_data.email)
    )
    existing_user = result.scalar_one_or_none()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Usuário com este email já existe."
        )

    new_user = Usuario(
        nome=user_data.nome,
        email=user_data.email,
        senha_hash=get_password_hash(user_data.password),
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    access_token = create_access_token(new_user.email)
    return TokenResponse(access_token=access_token, user=new_user)


@app.post(
    "/auth/login",
    response_model=TokenResponse,
    summary="Autenticar cuidador e gerar token JWT"
)
async def login_user(
    credentials: UserLogin,
    db: AsyncSession = Depends(get_db),
) -> TokenResponse:
    result = await db.execute(
        select(Usuario).where(Usuario.email == credentials.email)
    )
    user = result.scalar_one_or_none()

    if not user or not verify_password(credentials.password, user.senha_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou senha inválidos.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(user.email)
    return TokenResponse(access_token=access_token, user=user)


@app.get(
    "/auth/me",
    response_model=UserResponse,
    summary="Obter usuário autenticado"
)
async def get_me(current_user: Usuario = Depends(get_current_user)) -> Usuario:
    return current_user


@app.get(
    "/logs-aplicacao/",
    response_model=list[LogAplicacaoResponse],
    summary="Listar logs da aplicação"
)
async def list_logs_aplicacao(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
) -> list[LogAplicacao]:
    result = await db.execute(
        select(LogAplicacao)
        .where(LogAplicacao.user_id == current_user.id_usuario)
        .order_by(LogAplicacao.criado_em.desc())
        .offset(skip)
        .limit(limit)
    )
    return result.scalars().all()

# --- Endpoints de Usuário ---


@app.post(
    "/usuarios/",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Criar um novo cuidador"
)
async def create_user(
    user_data: UsuarioCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
) -> Usuario:
    """
    Criar um novo usuário com as informações fornecidas.

    - **nome_completo**: Nome completo do usuário
    - **email**: Endereço de email único
    - **password**: Senha segura (8-72 caracteres)
    """
    # Verificar se usuário já existe
    result = await db.execute(
        select(Usuario).where(Usuario.email == user_data.email)
    )
    existing_user = result.scalar_one_or_none()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Usuário com este email já existe."
        )

    # Hash da senha e criar usuário
    hashed_password = get_password_hash(user_data.password)

    new_user = Usuario(
        nome=user_data.nome,
        email=user_data.email,
        senha_hash=hashed_password
    )

    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    return new_user


@app.get(
    "/usuarios/{user_id}",
    response_model=UserResponse,
    summary="Obter cuidador por ID"
)
async def get_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
) -> Usuario:
    """
    Recuperar um usuário pelo seu ID.
    """
    result = await db.execute(select(Usuario).where(Usuario.id_usuario == user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Usuário com ID {user_id} não encontrado."
        )

    if current_user.id_usuario != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Sem permissão para acessar este usuário.",
        )

    return user


@app.get(
    "/usuarios/",
    response_model=list[UserResponse],
    summary="Listar todos os cuidadores"
)
async def list_users(
    skip: int = 0,
    limit: int = 10,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
) -> list[Usuario]:
    """
    Recuperar uma lista de usuários com paginação.
    """
    result = await db.execute(
        select(Usuario)
        .where(Usuario.id_usuario == current_user.id_usuario)
        .offset(skip)
        .limit(limit)
    )
    users = result.scalars().all()
    return users


@app.put(
    "/usuarios/{user_id}",
    response_model=UserResponse,
    summary="Atualizar informações do cuidador"
)
async def update_user(
    user_id: int,
    user_data: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
) -> Usuario:
    """
    Atualizar as informações de um usuário.
    """
    # Obter usuário existente
    result = await db.execute(
        select(Usuario).where(Usuario.id_usuario == user_id)
    )
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Usuário com ID {user_id} não encontrado."
        )

    if current_user.id_usuario != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Sem permissão para atualizar este usuário.",
        )

    # Verificar conflitos de email
    if user.email != user_data.email:
        result = await db.execute(
            select(Usuario).where(Usuario.email == user_data.email)
        )
        existing_user = result.scalar_one_or_none()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email já está sendo usado por outro usuário."
            )

    # Atualizar dados do usuário
    user.nome = user_data.nome
    user.email = user_data.email

    # Atualizar senha apenas se fornecida
    if user_data.password is not None:
        user.senha_hash = get_password_hash(user_data.password)

    await db.commit()
    await db.refresh(user)

    return user


@app.delete(
    "/usuarios/{user_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Deletar um cuidador"
)
async def delete_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
) -> None:
    """
    Deletar um usuário pelo seu ID.
    """
    result = await db.execute(
        select(Usuario).where(Usuario.id_usuario == user_id)
    )
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Usuário com ID {user_id} não encontrado."
        )

    if current_user.id_usuario != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Sem permissão para deletar este usuário.",
        )

    await db.delete(user)
    await db.commit()
    return None


# --- Endpoints de Paciente ---


@app.post(
    "/pacientes/",
    response_model=PacienteResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Criar um novo paciente"
)
async def create_paciente(
    paciente_data: PacienteCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
) -> Paciente:
    if paciente_data.id_usuario != current_user.id_usuario:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Você só pode criar pacientes vinculados ao seu usuário.",
        )

    usuario_result = await db.execute(
        select(Usuario).where(Usuario.id_usuario == paciente_data.id_usuario)
    )
    usuario = usuario_result.scalar_one_or_none()
    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Usuário com ID {paciente_data.id_usuario} não encontrado."
        )

    new_paciente = Paciente(
        id_usuario=paciente_data.id_usuario,
        iniciais=paciente_data.iniciais,
        estagio_doenca=paciente_data.estagio_doenca,
        idade=paciente_data.idade,
    )

    db.add(new_paciente)
    await db.commit()
    await db.refresh(new_paciente)
    return new_paciente


@app.get(
    "/pacientes/{id_paciente}",
    response_model=PacienteResponse,
    summary="Obter paciente por ID"
)
async def get_paciente(
    id_paciente: int,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
) -> Paciente:
    result = await db.execute(
        select(Paciente).where(Paciente.id_paciente == id_paciente)
    )
    paciente = result.scalar_one_or_none()

    if not paciente:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Paciente com ID {id_paciente} não encontrado."
        )

    if paciente.id_usuario != current_user.id_usuario:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Sem permissão para acessar este paciente.",
        )

    return paciente


@app.get(
    "/pacientes/",
    response_model=list[PacienteResponse],
    summary="Listar pacientes"
)
async def list_pacientes(
    skip: int = 0,
    limit: int = 10,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
) -> list[Paciente]:
    result = await db.execute(
        select(Paciente)
        .where(Paciente.id_usuario == current_user.id_usuario)
        .order_by(Paciente.id_paciente.asc())
        .offset(skip)
        .limit(limit)
    )
    return result.scalars().all()


@app.put(
    "/pacientes/{id_paciente}",
    response_model=PacienteResponse,
    summary="Atualizar paciente"
)
async def update_paciente(
    id_paciente: int,
    paciente_data: PacienteUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
) -> Paciente:
    result = await db.execute(
        select(Paciente).where(Paciente.id_paciente == id_paciente)
    )
    paciente = result.scalar_one_or_none()

    if not paciente:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Paciente com ID {id_paciente} não encontrado."
        )

    if paciente.id_usuario != current_user.id_usuario:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Sem permissão para atualizar este paciente.",
        )

    if paciente_data.id_usuario != current_user.id_usuario:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Você só pode vincular pacientes ao seu próprio usuário.",
        )

    usuario_result = await db.execute(
        select(Usuario).where(Usuario.id_usuario == paciente_data.id_usuario)
    )
    usuario = usuario_result.scalar_one_or_none()
    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Usuário com ID {paciente_data.id_usuario} não encontrado."
        )

    paciente.id_usuario = paciente_data.id_usuario
    paciente.iniciais = paciente_data.iniciais
    paciente.estagio_doenca = paciente_data.estagio_doenca
    paciente.idade = paciente_data.idade

    await db.commit()
    await db.refresh(paciente)
    return paciente


@app.delete(
    "/pacientes/{id_paciente}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Deletar paciente"
)
async def delete_paciente(
    id_paciente: int,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
) -> None:
    result = await db.execute(
        select(Paciente).where(Paciente.id_paciente == id_paciente)
    )
    paciente = result.scalar_one_or_none()

    if not paciente:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Paciente com ID {id_paciente} não encontrado."
        )

    if paciente.id_usuario != current_user.id_usuario:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Sem permissão para deletar este paciente.",
        )

    await db.delete(paciente)
    await db.commit()


# --- Endpoints de Agenda de Medicamentos ---


@app.post(
    "/agenda-medicamentos/",
    response_model=AgendaMedicamentosResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Criar agenda de medicamentos"
)
async def create_agenda_medicamentos(
    agenda_data: AgendaMedicamentosCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
) -> AgendaMedicamentos:
    paciente_result = await db.execute(
        select(Paciente).where(Paciente.id_paciente == agenda_data.id_paciente)
    )
    paciente = paciente_result.scalar_one_or_none()
    if not paciente:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Paciente com ID {agenda_data.id_paciente} não encontrado."
        )

    if paciente.id_usuario != current_user.id_usuario:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Sem permissão para criar agenda para este paciente.",
        )

    new_agenda = AgendaMedicamentos(
        id_paciente=agenda_data.id_paciente,
        medicamento=agenda_data.medicamento,
        dosagem=agenda_data.dosagem,
        horario=agenda_data.horario,
    )

    db.add(new_agenda)
    await db.commit()
    await db.refresh(new_agenda)
    return new_agenda


@app.get(
    "/agenda-medicamentos/{id_agenda}",
    response_model=AgendaMedicamentosResponse,
    summary="Obter agenda por ID"
)
async def get_agenda_medicamentos(
    id_agenda: int,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
) -> AgendaMedicamentos:
    result = await db.execute(
        select(AgendaMedicamentos).where(
            AgendaMedicamentos.id_agenda == id_agenda)
    )
    agenda = result.scalar_one_or_none()

    if not agenda:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Agenda com ID {id_agenda} não encontrada."
        )

    paciente_result = await db.execute(
        select(Paciente).where(Paciente.id_paciente == agenda.id_paciente)
    )
    paciente = paciente_result.scalar_one_or_none()
    if not paciente or paciente.id_usuario != current_user.id_usuario:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Sem permissão para acessar esta agenda.",
        )

    return agenda


@app.get(
    "/agenda-medicamentos/",
    response_model=list[AgendaMedicamentosResponse],
    summary="Listar agendas de medicamentos"
)
async def list_agenda_medicamentos(
    skip: int = 0,
    limit: int = 10,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
) -> list[AgendaMedicamentos]:
    result = await db.execute(
        select(AgendaMedicamentos)
        .join(Paciente, AgendaMedicamentos.id_paciente == Paciente.id_paciente)
        .where(Paciente.id_usuario == current_user.id_usuario)
        .order_by(AgendaMedicamentos.horario.asc(), AgendaMedicamentos.id_agenda.asc())
        .offset(skip)
        .limit(limit)
    )
    return result.scalars().all()


@app.put(
    "/agenda-medicamentos/{id_agenda}",
    response_model=AgendaMedicamentosResponse,
    summary="Atualizar agenda de medicamentos"
)
async def update_agenda_medicamentos(
    id_agenda: int,
    agenda_data: AgendaMedicamentosUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
) -> AgendaMedicamentos:
    result = await db.execute(
        select(AgendaMedicamentos).where(
            AgendaMedicamentos.id_agenda == id_agenda)
    )
    agenda = result.scalar_one_or_none()

    if not agenda:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Agenda com ID {id_agenda} não encontrada."
        )

    agenda_owner_result = await db.execute(
        select(Paciente).where(Paciente.id_paciente == agenda.id_paciente)
    )
    agenda_owner = agenda_owner_result.scalar_one_or_none()
    if not agenda_owner or agenda_owner.id_usuario != current_user.id_usuario:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Sem permissão para atualizar esta agenda.",
        )

    paciente_result = await db.execute(
        select(Paciente).where(Paciente.id_paciente == agenda_data.id_paciente)
    )
    paciente = paciente_result.scalar_one_or_none()
    if not paciente:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Paciente com ID {agenda_data.id_paciente} não encontrado."
        )

    if paciente.id_usuario != current_user.id_usuario:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Sem permissão para vincular agenda a este paciente.",
        )

    agenda.id_paciente = agenda_data.id_paciente
    agenda.medicamento = agenda_data.medicamento
    agenda.dosagem = agenda_data.dosagem
    agenda.horario = agenda_data.horario

    await db.commit()
    await db.refresh(agenda)
    return agenda


@app.delete(
    "/agenda-medicamentos/{id_agenda}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Deletar agenda de medicamentos"
)
async def delete_agenda_medicamentos(
    id_agenda: int,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
) -> None:
    result = await db.execute(
        select(AgendaMedicamentos).where(
            AgendaMedicamentos.id_agenda == id_agenda)
    )
    agenda = result.scalar_one_or_none()

    if not agenda:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Agenda com ID {id_agenda} não encontrada."
        )

    paciente_result = await db.execute(
        select(Paciente).where(Paciente.id_paciente == agenda.id_paciente)
    )
    paciente = paciente_result.scalar_one_or_none()
    if not paciente or paciente.id_usuario != current_user.id_usuario:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Sem permissão para deletar esta agenda.",
        )

    await db.delete(agenda)
    await db.commit()


# --- Endpoints de Registro de Sintomas ---


@app.post(
    "/registro-sintomas/",
    response_model=RegistroSintomasResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Criar registro de sintomas"
)
async def create_registro_sintomas(
    registro_data: RegistroSintomasCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
) -> RegistroSintomas:
    paciente_result = await db.execute(
        select(Paciente).where(
            Paciente.id_paciente == registro_data.id_paciente)
    )
    paciente = paciente_result.scalar_one_or_none()
    if not paciente:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Paciente com ID {registro_data.id_paciente} não encontrado."
        )

    if paciente.id_usuario != current_user.id_usuario:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Sem permissão para criar registro para este paciente.",
        )

    new_registro = RegistroSintomas(
        id_paciente=registro_data.id_paciente,
        data_registro=registro_data.data_registro,
        sintomas_cognitivos=registro_data.sintomas_cognitivos,
        sintomas_comportamentais=registro_data.sintomas_comportamentais,
        sintomas_motores=registro_data.sintomas_motores,
        nivel_humor=registro_data.nivel_humor,
    )

    db.add(new_registro)
    await db.commit()
    await db.refresh(new_registro)
    return new_registro


@app.get(
    "/registro-sintomas/{id_registro}",
    response_model=RegistroSintomasResponse,
    summary="Obter registro de sintomas por ID"
)
async def get_registro_sintomas(
    id_registro: int,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
) -> RegistroSintomas:
    result = await db.execute(
        select(RegistroSintomas).where(
            RegistroSintomas.id_registro == id_registro)
    )
    registro = result.scalar_one_or_none()

    if not registro:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Registro com ID {id_registro} não encontrado."
        )

    paciente_result = await db.execute(
        select(Paciente).where(Paciente.id_paciente == registro.id_paciente)
    )
    paciente = paciente_result.scalar_one_or_none()
    if not paciente or paciente.id_usuario != current_user.id_usuario:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Sem permissão para acessar este registro.",
        )

    return registro


@app.get(
    "/registro-sintomas/",
    response_model=list[RegistroSintomasResponse],
    summary="Listar registros de sintomas"
)
async def list_registro_sintomas(
    skip: int = 0,
    limit: int = 10,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
) -> list[RegistroSintomas]:
    result = await db.execute(
        select(RegistroSintomas)
        .join(Paciente, RegistroSintomas.id_paciente == Paciente.id_paciente)
        .where(Paciente.id_usuario == current_user.id_usuario)
        .order_by(desc(RegistroSintomas.data_registro), desc(RegistroSintomas.id_registro))
        .offset(skip)
        .limit(limit)
    )
    return result.scalars().all()


@app.put(
    "/registro-sintomas/{id_registro}",
    response_model=RegistroSintomasResponse,
    summary="Atualizar registro de sintomas"
)
async def update_registro_sintomas(
    id_registro: int,
    registro_data: RegistroSintomasUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
) -> RegistroSintomas:
    result = await db.execute(
        select(RegistroSintomas).where(
            RegistroSintomas.id_registro == id_registro)
    )
    registro = result.scalar_one_or_none()

    if not registro:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Registro com ID {id_registro} não encontrado."
        )

    registro_owner_result = await db.execute(
        select(Paciente).where(Paciente.id_paciente == registro.id_paciente)
    )
    registro_owner = registro_owner_result.scalar_one_or_none()
    if not registro_owner or registro_owner.id_usuario != current_user.id_usuario:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Sem permissão para atualizar este registro.",
        )

    paciente_result = await db.execute(
        select(Paciente).where(
            Paciente.id_paciente == registro_data.id_paciente)
    )
    paciente = paciente_result.scalar_one_or_none()
    if not paciente:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Paciente com ID {registro_data.id_paciente} não encontrado."
        )

    if paciente.id_usuario != current_user.id_usuario:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Sem permissão para vincular registro a este paciente.",
        )

    registro.id_paciente = registro_data.id_paciente
    registro.data_registro = registro_data.data_registro
    registro.sintomas_cognitivos = registro_data.sintomas_cognitivos
    registro.sintomas_comportamentais = registro_data.sintomas_comportamentais
    registro.sintomas_motores = registro_data.sintomas_motores
    registro.nivel_humor = registro_data.nivel_humor

    await db.commit()
    await db.refresh(registro)
    return registro


@app.delete(
    "/registro-sintomas/{id_registro}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Deletar registro de sintomas"
)
async def delete_registro_sintomas(
    id_registro: int,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
) -> None:
    result = await db.execute(
        select(RegistroSintomas).where(
            RegistroSintomas.id_registro == id_registro)
    )
    registro = result.scalar_one_or_none()

    if not registro:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Registro com ID {id_registro} não encontrado."
        )

    paciente_result = await db.execute(
        select(Paciente).where(Paciente.id_paciente == registro.id_paciente)
    )
    paciente = paciente_result.scalar_one_or_none()
    if not paciente or paciente.id_usuario != current_user.id_usuario:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Sem permissão para deletar este registro.",
        )

    await db.delete(registro)
    await db.commit()

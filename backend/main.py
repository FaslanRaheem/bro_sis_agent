import sys
import asyncio

if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.endpoints import auth, leaves, ai_chat, complaints, documents, google_auth, users
from app.db.session import Base, engine
from app.core.config import settings

from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from app.ai.orchestrator import startup, shutdown
import secrets
from fastapi import Request,Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

limiter = Limiter(key_func=get_remote_address)

Base.metadata.create_all(bind=engine)

@asynccontextmanager
async def lifespan(fastapi_app: FastAPI):
    """
    FastAPI lifespan context manager.
    Code before `yield` runs at startup; code after runs at shutdown.
    """
    await startup()          # opens PG pool + runs checkpointer migrations
    print("[App] ApexHR API ready.")
    yield                    # application runs here
    await shutdown()         # drains PG pool gracefully
    print("[App] ApexHR API shut down.")

app = FastAPI(
    title="HR AI System Backend",
    version="1.0.0",
    lifespan=lifespan,
)

app.state.limiter = limiter



def rate_limit_handler(request: Request, exc: Exception) -> Response:
    return _rate_limit_exceeded_handler(request, exc) # type: ignore

app.add_exception_handler(RateLimitExceeded, rate_limit_handler)

origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://10.1.104.24:3000"
]
frontend_url = getattr(settings, "FRONTEND_URL", "http://localhost:3000")
if frontend_url and frontend_url not in origins:
    origins.append(frontend_url)

app.add_middleware(
    CORSMiddleware, # type: ignore
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-CSRF-Token"]
)

# Include routers
app.include_router(auth.router)
app.include_router(leaves.router)
app.include_router(ai_chat.router)
app.include_router(complaints.router)
app.include_router(documents.router)
app.include_router(google_auth.router)
app.include_router(users.router)
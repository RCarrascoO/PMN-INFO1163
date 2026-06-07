from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.db.database import init_db
from app.api import auth, packages

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield

app = FastAPI(
    title="PMN UCT API",
    description="Sistema de Paquetería Interna - Universidad Católica de Temuco",
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000", "http://127.0.0.1:3000",
        "http://localhost:3001", "http://127.0.0.1:3001",
        "http://localhost:3002", "http://127.0.0.1:3002",
        "http://lsanehost.zapto.org:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(packages.router)

@app.get("/")
def read_root():
    return {
        "sistema": "Paquetería Interna UCT",
        "version": "2.0.0",
        "estado": "operativo",
        "endpoints": {
            "auth": "/api/auth/login",
            "paquetes": "/api/packages",
            "docs": "/docs",
        }
    }

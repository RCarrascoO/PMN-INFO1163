from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="PMN API", version="1.0.0")

# Configurar orígenes permitidos
origins = [
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Bienvenido a la API del proyecto PMN con Arquitectura Limpia."}

# Aquí incluiremos nuestros enrutadores, por ejemplo:
# from app.api.v1.endpoints import user
# app.include_router(user.router, prefix="/api/v1/users", tags=["users"])

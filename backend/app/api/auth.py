import hashlib
from sqlite3 import Connection
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from app.api.deps import get_db
from app.core.auth import create_access_token

router = APIRouter(prefix="/api/auth", tags=["auth"])

class LoginRequest(BaseModel):
    username: str
    password: str

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

@router.post("/login")
def login(body: LoginRequest, db: Connection = Depends(get_db)):
    row = db.execute(
        "SELECT * FROM users WHERE username = ?", (body.username,)
    ).fetchone()
    
    if not row:
        raise HTTPException(status_code=401, detail="Usuario o contraseña incorrectos")
    
    if row["hashed_password"] != hash_password(body.password):
        raise HTTPException(status_code=401, detail="Usuario o contraseña incorrectos")
    
    token = create_access_token({"sub": str(row["id"]), "rol": row["rol"]})
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": row["id"],
            "username": row["username"],
            "nombre": row["nombre"],
            "rol": row["rol"],
        }
    }

@router.get("/me")
def get_me(db: Connection = Depends(get_db)):
    """Lista todos los usuarios disponibles para demo (sin contraseñas)"""
    rows = db.execute("SELECT id, username, nombre, rol FROM users").fetchall()
    return [dict(r) for r in rows]

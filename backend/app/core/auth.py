import hashlib
import json
import base64
import hmac
import time
from sqlite3 import Connection
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.api.deps import get_db

SECRET_KEY = "pmn-uct-secret-2026-informatica"
ALGORITHM = "HS256"

security = HTTPBearer()

def _b64(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()

def create_access_token(data: dict, expires_hours: int = 24) -> str:
    header = _b64(json.dumps({"alg": "HS256", "typ": "JWT"}).encode())
    payload = {**data, "exp": int(time.time()) + expires_hours * 3600}
    body = _b64(json.dumps(payload).encode())
    sig = _b64(
        hmac.new(SECRET_KEY.encode(), f"{header}.{body}".encode(), hashlib.sha256).digest()
    )
    return f"{header}.{body}.{sig}"

def verify_token(token: str) -> dict:
    try:
        parts = token.split(".")
        if len(parts) != 3:
            raise ValueError("Invalid token format")
        header, body, sig = parts
        expected_sig = _b64(
            hmac.new(SECRET_KEY.encode(), f"{header}.{body}".encode(), hashlib.sha256).digest()
        )
        if sig != expected_sig:
            raise ValueError("Invalid signature")
        padding = 4 - len(body) % 4
        payload = json.loads(base64.urlsafe_b64decode(body + "=" * padding))
        if payload.get("exp", 0) < time.time():
            raise ValueError("Token expired")
        return payload
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token inválido: {str(e)}",
        )

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Connection = Depends(get_db),
):
    payload = verify_token(credentials.credentials)
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Token sin usuario")
    row = db.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    if not row:
        raise HTTPException(status_code=401, detail="Usuario no encontrado")
    return dict(row)

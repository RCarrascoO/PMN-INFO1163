import sqlite3
import hashlib
import os
import random
import string
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "data", "pmn.db")

def get_db_path():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    return DB_PATH

def get_connection():
    conn = sqlite3.connect(get_db_path(), check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def init_db():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.executescript("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            nombre TEXT NOT NULL,
            rol TEXT NOT NULL,
            hashed_password TEXT NOT NULL,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS packages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            titulo TEXT NOT NULL,
            descripcion TEXT NOT NULL,
            origen TEXT NOT NULL,
            destino TEXT NOT NULL,
            estado TEXT NOT NULL DEFAULT 'BORRADOR',
            remitente_id INTEGER NOT NULL,
            agente_id INTEGER,
            destinatario_id INTEGER,
            otp_code TEXT,
            otp_used INTEGER DEFAULT 0,
            proxy_nombre TEXT,
            proxy_id TEXT,
            notas TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (remitente_id) REFERENCES users(id),
            FOREIGN KEY (agente_id) REFERENCES users(id),
            FOREIGN KEY (destinatario_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            package_id INTEGER NOT NULL,
            actor_id INTEGER NOT NULL,
            actor_nombre TEXT NOT NULL,
            estado_anterior TEXT NOT NULL,
            estado_nuevo TEXT NOT NULL,
            notas TEXT,
            timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (package_id) REFERENCES packages(id),
            FOREIGN KEY (actor_id) REFERENCES users(id)
        );
    """)

    # Seed usuarios
    users = [
        ("informatica", "Depto. Informática UCT", "REMITENTE", hash_password("uct2026")),
        ("juan", "Juan Estafeta", "AGENTE", hash_password("estafeta123")),
        ("profesor", "Prof. Jefe Lab Redes", "DESTINATARIO", hash_password("lab_redes")),
        ("supervisor", "Supervisor de Bodega", "SUPERVISOR", hash_password("bodega_uct")),
    ]
    for u in users:
        cursor.execute(
            "INSERT OR IGNORE INTO users (username, nombre, rol, hashed_password) VALUES (?,?,?,?)", u
        )

    conn.commit()
    conn.close()

def generate_otp() -> str:
    return ''.join(random.choices(string.digits, k=6))

def now_iso() -> str:
    return datetime.now().isoformat(sep='T', timespec='seconds')

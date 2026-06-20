import os
import sqlite3
import hashlib
import logging
from datetime import datetime, timedelta

DB_PATH = os.path.join(os.path.dirname(__file__), "users.db")
logger = logging.getLogger(__name__)

def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Create tables if they don't exist."""
    conn = get_connection()
    cursor = conn.cursor()
    
    # Create users table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            name TEXT NOT NULL,
            is_verified INTEGER DEFAULT 0,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # Create OTP table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS otps (
            email TEXT PRIMARY KEY,
            otp_code TEXT NOT NULL,
            expires_at TEXT NOT NULL
        )
    """)
    
    conn.commit()
    conn.close()
    logger.info("SQLite Database initialized and tables created/verified.")

def hash_password(password: str, salt: str = None) -> str:
    """Hash password using SHA-256 with a salt."""
    if not salt:
        salt = os.urandom(16).hex()
    hashed = hashlib.sha256((password + salt).encode('utf-8')).hexdigest()
    return f"{salt}:{hashed}"

def verify_password(password: str, stored_password: str) -> bool:
    """Verify password matches stored hash."""
    try:
        salt, stored_hash = stored_password.split(":", 1)
        hashed = hashlib.sha256((password + salt).encode('utf-8')).hexdigest()
        return hashed == stored_hash
    except Exception:
        return False

def save_otp(email: str, code: str, expires_in_seconds: int = 300):
    """Store or overwrite the OTP code for an email."""
    conn = get_connection()
    cursor = conn.cursor()
    expires_at = (datetime.now() + timedelta(seconds=expires_in_seconds)).isoformat()
    
    cursor.execute(
        "INSERT OR REPLACE INTO otps (email, otp_code, expires_at) VALUES (?, ?, ?)",
        (email, code, expires_at)
    )
    conn.commit()
    conn.close()

def verify_otp(email: str, code: str) -> bool:
    """Verify if the OTP is correct and not expired."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT otp_code, expires_at FROM otps WHERE email = ?", (email,))
    row = cursor.fetchone()
    
    if not row:
        conn.close()
        return False
        
    otp_code, expires_at = row["otp_code"], row["expires_at"]
    
    # Check expiry
    if datetime.fromisoformat(expires_at) < datetime.now():
        # Clean up expired OTP
        cursor.execute("DELETE FROM otps WHERE email = ?", (email,))
        conn.commit()
        conn.close()
        return False
        
    if otp_code == code:
        # OTP verified, remove it
        cursor.execute("DELETE FROM otps WHERE email = ?", (email,))
        conn.commit()
        conn.close()
        return True
        
    conn.close()
    return False

def create_user(email: str, password_raw: str, name: str) -> bool:
    """Register a new user."""
    conn = get_connection()
    cursor = conn.cursor()
    password_hashed = hash_password(password_raw)
    
    try:
        cursor.execute(
            "INSERT INTO users (email, password, name, is_verified) VALUES (?, ?, ?, 1)",
            (email.lower(), password_hashed, name)
        )
        conn.commit()
        return True
    except sqlite3.IntegrityError:
        return False
    finally:
        conn.close()

def get_user_by_email(email: str):
    """Fetch user dict from DB."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, email, password, name, is_verified, created_at FROM users WHERE email = ?", (email.lower(),))
    row = cursor.fetchone()
    conn.close()
    
    if row:
        return dict(row)
    return None

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import sqlite3
import os

app = FastAPI()

# Setup CORS so the frontend can reach the backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize SQLite database
# If running on Render, it will create/use users.db inside the persistent /data block
DB_NAME = os.environ.get("DATABASE_PATH", "/data/users.db")
if not os.path.exists('/data'):
    DB_NAME = "users.db" # Fallback for your local Desktop

def init_db():
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL
        )
    ''')
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT NOT NULL,
            title TEXT NOT NULL,
            prompt TEXT NOT NULL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    conn.commit()
    conn.close()

init_db()

# Models
class LoginRequest(BaseModel):
    email: str
    password: str

class HistoryRequest(BaseModel):
    email: str
    title: str
    prompt: str

@app.post("/login")
def login(request: LoginRequest):
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    
    # Simple check for existing user
    cursor.execute("SELECT password FROM users WHERE email = ?", (request.email,))
    user = cursor.fetchone()
    conn.close()
    
    if user:
        if user[0] == request.password:
            return {"status": "success", "message": "Login successful"}
        else:
            raise HTTPException(status_code=401, detail="Incorrect password")
    else:
        # If user doesn't exist, block login (no auto-creation to keep it safe)
        raise HTTPException(status_code=404, detail="User not found")

@app.post("/signup")
def signup(request: LoginRequest):
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    
    try:
        cursor.execute("INSERT INTO users (email, password) VALUES (?, ?)", (request.email, request.password))
        conn.commit()
        return {"status": "success", "message": "User created successfully"}
    except sqlite3.IntegrityError:
        raise HTTPException(status_code=400, detail="Email already exists")
    finally:
        conn.close()

@app.post("/history")
def save_history(request: HistoryRequest):
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute("INSERT INTO history (email, title, prompt) VALUES (?, ?, ?)", (request.email, request.title, request.prompt))
    conn.commit()
    conn.close()
    return {"status": "success", "message": "History saved"}

@app.get("/history/{email}")
def get_history(email: str):
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    # ordering by timestamp descending so the newest messages are at the top (which the frontend expects, since it does prepend)
    cursor.execute("SELECT title, prompt FROM history WHERE email = ? ORDER BY timestamp ASC", (email,))
    rows = cursor.fetchall()
    conn.close()
    
    # Send it back in chronological order so the frontend can prepend iteratively or we just send it as is.
    # Actually if the frontend uses unshift/prepend, it might want it in ascending order so the earliest is added first, pushing down, making the latest at the top.
    
    history_items = [{"title": row[0], "prompt": row[1]} for row in rows]
    return {"status": "success", "history": history_items}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)

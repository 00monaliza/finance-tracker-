#!/usr/bin/env python3
"""
Run FastAPI server
Usage: python backend/run_api.py
"""
import uvicorn
from dotenv import load_dotenv
import os
import sys
from pathlib import Path

# Add backend root to path
BASE_DIR = Path(__file__).parent
sys.path.insert(0, str(BASE_DIR))

load_dotenv(dotenv_path=BASE_DIR / ".env")


if __name__ == "__main__":
    host = os.getenv("API_HOST", "0.0.0.0")
    port = int(os.getenv("API_PORT", 8000))

    uvicorn.run(
        "api.main:app",
        host=host,
        port=port,
        reload=True,
        log_level="info",
    )


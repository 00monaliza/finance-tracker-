from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

from api.routers import accounts, transactions, auth
from database import engine
from db_models import Base

load_dotenv()

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Finance Tracker API",
    description="API for finance tracking application",
    version="1.0.0",
)

# CORS configuration
cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:8081,exp://*").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(accounts.router)
app.include_router(transactions.router)
app.include_router(auth.router)


@app.get("/")
def root():
    return {"message": "Finance Tracker API", "version": "1.0.0"}


@app.get("/health")
def health():
    return {"status": "ok"}


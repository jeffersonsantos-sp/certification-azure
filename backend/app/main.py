from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import auth, azure, labs, questions
from app.core.config import get_settings

settings = get_settings()

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    debug=settings.debug,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(questions.router, prefix="/api/v1")
app.include_router(auth.router, prefix="/api/v1")
app.include_router(labs.router, prefix="/api/v1")
app.include_router(azure.router, prefix="/api/v1")


@app.get("/")
async def root():
    return {"message": "AZ-104 Trainer API", "version": settings.app_version}


@app.get("/health")
async def health():
    return {"status": "healthy"}

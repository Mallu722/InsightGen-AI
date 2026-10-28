from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.routes.health import router as health_router
from app.api.routes.datasets import router as datasets_router
from app.api.routes.analysis import router as analysis_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifecycle manager.
    Runs startup and shutdown hooks cleanly.
    """
    print(f"[STARTUP] {settings.APP_NAME} v{settings.APP_VERSION} starting in '{settings.ENVIRONMENT}' mode...")
    yield
    print(f"[SHUTDOWN] {settings.APP_NAME} shutting down gracefully...")

def create_application() -> FastAPI:
    """
    Application factory initializing FastAPI with middleware, configuration, and route routers.
    """
    app = FastAPI(
        title=settings.APP_NAME,
        version=settings.APP_VERSION,
        description="Agentic AI Data Scientist backend providing dataset profiling, AI analysis planning, deterministic execution, and business reporting.",
        lifespan=lifespan,
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json"
    )

    # Cross-Origin Resource Sharing (CORS) Middleware
    # Permissive origin regex allows all Vercel previews and deployments automatically
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_origin_regex=r"https://.*\.vercel\.app|http://localhost:\d+|http://127\.0\.0\.1:\d+",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Register Routers
    # 1. Health & Status
    app.include_router(health_router)
    # 2. Datasets Ingestion & Profiling
    app.include_router(datasets_router)
    # 3. Natural Language Analysis
    app.include_router(analysis_router)

    # Root informational route
    @app.get("/", tags=["Root"])
    async def root():
        return {
            "message": f"Welcome to {settings.APP_NAME} API",
            "version": settings.APP_VERSION,
            "docs": "/docs",
            "health": "/health"
        }

    return app

app = create_application()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.BACKEND_HOST,
        port=settings.BACKEND_PORT,
        reload=settings.DEBUG
    )

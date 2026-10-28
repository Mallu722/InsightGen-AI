from app.api.routes.health import router as health_router
from app.api.routes.datasets import router as datasets_router
from app.api.routes.analysis import router as analysis_router

__all__ = ["health_router", "datasets_router", "analysis_router"]

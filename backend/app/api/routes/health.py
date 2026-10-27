from fastapi import APIRouter, status
from app.schemas.health import HealthResponse
from app.core.config import settings

router = APIRouter(tags=["System Health"])

@router.get(
    "/health",
    response_model=HealthResponse,
    status_code=status.HTTP_200_OK,
    summary="Service Health Check",
    description="Returns current operating status, version, and server environment metadata."
)
async def check_health() -> HealthResponse:
    """
    Health check endpoint to verify backend service liveness and configuration.
    """
    return HealthResponse(
        status="healthy",
        app_name=settings.APP_NAME,
        version=settings.APP_VERSION,
        environment=settings.ENVIRONMENT
    )

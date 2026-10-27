from datetime import datetime, timezone
from pydantic import BaseModel, Field

class HealthResponse(BaseModel):
    """
    Standard schema for the system health verification endpoint.
    """
    status: str = Field(default="healthy", description="Current service health status")
    app_name: str = Field(..., description="Application name")
    version: str = Field(..., description="Application semantic version")
    environment: str = Field(..., description="Active runtime environment (development, staging, production)")
    timestamp: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        description="UTC timestamp of the health check"
    )

    model_config = {
        "json_schema_extra": {
            "example": {
                "status": "healthy",
                "app_name": "InsightGen AI",
                "version": "1.0.0",
                "environment": "development",
                "timestamp": "2026-10-27T06:15:00Z"
            }
        }
    }

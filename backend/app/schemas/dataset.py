from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

class NumericStats(BaseModel):
    """Descriptive statistical metrics for numeric columns."""
    mean: Optional[float] = None
    std: Optional[float] = None
    min: Optional[float] = None
    q25: Optional[float] = None
    median: Optional[float] = None
    q75: Optional[float] = None
    max: Optional[float] = None

class ColumnProfile(BaseModel):
    """Detailed profile metrics for an individual column."""
    name: str = Field(..., description="Column header name")
    dtype: str = Field(..., description="Inferred data type (numeric, categorical, datetime, boolean, text)")
    python_dtype: str = Field(..., description="Underlying Pandas / NumPy dtype")
    total_count: int = Field(..., description="Total values present")
    null_count: int = Field(..., description="Count of missing/null values")
    null_percentage: float = Field(..., description="Percentage of missing values (0-100%)")
    unique_count: int = Field(..., description="Count of distinct unique values")
    sample_values: List[Any] = Field(default_factory=list, description="Small sample of representative non-null values")
    numeric_stats: Optional[NumericStats] = Field(default=None, description="Statistical metrics if column is numeric")

class DatasetMetadata(BaseModel):
    """Core metadata describing an uploaded dataset file."""
    dataset_id: str = Field(..., description="Unique UUID identifier for the dataset")
    filename: str = Field(..., description="Original filename uploaded by user")
    file_size_bytes: int = Field(..., description="Size of file in bytes")
    row_count: int = Field(..., description="Total number of rows in dataset")
    column_count: int = Field(..., description="Total number of columns in dataset")
    duplicate_rows: int = Field(..., description="Number of fully duplicate rows detected")
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        description="UTC timestamp of ingestion"
    )

class DatasetProfileResponse(BaseModel):
    """Comprehensive profiling response containing metadata, column statistics, and row previews."""
    metadata: DatasetMetadata
    columns: List[ColumnProfile]
    preview_rows: List[Dict[str, Any]] = Field(
        default_factory=list,
        description="First 10 rows of the dataset as key-value objects for tabular preview"
    )

class DatasetUploadResponse(BaseModel):
    """Response returned upon successful file upload and profiling."""
    success: bool = True
    message: str = "Dataset successfully uploaded and profiled"
    profile: DatasetProfileResponse

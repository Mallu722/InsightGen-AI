from typing import Dict, List
from fastapi import APIRouter, File, HTTPException, UploadFile, status
from app.schemas.dataset import (
    DatasetMetadata,
    DatasetProfileResponse,
    DatasetUploadResponse,
)
from app.services.dataset_service import dataset_service
from app.services.profiling_service import profiling_service

router = APIRouter(prefix="/api/datasets", tags=["Datasets & Profiling"])

# In-memory fast cache for active session profiles
_profile_cache: Dict[str, DatasetProfileResponse] = {}

@router.post(
    "/upload",
    response_model=DatasetUploadResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload and profile a dataset",
    description="Uploads a CSV or Excel file (.csv, .xlsx, .xls), validates its integrity, parses with Pandas, and generates descriptive statistics."
)
async def upload_dataset(
    file: UploadFile = File(..., description="CSV or Excel file to analyze")
) -> DatasetUploadResponse:
    """
    Ingest, validate, store, and profile a dataset.
    """
    # 1. Save file securely to upload directory
    dataset_id, clean_filename, file_size, file_path = await dataset_service.save_uploaded_file(file)

    # 2. Load into Pandas DataFrame with encoding fallbacks
    df = dataset_service.load_dataframe(file_path)

    # 3. Generate deterministic profile
    profile = profiling_service.generate_profile(
        df=df,
        dataset_id=dataset_id,
        filename=clean_filename,
        file_size_bytes=file_size,
    )

    # 4. Cache in-memory and register in metadata index
    _profile_cache[dataset_id] = profile
    dataset_service.register_dataset_metadata(
        dataset_id=dataset_id,
        metadata={
            "dataset_id": dataset_id,
            "filename": clean_filename,
            "file_path": file_path,
            "file_size_bytes": file_size,
            "row_count": profile.metadata.row_count,
            "column_count": profile.metadata.column_count,
            "duplicate_rows": profile.metadata.duplicate_rows,
            "created_at": profile.metadata.created_at.isoformat(),
        }
    )

    return DatasetUploadResponse(
        success=True,
        message=f"Dataset '{clean_filename}' uploaded and profiled successfully ({profile.metadata.row_count} rows, {profile.metadata.column_count} columns).",
        profile=profile,
    )

@router.get(
    "/{dataset_id}/profile",
    response_model=DatasetProfileResponse,
    summary="Retrieve dataset profile",
    description="Fetches column summary, missing value analysis, and preview rows for a previously uploaded dataset."
)
async def get_dataset_profile(dataset_id: str) -> DatasetProfileResponse:
    """
    Returns existing profile for a dataset_id.
    """
    # Check cache first
    if dataset_id in _profile_cache:
        return _profile_cache[dataset_id]

    # Check disk registry
    meta = dataset_service.get_dataset_metadata(dataset_id)
    if not meta or not meta.get("file_path"):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Dataset with ID '{dataset_id}' not found."
        )

    # Re-generate profile from stored file
    df = dataset_service.load_dataframe(meta["file_path"])
    profile = profiling_service.generate_profile(
        df=df,
        dataset_id=dataset_id,
        filename=meta["filename"],
        file_size_bytes=meta["file_size_bytes"],
    )
    _profile_cache[dataset_id] = profile
    return profile

@router.get(
    "",
    summary="List all uploaded datasets",
    description="Returns metadata list for all datasets stored in the active environment."
)
async def list_datasets() -> List[dict]:
    """
    Returns list of uploaded dataset metadata summaries.
    """
    raw_dict = dataset_service.list_datasets()
    return list(raw_dict.values())

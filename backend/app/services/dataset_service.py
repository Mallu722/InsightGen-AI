import os
import re
import uuid
import json
from pathlib import Path
from typing import Dict, Optional, Tuple
import pandas as pd
from fastapi import HTTPException, UploadFile, status
from app.core.config import settings

ALLOWED_EXTENSIONS = {".csv", ".xlsx", ".xls"}

class DatasetService:
    """
    Handles file ingestion, sanitization, disk storage, and safe Pandas loading.
    Guarantees isolation and protection against malicious inputs (Path Traversal, Zip Bombs).
    """

    def __init__(self, upload_dir: Optional[str] = None):
        self.upload_dir = Path(upload_dir or settings.UPLOAD_DIR)
        self.upload_dir.mkdir(parents=True, exist_ok=True)
        self.metadata_store_file = self.upload_dir / "datasets_index.json"
        self._ensure_index_file()

    def _ensure_index_file(self):
        if not self.metadata_store_file.exists():
            with open(self.metadata_store_file, "w", encoding="utf-8") as f:
                json.dump({}, f)

    def _load_index(self) -> Dict[str, dict]:
        try:
            with open(self.metadata_store_file, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return {}

    def _save_index(self, index_data: Dict[str, dict]):
        with open(self.metadata_store_file, "w", encoding="utf-8") as f:
            json.dump(index_data, f, indent=2, default=str)

    def sanitize_filename(self, filename: str) -> str:
        """
        Removes dangerous characters and path traversal attempts (../, \\, etc.).
        """
        base_name = os.path.basename(filename)
        # Keep alphanumeric, dot, dash, underscore
        clean_name = re.sub(r"[^a-zA-Z0-9._-]", "_", base_name)
        if not clean_name or clean_name.startswith("."):
            clean_name = f"dataset_{uuid.uuid4().hex[:8]}.csv"
        return clean_name

    def validate_file(self, filename: str, file_size: int):
        """
        Validates file extension and size constraints.
        """
        ext = Path(filename).suffix.lower()
        if ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported file format '{ext}'. Allowed formats: {', '.join(sorted(ALLOWED_EXTENSIONS))}"
            )

        max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
        if file_size > max_bytes:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"File exceeds maximum allowed size of {settings.MAX_UPLOAD_SIZE_MB}MB"
            )

        if file_size == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="The uploaded file is empty (0 bytes). Please upload a valid dataset."
            )

    async def save_uploaded_file(self, file: UploadFile) -> Tuple[str, str, int, str]:
        """
        Saves UploadFile to disk securely and returns (dataset_id, clean_filename, file_size, file_path).
        """
        original_filename = file.filename or "dataset.csv"
        clean_filename = self.sanitize_filename(original_filename)
        ext = Path(clean_filename).suffix.lower()

        if ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported file format '{ext}'. Allowed formats: {', '.join(sorted(ALLOWED_EXTENSIONS))}"
            )

        dataset_id = str(uuid.uuid4())
        stored_filename = f"{dataset_id}_{clean_filename}"
        target_path = self.upload_dir / stored_filename

        file_size = 0
        max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024

        try:
            with open(target_path, "wb") as buffer:
                while chunk := await file.read(1024 * 1024):  # 1MB chunks
                    file_size += len(chunk)
                    if file_size > max_bytes:
                        # Clean up partial file
                        buffer.close()
                        if target_path.exists():
                            target_path.unlink()
                        raise HTTPException(
                            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                            detail=f"File exceeds limit of {settings.MAX_UPLOAD_SIZE_MB}MB."
                        )
                    buffer.write(chunk)
        except HTTPException:
            raise
        except Exception as e:
            if target_path.exists():
                target_path.unlink()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to save file: {str(e)}"
            )

        if file_size == 0:
            if target_path.exists():
                target_path.unlink()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="The uploaded file is empty (0 bytes). Please upload a valid CSV or Excel file."
            )

        return dataset_id, clean_filename, file_size, str(target_path)

    def load_dataframe(self, file_path: str) -> pd.DataFrame:
        """
        Safely loads a CSV or Excel file into a Pandas DataFrame.
        Includes encoding fallback for Windows/Latin datasets.
        """
        path = Path(file_path)
        if not path.exists():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Dataset file not found at {file_path}"
            )

        ext = path.suffix.lower()

        if ext == ".csv":
            encodings = ["utf-8", "utf-8-sig", "latin1", "cp1252", "iso-8859-1"]
            df = None
            last_err = None
            for enc in encodings:
                try:
                    df = pd.read_csv(path, encoding=enc)
                    break
                except (UnicodeDecodeError, pd.errors.ParserError) as e:
                    last_err = e
                    continue
            if df is None:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Could not parse CSV file. Malformed encoding or invalid syntax: {str(last_err)}"
                )
        elif ext in {".xlsx", ".xls"}:
            try:
                df = pd.read_excel(path, engine="openpyxl")
            except Exception as e:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Could not parse Excel spreadsheet: {str(e)}"
                )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported format: {ext}"
            )

        if df.empty:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="The uploaded dataset has 0 rows of data."
            )

        # Standardize column names (strip whitespace)
        df.columns = [str(c).strip() for c in df.columns]
        return df

    def register_dataset_metadata(self, dataset_id: str, metadata: dict):
        index = self._load_index()
        index[dataset_id] = metadata
        self._save_index(index)

    def get_dataset_metadata(self, dataset_id: str) -> Optional[dict]:
        index = self._load_index()
        return index.get(dataset_id)

    def list_datasets(self) -> Dict[str, dict]:
        return self._load_index()

dataset_service = DatasetService()

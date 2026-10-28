from datetime import datetime, timezone
import math
from decimal import Decimal, ROUND_HALF_UP
from typing import Any, Dict, List, Optional
import numpy as np
import pandas as pd
from app.schemas.dataset import (
    ColumnProfile,
    DatasetMetadata,
    DatasetProfileResponse,
    NumericStats,
)

def round_val(val: float, decimals: int = 4) -> float:
    """
    Rounds floating-point numbers deterministically using ROUND_HALF_UP (standard arithmetic/financial rounding)
    to prevent IEEE-754 banker's rounding discrepancies.
    """
    try:
        d = Decimal(str(round(val, 8)))
        return float(d.quantize(Decimal(10) ** -decimals, rounding=ROUND_HALF_UP))
    except Exception:
        return round(val, decimals)


class ProfilingService:
    """
    Analyzes Pandas DataFrames deterministically to extract comprehensive metadata,
    column distributions, missingness metrics, and clean JSON-serializable previews.
    """

    @staticmethod
    def _sanitize_val(val: Any) -> Any:
        """Converts NaN, Inf, and numpy types to JSON-safe native Python types."""
        if val is None:
            return None
        if isinstance(val, (float, np.floating)):
            if math.isnan(val) or math.isinf(val):
                return None
            return float(val)
        if isinstance(val, (int, np.integer)):
            return int(val)
        if isinstance(val, (np.bool_, bool)):
            return bool(val)
        if isinstance(val, (pd.Timestamp, datetime)):
            return val.isoformat()
        return str(val)

    def infer_category(self, series: pd.Series) -> str:
        """Categorizes column into numeric, datetime, boolean, categorical, or text."""
        if pd.api.types.is_bool_dtype(series):
            return "boolean"
        if pd.api.types.is_datetime64_any_dtype(series):
            return "datetime"
        if pd.api.types.is_numeric_dtype(series):
            return "numeric"

        # Check if object can be parsed as datetime
        non_null = series.dropna()
        if len(non_null) > 0 and len(non_null) <= 500:
            try:
                pd.to_datetime(non_null.iloc[:20], format="mixed", errors="raise")
                return "datetime"
            except Exception:
                pass

        # Check unique ratio for categorical
        unique_count = series.nunique(dropna=True)
        total_count = len(series)
        if unique_count <= 25 or (total_count > 0 and (unique_count / total_count) < 0.05):
            return "categorical"

        return "text"

    def profile_column(self, series: pd.Series, col_name: str) -> ColumnProfile:
        total_count = len(series)
        null_count = int(series.isna().sum())
        null_percentage = round((null_count / total_count) * 100, 2) if total_count > 0 else 0.0
        unique_count = int(series.nunique(dropna=True))
        category = self.infer_category(series)

        # Representative non-null samples
        non_null_samples = series.dropna().unique()[:4]
        sample_values = [self._sanitize_val(v) for v in non_null_samples]

        numeric_stats = None
        if category == "numeric" and not pd.api.types.is_bool_dtype(series):
            clean_series = pd.to_numeric(series, errors="coerce").dropna()
            if not clean_series.empty:
                std_val = float(clean_series.std()) if len(clean_series) > 1 else 0.0
                if math.isnan(std_val):
                    std_val = 0.0

                numeric_stats = NumericStats(
                    mean=round_val(float(clean_series.mean()), 4),
                    std=round_val(std_val, 4),
                    min=round_val(float(clean_series.min()), 4),
                    q25=round_val(float(clean_series.quantile(0.25)), 4),
                    median=round_val(float(clean_series.median()), 4),
                    q75=round_val(float(clean_series.quantile(0.75)), 4),
                    max=round_val(float(clean_series.max()), 4),
                )

        return ColumnProfile(
            name=str(col_name),
            dtype=category,
            python_dtype=str(series.dtype),
            total_count=total_count,
            null_count=null_count,
            null_percentage=null_percentage,
            unique_count=unique_count,
            sample_values=sample_values,
            numeric_stats=numeric_stats,
        )

    def generate_profile(
        self,
        df: pd.DataFrame,
        dataset_id: str,
        filename: str,
        file_size_bytes: int,
    ) -> DatasetProfileResponse:
        """
        Generates complete profiling report for a DataFrame.
        """
        row_count = int(len(df))
        column_count = int(len(df.columns))
        duplicate_rows = int(df.duplicated().sum())

        metadata = DatasetMetadata(
            dataset_id=dataset_id,
            filename=filename,
            file_size_bytes=file_size_bytes,
            row_count=row_count,
            column_count=column_count,
            duplicate_rows=duplicate_rows,
            created_at=datetime.now(timezone.utc),
        )

        column_profiles = [
            self.profile_column(df[col], col)
            for col in df.columns
        ]

        # Preview first 10 rows safely sanitized for JSON
        preview_df = df.head(10).copy()
        preview_rows: List[Dict[str, Any]] = []
        for _, row in preview_df.iterrows():
            sanitized_row = {
                str(k): self._sanitize_val(v) for k, v in row.items()
            }
            preview_rows.append(sanitized_row)

        return DatasetProfileResponse(
            metadata=metadata,
            columns=column_profiles,
            preview_rows=preview_rows,
        )

profiling_service = ProfilingService()

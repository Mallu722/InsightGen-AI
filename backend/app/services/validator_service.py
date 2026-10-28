from typing import List
from fastapi import HTTPException, status
import pandas as pd
from app.schemas.analysis import AnalysisPlan

ALLOWED_AGGREGATIONS = {"sum", "mean", "count", "min", "max", "median", "none"}
ALLOWED_CHARTS = {"bar", "line", "pie", "scatter", "table", "none"}

class ValidatorService:
    """
    Validates AnalysisPlans against actual DataFrame schema before execution.
    Acts as a security perimeter preventing arbitrary code injection or invalid column references.
    """

    def validate_plan(self, plan: AnalysisPlan, df: pd.DataFrame) -> None:
        """
        Validates columns, aggregation functions, and constraints.
        Raises HTTPException(400) if plan is invalid or unsafe.
        """
        # Bypass deep schema validation for conversational or overview intents
        if plan.intent in ("greeting", "dataset_info"):
            return

        existing_columns = set(df.columns)

        # 1. Validate metric column exists
        if plan.metric_column:
            if plan.metric_column not in existing_columns:
                available = ", ".join(sorted(existing_columns))
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Target metric column '{plan.metric_column}' does not exist in dataset. Available columns: {available}"
                )

            # 2. Validate metric column is numeric (unless counting)
            if plan.aggregation_function != "count" and plan.aggregation_function != "none":
                if not pd.api.types.is_numeric_dtype(df[plan.metric_column]):
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Cannot perform mathematical aggregation '{plan.aggregation_function}' on non-numeric column '{plan.metric_column}' (dtype: {df[plan.metric_column].dtype})."
                    )

        # 3. Validate group_by columns exist
        for col in plan.group_by_columns:
            if col not in existing_columns:
                available = ", ".join(sorted(existing_columns))
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Grouping column '{col}' does not exist in dataset. Available columns: {available}"
                )

        # 4. Validate aggregation function
        if plan.aggregation_function.lower() not in ALLOWED_AGGREGATIONS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported aggregation '{plan.aggregation_function}'. Allowed: {', '.join(sorted(ALLOWED_AGGREGATIONS))}"
            )

        # 5. Validate chart type
        if plan.recommended_chart.lower() not in ALLOWED_CHARTS:
            plan.recommended_chart = "bar"

        # 6. Validate limit
        if plan.limit is not None and (plan.limit <= 0 or plan.limit > 1000):
            plan.limit = 10

validator_service = ValidatorService()

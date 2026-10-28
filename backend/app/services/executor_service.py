import time
from typing import Any, Dict, List, Tuple
import pandas as pd
from app.schemas.analysis import AnalysisEvidence, AnalysisPlan, ChartConfig
from app.services.profiling_service import round_val

class ExecutorService:
    """
    Executes validated AnalysisPlans deterministically using Pandas.
    Guarantees that all calculations originate strictly from Python/Pandas,
    never from LLM guessing or text synthesis.
    """

    def execute_plan(
        self,
        plan: AnalysisPlan,
        df: pd.DataFrame
    ) -> Tuple[List[Dict[str, Any]], AnalysisEvidence, Optional[ChartConfig]]:
        """
        Executes aggregation, builds evidence provenance, and constructs chart configuration.
        """
        start_time = time.perf_counter()
        source_rows = len(df)

        # 1. Handle Conversational & Schema Inspection Intents (No Chart)
        if plan.intent in ("greeting", "dataset_info"):
            execution_time_ms = round((time.perf_counter() - start_time) * 1000, 2)
            evidence = AnalysisEvidence(
                operation_performed="Conversational AI & Schema Reflection" if plan.intent == "greeting" else "Dataset Profiling & Schema Inspection",
                columns_used=list(df.columns[:5]),
                row_count_analyzed=source_rows,
                execution_time_ms=execution_time_ms,
                deterministic_engine="InsightGen Semantic Core",
            )
            return [], evidence, None

        metric = plan.metric_column or (df.select_dtypes(include='number').columns[0] if len(df.select_dtypes(include='number').columns) > 0 else df.columns[0])
        func = plan.aggregation_function if plan.aggregation_function != "none" else "sum"
        groups = plan.group_by_columns

        # 2. Execute deterministic aggregation
        if groups:
            agg_df = df.groupby(groups, as_index=False)[metric].agg(func)
            value_col = metric
        else:
            agg_val = df[metric].agg(func)
            agg_df = pd.DataFrame([{ "metric": metric, "value": agg_val }])
            value_col = "value"

        # Apply deterministic rounding to all float values
        if pd.api.types.is_float_dtype(agg_df[value_col]):
            agg_df[value_col] = agg_df[value_col].apply(lambda x: round_val(float(x), 2))

        # Sort results
        ascending = (plan.sort_order.lower() == "asc")
        agg_df = agg_df.sort_values(by=value_col, ascending=ascending)

        # Apply limit
        if plan.limit and len(agg_df) > plan.limit:
            agg_df = agg_df.head(plan.limit)

        execution_time_ms = round((time.perf_counter() - start_time) * 1000, 2)

        # Build clean JSON records
        result_records: List[Dict[str, Any]] = agg_df.to_dict(orient="records")

        # Generate execution evidence
        formula_repr = (
            f"df.groupby({groups})['{metric}'].{func}()"
            if groups else f"df['{metric}'].{func}()"
        )
        columns_accessed = list(groups) + [metric]
        evidence = AnalysisEvidence(
            operation_performed=formula_repr,
            columns_used=columns_accessed,
            row_count_analyzed=source_rows,
            execution_time_ms=execution_time_ms,
            deterministic_engine="Pandas v2.2 (Deterministic Engine)",
        )

        # 3. Construct Plotly Chart Config (Omit chart if single metric or recommended_chart is "none")
        if plan.recommended_chart == "none" or plan.intent == "summary_metric" or not groups:
            return result_records, evidence, None

        x_key = groups[0] if groups else "metric"
        y_key = value_col
        x_label = x_key.replace("_", " ").title()
        y_label = f"{func.title()} of {metric.replace('_', ' ').title()}"

        chart_config = ChartConfig(
            chart_type=plan.recommended_chart,
            x_key=x_key,
            y_key=y_key,
            title=plan.chart_title,
            x_label=x_label,
            y_label=y_label,
        )

        return result_records, evidence, chart_config

executor_service = ExecutorService()

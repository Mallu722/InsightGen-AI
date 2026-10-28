from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

class AnalysisRequest(BaseModel):
    """Request payload for natural language query."""
    dataset_id: str = Field(..., description="Target dataset UUID")
    question: str = Field(..., min_length=2, max_length=500, description="Natural language analytical question")

class AnalysisPlan(BaseModel):
    """
    Structured analysis plan produced by Gemini AI Planner or fallback semantic planner.
    Enforces safe, bounded analytics operations without arbitrary code execution.
    """
    intent: str = Field(..., description="Classified intent (aggregation, comparison, ranking, trend, greeting, dataset_info, summary_metric)")
    operation: str = Field(default="group_by", description="Approved deterministic operation")
    group_by_columns: List[str] = Field(default_factory=list, description="Categorical or grouping column names")
    metric_column: Optional[str] = Field(default=None, description="Numeric target column to aggregate")
    aggregation_function: str = Field(default="sum", description="Allowlisted aggregation: sum, mean, count, min, max, median, none")
    sort_order: str = Field(default="desc", description="Sorting direction: desc or asc")
    limit: Optional[int] = Field(default=10, description="Maximum number of result rows to return")
    recommended_chart: str = Field(default="bar", description="Suggested visualization: bar, line, pie, scatter, none")
    chart_title: str = Field(default="Analysis Result", description="Suggested title for chart")

class AnalysisEvidence(BaseModel):
    """Cryptographic/audit metadata proving computation was executed deterministically."""
    operation_performed: str = Field(..., description="Exact Pandas expression executed")
    columns_used: List[str] = Field(..., description="Columns accessed during calculation")
    row_count_analyzed: int = Field(..., description="Number of source rows evaluated")
    execution_time_ms: float = Field(..., description="Execution duration in milliseconds")
    deterministic_engine: str = Field(default="Pandas v2.2 (Deterministic)", description="Calculation engine")

class ChartConfig(BaseModel):
    """Configuration for frontend Plotly chart rendering."""
    chart_type: str = Field(..., description="bar, line, pie, scatter")
    x_key: str = Field(..., description="Data key for X axis or categories")
    y_key: str = Field(..., description="Data key for Y axis or values")
    title: str = Field(..., description="Chart title")
    x_label: str = Field(..., description="Axis X label")
    y_label: str = Field(..., description="Axis Y label")

class AnalysisResponse(BaseModel):
    """Complete response returned to user and frontend."""
    success: bool = True
    question: str = Field(..., description="Original user question")
    summary: str = Field(..., description="Natural language explanation grounded in verified numbers")
    plan: Optional[AnalysisPlan] = Field(default=None, description="Structured plan that was verified and executed")
    result: List[Dict[str, Any]] = Field(default_factory=list, description="Deterministic calculation results")
    chart: Optional[ChartConfig] = Field(default=None, description="Plotly chart configuration")
    evidence: Optional[AnalysisEvidence] = Field(default=None, description="Execution provenance and verification details")

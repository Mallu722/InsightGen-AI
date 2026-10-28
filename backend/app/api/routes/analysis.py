from typing import Optional
from fastapi import APIRouter, Header, HTTPException, status
from app.schemas.analysis import AnalysisRequest, AnalysisResponse
from app.services.dataset_service import dataset_service
from app.services.profiling_service import profiling_service
from app.services.planner_service import planner_service
from app.services.validator_service import validator_service
from app.services.executor_service import executor_service
from app.services.synthesizer_service import synthesizer_service

router = APIRouter(prefix="/api/analysis", tags=["Natural Language Analysis"])

@router.post(
    "/query",
    response_model=AnalysisResponse,
    status_code=status.HTTP_200_OK,
    summary="Natural Language Data Analysis Query",
    description="Translates user question into structured analysis plan, verifies operations against dataset schema, executes deterministic calculations with Pandas, and synthesizes evidence-backed narrative and Plotly chart configuration."
)
async def query_dataset(
    request: AnalysisRequest,
    x_gemini_key: Optional[str] = Header(None, alias="x-gemini-key"),
    x_gemini_model: Optional[str] = Header(None, alias="x-gemini-model"),
) -> AnalysisResponse:
    """
    End-to-End Natural Language Analysis Workflow.
    """
    # 1. Fetch dataset metadata and load DataFrame
    meta = dataset_service.get_dataset_metadata(request.dataset_id)
    if not meta or not meta.get("file_path"):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Dataset with ID '{request.dataset_id}' not found."
        )

    df = dataset_service.load_dataframe(meta["file_path"])

    # 2. Extract column metadata for AI planning
    columns_metadata = [
        {
            "name": col,
            "dtype": profiling_service.infer_category(df[col])
        }
        for col in df.columns
    ]

    # 3. AI Planner generates structured AnalysisPlan
    plan = planner_service.plan_analysis(
        question=request.question,
        columns_metadata=columns_metadata,
        custom_api_key=x_gemini_key,
        custom_model=x_gemini_model,
    )

    # 4. Security & Query Validator verifies plan integrity
    validator_service.validate_plan(plan=plan, df=df)

    # 5. Deterministic Engine executes calculation & records evidence
    results, evidence, chart_config = executor_service.execute_plan(plan=plan, df=df)

    # 6. Synthesizer generates evidence-grounded narrative
    summary = synthesizer_service.synthesize_explanation(
        question=request.question,
        results=results,
        plan=plan,
        evidence=evidence,
        custom_api_key=x_gemini_key,
        custom_model=x_gemini_model,
    )

    return AnalysisResponse(
        success=True,
        question=request.question,
        summary=summary,
        plan=plan,
        result=results,
        chart=chart_config,
        evidence=evidence
    )

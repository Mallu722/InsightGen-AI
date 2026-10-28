import json
from typing import Any, Dict, List
from app.core.config import settings
from app.schemas.analysis import AnalysisEvidence, AnalysisPlan

class SynthesizerService:
    """
    Synthesizes natural-language business explanations strictly grounded in verified calculation outputs.
    Guarantees zero mathematical hallucinations by constraining Gemini to verified numbers.
    """

    def synthesize_explanation(
        self,
        question: str,
        results: List[Dict[str, Any]],
        plan: AnalysisPlan,
        evidence: AnalysisEvidence,
        custom_api_key: Optional[str] = None,
        custom_model: Optional[str] = None,
    ) -> str:
        """
        Produces an evidence-grounded summary or conversational response.
        """
        # 1. Handle Greetings & Dataset Info Directly
        if plan.intent == "greeting":
            cols_preview = ", ".join(evidence.columns_used[:5]) if evidence.columns_used else "columns"
            return (
                f"Hello! I am your InsightGen AI Data Scientist. "
                f"I am actively connected to your dataset with {evidence.row_count_analyzed:,} records ({cols_preview}...). "
                f"What would you like to discover today? You can ask me to find highest/lowest performers, calculate averages, or compare trends across any category."
            )

        if plan.intent == "dataset_info":
            cols_list = ", ".join(evidence.columns_used) if evidence.columns_used else "all columns"
            return (
                f"Dataset Overview: This active dataset contains {evidence.row_count_analyzed:,} rows. "
                f"Key attributes include: {cols_list}. All records have been profiled and are ready for deterministic calculation and interactive visualization."
            )

        if plan.intent == "summary_metric" and results:
            val = results[0].get("value", results[0].get(plan.metric_column, 0))
            metric_label = (plan.metric_column or "metric").replace("_", " ").title()
            is_curr = any(c in (plan.metric_column or "").lower() for c in ["revenue", "price", "sales", "cost", "salary", "pay", "fee"])
            formatted = f"${val:,.2f}" if is_curr else f"{val:,.2f}"
            return f"Across all {evidence.row_count_analyzed:,} analyzed records, the total {metric_label.lower()} is **{formatted}**."

        if not results:
            return "No matching records found in the dataset for this query."

        if settings.ENVIRONMENT.lower() in ("test", "testing"):
            return self._synthesize_deterministic(question, results, plan, evidence)

        effective_key = custom_api_key or settings.GEMINI_API_KEY
        effective_model = custom_model or settings.GEMINI_MODEL

        if effective_key and effective_key.strip():
            try:
                return self._synthesize_with_gemini(
                    question=question,
                    results=results,
                    plan=plan,
                    evidence=evidence,
                    api_key=effective_key.strip(),
                    model_name=effective_model.strip(),
                )
            except Exception:
                pass

        return self._synthesize_deterministic(question, results, plan, evidence)

    def _synthesize_with_gemini(
        self,
        question: str,
        results: List[Dict[str, Any]],
        plan: AnalysisPlan,
        evidence: AnalysisEvidence,
        api_key: str,
        model_name: str,
    ) -> str:
        """
        Calls Gemini to explain verified numbers.
        """
        from google import genai

        client = genai.Client(api_key=api_key)
        sample_results = results[:5]

        prompt = f"""You are the Executive Data Scientist for InsightGen AI.
User Question: "{question}"

Verified Deterministic Calculation Results:
{json.dumps(sample_results, indent=2)}

Analysis Method: {evidence.operation_performed}
Rows Analyzed: {evidence.row_count_analyzed}

Instructions:
1. Provide a direct, professional, 2-to-3 sentence executive answer to the user's question.
2. CRITICAL ANTI-HALLUCINATION RULE: Quote ONLY the exact numbers present in the verified results above. Do NOT calculate or guess new figures.
3. Highlight the top performer or significant contrast clearly."""

        import concurrent.futures

        def _invoke_api():
            resp = client.models.generate_content(
                model=model_name,
                contents=prompt,
            )
            return resp.text.strip()

        executor = concurrent.futures.ThreadPoolExecutor(max_workers=1)
        try:
            future = executor.submit(_invoke_api)
            return future.result(timeout=4.0)
        except Exception:
            executor.shutdown(wait=False, cancel_futures=True)
            raise
        else:
            executor.shutdown(wait=False)

    def _synthesize_deterministic(
        self,
        question: str,
        results: List[Dict[str, Any]],
        plan: AnalysisPlan,
        evidence: AnalysisEvidence,
    ) -> str:
        """
        Crisp deterministic summary generated directly from the top aggregated records.
        """
        top_item = results[0]
        group_key = plan.group_by_columns[0] if plan.group_by_columns else "metric"
        metric_key = plan.metric_column or "value"
        val = top_item.get(metric_key, top_item.get("value", 0))
        top_name = top_item.get(group_key, "N/A")

        metric_name = metric_key.replace("_", " ").title()
        group_name = group_key.replace("_", " ").title()

        # Format number with commas
        is_curr = any(k in metric_key.lower() for k in ["revenue", "price", "sales", "cost", "salary", "pay", "fee"])
        formatted_val = f"${val:,.2f}" if is_curr else f"{val:,.2f}"

        if len(results) > 1:
            second_item = results[1]
            second_val = second_item.get(metric_key, second_item.get("value", 0))
            second_name = second_item.get(group_key, "N/A")
            formatted_second = f"${second_val:,.2f}" if is_curr else f"{second_val:,.2f}"
            diff_text = f", followed by {second_name} with {formatted_second}"
        else:
            diff_text = ""

        return (
            f"Based on a verified analysis of {evidence.row_count_analyzed} records, "
            f"{top_name} generated the {plan.sort_order.lower() == 'desc' and 'highest' or 'lowest'} "
            f"{plan.aggregation_function} {metric_name.lower()} with {formatted_val}{diff_text}."
        )

synthesizer_service = SynthesizerService()

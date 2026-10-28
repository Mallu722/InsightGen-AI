import json
import re
from typing import Dict, List, Optional
from app.core.config import settings
from app.schemas.analysis import AnalysisPlan

class PlannerService:
    """
    Translates natural-language business questions into verified, structured AnalysisPlan objects.
    Uses Google Gemini (google-genai SDK) when configured, with a resilient semantic fallback.
    Never executes calculations directly.
    """

    def plan_analysis(
        self,
        question: str,
        columns_metadata: List[Dict[str, str]],
        custom_api_key: Optional[str] = None,
        custom_model: Optional[str] = None,
    ) -> AnalysisPlan:
        """
        Creates an AnalysisPlan from question and available schema metadata.
        """
        if settings.ENVIRONMENT.lower() in ("test", "testing"):
            return self._plan_with_semantic_rules(question, columns_metadata)

        effective_key = custom_api_key or settings.GEMINI_API_KEY
        effective_model = custom_model or settings.GEMINI_MODEL

        if effective_key and effective_key.strip():
            try:
                return self._plan_with_gemini(
                    question=question,
                    columns_metadata=columns_metadata,
                    api_key=effective_key.strip(),
                    model_name=effective_model.strip(),
                )
            except Exception:
                # Log or fallback to semantic planner
                pass

        return self._plan_with_semantic_rules(question, columns_metadata)

    def _plan_with_gemini(
        self,
        question: str,
        columns_metadata: List[Dict[str, str]],
        api_key: str,
        model_name: str,
    ) -> AnalysisPlan:
        """
        Calls Google Gemini API with system instructions enforcing strict AnalysisPlan JSON.
        """
        from google import genai

        client = genai.Client(api_key=api_key)
        schema_summary = "\n".join([f"- {col['name']} ({col['dtype']})" for col in columns_metadata])

        prompt = f"""You are the Analysis Planner for InsightGen AI.
Given this dataset schema:
{schema_summary}

Translate this user question into a structured JSON analysis plan:
Question: "{question}"

Instructions:
1. Intent Classification:
   - If user says a greeting (e.g. "hi", "hello", "hey", "who are you", "help"):
     Set "intent": "greeting", "operation": "conversational_response", "recommended_chart": "none", "metric_column": null, "group_by_columns": [].
   - If user asks about the dataset itself (e.g. "what columns?", "how many rows?", "tell me about this data", "missing values"):
     Set "intent": "dataset_info", "operation": "schema_inspection", "recommended_chart": "none", "metric_column": null, "group_by_columns": [].
   - If user asks for an overall single metric without grouping (e.g. "what is the total revenue?", "average salary"):
     Set "intent": "summary_metric", "operation": "aggregate", "group_by_columns": [], "metric_column": "numeric_column_name".
   - If user asks for comparison, breakdown, ranking, or group-by:
     Set "intent": "aggregation", "operation": "group_by", "group_by_columns": ["categorical_column_name"], "metric_column": "numeric_column_name".
2. Identify the grouping column(s) (must be categorical/text/datetime) and target metric column (numeric).
3. Identify the aggregation function: "sum", "mean", "count", "min", "max", or "median".
4. Determine the sort order: "desc" (for highest/top) or "asc" (for lowest).
5. Choose recommended chart: "bar", "line", "pie", "scatter", or "none".
6. Return ONLY a valid JSON object matching this structure with NO markdown fences:
{{
  "intent": "aggregation",
  "operation": "group_by",
  "group_by_columns": ["column_name"],
  "metric_column": "metric_name",
  "aggregation_function": "sum",
  "sort_order": "desc",
  "limit": 10,
  "recommended_chart": "bar",
  "chart_title": "Descriptive Chart Title"
}}"""

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
            raw_text = future.result(timeout=4.0)
        except Exception:
            executor.shutdown(wait=False, cancel_futures=True)
            raise
        else:
            executor.shutdown(wait=False)

        # Clean any markdown code blocks
        if raw_text.startswith("```"):
            raw_text = re.sub(r"^```[a-zA-Z]*\n?", "", raw_text)
            raw_text = re.sub(r"\n?```$", "", raw_text)

        plan_dict = json.loads(raw_text.strip())
        return AnalysisPlan(**plan_dict)

    def _plan_with_semantic_rules(self, question: str, columns_metadata: List[Dict[str, str]]) -> AnalysisPlan:
        """
        Deterministic, offline semantic planner.
        Intelligently identifies Greetings, Dataset/Schema Questions, and Dynamic Aggregations
        for ANY dataset (CSV or Excel) without hallucination or accidental chart spam.
        """
        q_lower = question.lower().strip()
        q_clean = re.sub(r"[^\w\s]", "", q_lower).strip()
        tokens = set(re.findall(r"\b[a-z0-9]+\b", q_lower))

        categorical_cols = [c["name"] for c in columns_metadata if c["dtype"] in {"categorical", "text", "datetime"}]
        numeric_cols = [c["name"] for c in columns_metadata if c["dtype"] == "numeric"]

        # -------------------------------------------------------------
        # 1. Intent Detection: Greeting / Chit-chat
        # -------------------------------------------------------------
        GREETING_WORDS = {
            "hi", "hello", "hey", "hola", "sup", "greetings", "howdy",
            "good morning", "good afternoon", "good evening", "good day",
            "who are you", "what are you", "what can you do", "help",
            "thanks", "thank you", "thx"
        }
        if q_clean in GREETING_WORDS or (len(tokens) <= 2 and any(w in GREETING_WORDS for w in tokens)):
            return AnalysisPlan(
                intent="greeting",
                operation="conversational_response",
                group_by_columns=[],
                metric_column=None,
                aggregation_function="none",
                sort_order="desc",
                limit=0,
                recommended_chart="none",
                chart_title="Assistant Response"
            )

        # -------------------------------------------------------------
        # 2. Intent Detection: Dataset Overview & Schema Q&A
        # -------------------------------------------------------------
        SCHEMA_KEYWORDS = [
            "what column", "list column", "show column", "columns", "all columns",
            "schema", "fields", "what are the features", "attributes",
            "how many rows", "row count", "how many records", "number of rows", "dataset size", "how big",
            "what is this dataset", "about this dataset", "tell me about this dataset",
            "dataset summary", "describe dataset", "overview", "what does this data contain",
            "data quality", "missing values", "null values", "nulls", "duplicates", "summary of data"
        ]
        if any(kw in q_lower for kw in SCHEMA_KEYWORDS):
            return AnalysisPlan(
                intent="dataset_info",
                operation="schema_inspection",
                group_by_columns=[],
                metric_column=None,
                aggregation_function="none",
                sort_order="desc",
                limit=0,
                recommended_chart="none",
                chart_title="Dataset Profile & Overview"
            )

        # -------------------------------------------------------------
        # 3. Dynamic Column Matching for ANY Dataset
        # -------------------------------------------------------------
        # Helper to score column match against question
        def score_column_match(col_name: str) -> int:
            clean_col = col_name.lower().replace("_", " ")
            col_words = set(clean_col.split())
            score = 0
            if clean_col in q_lower:
                score += 10
            # Check individual words
            for cw in col_words:
                if len(cw) >= 3 and cw in tokens:
                    score += 5
                elif len(cw) >= 4 and cw.rstrip("s") in q_lower:
                    score += 3
            return score

        # Detect Group Column from categorical columns
        best_group = None
        best_group_score = 0
        for col in categorical_cols:
            s = score_column_match(col)
            # Give boost if preceded by "by", "per", "which", "across"
            clean_col = col.lower().replace("_", " ")
            if re.search(rf"\b(by|per|across|which)\s+{re.escape(clean_col)}\b", q_lower):
                s += 15
            elif re.search(rf"\b(by|per|across|which)\s+[a-z0-9_ ]*{re.escape(col.lower())}", q_lower):
                s += 10
            if s > best_group_score:
                best_group_score = s
                best_group = col

        # Detect Metric Column from numeric columns
        best_metric = None
        best_metric_score = 0
        for col in numeric_cols:
            s = score_column_match(col)
            clean_col = col.lower().replace("_", " ")
            # Generic synonym boosts
            if any(k in clean_col for k in ["revenue", "sales", "amount", "total", "turnover", "pay", "income"]) and \
               any(k in q_lower for k in ["revenue", "sales", "amount", "total", "turnover", "pay", "income"]):
                s += 8
            if any(k in clean_col for k in ["unit", "qty", "quantity", "sold", "volume", "count"]) and \
               any(k in q_lower for k in ["unit", "quantity", "sold", "volume", "how many"]):
                s += 8
            if any(k in clean_col for k in ["price", "cost", "fee", "rate", "fare"]) and \
               any(k in q_lower for k in ["price", "cost", "fee", "rate", "expensive", "cheapest"]):
                s += 8
            if any(k in clean_col for k in ["score", "grade", "rating", "points", "gpa"]) and \
               any(k in q_lower for k in ["score", "grade", "rating", "points", "marks"]):
                s += 8
            if any(k in clean_col for k in ["salary", "wage", "compensation"]) and \
               any(k in q_lower for k in ["salary", "wage", "compensation", "earn", "paid"]):
                s += 8

            if s > best_metric_score:
                best_metric_score = s
                best_metric = col

        # Determine Aggregation Function
        agg_func = "sum"
        if any(w in q_lower for w in ["average", "avg", "mean"]):
            agg_func = "mean"
        elif any(w in q_lower for w in ["count", "frequency", "how many"]):
            agg_func = "count"
        elif any(w in q_lower for w in ["maximum", "max", "highest", "peak", "most expensive", "top score"]):
            agg_func = "max" if not best_group else "sum"
            if "highest" in q_lower or "top" in q_lower:
                agg_func = "sum" if "average" not in q_lower else "mean"
        elif any(w in q_lower for w in ["minimum", "min", "lowest", "bottom", "cheapest", "least"]):
            agg_func = "min" if not best_group else "sum"

        # Determine Sort Order
        sort_order = "asc" if any(w in q_lower for w in ["lowest", "bottom", "least", "cheapest", "min"]) else "desc"

        # -------------------------------------------------------------
        # 4. Fallback Handling
        # -------------------------------------------------------------
        # Metric fallback
        if not best_metric and numeric_cols:
            best_metric = numeric_cols[0]

        # Is user asking for a single overall metric (no group by)?
        is_single_metric_query = (
            not best_group and
            any(k in q_lower for k in ["total", "overall", "sum of", "average", "avg", "max", "highest", "min", "lowest", "how much"]) and
            not any(k in q_lower for k in ["by", "per", "which", "compare", "breakdown", "category", "group", "each"])
        )

        if is_single_metric_query and best_metric:
            metric_title = best_metric.replace("_", " ").title()
            return AnalysisPlan(
                intent="summary_metric",
                operation="aggregate",
                group_by_columns=[],
                metric_column=best_metric,
                aggregation_function=agg_func,
                sort_order=sort_order,
                limit=1,
                recommended_chart="none",
                chart_title=f"Total {metric_title}"
            )

        # Default grouping column if needed for comparison/ranking
        if not best_group and categorical_cols:
            best_group = categorical_cols[0]

        # Chart recommendation
        chart_type = "bar"
        if best_group and any(d in best_group.lower() for d in ["date", "time", "month", "year", "day"]):
            chart_type = "line"
        elif any(w in q_lower for w in ["proportion", "share", "percentage", "distribution", "donut", "pie"]):
            chart_type = "pie"

        group_title = best_group.replace("_", " ").title() if best_group else "Category"
        metric_title = best_metric.replace("_", " ").title() if best_metric else "Metric"
        title = f"{agg_func.title()} of {metric_title} by {group_title}"

        return AnalysisPlan(
            intent="aggregation",
            operation="group_by",
            group_by_columns=[best_group] if best_group else [],
            metric_column=best_metric or (numeric_cols[0] if numeric_cols else "value"),
            aggregation_function=agg_func,
            sort_order=sort_order,
            limit=10,
            recommended_chart=chart_type,
            chart_title=title,
        )

planner_service = PlannerService()

from pathlib import Path
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def _upload_sample_dataset() -> str:
    """Helper to upload sample_sales.csv and return its dataset_id."""
    sample_path = Path(__file__).resolve().parent.parent.parent / "sample_data" / "sample_sales.csv"
    with open(sample_path, "rb") as f:
        files = {"file": ("sample_sales.csv", f, "text/csv")}
        res = client.post("/api/datasets/upload", files=files)
    assert res.status_code == 201
    return res.json()["profile"]["metadata"]["dataset_id"]

def test_query_highest_revenue_region():
    """
    Test asking 'Which region generated the highest revenue?' against sample_sales.csv.
    Verifies that North is accurately determined as the top revenue region ($19,968.50)
    with zero mathematical hallucination.
    """
    dataset_id = _upload_sample_dataset()

    payload = {
        "dataset_id": dataset_id,
        "question": "Which region generated the highest revenue?"
    }

    response = client.post("/api/analysis/query", json=payload)
    assert response.status_code == 200

    data = response.json()
    assert data["success"] is True
    assert "North" in data["summary"]

    plan = data["plan"]
    assert plan["group_by_columns"] == ["region"]
    assert plan["metric_column"] == "total_revenue"
    assert plan["aggregation_function"] == "sum"
    assert plan["sort_order"] == "desc"

    results = data["result"]
    assert len(results) == 4
    # North region must be top with exact deterministic sum
    assert results[0]["region"] == "North"
    assert results[0]["total_revenue"] == 19968.5

    evidence = data["evidence"]
    assert evidence["row_count_analyzed"] == 20
    assert "groupby" in evidence["operation_performed"]
    assert evidence["execution_time_ms"] >= 0

    chart = data["chart"]
    assert chart["chart_type"] == "bar"
    assert chart["x_key"] == "region"
    assert chart["y_key"] == "total_revenue"

def test_query_average_revenue_by_product_category():
    """
    Test asking 'What is the average revenue by product category?'
    Verifies mean aggregation across product categories.
    """
    dataset_id = _upload_sample_dataset()

    payload = {
        "dataset_id": dataset_id,
        "question": "What is the average revenue by product category?"
    }

    response = client.post("/api/analysis/query", json=payload)
    assert response.status_code == 200

    data = response.json()
    plan = data["plan"]
    assert plan["group_by_columns"] == ["product_category"]
    assert plan["metric_column"] == "total_revenue"
    assert plan["aggregation_function"] == "mean"

    results = data["result"]
    categories = {r["product_category"] for r in results}
    assert "Electronics" in categories
    assert "Furniture" in categories
    assert "Office Supplies" in categories

def test_query_nonexistent_dataset():
    """
    Verify querying a non-existent dataset returns 404 Not Found.
    """
    payload = {
        "dataset_id": "00000000-0000-0000-0000-000000000000",
        "question": "Total sales by region?"
    }
    response = client.post("/api/analysis/query", json=payload)
    assert response.status_code == 404

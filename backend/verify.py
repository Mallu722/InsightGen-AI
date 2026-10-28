import sys
import os
import asyncio
from pathlib import Path

# Add backend directory to path
current_dir = Path(__file__).resolve().parent
sys.path.insert(0, str(current_dir))
os.chdir(str(current_dir))
os.environ["ENVIRONMENT"] = "test"

import httpx
from app.main import app

async def run_verifications():
    print("=== STARTING FULL ENDPOINT VERIFICATIONS ===", flush=True)
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Health check
        print("\n1. Testing GET /health...", flush=True)
        res = await client.get("/health")
        print(f"Health Status: {res.status_code}, Body: {res.json()}", flush=True)
        assert res.status_code == 200

        # 2. Upload sample_sales.csv
        print("\n2. Uploading sample_sales.csv...", flush=True)
        sample_path = current_dir.parent / "sample_data" / "sample_sales.csv"
        with open(sample_path, "rb") as f:
            files = {"file": ("sample_sales.csv", f, "text/csv")}
            res = await client.post("/api/datasets/upload", files=files)
        print(f"Upload Status: {res.status_code}", flush=True)
        assert res.status_code == 201
        sales_id = res.json()["profile"]["metadata"]["dataset_id"]
        print(f"Dataset ID: {sales_id}", flush=True)

        # 3. Test Greeting ("hi") - MUST NOT produce chart or units_sold error
        print("\n3. Testing Query 'hi' (Greeting Check)...", flush=True)
        res = await client.post("/api/analysis/query", json={"dataset_id": sales_id, "question": "hi"})
        print(f"Status: {res.status_code}", flush=True)
        data = res.json()
        print(f"Summary: {data['summary']}", flush=True)
        print(f"Chart: {data.get('chart')}", flush=True)
        assert data["chart"] is None, "Greeting MUST NOT render a chart!"
        assert "Hello" in data["summary"], "Must return a friendly greeting!"

        # 4. Test Schema Question ("what columns are in this dataset?")
        print("\n4. Testing Query 'what columns are in this dataset?'...", flush=True)
        res = await client.post("/api/analysis/query", json={"dataset_id": sales_id, "question": "what columns are in this dataset?"})
        data = res.json()
        print(f"Summary: {data['summary']}", flush=True)
        assert data["chart"] is None, "Schema overview question should not render a chart!"

        # 5. Test Analytical Query ("Which region generated the highest revenue?")
        print("\n5. Testing Analytical Query 'Which region generated the highest revenue?'...", flush=True)
        res = await client.post("/api/analysis/query", json={"dataset_id": sales_id, "question": "Which region generated the highest revenue?"})
        data = res.json()
        print(f"Summary: {data['summary']}", flush=True)
        print(f"Top Result: {data['result'][0]}", flush=True)
        print(f"Chart Title: {data['chart']['title']}", flush=True)
        assert data["result"][0]["region"] == "North"
        assert data["result"][0]["total_revenue"] == 19968.5

        # 6. Test Single Metric Query ("What is the total revenue?")
        print("\n6. Testing Single Metric Query 'What is the total revenue?'...", flush=True)
        res = await client.post("/api/analysis/query", json={"dataset_id": sales_id, "question": "What is the total revenue?"})
        data = res.json()
        print(f"Summary: {data['summary']}", flush=True)

        # 7. Test a DIFFERENT dataset (e.g. Employee HR dataset)
        print("\n7. Testing Upload of DIFFERENT dataset (HR Employees)...", flush=True)
        hr_csv = (
            "employee_id,department,role,salary,experience_years,performance_rating\n"
            "EMP-01,Engineering,Backend Lead,145000,8,4.8\n"
            "EMP-02,Engineering,Frontend Dev,110000,4,4.2\n"
            "EMP-03,Design,Product Designer,98000,5,4.6\n"
            "EMP-04,Sales,Account Exec,85000,3,3.9\n"
            "EMP-05,Sales,Sales Director,160000,10,4.9\n"
            "EMP-06,Marketing,SEO Specialist,72000,2,4.1\n"
            "EMP-07,Marketing,Content Manager,80000,4,4.3\n"
            "EMP-08,Engineering,DevOps Engineer,135000,6,4.7\n"
        )
        files = {"file": ("company_employees.csv", hr_csv.encode("utf-8"), "text/csv")}
        res = await client.post("/api/datasets/upload", files=files)
        assert res.status_code == 201
        hr_id = res.json()["profile"]["metadata"]["dataset_id"]
        print(f"HR Dataset uploaded! ID: {hr_id}", flush=True)

        # Query the HR dataset: "Which department has the highest salary?"
        print("\n8. Querying HR dataset: 'Which department has the highest salary?'...", flush=True)
        res = await client.post("/api/analysis/query", json={"dataset_id": hr_id, "question": "Which department has the highest salary?"})
        data = res.json()
        print(f"Summary: {data['summary']}", flush=True)
        print(f"Results: {data['result']}", flush=True)
        print(f"Chart: {data['chart']['title'] if data.get('chart') else None}", flush=True)
        assert data["result"][0]["department"] in ("Engineering", "Sales")

        # Query HR dataset: "What is the average performance rating across department?"
        print("\n9. Querying HR dataset: 'What is the average performance rating by department?'...", flush=True)
        res = await client.post("/api/analysis/query", json={"dataset_id": hr_id, "question": "What is the average performance rating by department?"})
        data = res.json()
        print(f"Summary: {data['summary']}", flush=True)
        print(f"Results: {data['result']}", flush=True)

        print("\n=== ALL VERIFICATIONS PASSED SUCCESSFULLY! ===", flush=True)

if __name__ == "__main__":
    asyncio.run(run_verifications())


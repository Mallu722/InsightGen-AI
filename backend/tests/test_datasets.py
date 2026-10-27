import io
from pathlib import Path
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_upload_valid_csv():
    """
    Test uploading a valid CSV file and receiving structured profiling data.
    """
    csv_content = (
        "id,product,price,quantity,is_in_stock\n"
        "1,Laptop,1200.50,10,true\n"
        "2,Headphones,85.00,45,true\n"
        "3,Monitor,350.00,0,false\n"
        "4,Keyboard,45.20,,true\n"
        "5,Mouse,25.00,80,true\n"
    )
    files = {
        "file": ("test_inventory.csv", io.BytesIO(csv_content.encode("utf-8")), "text/csv")
    }

    response = client.post("/api/datasets/upload", files=files)
    assert response.status_code == 201

    data = response.json()
    assert data["success"] is True
    profile = data["profile"]
    metadata = profile["metadata"]

    assert metadata["row_count"] == 5
    assert metadata["column_count"] == 5
    assert metadata["duplicate_rows"] == 0
    assert metadata["filename"] == "test_inventory.csv"
    assert "dataset_id" in metadata

    columns = {col["name"]: col for col in profile["columns"]}
    assert "price" in columns
    assert columns["price"]["dtype"] == "numeric"
    assert columns["price"]["numeric_stats"] is not None
    assert columns["price"]["numeric_stats"]["min"] == 25.0
    assert columns["price"]["numeric_stats"]["max"] == 1200.5

    # Check null detection on quantity
    assert columns["quantity"]["null_count"] == 1
    assert columns["quantity"]["null_percentage"] == 20.0

    # Check preview rows
    assert len(profile["preview_rows"]) == 5

def test_get_dataset_profile():
    """
    Test uploading a dataset and retrieving its profile via GET /api/datasets/{id}/profile.
    """
    csv_content = "city,temperature\nLondon,18.5\nParis,22.0\nTokyo,26.4\n"
    files = {
        "file": ("weather.csv", io.BytesIO(csv_content.encode("utf-8")), "text/csv")
    }
    upload_res = client.post("/api/datasets/upload", files=files)
    assert upload_res.status_code == 201
    dataset_id = upload_res.json()["profile"]["metadata"]["dataset_id"]

    profile_res = client.get(f"/api/datasets/{dataset_id}/profile")
    assert profile_res.status_code == 200
    profile_data = profile_res.json()
    assert profile_data["metadata"]["dataset_id"] == dataset_id
    assert profile_data["metadata"]["row_count"] == 3

def test_upload_unsupported_file_format():
    """
    Verify rejection of unsupported file types (.txt, .exe, .sh) with 400 Bad Request.
    """
    files = {
        "file": ("malicious.txt", io.BytesIO(b"Hello world text"), "text/plain")
    }
    response = client.post("/api/datasets/upload", files=files)
    assert response.status_code == 400
    assert "Unsupported file format" in response.json()["detail"]

def test_upload_empty_file():
    """
    Verify 0-byte files return clear 400 Bad Request.
    """
    files = {
        "file": ("empty.csv", io.BytesIO(b""), "text/csv")
    }
    response = client.post("/api/datasets/upload", files=files)
    assert response.status_code == 400
    assert "empty" in response.json()["detail"].lower()

def test_get_nonexistent_dataset_profile():
    """
    Verify non-existent dataset IDs return 404 Not Found.
    """
    response = client.get("/api/datasets/00000000-0000-0000-0000-000000000000/profile")
    assert response.status_code == 404

def test_upload_real_sample_sales_dataset():
    """
    Test uploading the bundled sample_sales.csv file.
    """
    sample_path = Path(__file__).resolve().parent.parent.parent / "sample_data" / "sample_sales.csv"
    assert sample_path.exists(), f"Sample sales file missing at {sample_path}"

    with open(sample_path, "rb") as f:
        files = {"file": ("sample_sales.csv", f, "text/csv")}
        response = client.post("/api/datasets/upload", files=files)

    assert response.status_code == 201
    data = response.json()
    metadata = data["profile"]["metadata"]
    assert metadata["row_count"] == 20
    assert metadata["column_count"] == 10

    columns = {col["name"]: col for col in data["profile"]["columns"]}
    assert "total_revenue" in columns
    assert "region" in columns
    assert columns["total_revenue"]["dtype"] == "numeric"
    assert columns["region"]["dtype"] == "categorical"
    assert columns["region"]["unique_count"] == 4

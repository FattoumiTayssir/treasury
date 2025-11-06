"""
Comprehensive CRUD tests for Manual Entries (Entrées manuelles)
Tests: Create, Read, Update, Delete operations
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from datetime import datetime, timedelta
from app.main import app
from app.database import Base, get_db
from app import models
import os

# Test database URL
SQLALCHEMY_DATABASE_URL = os.getenv("TEST_DB_URL", "sqlite:///./test.db")
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)


@pytest.fixture(scope="function")
def db_session():
    """Create a fresh database for each test"""
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    yield db
    db.close()
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def auth_token(db_session):
    """Create a test user and return auth token"""
    # Create test user
    test_user = models.User(
        display_name="Test User",
        email="test@example.com",
        hashed_password="$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5UpTgOxmz.8Na",  # "password"
        role="Admin",
        created_at=datetime.utcnow()
    )
    db_session.add(test_user)
    
    # Create test company
    test_company = models.Company(name="Test Company")
    db_session.add(test_company)
    db_session.commit()
    
    # Login to get token
    response = client.post(
        "/auth/login",
        json={"email": "test@example.com", "password": "password"}
    )
    return response.json()["token"], test_company.company_id


class TestManualEntriesCRUD:
    """Test suite for Manual Entries CRUD operations"""
    
    def test_create_manual_entry_single_occurrence(self, auth_token):
        """Test creating a manual entry with single occurrence"""
        token, company_id = auth_token
        
        # Arrange
        tomorrow = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
        entry_data = {
            "company_id": company_id,
            "category": "RH",
            "type": "Salaire",
            "amount": 5000.00,
            "sign": "Sortie",
            "frequency": "Une seule fois",
            "start_date": tomorrow,
            "status": "Actif",
            "note": "Test salary payment"
        }
        
        # Act
        response = client.post(
            "/manual-entries",
            json=entry_data,
            headers={"Authorization": f"Bearer {token}"}
        )
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        assert data["category"] == "RH"
        assert data["type"] == "Salaire"
        assert float(data["amount"]) == 5000.00
        assert data["sign"] == "Sortie"
        assert data["frequency"] == "Une seule fois"
        assert data["status"] == "Actif"
    
    def test_create_manual_entry_monthly_frequency(self, auth_token):
        """Test creating a manual entry with monthly frequency"""
        token, company_id = auth_token
        
        # Arrange
        start_date = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
        end_date = (datetime.now() + timedelta(days=90)).strftime("%Y-%m-%d")
        entry_data = {
            "company_id": company_id,
            "category": "Achat",
            "type": "Achats locaux avec échéance",
            "amount": 1000.00,
            "sign": "Sortie",
            "frequency": "Mensuel",
            "start_date": start_date,
            "end_date": end_date,
            "status": "Actif",
            "reference": "TEST-MONTHLY"
        }
        
        # Act
        response = client.post(
            "/manual-entries",
            json=entry_data,
            headers={"Authorization": f"Bearer {token}"}
        )
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        assert data["frequency"] == "Mensuel"
        assert data["end_date"] is not None
        
        # Verify multiple movements were created
        entry_id = data["id"]
        movements_response = client.get(
            f"/manual-entries/{entry_id}/movements",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert movements_response.status_code == 200
        movements = movements_response.json()
        assert len(movements) >= 3  # Should create at least 3 monthly movements
    
    def test_create_manual_entry_custom_dates(self, auth_token):
        """Test creating a manual entry with custom dates"""
        token, company_id = auth_token
        
        # Arrange
        date1 = (datetime.now() + timedelta(days=5)).strftime("%Y-%m-%d")
        date2 = (datetime.now() + timedelta(days=15)).strftime("%Y-%m-%d")
        date3 = (datetime.now() + timedelta(days=25)).strftime("%Y-%m-%d")
        
        entry_data = {
            "company_id": company_id,
            "category": "Vente",
            "type": "Ventes locales",
            "amount": 2500.00,
            "sign": "Entrée",
            "frequency": "Dates personnalisées",
            "start_date": date1,
            "custom_dates": [date1, date2, date3],
            "status": "Actif"
        }
        
        # Act
        response = client.post(
            "/manual-entries",
            json=entry_data,
            headers={"Authorization": f"Bearer {token}"}
        )
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        assert data["frequency"] == "Dates personnalisées"
        assert data["custom_dates"] is not None
        assert len(data["custom_dates"]) == 3
        
        # Verify movements
        entry_id = data["id"]
        movements_response = client.get(
            f"/manual-entries/{entry_id}/movements",
            headers={"Authorization": f"Bearer {token}"}
        )
        movements = movements_response.json()
        assert len(movements) == 3
    
    def test_read_all_manual_entries(self, auth_token):
        """Test reading all manual entries"""
        token, company_id = auth_token
        
        # Arrange - Create two entries
        tomorrow = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
        for i in range(2):
            entry_data = {
                "company_id": company_id,
                "category": "RH",
                "type": "Salaire",
                "amount": 3000.00 + (i * 1000),
                "sign": "Sortie",
                "frequency": "Une seule fois",
                "start_date": tomorrow,
                    "status": "Actif"
            }
            client.post(
                "/manual-entries",
                json=entry_data,
                headers={"Authorization": f"Bearer {token}"}
            )
        
        # Act
        response = client.get(
            "/manual-entries",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 2
        assert all(isinstance(entry, dict) for entry in data)
    
    def test_read_single_manual_entry(self, auth_token):
        """Test reading a single manual entry by ID"""
        token, company_id = auth_token
        
        # Arrange - Create entry
        tomorrow = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
        entry_data = {
            "company_id": company_id,
            "category": "Compta",
            "type": "TVA",
            "amount": 1500.00,
            "sign": "Sortie",
            "frequency": "Une seule fois",
            "start_date": tomorrow,
            "status": "Actif"
        }
        create_response = client.post(
            "/manual-entries",
            json=entry_data,
            headers={"Authorization": f"Bearer {token}"}
        )
        entry_id = create_response.json()["id"]
        
        # Act
        response = client.get(
            f"/manual-entries/{entry_id}",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == entry_id
        assert data["category"] == "Compta"
        assert data["type"] == "TVA"
        assert float(data["amount"]) == 1500.00
    
    def test_delete_manual_entry(self, auth_token):
        """Test deleting a manual entry"""
        token, company_id = auth_token
        
        # Arrange - Create entry
        tomorrow = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
        entry_data = {
            "company_id": company_id,
            "category": "Autre",
            "type": "Autre",
            "amount": 500.00,
            "sign": "Sortie",
            "frequency": "Une seule fois",
            "start_date": tomorrow,
            "status": "Actif"
        }
        create_response = client.post(
            "/manual-entries",
            json=entry_data,
            headers={"Authorization": f"Bearer {token}"}
        )
        entry_id = create_response.json()["id"]
        
        # Act
        response = client.post(
            "/manual-entries/delete",
            json={"ids": [entry_id]},
            headers={"Authorization": f"Bearer {token}"}
        )
        
        # Assert
        assert response.status_code == 200
        assert "success" in response.json()["message"].lower()
        
        # Verify entry is deleted
        get_response = client.get(
            f"/manual-entries/{entry_id}",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert get_response.status_code == 404
    
    def test_delete_multiple_manual_entries(self, auth_token):
        """Test batch deletion of manual entries"""
        token, company_id = auth_token
        
        # Arrange - Create multiple entries
        tomorrow = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
        entry_ids = []
        for i in range(3):
            entry_data = {
                "company_id": company_id,
                "category": "RH",
                "type": "Charges sociales",
                "amount": 1000.00,
                "sign": "Sortie",
                "frequency": "Une seule fois",
                "start_date": tomorrow,
                    "status": "Actif"
            }
            response = client.post(
                "/manual-entries",
                json=entry_data,
                headers={"Authorization": f"Bearer {token}"}
            )
            entry_ids.append(response.json()["id"])
        
        # Act
        response = client.post(
            "/manual-entries/delete",
            json={"ids": entry_ids},
            headers={"Authorization": f"Bearer {token}"}
        )
        
        # Assert
        assert response.status_code == 200
        
        # Verify all entries are deleted
        for entry_id in entry_ids:
            get_response = client.get(
                f"/manual-entries/{entry_id}",
                headers={"Authorization": f"Bearer {token}"}
            )
            assert get_response.status_code == 404
    
    def test_create_manual_entry_missing_required_fields(self, auth_token):
        """Test creating manual entry with missing required fields"""
        token, company_id = auth_token
        
        # Arrange - Missing category
        entry_data = {
            "company_id": company_id,
            "type": "Salaire",
            "amount": 5000.00,
            "sign": "Sortie",
            "frequency": "Une seule fois",
            "start_date": "2025-12-01",
            "status": "Actif"
        }
        
        # Act
        response = client.post(
            "/manual-entries",
            json=entry_data,
            headers={"Authorization": f"Bearer {token}"}
        )
        
        # Assert
        assert response.status_code == 422  # Unprocessable Entity
    
    def test_create_manual_entry_without_auth(self):
        """Test creating manual entry without authentication"""
        # Arrange
        entry_data = {
            "company_id": 1,
            "category": "RH",
            "type": "Salaire",
            "amount": 5000.00,
            "sign": "Sortie",
            "frequency": "Une seule fois",
            "start_date": "2025-12-01",
            "status": "Actif"
        }
        
        # Act
        response = client.post("/manual-entries", json=entry_data)
        
        # Assert
        assert response.status_code == 401  # Unauthorized
    
    def test_create_manual_entry_with_past_date(self, auth_token):
        """Test creating manual entry with past date (should be filtered)"""
        token, company_id = auth_token
        
        # Arrange - Past date
        yesterday = (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d")
        entry_data = {
            "company_id": company_id,
            "category": "RH",
            "type": "Salaire",
            "amount": 5000.00,
            "sign": "Sortie",
            "frequency": "Une seule fois",
            "start_date": yesterday,
            "status": "Actif"
        }
        
        # Act
        response = client.post(
            "/manual-entries",
            json=entry_data,
            headers={"Authorization": f"Bearer {token}"}
        )
        
        # Assert - Should fail or not create movements
        assert response.status_code == 400  # No future movements


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

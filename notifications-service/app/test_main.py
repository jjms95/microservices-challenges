import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app as fastapi_app
from app.database import Base, get_db
from app.models import Notification  # ensure models are registered with Base.metadata
from app.service import NotificationsService
from app.schemas import EmployeeCreatedPayload, EmployeeDeletedPayload
from app.security import get_current_user

DATABASE_URL = "sqlite+aiosqlite:///file:testdb?mode=memory&cache=shared&uri=true"
engine = create_async_engine(
    DATABASE_URL, 
    echo=False, 
    connect_args={"check_same_thread": False}, 
    poolclass=StaticPool
)
TestingSessionLocal = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)

async def override_get_db():
    async with TestingSessionLocal() as session:
        yield session

fastapi_app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(autouse=True)
async def setup_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

@pytest.mark.asyncio
async def test_health_check():
    async with AsyncClient(transport=ASGITransport(app=fastapi_app), base_url="http://test") as client:
        res = await client.get("/health")
        assert res.status_code == 200
        assert res.json() == {"status": "ok"}

@pytest.mark.asyncio
async def test_notifications_service():
    async with TestingSessionLocal() as session:
        svc = NotificationsService(session)
        await svc.handle_employee_created(EmployeeCreatedPayload(id="emp1", name="Jhon", email="jhon@company.com"))
        await svc.handle_employee_deleted(EmployeeDeletedPayload(id="emp1", name="Jhon", email="jhon@company.com"))
        
        all_notifs = await svc.find_all()
        assert len(all_notifs) == 2
        
        by_emp = await svc.find_by_employee_id("emp1")
        assert len(by_emp) == 2

        count = await svc.delete_all()
        assert count == 2

def override_auth_admin():
    return {"id": "123", "email": "admin@empresa.com", "role": "ADMIN"}

@pytest.mark.asyncio
async def test_notifications_router():
    # Override the security checks for the router tests
    fastapi_app.dependency_overrides[get_current_user] = override_auth_admin

    async with AsyncClient(transport=ASGITransport(app=fastapi_app), base_url="http://test") as client:
        # Initial state should be empty
        res = await client.get("/notifications")
        assert res.status_code == 200
        assert len(res.json()) == 0

        # Create some notifications via service
        async with TestingSessionLocal() as session:
            svc = NotificationsService(session)
            await svc.handle_employee_created(EmployeeCreatedPayload(id="emp-123", name="Alice", email="alice@b.com"))

        # Fetch all
        res2 = await client.get("/notifications")
        assert res2.status_code == 200
        assert len(res2.json()) == 1
        assert res2.json()[0]["employee_id"] == "emp-123"

        # Fetch by ID
        res3 = await client.get("/notifications/emp-123")
        assert res3.status_code == 200
        assert len(res3.json()) == 1

        # Delete all
        res4 = await client.delete("/notifications")
        assert res4.status_code == 200
        assert res4.json()["deleted"] == 1

        # Verify deletion
        res5 = await client.get("/notifications")
        assert len(res5.json()) == 0

@pytest.mark.asyncio
async def test_security_auth_error():
    # Clear overrides to test real auth dependency
    fastapi_app.dependency_overrides.clear()
    
    async with AsyncClient(transport=ASGITransport(app=fastapi_app), base_url="http://test") as client:
        # Missing token should return 401 or 403
        res = await client.get("/notifications")
        assert res.status_code == 401

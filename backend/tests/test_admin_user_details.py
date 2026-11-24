
import pytest
from sqlalchemy.orm import sessionmaker

from backend.models import User


TEST_PASSWORD = "TestPassword123"


def register_user(client, email):
    response = client.post(
        "/api/auth/register",
        json={
            "full_name": "Admin Feature Test User",
            "email": email,
            "password": TEST_PASSWORD,
        },
    )

    assert response.status_code == 201, response.text


def change_user_role(test_engine, email, role):
    TestingSessionLocal = sessionmaker(bind=test_engine)
    db = TestingSessionLocal()

    try:
        user = db.query(User).filter(
            User.email == email
        ).first()

        assert user is not None

        user.role = role
        db.commit()

    finally:
        db.close()


def get_user_id(test_engine, email):
    TestingSessionLocal = sessionmaker(bind=test_engine)
    db = TestingSessionLocal()

    try:
        user = db.query(User).filter(
            User.email == email
        ).first()

        assert user is not None
        return user.id

    finally:
        db.close()


def login_and_get_token(client, email):
    response = client.post(
        "/api/auth/login",
        json={
            "email": email,
            "password": TEST_PASSWORD,
        },
    )

    assert response.status_code == 200, response.text

    return response.json()["access_token"]


def auth_headers(token):
    return {
        "Authorization": f"Bearer {token}"
    }


def create_admin(client, test_engine, email):
    register_user(client, email)

    change_user_role(
        test_engine,
        email,
        "admin",
    )

    return login_and_get_token(client, email)


# ========================================
# PAGINATION TESTS
# ========================================

def test_admin_can_view_paginated_users(
    client,
    test_engine,
):
    token = create_admin(
        client,
        test_engine,
        "pagination-admin@example.com",
    )

    register_user(
        client,
        "pagination-user@example.com",
    )

    response = client.get(
        "/api/admin/users/paginated?page=1&page_size=1",
        headers=auth_headers(token),
    )

    assert response.status_code == 200, response.text

    data = response.json()

    assert "items" in data
    assert "total" in data
    assert "page" in data
    assert "page_size" in data
    assert "total_pages" in data

    assert len(data["items"]) == 1
    assert data["total"] == 2
    assert data["page"] == 1
    assert data["page_size"] == 1
    assert data["total_pages"] == 2


def test_admin_can_view_second_user_page(
    client,
    test_engine,
):
    token = create_admin(
        client,
        test_engine,
        "pagination-second-admin@example.com",
    )

    register_user(
        client,
        "pagination-second-user@example.com",
    )

    headers = auth_headers(token)

    first_page = client.get(
        "/api/admin/users/paginated?page=1&page_size=1",
        headers=headers,
    )

    second_page = client.get(
        "/api/admin/users/paginated?page=2&page_size=1",
        headers=headers,
    )

    assert first_page.status_code == 200
    assert second_page.status_code == 200

    first_id = first_page.json()["items"][0]["id"]
    second_id = second_page.json()["items"][0]["id"]

    assert first_id != second_id


def test_admin_pagination_rejects_invalid_page_size(
    client,
    test_engine,
):
    token = create_admin(
        client,
        test_engine,
        "pagination-validation-admin@example.com",
    )

    response = client.get(
        "/api/admin/users/paginated?page=1&page_size=101",
        headers=auth_headers(token),
    )

    assert response.status_code == 422


# ========================================
# USER DETAIL TESTS
# ========================================

def test_admin_can_view_user_details(
    client,
    test_engine,
):
    token = create_admin(
        client,
        test_engine,
        "detail-admin@example.com",
    )

    register_user(
        client,
        "detail-target@example.com",
    )

    target_id = get_user_id(
        test_engine,
        "detail-target@example.com",
    )

    response = client.get(
        f"/api/admin/users/{target_id}",
        headers=auth_headers(token),
    )

    assert response.status_code == 200, response.text

    data = response.json()

    assert data["id"] == target_id
    assert data["full_name"] == "Admin Feature Test User"
    assert data["email"] == "detail-target@example.com"
    assert data["role"] == "user"

    assert "listings" in data
    assert "owned_groups" in data
    assert "group_memberships" in data
    assert "sessions" in data
    assert "recent_activity" in data

    assert isinstance(data["listings"], list)
    assert isinstance(data["owned_groups"], list)
    assert isinstance(data["group_memberships"], list)
    assert isinstance(data["sessions"], list)
    assert isinstance(data["recent_activity"], list)


def test_admin_gets_404_for_nonexistent_user(
    client,
    test_engine,
):
    token = create_admin(
        client,
        test_engine,
        "detail-not-found-admin@example.com",
    )

    response = client.get(
        "/api/admin/users/999999",
        headers=auth_headers(token),
    )

    assert response.status_code == 404


# ========================================
# ACCESS CONTROL TESTS
# ========================================

@pytest.mark.parametrize(
    "endpoint",
    [
        "/api/admin/users/paginated",
        "/api/admin/users/1",
    ],
)
def test_guest_cannot_access_new_admin_endpoints(
    client,
    endpoint,
):
    response = client.get(endpoint)

    assert response.status_code == 401


@pytest.mark.parametrize(
    "endpoint",
    [
        "/api/admin/users/paginated",
        "/api/admin/users/1",
    ],
)
def test_normal_user_cannot_access_new_admin_endpoints(
    client,
    endpoint,
):
    register_user(
        client,
        "normal-access-test@example.com",
    )

    token = login_and_get_token(
        client,
        "normal-access-test@example.com",
    )

    response = client.get(
        endpoint,
        headers=auth_headers(token),
    )

    assert response.status_code == 403

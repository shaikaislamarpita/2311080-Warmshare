
from sqlalchemy.orm import sessionmaker

from backend.models import User


TEST_PASSWORD = "TestPassword123"


def register_user(client, email):
    response = client.post(
        "/api/auth/register",
        json={
            "full_name": "Admin Test User",
            "email": email,
            "password": TEST_PASSWORD,
        },
    )

    assert response.status_code == 201, response.text


def change_user_role(test_engine, email, role):
    TestingSessionLocal = sessionmaker(bind=test_engine)
    db = TestingSessionLocal()

    try:
        user = db.query(User).filter(User.email == email).first()

        assert user is not None

        user.role = role
        db.commit()
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
    return {"Authorization": f"Bearer {token}"}


def create_admin(client, test_engine, email):
    register_user(client, email)

    change_user_role(
        test_engine,
        email,
        "admin",
    )

    return login_and_get_token(client, email)


def test_guest_cannot_access_admin_users(client):
    response = client.get("/api/admin/users")

    assert response.status_code == 401


def test_user_cannot_access_admin_users(client):
    register_user(client, "normal-admin-test@example.com")

    token = login_and_get_token(
        client,
        "normal-admin-test@example.com",
    )

    response = client.get(
        "/api/admin/users",
        headers=auth_headers(token),
    )

    assert response.status_code == 403


def test_moderator_cannot_access_admin_users(client, test_engine):
    register_user(client, "moderator-admin-test@example.com")

    change_user_role(
        test_engine,
        "moderator-admin-test@example.com",
        "moderator",
    )

    token = login_and_get_token(
        client,
        "moderator-admin-test@example.com",
    )

    response = client.get(
        "/api/admin/users",
        headers=auth_headers(token),
    )

    assert response.status_code == 403


def test_admin_can_access_admin_users(client, test_engine):
    token = create_admin(
        client,
        test_engine,
        "admin-access-test@example.com",
    )

    response = client.get(
        "/api/admin/users",
        headers=auth_headers(token),
    )

    assert response.status_code == 200, response.text


def test_admin_can_access_dashboard_stats(client, test_engine):
    token = create_admin(
        client,
        test_engine,
        "admin-dashboard-test@example.com",
    )

    response = client.get(
        "/api/admin/dashboard/stats",
        headers=auth_headers(token),
    )

    assert response.status_code == 200, response.text

    data = response.json()

    assert "total_users" in data
    assert "total_listings" in data
    assert "active_sessions" in data


def test_admin_can_view_audit_logs(client, test_engine):
    token = create_admin(
        client,
        test_engine,
        "admin-audit-test@example.com",
    )

    response = client.get(
        "/api/admin/audit-logs",
        headers=auth_headers(token),
    )

    assert response.status_code == 200, response.text
    assert isinstance(response.json(), list)


def test_admin_can_export_audit_logs(client, test_engine):
    token = create_admin(
        client,
        test_engine,
        "admin-export-test@example.com",
    )

    response = client.get(
        "/api/admin/export/audit-logs",
        headers=auth_headers(token),
    )

    assert response.status_code == 200, response.text
    assert "text/csv" in response.headers["content-type"]
    assert "attachment" in response.headers["content-disposition"]


def test_admin_can_view_failed_login_monitoring(client, test_engine):
    token = create_admin(
        client,
        test_engine,
        "admin-security-test@example.com",
    )

    response = client.get(
        "/api/admin/security/failed-logins",
        headers=auth_headers(token),
    )

    assert response.status_code == 200, response.text
    assert isinstance(response.json(), list)


def test_admin_cannot_change_own_role(client, test_engine):
    token = create_admin(
        client,
        test_engine,
        "admin-self-role@example.com",
    )

    db_session = sessionmaker(bind=test_engine)()

    try:
        admin = db_session.query(User).filter(
            User.email == "admin-self-role@example.com"
        ).first()

        admin_id = admin.id
    finally:
        db_session.close()

    response = client.patch(
        f"/api/admin/users/{admin_id}/role",
        json={"role": "user"},
        headers=auth_headers(token),
    )

    assert response.status_code in (400, 403)


def test_admin_cannot_ban_self(client, test_engine):
    token = create_admin(
        client,
        test_engine,
        "admin-self-ban@example.com",
    )

    db_session = sessionmaker(bind=test_engine)()

    try:
        admin = db_session.query(User).filter(
            User.email == "admin-self-ban@example.com"
        ).first()

        admin_id = admin.id
    finally:
        db_session.close()

    response = client.patch(
        f"/api/admin/users/{admin_id}/ban",
        json={
            "is_banned": True,
            "reason": "Self-ban test",
        },
        headers=auth_headers(token),
    )

    assert response.status_code in (400, 403)


def test_admin_can_change_user_role(client, test_engine):
    admin_token = create_admin(
        client,
        test_engine,
        "admin-change-role@example.com",
    )

    register_user(client, "target-role@example.com")

    db_session = sessionmaker(bind=test_engine)()

    try:
        target = db_session.query(User).filter(
            User.email == "target-role@example.com"
        ).first()

        target_id = target.id
    finally:
        db_session.close()

    response = client.patch(
        f"/api/admin/users/{target_id}/role",
        json={"role": "moderator"},
        headers=auth_headers(admin_token),
    )

    assert response.status_code == 200, response.text
    assert response.json()["role"] == "moderator"


def test_admin_can_ban_user(client, test_engine):
    admin_token = create_admin(
        client,
        test_engine,
        "admin-ban-user@example.com",
    )

    register_user(client, "target-ban@example.com")

    db_session = sessionmaker(bind=test_engine)()

    try:
        target = db_session.query(User).filter(
            User.email == "target-ban@example.com"
        ).first()

        target_id = target.id
    finally:
        db_session.close()

    response = client.patch(
        f"/api/admin/users/{target_id}/ban",
        json={
            "is_banned": True,
            "reason": "Testing Admin ban permission",
        },
        headers=auth_headers(admin_token),
    )

    assert response.status_code == 200, response.text
    assert response.json()["is_banned"] is True


def test_banned_user_cannot_use_existing_access_token(
    client,
    test_engine,
):
    admin_token = create_admin(
        client,
        test_engine,
        "admin-ban-security@example.com",
    )

    register_user(client, "banned-access@example.com")

    user_token = login_and_get_token(
        client,
        "banned-access@example.com",
    )

    db_session = sessionmaker(bind=test_engine)()

    try:
        target = db_session.query(User).filter(
            User.email == "banned-access@example.com"
        ).first()

        target_id = target.id
    finally:
        db_session.close()

    ban_response = client.patch(
        f"/api/admin/users/{target_id}/ban",
        json={
            "is_banned": True,
            "reason": "Testing session invalidation",
        },
        headers=auth_headers(admin_token),
    )

    assert ban_response.status_code == 200, ban_response.text

    protected_response = client.get(
        "/api/auth/me",
        headers=auth_headers(user_token),
    )

    assert protected_response.status_code == 403

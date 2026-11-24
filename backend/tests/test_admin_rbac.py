
from sqlalchemy.orm import sessionmaker

from backend.models import User, AuditLog


TEST_PASSWORD = "TestPassword123"


# ========================================
# TEST HELPERS
# ========================================

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
        user = db.query(User).filter(
            User.email == email
        ).first()

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


# ========================================
# ADMIN ACCESS CONTROL
# ========================================

def test_guest_cannot_access_admin_users(client):
    response = client.get("/api/admin/users")

    assert response.status_code == 401


def test_user_cannot_access_admin_users(client):
    register_user(
        client,
        "normal-admin-test@example.com",
    )

    token = login_and_get_token(
        client,
        "normal-admin-test@example.com",
    )

    response = client.get(
        "/api/admin/users",
        headers=auth_headers(token),
    )

    assert response.status_code == 403


def test_moderator_cannot_access_admin_users(
    client,
    test_engine,
):
    register_user(
        client,
        "moderator-admin-test@example.com",
    )

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


def test_admin_can_access_admin_users(
    client,
    test_engine,
):
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


def test_admin_can_access_dashboard_stats(
    client,
    test_engine,
):
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


# ========================================
# AUDIT LOGS AND SECURITY MONITORING
# ========================================

def test_admin_can_view_audit_logs(
    client,
    test_engine,
):
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


def test_admin_can_export_audit_logs(
    client,
    test_engine,
):
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


def test_admin_can_view_failed_login_monitoring(
    client,
    test_engine,
):
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


# ========================================
# ADMIN SELF-PROTECTION
# ========================================

def test_admin_cannot_change_own_role(
    client,
    test_engine,
):
    token = create_admin(
        client,
        test_engine,
        "admin-self-role@example.com",
    )

    admin_id = get_user_id(
        test_engine,
        "admin-self-role@example.com",
    )

    response = client.patch(
        f"/api/admin/users/{admin_id}/role",
        json={"role": "user"},
        headers=auth_headers(token),
    )

    assert response.status_code in (400, 403)


def test_admin_cannot_ban_self(
    client,
    test_engine,
):
    token = create_admin(
        client,
        test_engine,
        "admin-self-ban@example.com",
    )

    admin_id = get_user_id(
        test_engine,
        "admin-self-ban@example.com",
    )

    response = client.patch(
        f"/api/admin/users/{admin_id}/ban",
        json={
            "is_banned": True,
            "reason": "Self-ban test",
        },
        headers=auth_headers(token),
    )

    assert response.status_code in (400, 403)


# ========================================
# USER ROLE MANAGEMENT
# ========================================

def test_admin_can_change_user_role(
    client,
    test_engine,
):
    admin_token = create_admin(
        client,
        test_engine,
        "admin-change-role@example.com",
    )

    register_user(
        client,
        "target-role@example.com",
    )

    target_id = get_user_id(
        test_engine,
        "target-role@example.com",
    )

    response = client.patch(
        f"/api/admin/users/{target_id}/role",
        json={"role": "moderator"},
        headers=auth_headers(admin_token),
    )

    assert response.status_code == 200, response.text
    assert response.json()["role"] == "moderator"


# ========================================
# SINGLE USER BAN / UNBAN
# ========================================

def test_admin_can_ban_user(
    client,
    test_engine,
):
    admin_token = create_admin(
        client,
        test_engine,
        "admin-ban-user@example.com",
    )

    register_user(
        client,
        "target-ban@example.com",
    )

    target_id = get_user_id(
        test_engine,
        "target-ban@example.com",
    )

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

    register_user(
        client,
        "banned-access@example.com",
    )

    user_token = login_and_get_token(
        client,
        "banned-access@example.com",
    )

    target_id = get_user_id(
        test_engine,
        "banned-access@example.com",
    )

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


# ========================================
# BULK BAN / UNBAN HELPERS
# ========================================

# ========================================
# BULK BAN USERS
# ========================================

def test_admin_can_bulk_ban_users(
    client,
    test_engine,
):
    admin_token = create_admin(
        client,
        test_engine,
        "bulk-admin@example.com",
    )

    register_user(client, "bulk-target-one@example.com")
    register_user(client, "bulk-target-two@example.com")

    first_id = get_user_id(
        test_engine,
        "bulk-target-one@example.com",
    )

    second_id = get_user_id(
        test_engine,
        "bulk-target-two@example.com",
    )

    response = client.patch(
        "/api/admin/users/bulk-ban",
        json={
            "user_ids": [first_id, second_id],
            "is_banned": True,
            "reason": "Community guidelines violation",
        },
        headers=auth_headers(admin_token),
    )

    assert response.status_code == 200, response.text

    data = response.json()

    assert data["requested_count"] == 2
    assert data["updated_count"] == 2
    assert data["skipped_count"] == 0
    assert data["skipped_user_ids"] == []

    db = sessionmaker(bind=test_engine)()

    try:
        users = db.query(User).filter(
            User.id.in_([first_id, second_id])
        ).all()

        assert len(users) == 2

        for user in users:
            assert user.is_banned is True
            assert user.ban_reason == (
                "Community guidelines violation"
            )

    finally:
        db.close()


# ========================================
# BULK UNBAN USERS
# ========================================

def test_admin_can_bulk_unban_users(
    client,
    test_engine,
):
    admin_token = create_admin(
        client,
        test_engine,
        "bulk-unban-admin@example.com",
    )

    register_user(client, "bulk-unban-one@example.com")
    register_user(client, "bulk-unban-two@example.com")

    first_id = get_user_id(
        test_engine,
        "bulk-unban-one@example.com",
    )

    second_id = get_user_id(
        test_engine,
        "bulk-unban-two@example.com",
    )

    db = sessionmaker(bind=test_engine)()

    try:
        users = db.query(User).filter(
            User.id.in_([first_id, second_id])
        ).all()

        for user in users:
            user.is_banned = True
            user.ban_reason = "Previous violation"

        db.commit()

    finally:
        db.close()

    response = client.patch(
        "/api/admin/users/bulk-ban",
        json={
            "user_ids": [first_id, second_id],
            "is_banned": False,
        },
        headers=auth_headers(admin_token),
    )

    assert response.status_code == 200, response.text

    data = response.json()

    assert data["updated_count"] == 2
    assert data["skipped_count"] == 0

    db = sessionmaker(bind=test_engine)()

    try:
        users = db.query(User).filter(
            User.id.in_([first_id, second_id])
        ).all()

        for user in users:
            assert user.is_banned is False
            assert user.ban_reason is None
            assert user.banned_at is None

    finally:
        db.close()


# ========================================
# BULK BAN SKIPPED USERS
# SINGLE ADMIN RULE
# ========================================

def test_bulk_ban_skips_admins_missing_and_already_banned_users(
    client,
    test_engine,
):
    # Create the ONLY Admin account.
    admin_token = create_admin(
        client,
        test_engine,
        "bulk-skip-admin@example.com",
    )

    register_user(
        client,
        "bulk-skip-target@example.com",
    )

    register_user(
        client,
        "bulk-already-banned@example.com",
    )

    target_id = get_user_id(
        test_engine,
        "bulk-skip-target@example.com",
    )

    already_banned_id = get_user_id(
        test_engine,
        "bulk-already-banned@example.com",
    )

    # Use the existing Admin ID.
    # Never create a second Admin.
    admin_id = get_user_id(
        test_engine,
        "bulk-skip-admin@example.com",
    )

    db = sessionmaker(bind=test_engine)()

    try:
        already_banned = db.get(
            User,
            already_banned_id,
        )

        already_banned.is_banned = True
        already_banned.ban_reason = "Previous violation"

        db.commit()

    finally:
        db.close()

    missing_id = 999999999

    response = client.patch(
        "/api/admin/users/bulk-ban",
        json={
            "user_ids": [
                target_id,
                admin_id,
                missing_id,
                already_banned_id,
            ],
            "is_banned": True,
            "reason": "Bulk moderation test",
        },
        headers=auth_headers(admin_token),
    )

    assert response.status_code == 200, response.text

    data = response.json()

    assert data["requested_count"] == 4
    assert data["updated_count"] == 1
    assert data["skipped_count"] == 3

    assert set(data["skipped_user_ids"]) == {
        admin_id,
        missing_id,
        already_banned_id,
    }

    db = sessionmaker(bind=test_engine)()

    try:
        assert db.get(User, admin_id).is_banned is False
        assert db.get(User, target_id).is_banned is True
        assert db.get(User, already_banned_id).is_banned is True

    finally:
        db.close()


# ========================================
# BULK BAN SESSION REVOCATION
# ========================================

def test_bulk_ban_revokes_user_sessions(
    client,
    test_engine,
):
    admin_token = create_admin(
        client,
        test_engine,
        "bulk-session-admin@example.com",
    )

    register_user(
        client,
        "bulk-session-target@example.com",
    )

    user_token = login_and_get_token(
        client,
        "bulk-session-target@example.com",
    )

    target_id = get_user_id(
        test_engine,
        "bulk-session-target@example.com",
    )

    response = client.patch(
        "/api/admin/users/bulk-ban",
        json={
            "user_ids": [target_id],
            "is_banned": True,
            "reason": "Session revocation test",
        },
        headers=auth_headers(admin_token),
    )

    assert response.status_code == 200, response.text

    protected_response = client.get(
        "/api/auth/me",
        headers=auth_headers(user_token),
    )

    assert protected_response.status_code == 403


# ========================================
# BULK BAN AUDIT LOGS
# ========================================

def test_bulk_ban_creates_audit_logs(
    client,
    test_engine,
):
    admin_token = create_admin(
        client,
        test_engine,
        "bulk-audit-admin@example.com",
    )

    register_user(
        client,
        "bulk-audit-target@example.com",
    )

    target_id = get_user_id(
        test_engine,
        "bulk-audit-target@example.com",
    )

    response = client.patch(
        "/api/admin/users/bulk-ban",
        json={
            "user_ids": [target_id],
            "is_banned": True,
            "reason": "Audit verification",
        },
        headers=auth_headers(admin_token),
    )

    assert response.status_code == 200, response.text

    db = sessionmaker(bind=test_engine)()

    try:
        audit = db.query(AuditLog).filter(
            AuditLog.target_id == str(target_id),
            AuditLog.action == "user_banned",
        ).first()

        assert audit is not None
        assert audit.action == "user_banned"
        assert audit.details["bulk_action"] is True
        assert audit.details["reason"] == "Audit verification"

    finally:
        db.close()


# ========================================
# NON-ADMIN CANNOT BULK BAN
# ========================================

def test_user_and_moderator_cannot_bulk_ban_users(
    client,
    test_engine,
):
    register_user(
        client,
        "bulk-normal-user@example.com",
    )

    user_token = login_and_get_token(
        client,
        "bulk-normal-user@example.com",
    )

    user_response = client.patch(
        "/api/admin/users/bulk-ban",
        json={
            "user_ids": [2],
            "is_banned": True,
            "reason": "Unauthorized test",
        },
        headers=auth_headers(user_token),
    )

    assert user_response.status_code == 403

    register_user(
        client,
        "bulk-moderator@example.com",
    )

    change_user_role(
        test_engine,
        "bulk-moderator@example.com",
        "moderator",
    )

    moderator_token = login_and_get_token(
        client,
        "bulk-moderator@example.com",
    )

    moderator_response = client.patch(
        "/api/admin/users/bulk-ban",
        json={
            "user_ids": [2],
            "is_banned": True,
            "reason": "Unauthorized test",
        },
        headers=auth_headers(moderator_token),
    )

    assert moderator_response.status_code == 403


# ========================================
# BULK BAN VALIDATION
# ========================================

def test_bulk_ban_rejects_duplicate_user_ids(
    client,
    test_engine,
):
    admin_token = create_admin(
        client,
        test_engine,
        "bulk-duplicate-admin@example.com",
    )

    register_user(
        client,
        "bulk-duplicate-target@example.com",
    )

    target_id = get_user_id(
        test_engine,
        "bulk-duplicate-target@example.com",
    )

    response = client.patch(
        "/api/admin/users/bulk-ban",
        json={
            "user_ids": [target_id, target_id],
            "is_banned": True,
            "reason": "Duplicate ID test",
        },
        headers=auth_headers(admin_token),
    )

    assert response.status_code == 422

from datetime import datetime, timedelta, timezone

import pytest
from fastapi import HTTPException
from sqlalchemy.orm import sessionmaker

from backend.models import LoginRateLimit
from backend.services.auth_service import (
    check_login_rate_limit,
    hash_login_identifier,
    record_failed_login,
)
def test_register_user(client):
    response = client.post(
        "/api/auth/register",
        json={
            "full_name": "Test User",
            "email": "testuser@example.com",
            "password": "TestPassword123",
            "role": "admin",
        },
    )

    assert response.status_code == 201

    data = response.json()

    assert data["full_name"] == "Test User"
    assert data["email"] == "testuser@example.com"

    # Public registration must never grant admin privileges.
    assert data["role"] == "user"


def test_login_creates_http_only_refresh_cookie(client):
    client.post(
        "/api/auth/register",
        json={
            "full_name": "Login Test",
            "email": "login@example.com",
            "password": "TestPassword123",
        },
    )

    response = client.post(
        "/api/auth/login",
        json={
            "email": "login@example.com",
            "password": "TestPassword123",
        },
    )

    assert response.status_code == 200
    assert response.json()["access_token"]
    assert response.json()["token_type"] == "bearer"

    cookie = response.headers.get("set-cookie", "").lower()

    assert "warmshare_refresh_token=" in cookie
    assert "httponly" in cookie
    assert "samesite=lax" in cookie
    assert "path=/api/auth" in cookie

    # Refresh tokens must not be exposed in the response body.
    assert "refresh_token" not in response.json()


def test_login_rejects_incorrect_password(client):
    client.post(
        "/api/auth/register",
        json={
            "full_name": "Login Test",
            "email": "wrongpassword@example.com",
            "password": "TestPassword123",
        },
    )

    response = client.post(
        "/api/auth/login",
        json={
            "email": "wrongpassword@example.com",
            "password": "IncorrectPassword123",
        },
    )

    assert response.status_code == 401


def test_refresh_rotates_refresh_token(client):
    client.post(
        "/api/auth/register",
        json={
            "full_name": "Refresh Test",
            "email": "refresh@example.com",
            "password": "TestPassword123",
        },
    )

    login_response = client.post(
        "/api/auth/login",
        json={
            "email": "refresh@example.com",
            "password": "TestPassword123",
        },
    )

    assert login_response.status_code == 200

    old_refresh_token = login_response.cookies.get(
        "warmshare_refresh_token"
    )

    assert old_refresh_token is not None

    refresh_response = client.post("/api/auth/refresh")

    assert refresh_response.status_code == 200
    assert refresh_response.json()["access_token"]
    assert refresh_response.json()["token_type"] == "bearer"

    new_refresh_token = refresh_response.cookies.get(
        "warmshare_refresh_token"
    )

    assert new_refresh_token is not None
    assert new_refresh_token != old_refresh_token

    assert "refresh_token" not in refresh_response.json()


def test_logout_revokes_session_and_clears_cookie(client):
    client.post(
        "/api/auth/register",
        json={
            "full_name": "Logout Test",
            "email": "logout@example.com",
            "password": "TestPassword123",
        },
    )

    login_response = client.post(
        "/api/auth/login",
        json={
            "email": "logout@example.com",
            "password": "TestPassword123",
        },
    )

    assert login_response.status_code == 200

    access_token = login_response.json()["access_token"]

    sessions_response = client.get(
        "/api/auth/sessions",
        headers={
            "Authorization": f"Bearer {access_token}",
        },
    )

    assert sessions_response.status_code == 200
    assert len(sessions_response.json()) == 1

    logout_response = client.post("/api/auth/logout")

    assert logout_response.status_code == 200
    assert logout_response.json()["message"] == "Logged out successfully"

    cookie = logout_response.headers.get("set-cookie", "").lower()

    assert "warmshare_refresh_token=" in cookie
    assert "max-age=0" in cookie

    # The previous access token must no longer work.
    profile_response = client.get(
        "/api/auth/me",
        headers={
            "Authorization": f"Bearer {access_token}",
        },
    )

    assert profile_response.status_code == 401


def test_user_can_revoke_own_session(client):
    client.post(
        "/api/auth/register",
        json={
            "full_name": "Session Owner",
            "email": "owner@example.com",
            "password": "TestPassword123",
        },
    )

    login_response = client.post(
        "/api/auth/login",
        json={
            "email": "owner@example.com",
            "password": "TestPassword123",
        },
    )

    assert login_response.status_code == 200

    token = login_response.json()["access_token"]

    sessions_response = client.get(
        "/api/auth/sessions",
        headers={
            "Authorization": f"Bearer {token}",
        },
    )

    assert sessions_response.status_code == 200
    assert len(sessions_response.json()) == 1

    session_id = sessions_response.json()[0]["id"]

    revoke_response = client.delete(
        f"/api/auth/sessions/{session_id}",
        headers={
            "Authorization": f"Bearer {token}",
        },
    )

    assert revoke_response.status_code == 200

    profile_response = client.get(
        "/api/auth/me",
        headers={
            "Authorization": f"Bearer {token}",
        },
    )

    assert profile_response.status_code == 401


def test_user_cannot_revoke_another_users_session(client):
    first_register = client.post(
        "/api/auth/register",
        json={
            "full_name": "First User",
            "email": "first@example.com",
            "password": "TestPassword123",
        },
    )

    second_register = client.post(
        "/api/auth/register",
        json={
            "full_name": "Second User",
            "email": "second@example.com",
            "password": "TestPassword123",
        },
    )

    assert first_register.status_code == 201, first_register.text
    assert second_register.status_code == 201, second_register.text

    first_login = client.post(
        "/api/auth/login",
        json={
            "email": "first@example.com",
            "password": "TestPassword123",
        },
    )

    second_login = client.post(
        "/api/auth/login",
        json={
            "email": "second@example.com",
            "password": "TestPassword123",
        },
    )

    assert first_login.status_code == 200, first_login.text
    assert second_login.status_code == 200, second_login.text

    first_token = first_login.json()["access_token"]
    second_token = second_login.json()["access_token"]

    second_sessions = client.get(
        "/api/auth/sessions",
        headers={
            "Authorization": f"Bearer {second_token}",
        },
    )

    assert second_sessions.status_code == 200, second_sessions.text
    assert len(second_sessions.json()) == 1

    second_session_id = second_sessions.json()[0]["id"]

    response = client.delete(
        f"/api/auth/sessions/{second_session_id}",
        headers={
            "Authorization": f"Bearer {first_token}",
        },
    )

    assert response.status_code == 404

def test_login_rate_limit_blocks_after_five_failed_attempts(client):
    client.post(
        "/api/auth/register",
        json={
            "full_name": "Rate Limit Test",
            "email": "ratelimit@example.com",
            "password": "TestPassword123",
        },
    )

    login_data = {
        "email": "ratelimit@example.com",
        "password": "WrongPassword123",
    }

    # The first five failed attempts return 401.
    for attempt in range(5):
        response = client.post(
            "/api/auth/login",
            json=login_data,
        )

        assert response.status_code == 401

    # The next attempt is blocked by the rate limiter.
    blocked_response = client.post(
        "/api/auth/login",
        json=login_data,
    )

    assert blocked_response.status_code == 429


def test_successful_login_resets_failed_attempts(client):
    client.post(
        "/api/auth/register",
        json={
            "full_name": "Rate Reset Test",
            "email": "ratereset@example.com",
            "password": "TestPassword123",
        },
    )

    # Make four failed login attempts.
    for attempt in range(4):
        response = client.post(
            "/api/auth/login",
            json={
                "email": "ratereset@example.com",
                "password": "WrongPassword123",
            },
        )

        assert response.status_code == 401

    # A successful login should clear the failed-attempt counter.
    successful_response = client.post(
        "/api/auth/login",
        json={
            "email": "ratereset@example.com",
            "password": "TestPassword123",
        },
    )

    assert successful_response.status_code == 200

    # Four new failed attempts should still be allowed.
    for attempt in range(4):
        response = client.post(
            "/api/auth/login",
            json={
                "email": "ratereset@example.com",
                "password": "WrongPassword123",
            },
        )

        assert response.status_code == 401

    # The fifth new failure is recorded.
    fifth_response = client.post(
        "/api/auth/login",
        json={
            "email": "ratereset@example.com",
            "password": "WrongPassword123",
        },
    )

    assert fifth_response.status_code == 401

    # The following attempt is blocked.
    blocked_response = client.post(
        "/api/auth/login",
        json={
            "email": "ratereset@example.com",
            "password": "WrongPassword123",
        },
    )

    assert blocked_response.status_code == 429


def test_login_rate_limit_expires_after_cooldown(test_engine, monkeypatch):
    monkeypatch.setenv(
        "LOGIN_RATE_LIMIT_SECRET",
        "test-only-rate-limit-secret-not-for-production",
    )

    TestingSessionLocal = sessionmaker(
        bind=test_engine,
        autoflush=False,
        autocommit=False,
    )
    db = TestingSessionLocal()

    email = "cooldown@example.com"
    now = datetime(2026, 1, 1, 12, 0, tzinfo=timezone.utc)

    try:
        # Record five failed attempts at the same controlled time.
        for attempt in range(5):
            record_failed_login(email, db, now)

        # The account must remain blocked before cooldown expiration.
        with pytest.raises(HTTPException) as blocked_error:
            check_login_rate_limit(
                email,
                db,
                now + timedelta(minutes=14),
            )

        assert blocked_error.value.status_code == 429

        # After 15 minutes, the rate limiter must allow another attempt.
        after_cooldown = now + timedelta(minutes=16)

        check_login_rate_limit(email, db, after_cooldown)

        # The next failed attempt must start a fresh counter.
        record_failed_login(email, db, after_cooldown)

        rate_limit = db.get(
            LoginRateLimit,
            hash_login_identifier(email),
        )

        assert rate_limit.failed_attempts == 1
        assert rate_limit.blocked_until is None

    finally:
        db.close()

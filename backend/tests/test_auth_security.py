from datetime import datetime, timedelta, timezone

import jwt

from sqlalchemy.orm import sessionmaker

from backend.models import User, UserSession, RefreshToken
from backend.services.auth_service import hash_refresh_token


TEST_SECRET = "test-only-secret-key-not-for-production"
COOKIE_NAME = "warmshare_refresh_token"


def register_and_login(client, email):
    register_response = client.post(
        "/api/auth/register",
        json={
            "full_name": "Security Test User",
            "email": email,
            "password": "TestPassword123",
        },
    )

    assert register_response.status_code == 201, register_response.text

    login_response = client.post(
        "/api/auth/login",
        json={
            "email": email,
            "password": "TestPassword123",
        },
    )

    assert login_response.status_code == 200, login_response.text

    return login_response


def update_user(test_engine, email, **changes):
    TestingSessionLocal = sessionmaker(bind=test_engine)
    db = TestingSessionLocal()

    try:
        user = db.query(User).filter(User.email == email).first()

        assert user is not None

        for field, value in changes.items():
            setattr(user, field, value)

        db.commit()
    finally:
        db.close()


def get_session_id(test_engine, refresh_token):
    TestingSessionLocal = sessionmaker(bind=test_engine)
    db = TestingSessionLocal()

    try:
        token_hash = hash_refresh_token(refresh_token)

        token_record = db.query(RefreshToken).filter(
            RefreshToken.token_hash == token_hash
        ).first()

        assert token_record is not None

        return token_record.session_id
    finally:
        db.close()


def test_missing_access_token_returns_401(client):
    response = client.get("/api/auth/me")

    assert response.status_code == 401


def test_invalid_access_token_returns_401(client):
    response = client.get(
        "/api/auth/me",
        headers={"Authorization": "Bearer invalid-token"},
    )

    assert response.status_code == 401


def test_tampered_access_token_returns_401(client):
    login_response = register_and_login(
        client,
        "tampered@example.com",
    )

    token = login_response.json()["access_token"]

    tampered_token = token[:-1] + (
        "A" if token[-1] != "A" else "B"
    )

    response = client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {tampered_token}"},
    )

    assert response.status_code == 401


def test_expired_access_token_returns_401(client, test_engine):
    login_response = register_and_login(
        client,
        "expired@example.com",
    )

    refresh_token = login_response.cookies.get(COOKIE_NAME)
    profile_response = client.get(
        "/api/auth/me",
        headers={
            "Authorization": (
                f"Bearer {login_response.json()['access_token']}"
            ),
        },
    )

    assert profile_response.status_code == 200

    user = profile_response.json()
    session_id = get_session_id(test_engine, refresh_token)

    now = datetime.now(timezone.utc)

    expired_payload = {
        "sub": str(user["id"]),
        "role": user["role"],
        "sid": session_id,
        "iat": now - timedelta(minutes=20),
        "exp": now - timedelta(minutes=5),
        "jti": "expired-test-token",
    }

    expired_token = jwt.encode(
        expired_payload,
        TEST_SECRET,
        algorithm="HS256",
    )

    response = client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {expired_token}"},
    )

    assert response.status_code == 401


def test_banned_user_cannot_use_existing_access_token(
    client,
    test_engine,
):
    login_response = register_and_login(
        client,
        "banned-access@example.com",
    )

    access_token = login_response.json()["access_token"]

    update_user(
        test_engine,
        "banned-access@example.com",
        is_banned=True,
        ban_reason="Test ban",
        banned_at=datetime.now(timezone.utc),
    )

    response = client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {access_token}"},
    )

    assert response.status_code == 403


def test_banned_user_cannot_refresh_session(client, test_engine):
    register_and_login(
        client,
        "banned-refresh@example.com",
    )

    update_user(
        test_engine,
        "banned-refresh@example.com",
        is_banned=True,
        ban_reason="Test ban",
        banned_at=datetime.now(timezone.utc),
    )

    response = client.post("/api/auth/refresh")

    assert response.status_code == 403
    assert "suspended" in response.json()["detail"].lower()

    cookie = response.headers.get("set-cookie", "").lower()

    assert "max-age=0" in cookie


def test_refresh_token_replay_revokes_session(client):
    login_response = register_and_login(
        client,
        "replay@example.com",
    )

    old_refresh_token = login_response.cookies.get(COOKIE_NAME)

    assert old_refresh_token is not None

    first_refresh = client.post("/api/auth/refresh")

    assert first_refresh.status_code == 200

    current_refresh_token = first_refresh.cookies.get(COOKIE_NAME)

    assert current_refresh_token is not None
    assert current_refresh_token != old_refresh_token

    replay_response = client.post(
        "/api/auth/refresh",
        cookies={COOKIE_NAME: old_refresh_token},
    )

    assert replay_response.status_code == 401
    assert "reuse detected" in replay_response.json()["detail"].lower()

    revoked_response = client.post(
        "/api/auth/refresh",
        cookies={COOKIE_NAME: current_refresh_token},
    )

    assert revoked_response.status_code == 401


def test_role_change_invalidates_old_access_token(client, test_engine):
    login_response = register_and_login(
        client,
        "role-change@example.com",
    )

    old_access_token = login_response.json()["access_token"]

    update_user(
        test_engine,
        "role-change@example.com",
        role="moderator",
    )

    response = client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {old_access_token}"},
    )

    assert response.status_code == 401
    assert "permissions have changed" in response.json()["detail"].lower()


def test_missing_refresh_cookie_returns_401_and_clears_cookie(client):
    client.cookies.clear()

    response = client.post("/api/auth/refresh")

    assert response.status_code == 401
    assert "missing" in response.json()["detail"].lower()

    cookie = response.headers.get("set-cookie", "").lower()

    assert COOKIE_NAME in cookie
    assert "max-age=0" in cookie

def test_expired_refresh_session_is_rejected_and_revoked(
    client,
    test_engine,
):
    login_response = register_and_login(
        client,
        "expired-session@example.com",
    )

    refresh_token = login_response.cookies.get(COOKIE_NAME)

    assert refresh_token is not None

    session_id = get_session_id(
        test_engine,
        refresh_token,
    )

    # Expire the session in the test database.
    update_user_session_expiry = datetime.now(
        timezone.utc
    ) - timedelta(minutes=1)

    TestingSessionLocal = sessionmaker(bind=test_engine)
    db = TestingSessionLocal()

    try:
        user_session = db.get(UserSession, session_id)

        assert user_session is not None

        user_session.expires_at = update_user_session_expiry

        db.commit()
    finally:
        db.close()

    # An expired session must not be refreshed.
    response = client.post("/api/auth/refresh")

    assert response.status_code == 401
    assert "expired" in response.json()["detail"].lower()

    # The refresh cookie must be cleared.
    cookie = response.headers.get("set-cookie", "").lower()

    assert COOKIE_NAME in cookie
    assert "max-age=0" in cookie

    # The session must also be revoked.
    db = TestingSessionLocal()

    try:
        user_session = db.get(UserSession, session_id)

        assert user_session is not None
        assert user_session.revoked_at is not None
    finally:
        db.close()

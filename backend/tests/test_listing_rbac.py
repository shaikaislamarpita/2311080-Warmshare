
from sqlalchemy.orm import sessionmaker

from backend.models import User


LISTING_DATA = {
    "title": "Warm winter jacket",
    "category": "jacket",
    "size": "M",
    "age_group": "adult",
    "gender": "unisex",
    "condition": "good",
    "quantity": 2,
    "pickup_address": "Dhanmondi, Dhaka",
}


def register_user(client, email):
    response = client.post(
        "/api/auth/register",
        json={
            "full_name": "Listing Test User",
            "email": email,
            "password": "TestPassword123",
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
            "password": "TestPassword123",
        },
    )

    assert response.status_code == 200, response.text

    return response.json()["access_token"]


def auth_headers(token):
    return {"Authorization": f"Bearer {token}"}


def create_listing(client, token):
    return client.post(
        "/api/listings",
        json=LISTING_DATA,
        headers=auth_headers(token),
    )


def test_user_can_create_listing(client):
    register_user(client, "create-user@example.com")

    token = login_and_get_token(
        client,
        "create-user@example.com",
    )

    response = create_listing(client, token)

    assert response.status_code == 201, response.text
    assert response.json()["title"] == LISTING_DATA["title"]


def test_moderator_can_create_listing(client, test_engine):
    register_user(client, "create-moderator@example.com")

    change_user_role(
        test_engine,
        "create-moderator@example.com",
        "moderator",
    )

    token = login_and_get_token(
        client,
        "create-moderator@example.com",
    )

    response = create_listing(client, token)

    assert response.status_code == 201, response.text


def test_admin_can_create_listing(client, test_engine):
    register_user(client, "create-admin@example.com")

    change_user_role(
        test_engine,
        "create-admin@example.com",
        "admin",
    )

    token = login_and_get_token(
        client,
        "create-admin@example.com",
    )

    response = create_listing(client, token)

    assert response.status_code == 201, response.text


def test_guest_cannot_create_listing(client):
    response = client.post(
        "/api/listings",
        json=LISTING_DATA,
    )

    assert response.status_code == 401


def test_listings_are_publicly_readable(client):
    register_user(client, "public-read@example.com")

    token = login_and_get_token(
        client,
        "public-read@example.com",
    )

    created = create_listing(client, token)

    assert created.status_code == 201

    list_response = client.get("/api/listings")

    assert list_response.status_code == 200
    assert len(list_response.json()) == 1

    listing_id = created.json()["id"]

    detail_response = client.get(
        f"/api/listings/{listing_id}"
    )

    assert detail_response.status_code == 200
    assert detail_response.json()["id"] == listing_id


def test_owner_can_update_own_listing(client):
    register_user(client, "update-owner@example.com")

    token = login_and_get_token(
        client,
        "update-owner@example.com",
    )

    created = create_listing(client, token)

    assert created.status_code == 201

    listing_id = created.json()["id"]

    updated_data = {
        **LISTING_DATA,
        "title": "Updated winter jacket",
    }

    response = client.put(
        f"/api/listings/{listing_id}",
        json=updated_data,
        headers=auth_headers(token),
    )

    assert response.status_code == 200, response.text
    assert response.json()["title"] == "Updated winter jacket"


def test_user_cannot_update_another_users_listing(client):
    register_user(client, "listing-owner@example.com")
    register_user(client, "listing-other@example.com")

    owner_token = login_and_get_token(
        client,
        "listing-owner@example.com",
    )

    other_token = login_and_get_token(
        client,
        "listing-other@example.com",
    )

    created = create_listing(client, owner_token)

    assert created.status_code == 201

    listing_id = created.json()["id"]

    updated_data = {
        **LISTING_DATA,
        "title": "Unauthorized title change",
    }

    response = client.put(
        f"/api/listings/{listing_id}",
        json=updated_data,
        headers=auth_headers(other_token),
    )

    assert response.status_code == 403


def test_user_cannot_delete_another_users_listing(client):
    register_user(client, "delete-owner@example.com")
    register_user(client, "delete-other@example.com")

    owner_token = login_and_get_token(
        client,
        "delete-owner@example.com",
    )

    other_token = login_and_get_token(
        client,
        "delete-other@example.com",
    )

    created = create_listing(client, owner_token)

    assert created.status_code == 201

    listing_id = created.json()["id"]

    response = client.delete(
        f"/api/listings/{listing_id}",
        headers=auth_headers(other_token),
    )

    assert response.status_code == 403

    detail_response = client.get(
        f"/api/listings/{listing_id}"
    )

    assert detail_response.status_code == 200


def test_owner_can_delete_own_listing(client):
    register_user(client, "delete-own@example.com")

    token = login_and_get_token(
        client,
        "delete-own@example.com",
    )

    created = create_listing(client, token)

    assert created.status_code == 201

    listing_id = created.json()["id"]

    response = client.delete(
        f"/api/listings/{listing_id}",
        headers=auth_headers(token),
    )

    assert response.status_code == 204

    detail_response = client.get(
        f"/api/listings/{listing_id}"
    )

    assert detail_response.status_code == 404


def test_guest_cannot_update_or_delete_listing(client):
    register_user(client, "guest-protection@example.com")

    token = login_and_get_token(
        client,
        "guest-protection@example.com",
    )

    created = create_listing(client, token)

    assert created.status_code == 201

    listing_id = created.json()["id"]

    update_response = client.put(
        f"/api/listings/{listing_id}",
        json=LISTING_DATA,
    )

    delete_response = client.delete(
        f"/api/listings/{listing_id}"
    )

    assert update_response.status_code == 401
    assert delete_response.status_code == 401


def test_listing_owner_cannot_be_changed_through_update(client):
    register_user(client, "immutable-owner@example.com")
    register_user(client, "new-owner@example.com")

    owner_token = login_and_get_token(
        client,
        "immutable-owner@example.com",
    )

    other_token = login_and_get_token(
        client,
        "new-owner@example.com",
    )

    created = create_listing(client, owner_token)

    assert created.status_code == 201

    listing_id = created.json()["id"]
    original_owner_id = created.json()["owner_id"]

    updated_data = {
        **LISTING_DATA,
        "title": "Updated without changing owner",
        "owner_id": 999999,
    }

    response = client.put(
        f"/api/listings/{listing_id}",
        json=updated_data,
        headers=auth_headers(owner_token),
    )

    assert response.status_code == 200, response.text
    assert response.json()["owner_id"] == original_owner_id

    other_response = client.put(
        f"/api/listings/{listing_id}",
        json=LISTING_DATA,
        headers=auth_headers(other_token),
    )

    assert other_response.status_code == 403


def test_moderator_can_update_own_listing(client, test_engine):
    register_user(client, "moderator-update@example.com")

    change_user_role(
        test_engine,
        "moderator-update@example.com",
        "moderator",
    )

    token = login_and_get_token(
        client,
        "moderator-update@example.com",
    )

    created = create_listing(client, token)

    assert created.status_code == 201

    response = client.put(
        f"/api/listings/{created.json()['id']}",
        json={
            **LISTING_DATA,
            "title": "Moderator updated listing",
        },
        headers=auth_headers(token),
    )

    assert response.status_code == 200, response.text
    assert response.json()["title"] == "Moderator updated listing"


def test_admin_can_update_own_listing(client, test_engine):
    register_user(client, "admin-update@example.com")

    change_user_role(
        test_engine,
        "admin-update@example.com",
        "admin",
    )

    token = login_and_get_token(
        client,
        "admin-update@example.com",
    )

    created = create_listing(client, token)

    assert created.status_code == 201

    response = client.put(
        f"/api/listings/{created.json()['id']}",
        json={
            **LISTING_DATA,
            "title": "Admin updated listing",
        },
        headers=auth_headers(token),
    )

    assert response.status_code == 200, response.text


def test_moderator_can_delete_own_listing(client, test_engine):
    register_user(client, "moderator-delete@example.com")

    change_user_role(
        test_engine,
        "moderator-delete@example.com",
        "moderator",
    )

    token = login_and_get_token(
        client,
        "moderator-delete@example.com",
    )

    created = create_listing(client, token)

    assert created.status_code == 201

    response = client.delete(
        f"/api/listings/{created.json()['id']}",
        headers=auth_headers(token),
    )

    assert response.status_code == 204


def test_admin_can_delete_own_listing(client, test_engine):
    register_user(client, "admin-delete@example.com")

    change_user_role(
        test_engine,
        "admin-delete@example.com",
        "admin",
    )

    token = login_and_get_token(
        client,
        "admin-delete@example.com",
    )

    created = create_listing(client, token)

    assert created.status_code == 201

    response = client.delete(
        f"/api/listings/{created.json()['id']}",
        headers=auth_headers(token),
    )

    assert response.status_code == 204

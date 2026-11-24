
from sqlalchemy.orm import sessionmaker

from backend.models import Group, Listing


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


# ========================================
# TEST HELPERS
# ========================================

def register_and_login(client, email):
    response = client.post(
        "/api/auth/register",
        json={
            "full_name": "Group Test User",
            "email": email,
            "password": "TestPassword123",
        },
    )

    assert response.status_code == 201, response.text

    user_id = response.json()["id"]

    login_response = client.post(
        "/api/auth/login",
        json={
            "email": email,
            "password": "TestPassword123",
        },
    )

    assert login_response.status_code == 200, login_response.text

    token = login_response.json()["access_token"]

    return user_id, token


def auth_headers(token):
    return {
        "Authorization": f"Bearer {token}"
    }


def create_group(client, token):
    response = client.post(
        "/api/groups",
        json={
            "name": "Winter Donation Team",
        },
        headers=auth_headers(token),
    )

    assert response.status_code == 201, response.text

    return response.json()["id"]


def add_member(
    client,
    owner_token,
    group_id,
    user_id,
    can_create=False,
    can_edit=False,
    can_assign=False,
):
    response = client.post(
        f"/api/groups/{group_id}/members",
        json={
            "user_id": user_id,
            "can_create": can_create,
            "can_edit": can_edit,
            "can_assign": can_assign,
        },
        headers=auth_headers(owner_token),
    )

    assert response.status_code == 201, response.text

    return response.json()


def create_listing(client, token, group_id=None):
    data = {
        **LISTING_DATA,
    }

    if group_id is not None:
        data["group_id"] = group_id

    return client.post(
        "/api/listings",
        json=data,
        headers=auth_headers(token),
    )


def update_listing(client, token, listing_id, **changes):
    return client.put(
        f"/api/listings/{listing_id}",
        json={
            **LISTING_DATA,
            **changes,
        },
        headers=auth_headers(token),
    )


def create_group_with_users(
    client,
    owner_email,
    member_email,
):
    owner_id, owner_token = register_and_login(
        client,
        owner_email,
    )

    member_id, member_token = register_and_login(
        client,
        member_email,
    )

    group_id = create_group(
        client,
        owner_token,
    )

    return (
        owner_id,
        owner_token,
        member_id,
        member_token,
        group_id,
    )


# ========================================
# GROUP CREATION
# ========================================

def test_user_can_create_group(client):
    user_id, token = register_and_login(
        client,
        "group-owner@example.com",
    )

    response = client.post(
        "/api/groups",
        json={
            "name": "Winter Donation Team",
        },
        headers=auth_headers(token),
    )

    assert response.status_code == 201, response.text
    assert response.json()["name"] == "Winter Donation Team"
    assert response.json()["owner_id"] == user_id


def test_guest_cannot_create_group(client):
    response = client.post(
        "/api/groups",
        json={
            "name": "Unauthorized Team",
        },
    )

    assert response.status_code == 401


# ========================================
# GROUP MEMBER MANAGEMENT
# ========================================

def test_group_owner_can_add_member(client):
    (
        owner_id,
        owner_token,
        member_id,
        member_token,
        group_id,
    ) = create_group_with_users(
        client,
        "add-owner@example.com",
        "add-member@example.com",
    )

    response = client.post(
        f"/api/groups/{group_id}/members",
        json={
            "user_id": member_id,
            "can_create": True,
            "can_edit": False,
            "can_assign": True,
        },
        headers=auth_headers(owner_token),
    )

    assert response.status_code == 201, response.text

    data = response.json()

    assert data["user_id"] == member_id
    assert data["can_create"] is True
    assert data["can_edit"] is False
    assert data["can_assign"] is True


def test_non_owner_cannot_add_group_member(client):
    (
        owner_id,
        owner_token,
        member_id,
        member_token,
        group_id,
    ) = create_group_with_users(
        client,
        "add-denied-owner@example.com",
        "add-denied-member@example.com",
    )

    _, outsider_token = register_and_login(
        client,
        "add-outsider@example.com",
    )

    response = client.post(
        f"/api/groups/{group_id}/members",
        json={
            "user_id": outsider_token and 999999,
            "can_create": True,
            "can_edit": True,
            "can_assign": True,
        },
        headers=auth_headers(member_token),
    )

    assert response.status_code == 403


def test_group_owner_can_update_member_permissions(client):
    (
        owner_id,
        owner_token,
        member_id,
        member_token,
        group_id,
    ) = create_group_with_users(
        client,
        "permission-owner@example.com",
        "permission-member@example.com",
    )

    add_member(
        client,
        owner_token,
        group_id,
        member_id,
    )

    response = client.patch(
        f"/api/groups/{group_id}/members/{member_id}",
        json={
            "can_create": True,
            "can_edit": True,
            "can_assign": False,
        },
        headers=auth_headers(owner_token),
    )

    assert response.status_code == 200, response.text
    assert response.json()["can_create"] is True
    assert response.json()["can_edit"] is True
    assert response.json()["can_assign"] is False


def test_member_cannot_rename_group(client):
    (
        owner_id,
        owner_token,
        member_id,
        member_token,
        group_id,
    ) = create_group_with_users(
        client,
        "rename-owner@example.com",
        "rename-member@example.com",
    )

    add_member(
        client,
        owner_token,
        group_id,
        member_id,
        can_create=True,
    )

    response = client.patch(
        f"/api/groups/{group_id}",
        json={
            "name": "Unauthorized Rename",
        },
        headers=auth_headers(member_token),
    )

    assert response.status_code == 403


# ========================================
# CAN_CREATE PERMISSION
# ========================================

def test_member_with_can_create_can_create_group_listing(client):
    (
        owner_id,
        owner_token,
        member_id,
        member_token,
        group_id,
    ) = create_group_with_users(
        client,
        "create-permission-owner@example.com",
        "create-permission-member@example.com",
    )

    add_member(
        client,
        owner_token,
        group_id,
        member_id,
        can_create=True,
    )

    response = create_listing(
        client,
        member_token,
        group_id,
    )

    assert response.status_code == 201, response.text
    assert response.json()["group_id"] == group_id
    assert response.json()["owner_id"] == member_id


def test_member_without_can_create_cannot_create_group_listing(client):
    (
        owner_id,
        owner_token,
        member_id,
        member_token,
        group_id,
    ) = create_group_with_users(
        client,
        "no-create-owner@example.com",
        "no-create-member@example.com",
    )

    add_member(
        client,
        owner_token,
        group_id,
        member_id,
        can_create=False,
    )

    response = create_listing(
        client,
        member_token,
        group_id,
    )

    assert response.status_code == 403


# ========================================
# CAN_EDIT PERMISSION
# ========================================

def test_member_with_can_edit_can_edit_group_listing(client):
    (
        owner_id,
        owner_token,
        member_id,
        member_token,
        group_id,
    ) = create_group_with_users(
        client,
        "edit-owner@example.com",
        "edit-member@example.com",
    )

    add_member(
        client,
        owner_token,
        group_id,
        member_id,
        can_edit=True,
    )

    # Owner creates the original group donation.
    created = create_listing(
        client,
        owner_token,
        group_id,
    )

    assert created.status_code == 201, created.text

    listing_id = created.json()["id"]

    # Member edits the owner's group donation.
    response = update_listing(
        client,
        member_token,
        listing_id,
        title="Edited by group member",
    )

    assert response.status_code == 200, response.text
    assert response.json()["title"] == "Edited by group member"


def test_member_without_can_edit_cannot_edit_group_listing(client):
    (
        owner_id,
        owner_token,
        member_id,
        member_token,
        group_id,
    ) = create_group_with_users(
        client,
        "no-edit-owner@example.com",
        "no-edit-member@example.com",
    )

    add_member(
        client,
        owner_token,
        group_id,
        member_id,
        can_edit=False,
    )

    created = create_listing(
        client,
        owner_token,
        group_id,
    )

    assert created.status_code == 201, created.text

    response = update_listing(
        client,
        member_token,
        created.json()["id"],
        title="Unauthorized edit",
    )

    assert response.status_code == 403


# ========================================
# CAN_ASSIGN PERMISSION
# ========================================

def test_member_with_can_assign_can_assign_own_listing_to_group(client):
    (
        owner_id,
        owner_token,
        member_id,
        member_token,
        group_id,
    ) = create_group_with_users(
        client,
        "assign-owner@example.com",
        "assign-member@example.com",
    )

    add_member(
        client,
        owner_token,
        group_id,
        member_id,
        can_assign=True,
    )

    # Member creates a personal donation.
    created = create_listing(
        client,
        member_token,
    )

    assert created.status_code == 201, created.text

    listing_id = created.json()["id"]

    # Member assigns their own donation to the group.
    response = update_listing(
        client,
        member_token,
        listing_id,
        group_id=group_id,
    )

    assert response.status_code == 200, response.text
    assert response.json()["group_id"] == group_id
    assert response.json()["owner_id"] == member_id


def test_member_without_can_assign_cannot_assign_listing(client):
    (
        owner_id,
        owner_token,
        member_id,
        member_token,
        group_id,
    ) = create_group_with_users(
        client,
        "no-assign-owner@example.com",
        "no-assign-member@example.com",
    )

    add_member(
        client,
        owner_token,
        group_id,
        member_id,
        can_assign=False,
    )

    created = create_listing(
        client,
        member_token,
    )

    assert created.status_code == 201, created.text

    response = update_listing(
        client,
        member_token,
        created.json()["id"],
        group_id=group_id,
    )

    assert response.status_code == 403


# ========================================
# GROUP ACCESS PROTECTION
# ========================================

def test_non_member_cannot_view_group_details(client):
    (
        owner_id,
        owner_token,
        member_id,
        member_token,
        group_id,
    ) = create_group_with_users(
        client,
        "access-owner@example.com",
        "access-member@example.com",
    )

    _, outsider_token = register_and_login(
        client,
        "access-outsider@example.com",
    )

    response = client.get(
        f"/api/groups/{group_id}",
        headers=auth_headers(outsider_token),
    )

    assert response.status_code == 403


def test_member_can_view_group_details(client):
    (
        owner_id,
        owner_token,
        member_id,
        member_token,
        group_id,
    ) = create_group_with_users(
        client,
        "details-owner@example.com",
        "details-member@example.com",
    )

    add_member(
        client,
        owner_token,
        group_id,
        member_id,
    )

    response = client.get(
        f"/api/groups/{group_id}",
        headers=auth_headers(member_token),
    )

    assert response.status_code == 200, response.text
    assert response.json()["id"] == group_id


# ========================================
# PERSONAL DONATION OWNERSHIP
# ========================================

def test_group_member_cannot_edit_another_users_personal_listing(client):
    (
        owner_id,
        owner_token,
        member_id,
        member_token,
        group_id,
    ) = create_group_with_users(
        client,
        "personal-owner@example.com",
        "personal-member@example.com",
    )

    add_member(
        client,
        owner_token,
        group_id,
        member_id,
        can_edit=True,
    )

    # Owner creates a personal donation.
    created = create_listing(
        client,
        owner_token,
    )

    assert created.status_code == 201, created.text

    # Group member cannot edit this personal donation.
    response = update_listing(
        client,
        member_token,
        created.json()["id"],
        title="Unauthorized personal edit",
    )

    assert response.status_code == 403

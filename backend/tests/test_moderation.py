
from sqlalchemy.orm import sessionmaker

from backend.models import User, Listing, ListingReport, AuditLog


TEST_PASSWORD = "TestPassword123"

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

def get_test_session(test_engine):
    return sessionmaker(
        bind=test_engine,
        autoflush=False,
        autocommit=False,
    )()


def register_user(client, email):
    response = client.post(
        "/api/auth/register",
        json={
            "full_name": "Moderation Test User",
            "email": email,
            "password": TEST_PASSWORD,
        },
    )

    assert response.status_code == 201, response.text


def change_user_role(test_engine, email, role):
    with get_test_session(test_engine) as db:
        user = db.query(User).filter(
            User.email == email
        ).first()

        assert user is not None

        user.role = role
        db.commit()

        return user.id


def login_user(client, email):
    response = client.post(
        "/api/auth/login",
        json={
            "email": email,
            "password": TEST_PASSWORD,
        },
    )

    assert response.status_code == 200, response.text

    return response.json()["access_token"]


def create_test_user(client, test_engine, email, role="user"):
    register_user(client, email)

    user_id = change_user_role(
        test_engine,
        email,
        role,
    )

    token = login_user(client, email)

    return user_id, token


def auth_headers(token):
    return {
        "Authorization": f"Bearer {token}"
    }


def create_listing(client, token):
    response = client.post(
        "/api/listings",
        json=LISTING_DATA,
        headers=auth_headers(token),
    )

    assert response.status_code == 201, response.text

    return response.json()["id"]


def create_report(client, token, listing_id):
    response = client.post(
        f"/api/listings/{listing_id}/reports",
        json={
            "reason": "misleading",
            "details": "The donation description is incorrect.",
        },
        headers=auth_headers(token),
    )

    assert response.status_code == 201, response.text

    return response.json()["id"]


def get_audit_logs(test_engine, action, target_id):
    with get_test_session(test_engine) as db:
        return [
            {
                "actor_id": audit.actor_id,
                "action": audit.action,
                "target_type": audit.target_type,
                "target_id": audit.target_id,
                "details": audit.details,
            }
            for audit in db.query(AuditLog).filter(
                AuditLog.action == action,
                AuditLog.target_id == str(target_id),
            ).all()
        ]


def setup_moderation_users(client, test_engine, prefix):
    owner_id, owner_token = create_test_user(
        client,
        test_engine,
        f"{prefix}-owner@example.com",
    )

    moderator_id, moderator_token = create_test_user(
        client,
        test_engine,
        f"{prefix}-moderator@example.com",
        role="moderator",
    )

    reporter_id, reporter_token = create_test_user(
        client,
        test_engine,
        f"{prefix}-reporter@example.com",
    )

    listing_id = create_listing(
        client,
        owner_token,
    )

    return {
        "owner_id": owner_id,
        "owner_token": owner_token,
        "moderator_id": moderator_id,
        "moderator_token": moderator_token,
        "reporter_id": reporter_id,
        "reporter_token": reporter_token,
        "listing_id": listing_id,
    }


# ========================================
# MODERATOR HIDE DONATION
# ========================================

def test_moderator_can_hide_listing(client, test_engine):
    data = setup_moderation_users(
        client,
        test_engine,
        "hide",
    )

    response = client.patch(
        f"/api/listings/{data['listing_id']}/moderation",
        json={
            "status": "hidden",
            "reason": "Donation violates community guidelines.",
        },
        headers=auth_headers(data["moderator_token"]),
    )

    assert response.status_code == 200, response.text

    with get_test_session(test_engine) as db:
        listing = db.get(Listing, data["listing_id"])

        assert listing is not None
        assert listing.moderation_status == "hidden"
        assert listing.moderated_by == data["moderator_id"]

    audits = get_audit_logs(
        test_engine,
        "listing_moderation",
        data["listing_id"],
    )

    assert len(audits) == 1
    assert audits[0]["actor_id"] == data["moderator_id"]
    assert audits[0]["details"]["new_status"] == "hidden"


# ========================================
# MODERATOR RESTORE DONATION
# ========================================

def test_moderator_can_restore_listing(client, test_engine):
    data = setup_moderation_users(
        client,
        test_engine,
        "restore",
    )

    listing_id = data["listing_id"]
    headers = auth_headers(data["moderator_token"])

    hide_response = client.patch(
        f"/api/listings/{listing_id}/moderation",
        json={
            "status": "hidden",
            "reason": "Temporarily hidden for review.",
        },
        headers=headers,
    )

    assert hide_response.status_code == 200, hide_response.text

    with get_test_session(test_engine) as db:
        listing = db.get(Listing, listing_id)
        assert listing.moderation_status == "hidden"

    restore_response = client.patch(
        f"/api/listings/{listing_id}/moderation",
        json={
            "status": "visible",
            "reason": "Donation reviewed and approved.",
        },
        headers=headers,
    )

    assert restore_response.status_code == 200, restore_response.text

    with get_test_session(test_engine) as db:
        listing = db.get(Listing, listing_id)

        assert listing is not None
        assert listing.moderation_status == "visible"
        assert listing.moderated_by == data["moderator_id"]

    audits = get_audit_logs(
        test_engine,
        "listing_moderation",
        listing_id,
    )

    assert len(audits) == 2

    assert audits[0]["details"]["new_status"] == "hidden"
    assert audits[1]["details"]["new_status"] == "visible"
    assert audits[1]["actor_id"] == data["moderator_id"]


# ========================================
# MODERATOR VIEW PENDING REPORTS
# ========================================

def test_moderator_can_view_pending_reports(client, test_engine):
    data = setup_moderation_users(
        client,
        test_engine,
        "view-reports",
    )

    report_id = create_report(
        client,
        data["reporter_token"],
        data["listing_id"],
    )

    response = client.get(
        "/api/listings/moderation/reports",
        headers=auth_headers(data["moderator_token"]),
    )

    assert response.status_code == 200, response.text

    report_ids = {
        report["id"]
        for report in response.json()
    }

    assert report_id in report_ids


# ========================================
# MODERATOR RESOLVE REPORT
# ========================================

def test_moderator_can_resolve_report(client, test_engine):
    data = setup_moderation_users(
        client,
        test_engine,
        "resolve",
    )

    report_id = create_report(
        client,
        data["reporter_token"],
        data["listing_id"],
    )

    response = client.patch(
        f"/api/listings/moderation/reports/{report_id}",
        json={
            "status": "resolved",
            "resolution_note": "Report investigated and resolved.",
        },
        headers=auth_headers(data["moderator_token"]),
    )

    assert response.status_code == 200, response.text
    assert response.json()["status"] == "resolved"
    assert response.json()["reviewed_by"] == data["moderator_id"]

    with get_test_session(test_engine) as db:
        report = db.get(ListingReport, report_id)

        assert report is not None
        assert report.status == "resolved"
        assert report.reviewed_by == data["moderator_id"]
        assert report.reviewed_at is not None

    audits = get_audit_logs(
        test_engine,
        "listing_report_review",
        report_id,
    )

    assert len(audits) == 1
    assert audits[0]["actor_id"] == data["moderator_id"]
    assert audits[0]["details"]["new_status"] == "resolved"


# ========================================
# MODERATOR DISMISS REPORT
# ========================================

def test_moderator_can_dismiss_report(client, test_engine):
    data = setup_moderation_users(
        client,
        test_engine,
        "dismiss",
    )

    report_id = create_report(
        client,
        data["reporter_token"],
        data["listing_id"],
    )

    response = client.patch(
        f"/api/listings/moderation/reports/{report_id}",
        json={
            "status": "dismissed",
            "resolution_note": "Report was not supported by evidence.",
        },
        headers=auth_headers(data["moderator_token"]),
    )

    assert response.status_code == 200, response.text
    assert response.json()["status"] == "dismissed"
    assert response.json()["reviewed_by"] == data["moderator_id"]

    audits = get_audit_logs(
        test_engine,
        "listing_report_review",
        report_id,
    )

    assert len(audits) == 1
    assert audits[0]["details"]["new_status"] == "dismissed"


# ========================================
# USER CANNOT HIDE OR RESTORE
# ========================================

def test_regular_user_cannot_moderate_listing(client, test_engine):
    data = setup_moderation_users(
        client,
        test_engine,
        "user-denied",
    )

    for moderation_status in ("hidden", "visible"):
        response = client.patch(
            f"/api/listings/{data['listing_id']}/moderation",
            json={
                "status": moderation_status,
                "reason": "Unauthorized moderation attempt.",
            },
            headers=auth_headers(data["reporter_token"]),
        )

        assert response.status_code == 403, response.text

    with get_test_session(test_engine) as db:
        listing = db.get(Listing, data["listing_id"])

        assert listing.moderation_status == "visible"


# ========================================
# USER CANNOT VIEW MODERATION QUEUE
# ========================================

def test_regular_user_cannot_view_moderation_reports(
    client,
    test_engine,
):
    data = setup_moderation_users(
        client,
        test_engine,
        "queue-denied",
    )

    response = client.get(
        "/api/listings/moderation/reports",
        headers=auth_headers(data["reporter_token"]),
    )

    assert response.status_code == 403, response.text


# ========================================
# USER CANNOT RESOLVE OR DISMISS REPORT
# ========================================

def test_regular_user_cannot_review_reports(client, test_engine):
    data = setup_moderation_users(
        client,
        test_engine,
        "review-denied",
    )

    report_id = create_report(
        client,
        data["reporter_token"],
        data["listing_id"],
    )

    for review_status in ("resolved", "dismissed"):
        response = client.patch(
            f"/api/listings/moderation/reports/{report_id}",
            json={
                "status": review_status,
                "resolution_note": "Unauthorized review attempt.",
            },
            headers=auth_headers(data["reporter_token"]),
        )

        assert response.status_code == 403, response.text

    with get_test_session(test_engine) as db:
        report = db.get(ListingReport, report_id)

        assert report.status == "pending"


# ========================================
# ADMIN HAS MODERATION PERMISSION
# ========================================

def test_admin_can_moderate_listing(client, test_engine):
    data = setup_moderation_users(
        client,
        test_engine,
        "admin-allowed",
    )

    admin_id, admin_token = create_test_user(
        client,
        test_engine,
        "moderation-admin@example.com",
        role="admin",
    )

    response = client.patch(
        f"/api/listings/{data['listing_id']}/moderation",
        json={
            "status": "hidden",
            "reason": "Admin moderation review.",
        },
        headers=auth_headers(admin_token),
    )

    assert response.status_code == 200, response.text

    with get_test_session(test_engine) as db:
        listing = db.get(Listing, data["listing_id"])

        assert listing is not None
        assert listing.moderation_status == "hidden"
        assert listing.moderated_by == admin_id

    audits = get_audit_logs(
        test_engine,
        "listing_moderation",
        data["listing_id"],
    )

    assert len(audits) == 1
    assert audits[0]["actor_id"] == admin_id


# ========================================
# PREVENT DUPLICATE MODERATION ACTION
# ========================================

def test_moderator_cannot_hide_already_hidden_listing(
    client,
    test_engine,
):
    data = setup_moderation_users(
        client,
        test_engine,
        "duplicate-hide",
    )

    endpoint = (
        f"/api/listings/{data['listing_id']}/moderation"
    )

    payload = {
        "status": "hidden",
        "reason": "Donation requires review.",
    }

    first_response = client.patch(
        endpoint,
        json=payload,
        headers=auth_headers(data["moderator_token"]),
    )

    assert first_response.status_code == 200, first_response.text

    second_response = client.patch(
        endpoint,
        json=payload,
        headers=auth_headers(data["moderator_token"]),
    )

    assert second_response.status_code == 400, second_response.text

    audits = get_audit_logs(
        test_engine,
        "listing_moderation",
        data["listing_id"],
    )

    assert len(audits) == 1


# ========================================
# PREVENT DUPLICATE REPORT REVIEW
# ========================================

def test_moderator_cannot_review_same_report_twice(
    client,
    test_engine,
):
    data = setup_moderation_users(
        client,
        test_engine,
        "duplicate-review",
    )

    report_id = create_report(
        client,
        data["reporter_token"],
        data["listing_id"],
    )

    endpoint = (
        f"/api/listings/moderation/reports/{report_id}"
    )

    headers = auth_headers(data["moderator_token"])

    first_response = client.patch(
        endpoint,
        json={
            "status": "resolved",
            "resolution_note": "Report investigated.",
        },
        headers=headers,
    )

    assert first_response.status_code == 200, first_response.text

    second_response = client.patch(
        endpoint,
        json={
            "status": "dismissed",
            "resolution_note": "Attempt to review again.",
        },
        headers=headers,
    )

    assert second_response.status_code == 400, second_response.text

    audits = get_audit_logs(
        test_engine,
        "listing_report_review",
        report_id,
    )

    assert len(audits) == 1


# ========================================
# REVIEWED REPORT LEAVES PENDING QUEUE
# ========================================

def test_resolved_report_disappears_from_pending_queue(
    client,
    test_engine,
):
    data = setup_moderation_users(
        client,
        test_engine,
        "pending-queue",
    )

    report_id = create_report(
        client,
        data["reporter_token"],
        data["listing_id"],
    )

    headers = auth_headers(data["moderator_token"])

    before_response = client.get(
        "/api/listings/moderation/reports",
        headers=headers,
    )

    assert before_response.status_code == 200, before_response.text

    before_ids = {
        report["id"]
        for report in before_response.json()
    }

    assert report_id in before_ids

    review_response = client.patch(
        f"/api/listings/moderation/reports/{report_id}",
        json={
            "status": "resolved",
            "resolution_note": "Review completed.",
        },
        headers=headers,
    )

    assert review_response.status_code == 200, review_response.text

    after_response = client.get(
        "/api/listings/moderation/reports",
        headers=headers,
    )

    assert after_response.status_code == 200, after_response.text

    after_ids = {
        report["id"]
        for report in after_response.json()
    }

    assert report_id not in after_ids

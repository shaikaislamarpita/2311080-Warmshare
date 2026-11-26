from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.orm import Session

# Support both local development and Vercel deployment.
try:
    from backend.dependencies import get_db, get_current_user
    from backend.models import User

    from backend.schemas import (
        AdminUserResponse,
        AdminUserDetailResponse,
        AdminUserPageResponse,
        AdminRoleUpdate,
        AdminBanUpdate,
        AdminBulkBanUpdate,
        AdminBulkBanResult,
        AdminDashboardStats,
        AdminActiveSessionResponse,
        AuditLogResponse,
        FailedLoginAttemptResponse,
    )

    from backend.permissions import (
        PERMISSION_VIEW_ADMIN_DASHBOARD,
        PERMISSION_MANAGE_ROLES,
        PERMISSION_BAN_USERS,
        PERMISSION_REVOKE_SESSIONS,
        PERMISSION_VIEW_AUDIT_LOGS,
        PERMISSION_EXPORT_DATA,
    )

    from backend.rbac import require_permission

    from backend.services.admin_service import (
        get_admin_users_service,
        get_paginated_admin_users_service,
        get_admin_user_detail_service,
        update_user_role_service,
        update_user_ban_service,
        bulk_update_user_ban_service,
        revoke_user_sessions_service,
    )

    from backend.services.admin_dashboard_service import (
        get_admin_dashboard_stats_service,
        get_active_sessions_service,
    )

    from backend.services.audit_service import (
        get_audit_logs_service,
    )

    from backend.services.export_service import (
        export_audit_logs_service,
    )

    from backend.services.security_monitoring_service import (
        get_failed_login_attempts_service,
    )

except ModuleNotFoundError as error:
    if error.name != "backend":
        raise

    from dependencies import get_db, get_current_user
    from models import User

    from schemas import (
        AdminUserResponse,
        AdminUserDetailResponse,
        AdminUserPageResponse,
        AdminRoleUpdate,
        AdminBanUpdate,
        AdminBulkBanUpdate,
        AdminBulkBanResult,
        AdminDashboardStats,
        AdminActiveSessionResponse,
        AuditLogResponse,
        FailedLoginAttemptResponse,
    )

    from permissions import (
        PERMISSION_VIEW_ADMIN_DASHBOARD,
        PERMISSION_MANAGE_ROLES,
        PERMISSION_BAN_USERS,
        PERMISSION_REVOKE_SESSIONS,
        PERMISSION_VIEW_AUDIT_LOGS,
        PERMISSION_EXPORT_DATA,
    )

    from rbac import require_permission

    from services.admin_service import (
        get_admin_users_service,
        get_paginated_admin_users_service,
        get_admin_user_detail_service,
        update_user_role_service,
        update_user_ban_service,
        bulk_update_user_ban_service,
        revoke_user_sessions_service,
    )

    from services.admin_dashboard_service import (
        get_admin_dashboard_stats_service,
        get_active_sessions_service,
    )

    from services.audit_service import (
        get_audit_logs_service,
    )

    from services.export_service import (
        export_audit_logs_service,
    )

    from services.security_monitoring_service import (
        get_failed_login_attempts_service,
    )


router = APIRouter(
    prefix="/api/admin",
    tags=["Admin"],
)


# ========================================
# 1. ADMIN DASHBOARD STATISTICS
# ========================================

@router.get(
    "/dashboard/stats",
    response_model=AdminDashboardStats,
    dependencies=[
        Depends(
            require_permission(
                PERMISSION_VIEW_ADMIN_DASHBOARD
            )
        )
    ],
)
def get_admin_dashboard_stats(
    db: Session = Depends(get_db),
):
    return get_admin_dashboard_stats_service(db)


# ========================================
# 2. ADMIN ACTIVE SESSION DETAILS
# ========================================

@router.get(
    "/dashboard/active-sessions",
    response_model=list[AdminActiveSessionResponse],
    dependencies=[
        Depends(
            require_permission(
                PERMISSION_VIEW_ADMIN_DASHBOARD
            )
        )
    ],
)
def get_admin_active_sessions(
    db: Session = Depends(get_db),
):
    return get_active_sessions_service(db)


# ========================================
# 3. LIST ALL USERS
# ========================================

@router.get(
    "/users",
    response_model=list[AdminUserResponse],
    dependencies=[
        Depends(
            require_permission(
                PERMISSION_VIEW_ADMIN_DASHBOARD
            )
        )
    ],
)
def get_admin_users(
    db: Session = Depends(get_db),
):
    return get_admin_users_service(db)


# ========================================
# 4. PAGINATED USER LIST
# ========================================

@router.get(
    "/users/paginated",
    response_model=AdminUserPageResponse,
    dependencies=[
        Depends(
            require_permission(
                PERMISSION_VIEW_ADMIN_DASHBOARD
            )
        )
    ],
)
def get_paginated_admin_users(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=100),
    db: Session = Depends(get_db),
):
    return get_paginated_admin_users_service(
        db=db,
        page=page,
        page_size=page_size,
    )


# ========================================
# 5. BULK BAN / UNBAN USERS
# ========================================

@router.patch(
    "/users/bulk-ban",
    response_model=AdminBulkBanResult,
    dependencies=[
        Depends(
            require_permission(
                PERMISSION_BAN_USERS
            )
        )
    ],
)
def bulk_update_user_ban(
    ban_data: AdminBulkBanUpdate,
    current_admin: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return bulk_update_user_ban_service(
        data=ban_data,
        db=db,
        current_admin=current_admin,
    )


# ========================================
# 6. DETAILED USER VIEW
# ========================================

@router.get(
    "/users/{user_id}",
    response_model=AdminUserDetailResponse,
    dependencies=[
        Depends(
            require_permission(
                PERMISSION_VIEW_ADMIN_DASHBOARD
            )
        )
    ],
)
def get_admin_user_detail(
    user_id: int,
    db: Session = Depends(get_db),
):
    return get_admin_user_detail_service(
        target_user_id=user_id,
        db=db,
    )


# ========================================
# 7. CHANGE USER ROLE
# ========================================

@router.patch(
    "/users/{user_id}/role",
    response_model=AdminUserResponse,
    dependencies=[
        Depends(
            require_permission(
                PERMISSION_MANAGE_ROLES
            )
        )
    ],
)
def update_user_role(
    user_id: int,
    role_data: AdminRoleUpdate,
    current_admin: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return update_user_role_service(
        target_user_id=user_id,
        new_role=role_data.role,
        db=db,
        current_admin=current_admin,
    )


# ========================================
# 8. BAN OR UNBAN ONE USER
# ========================================

@router.patch(
    "/users/{user_id}/ban",
    response_model=AdminUserResponse,
    dependencies=[
        Depends(
            require_permission(
                PERMISSION_BAN_USERS
            )
        )
    ],
)
def update_user_ban(
    user_id: int,
    ban_data: AdminBanUpdate,
    current_admin: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return update_user_ban_service(
        target_user_id=user_id,
        is_banned=ban_data.is_banned,
        reason=ban_data.reason,
        db=db,
        current_admin=current_admin,
    )


# ========================================
# 9. REVOKE USER SESSIONS
# ========================================

@router.delete(
    "/users/{user_id}/sessions",
    dependencies=[
        Depends(
            require_permission(
                PERMISSION_REVOKE_SESSIONS
            )
        )
    ],
)
def revoke_user_sessions(
    user_id: int,
    current_admin: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return revoke_user_sessions_service(
        target_user_id=user_id,
        db=db,
        current_admin=current_admin,
    )


# ========================================
# 10. EXPORT AUDIT LOGS AS CSV
# ========================================

@router.get(
    "/export/audit-logs",
    dependencies=[
        Depends(
            require_permission(
                PERMISSION_EXPORT_DATA
            )
        )
    ],
)
def export_admin_audit_logs(
    db: Session = Depends(get_db),
):
    csv_content = export_audit_logs_service(db)

    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={
            "Content-Disposition": (
                'attachment; filename="warmshare-audit-logs.csv"'
            ),
        },
    )


# ========================================
# 11. VIEW AUDIT LOGS
# ========================================

@router.get(
    "/audit-logs",
    response_model=list[AuditLogResponse],
    dependencies=[
        Depends(
            require_permission(
                PERMISSION_VIEW_AUDIT_LOGS
            )
        )
    ],
)
def get_admin_audit_logs(
    limit: int = Query(default=50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    return get_audit_logs_service(
        db=db,
        limit=limit,
    )


# ========================================
# 12. VIEW FAILED LOGIN ATTEMPTS
# ========================================

@router.get(
    "/security/failed-logins",
    response_model=list[FailedLoginAttemptResponse],
    dependencies=[
        Depends(
            require_permission(
                PERMISSION_VIEW_AUDIT_LOGS
            )
        )
    ],
)
def get_admin_failed_login_attempts(
    limit: int = Query(default=50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    return get_failed_login_attempts_service(
        db=db,
        limit=limit,
    )
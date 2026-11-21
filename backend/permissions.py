# Available application roles
ROLE_USER = "user"
ROLE_MODERATOR = "moderator"
ROLE_ADMIN = "admin"


# Permission constants
PERMISSION_CREATE_LISTING = "listing:create"
PERMISSION_UPDATE_OWN_LISTING = "listing:update:own"
PERMISSION_DELETE_OWN_LISTING = "listing:delete:own"

PERMISSION_MODERATE_CONTENT = "content:moderate"

PERMISSION_VIEW_ADMIN_DASHBOARD = "admin:dashboard:view"
PERMISSION_MANAGE_USERS = "admin:users:manage"
PERMISSION_MANAGE_ROLES = "admin:roles:manage"
PERMISSION_BAN_USERS = "admin:users:ban"
PERMISSION_REVOKE_SESSIONS = "admin:sessions:revoke"
PERMISSION_VIEW_AUDIT_LOGS = "admin:audit:view"
PERMISSION_EXPORT_DATA = "admin:data:export"


# Permissions assigned to each role
ROLE_PERMISSIONS = {
    ROLE_USER: {
        PERMISSION_CREATE_LISTING,
        PERMISSION_UPDATE_OWN_LISTING,
        PERMISSION_DELETE_OWN_LISTING,
    },

    ROLE_MODERATOR: {
        PERMISSION_CREATE_LISTING,
        PERMISSION_UPDATE_OWN_LISTING,
        PERMISSION_DELETE_OWN_LISTING,
        PERMISSION_MODERATE_CONTENT,
    },

    ROLE_ADMIN: {
        PERMISSION_CREATE_LISTING,
        PERMISSION_UPDATE_OWN_LISTING,
        PERMISSION_DELETE_OWN_LISTING,
        PERMISSION_MODERATE_CONTENT,
        PERMISSION_VIEW_ADMIN_DASHBOARD,
        PERMISSION_MANAGE_USERS,
        PERMISSION_MANAGE_ROLES,
        PERMISSION_BAN_USERS,
        PERMISSION_REVOKE_SESSIONS,
        PERMISSION_VIEW_AUDIT_LOGS,
        PERMISSION_EXPORT_DATA,
    },
}


# Check whether a role has a specific permission
def has_permission(role: str, permission: str) -> bool:
    return permission in ROLE_PERMISSIONS.get(role, set())

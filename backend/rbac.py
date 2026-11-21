from fastapi import Depends, HTTPException

# Support both local development and Vercel deployment
try:
    from backend.dependencies import get_current_user
    from backend.models import User
    from backend.permissions import has_permission
except ModuleNotFoundError as error:
    if error.name != "backend":
        raise

    from dependencies import get_current_user
    from models import User
    from permissions import has_permission


# Reusable permission dependency
def require_permission(permission: str):
    def permission_checker(
        current_user: User = Depends(get_current_user),
    ):
        if not has_permission(
            current_user.role,
            permission,
        ):
            raise HTTPException(
                status_code=403,
                detail="You do not have permission to perform this action.",
            )

        return current_user

    return permission_checker

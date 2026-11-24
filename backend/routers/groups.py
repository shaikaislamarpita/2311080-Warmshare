
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

# Support both local development and Vercel deployment.
try:
    from backend.dependencies import get_db, get_current_user
    from backend.models import User
    from backend.schemas import (
        GroupCreate,
        GroupUpdate,
        GroupResponse,
        GroupDetailResponse,
        GroupMemberCreate,
        GroupMemberPermissionUpdate,
        GroupMemberResponse,
        ListingResponse,
    )
    from backend.services.group_service import (
        create_group_service,
        get_my_groups_service,
        get_group_detail_service,
        update_group_service,
        delete_group_service,
        add_group_member_service,
        get_group_members_service,
        update_group_member_permissions_service,
        remove_group_member_service,
        get_group_listings_service,
    )
except ModuleNotFoundError as error:
    if error.name != "backend":
        raise

    from dependencies import get_db, get_current_user
    from models import User
    from schemas import (
        GroupCreate,
        GroupUpdate,
        GroupResponse,
        GroupDetailResponse,
        GroupMemberCreate,
        GroupMemberPermissionUpdate,
        GroupMemberResponse,
        ListingResponse,
    )
    from services.group_service import (
        create_group_service,
        get_my_groups_service,
        get_group_detail_service,
        update_group_service,
        delete_group_service,
        add_group_member_service,
        get_group_members_service,
        update_group_member_permissions_service,
        remove_group_member_service,
        get_group_listings_service,
    )


router = APIRouter(
    prefix="/api/groups",
    tags=["Groups"],
)


# ========================================
# CREATE A GROUP
# ========================================

@router.post(
    "",
    response_model=GroupResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_group(
    group_data: GroupCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return create_group_service(
        group_data,
        db,
        current_user,
    )


# ========================================
# LIST MY GROUPS
# ========================================

@router.get(
    "",
    response_model=list[GroupResponse],
)
def get_my_groups(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_my_groups_service(
        db,
        current_user,
    )


# ========================================
# GET GROUP DETAILS
# ========================================

@router.get(
    "/{group_id}",
    response_model=GroupDetailResponse,
)
def get_group_detail(
    group_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_group_detail_service(
        group_id,
        db,
        current_user,
    )


# ========================================
# RENAME GROUP - OWNER ONLY
# ========================================

@router.patch(
    "/{group_id}",
    response_model=GroupResponse,
)
def update_group(
    group_id: int,
    group_data: GroupUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return update_group_service(
        group_id,
        group_data,
        db,
        current_user,
    )


# ========================================
# DELETE GROUP - OWNER ONLY
# ========================================

@router.delete(
    "/{group_id}",
)
def delete_group(
    group_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return delete_group_service(
        group_id,
        db,
        current_user,
    )


# ========================================
# ADD MEMBER - OWNER ONLY
# ========================================

@router.post(
    "/{group_id}/members",
    response_model=GroupMemberResponse,
    status_code=status.HTTP_201_CREATED,
)
def add_group_member(
    group_id: int,
    member_data: GroupMemberCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return add_group_member_service(
        group_id,
        member_data,
        db,
        current_user,
    )


# ========================================
# LIST GROUP MEMBERS
# ========================================

@router.get(
    "/{group_id}/members",
    response_model=list[GroupMemberResponse],
)
def get_group_members(
    group_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_group_members_service(
        group_id,
        db,
        current_user,
    )


# ========================================
# UPDATE MEMBER PERMISSIONS
# OWNER ONLY
# ========================================

@router.patch(
    "/{group_id}/members/{user_id}",
    response_model=GroupMemberResponse,
)
def update_group_member_permissions(
    group_id: int,
    user_id: int,
    permissions: GroupMemberPermissionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return update_group_member_permissions_service(
        group_id,
        user_id,
        permissions,
        db,
        current_user,
    )


# ========================================
# REMOVE MEMBER - OWNER ONLY
# ========================================

@router.delete(
    "/{group_id}/members/{user_id}",
)
def remove_group_member(
    group_id: int,
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return remove_group_member_service(
        group_id,
        user_id,
        db,
        current_user,
    )


# ========================================
# VIEW SHARED GROUP LISTINGS
# ========================================

@router.get(
    "/{group_id}/listings",
    response_model=list[ListingResponse],
)
def get_group_listings(
    group_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_group_listings_service(
        group_id,
        db,
        current_user,
    )

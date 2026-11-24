
from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, selectinload

# Support local development and Vercel deployment.
try:
    from backend.models import Group, GroupMember, Listing, User
    from backend.schemas import (
        GroupCreate,
        GroupUpdate,
        GroupMemberCreate,
        GroupMemberPermissionUpdate,
    )
except ModuleNotFoundError as error:
    if error.name != "backend":
        raise

    from models import Group, GroupMember, Listing, User
    from schemas import (
        GroupCreate,
        GroupUpdate,
        GroupMemberCreate,
        GroupMemberPermissionUpdate,
    )


# ========================================
# GROUP LOOKUP HELPERS
# ========================================

def get_group_or_404(
    group_id: int,
    db: Session,
):
    group = db.get(Group, group_id)

    if group is None:
        raise HTTPException(
            status_code=404,
            detail="Group not found.",
        )

    return group


def get_group_membership(
    group_id: int,
    user_id: int,
    db: Session,
):
    statement = select(GroupMember).where(
        GroupMember.group_id == group_id,
        GroupMember.user_id == user_id,
    )

    return db.scalars(statement).first()


# ========================================
# GROUP PERMISSION HELPERS
# ========================================

def verify_group_owner(
    group: Group,
    current_user: User,
):
    """
    Only the group owner can rename/delete
    the group or manage its members.
    """

    if group.owner_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="Only the group owner can perform this action.",
        )


def verify_group_access(
    group: Group,
    current_user: User,
    db: Session,
):
    """
    The owner and current members can
    access the group's shared information.
    """

    if group.owner_id == current_user.id:
        return

    membership = get_group_membership(
        group.id,
        current_user.id,
        db,
    )

    if membership is None:
        raise HTTPException(
            status_code=403,
            detail="You are not a member of this group.",
        )


def verify_group_permission(
    group: Group,
    current_user: User,
    db: Session,
    permission: str,
):
    """
    Group owners have all permissions.

    Members only have permissions explicitly
    granted by the group owner.
    """

    allowed_permissions = {
        "can_create",
        "can_edit",
        "can_assign",
    }

    if permission not in allowed_permissions:
        raise ValueError(
            "Invalid group permission requested."
        )

    if group.owner_id == current_user.id:
        return

    membership = get_group_membership(
        group.id,
        current_user.id,
        db,
    )

    if membership is None:
        raise HTTPException(
            status_code=403,
            detail="You are not a member of this group.",
        )

    if not getattr(membership, permission):
        raise HTTPException(
            status_code=403,
            detail=(
                "You do not have the required "
                "group permission."
            ),
        )


# ========================================
# CREATE GROUP
# ========================================

def create_group_service(
    group_data: GroupCreate,
    db: Session,
    current_user: User,
):
    new_group = Group(
        name=group_data.name,
        owner_id=current_user.id,
    )

    db.add(new_group)
    db.commit()
    db.refresh(new_group)

    return new_group


# ========================================
# LIST MY GROUPS
# ========================================

def get_my_groups_service(
    db: Session,
    current_user: User,
):
    """
    Return groups owned by the user
    or groups where the user is a member.
    """

    owned_group_ids = select(Group.id).where(
        Group.owner_id == current_user.id
    )

    member_group_ids = select(
        GroupMember.group_id
    ).where(
        GroupMember.user_id == current_user.id
    )

    statement = (
        select(Group)
        .where(
            Group.id.in_(
                owned_group_ids.union(member_group_ids)
            )
        )
        .order_by(Group.id.desc())
    )

    return db.scalars(statement).all()


# ========================================
# GET GROUP DETAILS
# ========================================

def get_group_detail_service(
    group_id: int,
    db: Session,
    current_user: User,
):
    group = get_group_or_404(
        group_id,
        db,
    )

    verify_group_access(
        group,
        current_user,
        db,
    )

    statement = (
        select(Group)
        .options(
            selectinload(Group.members),
            selectinload(Group.listings),
        )
        .where(Group.id == group_id)
    )

    return db.scalars(statement).one()


# ========================================
# RENAME GROUP - OWNER ONLY
# ========================================

def update_group_service(
    group_id: int,
    group_data: GroupUpdate,
    db: Session,
    current_user: User,
):
    group = get_group_or_404(
        group_id,
        db,
    )

    verify_group_owner(
        group,
        current_user,
    )

    group.name = group_data.name

    db.commit()
    db.refresh(group)

    return group


# ========================================
# DELETE GROUP - OWNER ONLY
# ========================================

def delete_group_service(
    group_id: int,
    db: Session,
    current_user: User,
):
    group = get_group_or_404(
        group_id,
        db,
    )

    verify_group_owner(
        group,
        current_user,
    )

    # Keep existing donations rather than
    # deleting them with the group.
    #
    # The database FK also uses ON DELETE SET NULL.
    db.query(Listing).filter(
        Listing.group_id == group.id
    ).update(
        {Listing.group_id: None},
        synchronize_session=False,
    )

    db.delete(group)
    db.commit()

    return {
        "message": "Group deleted successfully."
    }


# ========================================
# ADD MEMBER - OWNER ONLY
# ========================================

def add_group_member_service(
    group_id: int,
    member_data: GroupMemberCreate,
    db: Session,
    current_user: User,
):
    group = get_group_or_404(
        group_id,
        db,
    )

    verify_group_owner(
        group,
        current_user,
    )

    user = db.get(
        User,
        member_data.user_id,
    )

    if user is None:
        raise HTTPException(
            status_code=404,
            detail="User not found.",
        )

    if user.is_banned:
        raise HTTPException(
            status_code=403,
            detail="A suspended user cannot join a group.",
        )

    if user.id == group.owner_id:
        raise HTTPException(
            status_code=400,
            detail=(
                "The group owner already has "
                "all group permissions."
            ),
        )

    existing_member = get_group_membership(
        group_id,
        user.id,
        db,
    )

    if existing_member is not None:
        raise HTTPException(
            status_code=409,
            detail="This user is already a group member.",
        )

    new_member = GroupMember(
        group_id=group.id,
        user_id=user.id,
        can_create=member_data.can_create,
        can_edit=member_data.can_edit,
        can_assign=member_data.can_assign,
    )

    db.add(new_member)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="This user is already a group member.",
        )

    db.refresh(new_member)

    return new_member


# ========================================
# LIST GROUP MEMBERS
# ========================================

def get_group_members_service(
    group_id: int,
    db: Session,
    current_user: User,
):
    group = get_group_or_404(
        group_id,
        db,
    )

    verify_group_access(
        group,
        current_user,
        db,
    )

    statement = (
        select(GroupMember)
        .where(GroupMember.group_id == group_id)
        .order_by(GroupMember.id.asc())
    )

    return db.scalars(statement).all()


# ========================================
# UPDATE MEMBER PERMISSIONS
# OWNER ONLY
# ========================================

def update_group_member_permissions_service(
    group_id: int,
    user_id: int,
    permissions: GroupMemberPermissionUpdate,
    db: Session,
    current_user: User,
):
    group = get_group_or_404(
        group_id,
        db,
    )

    verify_group_owner(
        group,
        current_user,
    )

    membership = get_group_membership(
        group_id,
        user_id,
        db,
    )

    if membership is None:
        raise HTTPException(
            status_code=404,
            detail="Group member not found.",
        )

    membership.can_create = permissions.can_create
    membership.can_edit = permissions.can_edit
    membership.can_assign = permissions.can_assign

    db.commit()
    db.refresh(membership)

    return membership


# ========================================
# REMOVE MEMBER - OWNER ONLY
# ========================================

def remove_group_member_service(
    group_id: int,
    user_id: int,
    db: Session,
    current_user: User,
):
    group = get_group_or_404(
        group_id,
        db,
    )

    verify_group_owner(
        group,
        current_user,
    )

    membership = get_group_membership(
        group_id,
        user_id,
        db,
    )

    if membership is None:
        raise HTTPException(
            status_code=404,
            detail="Group member not found.",
        )

    db.delete(membership)
    db.commit()

    return {
        "message": "Group member removed successfully."
    }


# ========================================
# GET GROUP LISTINGS
# ========================================

def get_group_listings_service(
    group_id: int,
    db: Session,
    current_user: User,
):
    group = get_group_or_404(
        group_id,
        db,
    )

    verify_group_access(
        group,
        current_user,
        db,
    )

    statement = (
        select(Listing)
        .where(
            Listing.group_id == group_id,
            Listing.moderation_status == "visible",
        )
        .order_by(Listing.id.desc())
    )

    return db.scalars(statement).all()

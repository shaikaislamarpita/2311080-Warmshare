
import { useEffect, useState, type FormEvent } from "react";

import type {
  Group,
  GroupDetail,
  GroupMember,
  GroupPermissions as MemberPermissions,
} from "../../types/group";

import {
  createGroup,
  getMyGroups,
  getGroupDetails,
  updateGroup,
  deleteGroup,
  addGroupMember,
  updateGroupMemberPermissions,
  removeGroupMember,
} from "../../services/groupService";

type GroupPermissionsProps = {
  currentUserId?: number;
};

const defaultPermissions: MemberPermissions = {
  can_create: false,
  can_edit: false,
  can_assign: false,
};

function getErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "Something went wrong. Please try again.";
}

function PermissionCheckbox({
  label,
  description,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "0.75rem",
        marginBottom: "0.75rem",
      }}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
      />

      <span>
        <strong>{label}</strong>
        <span
          style={{
            display: "block",
            fontSize: "0.9rem",
          }}
        >
          {description}
        </span>
      </span>
    </label>
  );
}

export default function GroupPermissions({
  currentUserId,
}: GroupPermissionsProps) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] =
    useState<number | null>(null);
  const [groupDetails, setGroupDetails] =
    useState<GroupDetail | null>(null);

  const [loading, setLoading] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [busy, setBusy] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // Create group
  const [newGroupName, setNewGroupName] = useState("");

  // Rename group
  const [editingGroupName, setEditingGroupName] = useState(false);
  const [groupName, setGroupName] = useState("");

  // Add member
  const [newMemberId, setNewMemberId] = useState("");
  const [newMemberPermissions, setNewMemberPermissions] =
    useState<MemberPermissions>({ ...defaultPermissions });

  // Edit member permissions
  const [editingMemberId, setEditingMemberId] =
    useState<number | null>(null);
  const [editingPermissions, setEditingPermissions] =
    useState<MemberPermissions>({ ...defaultPermissions });

  const isOwner =
    currentUserId !== undefined &&
    groupDetails?.owner_id === currentUserId;

  // ========================================
  // LOAD GROUPS
  // ========================================

  async function loadGroups() {
    setLoading(true);
    setError("");

    try {
      const data = await getMyGroups();
      setGroups(data);

      setSelectedGroupId((previous) => {
        if (previous !== null && data.some((g) => g.id === previous)) {
          return previous;
        }

        return data.length > 0 ? data[0].id : null;
      });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadGroups();
  }, []);

  // ========================================
  // LOAD SELECTED GROUP DETAILS
  // ========================================

  async function loadGroupDetails(groupId: number) {
    setLoadingDetails(true);
    setError("");

    try {
      const details = await getGroupDetails(groupId);

      setGroupDetails(details);
      setGroupName(details.name);
    } catch (err) {
      setGroupDetails(null);
      setError(getErrorMessage(err));
    } finally {
      setLoadingDetails(false);
    }
  }

  useEffect(() => {
    if (selectedGroupId === null) {
      setGroupDetails(null);
      return;
    }

    setGroupDetails(null);
    setEditingGroupName(false);
    setEditingMemberId(null);

    void loadGroupDetails(selectedGroupId);
  }, [selectedGroupId]);

  // ========================================
  // CREATE GROUP
  // ========================================

  async function handleCreateGroup(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const name = newGroupName.trim();

    if (!name) {
      setError("Please enter a group name.");
      return;
    }

    setBusy(true);
    setError("");
    setMessage("");

    try {
      const createdGroup = await createGroup({ name });

      setNewGroupName("");
      setMessage("Group created successfully.");

      const updatedGroups = await getMyGroups();
      setGroups(updatedGroups);
      setSelectedGroupId(createdGroup.id);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  // ========================================
  // RENAME GROUP
  // ========================================

  async function handleRenameGroup(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!groupDetails || !isOwner) return;

    const name = groupName.trim();

    if (!name) {
      setError("Group name cannot be empty.");
      return;
    }

    setBusy(true);
    setError("");
    setMessage("");

    try {
      await updateGroup(groupDetails.id, { name });

      setEditingGroupName(false);
      setMessage("Group renamed successfully.");

      await loadGroups();
      await loadGroupDetails(groupDetails.id);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  // ========================================
  // DELETE GROUP
  // ========================================

  async function handleDeleteGroup() {
    if (!groupDetails || !isOwner) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete "${groupDetails.name}"?`
    );

    if (!confirmed) return;

    setBusy(true);
    setError("");
    setMessage("");

    try {
      await deleteGroup(groupDetails.id);

      setGroupDetails(null);
      setSelectedGroupId(null);
      setMessage("Group deleted successfully.");

      const updatedGroups = await getMyGroups();
      setGroups(updatedGroups);

      if (updatedGroups.length > 0) {
        setSelectedGroupId(updatedGroups[0].id);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  // ========================================
  // ADD GROUP MEMBER
  // ========================================

  async function handleAddMember(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!groupDetails || !isOwner) return;

    const userId = Number(newMemberId);

    if (!Number.isSafeInteger(userId) || userId <= 0) {
      setError("Please enter a valid numeric User ID.");
      return;
    }

    if (userId === currentUserId) {
      setError("You are already the owner of this group.");
      return;
    }

    setBusy(true);
    setError("");
    setMessage("");

    try {
      await addGroupMember(groupDetails.id, {
        user_id: userId,
        ...newMemberPermissions,
      });

      setNewMemberId("");
      setNewMemberPermissions({ ...defaultPermissions });
      setMessage("Member added successfully.");

      await loadGroupDetails(groupDetails.id);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  // ========================================
  // EDIT MEMBER PERMISSIONS
  // ========================================

  function startEditingMember(member: GroupMember) {
    setEditingMemberId(member.user_id);

    setEditingPermissions({
      can_create: member.can_create,
      can_edit: member.can_edit,
      can_assign: member.can_assign,
    });

    setError("");
    setMessage("");
  }

  async function handleSaveMemberPermissions(userId: number) {
    if (!groupDetails || !isOwner) return;

    setBusy(true);
    setError("");
    setMessage("");

    try {
      await updateGroupMemberPermissions(
        groupDetails.id,
        userId,
        editingPermissions
      );

      setEditingMemberId(null);
      setMessage("Member permissions updated successfully.");

      await loadGroupDetails(groupDetails.id);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  // ========================================
  // REMOVE MEMBER
  // ========================================

  async function handleRemoveMember(userId: number) {
    if (!groupDetails || !isOwner) return;

    const confirmed = window.confirm(
      `Remove User #${userId} from this group?`
    );

    if (!confirmed) return;

    setBusy(true);
    setError("");
    setMessage("");

    try {
      await removeGroupMember(groupDetails.id, userId);

      setEditingMemberId(null);
      setMessage("Member removed successfully.");

      await loadGroupDetails(groupDetails.id);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  // ========================================
  // RENDER
  // ========================================

  return (
    <section className="dashboard-panel">
      <div className="dashboard-panel-heading">
        <div>
          <h2>Group Management</h2>
          <p>
            Create groups, collaborate with members, and manage
            shared clothing donations.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-outline"
          disabled={loading || busy}
          onClick={() => void loadGroups()}
        >
          Refresh Groups
        </button>
      </div>

      {error && (
        <div className="alert alert-error" role="alert">
          {error}
        </div>
      )}

      {message && (
        <div className="alert alert-success" role="status">
          {message}
        </div>
      )}

      {/* ========================================
          CREATE GROUP
      ======================================== */}

      <div className="dashboard-panel">
        <h3>Create a Group</h3>

        <form onSubmit={handleCreateGroup}>
          <div className="form-group">
            <label htmlFor="new-group-name">Group Name</label>

            <input
              id="new-group-name"
              type="text"
              value={newGroupName}
              onChange={(event) =>
                setNewGroupName(event.target.value)
              }
              placeholder="Example: Winter Clothing Team"
              minLength={1}
              maxLength={100}
              required
              disabled={busy}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={busy}
          >
            {busy ? "Please wait..." : "Create Group"}
          </button>
        </form>
      </div>

      {/* ========================================
          GROUP LIST
      ======================================== */}

      <div className="dashboard-panel">
        <h3>My Groups</h3>

        {loading ? (
          <p>Loading your groups...</p>
        ) : groups.length === 0 ? (
          <div className="dashboard-empty">
            <h3>No Groups Yet</h3>
            <p>
              Create a group above, or ask another group owner
              to add you using your Account ID.
            </p>
          </div>
        ) : (
          <div className="form-group">
            <label htmlFor="selected-group">
              Select a Group
            </label>

            <select
              id="selected-group"
              value={selectedGroupId ?? ""}
              disabled={busy}
              onChange={(event) =>
                setSelectedGroupId(Number(event.target.value))
              }
            >
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name} (Group #{group.id})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* ========================================
          SELECTED GROUP
      ======================================== */}

      {loadingDetails && <p>Loading group details...</p>}

      {groupDetails && !loadingDetails && (
        <>
          <div className="dashboard-panel">
            <div className="dashboard-panel-heading">
              <div>
                <h3>{groupDetails.name}</h3>

                <p>Group ID: {groupDetails.id}</p>
                <p>Owner ID: {groupDetails.owner_id}</p>

                <span className="dashboard-role">
                  {isOwner ? "Group Owner" : "Group Member"}
                </span>
              </div>

              {isOwner && (
                <div className="dashboard-header-actions">
                  <button
                    type="button"
                    className="btn btn-outline"
                    disabled={busy}
                    onClick={() => {
                      setEditingGroupName((previous) => !previous);
                      setGroupName(groupDetails.name);
                    }}
                  >
                    {editingGroupName ? "Cancel Rename" : "Rename"}
                  </button>

                  <button
                    type="button"
                    className="btn btn-danger"
                    disabled={busy}
                    onClick={() => void handleDeleteGroup()}
                  >
                    Delete Group
                  </button>
                </div>
              )}
            </div>

            {editingGroupName && isOwner && (
              <form onSubmit={handleRenameGroup}>
                <div className="form-group">
                  <label htmlFor="rename-group-name">
                    New Group Name
                  </label>

                  <input
                    id="rename-group-name"
                    type="text"
                    value={groupName}
                    onChange={(event) =>
                      setGroupName(event.target.value)
                    }
                    maxLength={100}
                    required
                    disabled={busy}
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={busy}
                >
                  Save Group Name
                </button>
              </form>
            )}
          </div>

          {/* ========================================
              ADD MEMBER - OWNER ONLY
          ======================================== */}

          {isOwner && (
            <div className="dashboard-panel">
              <h3>Add Group Member</h3>

              <p>
                Ask the person to open their WarmShare dashboard
                and share their Account ID with you.
              </p>

              <form onSubmit={handleAddMember}>
                <div className="form-group">
                  <label htmlFor="new-member-id">
                    Member User ID
                  </label>

                  <input
                    id="new-member-id"
                    type="number"
                    min={1}
                    step={1}
                    value={newMemberId}
                    onChange={(event) =>
                      setNewMemberId(event.target.value)
                    }
                    placeholder="Example: 12"
                    required
                    disabled={busy}
                  />
                </div>

                <h4>Member Permissions</h4>

                <PermissionCheckbox
                  label="Create"
                  description="Create new donation listings for this group."
                  checked={newMemberPermissions.can_create}
                  disabled={busy}
                  onChange={(value) =>
                    setNewMemberPermissions((previous) => ({
                      ...previous,
                      can_create: value,
                    }))
                  }
                />

                <PermissionCheckbox
                  label="Edit"
                  description="Edit existing donation listings in this group."
                  checked={newMemberPermissions.can_edit}
                  disabled={busy}
                  onChange={(value) =>
                    setNewMemberPermissions((previous) => ({
                      ...previous,
                      can_edit: value,
                    }))
                  }
                />

                <PermissionCheckbox
                  label="Assign"
                  description="Assign their own personal donations to this group."
                  checked={newMemberPermissions.can_assign}
                  disabled={busy}
                  onChange={(value) =>
                    setNewMemberPermissions((previous) => ({
                      ...previous,
                      can_assign: value,
                    }))
                  }
                />

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={busy}
                >
                  Add Member
                </button>
              </form>
            </div>
          )}

          {/* ========================================
              GROUP MEMBERS
          ======================================== */}

          <div className="dashboard-panel">
            <h3>Group Members</h3>

            <p>
              The group owner has all permissions automatically.
              Other members have only the permissions granted to them.
            </p>

            {groupDetails.members.length === 0 ? (
              <div className="dashboard-empty">
                <h3>No Members Added</h3>
                <p>
                  This group currently has no additional members.
                </p>
              </div>
            ) : (
              <div className="user-donation-list">
                {groupDetails.members.map((member) => (
                  <article
                    className="user-donation-card"
                    key={member.id}
                  >
                    <div>
                      <h4>User #{member.user_id}</h4>

                      {editingMemberId === member.user_id && isOwner ? (
                        <>
                          <PermissionCheckbox
                            label="Create"
                            description="Create group donations."
                            checked={editingPermissions.can_create}
                            disabled={busy}
                            onChange={(value) =>
                              setEditingPermissions((previous) => ({
                                ...previous,
                                can_create: value,
                              }))
                            }
                          />

                          <PermissionCheckbox
                            label="Edit"
                            description="Edit group donations."
                            checked={editingPermissions.can_edit}
                            disabled={busy}
                            onChange={(value) =>
                              setEditingPermissions((previous) => ({
                                ...previous,
                                can_edit: value,
                              }))
                            }
                          />

                          <PermissionCheckbox
                            label="Assign"
                            description="Assign their own donations to this group."
                            checked={editingPermissions.can_assign}
                            disabled={busy}
                            onChange={(value) =>
                              setEditingPermissions((previous) => ({
                                ...previous,
                                can_assign: value,
                              }))
                            }
                          />

                          <div className="dashboard-header-actions">
                            <button
                              type="button"
                              className="btn btn-primary"
                              disabled={busy}
                              onClick={() =>
                                void handleSaveMemberPermissions(
                                  member.user_id
                                )
                              }
                            >
                              Save Permissions
                            </button>

                            <button
                              type="button"
                              className="btn btn-outline"
                              disabled={busy}
                              onClick={() => setEditingMemberId(null)}
                            >
                              Cancel
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <p>
                            Create: {member.can_create ? "Allowed" : "Not allowed"}
                          </p>

                          <p>
                            Edit: {member.can_edit ? "Allowed" : "Not allowed"}
                          </p>

                          <p>
                            Assign: {member.can_assign ? "Allowed" : "Not allowed"}
                          </p>

                          {isOwner && (
                            <div className="dashboard-header-actions">
                              <button
                                type="button"
                                className="btn btn-outline"
                                disabled={busy}
                                onClick={() => startEditingMember(member)}
                              >
                                Edit Permissions
                              </button>

                              <button
                                type="button"
                                className="btn btn-danger"
                                disabled={busy}
                                onClick={() =>
                                  void handleRemoveMember(member.user_id)
                                }
                              >
                                Remove Member
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>

          {/* ========================================
              SHARED DONATIONS
          ======================================== */}

          <div className="dashboard-panel">
            <h3>Shared Group Donations</h3>

            {groupDetails.listings.length === 0 ? (
              <div className="dashboard-empty">
                <h3>No Shared Donations Yet</h3>

                <p>
                  Group donations will appear here after members
                  create or assign donations to this group.
                </p>
              </div>
            ) : (
              <div className="user-donation-list">
                {groupDetails.listings.map((listing) => (
                  <article
                    className="user-donation-card"
                    key={listing.id}
                  >
                    <div>
                      <h4>{listing.title}</h4>

                      <p>
                        {listing.category} · {listing.size} ·{" "}
                        {listing.condition}
                      </p>

                      <p>Quantity: {listing.quantity}</p>

                      <p>
                        Pickup address: {listing.pickup_address}
                      </p>
                    </div>

                    <span className="dashboard-role">
                      Listing #{listing.id}
                    </span>
                  </article>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
}

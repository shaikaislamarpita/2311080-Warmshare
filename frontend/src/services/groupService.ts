
import { authenticatedFetch } from "./api";

import type {
  Group,
  GroupCreate,
  GroupDetail,
  GroupMember,
  GroupMemberCreate,
  GroupMemberPermissionUpdate,
  GroupUpdate,
} from "../types/group";

const GROUPS_URL = "/api/groups";

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let message = `Request failed (${response.status})`;

    try {
      const data = await response.json();

      if (typeof data.detail === "string") {
        message = data.detail;
      } else if (Array.isArray(data.detail)) {
        message = data.detail
          .map((error: { msg?: string }) => error.msg ?? "Invalid request")
          .join(", ");
      }
    } catch {
      // Keep the default error message.
    }

    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

/**
 * Create a new group.
 */
export async function createGroup(
  groupData: GroupCreate
): Promise<Group> {
  const response = await authenticatedFetch(GROUPS_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(groupData),
  });

  return handleResponse<Group>(response);
}

/**
 * Get groups owned by or joined by the current user.
 */
export async function getMyGroups(): Promise<Group[]> {
  const response = await authenticatedFetch(GROUPS_URL);

  return handleResponse<Group[]>(response);
}

/**
 * Get group details, members and shared donations.
 */
export async function getGroupDetails(
  groupId: number
): Promise<GroupDetail> {
  const response = await authenticatedFetch(
    `${GROUPS_URL}/${groupId}`
  );

  return handleResponse<GroupDetail>(response);
}

/**
 * Rename a group.
 * Only the group owner is authorized by the backend.
 */
export async function updateGroup(
  groupId: number,
  groupData: GroupUpdate
): Promise<Group> {
  const response = await authenticatedFetch(
    `${GROUPS_URL}/${groupId}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(groupData),
    }
  );

  return handleResponse<Group>(response);
}

/**
 * Delete a group.
 * Only the group owner is authorized by the backend.
 */
export async function deleteGroup(
  groupId: number
): Promise<void> {
  const response = await authenticatedFetch(
    `${GROUPS_URL}/${groupId}`,
    {
      method: "DELETE",
    }
  );

  return handleResponse<void>(response);
}

/**
 * Add a member to a group.
 */
export async function addGroupMember(
  groupId: number,
  memberData: GroupMemberCreate
): Promise<GroupMember> {
  const response = await authenticatedFetch(
    `${GROUPS_URL}/${groupId}/members`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(memberData),
    }
  );

  return handleResponse<GroupMember>(response);
}

/**
 * Get all members of a group.
 */
export async function getGroupMembers(
  groupId: number
): Promise<GroupMember[]> {
  const response = await authenticatedFetch(
    `${GROUPS_URL}/${groupId}/members`
  );

  return handleResponse<GroupMember[]>(response);
}

/**
 * Update a member's permissions.
 */
export async function updateGroupMemberPermissions(
  groupId: number,
  userId: number,
  permissions: GroupMemberPermissionUpdate
): Promise<GroupMember> {
  const response = await authenticatedFetch(
    `${GROUPS_URL}/${groupId}/members/${userId}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(permissions),
    }
  );

  return handleResponse<GroupMember>(response);
}

/**
 * Remove a member from a group.
 */
export async function removeGroupMember(
  groupId: number,
  userId: number
): Promise<void> {
  const response = await authenticatedFetch(
    `${GROUPS_URL}/${groupId}/members/${userId}`,
    {
      method: "DELETE",
    }
  );

  return handleResponse<void>(response);
}

/**
 * Get donations shared with a group.
 */
export async function getGroupListings(
  groupId: number
): Promise<GroupDetail["listings"]> {
  const response = await authenticatedFetch(
    `${GROUPS_URL}/${groupId}/listings`
  );

  return handleResponse<GroupDetail["listings"]>(response);
}


import type { Listing } from "./listing";

/**
 * Permissions granted to a group member.
 *
 * can_create: Create donations directly inside a group.
 * can_edit: Edit existing group donations.
 * can_assign: Assign their own personal donations to a group.
 */
export type GroupPermissions = {
  can_create: boolean;
  can_edit: boolean;
  can_assign: boolean;
};

/**
 * Data required to create a group.
 */
export type GroupCreate = {
  name: string;
};

/**
 * Data required to rename a group.
 */
export type GroupUpdate = {
  name: string;
};

/**
 * Basic group information returned by the backend.
 */
export type Group = {
  id: number;
  name: string;
  owner_id: number;
  created_at: string;
};

/**
 * Data required to add a member to a group.
 */
export type GroupMemberCreate = {
  user_id: number;
  can_create: boolean;
  can_edit: boolean;
  can_assign: boolean;
};

/**
 * Member permission update request.
 */
export type GroupMemberPermissionUpdate = GroupPermissions;

/**
 * Group member information returned by the backend.
 */
export type GroupMember = {
  id: number;
  group_id: number;
  user_id: number;
  can_create: boolean;
  can_edit: boolean;
  can_assign: boolean;
  created_at: string;
};

/**
 * Detailed group response.
 */
export type GroupDetail = Group & {
  members: GroupMember[];
  listings: Listing[];
};

/**
 * Shared group donation.
 */
export type GroupListing = Listing & {
  group_id: number | null;
};

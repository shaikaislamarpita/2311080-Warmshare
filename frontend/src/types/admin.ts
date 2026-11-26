export type AdminDashboardStats = {
  total_users: number;
  total_donors: number;
  total_moderators: number;
  total_banned_users: number;
  total_listings: number;
  visible_listings: number;
  hidden_listings: number;
  pending_reports: number;
  active_sessions: number;
};

export type AdminUser = {
  id: number;
  full_name: string;
  email: string;
  role: "user" | "moderator" | "admin";
  is_banned: boolean;
  ban_reason: string | null;
  banned_at: string | null;
  created_at: string;
};

export type AdminUserPage = {
  items: AdminUser[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
};

export type AdminUserDetail = AdminUser & {
  updated_at?: string;
  listings: unknown[];
  owned_groups: unknown[];
  group_memberships: unknown[];
  sessions: unknown[];
  recent_activity: AuditLog[];
};

export type AdminBulkBanResult = {
  requested_count: number;
  updated_count: number;
  skipped_count: number;
  skipped_user_ids: number[];
};

export type AuditLog = {
  id: number;
  actor_id: number;
  action: string;
  target_type: string;
  target_id: string;
  details: Record<string, unknown> | null;
  created_at: string;
};

export type FailedLoginAttempt = {
  identifier_reference: string;
  failed_attempts: number;
  blocked_until: string | null;
  updated_at: string;
  is_blocked: boolean;
};

// ========================================
// ADMIN ACTIVE SESSION DETAILS
// ========================================

export type AdminActiveSession = {
  session_id: string;
  user_id: number;
  full_name: string;
  email: string;
  role: string;
  created_at: string;
  expires_at: string;
};
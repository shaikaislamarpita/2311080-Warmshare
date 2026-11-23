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
  role: string;
  is_banned: boolean;
  ban_reason: string | null;
  banned_at: string | null;
  created_at: string;
};

export type AuditLog = {
  id: number;
  actor_id: number;
  action: string;
  target_type: string;
  target_id: number;
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
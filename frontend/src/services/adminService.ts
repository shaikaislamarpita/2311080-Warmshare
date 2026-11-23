import { authenticatedFetch } from "./api";
import type {
  AdminDashboardStats,
  AdminUser,
  AuditLog,
  FailedLoginAttempt,
} from "../types/admin";

export async function getAdminStats(): Promise<AdminDashboardStats> {
  const response = await authenticatedFetch("/api/admin/dashboard/stats");

  if (!response.ok) {
    throw new Error(`Failed to load dashboard statistics (${response.status})`);
  }

  return response.json();
}

export async function getAdminUsers(): Promise<AdminUser[]> {
  const response = await authenticatedFetch("/api/admin/users");

  if (!response.ok) {
    throw new Error(`Failed to load users (${response.status})`);
  }

  return response.json();
}

export async function updateUserRole(
  userId: number,
  role: "user" | "moderator",
): Promise<AdminUser> {
  const response = await authenticatedFetch(
    `/api/admin/users/${userId}/role`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    },
  );

  if (!response.ok) {
    throw new Error(`Failed to update user role (${response.status})`);
  }

  return response.json();
}

export async function updateUserBan(
  userId: number,
  isBanned: boolean,
  reason: string | null,
): Promise<AdminUser> {
  const response = await authenticatedFetch(
    `/api/admin/users/${userId}/ban`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        is_banned: isBanned,
        reason,
      }),
    },
  );

  if (!response.ok) {
    throw new Error(`Failed to update user ban (${response.status})`);
  }

  return response.json();
}

export async function revokeUserSessions(userId: number): Promise<void> {
  const response = await authenticatedFetch(
    `/api/admin/users/${userId}/sessions`,
    { method: "DELETE" },
  );

  if (!response.ok) {
    throw new Error(`Failed to revoke sessions (${response.status})`);
  }
}

export async function getAuditLogs(
  limit = 50,
): Promise<AuditLog[]> {
  const response = await authenticatedFetch(
    `/api/admin/audit-logs?limit=${limit}`,
  );

  if (!response.ok) {
    throw new Error(`Failed to load audit logs (${response.status})`);
  }

  return response.json();
}

export async function getFailedLoginAttempts(
  limit = 50,
): Promise<FailedLoginAttempt[]> {
  const response = await authenticatedFetch(
    `/api/admin/security/failed-logins?limit=${limit}`,
  );

  if (!response.ok) {
    throw new Error(`Failed to load failed login attempts (${response.status})`);
  }

  return response.json();
}

export async function exportAuditLogs(): Promise<Blob> {
  const response = await authenticatedFetch(
    "/api/admin/export/audit-logs",
  );

  if (!response.ok) {
    throw new Error(`Failed to export audit logs (${response.status})`);
  }

  return response.blob();
}

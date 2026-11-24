
import { authenticatedFetch } from "./api";

import type {
  AdminDashboardStats,
  AdminUser,
  AdminUserPage,
  AdminUserDetail,
  AdminBulkBanResult,
  AuditLog,
  FailedLoginAttempt,
} from "../types/admin";

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let message = `Request failed (${response.status})`;

    try {
      const data = await response.json();
      message = data.detail || message;
    } catch {
      // Keep the default error message.
    }

    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

// ========================================
// DASHBOARD STATISTICS
// ========================================

export async function getAdminStats(): Promise<AdminDashboardStats> {
  const response = await authenticatedFetch(
    "/api/admin/dashboard/stats"
  );

  return handleResponse<AdminDashboardStats>(response);
}

// ========================================
// ALL USERS - LEGACY ENDPOINT
// ========================================

export async function getAdminUsers(): Promise<AdminUser[]> {
  const response = await authenticatedFetch("/api/admin/users");

  return handleResponse<AdminUser[]>(response);
}

// ========================================
// PAGINATED USERS
// ========================================

export async function getPaginatedAdminUsers(
  page = 1,
  pageSize = 8
): Promise<AdminUserPage> {
  const response = await authenticatedFetch(
    `/api/admin/users/paginated?page=${page}&page_size=${pageSize}`
  );

  return handleResponse<AdminUserPage>(response);
}

// ========================================
// USER DETAILS
// ========================================

export async function getAdminUserDetail(
  userId: number
): Promise<AdminUserDetail> {
  const response = await authenticatedFetch(
    `/api/admin/users/${userId}`
  );

  return handleResponse<AdminUserDetail>(response);
}

// ========================================
// CHANGE USER ROLE
// ========================================

export async function updateUserRole(
  userId: number,
  role: "user" | "moderator"
): Promise<AdminUser> {
  const response = await authenticatedFetch(
    `/api/admin/users/${userId}/role`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ role }),
    }
  );

  return handleResponse<AdminUser>(response);
}

// ========================================
// BAN / UNBAN ONE USER
// ========================================

export async function updateUserBan(
  userId: number,
  isBanned: boolean,
  reason: string | null
): Promise<AdminUser> {
  const response = await authenticatedFetch(
    `/api/admin/users/${userId}/ban`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        is_banned: isBanned,
        reason,
      }),
    }
  );

  return handleResponse<AdminUser>(response);
}

// ========================================
// BULK BAN / UNBAN
// ========================================

export async function bulkUpdateUserBan(
  userIds: number[],
  isBanned: boolean,
  reason: string | null
): Promise<AdminBulkBanResult> {
  const response = await authenticatedFetch(
    "/api/admin/users/bulk-ban",
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_ids: userIds,
        is_banned: isBanned,
        reason,
      }),
    }
  );

  return handleResponse<AdminBulkBanResult>(response);
}

// ========================================
// REVOKE USER SESSIONS
// ========================================

export async function revokeUserSessions(
  userId: number
): Promise<{ message: string; revoked_sessions: number }> {
  const response = await authenticatedFetch(
    `/api/admin/users/${userId}/sessions`,
    {
      method: "DELETE",
    }
  );

  return handleResponse(response);
}

// ========================================
// AUDIT LOGS
// ========================================

export async function getAuditLogs(
  limit = 50
): Promise<AuditLog[]> {
  const response = await authenticatedFetch(
    `/api/admin/audit-logs?limit=${limit}`
  );

  return handleResponse<AuditLog[]>(response);
}

// ========================================
// FAILED LOGIN MONITORING
// ========================================

export async function getFailedLoginAttempts(
  limit = 50
): Promise<FailedLoginAttempt[]> {
  const response = await authenticatedFetch(
    `/api/admin/security/failed-logins?limit=${limit}`
  );

  return handleResponse<FailedLoginAttempt[]>(response);
}

// ========================================
// EXPORT AUDIT LOGS
// ========================================

export async function exportAuditLogs(): Promise<Blob> {
  const response = await authenticatedFetch(
    "/api/admin/export/audit-logs"
  );

  if (!response.ok) {
    throw new Error(
      `Failed to export audit logs (${response.status})`
    );
  }

  return response.blob();
}

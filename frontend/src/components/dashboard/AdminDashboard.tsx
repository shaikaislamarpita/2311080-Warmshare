
import { useEffect, useMemo, useState } from "react";

import type {
  AdminDashboardStats,
  AdminUser,
  AuditLog,
  FailedLoginAttempt,
} from "../../types/admin";

import {
  getAdminStats,
  getAdminUsers,
  getAuditLogs,
  getFailedLoginAttempts,
  updateUserRole,
  updateUserBan,
  revokeUserSessions,
  exportAuditLogs,
} from "../../services/adminService";

type AdminDashboardProps = {
  currentUserId: number;
  onBack: () => void;
};

const PAGE_SIZE = 8;

export default function AdminDashboard({
  currentUserId,
  onBack,
}: AdminDashboardProps) {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [failedLogins, setFailedLogins] = useState<FailedLoginAttempt[]>([]);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);

  const [banReasons, setBanReasons] = useState<Record<number, string>>({});
  const [busyUserId, setBusyUserId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function loadDashboard() {
    setLoading(true);
    setError("");

    try {
      const [
        statsData,
        usersData,
        auditData,
        failedLoginData,
      ] = await Promise.all([
        getAdminStats(),
        getAdminUsers(),
        getAuditLogs(50),
        getFailedLoginAttempts(50),
      ]);

      setStats(statsData);
      setUsers(usersData);
      setAuditLogs(auditData);
      setFailedLogins(failedLoginData);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load the admin dashboard."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadDashboard();
  }, []);

  const filteredUsers = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return users.filter((user) => {
      const matchesSearch =
        user.full_name.toLowerCase().includes(keyword) ||
        user.email.toLowerCase().includes(keyword) ||
        String(user.id).includes(keyword);

      const matchesRole =
        roleFilter === "all" || user.role === roleFilter;

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "banned" && user.is_banned) ||
        (statusFilter === "active" && !user.is_banned);

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, search, roleFilter, statusFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredUsers.length / PAGE_SIZE)
  );

  const visibleUsers = filteredUsers.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  useEffect(() => {
    setPage(1);
  }, [search, roleFilter, statusFilter]);

  async function handleRoleChange(
    userId: number,
    role: "user" | "moderator"
  ) {
    if (userId === currentUserId) {
      setError("You cannot change your own role.");
      return;
    }

    setBusyUserId(userId);
    setError("");
    setMessage("");

    try {
      const updatedUser = await updateUserRole(userId, role);

      setUsers((previous) =>
        previous.map((user) =>
          user.id === userId ? updatedUser : user
        )
      );

      setMessage("User role updated successfully.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to update user role."
      );
    } finally {
      setBusyUserId(null);
    }
  }

  async function handleBanToggle(user: AdminUser) {
    if (user.id === currentUserId) {
      setError("You cannot ban your own account.");
      return;
    }

    const reason = user.is_banned
      ? null
      : (banReasons[user.id] || "").trim();

    if (!user.is_banned && (reason === null || reason.length < 3)) {
      setError("Please enter a ban reason of at least 3 characters.");
      return;
    }

    setBusyUserId(user.id);
    setError("");
    setMessage("");

    try {
      const updatedUser = await updateUserBan(
        user.id,
        !user.is_banned,
        reason
      );

      setUsers((previous) =>
        previous.map((item) =>
          item.id === user.id ? updatedUser : item
        )
      );

      setMessage(
        user.is_banned
          ? "User unbanned successfully."
          : "User banned successfully."
      );

      if (!user.is_banned) {
        setBanReasons((previous) => ({
          ...previous,
          [user.id]: "",
        }));
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to update user status."
      );
    } finally {
      setBusyUserId(null);
    }
  }

  async function handleRevokeSessions(user: AdminUser) {
    if (user.id === currentUserId) {
      setError("Use your own account session settings to manage your sessions.");
      return;
    }

    const confirmed = window.confirm(
      `Revoke all active sessions for ${user.full_name}?`
    );

    if (!confirmed) return;

    setBusyUserId(user.id);
    setError("");
    setMessage("");

    try {
      await revokeUserSessions(user.id);
      setMessage(`Active sessions revoked for ${user.full_name}.`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to revoke sessions."
      );
    } finally {
      setBusyUserId(null);
    }
  }

  async function handleExport() {
    setExporting(true);
    setError("");
    setMessage("");

    try {
      const file = await exportAuditLogs();
      const url = URL.createObjectURL(file);
      const link = document.createElement("a");

      link.href = url;
      link.download = "warmshare-audit-logs.csv";
      document.body.appendChild(link);
      link.click();
      link.remove();

      URL.revokeObjectURL(url);

      setMessage("Audit log export downloaded.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to export audit logs."
      );
    } finally {
      setExporting(false);
    }
  }

  if (loading) {
    return (
      <section className="dashboard-page">
        <p>Loading Admin Dashboard...</p>
      </section>
    );
  }

  return (
    <section className="dashboard-page">
      <div className="dashboard-header">
        <div>
          <span className="section-label">WARMSHARE ADMINISTRATION</span>
          <h1>Admin Dashboard</h1>
          <p>Manage users, monitor activity, and oversee platform security.</p>
        </div>

        <div className="dashboard-header-actions">
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => void loadDashboard()}
          >
            Refresh
          </button>

          <button
            type="button"
            className="btn btn-primary"
            onClick={onBack}
          >
            Back to Home
          </button>
        </div>
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

      {stats && (
        <>
          <div className="dashboard-stats">
            <div className="dashboard-stat-card">
              <span>Total Users</span>
              <strong>{stats.total_users}</strong>
            </div>
            <div className="dashboard-stat-card">
              <span>Donors</span>
              <strong>{stats.total_donors}</strong>
            </div>
            <div className="dashboard-stat-card">
              <span>Moderators</span>
              <strong>{stats.total_moderators}</strong>
            </div>
            <div className="dashboard-stat-card">
              <span>Banned Users</span>
              <strong>{stats.total_banned_users}</strong>
            </div>
            <div className="dashboard-stat-card">
              <span>Total Listings</span>
              <strong>{stats.total_listings}</strong>
            </div>
            <div className="dashboard-stat-card">
              <span>Visible Listings</span>
              <strong>{stats.visible_listings}</strong>
            </div>
            <div className="dashboard-stat-card">
              <span>Hidden Listings</span>
              <strong>{stats.hidden_listings}</strong>
            </div>
            <div className="dashboard-stat-card">
              <span>Pending Reports</span>
              <strong>{stats.pending_reports}</strong>
            </div>
            <div className="dashboard-stat-card">
              <span>Active Sessions</span>
              <strong>{stats.active_sessions}</strong>
            </div>
          </div>

          <section className="dashboard-panel">
            <div className="dashboard-panel-heading">
              <div>
                <h2>User Management</h2>
                <p>Search users, manage roles, and control account access.</p>
              </div>
            </div>

            <div className="dashboard-filters">
              <input
                type="search"
                placeholder="Search by name, email, or ID..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />

              <select
                value={roleFilter}
                onChange={(event) => setRoleFilter(event.target.value)}
                aria-label="Filter users by role"
              >
                <option value="all">All Roles</option>
                <option value="user">Users</option>
                <option value="moderator">Moderators</option>
                <option value="admin">Admins</option>
              </select>

              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                aria-label="Filter users by account status"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="banned">Banned</option>
              </select>
            </div>

            <div className="dashboard-table-wrapper">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Joined</th>
                    <th>Manage Role</th>
                    <th>Account Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {visibleUsers.map((user) => {
                    const isSelf = user.id === currentUserId;
                    const isAdmin = user.role === "admin";
                    const isBusy = busyUserId === user.id;

                    return (
                      <tr key={user.id}>
                        <td>
                          <strong>{user.full_name}</strong>
                          <small>{user.email}</small>
                          <small>ID: {user.id}</small>
                        </td>

                        <td>
                          <span className="dashboard-role">
                            {user.role}
                          </span>
                        </td>

                        <td>
                          <span
                            className={
                              user.is_banned
                                ? "dashboard-status banned"
                                : "dashboard-status active"
                            }
                          >
                            {user.is_banned ? "Banned" : "Active"}
                          </span>
                        </td>

                        <td>
                          {new Date(user.created_at).toLocaleDateString()}
                        </td>

                        <td>
                          {!isAdmin && !isSelf ? (
                            <select
                              aria-label={`Change role for ${user.full_name}`}
                              value={user.role}
                              disabled={isBusy}
                              onChange={(event) =>
                                void handleRoleChange(
                                  user.id,
                                  event.target.value as "user" | "moderator"
                                )
                              }
                            >
                              <option value="user">User</option>
                              <option value="moderator">Moderator</option>
                            </select>
                          ) : (
                            <span>{isSelf ? "Your account" : "Protected"}</span>
                          )}
                        </td>

                        <td>
                          {!isAdmin && !isSelf ? (
                            <div className="dashboard-user-actions">
                              {!user.is_banned && (
                                <input
                                  type="text"
                                  placeholder="Ban reason"
                                  aria-label={`Ban reason for ${user.full_name}`}
                                  value={banReasons[user.id] || ""}
                                  onChange={(event) =>
                                    setBanReasons((previous) => ({
                                      ...previous,
                                      [user.id]: event.target.value,
                                    }))
                                  }
                                />
                              )}

                              <button
                                type="button"
                                className={
                                  user.is_banned
                                    ? "btn btn-primary"
                                    : "btn btn-danger"
                                }
                                disabled={isBusy}
                                onClick={() => void handleBanToggle(user)}
                              >
                                {isBusy
                                  ? "Please wait..."
                                  : user.is_banned
                                    ? "Unban"
                                    : "Ban"}
                              </button>

                              <button
                                type="button"
                                className="btn btn-outline"
                                disabled={isBusy}
                                onClick={() => void handleRevokeSessions(user)}
                              >
                                Revoke Sessions
                              </button>
                            </div>
                          ) : (
                            <span>Protected account</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}

                  {visibleUsers.length === 0 && (
                    <tr>
                      <td colSpan={6}>No matching users found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="dashboard-pagination">
              <span>
                Showing{" "}
                {filteredUsers.length === 0
                  ? 0
                  : (page - 1) * PAGE_SIZE + 1}
                {" - "}
                {Math.min(page * PAGE_SIZE, filteredUsers.length)}
                {" of "}
                {filteredUsers.length} users
              </span>

              <div>
                <button
                  type="button"
                  className="btn btn-outline"
                  disabled={page <= 1}
                  onClick={() => setPage((previous) => previous - 1)}
                >
                  Previous
                </button>

                <span>
                  Page {page} of {totalPages}
                </span>

                <button
                  type="button"
                  className="btn btn-outline"
                  disabled={page >= totalPages}
                  onClick={() => setPage((previous) => previous + 1)}
                >
                  Next
                </button>
              </div>
            </div>
          </section>

          <section className="dashboard-panel">
            <div className="dashboard-panel-heading">
              <div>
                <h2>Security Monitoring</h2>
                <p>Recent failed login activity.</p>
              </div>
            </div>

            <div className="dashboard-table-wrapper">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Account Reference</th>
                    <th>Failed Attempts</th>
                    <th>Blocked</th>
                    <th>Blocked Until</th>
                    <th>Last Updated</th>
                  </tr>
                </thead>

                <tbody>
                  {failedLogins.map((attempt, index) => (
                    <tr key={`${attempt.identifier_reference}-${index}`}>
                      <td>{attempt.identifier_reference}</td>
                      <td>{attempt.failed_attempts}</td>
                      <td>{attempt.is_blocked ? "Yes" : "No"}</td>
                      <td>
                        {attempt.blocked_until
                          ? new Date(attempt.blocked_until).toLocaleString()
                          : "—"}
                      </td>
                      <td>
                        {new Date(attempt.updated_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}

                  {failedLogins.length === 0 && (
                    <tr>
                      <td colSpan={5}>No failed login records found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="dashboard-panel">
            <div className="dashboard-panel-heading">
              <div>
                <h2>Audit Logs</h2>
                <p>Recent administrative activity on WarmShare.</p>
              </div>

              <button
                type="button"
                className="btn btn-primary"
                disabled={exporting}
                onClick={() => void handleExport()}
              >
                {exporting ? "Exporting..." : "Export CSV"}
              </button>
            </div>

            <div className="dashboard-table-wrapper">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Actor ID</th>
                    <th>Action</th>
                    <th>Target</th>
                    <th>Target ID</th>
                    <th>Date</th>
                  </tr>
                </thead>

                <tbody>
                  {auditLogs.map((log) => (
                    <tr key={log.id}>
                      <td>{log.actor_id}</td>
                      <td>{log.action}</td>
                      <td>{log.target_type}</td>
                      <td>{log.target_id}</td>
                      <td>
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}

                  {auditLogs.length === 0 && (
                    <tr>
                      <td colSpan={5}>No audit logs found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </section>
  );
}


import { useEffect, useMemo, useState } from "react";
import type {
  AdminDashboardStats,
  AdminUser,
  AdminUserDetail,
  AdminUserPage,
  AuditLog,
  FailedLoginAttempt,
} from "../../types/admin";

import {
  getAdminStats,
  getPaginatedAdminUsers,
  getAdminUserDetail,
  updateUserRole,
  updateUserBan,
  bulkUpdateUserBan,
  revokeUserSessions,
  getAuditLogs,
  getFailedLoginAttempts,
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
  const [stats, setStats] =
    useState<AdminDashboardStats | null>(null);

  const [userPage, setUserPage] =
    useState<AdminUserPage | null>(null);

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  const [failedLogins, setFailedLogins] =
    useState<FailedLoginAttempt[]>([]);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [banReason, setBanReason] = useState("");

  const [selectedUser, setSelectedUser] =
    useState<AdminUserDetail | null>(null);

  const [loadingDetail, setLoadingDetail] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [exporting, setExporting] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // ========================================
  // LOAD DASHBOARD
  // ========================================

  async function loadDashboard() {
    setLoading(true);
    setError("");

    try {
      const [
        statsData,
        pageData,
        auditData,
        failedLoginData,
      ] = await Promise.all([
        getAdminStats(),
        getPaginatedAdminUsers(1, PAGE_SIZE),
        getAuditLogs(50),
        getFailedLoginAttempts(50),
      ]);

      setStats(statsData);
      setUserPage(pageData);
      setUsers(pageData.items);
      setAuditLogs(auditData);
      setFailedLogins(failedLoginData);
      setSelectedIds([]);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load Admin dashboard."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadDashboard();
  }, []);

  // ========================================
  // REFRESH AFTER ADMIN ACTION
  // IMPORTANT: Refresh statistics immediately.
  // Preserve the current pagination page.
  // ========================================

  async function refreshAfterAction(userId?: number) {
    try {
      const currentPage = userPage?.page ?? 1;

      const [
        statsData,
        pageData,
        auditData,
        failedLoginData,
      ] = await Promise.all([
        getAdminStats(),
        getPaginatedAdminUsers(currentPage, PAGE_SIZE),
        getAuditLogs(50),
        getFailedLoginAttempts(50),
      ]);

      // Update dashboard statistics immediately.
      setStats(statsData);

      // Update users without resetting pagination.
      setUserPage(pageData);
      setUsers(pageData.items);

      // Update audit and security information.
      setAuditLogs(auditData);
      setFailedLogins(failedLoginData);

      // Refresh selected user's details if necessary.
      if (
        userId !== undefined &&
        selectedUser?.id === userId
      ) {
        setSelectedUser(
          await getAdminUserDetail(userId)
        );
      }
    } catch (err) {
      setError(
        "The action succeeded, but the dashboard could not refresh. " +
          (err instanceof Error
            ? err.message
            : "Please click Refresh.")
      );
    }
  }

  // ========================================
  // LOAD A PAGE OF USERS
  // ========================================

  async function changePage(nextPage: number) {
    if (
      !userPage ||
      nextPage < 1 ||
      nextPage > userPage.total_pages
    ) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const data = await getPaginatedAdminUsers(
        nextPage,
        PAGE_SIZE
      );

      setUserPage(data);
      setUsers(data.items);
      setSelectedIds([]);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load users."
      );
    } finally {
      setLoading(false);
    }
  }

  // ========================================
  // SEARCH AND FILTER
  // ========================================

  const filteredUsers = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return users.filter((user) => {
      const matchesSearch =
        user.full_name.toLowerCase().includes(keyword) ||
        user.email.toLowerCase().includes(keyword) ||
        String(user.id).includes(keyword);

      const matchesRole =
        roleFilter === "all" ||
        user.role === roleFilter;

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "banned" && user.is_banned) ||
        (statusFilter === "active" && !user.is_banned);

      return (
        matchesSearch &&
        matchesRole &&
        matchesStatus
      );
    });
  }, [users, search, roleFilter, statusFilter]);

  const eligibleVisibleUsers = filteredUsers.filter(
    (user) =>
      user.id !== currentUserId &&
      user.role !== "admin"
  );

  const allVisibleSelected =
    eligibleVisibleUsers.length > 0 &&
    eligibleVisibleUsers.every((user) =>
      selectedIds.includes(user.id)
    );

  function toggleSelection(userId: number) {
    setSelectedIds((previous) =>
      previous.includes(userId)
        ? previous.filter((id) => id !== userId)
        : [...previous, userId]
    );
  }

  function toggleAllVisible() {
    const eligibleIds = eligibleVisibleUsers.map(
      (user) => user.id
    );

    if (
      eligibleIds.every((id) =>
        selectedIds.includes(id)
      )
    ) {
      setSelectedIds((previous) =>
        previous.filter(
          (id) => !eligibleIds.includes(id)
        )
      );
    } else {
      setSelectedIds((previous) =>
        Array.from(
          new Set([...previous, ...eligibleIds])
        )
      );
    }
  }

  // ========================================
  // CHANGE USER ROLE
  // ========================================

  async function handleRoleChange(
    userId: number,
    role: "user" | "moderator"
  ) {
    if (userId === currentUserId || busy) {
      return;
    }

    setBusy(true);
    setError("");
    setMessage("");

    try {
      const updatedUser = await updateUserRole(
        userId,
        role
      );

      setUsers((previous) =>
        previous.map((user) =>
          user.id === userId ? updatedUser : user
        )
      );

      setMessage("User role updated successfully.");

      // Refresh statistics immediately after role change.
      await refreshAfterAction(userId);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update user role."
      );
    } finally {
      setBusy(false);
    }
  }

  // ========================================
  // BAN OR UNBAN ONE USER
  // ========================================

  async function handleBanToggle(user: AdminUser) {
    if (
      user.id === currentUserId ||
      user.role === "admin" ||
      busy
    ) {
      return;
    }

    const reason = user.is_banned
      ? null
      : window.prompt(
          "Enter a reason for banning this user:"
        )?.trim() || null;

    if (
      !user.is_banned &&
      (!reason || reason.length < 3)
    ) {
      setError(
        "A ban reason of at least 3 characters is required."
      );
      return;
    }

    setBusy(true);
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
        updatedUser.is_banned
          ? "User banned successfully."
          : "User unbanned successfully."
      );

      // Refresh statistics immediately after ban/unban.
      await refreshAfterAction(user.id);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update user status."
      );
    } finally {
      setBusy(false);
    }
  }

  // ========================================
  // BULK BAN / UNBAN
  // ========================================

  async function handleBulkBan(isBanned: boolean) {
    if (busy) return;

    if (selectedIds.length === 0) {
      setError("Select at least one user first.");
      return;
    }

    const reason = isBanned
      ? banReason.trim()
      : null;

    if (
      isBanned &&
      (!reason || reason.length < 3)
    ) {
      setError(
        "Enter a ban reason of at least 3 characters."
      );
      return;
    }

    const confirmed = window.confirm(
      `${isBanned ? "Ban" : "Unban"} ${selectedIds.length} selected users?`
    );

    if (!confirmed) return;

    setBusy(true);
    setError("");
    setMessage("");

    try {
      const result = await bulkUpdateUserBan(
        selectedIds,
        isBanned,
        reason
      );

      setMessage(
        `Requested: ${result.requested_count}. ` +
          `Updated: ${result.updated_count}. ` +
          `Skipped: ${result.skipped_count}.`
      );

      setSelectedIds([]);
      setBanReason("");

      // Refresh statistics immediately after bulk action.
      await refreshAfterAction();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Bulk operation failed."
      );
    } finally {
      setBusy(false);
    }
  }

  // ========================================
  // VIEW USER DETAILS
  // ========================================

  async function handleViewDetails(userId: number) {
    setLoadingDetail(true);
    setError("");
    setSelectedUser(null);

    try {
      const details = await getAdminUserDetail(userId);

      setSelectedUser(details);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load user details."
      );
    } finally {
      setLoadingDetail(false);
    }
  }

  // ========================================
  // REVOKE SESSIONS
  // ========================================

  async function handleRevokeSessions(user: AdminUser) {
    if (
      user.id === currentUserId ||
      user.role === "admin" ||
      busy
    ) {
      return;
    }

    if (
      !window.confirm(
        `Revoke all sessions for ${user.full_name}?`
      )
    ) {
      return;
    }

    setBusy(true);
    setError("");
    setMessage("");

    try {
      const result = await revokeUserSessions(user.id);

      setMessage(
        `${result.revoked_sessions} active sessions revoked.`
      );

      await refreshAfterAction(user.id);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to revoke sessions."
      );
    } finally {
      setBusy(false);
    }
  }

  // ========================================
  // EXPORT AUDIT LOGS
  // ========================================

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

      setMessage(
        "Audit logs exported successfully."
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to export audit logs."
      );
    } finally {
      setExporting(false);
    }
  }

  // ========================================
  // LOADING SCREEN
  // ========================================

  if (loading && !userPage) {
    return (
      <section className="dashboard-page">
        <p>Loading Admin Dashboard...</p>
      </section>
    );
  }

  const totalPages = Math.max(
    1,
    userPage?.total_pages ?? 0
  );

  return (
    <section className="dashboard-page">

      {/* ========================================
          DASHBOARD HEADER
      ======================================== */}

      <div className="dashboard-header">
        <div>
          <span className="section-label">
            WARMSHARE ADMINISTRATION
          </span>

          <h1>Admin Dashboard</h1>

          <p>
            Manage users, monitor activity, and oversee platform security.
          </p>
        </div>

        <div className="dashboard-header-actions">
          <button
            type="button"
            className="btn btn-outline"
            disabled={busy || loading}
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

      {/* ========================================
          SUCCESS AND ERROR MESSAGES
      ======================================== */}

      {error && (
        <div
          className="alert alert-error"
          role="alert"
        >
          {error}
        </div>
      )}

      {message && (
        <div
          className="alert alert-success"
          role="status"
        >
          {message}
        </div>
      )}

      {stats && (
        <>

          {/* ========================================
              DASHBOARD STATISTICS
          ======================================== */}

          <div className="dashboard-stats">
            {[
              ["Total Users", stats.total_users],
              ["Donors", stats.total_donors],
              ["Moderators", stats.total_moderators],
              ["Banned Users", stats.total_banned_users],
              ["Total Listings", stats.total_listings],
              ["Visible Listings", stats.visible_listings],
              ["Hidden Listings", stats.hidden_listings],
              ["Pending Reports", stats.pending_reports],
              ["Active Sessions", stats.active_sessions],
            ].map(([label, value]) => (
              <div
                className="dashboard-stat-card"
                key={label}
              >
                <span>{label}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </div>

          {/* ========================================
              USER MANAGEMENT
          ======================================== */}

          <section className="dashboard-panel">

            <div className="dashboard-panel-heading">
              <div>
                <h2>User Management</h2>

                <p>
                  Search and manage registered WarmShare accounts.
                </p>
              </div>
            </div>

            {/* SEARCH AND FILTER */}

            <div className="dashboard-filters">
              <input
                type="search"
                placeholder="Search current page by name, email, or ID..."
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
              />

              <select
                value={roleFilter}
                onChange={(event) =>
                  setRoleFilter(event.target.value)
                }
                aria-label="Filter by role"
              >
                <option value="all">All Roles</option>
                <option value="user">Users</option>
                <option value="moderator">Moderators</option>
                <option value="admin">Admins</option>
              </select>

              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value)
                }
                aria-label="Filter by status"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="banned">Banned</option>
              </select>
            </div>

            {/* ========================================
                BULK ACTIONS
            ======================================== */}

            <div className="dashboard-user-actions">
              <span>
                {selectedIds.length} users selected
              </span>

              <input
                type="text"
                placeholder="Reason for bulk ban"
                value={banReason}
                onChange={(event) =>
                  setBanReason(event.target.value)
                }
              />

              <button
                type="button"
                className="btn btn-danger"
                disabled={
                  busy || selectedIds.length === 0
                }
                onClick={() =>
                  void handleBulkBan(true)
                }
              >
                Bulk Ban
              </button>

              <button
                type="button"
                className="btn btn-primary"
                disabled={
                  busy || selectedIds.length === 0
                }
                onClick={() =>
                  void handleBulkBan(false)
                }
              >
                Bulk Unban
              </button>
            </div>

            {/* ========================================
                USERS TABLE
            ======================================== */}

            <div className="dashboard-table-wrapper">
              <table className="dashboard-table">

                <thead>
                  <tr>
                    <th>
                      <input
                        type="checkbox"
                        checked={allVisibleSelected}
                        onChange={toggleAllVisible}
                        aria-label="Select all eligible visible users"
                      />
                    </th>

                    <th>User</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Joined</th>
                    <th>Manage Role</th>
                    <th>Account Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredUsers.map((user) => {
                    const isSelf =
                      user.id === currentUserId;

                    const isAdmin =
                      user.role === "admin";

                    const protectedUser =
                      isSelf || isAdmin;

                    return (
                      <tr key={user.id}>

                        {/* SELECTION */}

                        <td>
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(
                              user.id
                            )}
                            disabled={
                              protectedUser || busy
                            }
                            onChange={() =>
                              toggleSelection(user.id)
                            }
                            aria-label={`Select ${user.full_name}`}
                          />
                        </td>

                        {/* USER INFORMATION */}

                        <td>
                          <strong>
                            {user.full_name}
                          </strong>

                          <small>{user.email}</small>

                          <small>ID: {user.id}</small>
                        </td>

                        {/* ROLE */}

                        <td>
                          <span className="dashboard-role">
                            {user.role}
                          </span>
                        </td>

                        {/* STATUS */}

                        <td>
                          <span
                            className={
                              user.is_banned
                                ? "dashboard-status banned"
                                : "dashboard-status active"
                            }
                          >
                            {user.is_banned
                              ? "Banned"
                              : "Active"}
                          </span>
                        </td>

                        {/* JOINED DATE */}

                        <td>
                          {new Date(
                            user.created_at
                          ).toLocaleDateString()}
                        </td>

                        {/* MANAGE ROLE */}

                        <td>
                          {!protectedUser ? (
                            <select
                              value={user.role}
                              disabled={busy}
                              aria-label={`Change role for ${user.full_name}`}
                              onChange={(event) =>
                                void handleRoleChange(
                                  user.id,
                                  event.target.value as
                                    | "user"
                                    | "moderator"
                                )
                              }
                            >
                              <option value="user">
                                User
                              </option>

                              <option value="moderator">
                                Moderator
                              </option>
                            </select>
                          ) : (
                            <span>
                              {isSelf
                                ? "Your account"
                                : "Protected Admin"}
                            </span>
                          )}
                        </td>

                        {/* ACCOUNT ACTIONS */}

                        <td>
                          <div className="dashboard-user-actions">

                            <button
                              type="button"
                              className="btn btn-outline"
                              disabled={loadingDetail}
                              onClick={() =>
                                void handleViewDetails(
                                  user.id
                                )
                              }
                            >
                              View Details
                            </button>

                            {!protectedUser && (
                              <>
                                <button
                                  type="button"
                                  className={
                                    user.is_banned
                                      ? "btn btn-primary"
                                      : "btn btn-danger"
                                  }
                                  disabled={busy}
                                  onClick={() =>
                                    void handleBanToggle(
                                      user
                                    )
                                  }
                                >
                                  {user.is_banned
                                    ? "Unban"
                                    : "Ban"}
                                </button>

                                <button
                                  type="button"
                                  className="btn btn-outline"
                                  disabled={busy}
                                  onClick={() =>
                                    void handleRevokeSessions(
                                      user
                                    )
                                  }
                                >
                                  Revoke Sessions
                                </button>
                              </>
                            )}

                          </div>
                        </td>

                      </tr>
                    );
                  })}

                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={7}>
                        No matching users found on this page.
                      </td>
                    </tr>
                  )}
                </tbody>

              </table>
            </div>

            {/* ========================================
                SERVER-SIDE PAGINATION
            ======================================== */}

            <div className="dashboard-pagination">

              <span>
                Total registered users:{" "}
                {userPage?.total ?? 0}
              </span>

              <div>
                <button
                  type="button"
                  className="btn btn-outline"
                  disabled={
                    loading ||
                    (userPage?.page ?? 1) <= 1
                  }
                  onClick={() =>
                    void changePage(
                      (userPage?.page ?? 1) - 1
                    )
                  }
                >
                  Previous
                </button>

                <span>
                  Page {userPage?.page ?? 1} of{" "}
                  {totalPages}
                </span>

                <button
                  type="button"
                  className="btn btn-outline"
                  disabled={
                    loading ||
                    (userPage?.page ?? 1) >= totalPages
                  }
                  onClick={() =>
                    void changePage(
                      (userPage?.page ?? 1) + 1
                    )
                  }
                >
                  Next
                </button>
              </div>

            </div>

          </section>

          {/* ========================================
              USER DETAILS
          ======================================== */}

          {loadingDetail && (
            <section className="dashboard-panel">
              <p>Loading user details...</p>
            </section>
          )}

          {selectedUser && (
            <section className="dashboard-panel">

              <div className="dashboard-panel-heading">
                <div>
                  <h2>User Details</h2>
                  <p>{selectedUser.full_name}</p>
                </div>

                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() =>
                    setSelectedUser(null)
                  }
                >
                  Close Details
                </button>
              </div>

              <div className="dashboard-user-details">

                <p>
                  <strong>User ID:</strong>{" "}
                  {selectedUser.id}
                </p>

                <p>
                  <strong>Name:</strong>{" "}
                  {selectedUser.full_name}
                </p>

                <p>
                  <strong>Email:</strong>{" "}
                  {selectedUser.email}
                </p>

                <p>
                  <strong>Role:</strong>{" "}
                  {selectedUser.role}
                </p>

                <p>
                  <strong>Status:</strong>{" "}
                  {selectedUser.is_banned
                    ? "Banned"
                    : "Active"}
                </p>

                <p>
                  <strong>Ban reason:</strong>{" "}
                  {selectedUser.ban_reason || "None"}
                </p>

                <p>
                  <strong>Joined:</strong>{" "}
                  {new Date(
                    selectedUser.created_at
                  ).toLocaleString()}
                </p>

                <p>
                  <strong>Last updated:</strong>{" "}
                  {selectedUser.updated_at
                    ? new Date(
                        selectedUser.updated_at
                      ).toLocaleString()
                    : "Not available"}
                </p>

              </div>

              {(
                [
                  ["Listings", selectedUser.listings],
                  ["Owned Groups", selectedUser.owned_groups],
                  [
                    "Group Memberships",
                    selectedUser.group_memberships,
                  ],
                  ["Login Sessions", selectedUser.sessions],
                  [
                    "Recent Activity",
                    selectedUser.recent_activity,
                  ],
                ] as [string, unknown[]][]
              ).map(([title, items]) => (
                <div key={title}>

                  <h3>
                    {title} ({items.length})
                  </h3>

                  {items.length === 0 ? (
                    <p>No records found.</p>
                  ) : (
                    <pre className="admin-detail-json">
                      {JSON.stringify(
                        items,
                        null,
                        2
                      )}
                    </pre>
                  )}

                </div>
              ))}

            </section>
          )}

          {/* ========================================
              SECURITY MONITORING
          ======================================== */}

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
                  {failedLogins.map(
                    (attempt, index) => (
                      <tr
                        key={`${attempt.identifier_reference}-${index}`}
                      >
                        <td>
                          {attempt.identifier_reference}
                        </td>

                        <td>
                          {attempt.failed_attempts}
                        </td>

                        <td>
                          {attempt.is_blocked
                            ? "Yes"
                            : "No"}
                        </td>

                        <td>
                          {attempt.blocked_until
                            ? new Date(
                                attempt.blocked_until
                              ).toLocaleString()
                            : "—"}
                        </td>

                        <td>
                          {new Date(
                            attempt.updated_at
                          ).toLocaleString()}
                        </td>
                      </tr>
                    )
                  )}

                  {failedLogins.length === 0 && (
                    <tr>
                      <td colSpan={5}>
                        No failed login records found.
                      </td>
                    </tr>
                  )}
                </tbody>

              </table>
            </div>

          </section>

          {/* ========================================
              AUDIT LOGS
          ======================================== */}

          <section className="dashboard-panel">

            <div className="dashboard-panel-heading">
              <div>
                <h2>Audit Logs</h2>
                <p>
                  Recent administrative activity on WarmShare.
                </p>
              </div>

              <button
                type="button"
                className="btn btn-primary"
                disabled={exporting}
                onClick={() =>
                  void handleExport()
                }
              >
                {exporting
                  ? "Exporting..."
                  : "Export CSV"}
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
                        {new Date(
                          log.created_at
                        ).toLocaleString()}
                      </td>
                    </tr>
                  ))}

                  {auditLogs.length === 0 && (
                    <tr>
                      <td colSpan={5}>
                        No audit logs found.
                      </td>
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

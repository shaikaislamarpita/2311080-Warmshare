import { useEffect, useMemo, useState } from "react";

import type {
  AdminDashboardStats,
  AdminUser,
  AdminUserDetail,
  AdminUserPage,
  AuditLog,
  FailedLoginAttempt,
  AdminActiveSession,
} from "../../types/admin";

import type { ModeratorListing } from "../../types/listing";
import type { ListingReport } from "../../types/moderation";

import {
  getAdminStats,
  getAdminUsers,
  getAdminActiveSessions,
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

import {
  getModerationListings,
  getModerationReports,
} from "../../services/moderationService";


type AdminDashboardProps = {
  currentUserId: number;
  onBack: () => void;
};

const PAGE_SIZE = 8;


// ========================================
// STATISTICS CARD TYPES
// ========================================

type StatKey = keyof AdminDashboardStats;

const STAT_CARDS: {
  key: StatKey;
  label: string;
}[] = [
  { key: "total_users", label: "Total Users" },
  { key: "total_donors", label: "Donors" },
  { key: "total_moderators", label: "Moderators" },
  { key: "total_banned_users", label: "Banned Users" },
  { key: "total_listings", label: "Total Listings" },
  { key: "visible_listings", label: "Visible Listings" },
  { key: "hidden_listings", label: "Hidden Listings" },
  { key: "pending_reports", label: "Pending Reports" },
  { key: "active_sessions", label: "Active Sessions" },
];

type StatDetails =
  | { kind: "users"; items: AdminUser[] }
  | { kind: "listings"; items: ModeratorListing[] }
  | { kind: "reports"; items: ListingReport[] }
  | { kind: "sessions"; items: AdminActiveSession[] };


// ========================================
// DATE FORMAT HELPER
// ========================================

function formatDate(value?: string | null): string {
  if (!value) return "—";

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleString();
}


// ========================================
// FETCH STATISTICS DETAILS
// ========================================

async function fetchStatDetails(
  key: StatKey
): Promise<StatDetails> {
  switch (key) {
    case "total_users":
    case "total_donors":
    case "total_moderators":
    case "total_banned_users": {
      const allUsers = await getAdminUsers();

      const filtered = allUsers.filter((user) => {
        if (key === "total_donors") {
          return user.role === "user";
        }

        if (key === "total_moderators") {
          return user.role === "moderator";
        }

        if (key === "total_banned_users") {
          return user.is_banned;
        }

        return true;
      });

      return {
        kind: "users",
        items: filtered,
      };
    }

    case "total_listings":
    case "visible_listings":
    case "hidden_listings": {
      const allListings = await getModerationListings();

      const filtered = allListings.filter((listing) => {
        if (key === "visible_listings") {
          return listing.moderation_status === "visible";
        }

        if (key === "hidden_listings") {
          return listing.moderation_status === "hidden";
        }

        return true;
      });

      return {
        kind: "listings",
        items: filtered,
      };
    }

    case "pending_reports": {
      const reports = await getModerationReports();

      return {
        kind: "reports",
        items: reports,
      };
    }

    case "active_sessions": {
      const sessions = await getAdminActiveSessions();

      return {
        kind: "sessions",
        items: sessions,
      };
    }
  }
}


// ========================================
// ADMIN DASHBOARD
// ========================================

export default function AdminDashboard({
  currentUserId,
  onBack,
}: AdminDashboardProps) {

  // ========================================
  // EXISTING DASHBOARD STATES
  // ========================================

  const [stats, setStats] =
    useState<AdminDashboardStats | null>(null);

  const [userPage, setUserPage] =
    useState<AdminUserPage | null>(null);

  const [users, setUsers] = useState<AdminUser[]>([]);

  const [auditLogs, setAuditLogs] =
    useState<AuditLog[]>([]);

  const [failedLogins, setFailedLogins] =
    useState<FailedLoginAttempt[]>([]);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [selectedIds, setSelectedIds] =
    useState<number[]>([]);

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
  // STATISTICS DETAILS STATES
  // ========================================

  const [selectedStat, setSelectedStat] =
    useState<StatKey | null>(null);

  const [statDetails, setStatDetails] =
    useState<StatDetails | null>(null);

  const [loadingStatsDetail, setLoadingStatsDetail] =
    useState(false);

  const [statDetailError, setStatDetailError] =
    useState("");

  const [statRefreshVersion, setStatRefreshVersion] =
    useState(0);


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

      if (selectedUser) {
        setSelectedUser(
          await getAdminUserDetail(selectedUser.id)
        );
      }

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
  // LOAD SELECTED STATISTICS DETAILS
  // ========================================

  useEffect(() => {
    if (!selectedStat) {
      setStatDetails(null);
      setStatDetailError("");
      setLoadingStatsDetail(false);
      return;
    }

    let cancelled = false;

    const key = selectedStat;

    async function loadStatDetails() {
      setLoadingStatsDetail(true);
      setStatDetails(null);
      setStatDetailError("");

      try {
        const details = await fetchStatDetails(key);

        if (!cancelled) {
          setStatDetails(details);
        }

      } catch (err) {
        if (!cancelled) {
          setStatDetailError(
            err instanceof Error
              ? err.message
              : "Unable to load statistics details."
          );
        }

      } finally {
        if (!cancelled) {
          setLoadingStatsDetail(false);
        }
      }
    }

    void loadStatDetails();

    return () => {
      cancelled = true;
    };

  }, [selectedStat, statRefreshVersion, stats]);


  // ========================================
  // STATISTICS CARD ACTIONS
  // ========================================

  function handleStatClick(key: StatKey) {
    setStatDetails(null);
    setStatDetailError("");
    setLoadingStatsDetail(true);

    setSelectedStat(key);

    setStatRefreshVersion(
      (previous) => previous + 1
    );
  }

  function handleCloseStatDetails() {
    setSelectedStat(null);
    setStatDetails(null);
    setStatDetailError("");
    setLoadingStatsDetail(false);
  }

  function handleRefreshStatDetails() {
    if (!selectedStat) return;

    setStatDetails(null);
    setStatDetailError("");
    setLoadingStatsDetail(true);

    setStatRefreshVersion(
      (previous) => previous + 1
    );
  }


  // ========================================
  // REFRESH AFTER ADMIN ACTION
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

      // Update statistics immediately.
      // Open statistics details also reload automatically.

      setStats(statsData);

      // Preserve the current pagination page.

      setUserPage(pageData);
      setUsers(pageData.items);

      setAuditLogs(auditData);
      setFailedLogins(failedLoginData);

      // Refresh selected user's details after an action.

      if (
        selectedUser &&
        (
          userId === undefined ||
          selectedUser.id === userId
        )
      ) {
        setSelectedUser(
          await getAdminUserDetail(selectedUser.id)
        );
      }

    } catch (err) {
      setError(
        "The action succeeded, but the dashboard could not refresh. " +
          (
            err instanceof Error
              ? err.message
              : "Please click Refresh."
          )
      );
    }
  }


  // ========================================
  // LOAD A PAGE OF USERS
  // ========================================

  async function changePage(nextPage: number) {
    if (
      !userPage ||
      loading ||
      busy ||
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
        (
          statusFilter === "banned" &&
          user.is_banned
        ) ||
        (
          statusFilter === "active" &&
          !user.is_banned
        );

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


  // ========================================
  // USER SELECTION
  // ========================================

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
    const targetUser = users.find(
      (user) => user.id === userId
    );

    if (
      userId === currentUserId ||
      targetUser?.role === "admin" ||
      busy ||
      loading
    ) {
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
          user.id === userId
            ? updatedUser
            : user
        )
      );

      setMessage("User role updated successfully.");

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
      busy ||
      loading
    ) {
      return;
    }

    let reason: string | null = null;

    if (!user.is_banned) {
      const input = window.prompt(
        "Enter a reason for banning this user:"
      );

      if (input === null) return;

      reason = input.trim();

      if (reason.length < 3) {
        setError(
          "A ban reason of at least 3 characters is required."
        );

        return;
      }
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
          item.id === user.id
            ? updatedUser
            : item
        )
      );

      setMessage(
        updatedUser.is_banned
          ? "User banned successfully."
          : "User unbanned successfully."
      );

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
    if (busy || loading) return;

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
    if (loadingDetail || busy || loading) return;

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
      busy ||
      loading
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
        `${result.revoked_sessions} sessions revoked.`
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
    if (exporting) return;

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

  const selectedStatLabel = STAT_CARDS.find(
    (card) => card.key === selectedStat
  )?.label;


  // ========================================
  // DASHBOARD UI
  // ========================================

  return (
    <section className="dashboard-page">

      {/* DASHBOARD HEADER */}

      <div className="dashboard-header">
        <div>
          <span className="section-label">
            WARMSHARE ADMINISTRATION
          </span>

          <h1>Admin Dashboard</h1>

          <p>
            Manage users, monitor activity, and oversee
            platform security.
          </p>
        </div>

        <div className="dashboard-header-actions">
          <button
            type="button"
            className="btn btn-outline"
            disabled={busy || loading || loadingDetail}
            onClick={() => void loadDashboard()}
          >
            {loading ? "Refreshing..." : "Refresh"}
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


      {/* SUCCESS AND ERROR MESSAGES */}

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
              CLICKABLE DASHBOARD STATISTICS
          ======================================== */}

          <div className="dashboard-stats">
            {STAT_CARDS.map(({ key, label }) => (
              <button
                type="button"
                key={key}
                className={`dashboard-stat-card admin-stat-button ${
                  selectedStat === key
                    ? "selected"
                    : ""
                }`}
                disabled={busy || loading}
                aria-expanded={selectedStat === key}
                aria-controls={
                  selectedStat === key
                    ? "admin-stat-details"
                    : undefined
                }
                onClick={() => handleStatClick(key)}
              >
                <span className="admin-stat-label">
                  {label}
                </span>

                <strong className="admin-stat-value">
                  {stats[key]}
                </strong>

                <span className="admin-stat-hint">
                  {selectedStat === key
                    ? "Viewing Details"
                    : "View Details →"}
                </span>
              </button>
            ))}
          </div>


          {/* ========================================
              STATISTICS DETAILS PANEL
          ======================================== */}

          {selectedStat && (
            <section
              id="admin-stat-details"
              className="dashboard-panel admin-stat-details"
              aria-busy={loadingStatsDetail}
            >
              <div className="dashboard-panel-heading">
                <div>
                  <h2>
                    {selectedStatLabel} — Details
                  </h2>

                  {statDetails && (
                    <p>
                      {statDetails.items.length} records found
                    </p>
                  )}
                </div>

                <div className="dashboard-header-actions">
                  <button
                    type="button"
                    className="btn btn-outline"
                    disabled={
                      loadingStatsDetail ||
                      busy ||
                      loading
                    }
                    onClick={handleRefreshStatDetails}
                  >
                    Refresh Details
                  </button>

                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={handleCloseStatDetails}
                  >
                    Close Details
                  </button>
                </div>
              </div>


              {/* LOADING STATE */}

              {loadingStatsDetail && (
                <p role="status">
                  Loading details...
                </p>
              )}


              {/* ERROR STATE */}

              {statDetailError && (
                <div
                  className="alert alert-error"
                  role="alert"
                >
                  {statDetailError}
                </div>
              )}


              {/* EMPTY STATE */}

              {!loadingStatsDetail &&
                statDetails?.items.length === 0 && (
                  <p>No records found.</p>
                )}


              {/* ========================================
                  USER STATISTICS DETAILS
              ======================================== */}

              {statDetails?.kind === "users" &&
                statDetails.items.length > 0 && (
                  <div className="dashboard-table-wrapper">
                    <table className="dashboard-table">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Role</th>
                          <th>Status</th>
                          <th>Ban Reason</th>
                          <th>Banned At</th>
                          <th>Joined</th>
                        </tr>
                      </thead>

                      <tbody>
                        {statDetails.items.map((user) => (
                          <tr key={user.id}>
                            <td>{user.id}</td>

                            <td>
                              <strong>
                                {user.full_name}
                              </strong>
                            </td>

                            <td>{user.email}</td>

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
                                {user.is_banned
                                  ? "Banned"
                                  : "Active"}
                              </span>
                            </td>

                            <td>
                              {user.ban_reason || "—"}
                            </td>

                            <td>
                              {formatDate(user.banned_at)}
                            </td>

                            <td>
                              {formatDate(user.created_at)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}


              {/* ========================================
                  DONATION LISTING DETAILS
              ======================================== */}

              {statDetails?.kind === "listings" &&
                statDetails.items.length > 0 && (
                  <div className="dashboard-table-wrapper">
                    <table className="dashboard-table">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Title</th>
                          <th>Category</th>
                          <th>Size</th>
                          <th>Condition</th>
                          <th>Quantity</th>
                          <th>Owner ID</th>
                          <th>Group ID</th>
                          <th>Status</th>
                          <th>Moderation Reason</th>
                          <th>Moderated By</th>
                          <th>Moderated At</th>
                        </tr>
                      </thead>

                      <tbody>
                        {statDetails.items.map((listing) => (
                          <tr key={listing.id}>
                            <td>{listing.id}</td>

                            <td>
                              <strong>
                                {listing.title}
                              </strong>
                            </td>

                            <td>{listing.category}</td>
                            <td>{listing.size}</td>
                            <td>{listing.condition}</td>
                            <td>{listing.quantity}</td>

                            <td>
                              {listing.owner_id ?? "—"}
                            </td>

                            <td>
                              {listing.group_id ?? "Personal"}
                            </td>

                            <td>
                              <span
                                className={
                                  listing.moderation_status ===
                                  "hidden"
                                    ? "dashboard-status banned"
                                    : "dashboard-status active"
                                }
                              >
                                {listing.moderation_status ===
                                "hidden"
                                  ? "Hidden"
                                  : "Visible"}
                              </span>
                            </td>

                            <td>
                              {listing.moderation_reason || "—"}
                            </td>

                            <td>
                              {listing.moderated_by ?? "—"}
                            </td>

                            <td>
                              {formatDate(listing.moderated_at)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}


              {/* ========================================
                  PENDING REPORT DETAILS
              ======================================== */}

              {statDetails?.kind === "reports" &&
                statDetails.items.length > 0 && (
                  <div className="dashboard-table-wrapper">
                    <table className="dashboard-table">
                      <thead>
                        <tr>
                          <th>Report ID</th>
                          <th>Listing ID</th>
                          <th>Reporter ID</th>
                          <th>Reason</th>
                          <th>Details</th>
                          <th>Status</th>
                          <th>Submitted</th>
                        </tr>
                      </thead>

                      <tbody>
                        {statDetails.items.map((report) => (
                          <tr key={report.id}>
                            <td>{report.id}</td>
                            <td>{report.listing_id}</td>
                            <td>{report.reporter_id}</td>
                            <td>{report.reason}</td>

                            <td>
                              {report.details || "—"}
                            </td>

                            <td>
                              <span className="dashboard-status pending">
                                {report.status}
                              </span>
                            </td>

                            <td>
                              {formatDate(report.created_at)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}


              {/* ========================================
                  ACTIVE SESSION DETAILS
              ======================================== */}

              {statDetails?.kind === "sessions" &&
                statDetails.items.length > 0 && (
                  <div className="dashboard-table-wrapper">
                    <table className="dashboard-table">
                      <thead>
                        <tr>
                          <th>Session ID</th>
                          <th>User ID</th>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Role</th>
                          <th>Created</th>
                          <th>Expires</th>
                          <th>Status</th>
                        </tr>
                      </thead>

                      <tbody>
                        {statDetails.items.map((session) => (
                          <tr key={session.session_id}>
                            <td className="admin-session-id">
                              {session.session_id}
                            </td>

                            <td>{session.user_id}</td>
                            <td>{session.full_name}</td>
                            <td>{session.email}</td>

                            <td>
                              <span className="dashboard-role">
                                {session.role}
                              </span>
                            </td>

                            <td>
                              {formatDate(session.created_at)}
                            </td>

                            <td>
                              {formatDate(session.expires_at)}
                            </td>

                            <td>
                              <span className="dashboard-status active">
                                Active
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
            </section>
          )}


          {/* ========================================
              USER MANAGEMENT
          ======================================== */}

          <section className="dashboard-panel">
            <div className="dashboard-panel-heading">
              <div>
                <h2>User Management</h2>

                <p>
                  Search and manage registered WarmShare
                  accounts.
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
                <option value="moderator">
                  Moderators
                </option>
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
                  busy ||
                  loading ||
                  loadingDetail ||
                  selectedIds.length === 0
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
                  busy ||
                  loading ||
                  loadingDetail ||
                  selectedIds.length === 0
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
                        disabled={
                          busy ||
                          loading ||
                          eligibleVisibleUsers.length === 0
                        }
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
                              protectedUser ||
                              busy ||
                              loading
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
                              disabled={
                                busy ||
                                loading ||
                                loadingDetail
                              }
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
                              disabled={
                                loadingDetail ||
                                busy ||
                                loading
                              }
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
                                  disabled={
                                    busy ||
                                    loading ||
                                    loadingDetail
                                  }
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
                                  disabled={
                                    busy ||
                                    loading ||
                                    loadingDetail
                                  }
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
                    busy ||
                    loadingDetail ||
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
                    busy ||
                    loadingDetail ||
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
                  disabled={busy || loading}
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
                  <strong>Banned at:</strong>{" "}
                  {formatDate(selectedUser.banned_at)}
                </p>

                <p>
                  <strong>Joined:</strong>{" "}
                  {formatDate(selectedUser.created_at)}
                </p>

                <p>
                  <strong>Last updated:</strong>{" "}
                  {formatDate(selectedUser.updated_at)}
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
                      {JSON.stringify(items, null, 2)}
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
                  {failedLogins.map((attempt, index) => (
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
                        {formatDate(attempt.blocked_until)}
                      </td>

                      <td>
                        {formatDate(attempt.updated_at)}
                      </td>
                    </tr>
                  ))}

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
                onClick={() => void handleExport()}
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
                        {formatDate(log.created_at)}
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
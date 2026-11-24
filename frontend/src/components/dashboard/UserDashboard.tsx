
import { useEffect, useState, type FormEvent } from "react";

import type { AuthUser } from "../../types/auth";
import type { Listing } from "../../types/listing";

import { authenticatedFetch } from "../../services/api";
import {
  updateMyProfile,
  changeMyPassword,
} from "../../services/authService";

import GroupPermissions from "./GroupPermissions";

type UserDashboardProps = {
  currentUser: AuthUser;
  onBack: () => void;
  onUserUpdated: (user: AuthUser) => void;
};

type UserSession = {
  id: string;
  created_at?: string;
  expires_at?: string;
  last_used_at?: string | null;
  user_agent?: string | null;
  ip_address?: string | null;
};

type PasswordForm = {
  current_password: string;
  new_password: string;
  confirm_password: string;
};

const emptyPasswordForm: PasswordForm = {
  current_password: "",
  new_password: "",
  confirm_password: "",
};

function formatDate(value?: string | null): string {
  if (!value) return "Not available";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return date.toLocaleString();
}

async function readApiError(response: Response): Promise<string> {
  try {
    const data = await response.json();

    if (typeof data.detail === "string") {
      return data.detail;
    }

    if (Array.isArray(data.detail)) {
      return data.detail
        .map((item: { msg?: string }) => item.msg ?? "Invalid input")
        .join(", ");
    }
  } catch {
    // Use fallback message.
  }

  return `Request failed (${response.status}). Please try again.`;
}

export default function UserDashboard({
  currentUser,
  onBack,
  onUserUpdated,
}: UserDashboardProps) {
  const [listings, setListings] = useState<Listing[]>([]);
  const [sessions, setSessions] = useState<UserSession[]>([]);

  const [loading, setLoading] = useState(true);
  const [busySessionId, setBusySessionId] = useState<string | null>(null);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // Profile management
  const [editingProfile, setEditingProfile] = useState(false);
  const [fullName, setFullName] = useState(currentUser.full_name);
  const [savingProfile, setSavingProfile] = useState(false);

  // Password management
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordForm, setPasswordForm] =
    useState<PasswordForm>({ ...emptyPasswordForm });
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    setFullName(currentUser.full_name);
  }, [currentUser.full_name]);

  // ========================================
  // LOAD DASHBOARD DATA
  // ========================================

  async function loadDashboard() {
    setLoading(true);
    setError("");

    try {
      const [listingsResponse, sessionsResponse] = await Promise.all([
        authenticatedFetch("/api/listings"),
        authenticatedFetch("/api/auth/sessions"),
      ]);

      if (!listingsResponse.ok) {
        throw new Error(
          `Failed to load donations (${listingsResponse.status}).`
        );
      }

      if (!sessionsResponse.ok) {
        throw new Error(
          `Failed to load sessions (${sessionsResponse.status}).`
        );
      }

      const listingsData: Listing[] = await listingsResponse.json();
      const sessionsData: UserSession[] = await sessionsResponse.json();

      setListings(
        listingsData.filter(
          (listing) => listing.owner_id === currentUser.id
        )
      );

      setSessions(sessionsData);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load your dashboard."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadDashboard();
  }, [currentUser.id]);

  // ========================================
  // UPDATE PROFILE
  // PATCH /api/auth/me
  // ========================================

  async function handleProfileUpdate(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const trimmedName = fullName.trim();

    setError("");
    setMessage("");

    if (trimmedName.length < 2 || trimmedName.length > 100) {
      setError("Full name must contain between 2 and 100 characters.");
      return;
    }

    if (trimmedName === currentUser.full_name) {
      setEditingProfile(false);
      setMessage("No profile changes were necessary.");
      return;
    }

    setSavingProfile(true);

    try {
      const response = await updateMyProfile(trimmedName);

      if (!response.ok) {
        throw new Error(await readApiError(response));
      }

      const updatedUser: AuthUser = await response.json();

      onUserUpdated(updatedUser);

      setFullName(updatedUser.full_name);
      setEditingProfile(false);

      setMessage("Your profile was updated successfully.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update your profile."
      );
    } finally {
      setSavingProfile(false);
    }
  }

  // ========================================
  // CHANGE PASSWORD
  // POST /api/auth/change-password
  // ========================================

  async function handlePasswordChange(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setMessage("");

    if (!passwordForm.current_password) {
      setError("Please enter your current password.");
      return;
    }

    if (passwordForm.new_password.length < 8) {
      setError("New password must contain at least 8 characters.");
      return;
    }

    if (
      passwordForm.new_password !== passwordForm.confirm_password
    ) {
      setError("New password and confirmation do not match.");
      return;
    }

    if (
      passwordForm.current_password === passwordForm.new_password
    ) {
      setError("New password must differ from your current password.");
      return;
    }

    setChangingPassword(true);

    try {
      const response = await changeMyPassword(
        passwordForm.current_password,
        passwordForm.new_password,
        passwordForm.confirm_password
      );

      if (!response.ok) {
        throw new Error(await readApiError(response));
      }

      const result: { message?: string } = await response.json();

      setPasswordForm({ ...emptyPasswordForm });
      setShowPasswordForm(false);

      setMessage(
        result.message ?? "Password changed successfully."
      );

      // The backend keeps the current session and revokes other sessions.
      await loadDashboard();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to change your password."
      );
    } finally {
      setChangingPassword(false);
    }
  }

  // ========================================
  // REVOKE LOGIN SESSION
  // ========================================

  async function handleRevokeSession(sessionId: string) {
    const confirmed = window.confirm(
      "Are you sure you want to revoke this login session?"
    );

    if (!confirmed) return;

    setBusySessionId(sessionId);
    setError("");
    setMessage("");

    try {
      const response = await authenticatedFetch(
        `/api/auth/sessions/${encodeURIComponent(sessionId)}`,
        { method: "DELETE" }
      );

      if (!response.ok) {
        throw new Error(await readApiError(response));
      }

      setSessions((previous) =>
        previous.filter((session) => session.id !== sessionId)
      );

      setMessage("Login session revoked successfully.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to revoke this session."
      );
    } finally {
      setBusySessionId(null);
    }
  }

  // ========================================
  // LOADING STATE
  // ========================================

  if (loading) {
    return (
      <section className="dashboard-page">
        <p>Loading Your Dashboard...</p>
      </section>
    );
  }

  // ========================================
  // DASHBOARD
  // ========================================

  return (
    <section className="dashboard-page">

      {/* Dashboard Header */}

      <div className="dashboard-header">
        <div>
          <span className="section-label">WARMSHARE ACCOUNT</span>
          <h1>My Dashboard</h1>
          <p>Manage your donations and review your account activity.</p>
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

      {/* Global Messages */}

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
          ACCOUNT INFORMATION
      ======================================== */}

      <section className="dashboard-panel">
        <div className="dashboard-panel-heading">
          <div>
            <h2>Account Information</h2>
            <p>Your WarmShare account details.</p>
          </div>

          {!editingProfile && (
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => {
                setFullName(currentUser.full_name);
                setEditingProfile(true);
                setError("");
                setMessage("");
              }}
            >
              Edit Profile
            </button>
          )}
        </div>

        <div className="user-account-details">
          <div className="user-account-avatar">
            {currentUser.full_name.charAt(0).toUpperCase()}
          </div>

          <div>
            <h3>{currentUser.full_name}</h3>
            <p>{currentUser.email}</p>

            <span className="dashboard-role">
              {currentUser.role}
            </span>

            <p>Account ID: {currentUser.id}</p>
          </div>
        </div>

        {editingProfile && (
          <form onSubmit={handleProfileUpdate}>
            <div className="form-group">
              <label htmlFor="profile-full-name">Full Name</label>

              <input
                id="profile-full-name"
                type="text"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                minLength={2}
                maxLength={100}
                required
                disabled={savingProfile}
              />
            </div>

            <div className="dashboard-header-actions">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={savingProfile}
              >
                {savingProfile ? "Saving..." : "Save Changes"}
              </button>

              <button
                type="button"
                className="btn btn-outline"
                disabled={savingProfile}
                onClick={() => {
                  setEditingProfile(false);
                  setFullName(currentUser.full_name);
                  setError("");
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </section>

      {/* ========================================
          SECURITY SETTINGS
      ======================================== */}

      <section className="dashboard-panel">
        <div className="dashboard-panel-heading">
          <div>
            <h2>Security Settings</h2>
            <p>Keep your WarmShare account secure.</p>
          </div>

          {!showPasswordForm && (
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => {
                setShowPasswordForm(true);
                setError("");
                setMessage("");
              }}
            >
              Change Password
            </button>
          )}
        </div>

        {showPasswordForm && (
          <form onSubmit={handlePasswordChange}>
            <div className="form-group">
              <label htmlFor="current-password">
                Current Password
              </label>

              <input
                id="current-password"
                type="password"
                autoComplete="current-password"
                value={passwordForm.current_password}
                onChange={(event) =>
                  setPasswordForm((previous) => ({
                    ...previous,
                    current_password: event.target.value,
                  }))
                }
                required
                disabled={changingPassword}
              />
            </div>

            <div className="form-group">
              <label htmlFor="new-password">New Password</label>

              <input
                id="new-password"
                type="password"
                autoComplete="new-password"
                value={passwordForm.new_password}
                onChange={(event) =>
                  setPasswordForm((previous) => ({
                    ...previous,
                    new_password: event.target.value,
                  }))
                }
                minLength={8}
                maxLength={128}
                required
                disabled={changingPassword}
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirm-password">
                Confirm New Password
              </label>

              <input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                value={passwordForm.confirm_password}
                onChange={(event) =>
                  setPasswordForm((previous) => ({
                    ...previous,
                    confirm_password: event.target.value,
                  }))
                }
                minLength={8}
                maxLength={128}
                required
                disabled={changingPassword}
              />
            </div>

            <div className="dashboard-header-actions">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={changingPassword}
              >
                {changingPassword
                  ? "Changing Password..."
                  : "Update Password"}
              </button>

              <button
                type="button"
                className="btn btn-outline"
                disabled={changingPassword}
                onClick={() => {
                  setShowPasswordForm(false);
                  setPasswordForm({ ...emptyPasswordForm });
                  setError("");
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </section>

      {/* ========================================
          DASHBOARD STATISTICS
      ======================================== */}

      <div className="dashboard-stats">
        <div className="dashboard-stat-card">
          <span>My Donations</span>
          <strong>{listings.length}</strong>
        </div>

        <div className="dashboard-stat-card">
          <span>Active Sessions</span>
          <strong>{sessions.length}</strong>
        </div>
      </div>

      {/* ========================================
          MY GROUPS
      ======================================== */}

      <section className="dashboard-panel">
        <div className="dashboard-panel-heading">
          <div>
            <h2>My Groups</h2>
            <p>
              Collaborate with others to organize clothing donations
              through shared groups.
            </p>
          </div>
        </div>

        <div className="dashboard-empty">
          <div className="dashboard-empty-icon">♧</div>

          <h3>Groups Coming Soon</h3>

          <p>
            Group creation, membership and shared donation management
            will be available after the group management system is implemented.
          </p>
        </div>
      </section>

      {/* ========================================
          GROUP PERMISSIONS
      ======================================== */}

      <GroupPermissions />

      {/* ========================================
          MY DONATIONS
      ======================================== */}

      <section className="dashboard-panel">
        <div className="dashboard-panel-heading">
          <div>
            <h2>My Donations</h2>
            <p>Donation listings created by your account.</p>
          </div>
        </div>

        {listings.length === 0 ? (
          <div className="dashboard-empty">
            <div className="dashboard-empty-icon">♥</div>

            <h3>No Donations Yet</h3>

            <p>Your donation listings will appear here.</p>
          </div>
        ) : (
          <div className="user-donation-list">
            {listings.map((listing) => (
              <article
                className="user-donation-card"
                key={listing.id}
              >
                <div>
                  <h3>{listing.title}</h3>

                  <p>
                    {listing.category} · {listing.size} ·{" "}
                    {listing.condition}
                  </p>

                  <p>Quantity: {listing.quantity}</p>

                  <p>Pickup address: {listing.pickup_address}</p>
                </div>

                <span className="dashboard-role">
                  Listing #{listing.id}
                </span>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* ========================================
          LOGIN SESSIONS
      ======================================== */}

      <section className="dashboard-panel">
        <div className="dashboard-panel-heading">
          <div>
            <h2>Login Sessions</h2>

            <p>
              Review active sessions and revoke sessions you no longer use.
            </p>
          </div>
        </div>

        {sessions.length === 0 ? (
          <div className="dashboard-empty">
            <h3>No Active Sessions</h3>

            <p>Your account currently has no other active sessions.</p>
          </div>
        ) : (
          <div className="user-session-list">
            {sessions.map((session) => (
              <article
                className="user-session-card"
                key={session.id}
              >
                <div>
                  <h3>Session #{session.id}</h3>

                  <p>
                    <strong>Created:</strong>{" "}
                    {formatDate(session.created_at)}
                  </p>

                  <p>
                    <strong>Last used:</strong>{" "}
                    {formatDate(session.last_used_at)}
                  </p>

                  <p>
                    <strong>Expires:</strong>{" "}
                    {formatDate(session.expires_at)}
                  </p>

                  {session.user_agent && (
                    <p>
                      <strong>Device:</strong> {session.user_agent}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  className="btn btn-danger"
                  disabled={busySessionId === session.id}
                  onClick={() =>
                    void handleRevokeSession(session.id)
                  }
                >
                  {busySessionId === session.id
                    ? "Revoking..."
                    : "Revoke Session"}
                </button>
              </article>
            ))}
          </div>
        )}
      </section>
    </section>
  );
}

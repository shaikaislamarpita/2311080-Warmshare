
import { useEffect, useState } from "react";

import type { AuthUser } from "../../types/auth";
import type { Listing } from "../../types/listing";

import { authenticatedFetch } from "../../services/api";

import GroupPermissions from "./GroupPermissions";

type UserDashboardProps = {
  currentUser: AuthUser;
  onBack: () => void;
};

type UserSession = {
  id: number;
  created_at?: string;
  expires_at?: string;
  last_used_at?: string | null;
  user_agent?: string | null;
  ip_address?: string | null;
};

function formatDate(value?: string | null) {
  if (!value) return "Not available";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Not available";

  return date.toLocaleString();
}

export default function UserDashboard({
  currentUser,
  onBack,
}: UserDashboardProps) {
  const [listings, setListings] = useState<Listing[]>([]);
  const [sessions, setSessions] = useState<UserSession[]>([]);

  const [loading, setLoading] = useState(true);
  const [busySessionId, setBusySessionId] = useState<number | null>(null);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

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

  async function handleRevokeSession(sessionId: number) {
    const confirmed = window.confirm(
      "Are you sure you want to revoke this login session?"
    );

    if (!confirmed) return;

    setBusySessionId(sessionId);
    setError("");
    setMessage("");

    try {
      const response = await authenticatedFetch(
        `/api/auth/sessions/${sessionId}`,
        { method: "DELETE" }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to revoke session (${response.status}).`
        );
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

  if (loading) {
    return (
      <section className="dashboard-page">
        <p>Loading Your Dashboard...</p>
      </section>
    );
  }

  return (
    <section className="dashboard-page">
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

      {/* Account Information */}
      <section className="dashboard-panel">
        <div className="dashboard-panel-heading">
          <div>
            <h2>Account Information</h2>
            <p>Your WarmShare account details.</p>
          </div>
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
      </section>

      {/* Dashboard Statistics */}
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

      {/* My Groups */}
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

      {/* Group Overview and Permissions */}
      <GroupPermissions />

      {/* My Donations */}
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

      {/* Login Sessions */}
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
                  onClick={() => void handleRevokeSession(session.id)}
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

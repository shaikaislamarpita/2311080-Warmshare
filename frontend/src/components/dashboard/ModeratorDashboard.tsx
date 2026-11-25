
import { useEffect, useState, type FormEvent } from "react";

import type { AuthUser } from "../../types/auth";
import type { ListingReport } from "../../types/moderation";

import {
  getModerationReports,
  moderateListing,
  reviewListingReport,
} from "../../services/moderationService";

import {
  updateMyProfile,
  changeMyPassword,
} from "../../services/authService";

type ModeratorDashboardProps = {
  currentUser: AuthUser;
  onBack: () => void;
  onUserUpdated: (user: AuthUser) => void;
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
    // Use fallback error.
  }

  return `Request failed (${response.status}). Please try again.`;
}

export default function ModeratorDashboard({
  currentUser,
  onBack,
  onUserUpdated,
}: ModeratorDashboardProps) {
  const [reports, setReports] = useState<ListingReport[]>([]);

  const [loading, setLoading] = useState(true);
  const [busyReportId, setBusyReportId] = useState<number | null>(null);

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

  // Moderation inputs
  const [moderationReasons, setModerationReasons] = useState<
    Record<number, string>
  >({});

  const [resolutionNotes, setResolutionNotes] = useState<
    Record<number, string>
  >({});

  useEffect(() => {
    setFullName(currentUser.full_name);
  }, [currentUser.full_name]);

  // ========================================
  // LOAD MODERATION REPORTS
  // ========================================

  async function loadReports() {
    setLoading(true);
    setError("");

    try {
      const data = await getModerationReports();
      setReports(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load moderation reports."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadReports();
  }, []);

  // ========================================
  // UPDATE MODERATOR PROFILE
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
  // CHANGE MODERATOR PASSWORD
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
  // HIDE OR RESTORE DONATION
  // ========================================

  async function handleListingModeration(
    listingId: number,
    status: "visible" | "hidden"
  ) {
    const reason = (moderationReasons[listingId] || "").trim();

    if (reason.length < 3) {
      setError(
        "Please enter a moderation reason of at least 3 characters."
      );
      return;
    }

    setBusyReportId(listingId);
    setError("");
    setMessage("");

    try {
      await moderateListing(listingId, { status, reason });

      setMessage(
        status === "hidden"
          ? `Listing #${listingId} has been hidden.`
          : `Listing #${listingId} has been restored.`
      );

      setModerationReasons((previous) => ({
        ...previous,
        [listingId]: "",
      }));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update listing moderation."
      );
    } finally {
      setBusyReportId(null);
    }
  }

  // ========================================
  // RESOLVE OR DISMISS REPORT
  // ========================================

  async function handleReportReview(
    report: ListingReport,
    status: "resolved" | "dismissed"
  ) {
    const resolutionNote = (
      resolutionNotes[report.id] || ""
    ).trim();

    setBusyReportId(report.id);
    setError("");
    setMessage("");

    try {
      await reviewListingReport(report.id, {
        status,
        resolution_note: resolutionNote || null,
      });

      setReports((previous) =>
        previous.filter((item) => item.id !== report.id)
      );

      setMessage(
        status === "resolved"
          ? `Report #${report.id} resolved successfully.`
          : `Report #${report.id} dismissed successfully.`
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to review this report."
      );
    } finally {
      setBusyReportId(null);
    }
  }

  // ========================================
  // DASHBOARD
  // ========================================

  return (
    <section className="dashboard-page">

      {/* HEADER */}

      <div className="dashboard-header">
        <div>
          <span className="section-label">
            WARMSHARE CONTENT MANAGEMENT
          </span>

          <h1>Moderator Dashboard</h1>

          <p>
            Review reported donations and help keep
            the WarmShare community safe.
          </p>
        </div>

        <div className="dashboard-header-actions">
          <button
            type="button"
            className="btn btn-primary"
            onClick={onBack}
          >
            Back to Home
          </button>
        </div>
      </div>

      {/* GLOBAL MESSAGES */}

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
            <p>Your moderator account details.</p>
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
              <label htmlFor="moderator-full-name">
                Full Name
              </label>

              <input
                id="moderator-full-name"
                type="text"
                value={fullName}
                onChange={(event) =>
                  setFullName(event.target.value)
                }
                minLength={2}
                maxLength={100}
                required
                disabled={savingProfile}
              />
            </div>

            <div className="form-group">
              <label>Email Address</label>

              <input
                type="email"
                value={currentUser.email}
                disabled
                readOnly
              />

              <small>
                Email address cannot be changed here.
              </small>
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
            <p>Keep your moderator account secure.</p>
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
              <label htmlFor="moderator-current-password">
                Current Password
              </label>

              <input
                id="moderator-current-password"
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
              <label htmlFor="moderator-new-password">
                New Password
              </label>

              <input
                id="moderator-new-password"
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
              <label htmlFor="moderator-confirm-password">
                Confirm New Password
              </label>

              <input
                id="moderator-confirm-password"
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
          MODERATOR STATISTICS
      ======================================== */}

      <div className="dashboard-stats">

        <div className="dashboard-stat-card">
          <span>Pending Reports</span>
          <strong>{reports.length}</strong>
        </div>

        <div className="dashboard-stat-card">
          <span>Account Role</span>
          <strong>Moderator</strong>
        </div>

      </div>

      {/* ========================================
          REPORTED DONATIONS
      ======================================== */}

      <section className="dashboard-panel">

        <div className="dashboard-panel-heading">
          <div>
            <h2>Reported Donations</h2>

            <p>
              Review reports and decide whether to resolve
              or dismiss them.
            </p>
          </div>

          <button
            type="button"
            className="btn btn-outline"
            onClick={() => void loadReports()}
            disabled={loading}
          >
            {loading ? "Loading..." : "Refresh Reports"}
          </button>
        </div>

        {loading ? (
          <div className="dashboard-empty">
            <h3>Loading Reports...</h3>
            <p>Please wait while reports are retrieved.</p>
          </div>
        ) : reports.length === 0 ? (
          <div className="dashboard-empty">
            <div className="dashboard-empty-icon">✓</div>

            <h3>No Pending Reports</h3>

            <p>
              There are no reports waiting for review.
            </p>
          </div>
        ) : (
          <div className="moderation-report-list">

            {reports.map((report) => (
              <article
                className="moderation-report-card"
                key={report.id}
              >

                <div className="moderation-report-heading">
                  <div>
                    <span className="dashboard-role">
                      Report #{report.id}
                    </span>

                    <h3>
                      Donation Listing #{report.listing_id}
                    </h3>
                  </div>

                  <span className="dashboard-status pending">
                    {report.status}
                  </span>
                </div>

                <div className="moderation-report-details">

                  <p>
                    <strong>Reason:</strong> {report.reason}
                  </p>

                  <p>
                    <strong>Additional details:</strong>{" "}
                    {report.details || "No additional details provided."}
                  </p>

                  <p>
                    <strong>Reported by user ID:</strong>{" "}
                    {report.reporter_id}
                  </p>

                  <p>
                    <strong>Submitted:</strong>{" "}
                    {new Date(report.created_at).toLocaleString()}
                  </p>

                </div>

                {/* RESOLVE / DISMISS */}

                <div className="moderation-actions">

                  <label htmlFor={`resolution-${report.id}`}>
                    Resolution note (optional)
                  </label>

                  <textarea
                    id={`resolution-${report.id}`}
                    rows={2}
                    maxLength={1000}
                    placeholder="Write a note about your decision..."
                    value={resolutionNotes[report.id] || ""}
                    onChange={(event) =>
                      setResolutionNotes((previous) => ({
                        ...previous,
                        [report.id]: event.target.value,
                      }))
                    }
                  />

                  <div className="moderation-action-buttons">

                    <button
                      type="button"
                      className="btn btn-primary"
                      disabled={busyReportId !== null}
                      onClick={() =>
                        void handleReportReview(report, "resolved")
                      }
                    >
                      {busyReportId === report.id
                        ? "Please wait..."
                        : "Resolve Report"}
                    </button>

                    <button
                      type="button"
                      className="btn btn-outline"
                      disabled={busyReportId !== null}
                      onClick={() =>
                        void handleReportReview(report, "dismissed")
                      }
                    >
                      Dismiss Report
                    </button>

                  </div>
                </div>

                {/* HIDE / RESTORE LISTING */}

                <div className="moderation-listing-actions">

                  <h4>Listing Moderation</h4>

                  <label htmlFor={`moderation-${report.id}`}>
                    Moderation reason (required)
                  </label>

                  <input
                    id={`moderation-${report.id}`}
                    type="text"
                    maxLength={500}
                    placeholder="Enter a reason for hiding or restoring this listing..."
                    value={moderationReasons[report.listing_id] || ""}
                    onChange={(event) =>
                      setModerationReasons((previous) => ({
                        ...previous,
                        [report.listing_id]: event.target.value,
                      }))
                    }
                  />

                  <div className="moderation-action-buttons">

                    <button
                      type="button"
                      className="btn btn-danger"
                      disabled={busyReportId !== null}
                      onClick={() =>
                        void handleListingModeration(
                          report.listing_id,
                          "hidden"
                        )
                      }
                    >
                      Hide Listing
                    </button>

                    <button
                      type="button"
                      className="btn btn-outline"
                      disabled={busyReportId !== null}
                      onClick={() =>
                        void handleListingModeration(
                          report.listing_id,
                          "visible"
                        )
                      }
                    >
                      Restore Listing
                    </button>

                  </div>
                </div>

              </article>
            ))}

          </div>
        )}

      </section>

    </section>
  );
}

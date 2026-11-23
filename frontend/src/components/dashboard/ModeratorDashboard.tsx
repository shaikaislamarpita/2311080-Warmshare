
import { useEffect, useState } from "react";

import type { ListingReport } from "../../types/moderation";

import {
  getModerationReports,
  moderateListing,
  reviewListingReport,
} from "../../services/moderationService";

type ModeratorDashboardProps = {
  onBack: () => void;
};

export default function ModeratorDashboard({
  onBack,
}: ModeratorDashboardProps) {
  const [reports, setReports] = useState<ListingReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyReportId, setBusyReportId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [moderationReasons, setModerationReasons] = useState<
    Record<number, string>
  >({});

  const [resolutionNotes, setResolutionNotes] = useState<
    Record<number, string>
  >({});

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

  async function handleListingModeration(
    listingId: number,
    status: "visible" | "hidden"
  ) {
    const reason = (moderationReasons[listingId] || "").trim();

    if (reason.length < 3) {
      setError("Please enter a moderation reason of at least 3 characters.");
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

  if (loading) {
    return (
      <section className="dashboard-page">
        <p>Loading Moderator Dashboard...</p>
      </section>
    );
  }

  return (
    <section className="dashboard-page">
      <div className="dashboard-header">
        <div>
          <span className="section-label">WARMSHARE CONTENT MANAGEMENT</span>
          <h1>Moderator Dashboard</h1>
          <p>
            Review reported donations and help keep the WarmShare community safe.
          </p>
        </div>

        <div className="dashboard-header-actions">
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => void loadReports()}
          >
            Refresh Reports
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

      <div className="dashboard-stats">
        <div className="dashboard-stat-card">
          <span>Pending Reports</span>
          <strong>{reports.length}</strong>
        </div>

        <div className="dashboard-stat-card">
          <span>Dashboard</span>
          <strong>Moderator</strong>
        </div>
      </div>

      <section className="dashboard-panel">
        <div className="dashboard-panel-heading">
          <div>
            <h2>Reported Donations</h2>
            <p>
              Review each report and choose whether to resolve or dismiss it.
            </p>
          </div>
        </div>

        {reports.length === 0 ? (
          <div className="dashboard-empty">
            <div className="dashboard-empty-icon">✓</div>
            <h3>No Pending Reports</h3>
            <p>There are no reports waiting for review.</p>
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
                    <h3>Donation Listing #{report.listing_id}</h3>
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
                    <strong>Reported by user ID:</strong> {report.reporter_id}
                  </p>

                  <p>
                    <strong>Submitted:</strong>{" "}
                    {new Date(report.created_at).toLocaleString()}
                  </p>
                </div>

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
                      disabled={busyReportId === report.id}
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
                      disabled={busyReportId === report.id}
                      onClick={() =>
                        void handleReportReview(report, "dismissed")
                      }
                    >
                      Dismiss Report
                    </button>
                  </div>
                </div>

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
                      disabled={busyReportId === report.listing_id}
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
                      disabled={busyReportId === report.listing_id}
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

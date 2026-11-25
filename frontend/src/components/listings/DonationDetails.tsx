
import { useState, type FormEvent } from "react";

import type { Listing } from "../../types/listing";
import type { ListingReportCreate } from "../../services/moderationService";

import { reportListing } from "../../services/moderationService";
import { formatText } from "../../utils/formatText";
import { readError } from "../../utils/readError";

type DonationDetailsProps = {
  selectedListing: Listing | null;
  isOwner: (listing: Listing) => boolean;
  isLoggedIn: boolean;
  deletingId: number | null;
  closeDetails: () => void;
  openEditForm: (listing: Listing) => void;
  confirmDelete: (listing: Listing) => void;
  requestLogin: () => void;
};

export default function DonationDetails({
  selectedListing,
  isOwner,
  isLoggedIn,
  deletingId,
  closeDetails,
  openEditForm,
  confirmDelete,
  requestLogin,
}: DonationDetailsProps) {
  const [showReportForm, setShowReportForm] = useState(false);
  const [reportReason, setReportReason] =
    useState<ListingReportCreate["reason"]>("inappropriate");
  const [reportDetails, setReportDetails] = useState("");
  const [reportBusy, setReportBusy] = useState(false);
  const [reportError, setReportError] = useState("");
  const [reportMessage, setReportMessage] = useState("");

  if (!selectedListing) {
    return null;
  }

  const listing = selectedListing;
  const owner = isOwner(listing);

  function resetReportForm() {
    setShowReportForm(false);
    setReportReason("inappropriate");
    setReportDetails("");
    setReportError("");
    setReportMessage("");
  }

  function handleClose() {
    resetReportForm();
    closeDetails();
  }

  function handleReportClick() {
    if (!isLoggedIn) {
      requestLogin();
      return;
    }

    setReportError("");
    setReportMessage("");
    setShowReportForm(true);
  }

  async function handleReportSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!isLoggedIn) {
      requestLogin();
      return;
    }

    if (owner || reportBusy) {
      return;
    }

    setReportBusy(true);
    setReportError("");
    setReportMessage("");

    try {
      const response = await reportListing(listing.id, {
        reason: reportReason,
        details: reportDetails.trim() || null,
      });

      if (!response.ok) {
        throw new Error(await readError(response));
      }

      setReportMessage("Donation reported successfully.");
      setShowReportForm(false);
      setReportDetails("");
      setReportReason("inappropriate");
    } catch (error) {
      setReportError(
        error instanceof Error
          ? error.message
          : "Unable to submit report."
      );
    } finally {
      setReportBusy(false);
    }
  }

  return (
    <section
      className="details-section"
      id="donation-details"
      style={{ scrollMarginTop: 110 }}
    >
      <div className="section-heading">
        <div>
          <span className="section-label">
            DONATION DETAILS
          </span>
          <h2>{listing.title}</h2>
        </div>

        <button
          type="button"
          className="btn btn-outline"
          onClick={handleClose}
        >
          Close
        </button>
      </div>

      <div className="details-grid">
        <p><strong>ID:</strong> {listing.id}</p>
        <p><strong>Category:</strong> {formatText(listing.category)}</p>
        <p><strong>Size:</strong> {formatText(listing.size)}</p>
        <p><strong>Age Group:</strong> {formatText(listing.age_group)}</p>
        <p><strong>Gender:</strong> {formatText(listing.gender)}</p>
        <p><strong>Condition:</strong> {formatText(listing.condition)}</p>
        <p><strong>Quantity:</strong> {listing.quantity}</p>
        <p><strong>Pickup Address:</strong> {listing.pickup_address}</p>
        <p>
          <strong>Ownership:</strong>{" "}
          {listing.owner_id === null
            ? "Legacy donation"
            : owner
              ? "Your donation"
              : "Community donation"}
        </p>
      </div>

      {owner && (
        <div className="card-actions">
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => openEditForm(listing)}
          >
            Edit Donation
          </button>

          <button
            type="button"
            className="btn btn-danger"
            disabled={deletingId === listing.id}
            onClick={() => confirmDelete(listing)}
          >
            Delete Donation
          </button>
        </div>
      )}

      {!owner && (
        <div className="moderation-actions">
          <button
            type="button"
            className="btn btn-outline"
            onClick={handleReportClick}
            disabled={reportBusy}
          >
            Report Donation
          </button>
        </div>
      )}

      {reportMessage && (
        <div className="alert alert-success" role="status">
          {reportMessage}
        </div>
      )}

      {reportError && (
        <div className="alert alert-error" role="alert">
          {reportError}
        </div>
      )}

      {showReportForm && !owner && (
        <form
          className="dashboard-panel"
          onSubmit={(event) => void handleReportSubmit(event)}
        >
          <h3>Report this donation</h3>

          <p>
            Tell the moderation team why this donation
            should be reviewed.
          </p>

          <div className="form-group">
            <label htmlFor="report-reason">
              Reason
            </label>

            <select
              id="report-reason"
              value={reportReason}
              onChange={(event) =>
                setReportReason(
                  event.target.value as ListingReportCreate["reason"]
                )
              }
              disabled={reportBusy}
              required
            >
              <option value="inappropriate">Inappropriate</option>
              <option value="misleading">Misleading</option>
              <option value="duplicate">Duplicate</option>
              <option value="incorrect_category">
                Incorrect Category
              </option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="report-details">
              Additional details (optional)
            </label>

            <textarea
              id="report-details"
              rows={4}
              maxLength={1000}
              value={reportDetails}
              onChange={(event) =>
                setReportDetails(event.target.value)
              }
              placeholder="Describe the issue..."
              disabled={reportBusy}
            />
          </div>

          <div className="card-actions">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={reportBusy}
            >
              {reportBusy ? "Submitting..." : "Submit Report"}
            </button>

            <button
              type="button"
              className="btn btn-outline"
              disabled={reportBusy}
              onClick={resetReportForm}
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </section>
  );
}

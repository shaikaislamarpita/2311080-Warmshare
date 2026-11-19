
import type { Listing } from "../../types/listing";
import { formatText } from "../../utils/formatText";

type DonationDetailsProps = {
  selectedListing: Listing | null;
  isOwner: (listing: Listing) => boolean;
  deletingId: number | null;
  closeDetails: () => void;
  openEditForm: (listing: Listing) => void;
  confirmDelete: (listing: Listing) => void;
};

export default function DonationDetails({
  selectedListing,
  isOwner,
  deletingId,
  closeDetails,
  openEditForm,
  confirmDelete,
}: DonationDetailsProps) {
  if (!selectedListing) {
    return null;
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

          <h2>{selectedListing.title}</h2>
        </div>

        <button
          type="button"
          className="btn btn-outline"
          onClick={closeDetails}
        >
          Close
        </button>
      </div>

      <div className="details-grid">
        <p>
          <strong>ID:</strong> {selectedListing.id}
        </p>

        <p>
          <strong>Category:</strong>{" "}
          {formatText(selectedListing.category)}
        </p>

        <p>
          <strong>Size:</strong>{" "}
          {formatText(selectedListing.size)}
        </p>

        <p>
          <strong>Age Group:</strong>{" "}
          {formatText(selectedListing.age_group)}
        </p>

        <p>
          <strong>Gender:</strong>{" "}
          {formatText(selectedListing.gender)}
        </p>

        <p>
          <strong>Condition:</strong>{" "}
          {formatText(selectedListing.condition)}
        </p>

        <p>
          <strong>Quantity:</strong>{" "}
          {selectedListing.quantity}
        </p>

        <p>
          <strong>Pickup Address:</strong>{" "}
          {selectedListing.pickup_address}
        </p>

        <p>
          <strong>Ownership:</strong>{" "}
          {selectedListing.owner_id === null
            ? "Legacy donation"
            : isOwner(selectedListing)
            ? "Your donation"
            : "Community donation"}
        </p>
      </div>

      {isOwner(selectedListing) && (
        <div className="card-actions">
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => openEditForm(selectedListing)}
          >
            Edit Donation
          </button>

          <button
            type="button"
            className="btn btn-danger"
            disabled={deletingId === selectedListing.id}
            onClick={() => confirmDelete(selectedListing)}
          >
            Delete Donation
          </button>
        </div>
      )}
    </section>
  );
}

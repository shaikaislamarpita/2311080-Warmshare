
import type { Listing } from "../../types/listing";
import { categoryEmojis } from "../../constants/listing";
import { formatText } from "../../utils/formatText";

type DonationCardProps = {
  listing: Listing;
  isOwner: boolean;
  deleting: boolean;
  viewDetails: (id: number) => void;
  openEditForm: (listing: Listing) => void;
  confirmDelete: (listing: Listing) => void;
};

export default function DonationCard({
  listing,
  isOwner,
  deleting,
  viewDetails,
  openEditForm,
  confirmDelete,
}: DonationCardProps) {
  return (
    <article className="donation-card" key={listing.id}>
      <div className="card-image">
        <span className="category-badge">
          {formatText(listing.category)}
        </span>

        <span className="card-emoji">
          {categoryEmojis[listing.category.toLowerCase()] || "📦"}
        </span>
      </div>

      <div className="card-body">
        <h3>{listing.title}</h3>

        <p className="card-meta">
          {formatText(listing.condition)} ·{" "}
          {formatText(listing.age_group)} ·{" "}
          {formatText(listing.size)}
        </p>

        <p className="card-location">
          📍 {listing.pickup_address}
        </p>

        <span className="quantity-label">
          Quantity: {listing.quantity}
        </span>

        {isOwner && (
          <p className="card-meta">
            Your donation
          </p>
        )}

        <div className="card-actions">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => viewDetails(listing.id)}
          >
            View Details
          </button>

          {isOwner && (
            <>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => openEditForm(listing)}
              >
                Edit
              </button>

              <button
                type="button"
                className="btn btn-danger"
                disabled={deleting}
                onClick={() => confirmDelete(listing)}
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </>
          )}
        </div>
      </div>
    </article>
  );
}

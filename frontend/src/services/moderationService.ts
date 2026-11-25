
import { authenticatedFetch } from "./api";
import type { ModeratorListing } from "../types/listing";

import type {
  ListingModerationUpdate,
  ListingReport,
  ReportReviewUpdate,
} from "../types/moderation";

// ========================================
// REPORT A DONATION
// Available to authenticated users.
// ========================================

export type ListingReportCreate = {
  reason:
    | "inappropriate"
    | "misleading"
    | "duplicate"
    | "incorrect_category"
    | "other";
  details?: string | null;
};

export async function reportListing(
  listingId: number,
  data: ListingReportCreate
): Promise<Response> {
  return authenticatedFetch(
    `/api/listings/${listingId}/reports`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    }
  );
}

// ========================================
// GET PENDING MODERATION REPORTS
// ========================================

export async function getModerationReports(): Promise<ListingReport[]> {
  const response = await authenticatedFetch(
    "/api/listings/moderation/reports"
  );

  if (!response.ok) {
    throw new Error(
      `Failed to load reports (${response.status})`
    );
  }

  return response.json();
}

// ========================================
// HIDE OR RESTORE A DONATION
// ========================================

export async function moderateListing(
  listingId: number,
  data: ListingModerationUpdate
): Promise<void> {
  const response = await authenticatedFetch(
    `/api/listings/${listingId}/moderation`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    throw new Error(
      `Failed to update listing moderation (${response.status})`
    );
  }
}

// ========================================
// RESOLVE OR DISMISS A REPORT
// ========================================

export async function reviewListingReport(
  reportId: number,
  data: ReportReviewUpdate
): Promise<void> {
  const response = await authenticatedFetch(
    `/api/listings/moderation/reports/${reportId}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    throw new Error(
      `Failed to review report (${response.status})`
    );
  }
}

// ========================================
// GET ALL DONATIONS FOR MODERATION
// Includes visible and hidden donations.
// ========================================

export async function getModerationListings(): Promise<ModeratorListing[]> {
  const response = await authenticatedFetch(
    "/api/listings/moderation/listings"
  );

  if (!response.ok) {
    throw new Error(
      `Failed to load moderation listings (${response.status})`
    );
  }

  return response.json();
}


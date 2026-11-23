import { authenticatedFetch } from "./api";
import type {
  ListingModerationUpdate,
  ListingReport,
  ReportReviewUpdate,
} from "../types/moderation";

export async function getModerationReports(): Promise<ListingReport[]> {
  const response = await authenticatedFetch(
    "/api/listings/moderation/reports",
  );

  if (!response.ok) {
    throw new Error(`Failed to load reports (${response.status})`);
  }

  return response.json();
}

export async function moderateListing(
  listingId: number,
  data: ListingModerationUpdate,
): Promise<void> {
  const response = await authenticatedFetch(
    `/api/listings/${listingId}/moderation`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    },
  );

  if (!response.ok) {
    throw new Error(`Failed to update listing moderation (${response.status})`);
  }
}

export async function reviewListingReport(
  reportId: number,
  data: ReportReviewUpdate,
): Promise<void> {
  const response = await authenticatedFetch(
    `/api/listings/moderation/reports/${reportId}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    },
  );

  if (!response.ok) {
    throw new Error(`Failed to review report (${response.status})`);
  }
}
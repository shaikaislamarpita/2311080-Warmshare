export type ListingReport = {
  id: number;
  listing_id: number;
  reporter_id: number;
  reason: string;
  details: string | null;
  status: string;
  reviewed_by: number | null;
  reviewed_at: string | null;
  resolution_note: string | null;
  created_at: string;
};

export type ListingModerationUpdate = {
  status: "visible" | "hidden";
  reason: string;
};

export type ReportReviewUpdate = {
  status: "resolved" | "dismissed";
  resolution_note?: string | null;
};
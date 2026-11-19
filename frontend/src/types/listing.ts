
export type Listing = {
  id: number;
  title: string;
  category: string;
  size: string;
  age_group: string;
  gender: string;
  condition: string;
  quantity: number;
  pickup_address: string;
  owner_id: number | null;
};

export type ListingForm = Omit<Listing, "id" | "owner_id">;

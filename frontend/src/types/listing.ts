
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

  // Null means this is a personal donation.
  // A number means the donation belongs to a group.
  group_id: number | null;
};

export type ListingForm = Omit<
  Listing,
  "id" | "owner_id" | "group_id"
> & {
  // Optional to preserve existing donation forms.
  group_id?: number | null;
};

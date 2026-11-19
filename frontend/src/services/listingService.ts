import type { ListingForm } from "../types/listing";

export function getListings(): Promise<Response> {
  return fetch("/api/listings");
}

export function getListingById(id: number): Promise<Response> {
  return fetch(`/api/listings/${id}`);
}

export function saveListing(
  form: ListingForm,
  token: string,
  editingId: number | null
): Promise<Response> {
  const isEditing = editingId !== null;
  const url = isEditing ? `/api/listings/${editingId}` : "/api/listings";

  return fetch(url, {
    method: isEditing ? "PUT" : "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(form),
  });
}

export function deleteListingById(
  id: number,
  token: string
): Promise<Response> {
  return fetch(`/api/listings/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}
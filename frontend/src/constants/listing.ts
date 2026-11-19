export const TOKEN_KEY = "warmshare_access_token";
import type { ListingForm } from "../types/listing";

export const emptyForm: ListingForm = {
  title: "",
  category: "jacket",
  size: "M",
  age_group: "adult",
  gender: "unisex",
  condition: "good",
  quantity: 1,
  pickup_address: "",
};

export const categories = [
  "jacket",
  "sweater",
  "blanket",
  "shawl",
  "socks",
];

export const categoryEmojis: Record<string, string> = {
  jacket: "🧥",
  sweater: "🧶",
  blanket: "🛏️",
  shawl: "🧣",
  socks: "🧦",
};
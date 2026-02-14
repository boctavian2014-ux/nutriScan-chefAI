import { apiFetch } from "./client";
import type { PantryListResponse } from "../types/api";

export const getPantryItems = (userId: string) =>
  apiFetch<PantryListResponse>(`/pantry?userId=${encodeURIComponent(userId)}`);

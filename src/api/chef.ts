import { apiFetch } from "./client";
import type { ChefResponse } from "../types/api";

export const generateChefRecipe = (userId: string, ingredients: string[]) =>
  apiFetch<ChefResponse>("/chef", {
    method: "POST",
    body: JSON.stringify({ userId, ingredients })
  });

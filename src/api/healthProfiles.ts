import { apiFetch } from "./client";
import type { HealthProfileResponse } from "../types/api";
import type { Goal } from "../types/domain";

export type HealthProfileInput = {
  userId: string;
  goals: Goal[];
  allergies: string[];
  healthConditions: string[];
};

export const upsertHealthProfile = (input: HealthProfileInput) =>
  apiFetch<HealthProfileResponse>("/health-profiles", {
    method: "POST",
    body: JSON.stringify(input)
  });

export const getHealthProfile = (userId: string) =>
  apiFetch<HealthProfileResponse>(`/health-profiles/${userId}`);

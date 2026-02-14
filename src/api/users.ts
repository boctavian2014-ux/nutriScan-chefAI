import { apiFetch } from "./client";
import type { UserResponse } from "../types/api";
import type { Language } from "../types/domain";

export type CreateUserInput = {
  name: string;
  age: number;
  weight: number;
  language: Language;
};

export const createUser = (input: CreateUserInput) =>
  apiFetch<UserResponse>("/users", {
    method: "POST",
    body: JSON.stringify(input)
  });

export const getUser = (id: string) =>
  apiFetch<UserResponse>(`/users/${id}`);

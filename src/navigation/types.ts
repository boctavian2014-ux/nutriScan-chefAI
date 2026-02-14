import type { Goal } from "../types/domain";

export type OnboardingStackParamList = {
  OnboardingStep1: undefined;
  OnboardingStep2: { name: string; age: number };
};

export type MainTabParamList = {
  Home: undefined;
  Scan: undefined;
  Pantry: undefined;
  ChefAI: undefined;
  Profile: undefined;
};

export type ScanStackParamList = {
  ScanMain: undefined;
  IngredientDetail: { ingredient: string };
};

export type OnboardingPayload = {
  name: string;
  age: number;
  weight: number;
  goal: Goal;
};

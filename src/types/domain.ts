export type Language = "en" | "ro" | "bg";
export type Goal =
  | "lose_weight"
  | "build_muscle"
  | "maintain"
  | "improve_markers";
export type RiskLevel = "green" | "yellow" | "red";

export type User = {
  id: string;
  name: string;
  age: number;
  weight: number;
  language: Language;
};

export type HealthProfile = {
  id: string;
  userId: string;
  goals: Goal[];
  allergies: string[];
  healthConditions: string[];
};

export type Product = {
  id: string;
  createdByUserId?: string | null;
  name: string;
  ingredients: string[];
  perIngredientMeta: Record<string, unknown>;
};

export type PantryItem = {
  id: string;
  userId: string;
  productId: string;
  quantity: number;
  expiresAt: string;
  overallRiskLevel: RiskLevel;
  overallRiskScore: number;
};

export type Scan = {
  id: string;
  userId: string;
  imageUrl: string;
  rawOcrText: string;
  extractedIngredients: string[];
  createdAt: string;
};

export type ChefRecipe = {
  title: string;
  description: string;
  ingredients: string[];
  steps: string[];
  nutritionHighlights: string[];
};

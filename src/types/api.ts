import type {
  ChefRecipe,
  HealthProfile,
  PantryItem,
  Product,
  Scan,
  User
} from "./domain";

export type ApiResponse<T> = {
  data: T;
};

export type UserResponse = ApiResponse<User>;
export type HealthProfileResponse = ApiResponse<HealthProfile>;
export type PantryListResponse = ApiResponse<PantryItem[]>;
export type ProductResponse = ApiResponse<Product>;
export type ScanResponse = ApiResponse<Scan>;
export type ChefResponse = ApiResponse<ChefRecipe>;

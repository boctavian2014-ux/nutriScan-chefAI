const envUrl = process.env.EXPO_PUBLIC_API_URL;
export const API_BASE_URL =
  envUrl ?? (typeof __DEV__ !== "undefined" && __DEV__ ? "http://localhost:4000/api" : "");

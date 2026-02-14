import { apiFetch } from "./client";
import type { ScanResponse } from "../types/api";

export const createScanWithText = (userId: string, rawOcrText: string) =>
  apiFetch<ScanResponse>("/scans", {
    method: "POST",
    body: JSON.stringify({ userId, rawOcrText })
  });

export const createScanWithImage = async (userId: string, uri: string) => {
  const formData = new FormData();
  const fileName = uri.split("/").pop() ?? "scan.jpg";
  const fileType = fileName.endsWith(".png") ? "image/png" : "image/jpeg";

  formData.append("userId", userId);
  formData.append("image", {
    uri,
    name: fileName,
    type: fileType
  } as unknown as Blob);

  return apiFetch<ScanResponse>("/scans", {
    method: "POST",
    body: formData
  });
};

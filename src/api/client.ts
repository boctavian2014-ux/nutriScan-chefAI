import { API_BASE_URL } from "../constants/config";

type ApiOptions = RequestInit & {
  body?: BodyInit | null;
};

export const apiFetch = async <T>(
  path: string,
  options: ApiOptions = {}
): Promise<T> => {
  const url = `${API_BASE_URL}${path}`;
  const isFormData = options.body instanceof FormData;

  let response: Response;
  let text: string;
  try {
    response = await fetch(url, {
      ...options,
      headers: {
        ...(isFormData ? {} : { "Content-Type": "application/json" }),
        ...(options.headers ?? {})
      }
    });
    text = await response.text();
  } catch (err) {
    const message = err instanceof Error ? err.message : "Network request failed";
    throw new Error(message);
  }

  let payload: unknown = null;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    throw new Error("Invalid response from server");
  }

  if (!response.ok) {
    const message =
      payload && typeof payload === "object" && "error" in payload
        ? String((payload as { error: unknown }).error)
        : "Request failed";
    throw new Error(message);
  }

  return payload as T;
};

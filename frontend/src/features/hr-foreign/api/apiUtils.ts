export const BASE = "/api/hr-foreign";

export function formatApiError(err: any, fallbackMessage: string): string {
  if (!err || !err.detail) return fallbackMessage;
  if (typeof err.detail === "string") return err.detail;
  if (Array.isArray(err.detail)) {
    return err.detail.map((e: any) => e.msg || JSON.stringify(e)).join("; ");
  }
  if (typeof err.detail === "object") {
    return err.detail.message || err.detail.msg || JSON.stringify(err.detail);
  }
  return fallbackMessage;
}

export async function handleApiResponse<T>(
  res: Response,
  fallbackMessage: string
): Promise<T> {
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(formatApiError(err, fallbackMessage));
  }
  return res.json() as Promise<T>;
}


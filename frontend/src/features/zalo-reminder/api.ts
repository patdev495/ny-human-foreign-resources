import type { TestSendResult, ZaloBotStatus, ZaloDailyDelivery, ZaloDelivery, ZaloPerson } from "./types";

async function json<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`/api/zalo-reminder${path}`, options);
  if (!response.ok) {
    const body: unknown = await response.json().catch(() => null);
    const detail = body && typeof body === "object" && "detail" in body && typeof body.detail === "string"
      ? body.detail : `Yêu cầu thất bại (${response.status})`;
    throw new Error(detail);
  }
  return await response.json() as T;
}

export const zaloReminderApi = {
  enabled: (): Promise<{ enabled: boolean; effective_date: string; pending_enabled: boolean | null }> => json("/enabled"),
  saveEnabled: (enabled: boolean): Promise<{ enabled: boolean; effective_date: string }> => json("/enabled", {
    method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ enabled }),
  }),
  cutoff: (): Promise<{ time: string }> => json<{ time: string }>("/cutoff"),
  saveCutoff: (time: string): Promise<{ time: string }> => json<{ time: string }>("/cutoff", {
    method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ time }),
  }),
  daily: (date: string): Promise<ZaloDailyDelivery[]> => json<ZaloDailyDelivery[]>(`/daily?date=${encodeURIComponent(date)}`),
  runDue: (): Promise<{ date: string; due: boolean }> => json<{ date: string; due: boolean }>("/run-due", { method: "POST" }),
  status: (): Promise<ZaloBotStatus> => json<ZaloBotStatus>("/status"),
  friends: (search: string): Promise<ZaloPerson[]> => json<ZaloPerson[]>(`/friends?q=${encodeURIComponent(search)}`),
  recipients: (): Promise<ZaloPerson[]> => json<ZaloPerson[]>("/recipients"),
  saveRecipients: (ids: string[]): Promise<ZaloPerson[]> => json<ZaloPerson[]>("/recipients", {
    method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids }),
  }),
  deliveries: (): Promise<ZaloDelivery[]> => json<ZaloDelivery[]>("/deliveries"),
  sendTest: (id: string): Promise<TestSendResult> => json<TestSendResult>("/test-send", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }),
  }),
  qr: async (): Promise<Blob | null> => {
    const response = await fetch("/api/zalo-reminder/qr", { cache: "no-store" });
    if (response.status === 404) return null;
    if (!response.ok) throw new Error(`Không tải được mã QR (${response.status})`);
    return await response.blob();
  },
};

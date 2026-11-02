import type { TelegramBotState, TelegramDailyDelivery, TelegramDelivery, TelegramRecipient } from "./types";

async function json<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`/api/telegram-reminder${path}`, options);
  if (!response.ok) {
    const body: unknown = await response.json().catch(() => null);
    const detail = body && typeof body === "object" && "detail" in body && typeof body.detail === "string"
      ? body.detail : `Yêu cầu thất bại (${response.status})`;
    throw new Error(detail);
  }
  return await response.json() as T;
}

function body(method: "POST" | "PUT", value: object): RequestInit {
  return { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(value) };
}

export const telegramReminderApi = {
  bot: (): Promise<TelegramBotState> => json("/bot"),
  checkBot: (): Promise<TelegramBotState> => json("/bot/check", { method: "POST" }),
  connect: (token: string): Promise<TelegramBotState> => json("/bot", body("POST", { token })),
  enabled: (): Promise<{ enabled: boolean; effective_date: string; pending_enabled: boolean | null }> => json("/enabled"),
  saveEnabled: (enabled: boolean): Promise<{ enabled: boolean; effective_date: string }> => json("/enabled", body("PUT", { enabled })),
  recipients: (q = ""): Promise<TelegramRecipient[]> => json(`/recipients?q=${encodeURIComponent(q)}`),
  saveRecipients: (ids: string[]): Promise<TelegramRecipient[]> => json("/recipients", body("PUT", { ids })),
  sendTest: (id: string): Promise<{ status: string }> => json("/test-send", body("POST", { id })),
  deliveries: (): Promise<TelegramDelivery[]> => json("/deliveries"),
  daily: (date: string): Promise<TelegramDailyDelivery[]> => json(`/daily?date=${encodeURIComponent(date)}`),
  runDue: (): Promise<{ date: string; due: boolean }> => json("/run-due", { method: "POST" }),
};

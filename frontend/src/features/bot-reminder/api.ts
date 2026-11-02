async function json<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`/api/bot-reminder${path}`, options);
  if (!response.ok) {
    const body: unknown = await response.json().catch(() => null);
    const detail = body && typeof body === "object" && "detail" in body && typeof body.detail === "string"
      ? body.detail : `Yêu cầu thất bại (${response.status})`;
    throw new Error(detail);
  }
  return await response.json() as T;
}

export const botReminderApi = {
  cutoff: (): Promise<{ time: string }> => json("/cutoff"),
  saveCutoff: (time: string): Promise<{ time: string }> => json("/cutoff", {
    method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ time }),
  }),
};

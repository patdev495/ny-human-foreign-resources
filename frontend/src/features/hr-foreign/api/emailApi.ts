import { handleApiResponse } from "./apiUtils";
import type {
  EmailConfigRead,
  EmailConfigUpdate,
  EmailDeliveryLogRead,
  TestEmailResponse,
  TriggerWarningEmailResponse,
} from "../types";

export async function fetchEmailConfig(): Promise<EmailConfigRead> {
  const res = await fetch("/api/hr-foreign/email-config");
  return handleApiResponse<EmailConfigRead>(res, "Không thể tải cấu hình email");
}

export async function updateEmailConfig(
  payload: EmailConfigUpdate
): Promise<EmailConfigRead> {
  const res = await fetch("/api/hr-foreign/email-config", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handleApiResponse<EmailConfigRead>(res, "Không thể cập nhật cấu hình email");
}

export async function sendTestEmail(toEmail: string): Promise<TestEmailResponse> {
  const res = await fetch("/api/hr-foreign/email-config/send-test", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ to_email: toEmail }),
  });
  return handleApiResponse<TestEmailResponse>(res, "Không thể gửi email thử nghiệm");
}

export async function triggerWarningEmailNow(): Promise<TriggerWarningEmailResponse> {
  const res = await fetch("/api/hr-foreign/email-config/trigger-now", {
    method: "POST",
  });
  return handleApiResponse<TriggerWarningEmailResponse>(
    res,
    "Không thể phát hành bản tin email cảnh báo"
  );
}

export async function fetchEmailDeliveryLogs(): Promise<EmailDeliveryLogRead[]> {
  const res = await fetch("/api/hr-foreign/email-delivery-logs");
  return handleApiResponse<EmailDeliveryLogRead[]>(res, "Không thể tải nhật ký gửi email");
}

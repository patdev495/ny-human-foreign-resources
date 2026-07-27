export interface EmailConfigRead {
  id: number;
  config_key: string;
  recipient_emails: string | null;
  is_enabled: boolean;
  scheduled_time: string;
  last_sent_at: string | null;
}

export interface EmailConfigUpdate {
  recipient_emails?: string | null;
  is_enabled?: boolean;
  scheduled_time?: string;
}

export interface TestEmailRequest {
  to_email: string;
}

export interface TestEmailResponse {
  success: boolean;
  message: string;
}

export interface TriggerWarningEmailResponse {
  success: boolean;
  message: string;
  total_expired_docs: number;
  total_expiring_docs: number;
}

export interface EmailDeliveryLogRead {
  id: number;
  sent_at: string;
  trigger_type: string;
  recipients: string | null;
  total_expired_docs: number;
  total_expiring_docs: number;
  status: string;
  error_message: string | null;
}

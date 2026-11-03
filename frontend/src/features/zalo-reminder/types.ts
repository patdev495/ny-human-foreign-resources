export interface ZaloBotStatus {
  connected: boolean;
  qr_available: boolean;
}

export interface ZaloPerson {
  id: string;
  name: string;
}

export interface ZaloDelivery {
  id: string;
  name: string;
  status: "SENT" | "FAILED";
  error: string;
  trigger_type: "TEST";
  message_type: "PRE" | "CUTOFF";
  created_at?: string;
}

export interface TestSendResult {
  status: "SENT" | "FAILED";
  results: { message_type: "PRE" | "CUTOFF"; status: "SENT" | "FAILED"; error: string }[];
}

export interface ZaloDailyDelivery {
  id: string;
  name: string;
  date: string;
  status: "SENT" | "FAILED" | "MISSED" | "UNKNOWN" | "SENDING";
  error: string;
  updated_at: string;
}

export interface TelegramBotState {
  connected: boolean;
  id: string;
  name: string;
  username: string;
  url: string;
}

export interface TelegramRecipient {
  id: string;
  name: string;
  username: string;
  selected: boolean;
}

export interface TelegramDelivery {
  id: string;
  bot_id: string;
  name: string;
  status: "SENT" | "FAILED";
  error: string;
  created_at: string;
}

export interface TelegramDailyDelivery {
  id: string;
  bot_id: string;
  name: string;
  date: string;
  status: "SENT" | "FAILED" | "MISSED" | "UNKNOWN" | "SENDING";
  error: string;
  updated_at: string;
}

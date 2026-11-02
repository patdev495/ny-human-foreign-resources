declare module "zca-js" {
  export enum ThreadType { User = 0, Group = 1 }
  export enum LoginQRCallbackEventType {
    QRCodeGenerated = 0,
    QRCodeExpired = 1,
    QRCodeScanned = 2,
    QRCodeDeclined = 3,
    GotLoginInfo = 4,
  }
  export interface Credentials {
    imei: string;
    cookie: unknown;
    userAgent: string;
  }
  export interface Friend {
    userId: string;
    displayName: string;
    zaloName: string;
    username: string;
  }
  export interface API {
    getAllFriends(): Promise<Friend[]>;
    sendMessage(payload: { msg: string }, threadId: string, type: ThreadType): Promise<unknown>;
    listener: {
      on(event: "connected", handler: () => void): void;
      on(event: "disconnected" | "closed", handler: () => void): void;
      start(options: { retryOnClose: boolean }): void;
      stop(): void;
    };
  }
  export type LoginQRCallbackEvent =
    | { type: LoginQRCallbackEventType.QRCodeGenerated; actions: { saveToFile(path: string): Promise<unknown> } }
    | { type: LoginQRCallbackEventType.QRCodeExpired }
    | { type: LoginQRCallbackEventType.GotLoginInfo; data: Credentials }
    | { type: LoginQRCallbackEventType.QRCodeScanned | LoginQRCallbackEventType.QRCodeDeclined };
  export class Zalo {
    constructor(options?: { selfListen?: boolean });
    login(credentials: Credentials): Promise<API>;
    loginQR(options: { qrPath: string }, callback: (event: LoginQRCallbackEvent) => Promise<void>): Promise<API>;
  }
}

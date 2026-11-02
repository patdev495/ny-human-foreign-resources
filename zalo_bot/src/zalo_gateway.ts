import fs from "node:fs/promises";
import path from "node:path";
import { LoginQRCallbackEventType, ThreadType, Zalo, type API, type Credentials } from "zca-js";

import type { BotGateway } from "./server.js";

export class PersonalZaloGateway implements BotGateway {
  private api: API | null = null;
  private connected = false;
  private qrReady = false;
  private connecting: Promise<void> | null = null;
  private readonly credentialsPath: string;
  private readonly qrPath: string;

  constructor(stateDir: string) {
    this.credentialsPath = path.join(stateDir, "credentials.json");
    this.qrPath = path.join(stateDir, "login-qr.png");
  }

  start(): void {
    if (this.connecting) return;
    this.connecting = this.connect().finally(() => { this.connecting = null; });
    void this.connecting.catch(() => {
      setTimeout(() => this.start(), 5_000);
    });
  }

  status(): { connected: boolean; qr_available: boolean } {
    return { connected: this.connected, qr_available: this.api === null && this.qrReady };
  }

  async qr(): Promise<Buffer | null> {
    if (this.api || !this.qrReady) return null;
    try { return await fs.readFile(this.qrPath); }
    catch { return null; }
  }

  async friends(): Promise<Array<{ id: string; name: string }>> {
    const api = this.requireApi();
    try {
      const friends = await api.getAllFriends();
      return friends.map((friend) => ({
        id: String(friend.userId),
        name: friend.displayName || friend.zaloName || friend.username || String(friend.userId),
      }));
    } catch (error) {
      this.reconnect();
      throw error;
    }
  }

  async send(id: string, message: string): Promise<void> {
    const api = this.requireApi();
    try { await api.sendMessage({ msg: message }, id, ThreadType.User); }
    catch (error) {
      this.reconnect();
      throw error;
    }
  }

  private requireApi(): API {
    if (!this.api || !this.connected) throw new Error("Zalo account is not connected");
    return this.api;
  }

  private reconnect(): void {
    this.api?.listener.stop();
    this.api = null;
    this.connected = false;
    this.qrReady = false;
    setTimeout(() => this.start(), 100);
  }

  private attach(api: API): void {
    this.api = api;
    this.connected = false;
    api.listener.on("connected", () => { if (this.api === api) this.connected = true; });
    api.listener.on("disconnected", () => { if (this.api === api) this.connected = false; });
    api.listener.on("closed", () => { if (this.api === api) this.reconnect(); });
    api.listener.start({ retryOnClose: true });
  }

  private async connect(): Promise<void> {
    const zalo = new Zalo({ selfListen: false });
    await fs.mkdir(path.dirname(this.credentialsPath), { recursive: true });
    this.qrReady = false;
    await fs.rm(this.qrPath, { force: true });
    try {
      const saved = JSON.parse(await fs.readFile(this.credentialsPath, "utf8")) as Credentials;
      this.attach(await zalo.login(saved));
      this.qrReady = false;
      await fs.rm(this.qrPath, { force: true });
      return;
    } catch {
      await fs.rm(this.credentialsPath, { force: true });
    }
    const api = await zalo.loginQR({ qrPath: this.qrPath }, async (event) => {
      if (event.type === LoginQRCallbackEventType.QRCodeGenerated) {
        await event.actions.saveToFile(this.qrPath);
        this.qrReady = true;
      } else if (event.type === LoginQRCallbackEventType.QRCodeExpired) {
        await fs.rm(this.qrPath, { force: true });
        this.qrReady = false;
      } else if (event.type === LoginQRCallbackEventType.GotLoginInfo) {
        await fs.writeFile(this.credentialsPath, JSON.stringify(event.data), { flag: "w" });
        await fs.rm(this.qrPath, { force: true });
        this.qrReady = false;
      }
    });
    this.attach(api);
    await fs.rm(this.qrPath, { force: true });
  }
}

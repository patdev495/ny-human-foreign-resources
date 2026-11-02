import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import { timingSafeEqual } from "node:crypto";

export interface BotGateway {
  status(): { connected: boolean; qr_available: boolean };
  qr(): Promise<Buffer | null>;
  friends(): Promise<Array<{ id: string; name: string }>>;
  send(id: string, message: string): Promise<void>;
}

function authorized(request: IncomingMessage, secret: string): boolean {
  const received = request.headers["x-bot-secret"];
  if (typeof received !== "string") return false;
  const left = Buffer.from(received);
  const right = Buffer.from(secret);
  return left.length === right.length && timingSafeEqual(left, right);
}

function json(response: ServerResponse, code: number, value: unknown): void {
  response.writeHead(code, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
  response.end(JSON.stringify(value));
}

async function requestJson(request: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of request) {
    const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += bytes.length;
    if (size > 16_384) throw new Error("Request too large");
    chunks.push(bytes);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8")) as unknown;
}

export function createBotServer(bot: BotGateway, secret: string): Server {
  return createServer((request, response) => {
    if (!authorized(request, secret)) {
      json(response, 401, { error: "Unauthorized" });
      return;
    }
    if (request.method === "GET" && request.url === "/status") {
      json(response, 200, bot.status());
      return;
    }
    if (request.method === "GET" && request.url === "/qr") {
      void bot.qr().then((image) => {
        if (image === null) {
          json(response, 404, { error: "QR unavailable" });
          return;
        }
        response.writeHead(200, { "content-type": "image/png", "cache-control": "no-store" });
        response.end(image);
      }).catch(() => json(response, 503, { error: "Bot unavailable" }));
      return;
    }
    if (request.method === "GET" && request.url === "/friends") {
      void bot.friends().then((friends) => json(response, 200, friends))
        .catch(() => json(response, 503, { error: "Bot unavailable" }));
      return;
    }
    if (request.method === "POST" && request.url === "/send") {
      void requestJson(request).then(async (body) => {
        if (typeof body !== "object" || body === null || !("id" in body) || !("message" in body)
          || typeof body.id !== "string" || !body.id || typeof body.message !== "string" || !body.message) {
          json(response, 400, { error: "Invalid message" });
          return;
        }
        await bot.send(body.id, body.message);
        json(response, 200, { ok: true });
      }).catch(() => json(response, 503, { error: "Send failed" }));
      return;
    }
    json(response, 404, { error: "Not found" });
  });
}

import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import type { AddressInfo } from "node:net";

import { createBotServer } from "../src/server.js";

const sent: Array<{ id: string; message: string }> = [];
let failSend = false;
const fakeZalo = {
  status: () => ({ connected: false, qr_available: false }),
  qr: async () => Buffer.from("test-qr-image"),
  friends: async () => [{ id: "uid-1", name: "HR A" }],
  send: async (id: string, message: string) => {
    if (failSend) throw new Error("Zalo refused send");
    sent.push({ id, message });
  },
};

let baseUrl = "";
const server = createBotServer(fakeZalo, "test-secret");

before(async () => {
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});
after(async () => { await new Promise<void>((resolve) => server.close(() => resolve())); });

test("bot API denies requests without its internal secret", async () => {
  const response = await fetch(`${baseUrl}/status`);
  assert.equal(response.status, 401);
});

test("bot API reports connection state to an authorized caller", async () => {
  const response = await fetch(`${baseUrl}/status`, { headers: { "x-bot-secret": "test-secret" } });
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { connected: false, qr_available: false });
});

test("bot API serves the current QR only to an authorized caller", async () => {
  const response = await fetch(`${baseUrl}/qr`, { headers: { "x-bot-secret": "test-secret" } });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-type"), "image/png");
  assert.equal(await response.text(), "test-qr-image");
});

test("bot API lists Zalo friends for recipient selection", async () => {
  const response = await fetch(`${baseUrl}/friends`, { headers: { "x-bot-secret": "test-secret" } });
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), [{ id: "uid-1", name: "HR A" }]);
});

test("bot API sends a direct message to one Zalo user", async () => {
  const response = await fetch(`${baseUrl}/send`, {
    method: "POST",
    headers: { "x-bot-secret": "test-secret", "content-type": "application/json" },
    body: JSON.stringify({ id: "uid-1", message: "Nhắc chốt cơm" }),
  });
  assert.equal(response.status, 200);
  assert.deepEqual(sent, [{ id: "uid-1", message: "Nhắc chốt cơm" }]);
});

test("bot API does not report success when Zalo refuses a message", async () => {
  failSend = true;
  try {
    const response = await fetch(`${baseUrl}/send`, {
      method: "POST",
      headers: { "x-bot-secret": "test-secret", "content-type": "application/json" },
      body: JSON.stringify({ id: "uid-1", message: "Nhắc chốt cơm" }),
    });
    assert.equal(response.status, 503);
  } finally { failSend = false; }
});

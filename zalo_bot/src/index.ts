import path from "node:path";
import { createBotServer } from "./server.js";
import { PersonalZaloGateway } from "./zalo_gateway.js";

const secret = process.env.HR_ZALO_BOT_SECRET;
if (!secret || secret.length < 32) throw new Error("HR_ZALO_BOT_SECRET must be at least 32 characters");

const port = Number(process.env.HR_ZALO_BOT_PORT || "8016");
if (!Number.isInteger(port) || port < 1 || port > 65_535) throw new Error("Invalid HR_ZALO_BOT_PORT");

const gateway = new PersonalZaloGateway(path.resolve("data"));
const server = createBotServer(gateway, secret);
server.listen(port, "127.0.0.1", () => gateway.start());

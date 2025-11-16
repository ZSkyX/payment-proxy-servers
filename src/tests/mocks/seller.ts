import { config } from "dotenv";
import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { paymentMiddleware, Network, Resource } from "x402-hono";
import nodeFetch from "node-fetch";
import { facilitator } from "@coinbase/x402";
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config({ path: resolve(__dirname, '../../.env') });

// Workaround for Node.js fetch content-length issue
// @ts-ignore
globalThis.fetch = nodeFetch;

const facilitatorUrl = "https://x402.org/facilitator" as Resource;
const payTo = "redacted" as `0x${string}`;
const network = "base" as Network;

if (!facilitatorUrl || !payTo || !network) {
  console.error("Missing required environment variables");
  process.exit(1);
}

const app = new Hono();

console.log("Server is running");

app.use(
  paymentMiddleware(
    payTo,
    {
      "/weather": {
        price: "$0.001",
        network,
      },
    },
    facilitator
  ),
);

app.get("/weather", c => {

  console.log("Accessed /weather endpoint");
  return c.json({
    report: {
      weather: "sunny",
      temperature: 70,
    },
  });
});

serve({
  fetch: app.fetch,
  port: 4021,
});
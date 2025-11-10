import { config } from "dotenv";
import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { paymentMiddleware, Network, Resource, SolanaAddress } from "x402-hono";
import nodeFetch from "node-fetch";

config();

// Workaround for Node.js fetch content-length issue
// @ts-ignore
globalThis.fetch = nodeFetch;

const facilitatorUrl = "https://x402.org/facilitator" as Resource;
const payTo = "0x2d43c3a14f57004b55672ca8d5024ab9cc25c46a" as `0x${string}` | SolanaAddress;
const network = "base-sepolia" as Network;

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
    {
      url: facilitatorUrl,
    },
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
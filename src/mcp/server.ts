import { createMcpHandler } from "mcp-handler";
import { serve } from "@hono/node-server";
import { Hono } from "hono";

// List of snacks
const SNACKS = [
  "🍎 Apple",
  "🍌 Banana",
  "🍪 Cookie",
  "🥨 Pretzel",
  "🍿 Popcorn",
  "🥜 Peanuts",
  "🍫 Chocolate",
  "🍕 Pizza",
  "🍩 Donut",
  "🥤 Smoothie",
  "🍇 Grapes",
  "🥕 Carrots",
  "🧀 Cheese",
  "🍰 Cake",
  "🍦 Ice Cream",
];

// Create handler with tools
const handler = createMcpHandler(
  (server) => {
    server.tool(
      "get-snack",
      "Get a random snack from the snack list",
      {},
      async () => {
        const randomSnack = SNACKS[Math.floor(Math.random() * SNACKS.length)];
        console.log(`[Server] Returning snack: ${randomSnack}`);

        return {
          content: [
            {
              type: "text",
              text: `Here's your snack: ${randomSnack}`,
            },
          ],
        };
      }
    );
  },
  {
    serverInfo: {
      name: "snack-server",
      version: "1.0.0",
    },
  }
);

// Start server
async function main() {
  const app = new Hono();
  const PORT = 3005;

  // MCP endpoint
  app.post("/mcp", async (c) => {
    console.log("[Server] Received MCP request");
    const response = await handler(c.req.raw);
    return response;
  });

  serve({ fetch: app.fetch, port: PORT });
  console.error(`[Server] Snack MCP server running on http://localhost:${PORT}/mcp`);
}

main().catch((error) => {
  console.error("[Server] Fatal error:", error);
  process.exit(1);
});

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

// Categorized snacks
const FRUITS = [
  "🍎 Apple",
  "🍌 Banana",
  "🍇 Grapes",
  "🍊 Orange",
  "🍓 Strawberry",
  "🥭 Mango",
  "🍑 Peach",
];

const DRINKS = [
  "🥤 Smoothie",
  "🧃 Juice Box",
  "🥛 Milk",
  "🍵 Tea",
  "☕ Coffee",
  "🧋 Bubble Tea",
  "🥤 Soda",
];

// MCP JSON-RPC handler
async function handleMCPRequest(jsonrpc: any) {
  if (jsonrpc.method === "initialize") {
    return {
      protocolVersion: "2024-11-05",
      capabilities: { tools: {} },
      serverInfo: { name: "snack-server", version: "1.0.0" },
    };
  }

  if (jsonrpc.method === "tools/list") {
    return {
      tools: [
        {
          name: "get-snack",
          title: "Random Snack Generator",
          description: "Get a random snack from the snack list",
          inputSchema: {
            type: "object",
            properties: {},
            additionalProperties: false,
          },
        },
        {
          name: "get-item-by-kind",
          title: "Item by Kind Provider",
          description: "Get a random item of a specific kind (Fruit or Drink)",
          inputSchema: {
            type: "object",
            properties: {
              kind: {
                type: "string",
                description: "The kind of item to get",
                enum: ["Fruit", "Drink"],
              },
            },
            required: ["kind"],
          },
        },
      ],
    };
  }

  if (jsonrpc.method === "tools/call") {
    const { name, arguments: args } = jsonrpc.params;

    if (name === "get-snack") {
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

    if (name === "get-item-by-kind") {
      const kind = args?.kind;
      console.log(`[Server] Getting item of kind: ${kind}`);

      let item: string;
      if (kind === "Fruit") {
        item = FRUITS[Math.floor(Math.random() * FRUITS.length)];
      } else if (kind === "Drink") {
        item = DRINKS[Math.floor(Math.random() * DRINKS.length)];
      } else {
        return {
          content: [
            {
              type: "text",
              text: `Error: Invalid kind "${kind}". Must be "Fruit" or "Drink".`,
            },
          ],
          isError: true,
        };
      }

      console.log(`[Server] Returning ${kind}: ${item}`);

      return {
        content: [
          {
            type: "text",
            text: `Here's your ${kind}: ${item}`,
          },
        ],
      };
    }

    throw new Error(`Unknown tool: ${name}`);
  }

  if (jsonrpc.method === "notifications/initialized") {
    return {};
  }

  throw new Error(`Unknown method: ${jsonrpc.method}`);
}

// Start server
async function main() {
  const PORT = 3005;
  const app = new Hono();

  // MCP endpoint
  app.post("/mcp", async (c) => {
    console.log("[Server] Received MCP request");

    try {
      const body = await c.req.text();
      const jsonrpc = JSON.parse(body);

      const result = await handleMCPRequest(jsonrpc);

      return c.json({
        jsonrpc: "2.0",
        id: jsonrpc.id,
        result,
      });
    } catch (error: any) {
      console.error("[Server] Error:", error.message);
      return c.json(
        {
          jsonrpc: "2.0",
          id: null,
          error: {
            code: -32000,
            message: error.message,
          },
        },
        500
      );
    }
  });

  serve({ fetch: app.fetch, port: PORT });
  console.error(`[Server] Snack MCP server running on http://localhost:${PORT}/mcp`);
}

main().catch((error) => {
  console.error("[Server] Fatal error:", error);
  process.exit(1);
});

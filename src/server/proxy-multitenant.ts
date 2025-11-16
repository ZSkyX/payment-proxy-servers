import { serve } from "@hono/node-server"
import { Hono } from "hono"
import { createDirectPaymentHandler } from "./payment-handler.js"
import { Client } from "@modelcontextprotocol/sdk/client/index.js"
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js"
import * as path from "path"
import { fileURLToPath } from "url"
import { config } from "dotenv"
import { resolve } from 'node:path'
import { db } from "@/shared/database"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

config({ path: resolve(__dirname, '../../.env') });
// Configuration structure
interface ToolConfig {
  name: string
  description: string
  price: number
  enabled: boolean
}

interface ServerConfig {
  upstreamUrl: string
  yourWallet: string
  tools: ToolConfig[]
}

// Server configuration
// Railway provides PORT env var, use that if PROXY_BASE is not set
const PROXY_PORT = process.env.PORT ? parseInt(process.env.PORT) : 3003;
const PROXY_BASE: string = `${process.env.PROXY_BASE}:${PROXY_PORT}` || `http://localhost:${PROXY_PORT}`

// Config cache to avoid reading from disk on every request
const configCache = new Map<string, { config: ServerConfig; loadedAt: number }>()
const CACHE_TTL = 60000 // 1 minute

// Upstream client cache per config
const upstreamClients = new Map<string, Client>()

// Handler cache per config
const handlerCache = new Map<string, (req: Request) => Promise<Response>>()

async function loadConfig(configId: string): Promise<ServerConfig | null> {
  // Check cache first
  const cached = configCache.get(configId)
  if (cached && Date.now() - cached.loadedAt < CACHE_TTL) {
    return cached.config
  }

  try {
    // Load config from Supabase
    const dbConfig = await db.getConfigByIdPublic(configId)

    if (!dbConfig) {
      console.error(`[${configId}] Config not found in database`)
      return null
    }

    // Load tools for this config
    const dbTools = await db.getToolsByConfigId(configId)

    // Transform database format to ServerConfig format
    const config: ServerConfig = {
      upstreamUrl: dbConfig.upstream_url,
      yourWallet: dbConfig.wallet_address,
      tools: dbTools.map(tool => ({
        name: tool.name,
        description: tool.description || '',
        price: Number(tool.price),
        enabled: tool.enabled
      }))
    }

    configCache.set(configId, { config, loadedAt: Date.now() })
    console.log(`[${configId}] Config loaded successfully from database`)
    return config
  } catch (error) {
    console.error(`[${configId}] Error loading config:`, error)
    return null
  }
}

async function getUpstreamClient(configId: string, upstreamUrl: string): Promise<Client> {
  // Check if we already have a client for this config
  if (upstreamClients.has(configId)) {
    return upstreamClients.get(configId)!
  }

  // Create new client
  const client = new Client(
    { name: `proxy-${configId}`, version: "1.0.0" },
    { capabilities: {} }
  )

  console.log(`[${configId}] Creating transport for upstream: ${upstreamUrl}`)
  const transport = new StreamableHTTPClientTransport(new URL(upstreamUrl))
  await client.connect(transport)

  upstreamClients.set(configId, client)
  console.log(`[${configId}] Connected to upstream: ${upstreamUrl}`)

  return client
}

async function createMcpHandlerForConfig(configId: string, config: ServerConfig) {
  console.log(`[${configId}] Creating direct payment handler for config`)

  // Get upstream client
  const upstream = await getUpstreamClient(configId, config.upstreamUrl)

  // Construct the full resource URL for this proxy endpoint
  const resourceUrl = `${PROXY_BASE}/mcp/${configId}`

  console.log(`[${configId}] Resource URL for payments: ${resourceUrl}`)

  // Create our direct payment handler
  return createDirectPaymentHandler(config, upstream, resourceUrl)
}

// Start multi-tenant proxy server
const app = new Hono()

// Health check endpoint
app.get("/health", (c) => {
  return c.json({ status: "ok", port: PROXY_PORT })
})

// Multi-tenant MCP endpoint handler function
const handleMcpRequest = async (c: any) => {
  const configId = c.req.param("configId")

  console.log(`\n[PROXY] ========================================`)
  console.log(`[PROXY] Incoming Request:`)
  console.log(`[PROXY]   Method: ${c.req.method}`)
  console.log(`[PROXY]   URL: ${c.req.url}`)
  console.log(`[PROXY]   Path: ${c.req.path}`)
  console.log(`[PROXY]   ConfigId: ${configId}`)
  console.log(`[PROXY] ========================================\n`)

  if (!configId) {
    console.log(`[PROXY] ❌ ERROR: No config ID provided`)
    return c.json({ error: "Config ID required" }, 400)
  }

  // Load config for this request
  const config = await loadConfig(configId)

  if (!config) {
    console.log(`[PROXY] ❌ ERROR: Config not found for ID: ${configId}`)
    return c.json({ error: `Configuration not found: ${configId}` }, 404)
  }

  console.log(`[PROXY] ✅ Config loaded for ${configId}`)
  console.log(`[PROXY]   Upstream: ${config.upstreamUrl}`)
  console.log(`[PROXY]   Wallet: ${config.yourWallet}`)
  console.log(`[PROXY]   Tools: ${config.tools.length}`)

  // Get or create handler for this config
  let handler = handlerCache.get(configId)
  if (!handler) {
    handler = await createMcpHandlerForConfig(configId, config)
    handlerCache.set(configId, handler)
    console.log(`[PROXY] Created and cached handler for ${configId}`)
  } else {
    console.log(`[PROXY] Using cached handler for ${configId}`)
  }

  try {
    // Rewrite URL to strip configId - handler expects /mcp not /mcp/{configId}
    const originalUrl = new URL(c.req.raw.url)
    const rewrittenUrl = new URL('/mcp', originalUrl.origin)

    console.log(`[PROXY] Forwarding request to handler`)
    console.log(`[PROXY]   Original URL: ${c.req.raw.url}`)
    console.log(`[PROXY]   Rewritten URL: ${rewrittenUrl.toString()}`)
    console.log(`[PROXY]   Request method: ${c.req.raw.method}`)
    console.log(`[PROXY]   Has body: ${c.req.raw.body ? 'YES' : 'NO'}`)
    console.log(`[PROXY]   Content-Type: ${c.req.raw.headers.get('content-type')}`)
    console.log(`[PROXY]   Has X-PAYMENT: ${c.req.raw.headers.get('x-payment') ? 'YES' : 'NO'}`)

    // Create a new request with rewritten URL
    const rewrittenRequest = new Request(rewrittenUrl, {
      method: c.req.raw.method,
      headers: c.req.raw.headers,
      body: c.req.raw.body,
      // @ts-ignore
      duplex: 'half'
    })

    const response = await handler(rewrittenRequest)
    console.log(`[PROXY] ✅ Handler returned response, status:`, response?.status || 'unknown')
    return response
  } catch (error: any) {
    console.error(`[PROXY] ❌ Handler error:`, error.message)
    console.error(error.stack)
    throw error
  }
}

// Multi-tenant MCP endpoints - handle both base path and sub-paths
app.post("/mcp/:configId", handleMcpRequest)
app.post("/mcp/:configId/*", handleMcpRequest)


serve({ fetch: app.fetch, port: PROXY_PORT })

console.log(`
╔════════════════════════════════════════════════════════════╗
║  🚀 Multi-Tenant MCP Proxy Server                          ║
╠════════════════════════════════════════════════════════════╣
║  Port: ${PROXY_PORT.toString().padEnd(55)} ║
║  Mode: Multi-Tenant                                        ║
║                                                            ║
║  Usage:                                                    ║
║    URL ${PROXY_BASE}/mcp/{configId}              ║
║                                                            ║
║  Configs source: Supabase Database                     ║
╚════════════════════════════════════════════════════════════╝
`)

console.log("\n✅ Ready to accept requests for any config UUID\n")

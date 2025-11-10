import { Client } from "@modelcontextprotocol/sdk/client/index.js"
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js"
import * as readline from "readline"
import * as fs from "fs"
import * as path from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Configuration structure
interface ToolConfig {
  name: string
  description: string
  price: number // in USD
  enabled: boolean
}

interface ServerConfig {
  upstreamUrl: string
  proxyPort: number
  yourWallet: string
  tools: ToolConfig[]
}

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function question(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, resolve)
  })
}

async function main() {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║  🔧 MCP Proxy Configuration Tool                           ║
╠════════════════════════════════════════════════════════════╣
║  This tool will help you configure pricing for MCP tools   ║
╚════════════════════════════════════════════════════════════╝
`)

  // Step 1: Get upstream server URL
  const upstreamUrl = await question("\n📡 Enter the upstream MCP server URL: ")
  console.log(`\nConnecting to ${upstreamUrl}...`)

  // Step 2: Connect and fetch tools
  let client: Client
  let tools: any[]

  try {
    client = new Client(
      { name: "config-tool", version: "1.0.0" },
      { capabilities: {} }
    )

    const transport = new StreamableHTTPClientTransport(new URL(upstreamUrl))
    await client.connect(transport)

    console.log("✓ Connected successfully!")

    const toolsResponse = await client.listTools()
    tools = toolsResponse.tools

    console.log(`\n✓ Found ${tools.length} tools:`)
    tools.forEach((tool, idx) => {
      console.log(`  ${idx + 1}. ${tool.name} - ${tool.description}`)
    })

  } catch (error: any) {
    console.error(`\n✗ Failed to connect: ${error.message}`)
    rl.close()
    process.exit(1)
  }

  // Step 3: Configure each tool
  console.log(`\n\n📝 Configure pricing for each tool:\n`)

  const toolConfigs: ToolConfig[] = []

  for (const tool of tools) {
    console.log(`\n─── ${tool.name} ───`)
    console.log(`Description: ${tool.description}`)

    // Ask if tool should be enabled
    const enabledInput = await question("Enable this tool? (y/n) [y]: ")
    const enabled = enabledInput.toLowerCase() !== "n"

    if (!enabled) {
      toolConfigs.push({
        name: tool.name,
        description: tool.description,
        price: 0,
        enabled: false
      })
      console.log("⊗ Tool disabled")
      continue
    }

    // Ask for price
    const defaultPrice = 0.0001
    const priceInput = await question(`Price in USDC [default price ${defaultPrice}]: $`)
    const price = priceInput.trim() === "" ? defaultPrice : parseFloat(priceInput.trim());
    // const price = parseFloat(priceInput) || defaultPrice

    toolConfigs.push({
      name: tool.name,
      description: tool.description,
      price: price,
      enabled: true
    })

    if (price === 0) {
      console.log("✓ Configured as FREE tool")
    } else {
      console.log(`✓ Configured at $${price.toFixed(3)}`)
    }
  }

  // Step 4: Get proxy configuration
  console.log(`\n\n⚙️  Proxy Configuration:\n`)

  const proxyPortInput = await question("Proxy server port [3003]: ")
  const proxyPort = parseInt(proxyPortInput) || 3003

  const yourWallet = await question("Your wallet address: ")

  // Step 5: Create configuration
  const config: ServerConfig = {
    upstreamUrl,
    proxyPort,
    yourWallet,
    tools: toolConfigs
  }

  // Step 6: Save configuration
  const configPath = path.join(__dirname, "proxy-config.json")
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2))

  // Step 7: Display summary
  console.log(`\n
╔════════════════════════════════════════════════════════════╗
║  ✓ Configuration Complete!                                 ║
╠════════════════════════════════════════════════════════════╣
║  Config saved to: proxy-config.json                        ║
║                                                            ║
║  Summary:                                                  ║
║  • Upstream: ${upstreamUrl.slice(0, 44).padEnd(44)} ║
║  • Proxy Port: ${proxyPort.toString().padEnd(42)} ║
║  • Your Wallet: ${yourWallet.slice(0, 20).padEnd(38)}... ║
║  • Enabled Tools: ${toolConfigs.filter(t => t.enabled).length.toString().padEnd(39)} ║
║  • Paid Tools: ${toolConfigs.filter(t => t.enabled && t.price > 0).length.toString().padEnd(42)} ║
║  • Free Tools: ${toolConfigs.filter(t => t.enabled && t.price === 0).length.toString().padEnd(42)} ║
╚════════════════════════════════════════════════════════════╝
`)

  console.log("\n📋 Tool Pricing:\n")
  toolConfigs.forEach((tool) => {
    if (!tool.enabled) {
      console.log(`  ⊗ ${tool.name} - DISABLED`)
    } else if (tool.price === 0) {
      console.log(`  🆓 ${tool.name} - FREE`)
    } else {
      console.log(`  💰 ${tool.name} - $${tool.price.toFixed(3)}`)
    }
  })

  console.log(`\n\n🚀 Next steps:`)
  console.log(`  1. Review the configuration in src/proxy-config.json`)
  console.log(`  2. Run: npm run proxy-configured`)
  console.log(`  3. Your proxy will be available at http://localhost:${proxyPort}`)

  await client.close()
  rl.close()
}

main().catch((error) => {
  console.error("Error:", error)
  rl.close()
  process.exit(1)
})

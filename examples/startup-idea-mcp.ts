import { Client } from "@modelcontextprotocol/sdk/client/index.js"
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js"

async function testStartupIdeaMcp() {
  console.log("🔌 Connecting to startup-idea MCP server...")
  console.log("URL: https://startup-idea-mcp.x402.bot/mcp\n")

  const client = new Client(
    { name: "test-client", version: "1.0.0" },
    { capabilities: {} }
  )

  try {
    const transport = new StreamableHTTPClientTransport(
      new URL("https://mcp2.mcpay.tech/mcp?id=srv_2pffhvni")
    )

    await client.connect(transport)
    console.log("✅ Connected successfully!\n")

    // List available tools
    console.log("📋 Listing available tools...\n")
    const toolsResponse = await client.listTools()

    console.log(`Found ${toolsResponse.tools.length} tool(s):\n`)

    toolsResponse.tools.forEach((tool, index) => {
      console.log(`${index + 1}. ${tool.name}`)
      console.log(`   Description: ${tool.description}`)
      if (tool.inputSchema) {
        console.log(`   Input Schema:`, JSON.stringify(tool.inputSchema, null, 2))
      }
      console.log()
    })

    // Test calling the first tool if available
    if (toolsResponse.tools.length > 0) {
      const firstTool = toolsResponse.tools[0]
      console.log(`\n🧪 Testing tool: ${firstTool.name}`)

      try {
        // Call with empty arguments or minimal required args
        const result = await client.callTool({
          name: firstTool.name,
          arguments: {}
        })

        console.log("✅ Tool call successful!")
        console.log("Result:", JSON.stringify(result, null, 2))
      } catch (err: any) {
        console.log("⚠️  Tool call failed (might need specific arguments):", err.message)
      }
    }

    await client.close()
    console.log("\n✅ Test completed!")

  } catch (error: any) {
    console.error("❌ Error:", error.message)
    process.exit(1)
  }
}

testStartupIdeaMcp()

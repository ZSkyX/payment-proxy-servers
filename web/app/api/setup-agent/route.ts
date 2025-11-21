import { NextRequest, NextResponse } from 'next/server'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { mcpServerUrl, email, agentName, network } = body

    if (!mcpServerUrl || !email || !agentName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Step 1: Register agent with FluxA
    const registerResponse = await fetch('https://agentid.fluxapay.xyz/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        agent_name: agentName,
        client_info: 'n8n FluxA MCP Node',
      }),
    })

    const registerData = await registerResponse.json()

    if (!registerResponse.ok) {
      return NextResponse.json(
        { error: registerData.message || 'Failed to register agent' },
        { status: registerResponse.status }
      )
    }

    const agentId = registerData.agent_id
    const agentJwt = registerData.jwt

    // Step 2: Connect to MCP server and get tools
    const client = new Client(
      { name: 'n8n-fluxa-mcp-setup', version: '1.0.0' },
      { capabilities: {} }
    )

    const transport = new StreamableHTTPClientTransport(new URL(mcpServerUrl))
    await client.connect(transport)

    // List tools to get payment information
    const toolsResult = await client.listTools()

    // Calculate max amount and payTo address
    let maxAmount = 0
    let payToAddress = ''

    for (const tool of toolsResult.tools) {
      const annotations = (tool as any).annotations
      if (annotations?.paymentNetworks) {
        const paymentNetwork = annotations.paymentNetworks.find(
          (pn: any) => pn.network === network
        )

        if (paymentNetwork) {
          const toolAmount = parseInt(paymentNetwork.maxAmountRequired || '0')
          if (toolAmount > maxAmount) {
            maxAmount = toolAmount
            payToAddress = paymentNetwork.recipient
          }
        }
      }
    }

    await client.close()

    // Step 3: Build URLs
    const encodedName = encodeURIComponent(agentName)
    const encodedResourceUrl = encodeURIComponent(mcpServerUrl)

    const addAgentUrl = `https://agentwallet.fluxapay.xyz/add-agent?agentId=${agentId}&name=${encodedName}`

    let authorizePaymentUrl: string | undefined
    if (maxAmount > 0 && payToAddress) {
      authorizePaymentUrl = `https://agentwallet.fluxapay.xyz/authorize-payment?agentId=${agentId}&resourceUrl=${encodedResourceUrl}&amount=${maxAmount}&payTo=${payToAddress}`
    }

    return NextResponse.json({
      success: true,
      agentId,
      agentJwt,
      maxAmount,
      payToAddress,
      addAgentUrl,
      authorizePaymentUrl,
    })
  } catch (error: any) {
    console.error('Setup agent error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to set up agent' },
      { status: 500 }
    )
  }
}

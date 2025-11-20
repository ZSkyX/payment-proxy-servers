"use client"

import { useState, useEffect } from "react"
import { usePrivy } from "@privy-io/react-auth"
import { Loader2, CheckCircle2, ExternalLink, AlertCircle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AuthGate } from "@/components/providers/auth-gate"
import { Header } from "@/components/layout/header"
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'

interface SetupStep {
  id: string
  title: string
  description: string
  status: 'pending' | 'completed' | 'current'
  url?: string
}

export function AuthSetupPage() {
  const { user } = usePrivy()
  const [mcpServerUrl, setMcpServerUrl] = useState("")
  const [email, setEmail] = useState("")
  const [agentName, setAgentName] = useState("n8n - My Instance")
  const [network, setNetwork] = useState("base")

  // Auto-fill email from Privy user
  useEffect(() => {
    if (user?.email?.address) {
      setEmail(user.email.address)
    }
  }, [user])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [setupSteps, setSetupSteps] = useState<SetupStep[]>([])
  const [currentStep, setCurrentStep] = useState(0)

  const handleSetup = async () => {
    if (!mcpServerUrl || !email || !agentName) {
      setError("Please fill in all fields")
      return
    }

    setLoading(true)
    setError(null)

    try {
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
        throw new Error(registerData.message || 'Failed to register agent')
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

      // Step 3: Build setup steps with URLs
      const encodedName = encodeURIComponent(agentName)
      const encodedResourceUrl = encodeURIComponent(mcpServerUrl)

      const addAgentUrl = `https://agentwallet.fluxapay.xyz/add-agent?agentId=${agentId}&name=${encodedName}`

      const steps: SetupStep[] = [
        {
          id: 'authorize-agent',
          title: 'Authorize Agent',
          description: `Authorize "${agentName}" to use FluxA Wallet`,
          status: 'current',
          url: addAgentUrl,
        },
      ]

      // Only add payment authorization if we have payment info
      if (maxAmount > 0 && payToAddress) {
        const authorizePaymentUrl = `https://agentwallet.fluxapay.xyz/authorize-payment?agentId=${agentId}&resourceUrl=${encodedResourceUrl}&amount=${maxAmount}&payTo=${payToAddress}`

        steps.push({
          id: 'authorize-payment',
          title: 'Pre-approve Payments',
          description: `Pre-approve up to ${(maxAmount / 1_000_000).toFixed(6)} USDC for ${mcpServerUrl}`,
          status: 'pending',
          url: authorizePaymentUrl,
        })
      }

      steps.push({
        id: 'manage-wallet',
        title: 'Manage Wallet',
        description: 'View and manage all your payments',
        status: 'pending',
        url: 'https://agentwallet.fluxapay.xyz',
      })

      setSetupSteps(steps)
      setCurrentStep(0)
    } catch (err: any) {
      setError(err.message || 'Failed to set up agent')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenStep = (stepIndex: number) => {
    const step = setupSteps[stepIndex]
    if (step.url) {
      window.open(step.url, '_blank')

      // Mark current step as completed and move to next
      const updatedSteps = setupSteps.map((s, idx) => {
        if (idx === stepIndex) {
          return { ...s, status: 'completed' as const }
        } else if (idx === stepIndex + 1) {
          return { ...s, status: 'current' as const }
        }
        return s
      })

      setSetupSteps(updatedSteps)
      setCurrentStep(stepIndex + 1)
    }
  }

  const resetSetup = () => {
    setSetupSteps([])
    setCurrentStep(0)
    setError(null)
  }

  return (
    <AuthGate>
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <div className="flex-1">
          <div className="max-w-4xl mx-auto p-6 md:p-12">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-2">n8n FluxA Setup</h1>
            <p className="text-muted-foreground">
              Set up your n8n agent to use FluxA payment-enabled MCP servers
            </p>
          </div>

        {setupSteps.length === 0 ? (
          <Card className="border border-border shadow-lg">
            <CardHeader className="bg-muted/50 border-b border-border">
              <CardTitle className="text-2xl text-foreground">Agent Configuration</CardTitle>
              <CardDescription>
                Enter your MCP server details to begin the setup process
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="mcpServerUrl" className="text-sm font-medium text-foreground">
                    MCP Server URL
                  </Label>
                  <Input
                    id="mcpServerUrl"
                    type="url"
                    placeholder="https://fluxa-servers-connection.up.railway.app/mcp/your-config-id"
                    value={mcpServerUrl}
                    onChange={(e) => setMcpServerUrl(e.target.value)}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    The HTTP endpoint of your FluxA MCP server
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-foreground">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    disabled
                    className="w-full bg-muted/50"
                  />
                  <p className="text-xs text-muted-foreground">
                    Auto-filled from your account
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="agentName" className="text-sm font-medium text-foreground">
                    Agent Name
                  </Label>
                  <Input
                    id="agentName"
                    type="text"
                    placeholder="n8n - My Instance"
                    value={agentName}
                    onChange={(e) => setAgentName(e.target.value)}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    You can customize this name for your n8n instance
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="network" className="text-sm font-medium text-foreground">
                    Payment Network
                  </Label>
                  <select
                    id="network"
                    value={network}
                    onChange={(e) => setNetwork(e.target.value)}
                    className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="base">Base</option>
                    <option value="base-sepolia">Base Sepolia</option>
                    <option value="avalanche">Avalanche</option>
                    <option value="avalanche-fuji">Avalanche Fuji</option>
                    <option value="solana">Solana</option>
                    <option value="solana-devnet">Solana Devnet</option>
                  </select>
                  <p className="text-xs text-muted-foreground">
                    The blockchain network for payments
                  </p>
                </div>

                {error && (
                  <div className="flex items-start gap-2 p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <Button
                  onClick={handleSetup}
                  disabled={loading || !mcpServerUrl || !email || !agentName}
                  className="w-full h-11 text-base font-semibold bg-primary hover:bg-primary/90"
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {loading ? "Setting up..." : "Start Setup"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <Card className="border border-border shadow-lg">
              <CardHeader className="bg-muted/50 border-b border-border">
                <CardTitle className="text-2xl text-foreground">Setup Steps</CardTitle>
                <CardDescription>
                  Complete these steps to authorize your agent and set up payments
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {setupSteps.map((step, idx) => (
                    <div
                      key={step.id}
                      className={`p-4 rounded-lg border ${
                        step.status === 'completed'
                          ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800'
                          : step.status === 'current'
                          ? 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800'
                          : 'bg-muted/30 border-border'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {step.status === 'completed' && (
                              <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                            )}
                            <h3 className="font-semibold text-foreground">
                              {idx + 1}. {step.title}
                            </h3>
                          </div>
                          <p className="text-sm text-muted-foreground">{step.description}</p>
                        </div>
                        {step.status !== 'pending' && (
                          <Button
                            onClick={() => handleOpenStep(idx)}
                            disabled={step.status === 'completed'}
                            variant={step.status === 'current' ? 'default' : 'outline'}
                            className="flex items-center gap-2"
                          >
                            {step.status === 'completed' ? 'Completed' : 'Open'}
                            {step.status === 'current' && <ExternalLink className="w-4 h-4" />}
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 pt-6 border-t border-border">
                  <Button
                    onClick={resetSetup}
                    variant="outline"
                    className="w-full"
                  >
                    Start Over
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/20">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-foreground">
                      Important: Complete all steps in order
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Each step will open in a new tab. Complete the authorization in FluxA Wallet
                      before moving to the next step.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
          </div>
        </div>
      </div>
    </AuthGate>
  )
}

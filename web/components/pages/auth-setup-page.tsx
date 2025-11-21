"use client"

import { useState, useEffect } from "react"
import { usePrivy } from "@privy-io/react-auth"
import { Loader2, CheckCircle2, ExternalLink, AlertCircle, Copy, Check } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AuthGate } from "@/components/providers/auth-gate"
import { Header } from "@/components/layout/header"

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
  const [agentJwt, setAgentJwt] = useState<string>("")
  const [agentId, setAgentId] = useState<string>("")
  const [copiedJwt, setCopiedJwt] = useState(false)

  const handleSetup = async () => {
    if (!mcpServerUrl || !email || !agentName) {
      setError("Please fill in all fields")
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Call the API route to set up the agent
      const response = await fetch('/api/setup-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mcpServerUrl,
          email,
          agentName,
          network,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to set up agent')
      }

      const { addAgentUrl, authorizePaymentUrl, maxAmount, agentJwt: jwt, agentId: id } = data

      // Store JWT and agent ID
      setAgentJwt(jwt)
      setAgentId(id)

      // Build setup steps with URLs from API response
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
      if (authorizePaymentUrl) {
        steps.push({
          id: 'authorize-payment',
          title: 'Pre-approve Payments',
          description: `Pre-approve up to ${(maxAmount / 1_000_000).toFixed(6)} USDC for ${mcpServerUrl}`,
          status: 'pending',
          url: authorizePaymentUrl,
        })
      }

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
    setAgentJwt("")
    setAgentId("")
    setCopiedJwt(false)
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedJwt(true)
      setTimeout(() => setCopiedJwt(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-2">
                          {step.status === 'completed' && (
                            <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                          )}
                          <h3 className="font-semibold text-foreground">
                            {idx + 1}. {step.title}
                          </h3>
                        </div>
                        <p className="text-sm text-muted-foreground">{step.description}</p>
                        {step.status !== 'pending' && (
                          <Button
                            onClick={() => handleOpenStep(idx)}
                            disabled={step.status === 'completed'}
                            variant={step.status === 'current' ? 'default' : 'outline'}
                            className="flex items-center gap-2 w-full"
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

            {setupSteps.length > 0 && (
              <Card className="border border-border shadow-lg">
                <CardHeader className="bg-muted/50 border-b border-border">
                  <CardTitle className="text-2xl text-foreground">Registration Information</CardTitle>
                  <CardDescription>
                    Your agent details for n8n configuration
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                      <p className="text-base text-foreground font-mono bg-muted/50 p-3 rounded-md break-all">
                        {email}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">Agent Name</Label>
                      <p className="text-base text-foreground font-mono bg-muted/50 p-3 rounded-md break-all">
                        {agentName}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">MCP Server URL</Label>
                      <p className="text-base text-foreground font-mono bg-muted/50 p-3 rounded-md break-all">
                        {mcpServerUrl}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">Payment Network</Label>
                      <p className="text-base text-foreground font-mono bg-muted/50 p-3 rounded-md break-all">
                        {network}
                      </p>
                    </div>

                    <div className="border-t border-border pt-4 mt-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-medium text-foreground">Agent JWT Token</Label>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyToClipboard(agentJwt)}
                            className="flex items-center gap-2"
                          >
                            {copiedJwt ? (
                              <>
                                <Check className="w-4 h-4" />
                                Copied!
                              </>
                            ) : (
                              <>
                                <Copy className="w-4 h-4" />
                                Copy
                              </>
                            )}
                          </Button>
                        </div>
                        <p className="text-sm text-foreground font-mono bg-muted/50 p-3 rounded-md break-all border border-border">
                          {agentJwt}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Use this JWT token in your n8n FluxA API credentials
                        </p>
                      </div>

                      <div className="space-y-2 mt-4">
                        <Label className="text-sm font-medium text-muted-foreground">Agent ID</Label>
                        <p className="text-sm text-foreground font-mono bg-muted/50 p-3 rounded-md break-all">
                          {agentId}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
          </div>
        </div>
      </div>
    </AuthGate>
  )
}

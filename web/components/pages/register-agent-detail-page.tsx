"use client"

import { ArrowLeft, CheckCircle2, Loader2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { IntegrationConfigCard } from "@/components/shared/integration-config-card"
import { useAgentRegistration } from "@/hooks/useAgentRegistration"

/**
 * Example usage:
 *
 * <RegisterAgentDetailPage
 *   mcpServerUrl="http://localhost:3000/mcp"
 *   email="user@example.com"
 *   agentName="My Agent"
 *   onBack={() => navigate('/back')}
 *   onDone={() => navigate('/done')}
 * />
 */

interface RegisterAgentDetailPageProps {
  mcpServerUrl: string
  email: string
  agentName: string
  onBack: () => void
  onDone: () => void
}

export function RegisterAgentDetailPage({
  mcpServerUrl,
  email,
  agentName,
  onBack,
  onDone,
}: RegisterAgentDetailPageProps) {
  const { registerAgent, registering, error } = useAgentRegistration()
  const clientInfo = "Claude Code on macOS"

  const handleAuthorizeAgent = async () => {
    await registerAgent(email, agentName, clientInfo)
  }

  return (
    <main className="min-h-screen bg-background p-6 md:p-12">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={onBack} className="p-2 hover:bg-muted rounded-lg transition-colors" aria-label="Go back">
            <ArrowLeft className="w-6 h-6 text-foreground" />
          </button>
          <div>
            <h1 className="text-4xl font-bold text-foreground">Agent Registration</h1>
            <p className="text-muted-foreground mt-1">Configure your agent and integration settings</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <Card className="border border-border shadow-lg">
            <CardHeader className="bg-muted/50 border-b border-border">
              <CardTitle className="text-2xl text-foreground">Agent Information</CardTitle>
              <CardDescription>Your registered agent details</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-foreground">Monetized MCP Server URL</Label>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 p-3 bg-muted/50 rounded-lg border border-border text-sm text-foreground">
                      {mcpServerUrl}
                    </div>
                    <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0" />
                  </div>
                  <p className="text-xs text-muted-foreground">If Agent is unregistered and active</p>
                </div>

                {error && (
                  <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                    {error}
                  </div>
                )}

                <Button
                  onClick={handleAuthorizeAgent}
                  disabled={registering}
                  className="w-full h-11 text-base font-semibold bg-primary hover:bg-primary/90"
                >
                  {registering && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {registering ? "Registering..." : "Authorize Agent to use FluxA Wallet"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <IntegrationConfigCard
            serverUrl={mcpServerUrl}
            serverId="fluxa-connect"
            email={email}
            agentName={agentName}
          />
        </div>

        <Button onClick={onDone} className="w-full h-11 text-base font-semibold bg-primary hover:bg-primary/90 mt-8">
          Done
        </Button>
      </div>
    </main>
  )
}

"use client"

import { useState } from "react"
import { usePrivy } from "@privy-io/react-auth"
import { ChevronDown, Loader2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useAgentRegistration } from "@/hooks/useAgentRegistration"

interface IntegrationConfigCardProps {
  serverUrl: string
  serverId: string
  email?: string
  agentName?: string
  showRegisterButton?: boolean
}

const MCP_CLIENTS = ["Claude Code"]

export function IntegrationConfigCard({ serverUrl, serverId, email, agentName, showRegisterButton = false }: IntegrationConfigCardProps) {
  const { user, authenticated, login } = usePrivy()
  const { registerAgent, registering } = useAgentRegistration()
  const [selectedClient, setSelectedClient] = useState(MCP_CLIENTS[0])
  const [activeTab, setActiveTab] = useState("client")

  // Use provided email/agentName, or fall back to user data, or use placeholders
  const finalEmail = email || user?.email?.address || "<YOUR_EMAIL>"
  const finalAgentName = agentName || "Claude Code - agentwallet.fluxapay.xyz"
  const clientInfo = "Claude Code on macOS"

  const handleRegisterAgent = async () => {
    const result = await registerAgent(finalEmail, finalAgentName, clientInfo)

    if (!result.success && result.error) {
      alert(`Failed to register agent: ${result.error}`)
    }
  }

  const jsonConfig = JSON.stringify(
    {
      mcpServers: {
        [serverId]: {
          command: "npx",
          args: ["-y", "@fluxa-pay/fluxa-connect-mcp", "--url", serverUrl],
          env: {
            AGENT_EMAIL: finalEmail,
            AGENT_NAME: finalAgentName,
            CLIENT_INFO: clientInfo
          },
        },
      },
    },
    null,
    2,
  )

  const claudeCodeConfig = `claude mcp add-json ${serverId} '${JSON.stringify({
    command: "npx",
    args: ["-y", "@fluxa-pay/fluxa-connect-mcp", "--url", serverUrl],
    env: {
      AGENT_EMAIL: finalEmail,
      AGENT_NAME: finalAgentName,
      CLIENT_INFO: clientInfo
    },
  })}'`

  return (
    <Card className="border border-border shadow-lg">
      <CardHeader className="bg-muted/50 border-b border-border">
        <CardTitle className="text-2xl text-foreground">Integration</CardTitle>
        <CardDescription>Choose your integration method</CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="client">Client</TabsTrigger>
            <TabsTrigger value="json">JSON Config</TabsTrigger>
          </TabsList>

          <TabsContent value="client" className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Select MCP Client</label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-between h-12 text-base font-semibold bg-transparent"
                  >
                    {selectedClient}
                    <ChevronDown className="w-4 h-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56">
                  {MCP_CLIENTS.map((client) => (
                    <DropdownMenuItem key={client} onClick={() => setSelectedClient(client)}>
                      {client}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className={`p-6 bg-muted/50 rounded-lg border border-border min-h-[200px] max-h-[300px] overflow-auto ${!authenticated ? 'select-none' : ''}`}>
              <p className="text-sm font-mono text-foreground break-all leading-relaxed">{claudeCodeConfig}</p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 bg-transparent"
                onClick={() => {
                  if (!authenticated) {
                    login()
                    return
                  }
                  navigator.clipboard.writeText(claudeCodeConfig)
                }}
              >
                {authenticated ? "Copy Command" : "Sign In to Copy"}
              </Button>
              {showRegisterButton && (
                <Button
                  onClick={handleRegisterAgent}
                  disabled={registering}
                  className="flex-1 bg-primary hover:bg-primary/90"
                >
                  {registering && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {registering ? "Registering..." : "Register Agent"}
                </Button>
              )}
            </div>
          </TabsContent>

          <TabsContent value="json" className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Configuration JSON</label>
              <pre className={`p-6 bg-muted/50 rounded-lg border border-border overflow-auto min-h-[200px] max-h-[300px] text-sm ${!authenticated ? 'select-none' : ''}`}>
                <code className="text-foreground leading-relaxed">{jsonConfig}</code>
              </pre>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 bg-transparent"
                onClick={() => {
                  if (!authenticated) {
                    login()
                    return
                  }
                  navigator.clipboard.writeText(jsonConfig)
                }}
              >
                {authenticated ? "Copy Configuration" : "Sign In to Copy"}
              </Button>
              {showRegisterButton && (
                <Button
                  onClick={handleRegisterAgent}
                  disabled={registering}
                  className="flex-1 bg-primary hover:bg-primary/90"
                >
                  {registering && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {registering ? "Registering..." : "Register Agent"}
                </Button>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

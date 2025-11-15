"use client"

import { useState } from "react"
import { ArrowLeft, CheckCircle2, ChevronDown } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"

interface RegisterAgentDetailPageProps {
  mcpServerUrl: string
  email: string
  agentName: string
  onBack: () => void
  onDone: () => void
}

const MCP_CLIENTS = ["Claude Code"]

export function RegisterAgentDetailPage({
  mcpServerUrl,
  email,
  agentName,
  onBack,
  onDone,
}: RegisterAgentDetailPageProps) {
  const [selectedClient, setSelectedClient] = useState(MCP_CLIENTS[0])
  const [activeTab, setActiveTab] = useState("client")

  const jsonConfig = JSON.stringify(
    {
      mcpServers: {
        "fluxa-connect": {
          command: "npx",
          args: ["-y", "@fluxa-pay/fluxa-connect-mcp", "--url", mcpServerUrl],
          env: {
            AGENT_EMAIL: email,
            AGENT_NAME: agentName,
          },
        },
      },
    },
    null,
    2,
  )

  const claudeCodeConfig = `claude mcp add-json fluxa-connect '${JSON.stringify({
    command: "npx",
    args: ["-y", "@fluxa-pay/fluxa-connect-mcp", "--url", mcpServerUrl],
    env: {
      AGENT_EMAIL: email,
      AGENT_NAME: agentName,
      CLIENT_INFO: "Claude Code on macOS",
    },
  })}'`

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
                  <p className="text-xs text-muted-foreground">Agent is registered and active</p>
                </div>

                <Button className="w-full h-11 text-base font-semibold bg-primary hover:bg-primary/90">
                  Authorize Agent to use FluxA Wallet
                </Button>
              </div>
            </CardContent>
          </Card>

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
                  <div className="p-4 bg-muted/50 rounded-lg border border-border">
                    <p className="text-xs font-mono text-foreground break-all">{claudeCodeConfig}</p>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full bg-transparent"
                    onClick={() => {
                      navigator.clipboard.writeText(claudeCodeConfig)
                    }}
                  >
                    Copy Command
                  </Button>
                </TabsContent>

                <TabsContent value="json" className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Configuration JSON</label>
                    <pre className="p-4 bg-muted/50 rounded-lg border border-border overflow-auto max-h-96">
                      <code className="text-xs text-foreground">{jsonConfig}</code>
                    </pre>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full bg-transparent"
                    onClick={() => {
                      navigator.clipboard.writeText(jsonConfig)
                    }}
                  >
                    Copy Configuration
                  </Button>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        <Button onClick={onDone} className="w-full h-11 text-base font-semibold bg-primary hover:bg-primary/90 mt-8">
          Done
        </Button>
      </div>
    </main>
  )
}

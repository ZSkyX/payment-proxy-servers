"use client"

import { useState } from "react"
import { useRouter } from 'next/navigation'
import { ArrowLeft, ChevronDown } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface Tool {
  name: string
  description: string
  price: number
  enabled: boolean
}

interface MCPServer {
  id: string
  name: string
  upstreamUrl: string
  yourWallet: string
  tools: Tool[]
}

interface MCPServerDetailPageProps {
  server: MCPServer
}

const MCP_CLIENTS = ["Claude Code"]

export function MCPServerDetailPage({ server }: MCPServerDetailPageProps) {
  const router = useRouter()
  const [selectedClient, setSelectedClient] = useState(MCP_CLIENTS[0])
  const [activeTab, setActiveTab] = useState("client")

  const placeholderEmail = "<YOUR_AGENT_EMAIL>"
  const placeholderAgentName = "<YOUR_AGENT_NAME>"

  const jsonConfig = JSON.stringify(
    {
      mcpServers: {
        "fluxa-connect": {
          command: "npx",
          args: ["-y", "@fluxa-pay/fluxa-connect-mcp", "--url", server.upstreamUrl],
          env: {
            AGENT_EMAIL: placeholderEmail,
            AGENT_NAME: placeholderAgentName,
          },
        },
      },
    },
    null,
    2,
  )

  const claudeCodeConfig = `claude mcp add-json fluxa-connect '${JSON.stringify({
    command: "npx",
    args: ["-y", "@fluxa-pay/fluxa-connect-mcp@latest", "--url", server.upstreamUrl],
    env: {
      AGENT_EMAIL: placeholderEmail,
      AGENT_NAME: placeholderAgentName,
      CLIENT_INFO: "Claude Code on macOS",
    },
  })}'`

  return (
    <main className="min-h-screen bg-background p-6 md:p-12">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => router.back()} className="p-2 hover:bg-muted rounded-lg transition-colors" aria-label="Go back">
            <ArrowLeft className="w-6 h-6 text-foreground" />
          </button>
          <div>
            <h1 className="text-4xl font-bold text-foreground">{server.name}</h1>
            <p className="text-sm text-muted-foreground mt-1 break-all">{server.upstreamUrl}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <Card className="border border-border shadow-lg">
            <CardHeader className="bg-muted/50 border-b border-border">
              <CardTitle className="text-2xl text-foreground">Tools</CardTitle>
              <CardDescription>{server.tools.length} tools available</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {server.tools.map((tool, index) => (
                  <div key={index} className="p-3 rounded-lg bg-muted/50 border border-border">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="font-medium text-sm text-foreground">{tool.name}</span>
                      <Badge variant={tool.enabled ? "default" : "secondary"}>
                        {tool.enabled ? "Enabled" : "Disabled"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{tool.description}</p>
                    <p className="text-xs font-semibold text-foreground">
                      {tool.enabled ? `$${tool.price.toFixed(4)} USDC` : "N/A"}
                    </p>
                  </div>
                ))}
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
                  <div className="p-4 bg-muted/50 rounded-lg border border-border max-h-40 overflow-auto">
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
                    <pre className="p-4 bg-muted/50 rounded-lg border border-border overflow-auto max-h-40 text-xs">
                      <code className="text-foreground">{jsonConfig}</code>
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
      </div>
    </main>
  )
}

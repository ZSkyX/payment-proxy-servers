"use client"

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { IntegrationConfigCard } from "@/components/shared/integration-config-card"

interface Tool {
  name: string
  description: string
  price: number
  enabled: boolean
}

interface MCPServer {
  id: string
  name: string
  description: string
  tools: Tool[]
  proxyUrl: string
}

interface MCPServerDetailPageProps {
  server: MCPServer
}

export function MCPServerDetailPage({ server }: MCPServerDetailPageProps) {
  const router = useRouter()

  return (
    <main className="min-h-screen bg-background p-6 md:p-12">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => router.back()} className="p-2 hover:bg-muted rounded-lg transition-colors" aria-label="Go back">
            <ArrowLeft className="w-6 h-6 text-foreground" />
          </button>
          <div>
            <h1 className="text-4xl font-bold text-foreground">{server.name}</h1>
            <p className="text-sm text-muted-foreground mt-2">{server.description}</p>
            <p className="text-xs text-muted-foreground mt-1 font-mono break-all">{server.proxyUrl}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <Card className="border border-border shadow-lg">
            <CardHeader className="bg-muted/50 border-b border-border">
              <CardTitle className="text-2xl text-foreground">Tools</CardTitle>
              <CardDescription>{server.tools.length} tools available</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4 max-h-[600px] overflow-y-auto">
                {server.tools.map((tool, index) => (
                  <div key={index} className="p-4 rounded-lg bg-muted/50 border border-border">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <span className="font-medium text-base text-foreground">{tool.name}</span>
                      <Badge variant={tool.enabled ? "default" : "secondary"}>
                        {tool.enabled ? "Enabled" : "Disabled"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3 leading-relaxed">{tool.description}</p>
                    <p className="text-sm font-semibold text-foreground">
                      {tool.enabled ? `$${tool.price.toFixed(4)} USDC` : "N/A"}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <IntegrationConfigCard
            serverUrl={server.proxyUrl}
            serverId={server.id}
            showRegisterButton={true}
          />
        </div>
      </div>
    </main>
  )
}

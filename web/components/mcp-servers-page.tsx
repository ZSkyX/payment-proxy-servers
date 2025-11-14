"use client"

import { useState, useEffect } from "react"
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

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

export function MCPServersPage() {
  const router = useRouter()
  const [servers, setServers] = useState<MCPServer[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // In production, fetch from API or configs-db
    // For now, we'll use mock data
    try {
      const mockServers: MCPServer[] = []
      setServers(mockServers)
    } catch (error) {
      console.error("Failed to load MCP servers:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  const handleSelectServer = (serverId: string) => {
    router.push(`/mcp-servers/${serverId}`)
  }

  if (loading) {
    return <div className="p-6">Loading MCP servers...</div>
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">MCP Servers</h1>
          <p className="text-muted-foreground">Your configured MCP servers</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {servers.map((server) => (
          <Card
            key={server.id}
            className="hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => handleSelectServer(server.id)}
          >
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{server.name}</span>
                <Badge variant="outline">{server.tools.length} tools</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-xs text-muted-foreground">Click to view tools and integration</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {servers.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No MCP servers configured yet</p>
          <p className="text-sm text-muted-foreground mt-2">
            Go to the Monetize page to configure your first MCP server
          </p>
        </div>
      )}
    </div>
  )
}

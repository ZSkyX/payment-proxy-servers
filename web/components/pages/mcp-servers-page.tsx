"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'

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
}

export function MCPServersPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [servers, setServers] = useState<MCPServer[]>([])
  const [loading, setLoading] = useState(true)
  const [serverType, setServerType] = useState<"mcp" | "api">("mcp")

  // Read query parameter on mount
  useEffect(() => {
    const type = searchParams.get('type')
    if (type === 'api' || type === 'mcp') {
      setServerType(type)
    }
  }, [searchParams])

  const fetchServers = async () => {
    setLoading(true)
    try {
      // Fetch all public MCP servers (no auth required)
      const response = await fetch('/api/configs')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load MCP servers')
      }

      setServers(data.configs || [])
    } catch (error) {
      console.error("Failed to load MCP servers:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchServers()
  }, [])

  const handleSelectServer = (serverId: string) => {
    router.push(`/browse-servers/${serverId}`)
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-3">Browse Servers</h1>
        <div className="flex items-center gap-3 mb-2">
          <div className="flex items-center gap-2 bg-muted rounded-lg p-1">
            <button
              type="button"
              onClick={() => setServerType("mcp")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                serverType === "mcp"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              MCP
            
            </button>
            <button
              type="button"
              onClick={() => setServerType("api")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                serverType === "api"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              API
            </button>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={fetchServers}
            disabled={loading}
            className="h-10 w-10"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        <p className="text-muted-foreground">
          {serverType === "mcp" ? "Discover and integrate MCP servers" : "Explore available API servers"}
        </p>
      </div>

      {serverType === "api" ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground text-lg mb-2">API Server Browsing Coming Soon</p>
          <p className="text-sm text-muted-foreground">
            We're working on bringing API server discovery to the platform
          </p>
        </div>
      ) : loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <Card key={index} className="border border-border">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Skeleton width={150} height={24} />
                  <Skeleton width={70} height={20} borderRadius={20} />
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <Skeleton width="100%" height={16} count={2} />
                <div className="pt-2">
                  <Skeleton width="80%" height={12} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <>
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
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {server.description || "No description available"}
                  </p>
                  <p className="text-xs text-muted-foreground pt-2">Click to view tools and integration</p>
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
        </>
      )}
    </div>
  )
}

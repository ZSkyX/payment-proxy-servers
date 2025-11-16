"use client"

import { useState, useEffect } from "react"
import { useRouter } from 'next/navigation'
import { usePrivy } from "@privy-io/react-auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Trash2, Loader2 } from "lucide-react"

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

export function MyMonetizationPage() {
  const router = useRouter()
  const { user, authenticated, login } = usePrivy()
  const [servers, setServers] = useState<MCPServer[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    const fetchMyServers = async () => {
      if (!user?.id) {
        setLoading(false)
        return
      }

      try {
        // Fetch only user's own servers
        const response = await fetch('/api/my-configs', {
          headers: {
            "Authorization": `Bearer ${user.id}`,
          },
        })
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to load your MCP servers')
        }

        setServers(data.configs || [])
      } catch (error) {
        console.error("Failed to load your MCP servers:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchMyServers()
  }, [user?.id])

  const handleSelectServer = (serverId: string) => {
    router.push(`/browse-servers/${serverId}`)
  }

  const handleDeleteServer = async (serverId: string) => {
    if (!user?.id) return

    setDeletingId(serverId)

    try {
      const response = await fetch(`/api/configs/${serverId}/delete`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${user.id}`,
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete server")
      }

      // Remove the deleted server from the local state
      setServers((prev) => prev.filter((s) => s.id !== serverId))
    } catch (error: any) {
      console.error("Failed to delete server:", error)
      alert(`Failed to delete server: ${error.message}`)
    } finally {
      setDeletingId(null)
    }
  }

  if (loading) {
    return <div className="p-6">Loading your monetized servers...</div>
  }

  // Show sign-in prompt if not authenticated
  if (!authenticated) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">My Monetization</h1>
            <p className="text-muted-foreground">Your monetized MCP servers</p>
          </div>
        </div>
        <Card className="max-w-md mx-auto mt-12">
          <CardHeader>
            <CardTitle>Sign In Required</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Please sign in to view your monetized servers
            </p>
            <Button onClick={login} className="w-full">
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">My Monetization</h1>
          <p className="text-muted-foreground">Your monetized MCP servers</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {servers.map((server) => (
          <Card
            key={server.id}
            className="hover:shadow-lg transition-shadow cursor-pointer relative"
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
              <div className="flex items-center justify-between pt-2">
                <p className="text-xs text-muted-foreground">Click to view tools and integration</p>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      disabled={deletingId === server.id}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {deletingId === server.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Server Configuration?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete "{server.name}"? This action cannot be undone.
                        All tools and settings for this server will be permanently removed.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDeleteServer(server.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {servers.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">You haven't monetized any MCP servers yet</p>
          <p className="text-sm text-muted-foreground mt-2">
            Go to the Monetize page to configure your first MCP server
          </p>
          <Button
            onClick={() => router.push('/')}
            className="mt-4"
          >
            Monetize MCP Server
          </Button>
        </div>
      )}
    </div>
  )
}

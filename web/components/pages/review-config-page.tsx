"use client"

import { useState } from "react"
import { usePrivy } from "@privy-io/react-auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeftIcon, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface Tool {
  id: string | number
  name: string
  description: string
  price: number
  enabled: boolean
}

interface ReviewConfigPageProps {
  mcpUrl: string
  walletAddress: string
  totalTools: number
  enabledTools: number
  tools: Tool[]
  serverName: string
  serverDescription: string
  onDone: () => void
}

export function ReviewConfigPage({
  mcpUrl,
  walletAddress,
  totalTools,
  enabledTools,
  tools = [],
  serverName,
  serverDescription,
  onDone,
}: ReviewConfigPageProps) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const { user } = usePrivy()

  const handleSave = async () => {
    setSaving(true)
    setError("")

    try {
      if (!user?.id) {
        throw new Error("User not authenticated")
      }

      // Prepare config matching the old frontend format
      const config = {
        upstreamUrl: mcpUrl,
        serverName: serverName,
        serverDescription: serverDescription,
        yourWallet: walletAddress,
        tools: tools.map(tool => ({
          name: tool.name,
          description: tool.description,
          enabled: tool.enabled,
          price: tool.price,
        })),
      }

      const response = await fetch("/api/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${user.id}`,
        },
        body: JSON.stringify(config),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to save configuration")
      }

      // Configuration saved successfully - return to main page
      onDone()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="min-h-screen bg-background p-6 md:p-12">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onDone}
            className="rounded-full hover:bg-muted"
            aria-label="Go back"
          >
            <ArrowLeftIcon className="h-6 w-6" />
          </Button>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">Review Configuration</h1>
            <p className="text-muted-foreground mt-1">Verify your monetization settings</p>
          </div>
        </div>

        <Card className="border border-border shadow-lg mb-8">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-foreground">Server Description</CardTitle>
            <CardDescription>How users will see your server</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-foreground bg-muted/50 p-3 rounded-md whitespace-pre-wrap">{serverDescription}</p>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Card className="border border-border shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-foreground">MCP URL</CardTitle>
              <CardDescription>Your Model Context Protocol endpoint</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-mono break-all text-foreground bg-muted/50 p-3 rounded-md">{mcpUrl}</p>
            </CardContent>
          </Card>

          <Card className="border border-border shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-foreground">Wallet Address</CardTitle>
              <CardDescription>Your FluxA wallet for earnings</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-mono break-all text-foreground bg-muted/50 p-3 rounded-md">
                {walletAddress || "Not connected"}
              </p>
            </CardContent>
          </Card>

          <Card className="border border-border shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-foreground">Total Tools</CardTitle>
              <CardDescription>Number of available tools</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <span className="text-3xl font-bold text-primary">{totalTools}</span>
                <Badge variant="secondary">tools</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-foreground">Enabled Tools</CardTitle>
              <CardDescription>Tools available for monetization</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <span className="text-3xl font-bold text-primary">{enabledTools}</span>
                <Badge variant="default">active</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border border-border shadow-lg mb-8">
          <CardHeader>
            <CardTitle className="text-lg text-foreground">Tool Pricing</CardTitle>
            <CardDescription>Configured pricing for each tool</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(tools || []).length > 0 ? (
                (tools || []).map((tool) => (
                  <div
                    key={tool.id}
                    className="flex items-start justify-between p-4 bg-muted/50 rounded-lg border border-border"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-foreground">{tool.name}</h3>
                        {!tool.enabled && <Badge variant="secondary">Disabled</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground">{tool.description}</p>
                    </div>
                    <div className="ml-4 text-right">
                      {tool.enabled ? (
                        <Badge variant={tool.price < 0.0001 ? "destructive" : "default"}>
                          ${tool.price.toFixed(5)} USDC
                        </Badge>
                      ) : (
                        <Badge variant="outline">N/A</Badge>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No tools available</p>
              )}
            </div>
          </CardContent>
        </Card>

        {error && (
          <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md mb-4">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onDone}
            size="lg"
            className="flex-1"
          >
            Back
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            size="lg"
            className="flex-1 h-12 px-6 text-base font-semibold bg-primary hover:bg-primary/90"
          >
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {saving ? "Saving..." : "Save Configuration"}
          </Button>
        </div>
      </div>
    </main>
  )
}

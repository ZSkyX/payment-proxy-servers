"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { usePrivy } from "@privy-io/react-auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Loader2, AlertCircle } from "lucide-react"
import { MonetizeDetailPage } from "@/components/pages/monetize-detail-page"
import { ReviewConfigPage } from "@/components/pages/review-config-page"

interface ReviewConfig {
  mcpUrl: string
  walletAddress: string
  totalTools: number
  enabledTools: number
  tools: Tool[]
  serverName: string
  serverDescription: string
}

interface Tool {
  id: number
  name: string
  description: string
  enabled: boolean
  price: number
}

export function MCPFormsPage() {
  const { user, authenticated, login } = usePrivy()
  const [monetizeType, setMonetizeType] = useState<"mcp" | "api">("mcp")
  const [monetizeUrl, setMonetizeUrl] = useState("")
  const [selectedMonetizeUrl, setSelectedMonetizeUrl] = useState<string | null>(null)
  const [reviewConfig, setReviewConfig] = useState<ReviewConfig | null>(null)

  // Loading and error states for monetization validation
  const [validatingMonetize, setValidatingMonetize] = useState(false)
  const [monetizeError, setMonetizeError] = useState("")

  const handleMonetizeSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Check authentication first
    if (!authenticated) {
      setMonetizeError("Please sign in to monetize your MCP server")
      login()
      return
    }

    setValidatingMonetize(true)
    setMonetizeError("")

    try {
      // Validate the MCP URL by trying to connect
      const response = await fetch("/api/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ upstreamUrl: monetizeUrl }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to connect to MCP server")
      }

      // If validation succeeds, navigate to detail page
      setSelectedMonetizeUrl(monetizeUrl)
      setMonetizeUrl("")
    } catch (err: any) {
      setMonetizeError(err.message)
    } finally {
      setValidatingMonetize(false)
    }
  }

  const handleNavigateToReview = (config: ReviewConfig) => {
    setReviewConfig(config)
  }

  const handleReviewDone = () => {
    setReviewConfig(null)
    setSelectedMonetizeUrl(null)
  }

  if (reviewConfig) {
    return (
      <ReviewConfigPage
        mcpUrl={reviewConfig.mcpUrl}
        walletAddress={reviewConfig.walletAddress}
        totalTools={reviewConfig.totalTools}
        enabledTools={reviewConfig.enabledTools}
        tools={reviewConfig.tools}
        serverName={reviewConfig.serverName}
        serverDescription={reviewConfig.serverDescription}
        onDone={handleReviewDone}
      />
    )
  }

  if (selectedMonetizeUrl) {
    return (
      <MonetizeDetailPage
        url={selectedMonetizeUrl}
        onBack={() => setSelectedMonetizeUrl(null)}
        onNavigateToReview={handleNavigateToReview}
      />
    )
  }

  // useEffect(() => {
  //   if (user?.email?.address){
  //     setEmail(user.email.address)
  //   }
  // }, [user?.email?.address])

  return (
    <main className="min-h-screen bg-background p-6 md:p-12">
      <div className="max-w-6xl mx-auto">
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-2">Monetize You Servers with x402</h1>
          <p className="text-lg text-muted-foreground">Configure your Server and monetization settings</p>
        </div>

        <div className="max-w-2xl mx-auto">
          <Card className="border border-border shadow-lg">
            <CardHeader className="bg-muted/50 border-b border-border">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl text-foreground">Monetize</CardTitle>
                  <CardDescription>
                    {monetizeType === "mcp" ? "Add your MCP URL to start earning" : "Add your API URL to start earning"}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2 bg-muted rounded-lg p-1">
                  <button
                    type="button"
                    onClick={() => setMonetizeType("mcp")}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      monetizeType === "mcp"
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    MCP
                  </button>
                  <button
                    type="button"
                    onClick={() => setMonetizeType("api")}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      monetizeType === "api"
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    API
                  </button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {monetizeType === "api" ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground text-lg mb-2">API Monetization Coming Soon</p>
                  <p className="text-sm text-muted-foreground">
                    We're working on bringing API monetization to the platform
                  </p>
                </div>
              ) : (
                <form onSubmit={handleMonetizeSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="monetize-url" className="text-base font-medium text-foreground">
                      MCP Server URL
                    </Label>
                  <div className="relative">
                    <Input
                      id="monetize-url"
                      type="url"
                      placeholder="https://example.com/mcp"
                      value={monetizeUrl}
                      onChange={(e) => {
                        setMonetizeUrl(e.target.value)
                        setMonetizeError("") // Clear error on change
                      }}
                      className="h-12 text-base pr-12"
                      required
                      disabled={validatingMonetize}
                    />
                    {validatingMonetize && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">Enter the full URL of your MCP endpoint</p>
                  {monetizeError && (
                    <div className="flex items-start gap-2 p-3 text-sm text-destructive bg-destructive/10 rounded-md border border-destructive/20">
                      <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span>{monetizeError}</span>
                    </div>
                  )}
                </div>
                <Button
                  type="submit"
                  className="w-full h-11 text-base font-semibold bg-primary hover:bg-primary/90"
                  disabled={validatingMonetize}
                >
                  {validatingMonetize && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {validatingMonetize ? "Validating..." : "Add Monetize URL"}
                </Button>
              </form>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="mt-12 p-6 bg-muted/30 border border-border rounded-lg">
          <h3 className="text-lg font-semibold text-foreground mb-2">Why Monetize Your Servers?</h3>
          <p className="text-muted-foreground">
            Turn your servers into a revenue stream. 
            Set custom pricing for each tool, track usage in real-time, and earn automatically through FluxA Pay. 
            Start monetizing today and get paid every time your tools are used.
          </p>
        </div>
      </div>
    </main>
  )
}

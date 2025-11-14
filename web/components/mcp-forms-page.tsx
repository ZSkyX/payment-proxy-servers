"use client"

import type React from "react"
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { MonetizeDetailPage } from "./monetize-detail-page"
import { ReviewConfigPage } from "./review-config-page"
import { RegisterAgentDetailPage } from "./register-agent-detail-page"

interface ReviewConfig {
  mcpUrl: string
  walletAddress: string
  totalTools: number
  enabledTools: number
  tools: Tool[]
}

interface RegisteredAgent {
  mcpServerUrl: string
  email: string
  agentName: string
}

interface Tool {
  id: number
  name: string
  description: string
  enabled: boolean
  price: number
}

export function MCPFormsPage() {
  const [monetizeUrl, setMonetizeUrl] = useState("")
  const [email, setEmail] = useState("")
  const [agentName, setAgentName] = useState("")
  const [registerMcpUrl, setRegisterMcpUrl] = useState("")
  const [selectedMonetizeUrl, setSelectedMonetizeUrl] = useState<string | null>(null)
  const [reviewConfig, setReviewConfig] = useState<ReviewConfig | null>(null)
  const [registeredAgent, setRegisteredAgent] = useState<RegisteredAgent | null>(null)

  const handleMonetizeSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSelectedMonetizeUrl(monetizeUrl)
    setMonetizeUrl("")
  }

  const handleConnectSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setRegisteredAgent({
      mcpServerUrl: registerMcpUrl,
      email,
      agentName,
    })
    setRegisterMcpUrl("")
    setEmail("")
    setAgentName("")
  }

  const handleNavigateToReview = (config: ReviewConfig) => {
    setReviewConfig(config)
  }

  const handleReviewDone = () => {
    setReviewConfig(null)
    setSelectedMonetizeUrl(null)
  }

  const handleRegisteredAgentDone = () => {
    setRegisteredAgent(null)
  }

  if (registeredAgent) {
    return (
      <RegisterAgentDetailPage
        mcpServerUrl={registeredAgent.mcpServerUrl}
        email={registeredAgent.email}
        agentName={registeredAgent.agentName}
        onBack={() => setRegisteredAgent(null)}
        onDone={handleRegisteredAgentDone}
      />
    )
  }

  if (reviewConfig) {
    return (
      <ReviewConfigPage
        mcpUrl={reviewConfig.mcpUrl}
        walletAddress={reviewConfig.walletAddress}
        totalTools={reviewConfig.totalTools}
        enabledTools={reviewConfig.enabledTools}
        tools={reviewConfig.tools}
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

  return (
    <main className="min-h-screen bg-background p-6 md:p-12">
      <div className="max-w-6xl mx-auto">
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-2">Model Context Protocol Setup</h1>
          <p className="text-lg text-muted-foreground">Configure your MCP integration and monetization settings</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="border border-border shadow-lg">
            <CardHeader className="bg-muted/50 border-b border-border">
              <CardTitle className="text-2xl text-foreground">Monetize MCP</CardTitle>
              <CardDescription>Add your MCP URL to start earning</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleMonetizeSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="monetize-url" className="text-base font-medium text-foreground">
                    Monetize MCP URL
                  </Label>
                  <Input
                    id="monetize-url"
                    type="url"
                    placeholder="https://example.com/mcp"
                    value={monetizeUrl}
                    onChange={(e) => setMonetizeUrl(e.target.value)}
                    className="h-12 text-base"
                    required
                  />
                  <p className="text-sm text-muted-foreground">Enter the full URL of your MCP endpoint</p>
                </div>
                <Button type="submit" className="w-full h-11 text-base font-semibold bg-primary hover:bg-primary/90">
                  Add Monetize URL
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="border border-border shadow-lg">
            <CardHeader className="bg-muted/50 border-b border-border">
              <CardTitle className="text-2xl text-foreground">Register Agent to Use MCP</CardTitle>
              <CardDescription>Register a new agent to a monetized MCP server</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleConnectSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="register-mcp-url" className="text-base font-medium text-foreground">
                    Monetized MCP Server URL
                  </Label>
                  <Input
                    id="register-mcp-url"
                    type="url"
                    placeholder="https://example.com/mcp"
                    value={registerMcpUrl}
                    onChange={(e) => setRegisterMcpUrl(e.target.value)}
                    className="h-12 text-base"
                    required
                  />
                  <p className="text-sm text-muted-foreground">The URL of the MCP server to register with</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-base font-medium text-foreground">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 text-base"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="agent-name" className="text-base font-medium text-foreground">
                    Agent Name
                  </Label>
                  <Input
                    id="agent-name"
                    type="text"
                    placeholder="My AI Agent"
                    value={agentName}
                    onChange={(e) => setAgentName(e.target.value)}
                    className="h-12 text-base"
                    required
                  />
                  <p className="text-sm text-muted-foreground">A unique identifier for your agent</p>
                </div>
                <Button type="submit" className="w-full h-11 text-base font-semibold bg-primary hover:bg-primary/90">
                  Register Agent
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="mt-12 p-6 bg-muted/30 border border-border rounded-lg">
          <h3 className="text-lg font-semibold text-foreground mb-2">What is Model Context Protocol?</h3>
          <p className="text-muted-foreground">
            The Model Context Protocol (MCP) enables seamless integration between your AI agents and external tools.
            Configure monetization to earn from your MCP endpoint, or connect a new agent to start using MCPs.
          </p>
        </div>
      </div>
    </main>
  )
}

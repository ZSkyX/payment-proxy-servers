"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { ArrowLeftIcon, WalletIcon, BookIcon as ToolIcon } from "lucide-react"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { usePrivy, useWallets } from "@privy-io/react-auth"

interface Tool {
  id: number
  name: string
  description: string
  enabled: boolean
  price: number
}

interface MonetizeDetailPageProps {
  url: string
  onBack: () => void
  onNavigateToReview?: (config: {
    mcpUrl: string
    walletAddress: string
    totalTools: number
    enabledTools: number
    tools: Tool[]
  }) => void
}

// Mock tools data - in production, fetch from MCP server
const MOCK_TOOLS: Tool[] = [
  {
    id: 1,
    name: "Web Search",
    description: "Search the web for information",
    enabled: true,
    price: 0.001,
  },
  {
    id: 2,
    name: "Data Analysis",
    description: "Analyze and process data",
    enabled: true,
    price: 0.005,
  },
  {
    id: 3,
    name: "File Processing",
    description: "Process and convert files",
    enabled: false,
    price: 0,
  },
  {
    id: 4,
    name: "API Integration",
    description: "Integrate with external APIs",
    enabled: true,
    price: 0.002,
  },
]

export function MonetizeDetailPage({ url, onBack, onNavigateToReview }: MonetizeDetailPageProps) {
  const { ready, authenticated, login } = usePrivy()
  const { wallets } = useWallets()
  const [walletAddress, setWalletAddress] = useState("")
  const [tools, setTools] = useState<Tool[]>(MOCK_TOOLS)

  // Auto-fill wallet address when user connects
  useEffect(() => {
    if (authenticated && wallets.length > 0) {
      const primaryWallet = wallets[0]
      setWalletAddress(primaryWallet.address)
    }
  }, [authenticated, wallets])

  const handleToolChange = (index: number, updatedTool: Tool) => {
    const newTools = [...tools]
    newTools[index] = updatedTool
    setTools(newTools)
  }

  const handleReviewConfig = () => {
    const enabledToolsCount = tools.filter((t) => t.enabled).length
    onNavigateToReview?.({
      mcpUrl: url,
      walletAddress,
      totalTools: tools.length,
      enabledTools: enabledToolsCount,
      tools: tools,
    })
  }

  return (
    <main className="min-h-screen bg-background p-6 md:p-12">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="rounded-full hover:bg-muted"
            aria-label="Go back"
          >
            <ArrowLeftIcon className="h-6 w-6" />
          </Button>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">Configure Monetization</h1>
            <p className="text-muted-foreground mt-1">MCP URL: {url}</p>
          </div>
        </div>

        <Card className="mb-8 border border-border shadow-lg">
          <CardHeader className="bg-muted/50 border-b border-border">
            <div className="flex items-center gap-2">
              <WalletIcon className="h-5 w-5 text-primary" />
              <div>
                <CardTitle className="text-2xl text-foreground">Wallet Connection</CardTitle>
                <CardDescription>Connect your wallet to receive earnings</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="wallet-address" className="text-base font-medium text-foreground">
                  Wallet Address
                </Label>
                <Input
                  id="wallet-address"
                  type="text"
                  placeholder="0x1234567890123456789012345678901234567890"
                  value={walletAddress}
                  onChange={(e) => setWalletAddress(e.target.value)}
                  className="h-12 text-base font-mono"
                  disabled={authenticated && wallets.length > 0}
                />
                <p className="text-sm text-muted-foreground">
                  {authenticated ? "Connected via Privy" : "Enter your FluxA wallet address or connect via Privy"}
                </p>
              </div>
              {!authenticated && (
                <Button
                  onClick={login}
                  disabled={!ready}
                  className="h-12 px-6 text-base font-semibold bg-primary hover:bg-primary/90 w-full"
                >
                  Connect Privy Wallet
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <div>
          <div className="flex items-center gap-2 mb-6">
            <ToolIcon className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold text-foreground">Configure Tools</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tools.map((tool, index) => (
              <Card
                key={tool.id}
                className={`border transition-all ${
                  tool.enabled ? "border-primary/50 bg-muted/30" : "border-border opacity-60"
                }`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <CardTitle className="text-lg text-foreground">{tool.name}</CardTitle>
                      <CardDescription className="text-sm mt-1">{tool.description}</CardDescription>
                    </div>
                    <Slider
                      value={[tool.enabled ? 1 : 0]}
                      onValueChange={(value) => {
                        handleToolChange(index, {
                          ...tool,
                          enabled: value[0] === 1,
                        })
                      }}
                      min={0}
                      max={1}
                      step={1}
                      className="w-12"
                    />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor={`price-${tool.id}`} className="text-sm font-medium">
                      Price (USDC)
                    </Label>
                    <Input
                      id={`price-${tool.id}`}
                      type="number"
                      step="0.0001"
                      min="0"
                      value={tool.price}
                      onChange={(e) => {
                        const price = Number.parseFloat(e.target.value) || 0
                        handleToolChange(index, {
                          ...tool,
                          price: price,
                        })
                      }}
                      disabled={!tool.enabled}
                      className="font-mono text-sm"
                    />
                    <p className="text-xs text-muted-foreground">Minimum price: $0.0001</p>
                  </div>
                  <Badge variant={tool.price < 0.0001 && tool.enabled ? "destructive" : "default"}>
                    {tool.price < 0.0001 && tool.enabled ? "INVALID" : `$${tool.price.toFixed(5)}`}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>

          <p className="text-sm text-muted-foreground mt-6">
            Set prices in USDC for each tool. Disabled tools won't be charged. Prices below $0.0001 are invalid.
          </p>
        </div>

        <div className="mt-8 flex gap-3">
          <Button
            variant="outline"
            onClick={onBack}
            size="lg"
            className="h-12 px-6 text-base font-semibold bg-transparent"
          >
            Back
          </Button>
          <Button
            onClick={handleReviewConfig}
            disabled={!walletAddress}
            size="lg"
            className="flex-1 h-12 px-6 text-base font-semibold bg-primary hover:bg-primary/90"
          >
            Review Configuration
          </Button>
        </div>
      </div>
    </main>
  )
}

"use client";

import { useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ToolConfig } from "@/lib/types";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { Wallet } from "lucide-react";

interface ConfigureStepProps {
  tools: ToolConfig[];
  yourWallet: string;
  apiKey: string;
  onToolChange: (index: number, tool: ToolConfig) => void;
  onWalletChange: (wallet: string) => void;
  onApiKeyChange: (apiKey: string) => void;
  onNext: () => void;
}

export function ConfigureStep({
  tools,
  yourWallet,
  apiKey,
  onToolChange,
  onWalletChange,
  onApiKeyChange,
  onNext,
}: ConfigureStepProps) {
  const { ready, login, logout, authenticated } = usePrivy();
  const { wallets } = useWallets();

  // Auto-fill wallet address when user connects
  useEffect(() => {
    if (authenticated && wallets.length > 0 && !yourWallet) {
      const primaryWallet = wallets[0];
      onWalletChange(primaryWallet.address);
    }
  }, [authenticated, wallets, yourWallet, onWalletChange]);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Global Settings</CardTitle>
          <CardDescription>Configure your proxy server settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Your Wallet Address <span className="text-destructive">*</span>
            </label>
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="0x..."
                value={yourWallet}
                onChange={(e) => onWalletChange(e.target.value)}
                className="flex-1"
              />
              {!authenticated ? (
                <Button onClick={login} variant="outline" size="default">
                  <Wallet className="mr-2 h-4 w-4" />
                  Connect Wallet
                </Button>
              ) : (
                <Button onClick={logout} variant="outline" size="default">
                  <Wallet className="mr-2 h-4 w-4" />
                  Logout
                </Button>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">
              FluxA API Key (placeholder)
            </label>
            <Input
              type="text"
              placeholder="Enter your FluxA API key..."
              value={apiKey}
              onChange={(e) => onApiKeyChange(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              This will be used for Claude Desktop integration with FluxA MCP proxy
            </p>
          </div>
        </CardContent>
      </Card>

      <div>
        <h2 className="text-2xl font-semibold mb-4">Configure Tools</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tools.map((tool, index) => (
            <Card key={tool.name} className={!tool.enabled ? "opacity-60" : ""}>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{tool.name}</CardTitle>
                    <CardDescription className="mt-1">{tool.description}</CardDescription>
                  </div>
                  <Switch
                    checked={tool.enabled}
                    onCheckedChange={(enabled) =>
                      onToolChange(index, { ...tool, enabled })
                    }
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Price (USDC)</label>
                  <Input
                    type="number"
                    step="0.0001"
                    min="0"
                    value={tool.price}
                    onChange={(e) => {
                      const price = parseFloat(e.target.value) || 0;
                      onToolChange(index, {
                        ...tool,
                        price: price,
                      });
                    }}
                    disabled={!tool.enabled}
                  />
                  <p className="text-xs text-muted-foreground">
                    Minimum price: $0.0001
                  </p>
                </div>
                <Badge variant={tool.price < 0.0001 ? "destructive" : "default"}>
                  {tool.price < 0.0001 ? "INVALID" : `$${tool.price.toFixed(5)}`}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          onClick={onNext}
          size="lg"
          disabled={
            !yourWallet.trim() ||
            tools.some((tool) => tool.enabled && tool.price < 0.0001)
          }
        >
          Next: Review Configuration
        </Button>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ServerConfig } from "@/lib/types";
import { CheckCircle2, Loader2, Download, Copy, Check, AlertCircle } from "lucide-react";

interface ReviewStepProps {
  config: ServerConfig;
  apiKey: string;
  onBack: () => void;
}

export function ReviewStep({ config, apiKey, onBack }: ReviewStepProps) {
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [savedData, setSavedData] = useState<{
    configId: string;
    path: string;
    proxyUrl: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [email, setEmail] = useState("");
  const [agentName, setAgentName] = useState("");

  const enabledTools = config.tools.filter((t) => t.enabled);
  const freeTools = enabledTools.filter((t) => t.price === 0);
  const paidTools = enabledTools.filter((t) => t.price > 0);

  const handleSave = async () => {
    setSaving(true);
    setError("");

    try {
      const response = await fetch("/api/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save configuration");
      }

      setSavedData({
        configId: data.configId,
        path: data.path,
        proxyUrl: data.proxyUrl,
      });
      setSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const claudeDesktopConfig = savedData && email && agentName
    ? JSON.stringify(
        {
          mcpServers: {
            [savedData.configId]: {
              command: "npx",
              args: [
                "-y",
                "@fluxa-pay/fluxa-connect-mcp",
                "--url",
                savedData.proxyUrl,
              ],
              env: {
                AGENT_EMAIL: email,
                AGENT_NAME: agentName,
              },
            },
          },
        },
        null,
        2
      )
    : "";

  const handleDownload = () => {
    const dataStr = JSON.stringify(config, null, 2);
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
    const link = document.createElement("a");
    link.setAttribute("href", dataUri);
    link.setAttribute("download", "proxy-config.json");
    link.click();
  };

  if (success && savedData) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
              <CardTitle className="text-green-900">Configuration Saved!</CardTitle>
            </div>
            <CardDescription className="text-green-700">
              Your proxy configuration has been saved successfully.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-green-900">
            <div>
              <h3 className="font-semibold mb-2">Configuration Details</h3>
              <div className="space-y-1 text-sm">
                <p><span className="font-medium">Config ID:</span> <code className="bg-green-100 px-1 py-0.5 rounded">{savedData.configId}</code></p>
                <p><span className="font-medium">Saved to:</span> <code className="bg-green-100 px-1 py-0.5 rounded text-xs">{savedData.path}</code></p>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Your Proxy URL</h3>
              <p className="text-sm mb-2">Use this URL to connect to your configured proxy:</p>
              <pre className="p-4 bg-green-100 rounded-md text-sm font-mono">
                {savedData.proxyUrl}
              </pre>
              <p className="text-xs text-muted-foreground mt-2">
                ⚠️ Make sure the multi-tenant proxy server is running on port 3003
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Agent Configuration</CardTitle>
            <CardDescription>
              Provide your details for agent registration with FluxA
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Your email will be used to register your agent with FluxA
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Agent Name</label>
                <Input
                  type="text"
                  placeholder="Claude Code - My Agent"
                  value={agentName}
                  onChange={(e) => setAgentName(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  A descriptive name to identify this agent in FluxA dashboard
                </p>
              </div>
            </div>

            {email && agentName && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-800">
                💡 <strong>Note:</strong> Your agent will be automatically registered with FluxA when Claude starts. You'll need to authorize it in the FluxA wallet to enable payments.
              </div>
            )}
          </CardContent>
        </Card>

        {email && agentName && (
          <Card>
            <CardHeader>
              <CardTitle>Claude Desktop Integration</CardTitle>
              <CardDescription>
                Add this configuration to your Claude Desktop settings to use your proxy
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium">Configuration JSON</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopy(claudeDesktopConfig)}
                  >
                    {copied ? (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="mr-2 h-4 w-4" />
                        Copy Config
                      </>
                    )}
                  </Button>
                </div>
                <pre className="p-4 bg-gray-100 rounded-md text-xs overflow-x-auto">
                  {claudeDesktopConfig}
                </pre>
              </div>

              <div className="space-y-2 text-sm">
                <h3 className="font-semibold">Setup Instructions:</h3>
                <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                  <li>Copy the configuration JSON above</li>
                  <li>Open Claude Desktop settings (usually at ~/.claude/config.json on Mac/Linux)</li>
                  <li>Add or merge this configuration to the mcpServers section</li>
                  <li>Make sure the proxy server is running: npm run proxy</li>
                  <li>Restart Claude Desktop to apply changes</li>
                </ol>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-800">
                💡 <strong>Note:</strong> When Claude starts, the FluxA Connect MCP package will automatically register your agent. Visit <a href="https://agentwallet.fluxapay.xyz" target="_blank" rel="noopener noreferrer" className="underline font-semibold">agentwallet.fluxapay.xyz</a> to authorize your agent and enable payments.
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Review Configuration</CardTitle>
          <CardDescription>
            Review your proxy configuration before saving
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Upstream URL</h3>
              <p className="text-sm font-mono mt-1">{config.upstreamUrl}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Proxy Port</h3>
              <p className="text-sm font-mono mt-1">{config.proxyPort}</p>
            </div>
            <div className="md:col-span-2">
              <h3 className="text-sm font-medium text-muted-foreground">Your Wallet</h3>
              <p className="text-sm font-mono mt-1">{config.yourWallet}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-2xl">{config.tools.length}</CardTitle>
                <CardDescription>Total Tools</CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-2xl">{enabledTools.length}</CardTitle>
                <CardDescription>Enabled</CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-2xl">{freeTools.length}</CardTitle>
                <CardDescription>Free</CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-2xl">{paidTools.length}</CardTitle>
                <CardDescription>Paid</CardDescription>
              </CardHeader>
            </Card>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">Tool Pricing</h3>
            <div className="space-y-2">
              {config.tools.map((tool) => (
                <div
                  key={tool.name}
                  className="flex items-center justify-between p-3 border rounded-md"
                >
                  <div className="flex-1">
                    <p className="font-medium">{tool.name}</p>
                    <p className="text-sm text-muted-foreground">{tool.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {!tool.enabled ? (
                      <Badge variant="outline">DISABLED</Badge>
                    ) : tool.price < 0.0001 ? (
                      <Badge variant="destructive">INVALID</Badge>
                    ) : (
                      <Badge variant="default">${tool.price.toFixed(5)}</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {error && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
              {error}
            </div>
          )}

          <div className="flex justify-between gap-4">
            <div className="flex gap-2">
              <Button variant="outline" onClick={onBack}>
                Back
              </Button>
              <Button variant="outline" onClick={handleDownload}>
                <Download className="mr-2 h-4 w-4" />
                Download JSON
              </Button>
            </div>
            <Button onClick={handleSave} disabled={saving} size="lg">
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {saving ? "Saving..." : "Save Configuration"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

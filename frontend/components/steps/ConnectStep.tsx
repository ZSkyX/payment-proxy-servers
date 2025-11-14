"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface ConnectStepProps {
  onConnect: (url: string, serverName: string, tools: any[]) => void;
}

export function ConnectStep({ onConnect }: ConnectStepProps) {
  const [upstreamUrl, setUpstreamUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleConnect = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ upstreamUrl }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to connect");
      }

      onConnect(upstreamUrl, data.serverName || 'Unknown Server', data.tools);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Connect to Upstream MCP Server</CardTitle>
          <CardDescription>
            Enter the URL of your upstream MCP server to fetch available tools
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Upstream Server URL</label>
            <Input
              type="url"
              placeholder=""
              value={upstreamUrl}
              onChange={(e) => setUpstreamUrl(e.target.value)}
              disabled={loading}
            />
          </div>

          {error && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
              {error}
            </div>
          )}

          <Button
            onClick={handleConnect}
            disabled={loading || !upstreamUrl}
            className="w-full"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {loading ? "Connecting..." : "Connect"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

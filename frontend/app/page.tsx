"use client";

import { useState } from "react";
import { ConnectStep } from "@/components/steps/ConnectStep";
import { ConfigureStep } from "@/components/steps/ConfigureStep";
import { ReviewStep } from "@/components/steps/ReviewStep";
import { ServerConfig, ToolConfig, FetchedTool } from "@/lib/types";

export default function Home() {
  const [step, setStep] = useState(1);
  const [upstreamUrl, setUpstreamUrl] = useState("");
  const [serverName, setServerName] = useState("");
  const [tools, setTools] = useState<ToolConfig[]>([]);
  const [yourWallet, setYourWallet] = useState("");
  const [apiKey, setApiKey] = useState("");

  const handleConnect = (url: string, name: string, fetchedTools: FetchedTool[]) => {
    setUpstreamUrl(url);
    setServerName(name);
    setTools(
      fetchedTools.map((tool) => ({
        name: tool.name,
        description: tool.description,
        price: 0.0001,
        enabled: true,
      }))
    );
    setStep(2);
  };

  const handleToolChange = (index: number, tool: ToolConfig) => {
    const newTools = [...tools];
    newTools[index] = tool;
    setTools(newTools);
  };

  const getConfig = (): ServerConfig => ({
    upstreamUrl,
    serverName,
    yourWallet,
    tools,
  });

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-12 px-4">
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-2">MCP Proxy Configuration</h1>
          <p className="text-muted-foreground">
            Configure pricing for your Model Context Protocol proxy server
          </p>
        </div>

        <div className="mb-8 max-w-xl mx-auto">
          <div className="flex items-center justify-center gap-4">
            {[
              { num: 1, label: "Connect" },
              { num: 2, label: "Configure" },
              { num: 3, label: "Review" },
            ].map((item, idx) => (
              <div key={item.num} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold ${
                      item.num === step
                        ? "bg-primary text-primary-foreground"
                        : item.num < step
                        ? "bg-green-500 text-white"
                        : "bg-gray-200 text-gray-500"
                    }`}
                  >
                    {item.num}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 whitespace-nowrap">{item.label}</p>
                </div>
                {idx < 2 && (
                  <div
                    className={`w-24 h-1 mx-2 mb-6 ${
                      item.num < step ? "bg-green-500" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {step === 1 && <ConnectStep onConnect={handleConnect} />}
        {step === 2 && (
          <ConfigureStep
            tools={tools}
            yourWallet={yourWallet}
            apiKey={apiKey}
            onToolChange={handleToolChange}
            onWalletChange={setYourWallet}
            onApiKeyChange={setApiKey}
            onNext={() => setStep(3)}
          />
        )}
        {step === 3 && <ReviewStep config={getConfig()} apiKey={apiKey} onBack={() => setStep(2)} />}
      </div>
    </main>
  );
}

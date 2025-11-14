import { ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export function Header() {
  return (
    <header className="border-b bg-background">
      <div className="flex items-center justify-between px-6 py-4">
        <h1 className="text-2xl font-bold">Agent Wallet</h1>
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost">
            <Link href="/">Monetize</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link href="/mcp-servers">MCP Servers</Link>
          </Button>
          <Button asChild variant="outline" className="flex items-center gap-2 bg-transparent">
            <a href="https://agentwallet.fluxapay.xyz/" target="_blank" rel="noopener noreferrer">
              Visit Agent Wallet
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        </div>
      </div>
    </header>
  )
}

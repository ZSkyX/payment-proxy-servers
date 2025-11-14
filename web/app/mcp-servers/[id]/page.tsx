import { Header } from "@/components/header"
import { MCPServerDetailPage } from "@/components/mcp-server-detail-page"
import { redirect } from 'next/navigation'

interface Tool {
  name: string
  description: string
  price: number
  enabled: boolean
}

interface MCPServer {
  id: string
  name: string
  upstreamUrl: string
  yourWallet: string
  tools: Tool[]
}

export default async function MCPServerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  // In production, fetch server config from API or configs-db
  // For now, redirect to servers list if no data
  // You can add logic to load from ../../../src/configs-db/${id}.json

  // Mock server data for demonstration
  const server: MCPServer | null = null

  if (!server) {
    redirect("/mcp-servers")
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        <MCPServerDetailPage server={server} />
      </main>
    </div>
  )
}

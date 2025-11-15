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
  tools: Tool[]
  proxyUrl: string
}

async function getServerConfig(id: string): Promise<MCPServer | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3099'
    const response = await fetch(`${baseUrl}/api/configs/${id}`, {
      cache: 'no-store',
    })

    if (!response.ok) {
      return null
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error("Error fetching server config:", error)
    return null
  }
}

export default async function MCPServerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const server = await getServerConfig(id)

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

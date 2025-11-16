"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/layout/header"
import { MCPServerDetailPage } from "@/components/pages/mcp-server-detail-page"
import { Loader2 } from "lucide-react"

interface Tool {
  name: string
  description: string
  price: number
  enabled: boolean
}

interface MCPServer {
  id: string
  name: string
  description: string
  tools: Tool[]
  proxyUrl: string
}

export default function MCPServerPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [server, setServer] = useState<MCPServer | null>(null)
  const [loading, setLoading] = useState(true)
  const [id, setId] = useState<string>("")

  // Unwrap params
  useEffect(() => {
    params.then(p => setId(p.id))
  }, [params])

  useEffect(() => {
    if (!id) {
      return
    }

    const fetchServer = async () => {
      try {
        // Public endpoint - no auth required
        const response = await fetch(`/api/configs/${id}`, {
          cache: 'no-store',
        })

        if (!response.ok) {
          router.push("/mcp-servers")
          return
        }

        const data = await response.json()
        setServer(data)
      } catch (error) {
        console.error("Error fetching server config:", error)
        router.push("/mcp-servers")
      } finally {
        setLoading(false)
      }
    }

    fetchServer()
  }, [id, router])

  if (loading || !server) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
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

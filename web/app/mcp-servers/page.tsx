import { Header } from "@/components/header"
import { MCPServersPage } from "@/components/mcp-servers-page"

export default function ServersDashboard() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        <MCPServersPage />
      </main>
    </div>
  )
}

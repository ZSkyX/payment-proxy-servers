import { Header } from "@/components/layout/header"
import { MCPServersPage } from "@/components/pages/mcp-servers-page"

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

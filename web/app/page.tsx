import { Header } from "@/components/header"
import { MCPFormsPage } from "@/components/mcp-forms-page"

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        <MCPFormsPage />
      </main>
    </div>
  )
}

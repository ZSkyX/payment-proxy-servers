import { Header } from "@/components/layout/header"
import { MCPFormsPage } from "@/components/pages/mcp-forms-page"

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

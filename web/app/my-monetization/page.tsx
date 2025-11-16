import { Header } from "@/components/layout/header"
import { MyMonetizationPage } from "@/components/pages/my-monetization-page"

export default function MyMonetization() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        <MyMonetizationPage />
      </main>
    </div>
  )
}

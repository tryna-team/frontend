import Footer from "@/components/Footer"
import Header from "@/components/Header"
import AppRoutes from "@/app/routes"

export default function App() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main>
        <AppRoutes />
      </main>
      <Footer />
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Sidebar from "./sidebar"
import TopBar from "./top-bar"
import Dashboard from "@/components/sections/dashboard"
import UsersModule from "@/components/sections/users-module"
import TablesModule from "@/components/sections/tables-module"
import CategoriesModule from "@/components/sections/categories-module"
import ProductsModule from "@/components/sections/products-module"
import IngredientsModule from "@/components/sections/ingredients-module"

interface DashboardLayoutProps {
  onLogout: () => void
}

type ActiveSection = "dashboard" | "users" | "roles" | "permissions" | "tables" | "products-list" | "categories" | "ingredients"

export default function DashboardLayout({ onLogout }: DashboardLayoutProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // 1. Lógica de Persistencia de Ruta (URL)
  const querySection = searchParams.get("section") as ActiveSection
  const [activeSection, setActiveSection] = useState<ActiveSection>(querySection || "dashboard")

  // 2. Lógica de Sesión de 8 Horas
  useEffect(() => {
    const checkSession = () => {
      const sessionStr = localStorage.getItem("pizzeria_session")
      if (!sessionStr) return onLogout()

      const { loginTime } = JSON.parse(sessionStr)
      const eightHours = 8 * 60 * 60 * 1000
      const now = new Date().getTime()

      if (now - loginTime > eightHours) {
        toast.error("Sesión expirada (8h)")
        onLogout()
      }
    }

    checkSession()
    // Opcional: Revisar cada 5 minutos
    const interval = setInterval(checkSession, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [onLogout])

  // Sincronizar URL cuando cambias de sección
  const handleNavigate = (section: ActiveSection) => {
    setActiveSection(section)
    const params = new URLSearchParams(searchParams.toString())
    params.set("section", section)
    router.push(`?${params.toString()}`, { scroll: false })
  }

  const renderContent = () => {
    switch (activeSection) {
      case "users": return <UsersModule />
      case "tables": return <TablesModule />
      case "products-list": return <ProductsModule />
      case "categories": return <CategoriesModule />
      case "ingredients": return <IngredientsModule />
      default: return <Dashboard />
    }
  }

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* Sidebar Fijo */}
      <Sidebar activeSection={activeSection} onNavigate={(s: any) => handleNavigate(s)} />
      
      {/* CONTENEDOR PRINCIPAL 
         lg:pl-64 -> Esto es lo que evita que el Sidebar tape el contenido en PC
      */}
      <div className="flex-1 flex flex-col h-full lg:pl-64 transition-all duration-300">
        
        {/* TopBar (normalmente altura h-16) */}
        <TopBar onLogout={onLogout} />
        
        {/* ÁREA DE CONTENIDO (MAIN)
           h-full y overflow-auto para que solo esta zona tenga scroll
        */}
        <main className="flex-1 overflow-y-auto bg-background/50 custom-scrollbar">
          <div className="p-4 lg:p-8 max-w-[1600px] mx-auto w-full">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  )
}
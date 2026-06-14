"use client"

import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"

interface TopBarProps {
  onLogout: () => void
}

export default function TopBar({ onLogout }: TopBarProps) {
  return (
    <div className="bg-card border-b border-border px-4 lg:px-8 py-4 flex items-center justify-between">
      <div className="min-w-0 lg:ml-0 ml-12">
        <h2 className="text-lg lg:text-xl font-bold text-foreground truncate">Panel de Administración</h2>
        <p className="text-xs lg:text-sm text-muted-foreground hidden sm:block">Gestión integral del negocio</p>
      </div>
      <div className="flex items-center gap-2 lg:gap-4">
        <div className="text-right hidden sm:block">
          <p className="text-sm font-medium text-foreground">Admin User</p>
          <p className="text-xs text-muted-foreground">Administrador</p>
        </div>
        <Button
          onClick={onLogout}
          className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 text-sm rounded-full"
        >
          <LogOut size={18} />
          <span className="hidden sm:inline">Cerrar Sesión</span>
        </Button>
      </div>
    </div>
  )
}

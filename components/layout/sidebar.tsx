"use client"

import { useState } from "react"
import { 
  ChevronDown, 
  Menu, 
  X, 
  LayoutDashboard, 
  Users, 
  UtensilsCrossed, 
  Package, 
  ShieldCheck, 
  Key, 
  Tags, 
  Box,
  Carrot
} from "lucide-react"

interface SidebarProps {
  activeSection: string
  onNavigate: (section: string) => void
}

export default function Sidebar({ activeSection, onNavigate }: SidebarProps) {
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({
    users: true,
    products: true,
  })
  const [isOpen, setIsOpen] = useState(false)

  const toggleMenu = (menuId: string) => {
    setExpandedMenus((prev) => ({
      ...prev,
      [menuId]: !prev[menuId],
    }))
  }

  // IDs sincronizados con DashboardLayout.tsx
  const menuItems = [
    { id: "dashboard", label: "Panel Principal", icon: LayoutDashboard },
    {
      id: "users_group",
      label: "Personal",
      icon: Users,
      submenu: [
        { id: "users", label: "Usuarios", icon: Users },
      ],
    },
    { id: "tables", label: "Mesas y Salón", icon: UtensilsCrossed },
    {
      id: "products_group",
      label: "Carta e Inventario",
      icon: Package,
      submenu: [
        { id: "products-list", label: "Productos", icon: Box },
        { id: "categories", label: "Categorías", icon: Tags },
        { id: "ingredients", label: "Ingredientes Base", icon: Carrot },
      ],
    },
  ]

  const handleNavigate = (section: string) => {
    onNavigate(section)
    setIsOpen(false) // Cerrar en móvil al navegar
  }

  return (
    <>
      {/* Botón Móvil */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-primary text-white rounded-md shadow-lg"
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Overlay para móvil */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-card border-r border-border flex flex-col transition-transform duration-300 lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold">
              P
            </div>
            <span className="text-xl font-bold tracking-tight text-primary">Admin Pizzería</span>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isGroupActive = item.submenu?.some(sub => sub.id === activeSection)

            return (
              <div key={item.id} className="space-y-1">
                <button
                  onClick={() => item.submenu ? toggleMenu(item.id) : handleNavigate(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all ${
                    activeSection === item.id || isGroupActive
                      ? "bg-primary text-white shadow-md"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <div className="flex items-center gap-3 font-medium">
                    <Icon size={20} />
                    <span>{item.label}</span>
                  </div>
                  {item.submenu && (
                    <ChevronDown
                      size={16}
                      className={`transition-transform duration-200 ${
                        expandedMenus[item.id] ? "rotate-180" : ""
                      }`}
                    />
                  )}
                </button>

                {item.submenu && expandedMenus[item.id] && (
                  <div className="mt-1 ml-4 space-y-1 border-l-2 border-primary/20 pl-3">
                    {item.submenu.map((subitem) => {
                      const SubIcon = subitem.icon
                      return (
                        <button
                          key={subitem.id}
                          onClick={() => handleNavigate(subitem.id)}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                            activeSection === subitem.id
                              ? "bg-primary/10 text-primary font-bold border-r-2 border-primary"
                              : "text-muted-foreground hover:bg-muted hover:text-foreground"
                          }`}
                        >
                          <SubIcon size={16} />
                          {subitem.label}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </nav>

        <div className="p-4 border-t border-border bg-muted/30">
          <div className="flex items-center gap-3 px-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <div className="text-xs text-muted-foreground">
              <p className="font-bold text-foreground">VPS Conectada</p>
              <p className="opacity-70">Sistema v1.2.0</p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
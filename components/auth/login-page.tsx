"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import apiClient from "@/lib/api-client" // 👈 Importamos tu cliente Axios

interface LoginPageProps {
  onLogin: () => void
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null) // 👈 Estado para errores

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      // 👈 Llamada REAL a tu Gateway
      const response = await apiClient.post('/gestion/auth/login', {
        email,
        password
      });

      // Si el login es exitoso, guardamos la llave en la caja fuerte del navegador
      if (response.data && response.data.token) {
        localStorage.setItem('tito_token', response.data.token);
        
        // Opcional: Guardar datos del usuario
        // localStorage.setItem('tito_user', JSON.stringify(response.data.user));
        
        setIsLoading(false);
        onLogin(); // Le da paso al Dashboard
      }
    } catch (err: any) {
      setIsLoading(false);
      // Capturamos tu glorioso 401 Unauthorized del backend
      if (err.response?.status === 401) {
        setError("Credenciales incorrectas. No te reconozco.");
      } else {
        setError("El servidor está apagado o inaccesible.");
      }
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md border border-border shadow-xl bg-card">
        <div className="p-6 lg:p-8">
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-accent rounded-full mx-auto mb-4 flex items-center justify-center">
              <span className="text-white font-bold text-xl">TP</span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">Tito Pizzería</h1>
            <p className="text-muted-foreground text-sm">Panel de Administración</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Mensaje de error */}
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/50 rounded text-red-500 text-sm text-center">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Email</label>
              <Input
                type="email"
                placeholder="jefe@tito.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-card border-border text-foreground placeholder:text-muted-foreground"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Contraseña</label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-card border-border text-foreground placeholder:text-muted-foreground"
                required
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-full"
            >
              {isLoading ? "Validando..." : "Ingresar"}
            </Button>
          </form>
        </div>
      </Card>
    </div>
  )
}
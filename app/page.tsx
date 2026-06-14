"use client"

import { useState, useEffect } from "react"
import LoginPage from "@/components/auth/login-page"
import DashboardLayout from "@/components/layout/dashboard-layout"

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null) // null para evitar parpadeo

  useEffect(() => {
    const session = localStorage.getItem("pizzeria_session")
    if (session) {
      const { loginTime } = JSON.parse(session)
      const eightHours = 8 * 60 * 60 * 1000
      const now = new Date().getTime()

      if (now - loginTime < eightHours) {
        setIsLoggedIn(true)
      } else {
        localStorage.removeItem("pizzeria_session")
        setIsLoggedIn(false)
      }
    } else {
      setIsLoggedIn(false)
    }
  }, [])

  const handleLogin = () => {
    const sessionData = {
      isLoggedIn: true,
      loginTime: new Date().getTime()
    }
    localStorage.setItem("pizzeria_session", JSON.stringify(sessionData))
    setIsLoggedIn(true)
  }

  const handleLogout = () => {
    localStorage.removeItem("pizzeria_session")
    setIsLoggedIn(false)
  }

  if (isLoggedIn === null) return null // Cargando...

  return isLoggedIn ? (
    <DashboardLayout onLogout={handleLogout} />
  ) : (
    <LoginPage onLogin={handleLogin} />
  )
}
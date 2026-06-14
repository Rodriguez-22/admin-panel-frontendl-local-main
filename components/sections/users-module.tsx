"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import apiClient from '@/lib/api-client'
import { toast } from "sonner"
import { UserPlus, Mail, User as UserIcon, ShieldCheck } from "lucide-react"

interface Role {
  id: string
  name: string
}

interface User {
  id: string
  username: string
  email: string
  firstName: string
  lastName: string
  isActive: boolean
  roles: Role[]
}

export default function UsersModule() {
  const [users, setUsers] = useState<User[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  
  // Estado sincronizado exactamente con CreateUserDto
  const [currentUser, setCurrentUser] = useState({
    username: "",
    email: "",
    firstName: "",
    lastName: "",
    password: "",
    roleIds: [] as string[]
  })

  const fetchData = async () => {
    try {
      setLoading(true)
      const [usersRes, rolesRes] = await Promise.all([
        apiClient.get('/gestion/usuarios'),
        apiClient.get('/gestion/roles')
      ])
      setUsers(usersRes.data || [])
      setRoles(rolesRes.data || [])
    } catch (error) {
      toast.error("Error al obtener datos de la VPS")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const handleSaveUser = async () => {
  try {
    // 1. Limpieza de datos (por si hay espacios accidentales)
    const payload = {
      ...currentUser,
      email: currentUser.email.trim(), // Elimina espacios al principio/final
      username: currentUser.username.trim(),
      password: currentUser.password || undefined
    };

    // 2. CHIVATO: Imprime en consola EXACTAMENTE lo que vas a enviar
    console.log("PAYLOAD QUE SE ENVÍA AL BACKEND:", payload);

    if (!payload.email || !payload.username || !payload.firstName || !payload.lastName) {
      toast.error("Todos los campos marcados con * son obligatorios");
      return;
    }

    if (editingId) {
      await apiClient.patch(`/gestion/usuarios/${editingId}`, payload);
      toast.success("Usuario actualizado");
    } else {
      if (!currentUser.password) return toast.error("La contraseña es obligatoria");
      await apiClient.post('/gestion/usuarios', payload);
      toast.success("Usuario creado con éxito");
    }

    setIsModalOpen(false);
    fetchData();
  } catch (error: any) {
    // Aquí verás en la consola de Chrome el PAYLOAD y el ERROR
    console.error("DETALLE DEL ERROR:", error.response?.data);
    const mensajeServidor = error.response?.data?.message;
    toast.error(Array.isArray(mensajeServidor) ? mensajeServidor[0] : "Error al guardar");
  }
};

  if (loading) return <div className="p-10 text-center animate-pulse font-bold text-primary">Conectando con la base de datos...</div>

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-card p-6 rounded-xl border shadow-sm">
        <div>
          <h2 className="text-3xl font-bold text-primary flex items-center gap-2">
            <UserPlus size={32}/> Personal del Sistema
          </h2>
          <p className="text-muted-foreground">Gestiona las cuentas y accesos de los empleados</p>
        </div>
        <Button onClick={() => { 
          setEditingId(null); 
          setCurrentUser({ username: "", email: "", firstName: "", lastName: "", password: "", roleIds: [] }); 
          setIsModalOpen(true); 
        }} className="bg-primary text-white font-bold">
          + Nuevo Usuario
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map((user) => (
          <Card key={user.id} className="p-5 border shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center gap-4 mb-4">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                {user.firstName[0].toUpperCase()}{user.lastName[0].toUpperCase()}
              </div>
              <div>
                <h4 className="font-bold text-lg leading-tight">{user.firstName} {user.lastName}</h4>
                <p className="text-xs text-muted-foreground font-mono">@{user.username}</p>
              </div>
            </div>
            
            <div className="space-y-2 mb-4 text-sm">
              <div className="flex items-center gap-2">
                <Mail size={14} className="text-muted-foreground"/> {user.email}
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {user.roles?.map(r => (
                  <Badge key={r.id} variant="outline" className="text-[10px] bg-primary/5 text-primary border-primary/20">
                    <ShieldCheck size={10} className="mr-1"/> {r.name}
                  </Badge>
                ))}
              </div>
            </div>

            <Button 
              variant="outline" 
              size="sm" 
              className="w-full mt-2"
              onClick={() => {
                setEditingId(user.id);
                setCurrentUser({
                  username: user.username,
                  email: user.email,
                  firstName: user.firstName,
                  lastName: user.lastName,
                  password: "", 
                  roleIds: user.roles.map(r => r.id)
                });
                setIsModalOpen(true);
              }}
            >
              Editar Usuario
            </Button>
          </Card>
        ))}
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {editingId ? "Editar Miembro" : "Alta de Nuevo Personal"}
            </DialogTitle>
            {/* ✅ Esto quita el Warning del DialogDescription */}
            <DialogDescription>
              Completa los datos del usuario. Los campos con * son necesarios.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="grid gap-2">
              <Label>Nombre *</Label>
              <Input value={currentUser.firstName} onChange={(e) => setCurrentUser({ ...currentUser, firstName: e.target.value })} placeholder="Juan" />
            </div>
            <div className="grid gap-2">
              <Label>Apellidos *</Label>
              <Input value={currentUser.lastName} onChange={(e) => setCurrentUser({ ...currentUser, lastName: e.target.value })} placeholder="García" />
            </div>
            <div className="grid gap-2">
              <Label>Username *</Label>
              <Input value={currentUser.username} onChange={(e) => setCurrentUser({ ...currentUser, username: e.target.value })} placeholder="juan_dev" />
            </div>
            <div className="grid gap-2">
              <Label>Email *</Label>
              <Input type="email" value={currentUser.email} onChange={(e) => setCurrentUser({ ...currentUser, email: e.target.value })} placeholder="juan@ejemplo.com" />
            </div>
            <div className="grid gap-2 col-span-2">
              <Label>Rol Principal</Label>
              <Select value={currentUser.roleIds[0] || ""} onValueChange={(val) => setCurrentUser({ ...currentUser, roleIds: [val] })}>
                <SelectTrigger><SelectValue placeholder="Selecciona el puesto" /></SelectTrigger>
                <SelectContent>
                  {roles.map((role) => <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2 col-span-2">
              <Label>Contraseña {editingId && "(dejar vacío para mantener)"}</Label>
              <Input type="password" value={currentUser.password} onChange={(e) => setCurrentUser({ ...currentUser, password: e.target.value })} placeholder="********" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveUser} className="bg-primary text-white font-bold">Guardar Cambios</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
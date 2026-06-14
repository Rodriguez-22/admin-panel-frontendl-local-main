"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import apiClient from '@/lib/api-client'
import { toast } from "sonner"
import { Carrot, Plus, Trash2, Edit3, RefreshCw } from "lucide-react"

interface Ingredient {
  id: string
  name: string
  description?: string
}

export default function IngredientsModule() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  
  const [currentIngredient, setCurrentIngredient] = useState({ name: "", description: "" })

  const fetchData = async () => {
    try {
      setLoading(true)
      const res = await apiClient.get('/gestion/ingredientes')
      setIngredients(res.data || [])
    } catch (error) {
      toast.error("Error al conectar con la base de datos de ingredientes")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const handleSave = async () => {
    if (!currentIngredient.name.trim()) return toast.error("El nombre es obligatorio")

    try {
      if (editingId) {
        await apiClient.patch(`/gestion/ingredientes/${editingId}`, currentIngredient)
        toast.success("Ingrediente actualizado")
      } else {
        await apiClient.post('/gestion/ingredientes', currentIngredient)
        toast.success("Ingrediente creado")
      }
      setIsModalOpen(false)
      fetchData()
    } catch (error) {
      toast.error("Error al guardar el ingrediente")
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("¿Seguro que quieres eliminar este ingrediente?")) return
    try {
      await apiClient.delete(`/gestion/ingredientes/${id}`)
      fetchData()
      toast.success("Ingrediente eliminado")
    } catch (e) { toast.error("No se pudo eliminar") }
  }

  if (loading) return <div className="p-10 text-center animate-pulse text-emerald-600 font-bold">Cargando despensa...</div>

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-card p-6 rounded-xl border shadow-sm">
        <div>
          <h2 className="text-3xl font-bold text-emerald-600 flex items-center gap-2">
            <Carrot size={32}/> Ingredientes Base
          </h2>
          <p className="text-muted-foreground">Despensa oficial para componer platos</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={fetchData}><RefreshCw size={18}/></Button>
          <Button onClick={() => { 
            setEditingId(null); 
            setCurrentIngredient({ name: "", description: "" }); 
            setIsModalOpen(true); 
          }} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
            <Plus className="mr-2" size={18}/> Añadir Ingrediente
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {ingredients.map((ing) => (
          <Card key={ing.id} className="p-4 flex flex-col items-center text-center relative group border-2 hover:border-emerald-200 transition-colors">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-3">
              <Carrot size={24}/>
            </div>
            <h4 className="font-bold text-zinc-800 leading-tight">{ing.name}</h4>
            <p className="text-xs text-zinc-500 mt-1 line-clamp-2 min-h-[32px]">{ing.description || "Sin descripción"}</p>
            
            <div className="flex gap-1 mt-4 w-full border-t pt-3">
              <Button variant="ghost" size="sm" className="flex-1 h-8 text-zinc-600 hover:bg-zinc-100" onClick={() => {
                setEditingId(ing.id);
                setCurrentIngredient({ name: ing.name, description: ing.description || "" });
                setIsModalOpen(true);
              }}><Edit3 size={14}/></Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-500 hover:bg-rose-50" onClick={() => handleDelete(ing.id)}>
                <Trash2 size={14}/>
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">{editingId ? "Editar Ingrediente" : "Nuevo Ingrediente"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label className="font-bold">Nombre del ingrediente *</Label>
              <Input value={currentIngredient.name} onChange={(e) => setCurrentIngredient({ ...currentIngredient, name: e.target.value })} placeholder="Ej: Tomate fresco" />
            </div>
            <div className="grid gap-2">
              <Label className="font-bold">Descripción (Opcional)</Label>
              <Input value={currentIngredient.description} onChange={(e) => setCurrentIngredient({ ...currentIngredient, description: e.target.value })} placeholder="Ej: Rodajas de tomate para hamburguesa" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700 text-white">Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
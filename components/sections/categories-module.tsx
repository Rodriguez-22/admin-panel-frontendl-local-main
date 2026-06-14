"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import apiClient from '@/lib/api-client'
import { toast } from "sonner"
import { Tags, Plus, Trash2, Edit3, FolderTree } from "lucide-react"

interface Category {
  id: string
  name: string
}

export default function CategoriesModule() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  
  const [currentCategory, setCurrentCategory] = useState({
    name: ""
  })

  const fetchData = async () => {
    try {
      setLoading(true)
      // Conexión preparada para la VPS
      const res = await apiClient.get('/gestion/categorias')
      setCategories(res.data || [])
    } catch (error) {
      console.warn("Microservicio de productos/categorías aún no disponible")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const handleSave = async () => {
    try {
      if (!currentCategory.name) {
        toast.error("El nombre de la categoría es obligatorio")
        return
      }

      if (editingId) {
        await apiClient.patch(`/gestion/categorias/${editingId}`, currentCategory)
        toast.success("Categoría actualizada")
      } else {
        await apiClient.post('/gestion/categorias', currentCategory)
        toast.success("Categoría creada con éxito")
      }
      
      setIsModalOpen(false)
      fetchData()
    } catch (error) {
      toast.error("Error al guardar la categoría")
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar esta categoría? Esto podría afectar a los productos asociados.")) return
    try {
      await apiClient.delete(`/gestion/categorias/${id}`)
      fetchData()
      toast.success("Categoría eliminada")
    } catch (e) {
      toast.error("No se pudo eliminar la categoría")
    }
  }

  if (loading) return <div className="p-10 text-center animate-pulse font-bold text-primary">Cargando categorías...</div>

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex justify-between items-center bg-card p-6 rounded-xl border shadow-sm">
        <div>
          <h2 className="text-3xl font-bold text-primary flex items-center gap-2">
            <Tags size={32}/> Categorías del Menú
          </h2>
          <p className="text-muted-foreground">Organiza tus productos por tipos para facilitar la venta</p>
        </div>
        <Button onClick={() => { 
          setEditingId(null); 
          setCurrentCategory({ name: "" }); 
          setIsModalOpen(true); 
        }} className="bg-primary text-white font-bold">
          <Plus className="mr-2 h-4 w-4"/> Nueva Categoría
        </Button>
      </div>

      {/* LISTADO */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {categories.length === 0 ? (
          <div className="col-span-full p-12 text-center border-2 border-dashed rounded-xl opacity-50">
            <FolderTree size={40} className="mx-auto mb-2"/>
            <p>No hay categorías definidas.</p>
          </div>
        ) : (
          categories.map((cat) => (
            <Card key={cat.id} className="p-4 flex justify-between items-center border shadow-sm hover:border-primary/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                  <Tags size={18}/>
                </div>
                <span className="font-bold">{cat.name}</span>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={() => {
                  setEditingId(cat.id);
                  setCurrentCategory({ name: cat.name });
                  setIsModalOpen(true);
                }}>
                  <Edit3 size={16}/>
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(cat.id)}>
                  <Trash2 size={16}/>
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* MODAL */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {editingId ? "Editar Categoría" : "Nueva Categoría"}
            </DialogTitle>
            <DialogDescription>
              Escribe el nombre de la categoría (ej: Pizzas Especiales).
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="grid gap-2">
              <Label htmlFor="cat-name">Nombre de Categoría</Label>
              <Input 
                id="cat-name"
                value={currentCategory.name} 
                onChange={(e) => setCurrentCategory({ name: e.target.value })} 
                placeholder="Ej: Postres Caseros" 
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} className="bg-primary text-white">Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import apiClient from '@/lib/api-client'
import { toast } from "sonner"
import { PackagePlus, Tag, Package, Trash2, Edit3, CircleDollarSign, CheckCircle2, Plus, Minus, Carrot, Check } from "lucide-react"

interface Category { id: string; name: string; }
interface Ingredient { id: string; name: string; }

interface Product {
  id: string
  name: string
  description: string
  price: number
  image?: string
  categoryId: string
  category?: Category
  extras?: { name: string, price: number }[]
  ingredients?: Ingredient[] // Los ingredientes que vienen del backend
}

export default function ProductsModule() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [allIngredients, setAllIngredients] = useState<Ingredient[]>([]) // Toda la despensa
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  
  const [currentProduct, setCurrentProduct] = useState({
    name: "",
    description: "",
    price: "", 
    image: "",
    categoryId: "",
    extras: [] as { name: string, price: string }[],
    ingredientIds: [] as string[] // Array de UUIDs seleccionados
  })

  const fetchData = async () => {
    try {
      setLoading(true)
      const [prodRes, catRes, ingRes] = await Promise.all([
        apiClient.get('/gestion/productos').catch(() => ({ data: [] })),
        apiClient.get('/gestion/categorias').catch(() => ({ data: [] })),
        apiClient.get('/gestion/ingredientes').catch(() => ({ data: [] })) // Cargamos la despensa
      ])
      setProducts(prodRes.data)
      setCategories(catRes.data)
      setAllIngredients(ingRes.data)
    } catch (error) {
      console.warn("Error cargando datos")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const getFixedImageUrl = (url?: string) => {
    if (!url) return "";
    if (typeof window !== 'undefined') {
      return url.replace('localhost', window.location.hostname);
    }
    return url;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('file', file);

      // 👇 EL CAMBIO CRÍTICO: Usamos apiClient. El token viajará automáticamente.
      const response = await apiClient.post('/gestion/productos/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Axios procesa el JSON solo, así que los datos están en response.data
      const data = response.data;
      
      const currentIp = window.location.hostname;
      const finalUrl = data.url.replace('localhost', currentIp);

      setCurrentProduct(prev => ({ ...prev, image: finalUrl }));
      toast.success("Fotografía subida con éxito");
    } catch (error) {
      console.error("Error del servidor al subir la foto:", error);
      toast.error("El servidor rechazó la imagen por falta de permisos o formato incorrecto.");
    } finally {
      setIsUploading(false);
    }
  };

  const addExtraField = () => setCurrentProduct(prev => ({ ...prev, extras: [...prev.extras, { name: "", price: "" }] }));
  const removeExtraField = (index: number) => setCurrentProduct(prev => ({ ...prev, extras: prev.extras.filter((_, i) => i !== index) }));
  const updateExtraField = (index: number, field: 'name' | 'price', value: string) => setCurrentProduct(prev => {
    const newExtras = [...prev.extras];
    newExtras[index][field] = value;
    return { ...prev, extras: newExtras };
  });

  // Lógica para marcar/desmarcar ingredientes oficiales
  const toggleIngredient = (id: string) => {
    setCurrentProduct(prev => {
      const isSelected = prev.ingredientIds.includes(id);
      if (isSelected) {
        return { ...prev, ingredientIds: prev.ingredientIds.filter(ingId => ingId !== id) };
      } else {
        return { ...prev, ingredientIds: [...prev.ingredientIds, id] };
      }
    });
  }

  const handleSave = async () => {
    try {
      const cleanPriceString = currentProduct.price.toString().replace(',', '.');
      const finalPrice = parseFloat(cleanPriceString);

      if (!currentProduct.name || !currentProduct.categoryId || isNaN(finalPrice) || finalPrice <= 0) {
        return toast.error("Rellena nombre, categoría y un precio válido")
      }

      const cleanedExtras = currentProduct.extras
        .filter(ext => ext.name.trim() !== "")
        .map(ext => ({
          name: ext.name.trim(),
          price: parseFloat(ext.price.toString().replace(',', '.')) || 0
        }));

      const payload: any = {
        name: currentProduct.name,
        price: finalPrice,
        categoryId: currentProduct.categoryId,
        extras: cleanedExtras,
        ingredientIds: currentProduct.ingredientIds // Enviamos el array de UUIDs al backend
      };

      if (currentProduct.description?.trim()) payload.description = currentProduct.description;
      if (currentProduct.image?.trim()) payload.image = currentProduct.image;

      if (editingId) {
        await apiClient.patch(`/gestion/productos/${editingId}`, payload)
        toast.success("Producto actualizado")
      } else {
        await apiClient.post('/gestion/productos', payload)
        toast.success("Producto creado")
      }
      
      setIsModalOpen(false)
      fetchData()
    } catch (error) {
      toast.error("Error al guardar en la base de datos.")
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar este producto?")) return
    try {
      await apiClient.delete(`/gestion/productos/${id}`)
      fetchData()
      toast.success("Producto eliminado")
    } catch (e) { toast.error("No se pudo eliminar") }
  }

  if (loading) return <div className="p-10 text-center animate-pulse font-bold text-primary">Conectando con el almacén...</div>

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-card p-6 rounded-xl border shadow-sm">
        <div>
          <h2 className="text-3xl font-bold text-primary flex items-center gap-2">
            <Package size={32}/> Inventario
          </h2>
          <p className="text-muted-foreground">Gestiona la carta, precios y extras de personalización</p>
        </div>
        <Button onClick={() => { 
          setEditingId(null); 
          setCurrentProduct({ name: "", description: "", price: "", image: "", categoryId: "", extras: [], ingredientIds: [] }); 
          setIsModalOpen(true); 
        }} className="bg-primary text-white font-bold">
          <PackagePlus className="mr-2"/> Nuevo Producto
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {products.map((prod) => (
          <Card key={prod.id} className="p-0 overflow-hidden border shadow-sm hover:shadow-lg transition-all group">
            <div className="h-40 bg-zinc-100 flex items-center justify-center relative overflow-hidden border-b">
              {prod.image ? (
                <img src={getFixedImageUrl(prod.image)} alt={prod.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              ) : (
                <Package size={40} className="text-muted-foreground/40"/>
              )}
              <Badge className="absolute top-2 right-2 bg-primary font-black shadow-md">{prod.price.toFixed(2)}€</Badge>
            </div>

            <div className="p-4">
              <h4 className="font-bold text-lg leading-tight mb-1">{prod.name}</h4>
              <p className="text-xs text-muted-foreground mb-3 line-clamp-2 min-h-[32px]">
                {prod.description || "Sin descripción"}
              </p>
              
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <Badge variant="outline" className="text-[10px] font-bold py-0 h-5 bg-zinc-50">
                  <Tag size={10} className="mr-1"/> {prod.category?.name || "Sin categoría"}
                </Badge>
                {prod.ingredients && prod.ingredients.length > 0 && (
                  <Badge variant="outline" className="text-[10px] font-bold py-0 h-5 border-emerald-200 text-emerald-600 bg-emerald-50">
                    <Carrot size={10} className="mr-1"/> {prod.ingredients.length} Ingredientes
                  </Badge>
                )}
                {prod.extras && prod.extras.length > 0 && (
                  <Badge variant="secondary" className="text-[10px] font-bold py-0 h-5">
                    +{prod.extras.length} Extras
                  </Badge>
                )}
              </div>

              <div className="flex gap-2 border-t pt-4">
                <Button variant="outline" size="sm" className="flex-1 h-8 bg-zinc-50" onClick={() => {
                  setEditingId(prod.id);
                  setCurrentProduct({
                    name: prod.name,
                    description: prod.description || "",
                    price: prod.price.toString(),
                    image: prod.image || "",
                    categoryId: prod.categoryId,
                    extras: prod.extras ? prod.extras.map(e => ({ name: e.name, price: e.price.toString() })) : [],
                    ingredientIds: prod.ingredients ? prod.ingredients.map(i => i.id) : [] // Rellenamos los checkboxes
                  });
                  setIsModalOpen(true);
                }}>
                  <Edit3 size={14} className="mr-1"/> Editar
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-red-50" onClick={() => handleDelete(prod.id)}>
                  <Trash2 size={14}/>
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black">{editingId ? "Actualizar Producto" : "Registrar en la Carta"}</DialogTitle>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-5 py-4">
            <div className="grid gap-2 col-span-2">
              <Label className="font-bold">Nombre del Producto *</Label>
              <Input value={currentProduct.name} onChange={(e) => setCurrentProduct({ ...currentProduct, name: e.target.value })} placeholder="Ej: Hamburguesa Clásica" />
            </div>

            <div className="grid gap-2 col-span-2">
              <Label className="font-bold">Descripción Corta</Label>
              <Input value={currentProduct.description} onChange={(e) => setCurrentProduct({ ...currentProduct, description: e.target.value })} placeholder="Una hamburguesa deliciosa con carne 100% vacuno..." />
            </div>

            {/* SECCIÓN INGREDIENTES OFICIALES (CHECKBOXES) */}
            <div className="col-span-2 bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 space-y-3">
              <div className="flex items-center gap-2 text-emerald-800">
                <Carrot size={18}/>
                <Label className="font-bold">Composición Oficial (Permite al cliente quitar ingredientes)</Label>
              </div>
              
              {allIngredients.length === 0 ? (
                <p className="text-xs text-zinc-500 italic">No hay ingredientes registrados. Créalos primero en la sección "Ingredientes Base".</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {allIngredients.map(ing => {
                    const isSelected = currentProduct.ingredientIds.includes(ing.id);
                    return (
                      <button
                        key={ing.id}
                        type="button"
                        onClick={() => toggleIngredient(ing.id)}
                        className={`px-3 py-1.5 rounded-full text-sm font-bold border transition-all flex items-center gap-1.5 ${
                          isSelected 
                            ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm' 
                            : 'bg-white border-zinc-200 text-zinc-600 hover:border-emerald-300 hover:bg-emerald-50'
                        }`}
                      >
                        {isSelected && <Check size={14}/>} {ing.name}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {/* SECCIÓN EXTRAS DE PAGO */}
            <div className="col-span-2 bg-zinc-50 p-4 rounded-xl border border-zinc-200 space-y-3">
              <div className="flex justify-between items-center">
                <Label className="font-bold text-zinc-700">Añadidos de Pago (Extras)</Label>
                <Button type="button" variant="outline" size="sm" onClick={addExtraField} className="h-8 text-xs font-bold border-dashed border-primary text-primary hover:bg-primary/5">
                  <Plus size={14} className="mr-1"/> Añadir Extra
                </Button>
              </div>
              
              {currentProduct.extras.length === 0 ? (
                <p className="text-xs text-zinc-500 italic">No hay extras configurados para este plato.</p>
              ) : (
                <div className="space-y-2">
                  {currentProduct.extras.map((extra, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <Input placeholder="Ej: Bacon crujiente" value={extra.name} onChange={(e) => updateExtraField(index, 'name', e.target.value)} className="flex-1" />
                      <div className="relative w-28">
                        <span className="absolute left-3 top-2.5 text-zinc-400 text-sm">$</span>
                        <Input placeholder="1.50" value={extra.price} onChange={(e) => updateExtraField(index, 'price', e.target.value)} className="pl-7" />
                      </div>
                      <Button type="button" variant="ghost" size="icon" className="text-rose-500 hover:bg-rose-50" onClick={() => removeExtraField(index)}><Minus size={16}/></Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* FOTO, PRECIO Y CATEGORÍA... */}
            <div className="grid gap-2 col-span-2 bg-zinc-50 p-4 rounded-xl border border-dashed border-zinc-300">
              <Label className="font-bold mb-1">Fotografía del Producto</Label>
              <div className="flex flex-col sm:flex-row gap-4 items-center">
                <div className="flex-1 w-full relative">
                  {currentProduct.image ? (
                    <div className="flex items-center gap-3 bg-white p-2 border rounded-md">
                      <img src={getFixedImageUrl(currentProduct.image)} alt="Preview" className="w-10 h-10 object-cover rounded" />
                      <span className="text-sm font-medium text-green-600 flex items-center gap-1"><CheckCircle2 size={16}/> Imagen cargada</span>
                      <Button variant="ghost" size="sm" className="ml-auto text-red-500 h-8" onClick={() => setCurrentProduct({...currentProduct, image: ""})}>Quitar</Button>
                    </div>
                  ) : (
                    <Input type="file" accept="image/*" onChange={handleFileUpload} disabled={isUploading} />
                  )}
                </div>
              </div>
            </div>

            <div className="grid gap-2">
              <Label className="font-bold">Precio Base (€) *</Label>
              <div className="relative">
                <CircleDollarSign className="absolute left-3 top-2.5 text-muted-foreground" size={16}/>
                <Input type="text" className="pl-9" value={currentProduct.price} onChange={(e) => setCurrentProduct({ ...currentProduct, price: e.target.value })} placeholder="11.50" />
              </div>
            </div>

            <div className="grid gap-2">
              <Label className="font-bold">Categoría *</Label>
              <Select value={currentProduct.categoryId} onValueChange={(val) => setCurrentProduct({ ...currentProduct, categoryId: val })}>
                <SelectTrigger><SelectValue placeholder="Selecciona..." /></SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={isUploading} className="bg-primary text-white font-bold px-8 shadow-md">
              {editingId ? "Actualizar" : "Guardar Producto"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
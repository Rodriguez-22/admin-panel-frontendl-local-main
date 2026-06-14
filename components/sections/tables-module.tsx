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
import { 
  Table as TableIcon, 
  Trash2, 
  Edit3, 
  Users, 
  CircleDot,
  LayoutGrid,
  RefreshCw,
  NotebookPen,
  ShoppingCart,
  ChefHat,
  Menu,
  ArrowLeft,
  Plus,
  Minus,
  Check
} from "lucide-react"

type TableStatus = "available" | "occupied" | "reserved" | "cleaning"

interface Mesa {
  id: string
  number: number
  capacity: number
  status: TableStatus
  isActive: boolean
}

export default function TablesModule() {
  const [tables, setTables] = useState<Mesa[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [currentTable, setCurrentTable] = useState({ number: 1, capacity: 4, status: "available" as TableStatus })

  const [catalog, setCatalog] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [activeCategory, setActiveCategory] = useState<string>("all")
  const [tpvTableId, setTpvTableId] = useState<string | null>(null)
  const [cartItems, setCartItems] = useState<any[]>([])
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false)
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false)

  // 👇 NUEVOS ESTADOS PARA EL MOTOR DE PERSONALIZACIÓN
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [selectedExtras, setSelectedExtras] = useState<any[]>([])
  const [removedIngredients, setRemovedIngredients] = useState<string[]>([])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [mesasRes, prodRes, catRes] = await Promise.all([
        apiClient.get('/gestion/mesas'),
        apiClient.get('/gestion/productos').catch(() => ({ data: [] })),
        apiClient.get('/gestion/categorias').catch(() => ({ data: [] }))
      ])
      setTables(mesasRes.data || [])
      setCatalog(Array.isArray(prodRes.data) ? prodRes.data : prodRes.data.data || [])
      setCategories(Array.isArray(catRes.data) ? catRes.data : catRes.data.data || [])
    } catch (error) {
      toast.error("Error conectando con los microservicios")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  // Limpiar el modal cuando se selecciona un nuevo producto
  useEffect(() => {
    if (selectedProduct) {
      setQuantity(1);
      setSelectedExtras([]);
      setRemovedIngredients([]);
    }
  }, [selectedProduct])

  const handleSave = async () => {
    try {
      if (currentTable.number <= 0) return toast.error("Número de mesa no válido")
      if (editingId) {
        await apiClient.patch(`/gestion/mesas/${editingId}`, {
          id: editingId,
          ...currentTable
        })
        toast.success("Mesa actualizada")
      } else {
        await apiClient.post('/gestion/mesas', currentTable)
        toast.success(`Mesa ${currentTable.number} creada`)
      }
      setIsModalOpen(false)
      fetchData()
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error al guardar mesa")
    }
  }

  const handleQuickStatusChange = async (id: string, newStatus: TableStatus) => {
    try {
      await apiClient.patch(`/gestion/mesas/${id}`, { 
        id: id,
        status: newStatus 
      })
      fetchData()
      toast.success("Estado actualizado")
    } catch (e) {
      toast.error("No se pudo cambiar el estado")
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("¿Deseas dar de baja esta mesa?")) return
    try {
      await apiClient.delete(`/gestion/mesas/${id}`)
      fetchData()
      toast.success("Mesa eliminada")
    } catch (e) { toast.error("Error al eliminar") }
  }

  const getStatusInfo = (status: TableStatus) => {
    switch (status) {
      case "available": return { label: "Libre", color: "bg-green-500/10 text-green-500 border-green-500/20" }
      case "occupied": return { label: "Ocupada", color: "bg-red-500/10 text-red-500 border-red-500/20" }
      case "reserved": return { label: "Reservada", color: "bg-blue-500/10 text-blue-500 border-blue-500/20" }
      case "cleaning": return { label: "Limpieza", color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" }
      default: return { label: "N/A", color: "bg-gray-500/10 text-gray-500" }
    }
  }

  const getFixedImageUrl = (url?: string) => {
    if (!url) return "";
    if (typeof window !== 'undefined') {
      return url.replace('localhost', window.location.hostname);
    }
    return url;
  };

  const filteredCatalog = activeCategory === "all" ? catalog : catalog.filter(p => p.categoryId === activeCategory);
  
  // 👇 CÁLCULO DE TOTAL CORREGIDO (Base + Extras)
  const calculatedTotal = cartItems.reduce((total, item) => total + ((Number(item.basePrice) + Number(item.extraPrice || 0)) * item.quantity), 0);

  // 👇 FUNCIONES DE PERSONALIZACIÓN
  const toggleExtra = (extra: any) => {
    setSelectedExtras(prev => prev.some(e => e.name === extra.name) ? prev.filter(e => e.name !== extra.name) : [...prev, extra])
  }

  const toggleRemoveIngredient = (ingName: string) => {
    setRemovedIngredients(prev => prev.includes(ingName) ? prev.filter(n => n !== ingName) : [...prev, ingName])
  }

  // 👇 AÑADIR AL CARRITO (Igual que en el Kiosco)
  const handleAddToCart = () => {
    if (!selectedProduct) return;
    
    const extraCost = selectedExtras.reduce((sum, e) => sum + Number(e.price), 0);
    const addedExtrasNames = selectedExtras.map(e => e.name);

    const existingItem = cartItems.find(item => 
      item.productId === selectedProduct.id &&
      JSON.stringify(item.customizations?.added || []) === JSON.stringify(addedExtrasNames) &&
      JSON.stringify(item.customizations?.removed || []) === JSON.stringify(removedIngredients)
    );

    if (existingItem) {
      setCartItems(prev => prev.map(item => 
        item.cartItemId === existingItem.cartItemId 
          ? { ...item, quantity: item.quantity + quantity } 
          : item
      ));
    } else {
      setCartItems(prev => [...prev, {
        cartItemId: Math.random().toString(36).substring(7),
        productId: selectedProduct.id,
        name: selectedProduct.name,
        basePrice: Number(selectedProduct.price) || 0,
        extraPrice: extraCost,
        quantity: quantity,
        customizations: {
          added: addedExtrasNames,
          removed: removedIngredients
        }
      }]);
    }

    setTimeout(() => { setSelectedProduct(null); }, 50);
  }

  const removeCartItem = (cartItemId: string) => {
    setCartItems(prev => prev.filter(item => item.cartItemId !== cartItemId));
  };

  const handleSubmitOrder = async () => {
    if (!tpvTableId || cartItems.length === 0) return;
    setIsSubmittingOrder(true);
    try {
      const orderPayload = {
        tableId: tpvTableId,
        items: cartItems.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          customizations: item.customizations
        }))
      };

      await apiClient.post('/gestion/pedidos', orderPayload);
      
      const mesa = tables.find(t => t.id === tpvTableId);
      if (mesa && mesa.status !== 'occupied') {
        await apiClient.patch(`/gestion/mesas/${tpvTableId}`, { 
          id: tpvTableId,
          status: 'occupied' 
        });
      }

      toast.success("Comanda enviada a cocina con éxito");
      setCartItems([]);
      setTpvTableId(null);
      setIsMobileCartOpen(false);
      fetchData(); 
    } catch (error) {
      toast.error("Error al enviar la comanda.");
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  if (loading) return <div className="p-10 text-center animate-pulse text-primary font-bold">Consultando plano de salón...</div>

  return (
    <div className="space-y-6 relative">
      <div className="flex justify-between items-center bg-card p-6 rounded-xl border shadow-sm">
        <div>
          <h2 className="text-3xl font-bold text-primary flex items-center gap-2">
            <LayoutGrid size={32}/> Gestión de Mesas
          </h2>
          <p className="text-muted-foreground">Control de aforo y toma de comandas rápida</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={fetchData}><RefreshCw size={18}/></Button>
          <Button onClick={() => { 
            setEditingId(null); 
            setCurrentTable({ number: tables.length + 1, capacity: 4, status: "available" }); 
            setIsModalOpen(true); 
          }} className="bg-primary text-white font-bold">
            <span className="hidden sm:inline">+ Añadir Mesa</span>
            <span className="sm:hidden">+</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-6">
        {tables.map((mesa) => {
          const statusInfo = getStatusInfo(mesa.status)
          return (
            <Card key={mesa.id} className="p-4 flex flex-col items-center justify-center relative hover:shadow-md transition-all group border-2">
              <div className="absolute top-2 right-2">
                <CircleDot size={12} className={mesa.status === "available" ? "text-green-500" : "text-red-500 animate-pulse"}/>
              </div>
              
              <div className="mb-2 p-3 bg-muted rounded-full">
                <TableIcon size={24} className="text-muted-foreground"/>
              </div>
              
              <h4 className="font-extrabold text-xl">MESA {mesa.number}</h4>
              
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                <Users size={12}/> {mesa.capacity} pax
              </div>

              <Select value={mesa.status} onValueChange={(val: TableStatus) => handleQuickStatusChange(mesa.id, val)}>
                <SelectTrigger className={`mt-3 h-7 text-[9px] font-bold uppercase ${statusInfo.color}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Libre</SelectItem>
                  <SelectItem value="occupied">Ocupada</SelectItem>
                  <SelectItem value="reserved">Reservada</SelectItem>
                  <SelectItem value="cleaning">Limpieza</SelectItem>
                </SelectContent>
              </Select>

              <Button 
                className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-8 text-xs"
                onClick={() => {
                  setTpvTableId(mesa.id);
                  setCartItems([]);
                  setIsMobileCartOpen(false);
                }}
              >
                <NotebookPen size={14} className="mr-1"/> Tomar Nota
              </Button>

              <div className="flex gap-1 mt-4 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="icon" className="h-7 w-7 text-primary" onClick={() => {
                  setEditingId(mesa.id);
                  setCurrentTable({ number: mesa.number, capacity: mesa.capacity, status: mesa.status });
                  setIsModalOpen(true);
                }}><Edit3 size={14}/></Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(mesa.id)}><Trash2 size={14}/></Button>
              </div>
            </Card>
          )
        })}
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md" aria-describedby={undefined}>
          <DialogTitle className="sr-only">Configuración de Mesa</DialogTitle>
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">{editingId ? `Ajustar Mesa ${currentTable.number}` : "Configurar Mesa"}</DialogTitle>
            <DialogDescription>Asigna el número de mesa y su capacidad.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="grid gap-2">
              <Label>Número Mesa</Label>
              <Input type="number" value={currentTable.number} onChange={(e) => setCurrentTable({ ...currentTable, number: Number(e.target.value) })} />
            </div>
            <div className="grid gap-2">
              <Label>Capacidad</Label>
              <Input type="number" value={currentTable.capacity} onChange={(e) => setCurrentTable({ ...currentTable, capacity: Number(e.target.value) })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} className="bg-primary text-white">Guardar Mesa</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* TPV MODAL AJUSTADO PARA PC */}
      <Dialog open={!!tpvTableId} onOpenChange={(open) => {
        if (!open) { setTpvTableId(null); setIsMobileCartOpen(false); setIsMobileMenuOpen(false); }
      }}>
        <DialogContent className="max-w-[1200px] w-[95vw] h-[90vh] p-0 flex flex-col md:flex-row overflow-hidden border-0 bg-zinc-100" aria-describedby={undefined}>
          
          <DialogTitle className="sr-only">Terminal de Punto de Venta</DialogTitle>

          {/* LADO IZQUIERDO (CATÁLOGO) */}
          <div className={`flex-1 md:w-2/3 flex-col h-full bg-white border-r ${isMobileCartOpen ? 'hidden md:flex' : 'flex'}`}>
            <div className="p-4 border-b bg-white flex items-center justify-between shadow-sm z-10">
              <h3 className="text-xl sm:text-2xl font-black text-zinc-800 flex items-center gap-2">
                <ChefHat size={28}/> Menú
              </h3>
              
              <div className="md:hidden">
                 <Button variant="outline" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                   <Menu />
                 </Button>
              </div>

              <div className="hidden md:flex gap-2 overflow-x-auto no-scrollbar max-w-[75%]">
                <Button variant={activeCategory === "all" ? "default" : "outline"} className="rounded-full" onClick={() => setActiveCategory("all")}>Todos</Button>
                {categories.map(cat => (
                  <Button key={cat.id} variant={activeCategory === cat.id ? "default" : "outline"} className="rounded-full whitespace-nowrap" onClick={() => setActiveCategory(cat.id)}>
                    {cat.name}
                  </Button>
                ))}
              </div>
            </div>

            {isMobileMenuOpen && (
              <div className="md:hidden bg-zinc-50 border-b p-4 flex flex-wrap gap-2 shadow-inner">
                <Button size="sm" variant={activeCategory === "all" ? "default" : "outline"} className="rounded-full" onClick={() => { setActiveCategory("all"); setIsMobileMenuOpen(false); }}>Todos</Button>
                {categories.map(cat => (
                  <Button size="sm" key={cat.id} variant={activeCategory === cat.id ? "default" : "outline"} className="rounded-full" onClick={() => { setActiveCategory(cat.id); setIsMobileMenuOpen(false); }}>
                    {cat.name}
                  </Button>
                ))}
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-4 bg-zinc-50">
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredCatalog.map(product => (
                  <Card 
                    key={product.id} 
                    className="cursor-pointer hover:border-primary transition-all overflow-hidden flex flex-col active:scale-95" 
                    onClick={() => setSelectedProduct(product)} // 👈 AHORA ABRE EL MODAL
                  >
                    <div className="h-28 sm:h-32 bg-zinc-200 relative">
                      {product.image ? (
                        <img src={getFixedImageUrl(product.image)} alt={product.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-400"><ChefHat/></div>
                      )}
                      <Badge className="absolute bottom-2 right-2 font-black shadow-md">${Number(product.price).toFixed(2)}</Badge>
                    </div>
                    <div className="p-3 text-center">
                      <p className="font-bold text-sm leading-tight line-clamp-2">{product.name}</p>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            <div className="md:hidden p-4 bg-white border-t mt-auto shadow-[0_-10px_20px_rgba(0,0,0,0.05)]">
              <Button className="w-full h-12 bg-zinc-900 text-white font-bold" onClick={() => setIsMobileCartOpen(true)}>
                Ver Comanda ({cartItems.length}) - ${calculatedTotal.toFixed(2)}
              </Button>
            </div>
          </div>

          {/* LADO DERECHO (TICKET DE MESA) */}
          <div className={`w-full md:w-1/3 flex-col h-full bg-white shadow-[-10px_0_20px_rgba(0,0,0,0.05)] z-20 ${!isMobileCartOpen ? 'hidden md:flex' : 'flex'}`}>
            <div className="p-4 sm:p-6 bg-zinc-900 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="md:hidden text-white hover:bg-white/20" onClick={() => setIsMobileCartOpen(false)}>
                   <ArrowLeft size={20} />
                </Button>
                <h3 className="text-lg sm:text-xl font-black flex items-center gap-2"><NotebookPen size={20}/> Mesa {tables.find(t => t.id === tpvTableId)?.number}</h3>
              </div>
              <Badge variant="outline" className="text-white border-white/30">{cartItems.length} items</Badge>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-zinc-50/50">
              {cartItems.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-zinc-400 opacity-50 space-y-2">
                  <ShoppingCart size={48}/>
                  <p className="font-medium">Ticket en blanco</p>
                </div>
              ) : (
                cartItems.map((item) => (
                  <div key={item.cartItemId} className="flex justify-between items-start bg-white p-3 rounded-lg shadow-sm border border-zinc-100">
                    <div className="flex-1 pr-2">
                      <p className="font-bold text-zinc-800 text-sm leading-tight">
                        <span className="text-emerald-600 mr-1">{item.quantity}x</span> {item.name}
                      </p>
                      
                      {/* 👇 MUESTRA DE EXTRAS Y QUITADOS EN EL TICKET */}
                      <div className="text-[11px] mt-1 mb-1">
                        {item.customizations?.added?.map((extraName: string, i: number) => (
                          <span key={`add-${i}`} className="text-emerald-600 font-bold block">+ Extra {extraName}</span>
                        ))}
                        {item.customizations?.removed?.map((ingName: string, i: number) => (
                          <span key={`rem-${i}`} className="text-rose-500 font-bold line-through block">- Sin {ingName}</span>
                        ))}
                      </div>

                      <p className="text-xs text-zinc-500 font-bold">${((Number(item.basePrice) + Number(item.extraPrice || 0)) * item.quantity).toFixed(2)}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-50 flex-shrink-0" onClick={() => removeCartItem(item.cartItemId)}>
                      <Trash2 size={16}/>
                    </Button>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 sm:p-6 bg-white border-t border-zinc-100">
              <div className="flex justify-between items-center mb-4">
                <span className="text-zinc-500 font-bold uppercase text-xs sm:text-sm">Total Comanda</span>
                <span className="text-2xl sm:text-3xl font-black text-emerald-600">${calculatedTotal.toFixed(2)}</span>
              </div>
              <Button 
                className="w-full h-12 sm:h-14 text-base sm:text-lg font-black bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl rounded-xl"
                disabled={cartItems.length === 0 || isSubmittingOrder}
                onClick={handleSubmitOrder}
              >
                {isSubmittingOrder ? "Enviando..." : "Marchar Pedido"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 👇 MODAL DE PERSONALIZACIÓN DEL PRODUCTO PARA CAMAREROS */}
      <Dialog open={!!selectedProduct} onOpenChange={(open) => {
        setTimeout(() => { if (!open) setSelectedProduct(null); }, 50);
      }}>
        <DialogContent className="sm:max-w-[425px] rounded-xl max-h-[90vh] p-0 border-0 flex flex-col overflow-hidden bg-white z-[60]" aria-describedby={undefined}>
          
          <div className="flex-1 overflow-y-auto">
            {selectedProduct?.image ? (
              <div className="w-full h-40 sm:h-48 bg-zinc-200 flex-shrink-0">
                <img src={getFixedImageUrl(selectedProduct.image)} alt={selectedProduct.name} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="w-full h-32 sm:h-40 bg-zinc-900 flex items-center justify-center text-white flex-shrink-0"><ChefHat size={48} /></div>
            )}

            <div className="p-6">
              <DialogHeader className="mb-4">
                <DialogTitle className="text-2xl font-black text-zinc-900">{selectedProduct?.name}</DialogTitle>
                <DialogDescription className="text-zinc-500 text-sm mt-2">
                  {selectedProduct?.description || "Anotaciones para la cocina"}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 pb-2">
                {selectedProduct?.ingredients?.length > 0 && (
                  <div>
                    <h4 className="font-bold mb-3 uppercase text-xs text-zinc-500 tracking-wider">Quitar Ingredientes</h4>
                    <div className="space-y-2">
                      {selectedProduct.ingredients.map((ing: any) => {
                        const isRemoved = removedIngredients.includes(ing.name);
                        return (
                          <div 
                            key={ing.id} 
                            className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition ${isRemoved ? 'border-rose-500 bg-rose-50' : 'border-zinc-200'}`}
                            onClick={() => toggleRemoveIngredient(ing.name)}
                          >
                            <div className="flex items-center gap-2">
                              <div className={`w-5 h-5 rounded border flex items-center justify-center ${isRemoved ? 'bg-rose-500 border-rose-500 text-white' : 'border-zinc-300 bg-white'}`}>
                                {isRemoved && <Check size={14} />}
                              </div>
                              <p className={`font-bold ${isRemoved ? 'text-rose-700 line-through' : 'text-zinc-900'}`}>
                                Sin {ing.name}
                              </p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {selectedProduct?.extras?.length > 0 && (
                  <div>
                    <h4 className="font-bold mb-3 uppercase text-xs text-zinc-500 tracking-wider">Añadir Extras</h4>
                    <div className="space-y-2">
                      {selectedProduct.extras.map((extra: any, idx: number) => {
                        const isSelected = selectedExtras.some(e => e.name === extra.name);
                        return (
                          <div 
                            key={idx} 
                            className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition ${isSelected ? 'border-emerald-600 bg-emerald-50' : 'border-zinc-200'}`}
                            onClick={() => toggleExtra(extra)}
                          >
                            <div className="flex items-center gap-2">
                              <div className={`w-5 h-5 rounded border flex items-center justify-center ${isSelected ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-zinc-300 bg-white'}`}>
                                {isSelected && <Check size={14} />}
                              </div>
                              <p className={`font-bold ${isSelected ? 'text-emerald-800' : 'text-zinc-900'}`}>
                                {extra.name}
                              </p>
                            </div>
                            <p className="text-sm font-black text-zinc-600">+{Number(extra.price).toFixed(2)}€</p>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t">
                  <span className="font-bold text-lg text-zinc-900">Cantidad</span>
                  <div className="flex items-center gap-4 bg-zinc-100 rounded-full p-1">
                    <Button variant="ghost" size="icon" className="rounded-full text-zinc-900" onClick={() => setQuantity(Math.max(1, quantity - 1))}><Minus size={18} /></Button>
                    <span className="font-bold w-4 text-center text-lg text-zinc-900">{quantity}</span>
                    <Button variant="ghost" size="icon" className="rounded-full text-zinc-900" onClick={() => setQuantity(quantity + 1)}><Plus size={18} /></Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 bg-white border-t shadow-[0_-10px_20px_rgba(0,0,0,0.05)] z-10 mt-auto">
            <Button className="w-full text-xl h-14 rounded-xl font-black shadow-md bg-zinc-900 text-white" onClick={handleAddToCart}>
              Añadir a la cuenta - ${( (Number(selectedProduct?.price) + selectedExtras.reduce((sum, e) => sum + Number(e.price), 0)) * quantity ).toFixed(2)}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
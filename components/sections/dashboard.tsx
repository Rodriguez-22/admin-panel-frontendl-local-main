"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import apiClient from '@/lib/api-client'
import { Loader2, ChefHat, CheckCircle2, Clock, Flame, Plus, Minus, Carrot } from "lucide-react"
import { io } from "socket.io-client"
import { toast } from "sonner"

export default function Dashboard() {
  const [dbStats, setDbStats] = useState({ usuarios: 0, mesas: 0, productos: 0 })
  const [loading, setLoading] = useState(true)
  
  const [activeOrders, setActiveOrders] = useState<any[]>([])
  const [tablesMap, setTablesMap] = useState<Record<string, number>>({})
  
  // 👇 1. Actualizamos el mapa para que también guarde los ingredientes
  const [productsMap, setProductsMap] = useState<Record<string, { name: string, description: string, ingredients?: any[] }>>({})

  // 🕒 COMPENSADOR DE DESFASE HORARIO
  const formatOrderTime = (dateString: string) => {
    try {
      if (!dateString) return "--:--";
      const date = new Date(dateString);
      date.setHours(date.getHours() + 2);
      return date.toLocaleTimeString('es-ES', {
        hour: '2-digit', 
        minute: '2-digit'
      });
    } catch (e) {
      return "--:--";
    }
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [usersRes, tablesRes, productsRes, ordersRes] = await Promise.all([
          apiClient.get('/gestion/usuarios').catch(() => ({ data: [] })),
          apiClient.get('/gestion/mesas').catch(() => ({ data: [] })),
          apiClient.get('/gestion/productos').catch(() => ({ data: [] })),
          apiClient.get('/gestion/pedidos').catch(() => ({ data: [] }))
        ])

        const tMap: Record<string, number> = {}
        if (Array.isArray(tablesRes.data)) {
          tablesRes.data.forEach((t: any) => { tMap[t.id] = t.number })
        }
        setTablesMap(tMap)

        // 👇 2. Guardamos los ingredientes en la memoria del panel
        const pMap: Record<string, { name: string, description: string, ingredients?: any[] }> = {}
        if (Array.isArray(productsRes.data)) {
          productsRes.data.forEach((p: any) => { 
            pMap[p.id] = { name: p.name, description: p.description, ingredients: p.ingredients } 
          })
        }
        setProductsMap(pMap)

        setDbStats({
          usuarios: Array.isArray(usersRes.data) ? usersRes.data.length : 0,
          mesas: Array.isArray(tablesRes.data) ? tablesRes.data.length : 0,
          productos: Array.isArray(productsRes.data) ? productsRes.data.length : 0,
        })

        if (Array.isArray(ordersRes.data)) {
          const kitchenOrders = ordersRes.data.filter((o: any) => 
            o.status === 'pending' || o.status === 'preparing'
          )
          setActiveOrders(kitchenOrders.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()))
        }
      } catch (error) {
        console.error("Error cargando el dashboard", error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()

    const currentIp = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
    const socketUrl = `http://${currentIp}:3005`;
    
    const socket = io(socketUrl, { transports: ['websocket', 'polling'] });

    socket.on('connect', () => {
      console.log('🟢 RADAR COCINA: Conectado al servidor');
    });

    socket.onAny((eventName, ...args) => {
      if (eventName.toLowerCase().includes('order') || eventName.toLowerCase().includes('pedido')) {
        toast.success('¡COMANDAS ACTUALIZADAS!', { icon: '🔄' });
        fetchDashboardData();
      }
    });

    return () => { socket.disconnect() }
  }, [])

  const changeOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      setActiveOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o))
      await apiClient.patch(`/gestion/pedidos/${orderId}/status`, { status: newStatus })
      
      if (newStatus === 'ready') {
        toast.success("¡Plato marcado como listo para servir!")
        setTimeout(() => {
          setActiveOrders(prev => prev.filter(o => o.id !== orderId))
        }, 1000)
      }
    } catch (error) {
      toast.error("Error al actualizar el estado")
      const res = await apiClient.get('/gestion/pedidos')
      setActiveOrders(res.data.filter((o: any) => o.status === 'pending' || o.status === 'preparing'))
    }
  }

  const stats = [
    { label: "Total Usuarios", value: dbStats.usuarios, icon: "👥", color: "from-blue-500 to-blue-600" },
    { label: "Total Mesas", value: dbStats.mesas, icon: "🍽️", color: "from-emerald-500 to-emerald-600" },
    { label: "Total Productos", value: dbStats.productos, icon: "📦", color: "from-amber-500 to-amber-600" },
    { label: "Órdenes Activas", value: activeOrders.length, icon: "📋", color: "from-rose-500 to-rose-600" },
  ]

  return (
    <div className="space-y-6 lg:space-y-8 relative">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-zinc-900 mb-1 lg:mb-2 flex items-center gap-2">
          Centro de Mando
          {loading && <Loader2 className="animate-spin text-zinc-400" size={20} />}
        </h1>
        <p className="text-sm lg:text-base text-zinc-500">Monitorización y Cocina en tiempo real</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="p-4 lg:p-6 border-zinc-200 bg-white hover:shadow-md transition-shadow relative overflow-hidden">
            <div className="flex items-center justify-between relative z-10">
              <div className="min-w-0">
                <p className="text-zinc-500 text-xs lg:text-sm mb-1 lg:mb-2 font-bold uppercase tracking-wider">{stat.label}</p>
                <p className="text-3xl lg:text-4xl font-black text-zinc-900">
                  {loading ? "-" : stat.value}
                </p>
              </div>
              <div className="text-4xl lg:text-5xl opacity-20 flex-shrink-0 grayscale">{stat.icon}</div>
            </div>
            <div className="absolute -bottom-4 -right-4 text-8xl opacity-5 select-none">{stat.icon}</div>
          </Card>
        ))}
      </div>

      <div className="mt-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-zinc-900 p-2 rounded-lg"><ChefHat className="text-white" size={24}/></div>
          <h2 className="text-xl lg:text-2xl font-black text-zinc-900">Pantalla de Cocina (KDS)</h2>
          <Badge variant="outline" className="ml-auto bg-rose-50 text-rose-600 border-rose-200 font-bold animate-pulse">
            EN DIRECTO
          </Badge>
        </div>

        {activeOrders.length === 0 ? (
          <Card className="p-12 text-center border-dashed border-2 border-zinc-200 bg-zinc-50/50">
            <div className="mx-auto w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
              <CheckCircle2 className="text-emerald-500" size={32}/>
            </div>
            <h3 className="text-xl font-bold text-zinc-700">Cocina Despejada</h3>
            <p className="text-zinc-500 mt-2">No hay comandas pendientes. ¡Buen trabajo!</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
            {activeOrders.map((order) => {
              const isPending = order.status === 'pending';
              
              return (
                <Card 
                  key={order.id} 
                  className={`overflow-hidden border transition-all h-fit shadow-sm hover:shadow-md ${
                    isPending ? 'border-amber-200' : 'border-emerald-200'
                  }`}
                >
                  <div className={`p-3 flex justify-between items-center border-b ${isPending ? 'bg-amber-50' : 'bg-emerald-50'}`}>
                    <div>
                      <h3 className={`font-black text-lg ${isPending ? 'text-amber-900' : 'text-emerald-900'}`}>
                        MESA {tablesMap[order.tableId] || 'N/A'}
                      </h3>
                      <p className={`text-xs font-medium flex items-center gap-1 mt-0.5 ${isPending ? 'text-amber-700' : 'text-emerald-700'}`}>
                        <Clock size={12}/> 
                        {formatOrderTime(order.createdAt)}
                      </p>
                    </div>
                    <Badge className={isPending ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-none' : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-none'}>
                      {isPending ? 'NUEVO' : 'EN FUEGO'}
                    </Badge>
                  </div>

                  <div className="p-3 bg-white">
                    <ul className="space-y-3">
                      {order.items?.map((item: any, idx: number) => {
                        // Rescatamos todo el producto de la memoria
                        const product = item.product || productsMap[item.productId];
                        const productName = product?.name || 'Producto Desconocido';
                        const productDesc = product?.description || '';
                        const productIngredients = product?.ingredients || [];

                        return (
                          <li key={idx} className="flex flex-col border-b border-zinc-100 pb-3 last:border-0 last:pb-0">
                            <div className="flex items-start gap-2">
                              <span className="font-black text-base text-zinc-900 min-w-[24px] bg-zinc-100 text-center rounded px-1">{item.quantity}</span>
                              <div className="pt-0.5 w-full">
                                <span className="font-bold text-zinc-800 text-sm leading-tight block mb-1">
                                  {productName}
                                </span>
                                
                                {/* 👇 3. MAGIA VISUAL: DESGLOSE DE INGREDIENTES */}
                                {productIngredients.length > 0 ? (
                                  <div className="bg-emerald-50/50 p-2 rounded-lg border border-emerald-100/50 mb-2">
                                    <div className="flex flex-wrap gap-1.5">
                                      <span className="text-[10px] font-black text-emerald-700 bg-emerald-100/80 px-1.5 py-0.5 rounded uppercase tracking-wider flex items-center gap-1">
                                        <Carrot size={10}/> BASE
                                      </span>
                                      {productIngredients.map((ing: any, i: number) => {
                                        const isRemoved = item.customizations?.removed?.includes(ing.name);
                                        return (
                                          <span 
                                            key={i} 
                                            className={`text-[11px] px-1.5 py-0.5 rounded-md border ${
                                              isRemoved 
                                                ? 'bg-rose-50 text-rose-400 border-rose-100 line-through decoration-rose-300' 
                                                : 'bg-white text-zinc-700 border-zinc-200 font-medium shadow-sm'
                                            }`}
                                          >
                                            {ing.name}
                                          </span>
                                        );
                                      })}
                                    </div>
                                  </div>
                                ) : (
                                  productDesc && (
                                    <span className="text-xs text-zinc-500 block mt-0.5 mb-2 leading-tight italic">
                                      {productDesc}
                                    </span>
                                  )
                                )}
                                
                                {/* AÑADIDOS Y QUITADOS */}
                                <div className="space-y-0.5">
                                  {item.customizations?.added?.map((extraName: string, i: number) => (
                                    <p key={`add-${i}`} className="text-emerald-700 text-xs font-bold flex items-center gap-1.5 bg-emerald-50 w-fit px-2 py-0.5 rounded">
                                      <Plus size={12} strokeWidth={3}/> Extra {extraName}
                                    </p>
                                  ))}

                                  {item.customizations?.removed?.map((ingName: string, i: number) => (
                                    <p key={`rem-${i}`} className="text-rose-600 text-xs font-bold flex items-center gap-1.5 bg-rose-50 w-fit px-2 py-0.5 rounded">
                                      <Minus size={12} strokeWidth={3}/> Sin {ingName}
                                    </p>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </li>
                        )
                      })}
                    </ul>
                  </div>

                  <div className="p-3 bg-zinc-50 border-t">
                    {isPending ? (
                      <Button 
                        size="sm"
                        className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold shadow-none"
                        onClick={() => changeOrderStatus(order.id, 'preparing')}
                      >
                        <Flame className="mr-2" size={16}/> Empezar a Cocinar
                      </Button>
                    ) : (
                      <Button 
                        size="sm"
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-none"
                        onClick={() => changeOrderStatus(order.id, 'ready')}
                      >
                        <CheckCircle2 className="mr-2" size={16}/> ¡Plato Listo!
                      </Button>
                    )}
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
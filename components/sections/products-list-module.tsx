"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import apiClient from "@/lib/api-client"

interface Product {
  id: string
  name: string
  price: number
  category: string
  stock: number
  description: string
}
export default function ProductsListModule() {
  const [products, setProducts] = useState<Product[]>([
    {
      id: "1",
      name: "Hamburguesa Clásica",
      price: 8.99,
      category: "Platos Principales",
      stock: 45,
      description: "Hamburguesa artesanal",
    },
    { id: "2", name: "Pizza Margarita", price: 12.99, category: "Pizzas", stock: 30, description: "Pizza tradicional" },
    { id: "3", name: "Ensalada César", price: 7.99, category: "Ensaladas", stock: 25, description: "Ensalada fresca" },
    { id: "4", name: "Coca Cola", price: 2.5, category: "Bebidas", stock: 100, description: "Bebida fría" },
  ])

  const [categories] = useState(["Platos Principales", "Pizzas", "Ensaladas", "Bebidas", "Postres"])
  // Fetch products from backend on mount
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await apiClient.get('/gestion/productos');
        
        // 1. EL CHIVATO: Imprimimos en la consola del navegador lo que llega
        console.log("Datos crudos del backend:", response.data);

        // 2. MAPEO DEFENSIVO: Aseguramos que la estructura encaje con el frontend
        // Dependiendo de si tu backend devuelve un array directo o un objeto con { data: [...] }
        const dataArray = Array.isArray(response.data) ? response.data : response.data.data || [];

        const formattedProducts = dataArray.map((p: any) => ({
          id: p.id || Math.random().toString(), // Por si el id se llama distinto
          name: p.name || "Producto sin nombre",
          // Convertimos a número por si el backend lo manda como texto "9.50"
          price: typeof p.price === 'string' ? parseFloat(p.price) : (p.price || 0), 
          // Si el backend no tiene categoría, lo metemos a la fuerza en "Platos Principales"
          category: p.category || "Platos Principales", 
          stock: p.stock || 10, // Stock ficticio si no existe en BD
          description: p.description || "Sin descripción"
        }));

        setProducts(formattedProducts);
        
      } catch (error) {
        console.error("Error al cargar los productos:", error);
      }
    };

    fetchProducts();
  }, []);
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [newProduct, setNewProduct] = useState({
    name: "",
    price: "",
    category: "Platos Principales",
    stock: "",
    description: "",
  })

  const handleOpenModal = () => {
    setEditingId(null)
    setNewProduct({ name: "", price: "", category: "Platos Principales", stock: "", description: "" })
    setIsModalOpen(true)
  }

  const handleEditProduct = (product: Product) => {
    setEditingId(product.id)
    setNewProduct({
      name: product.name,
      price: product.price.toString(),
      category: product.category,
      stock: product.stock.toString(),
      description: product.description,
    })
    setIsModalOpen(true)
  }

  const handleSaveProduct = () => {
    if (newProduct.name && newProduct.price && newProduct.stock) {
      if (editingId) {
        setProducts(
          products.map((p) =>
            p.id === editingId
              ? {
                  ...p,
                  name: newProduct.name,
                  price: Number.parseFloat(newProduct.price),
                  category: newProduct.category,
                  stock: Number.parseInt(newProduct.stock),
                  description: newProduct.description,
                }
              : p,
          ),
        )
      } else {
        setProducts([
          ...products,
          {
            id: Date.now().toString(),
            name: newProduct.name,
            price: Number.parseFloat(newProduct.price),
            category: newProduct.category,
            stock: Number.parseInt(newProduct.stock),
            description: newProduct.description,
          },
        ])
      }
      setNewProduct({ name: "", price: "", category: "Platos Principales", stock: "", description: "" })
      setEditingId(null)
      setIsModalOpen(false)
    }
  }

  const handleDeleteProduct = (id: string) => {
    setProducts(products.filter((p) => p.id !== id))
  }

  const groupedProducts = categories.map((cat) => ({
    category: cat,
    products: products.filter((p) => p.category === cat),
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Gestión de Productos</h1>
          <p className="text-muted-foreground">Administra el catálogo de productos</p>
        </div>
        <Button onClick={handleOpenModal} className="bg-primary hover:bg-primary/90 text-primary-foreground">
          + Nuevo Producto
        </Button>
      </div>

      {isModalOpen && (
        <Card className="p-6 border-border/50 bg-card">
          <h2 className="text-lg font-bold text-foreground mb-4">
            {editingId ? "Editar Producto" : "Crear Nuevo Producto"}
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Nombre</label>
              <Input
                type="text"
                value={newProduct.name}
                onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                className="bg-background border-border text-foreground"
                placeholder="Nombre del producto"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Precio</label>
                <Input
                  type="number"
                  step="0.01"
                  value={newProduct.price}
                  onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                  className="bg-background border-border text-foreground"
                  placeholder="9.99"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Stock</label>
                <Input
                  type="number"
                  value={newProduct.stock}
                  onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                  className="bg-background border-border text-foreground"
                  placeholder="50"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Categoría</label>
              <select
                value={newProduct.category}
                onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                className="w-full bg-background border border-border rounded-md px-3 py-2 text-foreground text-sm"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Descripción</label>
              <textarea
                value={newProduct.description}
                onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                className="w-full bg-background border border-border rounded-md px-3 py-2 text-foreground text-sm"
                placeholder="Descripción del producto"
                rows={3}
              />
            </div>
            <div className="flex gap-3">
              <Button
                onClick={handleSaveProduct}
                className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {editingId ? "Guardar Cambios" : "Crear Producto"}
              </Button>
              <Button
                onClick={() => {
                  setIsModalOpen(false)
                  setEditingId(null)
                }}
                variant="outline"
                className="flex-1 border-border hover:bg-secondary/20"
              >
                Cancelar
              </Button>
            </div>
          </div>
        </Card>
      )}

      <div className="space-y-8">
        {groupedProducts.map(
          (group) =>
            group.products.length > 0 && (
              <div key={group.category}>
                <h2 className="text-xl font-bold text-foreground mb-4">{group.category}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {group.products.map((product) => (
                    <Card key={product.id} className="p-6 border-border/50">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-semibold text-foreground">{product.name}</h3>
                          <p className="text-sm text-muted-foreground mt-1">{product.description}</p>
                        </div>
                      </div>
                      <div className="flex items-end justify-between">
                        <div>
                          <p className="text-2xl font-bold text-primary">${product.price.toFixed(2)}</p>
                          <p className="text-xs text-muted-foreground mt-1">Stock: {product.stock}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleEditProduct(product)}
                            variant="outline"
                            size="sm"
                            className="border-primary/50 text-primary hover:bg-primary/10"
                          >
                            ✏️
                          </Button>
                          <Button
                            onClick={() => handleDeleteProduct(product.id)}
                            variant="outline"
                            size="sm"
                            className="border-destructive/50 text-destructive hover:bg-destructive/10"
                          >
                            ✕
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            ),
        )}
      </div>
    </div>
  )
}


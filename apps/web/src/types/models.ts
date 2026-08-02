export type Product = {
  id: number;
  name: string;
  sku?: string;
  price: number;
  cost: number;
  productType: string;
  isAvailable: boolean;
  categoryId?: number;
};

export type Customer = { id: number; name: string; email?: string; phone?: string; identification?: string };
export type Supplier = { id: number; name: string; ruc?: string; phone?: string; email?: string };
export type RestaurantTable = { id: number; name: string; capacity: number; location?: string; status: 'FREE' | 'OCCUPIED' | 'RESERVED' | 'CLEANING' | 'BILL_REQUESTED' };
export type OrderStatus = 'PENDING' | 'PREPARING' | 'READY' | 'DELIVERED' | 'CANCELLED';
export type KitchenOrder = {
  id: number;
  tableId?: number | null;
  table?: { id: number; name: string } | null;
  status: OrderStatus;
  createdAt: string;
  notes?: string | null;
  items: Array<{ id: number; productId: number; quantity: number; notes?: string | null; product: { id: number; name: string } }>;
};
export type Order = {
  id: number;
  tableId?: number | null;
  status: OrderStatus;
  createdAt: string;
  notes?: string | null;
  items?: Array<{ id: number; productId: number; quantity: number; product: { id: number; name: string; price: number } }>;
};
export type InventoryItem = { id: number; name: string; unit: string; currentStock: number; minimumStock: number; averageCost: number };
export type Sale = { id: number; saleNumber: string; total: number; status: string; createdAt: string };

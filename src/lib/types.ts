export type Role = 'superuser' | 'admin' | 'manager' | 'cashier' | 'viewer';
export type ModuleName = 'products' | 'sales' | 'customers' | 'notifications';
export const MODULE_LIST: ModuleName[] = ['products', 'sales', 'customers', 'notifications'];
export const ROLE_LIST: Exclude<Role, 'superuser'>[] = ['admin', 'manager', 'cashier', 'viewer'];

export interface User { _id: string; name: string; email: string; phone?: string; roles: Role[]; storeId?: string; isActive: boolean }
export interface Store {
  _id: string; name: string; status: 'active' | 'suspended'; enabledModules: ModuleName[];
  subscription?: { status: 'trial' | 'active' | 'expired'; expiresAt?: string; planId?: { name: string } };
}
export interface Product { _id: string; name: string; sku: string; category?: string; unit: 'pcs' | 'kg'; costPrice: number; salePrice: number; stock: number; lowStockThreshold: number }
export interface Customer { _id: string; name: string; phone?: string; address?: string; dueBalance: number }
export interface LedgerEntry { _id: string; type: 'sale' | 'payment' | 'adjustment'; amount: number; balanceAfter: number; note?: string; createdAt: string }
export interface SaleRow { _id: string; invoiceNo: string; total: number; paidAmount: number; dueAmount: number; paymentMethod: string; createdAt: string; customerId?: { name: string } }
export interface Plan { _id: string; name: string; code: string; priceBDT: number; durationDays: number; modules: ModuleName[]; isActive: boolean }
export interface Paged<T> { items: T[]; total: number; page: number; pages: number }
export interface SalesSummary {
  count: number; total: number; paid: number; due: number; discount: number; profit?: number;
  byDay: { date: string; count: number; total: number; due: number; profit?: number }[];
}
export interface StockMovementRow { _id: string; type: string; quantity: number; stockAfter?: number; note?: string; createdAt: string }

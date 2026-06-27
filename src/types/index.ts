export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  productCount: number;
  featured: boolean;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  sku: string;
  categoryId: string;
  category: string;
  description: string;
  shortDescription: string;
  images: string[];
  specifications: ProductSpecification[];
  sizes: ProductSize[];
  weight: string;
  materialType: string;
  unit: string;
  price: number;
  wholesalePrice?: number;
  minWholesaleQty?: number;
  stock: number;
  stockStatus: "in_stock" | "low_stock" | "out_of_stock";
  featured: boolean;
  bestSeller: boolean;
  createdAt: string;
  relatedProductIds: string[];
  deliveryInfo: string;
}

export interface ProductSpecification {
  label: string;
  value: string;
}

export interface ProductSize {
  name: string;
  dimensions: string;
  price: number;
  stock: number;
}

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  image: string;
  size: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  itemCount: number;
}

export interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company?: string;
  customerType: "homeowner" | "contractor" | "company" | "developer";
  addresses: Address[];
}

export interface Address {
  id: string;
  type: "shipping" | "billing";
  line1: string;
  line2?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault: boolean;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: string;
  shippingAddress: Address;
  billingAddress: Address;
  deliveryMethod: "pickup" | "delivery" | "truck_delivery";
  deliveryDate?: string;
  trackingNumber?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "on_hold";

export type PaymentStatus =
  | "pending"
  | "paid"
  | "failed"
  | "refunded"
  | "partial";

export interface OrderItem {
  productId: string;
  name: string;
  image: string;
  size: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Quote {
  id: string;
  quoteNumber: string;
  customerId: string;
  items: QuoteItem[];
  status: QuoteStatus;
  projectDetails?: string;
  projectFiles?: string[];
  deliveryAddress?: Address;
  notes?: string;
  subtotal: number;
  total: number;
  validUntil: string;
  createdAt: string;
  updatedAt: string;
}

export type QuoteStatus =
  | "draft"
  | "submitted"
  | "under_review"
  | "approved"
  | "rejected"
  | "expired"
  | "converted";

export interface QuoteItem {
  productId: string;
  name: string;
  size: string;
  quantity: number;
  estimatedUnitPrice?: number;
  totalPrice?: number;
}

export interface Testimonial {
  id: string;
  name: string;
  company: string;
  role: string;
  image: string;
  content: string;
  rating: number;
}

export interface DeliveryZone {
  id: string;
  name: string;
  coverage: string;
  fee: number;
  minOrderForFree: number;
  estimatedDays: string;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: "admin" | "manager" | "staff";
}

export interface SalesReport {
  totalOrders: number;
  totalRevenue: number;
  totalQuotes: number;
  conversionRate: number;
  topProducts: { productId: string; name: string; sales: number }[];
  dailySales: { date: string; amount: number }[];
  monthlySales: { month: string; amount: number }[];
}

export interface FilterOptions {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  size?: string;
  materialType?: string;
  availability?: "in_stock" | "out_of_stock";
  sort?: "price_asc" | "price_desc" | "name_asc" | "name_desc" | "newest";
}

export interface SearchResult {
  products: Product[];
  totalResults: number;
  query: string;
}

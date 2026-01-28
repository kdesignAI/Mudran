
export enum OrderStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  READY = 'READY',
  DELIVERED = 'DELIVERED',
}

export enum Role {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  STAFF = 'STAFF',
}

export enum WorkspaceStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  SUSPENDED = 'SUSPENDED',
}

export interface Workspace {
  id: string;
  name: string;
  ownerName: string;
  ownerPhone: string;
  createdAt: string;
  status: WorkspaceStatus;
  expiryDate?: string;
  subscriptionType?: '1_MONTH' | '6_MONTHS' | '1_YEAR' | 'TRIAL';
  hasPressPrinting?: boolean;
}

export interface User {
  id: string;
  name: string;
  role: Role;
  workspaceId: string;
}

export interface WhatsAppTemplate {
  id: string;
  title: string;
  text: string;
}

export interface AppSettings {
  softwareName: string;
  logoText: string;
  themeColor: string;
  logoUrl?: string;
  invoiceHeader?: string;
  whatsappTemplates?: WhatsAppTemplate[];
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address?: string;
  defaultDiscountType?: 'PERCENTAGE' | 'FIXED';
  defaultDiscountValue?: number;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  alertLevel: number;
}

export interface OrderItem {
  id: string;
  name: string;
  category: string; 
  description?: string;
  quantity: number;
  width?: number;
  height?: number;
  sqFt?: number;
  rate: number;
  total: number;
  paperType?: string;
  printSide?: 'Single' | 'Double';
  colorMode?: '1 Color' | '2 Color' | '3 Color' | '4 Color' | 'Full Color' | 'B/W';
  designLink?: string; // New: Design file link or specific note
}

export interface WhatsAppLog {
  id: string;
  sentAt: string;
  statusAtTime: OrderStatus;
}

export interface Order {
  id: string;
  orderNumber: string;
  customer: Customer;
  items: OrderItem[];
  subTotal: number;
  discount: number;
  grandTotal: number;
  paidAmount: number;
  dueAmount: number;
  status: OrderStatus;
  orderDate: string;
  deliveryDate: string;
  paymentHistory: PaymentRecord[];
  priority?: 'URGENT' | 'NORMAL' | 'LOW';
  assignedEmployeeId?: string;
  pressStage?: 'PLATE' | 'PRINT' | 'BIND' | 'COMPLETE';
  pressStartTime?: string;
  whatsappLogs?: WhatsAppLog[];
  orderNote?: string; // New: General order instructions for invoice
}

export interface PaymentRecord {
  id: string;
  date: string;
  amount: number;
  note?: string;
}

export interface Transaction {
  id: string;
  date: string;
  type: 'INCOME' | 'EXPENSE';
  category: string;
  amount: number;
  description: string;
  relatedOrderId?: string;
}

export interface Employee {
  id: string;
  name: string;
  designation: string;
  phone: string;
  baseSalary: number;
  joinedDate: string;
  role: Role;
}

export interface EmployeeTransaction {
  id: string;
  employeeId: string;
  date: string;
  type: 'SALARY_PAYMENT' | 'ADVANCE' | 'BONUS';
  amount: number;
  note?: string;
}

export interface PurchaseItem {
  inventoryItemId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
  category?: string;
  unit?: string;
}

export interface Purchase {
  id: string;
  purchaseNumber: string;
  supplierName: string;
  items: PurchaseItem[];
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  date: string;
  dueDate?: string;
}

export enum Tab {
  DASHBOARD = 'DASHBOARD',
  ORDERS = 'ORDERS',
  PRESS_JOBS = 'PRESS_JOBS',
  PURCHASES = 'PURCHASES',
  CUSTOMERS = 'CUSTOMERS',
  INVENTORY = 'INVENTORY',
  FINANCE = 'FINANCE',
  EMPLOYEES = 'EMPLOYEES',
  SETTINGS = 'SETTINGS',
  SUPER_ADMIN_PANEL = 'SUPER_ADMIN_PANEL',
}

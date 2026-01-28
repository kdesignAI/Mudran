
import { Customer, Employee, InventoryItem, Order, OrderStatus, Transaction, Role } from "./types";

export const MOCK_CUSTOMERS: Customer[] = [
  { id: 'c1', name: 'আলিফ এন্টারপ্রাইজ', phone: '01811112222', address: 'মতিঝিল, ঢাকা' },
  { id: 'c2', name: 'রহিম ফ্যাশন', phone: '01722223333', address: 'নিউ মার্কেট, ঢাকা' },
  { id: 'c3', name: 'কর্পোরেট সলিউশনস', phone: '01933334444', address: 'গুলশান ১, ঢাকা' },
];

export const MOCK_EMPLOYEES: Employee[] = [
  { id: '1', name: 'রহিম মিয়া', designation: 'ফ্লেক্স ডিজাইনার', phone: '01700000001', baseSalary: 15000, joinedDate: '2023-01-01', role: Role.MANAGER },
  { id: '2', name: 'করিম শেখ', designation: 'মেশিন অপারেটর', phone: '01700000002', baseSalary: 12000, joinedDate: '2023-03-15', role: Role.STAFF },
];

export const MOCK_INVENTORY: InventoryItem[] = [
  { id: 'inv1', name: 'স্টার ফ্লেক্স মিডিয়া', category: 'Raw Material', quantity: 10, unit: 'Roll', unitPrice: 3500, alertLevel: 2 },
  { id: 'inv2', name: 'ম্যাজিক মগ (Black)', category: 'Product', quantity: 45, unit: 'Pcs', unitPrice: 120, alertLevel: 10 },
  { id: 'inv3', name: 'ইকো সলভেন্ট কালি (C)', category: 'Raw Material', quantity: 5, unit: 'Liter', unitPrice: 1500, alertLevel: 2 },
  { id: 'inv4', name: 'ক্রিস্টাল ক্রেস্ট (Small)', category: 'Product', quantity: 20, unit: 'Pcs', unitPrice: 450, alertLevel: 5 },
  { id: 'inv5', name: 'উডেন ক্রেস্ট (A4)', category: 'Product', quantity: 15, unit: 'Pcs', unitPrice: 300, alertLevel: 3 },
  { id: 'inv6', name: 'ব্রান্ডিং টি-শার্ট (White)', category: 'Raw Material', quantity: 100, unit: 'Pcs', unitPrice: 150, alertLevel: 20 },
  { id: 'inv7', name: 'আইডি কার্ড রিবন', category: 'Raw Material', quantity: 50, unit: 'Roll', unitPrice: 200, alertLevel: 5 },
];

export const MOCK_ORDERS: Order[] = [
  {
    id: '101',
    orderNumber: 'ORD-2023-1001',
    customer: MOCK_CUSTOMERS[0],
    items: [
      { id: 'i1', name: 'PVC ব্যানার', category: 'Flex', width: 10, height: 5, sqFt: 50, rate: 20, quantity: 1, total: 1000 },
      { id: 'i2', name: 'ভিজিটিং কার্ড', category: 'Press', quantity: 1000, rate: 1.5, total: 1500 }
    ],
    subTotal: 2500,
    discount: 0,
    grandTotal: 2500,
    paidAmount: 1000,
    dueAmount: 1500,
    status: OrderStatus.PROCESSING,
    orderDate: new Date().toISOString(),
    deliveryDate: new Date(Date.now() + 86400000).toISOString(),
    paymentHistory: [
      { id: 'p1', date: new Date().toISOString(), amount: 1000, note: 'Advance' }
    ]
  }
];

export const MOCK_TRANSACTIONS: Transaction[] = [
  { id: 't1', date: new Date().toISOString(), type: 'INCOME', category: 'Order Payment', amount: 1000, description: 'Order #ORD-2023-1001 Advance', relatedOrderId: '101' },
  { id: 't2', date: new Date().toISOString(), type: 'EXPENSE', category: 'Raw Materials', amount: 5000, description: 'Ink and Media purchase' },
];

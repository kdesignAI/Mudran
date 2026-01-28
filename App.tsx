
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import OrderManager from './components/OrderManager';
import FinanceManager from './components/FinanceManager';
import EmployeeManager from './components/EmployeeManager';
import InventoryManager from './components/InventoryManager';
import CustomerManager from './components/CustomerManager';
import PurchaseManager from './components/PurchaseManager';
import SettingsManager from './components/SettingsManager';
import SuperAdminPanel from './components/SuperAdminPanel';
import PressJobManager from './components/PressJobManager';
import BottomNavigation from './components/BottomNavigation';
import Login from './components/Login';
import { Tab, Order, Transaction, InventoryItem, EmployeeTransaction, Employee, Customer, Purchase, User, Role, AppSettings, Workspace } from './types';
import { MOCK_ORDERS, MOCK_TRANSACTIONS, MOCK_EMPLOYEES, MOCK_INVENTORY, MOCK_CUSTOMERS } from './constants';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('mudran_saas_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [activeTab, setActiveTab] = useState<Tab>(Tab.DASHBOARD);

  // Global Workspace Management (for Super Admin)
  const [workspaces, setWorkspaces] = useState<Workspace[]>(() => {
    const saved = localStorage.getItem('mudran_saas_workspaces');
    return saved ? JSON.parse(saved) : [];
  });
  
  const currentWorkspace = workspaces.find(w => w.id === currentUser?.workspaceId);

  // Scoped Data Persistence Helper
  const getScopedKey = (key: string) => `mudran_${currentUser?.workspaceId || 'default'}_${key}`;

  const defaultTemplates = [
    { id: 't1', title: "ঈদ মোবারক অফার", text: "আসসালামু আলাইকুম, ঈদ উপলক্ষে আমাদের সকল প্রিন্টিং সার্ভিসে ১০% ডিসকাউন্ট চলছে। আজই আপনার অর্ডার কনফার্ম করুন! - মুদ্রণ সহযোগী।" },
    { id: 't2', title: "নতুন গ্রাহক অফার", text: "মুদ্রণ সহযোগীর নতুন গ্রাহক হিসেবে আপনার প্রথম অর্ডারে পাচ্ছেন ৫% বিশেষ ছাড়। আমাদের সেবা পরখ করে দেখুন। ধন্যবাদ।" }
  ];

  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem(getScopedKey('settings'));
    return saved ? JSON.parse(saved) : {
      softwareName: "মুদ্রণ সহযোগী",
      logoText: "M",
      themeColor: "#0891b2",
      logoUrl: "",
      invoiceHeader: "Premium Printing & Branding Solutions",
      whatsappTemplates: defaultTemplates
    };
  });

  // Central State Management
  const [orders, setOrders] = useState<Order[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employeeTransactions, setEmployeeTransactions] = useState<EmployeeTransaction[]>([]);

  // Load and Persist data
  useEffect(() => {
    if (currentUser) {
      const load = (key: string, mock: any) => {
        const saved = localStorage.getItem(getScopedKey(key));
        return saved ? JSON.parse(saved) : mock;
      };
      setOrders(load('orders', MOCK_ORDERS));
      setTransactions(load('transactions', MOCK_TRANSACTIONS));
      setInventory(load('inventory', MOCK_INVENTORY));
      setCustomers(load('customers', MOCK_CUSTOMERS));
      setEmployees(load('employees', MOCK_EMPLOYEES));
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser && currentUser.role !== Role.SUPER_ADMIN) {
      localStorage.setItem(getScopedKey('orders'), JSON.stringify(orders));
      localStorage.setItem(getScopedKey('transactions'), JSON.stringify(transactions));
      localStorage.setItem(getScopedKey('inventory'), JSON.stringify(inventory));
      localStorage.setItem(getScopedKey('customers'), JSON.stringify(customers));
      localStorage.setItem(getScopedKey('settings'), JSON.stringify(settings));
      localStorage.setItem(getScopedKey('employees'), JSON.stringify(employees));
    }
  }, [orders, transactions, inventory, customers, settings, employees]);

  const handleLogout = () => { setCurrentUser(null); localStorage.removeItem('mudran_saas_user'); };

  const addTransaction = (type: 'INCOME' | 'EXPENSE', amount: number, category: string, description: string, relatedOrderId?: string) => {
    const newTx: Transaction = { id: Date.now().toString(), date: new Date().toISOString(), type, amount, category, description, relatedOrderId };
    setTransactions(prev => [newTx, ...prev]);
  };

  const addEmployeeTransaction = (employeeId: string, type: 'SALARY_PAYMENT' | 'ADVANCE' | 'BONUS', amount: number, note: string) => {
    const newEmpTx: EmployeeTransaction = { id: Date.now().toString(), employeeId, date: new Date().toISOString(), type, amount, note };
    setEmployeeTransactions(prev => [newEmpTx, ...prev]);
  };

  if (!currentUser) return <Login onLogin={setCurrentUser} />;

  const renderContent = () => {
    switch (activeTab) {
      case Tab.DASHBOARD: return <Dashboard orders={orders} transactions={transactions} inventory={inventory} setActiveTab={setActiveTab} />;
      case Tab.ORDERS: return <OrderManager orders={orders} setOrders={setOrders} addTransaction={addTransaction} customers={customers} setCustomers={setCustomers} inventory={inventory} settings={settings} />;
      case Tab.PRESS_JOBS: return <PressJobManager orders={orders} setOrders={setOrders} employees={employees} settings={settings} />;
      case Tab.PURCHASES: return <PurchaseManager purchases={purchases} setPurchases={setPurchases} inventory={inventory} setInventory={setInventory} addTransaction={addTransaction} />;
      case Tab.CUSTOMERS: return <CustomerManager customers={customers} setCustomers={setCustomers} orders={orders} settings={settings} />;
      case Tab.INVENTORY: return <InventoryManager inventory={inventory} setInventory={setInventory} />;
      case Tab.FINANCE: return <FinanceManager transactions={transactions} addTransaction={addTransaction} employees={employees} orders={orders} addEmployeeTransaction={addEmployeeTransaction} />;
      case Tab.EMPLOYEES: return <EmployeeManager employees={employees} setEmployees={setEmployees} employeeTransactions={employeeTransactions} setEmployeeTransactions={setEmployeeTransactions} addTransaction={addTransaction} />;
      case Tab.SETTINGS: return <SettingsManager settings={settings} setSettings={setSettings} data={{ orders, transactions, inventory, customers, employees, purchases }} setters={{ setOrders, setTransactions, setInventory, setCustomers, setEmployees, setPurchases }} />;
      case Tab.SUPER_ADMIN_PANEL: return <SuperAdminPanel workspaces={workspaces} setWorkspaces={setWorkspaces} />;
      default: return <Dashboard orders={orders} transactions={transactions} inventory={inventory} setActiveTab={setActiveTab} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 overflow-x-hidden safe-top">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} user={currentUser} onLogout={handleLogout} settings={settings} workspace={currentWorkspace} />
      </div>
      
      {/* Main Container */}
      <main className="flex-1 overflow-y-auto max-h-screen pb-24 lg:pb-0 scroll-smooth">
        <div className="max-w-[1600px] mx-auto">
          {renderContent()}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden">
        <BottomNavigation activeTab={activeTab} setActiveTab={setActiveTab} user={currentUser} workspace={currentWorkspace} />
      </div>
    </div>
  );
};

export default App;

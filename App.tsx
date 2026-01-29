
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
import { ShieldAlert, Lock } from 'lucide-react';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('mudran_saas_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [activeTab, setActiveTab] = useState<Tab>(Tab.DASHBOARD);

  const [workspaces, setWorkspaces] = useState<Workspace[]>(() => {
    const saved = localStorage.getItem('mudran_saas_workspaces');
    return saved ? JSON.parse(saved) : [];
  });
  
  const currentWorkspace = workspaces.find(w => w.id === currentUser?.workspaceId);

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
      contactPhone: "+৮৮ ০১৭১১-২২২৩৩৩",
      contactWebsite: "www.yoursite.com",
      whatsappTemplates: defaultTemplates,
      whatsappGroupLink: "https://chat.whatsapp.com/example",
      facebookPageLink: "https://facebook.com/mudransahayogi",
      telegramChannelLink: "https://t.me/mudransahayogi"
    };
  });

  const [orders, setOrders] = useState<Order[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employeeTransactions, setEmployeeTransactions] = useState<EmployeeTransaction[]>([]);

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
    if (currentUser?.role === Role.SUPER_ADMIN || !currentUser) {
       localStorage.setItem(getScopedKey('settings'), JSON.stringify(settings));
    }
  }, [orders, transactions, inventory, customers, settings, employees, currentUser]);

  const handleLogout = () => { setCurrentUser(null); localStorage.removeItem('mudran_saas_user'); };

  const addTransaction = (type: 'INCOME' | 'EXPENSE', amount: number, category: string, description: string, relatedOrderId?: string) => {
    const newTx: Transaction = { id: Date.now().toString(), date: new Date().toISOString(), type, amount, category, description, relatedOrderId };
    setTransactions(prev => [newTx, ...prev]);
  };

  const addEmployeeTransaction = (employeeId: string, type: 'SALARY_PAYMENT' | 'ADVANCE' | 'BONUS', amount: number, note: string) => {
    const newEmpTx: EmployeeTransaction = { id: Date.now().toString(), employeeId, date: new Date().toISOString(), type, amount, note };
    setEmployeeTransactions(prev => [newEmpTx, ...prev]);
  };

  if (!currentUser) return <Login onLogin={setCurrentUser} settings={settings} />;

  const PermissionDenied = () => (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
      <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-3xl flex items-center justify-center mb-6 shadow-xl shadow-rose-100 animate-bounce">
        <Lock size={40} />
      </div>
      <h3 className="text-2xl font-black text-slate-800 tracking-tight">অ্যাক্সেস সংরক্ষিত</h3>
      <p className="text-slate-400 mt-2 max-w-xs font-bold leading-relaxed">দুঃখিত, আপনার রোল অনুযায়ী এই সেকশনটি দেখার অনুমতি নেই। অনুগ্রহ করে এডমিনের সাথে যোগাযোগ করুন।</p>
      <button onClick={() => setActiveTab(Tab.DASHBOARD)} className="mt-8 px-6 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg">ড্যাশবোর্ডে ফিরুন</button>
    </div>
  );

  const renderContent = () => {
    const role = currentUser.role;

    switch (activeTab) {
      case Tab.DASHBOARD: 
        return (role === Role.ADMIN || role === Role.MANAGER) ? <Dashboard orders={orders} transactions={transactions} inventory={inventory} setActiveTab={setActiveTab} /> : <PermissionDenied />;
      
      case Tab.ORDERS: 
        return <OrderManager orders={orders} setOrders={setOrders} addTransaction={addTransaction} customers={customers} setCustomers={setCustomers} inventory={inventory} settings={settings} />;
      
      case Tab.PRESS_JOBS: 
        return (role === Role.ADMIN || role === Role.MANAGER) ? <PressJobManager orders={orders} setOrders={setOrders} employees={employees} settings={settings} /> : <PermissionDenied />;
      
      case Tab.PURCHASES: 
        return (role === Role.ADMIN || role === Role.MANAGER) ? <PurchaseManager purchases={purchases} setPurchases={setPurchases} inventory={inventory} setInventory={setInventory} addTransaction={addTransaction} /> : <PermissionDenied />;
      
      case Tab.CUSTOMERS: 
        return <CustomerManager customers={customers} setCustomers={setCustomers} orders={orders} settings={settings} />;
      
      case Tab.INVENTORY: 
        return (role === Role.ADMIN || role === Role.MANAGER) ? <InventoryManager inventory={inventory} setInventory={setInventory} /> : <PermissionDenied />;
      
      case Tab.FINANCE: 
        return (role === Role.ADMIN || role === Role.MANAGER) ? <FinanceManager transactions={transactions} addTransaction={addTransaction} employees={employees} orders={orders} addEmployeeTransaction={addEmployeeTransaction} /> : <PermissionDenied />;
      
      case Tab.EMPLOYEES: 
        return (role === Role.ADMIN) ? <EmployeeManager employees={employees} setEmployees={setEmployees} employeeTransactions={employeeTransactions} setEmployeeTransactions={setEmployeeTransactions} addTransaction={addTransaction} /> : <PermissionDenied />;
      
      case Tab.SETTINGS: 
        return (role === Role.ADMIN) ? <SettingsManager settings={settings} setSettings={setSettings} data={{ orders, transactions, inventory, customers, employees, purchases }} setters={{ setOrders, setTransactions, setInventory, setCustomers, setEmployees, setPurchases }} /> : <PermissionDenied />;
      
      case Tab.SUPER_ADMIN_PANEL: 
        return (role === Role.SUPER_ADMIN) ? <SuperAdminPanel workspaces={workspaces} setWorkspaces={setWorkspaces} settings={settings} setSettings={setSettings} /> : <PermissionDenied />;
      
      default: 
        return <Dashboard orders={orders} transactions={transactions} inventory={inventory} setActiveTab={setActiveTab} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 overflow-x-hidden safe-top">
      <div className="hidden lg:block">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} user={currentUser} onLogout={handleLogout} settings={settings} workspace={currentWorkspace} />
      </div>
      <main className="flex-1 overflow-y-auto max-h-screen pb-24 lg:pb-0 scroll-smooth">
        <div className="max-w-[1600px] mx-auto">
          {renderContent()}
        </div>
      </main>
      <div className="lg:hidden">
        <BottomNavigation activeTab={activeTab} setActiveTab={setActiveTab} user={currentUser} workspace={currentWorkspace} />
      </div>
    </div>
  );
};

export default App;

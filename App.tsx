
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
import { Tab, Order, Transaction, InventoryItem, Customer, Employee, Purchase, User, Role, AppSettings, Workspace, EmployeeTransaction } from './types';

const API_URL = './api.php';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('mudran_saas_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [activeTab, setActiveTab] = useState<Tab>(Tab.DASHBOARD);
  const [loading, setLoading] = useState(false);

  const [settings, setSettings] = useState<AppSettings>({
    softwareName: "মুদ্রণ সহযোগী",
    logoText: "M",
    themeColor: "#0891b2",
    logoUrl: "",
    invoiceHeader: "Premium Printing & Branding Solutions",
    contactPhone: "+৮৮ ০১৭১১-২২২৩৩৩",
    contactWebsite: "www.yoursite.com"
  });

  const [orders, setOrders] = useState<Order[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);

  const refreshAllData = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      if (currentUser.role !== Role.SUPER_ADMIN) {
        const response = await fetch(`${API_URL}?action=get_all_data&workspace_id=${currentUser.workspaceId}`);
        if (!response.ok) throw new Error(`Fetch Error: ${response.status}`);
        const data = await response.json();
        
        if (data && !data.error) {
          if (data.settings) setSettings(data.settings);
          if (data.orders) setOrders(data.orders);
          if (data.transactions) setTransactions(data.transactions);
          if (data.inventory) setInventory(data.inventory);
          if (data.customers) setCustomers(data.customers);
          if (data.employees) setEmployees(data.employees);
          if (data.purchases) setPurchases(data.purchases);
        } else if (data && data.error) {
          console.error("API returned error:", data.error);
        }
      } else {
        const response = await fetch(`${API_URL}?action=get_workspaces`);
        if (!response.ok) throw new Error(`Fetch Workspaces Error: ${response.status}`);
        const data = await response.json();
        if (Array.isArray(data)) setWorkspaces(data);
      }
    } catch (err) {
      console.error("Data refresh failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      refreshAllData();
      // Role-based protection: Redirect unauthorized users from Super Admin Panel
      if (currentUser.role !== Role.SUPER_ADMIN && activeTab === Tab.SUPER_ADMIN_PANEL) {
        setActiveTab(Tab.DASHBOARD);
      }
    }
  }, [currentUser]);

  const apiSave = async (action: string, data: any) => {
    if (!currentUser) return false;
    try {
      const response = await fetch(`${API_URL}?action=${action}&workspace_id=${currentUser.workspaceId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const result = await response.json();
      if (result.status === 'success') {
        await refreshAllData(); // Force fetch fresh data from DB
        return true;
      } else {
        console.error("Save failed:", result.error);
        alert(`সেভ করতে ব্যর্থ হয়েছে: ${result.error}`);
        return false;
      }
    } catch (err) {
      console.error("Network error:", err);
      alert("সার্ভারের সাথে সংযোগ বিচ্ছিন্ন। পুনরায় চেষ্টা করুন।");
      return false;
    }
  };

  const addTransaction = async (type: 'INCOME' | 'EXPENSE', amount: number, category: string, description: string, relatedOrderId?: string, employeeId?: string) => {
    if (!currentUser) return;
    const newTx: Transaction = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      type,
      amount,
      category,
      description,
      relatedOrderId,
      employeeId
    };
    await apiSave('save_transaction', newTx);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('mudran_saas_user');
  };

  const onLoginSuccess = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('mudran_saas_user', JSON.stringify(user));
  };

  if (!currentUser) return <Login onLogin={onLoginSuccess} settings={settings} />;

  const renderContent = () => {
    const role = currentUser.role;
    if (loading && orders.length === 0) return (
      <div className="p-20 flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="font-black text-cyan-600 animate-pulse text-sm uppercase tracking-widest">ডাটা লোড হচ্ছে...</p>
      </div>
    );

    switch (activeTab) {
      case Tab.DASHBOARD: 
        return <Dashboard orders={orders} transactions={transactions} inventory={inventory} setActiveTab={setActiveTab} />;
      case Tab.ORDERS: 
        return <OrderManager orders={orders} setOrders={setOrders} onSaveOrder={(o) => apiSave('save_order', o)} addTransaction={addTransaction} customers={customers} setCustomers={setCustomers} inventory={inventory} settings={settings} />;
      case Tab.PRESS_JOBS:
        return <PressJobManager orders={orders} setOrders={setOrders} employees={employees} settings={settings} />;
      case Tab.CUSTOMERS:
        return <CustomerManager customers={customers} setCustomers={setCustomers} orders={orders} settings={settings} onSaveCustomer={(c) => apiSave('save_customer', c)} />;
      case Tab.FINANCE:
        return <FinanceManager transactions={transactions} addTransaction={addTransaction} employees={employees} orders={orders} addEmployeeTransaction={()=>{}} />;
      case Tab.INVENTORY:
        return <InventoryManager inventory={inventory} setInventory={setInventory} onSaveInventory={(i) => apiSave('save_inventory', i)} />;
      case Tab.PURCHASES:
        return <PurchaseManager purchases={purchases} setPurchases={setPurchases} inventory={inventory} setInventory={setInventory} addTransaction={addTransaction} onSavePurchase={(p) => apiSave('save_purchase', p)} />;
      case Tab.EMPLOYEES:
        return (
          <EmployeeManager 
            employees={employees} 
            setEmployees={setEmployees} 
            employeeTransactions={transactions.filter(t => !!t.employeeId) as any} 
            setEmployeeTransactions={()=>{}} 
            addTransaction={addTransaction} 
            onSaveEmployee={(e) => apiSave('save_employee', e)} 
          />
        );
      case Tab.SETTINGS:
        return <SettingsManager settings={settings} setSettings={(s) => { setSettings(s); apiSave('save_settings', s); }} data={{ orders, transactions, inventory, customers, employees, purchases }} setters={{ setOrders, setTransactions, setInventory, setCustomers, setEmployees, setPurchases }} />;
      case Tab.SUPER_ADMIN_PANEL: 
        return (role === Role.SUPER_ADMIN) ? <SuperAdminPanel workspaces={workspaces} setWorkspaces={setWorkspaces} settings={settings} setSettings={setSettings} /> : <div className="p-20 text-center text-red-500 font-bold uppercase tracking-widest bg-red-50 rounded-[3rem] m-6">Unauthorized: এই সেকশনে প্রবেশের অনুমতি নেই।</div>;
      default: 
        return <Dashboard orders={orders} transactions={transactions} inventory={inventory} setActiveTab={setActiveTab} />;
    }
  };

  const currentWorkspace = workspaces.find(w => w.id === currentUser.workspaceId);

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

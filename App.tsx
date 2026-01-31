
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

// Using a more robust relative path to ensure file is found in current directory
const API_URL = './api.php';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('mudran_saas_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [activeTab, setActiveTab] = useState<Tab>(Tab.DASHBOARD);
  const [loading, setLoading] = useState(false);
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);

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

  const checkApiStatus = async () => {
    try {
      const response = await fetch(`${API_URL}?action=ping`);
      if (response.ok) {
        setApiOnline(true);
        setLastError(null);
      } else {
        setApiOnline(false);
        setLastError(`API Ping Failed - Status: ${response.status}`);
      }
    } catch (e: any) {
      console.warn("API check failed:", e);
      setApiOnline(false);
      setLastError(`Connection Error: ${e.message}`);
    }
  };

  const refreshAllData = async () => {
    if (!currentUser) return;
    setLoading(true);
    setLastError(null);
    try {
      if (currentUser.role !== Role.SUPER_ADMIN) {
        const fullUrl = `${API_URL}?action=get_all_data&workspace_id=${currentUser.workspaceId}`;
        const response = await fetch(fullUrl);
        
        if (!response.ok) {
          setApiOnline(false);
          throw new Error(`HTTP ${response.status}: ${fullUrl} not found or server error.`);
        }
        
        const data = await response.json();
        
        if (data && !data.error) {
          if (data.settings) setSettings(data.settings);
          if (data.orders) setOrders(data.orders);
          if (data.transactions) setTransactions(data.transactions);
          if (data.inventory) setInventory(data.inventory);
          if (data.customers) setCustomers(data.customers);
          if (data.employees) setEmployees(data.employees);
          if (data.purchases) setPurchases(data.purchases);
          setApiOnline(true);
        } else if (data && data.error) {
          console.error("API Error:", data.error);
          setLastError(data.error);
        }
      } else {
        const response = await fetch(`${API_URL}?action=get_workspaces`);
        if (!response.ok) throw new Error(`Super Admin Fetch Error: ${response.status}`);
        const data = await response.json();
        if (Array.isArray(data)) {
          setWorkspaces(data);
          setApiOnline(true);
        }
      }
    } catch (err: any) {
      console.error("Critical Data Load Error:", err);
      setApiOnline(false);
      setLastError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkApiStatus();
    if (currentUser) {
      refreshAllData();
      if (currentUser.role !== Role.SUPER_ADMIN && activeTab === Tab.SUPER_ADMIN_PANEL) {
        setActiveTab(Tab.DASHBOARD);
      }
    }
  }, [currentUser]);

  const apiSave = async (action: string, data: any) => {
    if (!currentUser) return false;
    try {
      const fullUrl = `${API_URL}?action=${action}&workspace_id=${currentUser.workspaceId}`;
      const response = await fetch(fullUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        throw new Error(`Save failed with status ${response.status} at ${fullUrl}`);
      }

      const result = await response.json();
      if (result.status === 'success') {
        await refreshAllData(); 
        return true;
      } else {
        console.error("API logic error:", result.error);
        alert(`ত্রুটি: ${result.error}`);
        return false;
      }
    } catch (err: any) {
      console.error("Network or API path error:", err);
      alert(`সার্ভারের সাথে যোগাযোগ করতে ব্যর্থ। এরর: ${err.message}`);
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
        <p className="font-black text-cyan-600 animate-pulse text-sm uppercase tracking-widest">সার্ভার থেকে ডাটা লোড হচ্ছে...</p>
      </div>
    );

    if (apiOnline === false && orders.length === 0) return (
      <div className="p-10 sm:p-20 text-center flex flex-col items-center gap-6 animate-in fade-in duration-500">
        <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center shadow-inner">
          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
        </div>
        <div className="max-w-md">
          <h2 className="text-2xl font-black text-slate-800 mb-2">সার্ভার কানেকশন এরর (404/500)</h2>
          <p className="text-slate-500 font-medium mb-4">api.php ফাইলটি খুঁজে পাওয়া যাচ্ছে না অথবা আপনার ইন্টারনেট/হোস্টিংয়ে সমস্যা হচ্ছে।</p>
          {lastError && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-[10px] font-mono text-red-600 break-all mb-4">
               ERROR: {lastError}
            </div>
          )}
          <div className="flex flex-col gap-2">
            <button onClick={() => { checkApiStatus(); refreshAllData(); }} className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-black transition-all">
               পুনরায় চেষ্টা করুন
            </button>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">নিশ্চিত করুন api.php এবং index.html একই ফোল্ডারে আছে</p>
          </div>
        </div>
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
      {(apiOnline === false && currentUser && orders.length > 0) && (
        <div className="fixed top-4 right-4 bg-red-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-2xl animate-bounce z-[200]">
           Server Offline (404)
        </div>
      )}
    </div>
  );
};

export default App;

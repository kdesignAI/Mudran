
import React from 'react';
import { Order, Transaction, InventoryItem, Tab } from '../types';
import { ShoppingCart, Banknote, Package, Users, TrendingUp, Clock, ChevronRight, LayoutPanelTop, PlusCircle, Calculator } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface DashboardProps {
  orders: Order[];
  transactions: Transaction[];
  inventory: InventoryItem[];
  setActiveTab: (tab: Tab) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ orders, transactions, inventory, setActiveTab }) => {
  const totalDue = orders.reduce((acc, order) => acc + (order.dueAmount || 0), 0);
  const pendingOrders = orders.filter(o => o.status === 'PENDING' || o.status === 'PROCESSING').length;
  const lowStockItems = inventory.filter(item => item.quantity <= item.alertLevel);

  const totalReceived = transactions.filter(t => t.type === 'INCOME').reduce((acc, t) => acc + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'EXPENSE').reduce((acc, t) => acc + t.amount, 0);

  const pipeline = {
    plate: orders.filter(o => o.pressStage === 'PLATE').length,
    print: orders.filter(o => o.pressStage === 'PRINT').length,
    bind: orders.filter(o => o.pressStage === 'BIND').length,
  };

  const chartData = [
    { name: 'আয়', amount: totalReceived, color: '#0891b2' },
    { name: 'ব্যয়', amount: totalExpense, color: '#f43f5e' },
    { name: 'বকেয়া', amount: totalDue, color: '#f59e0b' },
  ];

  const StatCard = ({ title, value, icon: Icon, color, bgCircle }: any) => (
    <div className="bg-white p-5 rounded-[2rem] shadow-sm border border-slate-100 relative overflow-hidden flex items-center gap-4 group hover:shadow-md transition-all duration-300">
      <div className={`w-12 h-12 rounded-2xl ${bgCircle} ${color} flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-110`}>
        <Icon size={24} />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 truncate">{title}</p>
        <p className="text-xl font-black text-slate-800 tracking-tight leading-none">{value}</p>
      </div>
    </div>
  );

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto pb-24 lg:pb-6">
      <header className="flex flex-col sm:row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight leading-none">ড্যাশবোর্ড সারাংশ</h2>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-2 flex items-center gap-2">
            <Clock size={14}/> {new Date().toLocaleDateString('bn-BD', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="bg-emerald-50 px-4 py-2 rounded-2xl border border-emerald-100 flex items-center gap-2">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
          <span className="text-[9px] font-black uppercase tracking-widest text-emerald-700">সিস্টেম অনলাইন</span>
        </div>
      </header>
      
      {/* Quick Actions Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {[
          { label: 'নতুন অর্ডার', icon: PlusCircle, tab: Tab.ORDERS, color: 'bg-cyan-600 shadow-cyan-900/10' },
          { label: 'হিসাব', icon: Calculator, tab: Tab.FINANCE, color: 'bg-slate-900 shadow-slate-900/10' },
          { label: 'স্টক চেক', icon: Package, tab: Tab.INVENTORY, color: 'bg-indigo-600 shadow-indigo-900/10' },
          { label: 'প্রেস প্রিন্ট', icon: LayoutPanelTop, tab: Tab.PRESS_JOBS, color: 'bg-amber-600 shadow-amber-900/10' }
        ].map((action) => (
          <button 
            key={action.label}
            onClick={() => setActiveTab(action.tab)}
            className={`${action.color} text-white p-4 sm:p-5 rounded-3xl flex flex-col sm:flex-row items-center sm:justify-between gap-3 group transition-all hover:-translate-y-1 shadow-xl active:scale-95`}
          >
            <span className="text-[10px] font-black uppercase tracking-widest text-center sm:text-left">{action.label}</span>
            <action.icon size={22} className="opacity-70 group-hover:opacity-100 transition-opacity" />
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="চলমান অর্ডার" value={pendingOrders} icon={ShoppingCart} color="text-orange-500" bgCircle="bg-orange-50" />
        <StatCard title="মোট বকেয়া" value={`৳${Math.round(totalDue).toLocaleString()}`} icon={Banknote} color="text-rose-500" bgCircle="bg-rose-50" />
        <StatCard title="স্টক অ্যালার্ট" value={lowStockItems.length} icon={Package} color="text-cyan-600" bgCircle="bg-cyan-50" />
        <StatCard title="মোট গ্রাহক" value={Array.from(new Set(orders.map(o => o.customer.id))).length} icon={Users} color="text-indigo-600" bgCircle="bg-indigo-50" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-white p-6 sm:p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col min-h-[350px]">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <TrendingUp size={16} className="text-cyan-500" /> আয়-ব্যয় পরিসংখ্যান
            </h3>
            <div className="flex gap-4">
               {chartData.map(d => (
                 <div key={d.name} className="flex items-center gap-2">
                   <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }}></div>
                   <span className="text-[9px] font-black text-slate-500 uppercase tracking-tighter">{d.name}</span>
                 </div>
               ))}
            </div>
          </div>
          <div className="flex-1 w-full min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 900}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 900}} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{borderRadius: '1.5rem', border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.1)', padding: '1rem', fontSize: '12px'}}
                />
                <Bar dataKey="amount" radius={[12, 12, 0, 0]} barSize={50}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-4 bg-white p-6 sm:p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8 flex items-center gap-2">
            <LayoutPanelTop className="text-cyan-500" size={16} /> প্রেস প্রোডাকশন বোর্ড
          </h3>
          <div className="space-y-7 flex-1">
             {[
               { label: 'Plate Processing', count: pipeline.plate, color: 'bg-amber-500' },
               { label: 'Live Printing', count: pipeline.print, color: 'bg-blue-500' },
               { label: 'Binding & Finishing', count: pipeline.bind, color: 'bg-purple-500' }
             ].map(step => (
               <div key={step.label} className="group cursor-pointer">
                  <div className="flex justify-between items-end mb-2">
                     <span className="text-[11px] font-black text-slate-600 uppercase tracking-tight">{step.label}</span>
                     <span className="text-sm font-black text-slate-900">{step.count} টি জব</span>
                  </div>
                  <div className="w-full h-3 bg-slate-50 rounded-full overflow-hidden border border-slate-100 p-0.5 shadow-inner">
                     <div 
                       className={`h-full ${step.color} transition-all duration-1000 group-hover:brightness-110 rounded-full`} 
                       style={{ width: step.count > 0 ? `${Math.min(step.count * 20, 100)}%` : '0%' }}
                     ></div>
                  </div>
               </div>
             ))}
          </div>
          <button 
            onClick={() => setActiveTab(Tab.PRESS_JOBS)}
            className="mt-10 w-full py-4 bg-slate-50 border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center justify-center gap-2 hover:bg-slate-100 hover:text-cyan-600 transition-all shadow-sm"
          >
            পুরো পাইপলাইন দেখুন <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

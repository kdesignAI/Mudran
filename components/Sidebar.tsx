
import React from 'react';
import { LayoutDashboard, ShoppingCart, Calculator, Users, Package, UserCircle, ShoppingBag, LogOut, Settings, ShieldAlert, Printer } from 'lucide-react';
import { Tab, Role, User, AppSettings, Workspace } from '../types';

interface SidebarProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  user: User;
  onLogout: () => void;
  settings: AppSettings;
  workspace?: Workspace;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, user, onLogout, settings, workspace }) => {
  const menuItems = [
    { id: Tab.SUPER_ADMIN_PANEL, label: 'সিস্টেম এডমিন', icon: ShieldAlert, roles: [Role.SUPER_ADMIN] },
    { id: Tab.DASHBOARD, label: 'ড্যাশবোর্ড', icon: LayoutDashboard, roles: [Role.ADMIN, Role.MANAGER] },
    { id: Tab.ORDERS, label: 'অর্ডার ও ইনভয়েস', icon: ShoppingCart, roles: [Role.ADMIN, Role.MANAGER, Role.STAFF] },
    { id: Tab.PRESS_JOBS, label: 'প্রেস প্রিন্টিং', icon: Printer, roles: [Role.ADMIN, Role.MANAGER], premium: true },
    { id: Tab.PURCHASES, label: 'ক্রয় (Purchase)', icon: ShoppingBag, roles: [Role.ADMIN, Role.MANAGER] },
    { id: Tab.CUSTOMERS, label: 'গ্রাহক তালিকা', icon: UserCircle, roles: [Role.ADMIN, Role.MANAGER, Role.STAFF] },
    { id: Tab.INVENTORY, label: 'স্টক / ইনভেন্টরি', icon: Package, roles: [Role.ADMIN, Role.MANAGER, Role.STAFF] },
    { id: Tab.FINANCE, label: 'হিসাব নিকাশ', icon: Calculator, roles: [Role.ADMIN, Role.MANAGER] },
    { id: Tab.EMPLOYEES, label: 'কর্মচারী', icon: Users, roles: [Role.ADMIN] },
    { id: Tab.SETTINGS, label: 'সেটিিংস', icon: Settings, roles: [Role.ADMIN] },
  ];

  const filteredItems = menuItems.filter(item => {
    // Role check
    if (!item.roles.includes(user.role)) return false;
    
    // Premium feature check (Press Printing)
    if (item.premium && !workspace?.hasPressPrinting) return false;
    
    return true;
  });

  return (
    <div className={`w-64 text-white min-h-screen flex flex-col no-print shadow-2xl z-40 transition-colors ${user.role === Role.SUPER_ADMIN ? 'bg-slate-950' : 'bg-[#0f172a]'}`}>
      <div className="p-6 flex items-center space-x-3 border-b border-white/5">
        <div 
          className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-2xl transition-all duration-500 overflow-hidden shrink-0"
          style={user.role === Role.SUPER_ADMIN ? { backgroundColor: '#ef4444' } : (!settings.logoUrl ? { backgroundColor: settings.themeColor } : {})}
        >
          {user.role === Role.SUPER_ADMIN ? (
            <ShieldAlert size={22} />
          ) : settings.logoUrl ? (
            <img src={settings.logoUrl} alt="Logo" className="w-full h-full object-cover" />
          ) : (
            <span className="font-black text-xl">{settings.logoText}</span>
          )}
        </div>
        <div className="overflow-hidden">
          <h1 className="text-base font-black tracking-tight leading-none mb-1 truncate">
            {user.role === Role.SUPER_ADMIN ? 'System Control' : settings.softwareName}
          </h1>
          <span className={`text-[8px] font-black uppercase tracking-widest opacity-80 ${user.role === Role.SUPER_ADMIN ? 'text-red-400' : 'text-cyan-400'}`}>
            {user.role === Role.SUPER_ADMIN ? 'Administrator' : 'Workspace'}
          </span>
        </div>
      </div>

      <div className="p-4 overflow-y-auto flex-1 custom-scrollbar">
        <div className="bg-white/5 p-3 rounded-xl border border-white/5 mb-6">
          <div className="flex items-center gap-2.5">
             <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black transition-colors shrink-0 ${user.role === Role.SUPER_ADMIN ? 'bg-red-900/40 text-red-300' : 'bg-slate-700 text-slate-300'}`}>
               {user.name.charAt(0)}
             </div>
             <div className="overflow-hidden">
               <p className="font-bold text-xs truncate text-slate-100">{user.name}</p>
               <span className={`text-[7px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md border border-white/10 mt-1 inline-block ${user.role === Role.SUPER_ADMIN ? 'text-red-400' : 'text-slate-400'}`}>
                 {user.role}
               </span>
             </div>
          </div>
        </div>

        <nav className="space-y-1">
          {filteredItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 group ${
                activeTab === item.id
                  ? 'text-white shadow-lg'
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
              style={activeTab === item.id ? { backgroundColor: user.role === Role.SUPER_ADMIN ? '#ef4444' : settings.themeColor } : {}}
            >
              <item.icon className={`w-4 h-4 transition-transform duration-300 ${activeTab === item.id ? 'scale-110' : 'group-hover:scale-110'}`} />
              <span className={`font-bold text-xs ${activeTab === item.id ? 'translate-x-1' : ''}`}>{item.label}</span>
            </button>
          ))}
        </nav>
      </div>

      <div className="p-4 space-y-3 border-t border-white/5 bg-black/10">
        <button 
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 py-3 border border-white/5 rounded-xl text-slate-400 hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/20 transition-all font-black text-[9px] uppercase tracking-widest"
        >
          <LogOut size={14} /> সাইন আউট
        </button>
        <div className="text-[7px] text-slate-700 text-center font-black uppercase tracking-[0.2em]">
          &copy; Mudran Sahayogi v2.5
        </div>
      </div>
    </div>
  );
};

export default Sidebar;

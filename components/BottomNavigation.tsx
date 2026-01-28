
import React from 'react';
import { LayoutGrid, Users, Receipt, Calculator, Menu, ShieldAlert, Printer } from 'lucide-react';
import { Tab, Role, User, Workspace } from '../types';

interface BottomNavigationProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  user: User;
  workspace?: Workspace;
}

const BottomNavigation: React.FC<BottomNavigationProps> = ({ activeTab, setActiveTab, user, workspace }) => {
  const navItems = [
    { id: Tab.DASHBOARD, label: 'হোম', icon: LayoutGrid, roles: [Role.ADMIN, Role.MANAGER] },
    { id: Tab.ORDERS, label: 'অর্ডার', icon: Receipt, roles: [Role.ADMIN, Role.MANAGER, Role.STAFF] },
    { id: Tab.PRESS_JOBS, label: 'প্রেস', icon: Printer, roles: [Role.ADMIN, Role.MANAGER], premium: true },
    { id: Tab.FINANCE, label: 'হিসাব', icon: Calculator, roles: [Role.ADMIN, Role.MANAGER] },
    { id: Tab.SETTINGS, label: 'মেনু', icon: Menu, roles: [Role.ADMIN, Role.MANAGER, Role.STAFF] },
    { id: Tab.SUPER_ADMIN_PANEL, label: 'সিস্টেম', icon: ShieldAlert, roles: [Role.SUPER_ADMIN] },
  ];

  const filteredItems = navItems.filter(item => {
    if (!item.roles.includes(user.role)) return false;
    if (item.premium && !workspace?.hasPressPrinting) return false;
    return true;
  });

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 flex justify-around items-center px-1 pt-3 pb-6 lg:hidden z-50 shadow-[0_-10px_30px_rgba(0,0,0,0.05)] rounded-t-[2.5rem] safe-bottom">
      {filteredItems.map((item) => (
        <button
          key={item.id}
          onClick={() => setActiveTab(item.id)}
          className="flex flex-col items-center gap-1.5 flex-1 transition-all active:scale-90"
        >
          <div className={`p-2.5 rounded-2xl transition-all ${
            activeTab === item.id 
              ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-200' 
              : 'text-slate-300'
          }`}>
            <item.icon size={22} strokeWidth={activeTab === item.id ? 2.5 : 2} />
          </div>
          <span className={`text-[9px] font-black uppercase tracking-wider ${
            activeTab === item.id ? 'text-cyan-700' : 'text-slate-400'
          }`}>
            {item.label}
          </span>
        </button>
      ))}
    </nav>
  );
};

export default BottomNavigation;

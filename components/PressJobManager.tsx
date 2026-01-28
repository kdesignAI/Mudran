
import React, { useState, useMemo } from 'react';
import { Order, AppSettings, OrderStatus, Employee } from '../types';
import { Printer, Layout, Scissors, CheckCircle2, Clock, Search, Filter, FileText, Layers, UserPlus, Calendar, X, ChevronRight, Hash, Zap, AlertTriangle, Users, RotateCcw } from 'lucide-react';

interface PressJobManagerProps {
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  employees: Employee[];
  settings: AppSettings;
}

const PressJobManager: React.FC<PressJobManagerProps> = ({ orders, setOrders, employees, settings }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState<'ALL' | 'PLATE' | 'PRINT' | 'BIND' | 'COMPLETE'>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [customerFilter, setCustomerFilter] = useState<string>('ALL');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Extract all orders that qualify as "Press" jobs
  const allPressOrders = useMemo(() => {
    return orders.filter(order => 
      order.items.some(item => 
        item.category === 'Press' || 
        (!['Flex', 'Gift', 'Crest', 'Branding'].includes(item.category) && item.paperType)
      )
    );
  }, [orders]);

  // Get unique customer list from press jobs for the filter dropdown
  const uniqueCustomers = useMemo(() => {
    const customers = allPressOrders.map(o => o.customer.name);
    return Array.from(new Set(customers)).sort();
  }, [allPressOrders]);

  // Filter and SORT logic
  const filteredPressOrders = useMemo(() => {
    return allPressOrders
      .filter(order => {
        const matchesSearch = 
          order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) || 
          order.customer.name.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesStage = stageFilter === 'ALL' || (order.pressStage || 'PLATE') === stageFilter;
        
        const matchesStatus = statusFilter === 'ALL' || order.status === statusFilter;
        
        const matchesCustomer = customerFilter === 'ALL' || order.customer.name === customerFilter;

        let matchesDate = true;
        if (startDate) {
          matchesDate = matchesDate && new Date(order.orderDate) >= new Date(startDate);
        }
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          matchesDate = matchesDate && new Date(order.orderDate) <= end;
        }

        return matchesSearch && matchesStage && matchesStatus && matchesCustomer && matchesDate;
      })
      .sort((a, b) => {
        // Sort Priority: URGENT > NORMAL > LOW
        const pMap = { 'URGENT': 3, 'NORMAL': 2, 'LOW': 1, undefined: 0 };
        const pA = pMap[a.priority || 'NORMAL'];
        const pB = pMap[b.priority || 'NORMAL'];
        if (pB !== pA) return pB - pA;
        return new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime();
      });
  }, [allPressOrders, searchTerm, stageFilter, statusFilter, customerFilter, startDate, endDate]);

  const updateOrderPressData = (orderId: string, updates: Partial<Order>) => {
    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        const newUpdates = { ...updates };
        if (updates.pressStage === 'PRINT' && !o.pressStartTime) {
          newUpdates.pressStartTime = new Date().toISOString();
        }
        return { ...o, ...newUpdates };
      }
      return o;
    }));
  };

  const getTimeElapsed = (startTime?: string) => {
    if (!startTime) return null;
    const diff = new Date().getTime() - new Date(startTime).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours > 0 ? hours + 'h ' : ''}${mins}m`;
  };

  const resetFilters = () => {
    setSearchTerm('');
    setStageFilter('ALL');
    setStatusFilter('ALL');
    setCustomerFilter('ALL');
    setStartDate('');
    setEndDate('');
  };

  const labelClass = "block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5";
  const filterInputClass = "bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-600 outline-none focus:ring-4 focus:ring-cyan-500/10 transition-all w-full";

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto animate-in fade-in duration-500">
      <header className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3 tracking-tight">
            <Printer className="text-cyan-600" /> প্রোডাকশন কন্ট্রোল বোর্ড
          </h2>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">প্রেস এবং অফসেট জবের রিয়েল-টাইম ট্র্যাকিং</p>
        </div>
        <div className="flex gap-2">
           <button 
            onClick={resetFilters}
            className="flex items-center gap-2 bg-white border border-slate-200 text-slate-400 px-4 py-2 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:text-cyan-600 hover:border-cyan-200 transition-all"
           >
              <RotateCcw size={14} /> রিসেট ফিল্টার
           </button>
           <div className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-2xl text-[9px] font-black uppercase tracking-widest shadow-lg">
              <Zap size={14} className="text-amber-400 animate-pulse" /> Live Monitoring Active
           </div>
        </div>
      </header>

      {/* Production Stage Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { id: 'PLATE', label: 'Plate', count: allPressOrders.filter(o => o.pressStage === 'PLATE' || !o.pressStage).length, color: 'text-amber-500', bg: 'bg-amber-50' },
          { id: 'PRINT', label: 'Printing', count: allPressOrders.filter(o => o.pressStage === 'PRINT').length, color: 'text-blue-500', bg: 'bg-blue-50' },
          { id: 'BIND', label: 'Binding', count: allPressOrders.filter(o => o.pressStage === 'BIND').length, color: 'text-purple-500', bg: 'bg-purple-50' },
          { id: 'COMPLETE', label: 'Done Today', count: allPressOrders.filter(o => o.pressStage === 'COMPLETE').length, color: 'text-emerald-500', bg: 'bg-emerald-50' }
        ].map(s => (
          <button 
            key={s.label} 
            onClick={() => setStageFilter(stageFilter === s.id ? 'ALL' : s.id as any)}
            className={`${s.bg} p-4 rounded-3xl border ${stageFilter === s.id ? 'border-cyan-500 ring-2 ring-cyan-100 shadow-md' : 'border-white/50'} flex items-center justify-between group transition-all text-left w-full`}
          >
             <div>
                <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">{s.label}</p>
                <p className={`text-2xl font-black ${s.color}`}>{s.count}</p>
             </div>
             <div className={`w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm ${stageFilter === s.id ? 'opacity-100' : 'opacity-40'} group-hover:opacity-100 transition-opacity`}>
                <Layout size={18} className={s.color} />
             </div>
          </button>
        ))}
      </div>

      {/* NEW PROMINENT FILTER PANEL */}
      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden mb-8">
        <div className="p-6 bg-slate-50/50">
           <div className="flex items-center gap-2 mb-6">
              <Filter size={16} className="text-cyan-600" />
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">অ্যাডভান্সড সার্চ ফিল্টার প্যানেল</h3>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              {/* Search Bar */}
              <div className="lg:col-span-2">
                <label className={labelClass}>জব আইডি বা কাস্টমার খুঁজুন</label>
                <div className="relative group">
                   <Search className="absolute left-3.5 top-2.5 text-slate-400 group-focus-within:text-cyan-500 transition-colors" size={16} />
                   <input 
                    type="text" 
                    placeholder="যেমন: ORD-2023-1001..." 
                    className={filterInputClass + " pl-11"} 
                    value={searchTerm} 
                    onChange={e => setSearchTerm(e.target.value)} 
                   />
                </div>
              </div>

              {/* Order Status Filter */}
              <div>
                 <label className={labelClass}>অর্ডার স্ট্যাটাস</label>
                 <select className={filterInputClass} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                    <option value="ALL">সব স্ট্যাটাস</option>
                    {Object.values(OrderStatus).map(s => <option key={s} value={s}>{s}</option>)}
                 </select>
              </div>

              {/* Customer Filter */}
              <div>
                 <label className={labelClass}>নির্দিষ্ট গ্রাহক</label>
                 <div className="relative group">
                    <Users className="absolute left-3.5 top-2.5 text-slate-300" size={14} />
                    <select className={filterInputClass + " pl-10"} value={customerFilter} onChange={e => setCustomerFilter(e.target.value)}>
                        <option value="ALL">সব গ্রাহক</option>
                        {uniqueCustomers.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                 </div>
              </div>

              {/* Date Range Group */}
              <div className="lg:col-span-1 flex flex-col sm:flex-row gap-3">
                 <div className="flex-1">
                    <label className={labelClass}>শুরু তারিখ</label>
                    <input type="date" className={filterInputClass} value={startDate} onChange={e => setStartDate(e.target.value)} />
                 </div>
                 <div className="flex-1">
                    <label className={labelClass}>শেষ তারিখ</label>
                    <input type="date" className={filterInputClass} value={endDate} onChange={e => setEndDate(e.target.value)} />
                 </div>
              </div>
           </div>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-400 font-black text-[10px] uppercase tracking-widest">
              <tr>
                <th className="px-8 py-4">জব ডিটেইলস</th>
                <th className="px-8 py-4">স্পেসিফিকেশন</th>
                <th className="px-8 py-4 text-center">টাইমলাইন</th>
                <th className="px-8 py-4 text-center">প্রোডাকশন কন্ট্রোল</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredPressOrders.map(order => (
                <tr key={order.id} className={`hover:bg-slate-50/50 transition-colors ${order.priority === 'URGENT' ? 'bg-rose-50/10' : ''}`}>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                       <div className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center font-black shadow-sm ${order.priority === 'URGENT' ? 'bg-rose-500 text-white shadow-rose-200' : 'bg-slate-900 text-white'}`}>
                          <span className="text-[8px] opacity-60">ORD</span>
                          <span className="text-sm">#{order.orderNumber.split('-').pop()}</span>
                       </div>
                       <div>
                          <p className="font-black text-slate-800 text-sm leading-tight">{order.customer.name}</p>
                          <div className="flex items-center gap-2 mt-1.5">
                             {order.priority === 'URGENT' && (
                                <span className="text-[7px] font-black bg-rose-100 text-rose-600 px-1.5 py-0.5 rounded uppercase tracking-tighter flex items-center gap-0.5 animate-pulse">
                                  <AlertTriangle size={8}/> Urgent
                                </span>
                             )}
                             <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded border ${
                                order.status === OrderStatus.READY ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                order.status === OrderStatus.PROCESSING ? 'bg-cyan-50 text-cyan-600 border-cyan-100' :
                                'bg-slate-50 text-slate-400 border-slate-100'
                             }`}>
                                {order.status}
                             </span>
                             <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1 ml-1">
                               <Calendar size={10}/> {new Date(order.orderDate).toLocaleDateString('bn-BD')}
                             </span>
                          </div>
                       </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="space-y-1.5">
                       {order.items.filter(i => i.category === 'Press' || i.paperType).map((item, idx) => (
                         <div key={idx} className="flex flex-col gap-0.5 bg-slate-50 p-2 rounded-lg border border-slate-100 max-w-[240px]">
                            <p className="font-bold text-slate-700 text-[11px] truncate">{item.name}</p>
                            <div className="flex flex-wrap items-center gap-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                               <span className="text-cyan-600 font-black">{item.quantity} pcs</span>
                               <span>•</span>
                               <span>{item.paperType}</span>
                               <span>•</span>
                               <span className="text-amber-600">{item.colorMode}</span>
                            </div>
                         </div>
                       ))}
                    </div>
                  </td>
                  <td className="px-8 py-6 text-center">
                    {order.pressStage === 'PRINT' ? (
                      <div className="flex flex-col items-center gap-1">
                        <div className="flex items-center gap-1.5 text-blue-600 font-black text-[10px] uppercase tracking-widest">
                           <Clock size={12} className="animate-spin-slow" /> Printing
                        </div>
                        <span className="text-[9px] text-slate-400 font-bold">Elapsed: {getTimeElapsed(order.pressStartTime) || '0m'}</span>
                      </div>
                    ) : order.pressStage === 'COMPLETE' ? (
                      <div className="text-emerald-500 font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-1">
                         <CheckCircle2 size={12}/> Finished
                      </div>
                    ) : (
                      <span className="text-slate-300 font-black text-[9px] uppercase tracking-widest">Waiting in Queue</span>
                    )}
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex justify-center gap-3">
                       {[
                         { id: 'PLATE', icon: Layout, label: 'Plate' },
                         { id: 'PRINT', icon: Printer, label: 'Print' },
                         { id: 'BIND', icon: Scissors, label: 'Finish' },
                         { id: 'COMPLETE', icon: CheckCircle2, label: 'Done' }
                       ].map(stage => {
                         const isCurrent = (order.pressStage || 'PLATE') === stage.id;
                         return (
                           <button 
                             key={stage.id}
                             onClick={() => updateOrderPressData(order.id, { pressStage: stage.id as any })}
                             className={`flex flex-col items-center gap-1.5 transition-all group ${isCurrent ? 'scale-110' : 'opacity-30 hover:opacity-70'}`}
                           >
                              <div className={`w-10 h-10 rounded-[1rem] flex items-center justify-center border-2 transition-colors ${
                                isCurrent ? 'bg-cyan-600 text-white border-cyan-400 shadow-lg shadow-cyan-100' : 'bg-slate-50 border-slate-100 text-slate-400'
                              }`}>
                                <stage.icon size={16} />
                              </div>
                              <span className={`text-[8px] font-black uppercase tracking-wider ${isCurrent ? 'text-cyan-600' : 'text-slate-400'}`}>{stage.label}</span>
                           </button>
                         )
                       })}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredPressOrders.length === 0 && (
                <tr>
                   <td colSpan={4} className="px-8 py-24 text-center">
                      <div className="flex flex-col items-center justify-center text-slate-300 gap-3">
                         <Search size={48} className="opacity-20" />
                         <p className="text-sm font-black uppercase tracking-widest text-slate-400">কোনো তথ্য খুঁজে পাওয়া যায়নি</p>
                         <button onClick={resetFilters} className="text-[10px] font-black text-cyan-600 uppercase border-b border-cyan-600 pb-0.5 hover:text-cyan-700">ফিল্টার রিসেট করুন</button>
                      </div>
                   </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PressJobManager;

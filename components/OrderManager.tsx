
import React, { useState, useEffect, useMemo } from 'react';
import { Order, OrderItem, OrderStatus, Customer, InventoryItem, AppSettings } from '../types';
import { Plus, Trash2, Printer, Search, X, Phone, MapPin, Zap, MessageCircle, PlusCircle, Link as LinkIcon, FileText, Globe } from 'lucide-react';
import { smartSearch } from '../utils/searchUtils';

interface OrderManagerProps {
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  onSaveOrder: (order: Order) => Promise<boolean>;
  addTransaction: (type: 'INCOME' | 'EXPENSE', amount: number, category: string, description: string, orderId: string) => void;
  customers: Customer[];
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
  inventory: InventoryItem[];
  settings: AppSettings;
}

const SQFT_BASED_CATEGORIES = [
  'Flex', 'PVC', 'PANAFLEX', 'VINYL', 'REFLECTIVE STIKER', '3D STIKER', 
  'CLEAR STIKER', 'BLOCK LIGHT PVC', 'ONE WAY VISION', 
  'SPARKLE LAMINATION', 'MAT LAMINATION', 'NORMAL GLOSSY LAMINATION'
];

const COMMON_PAPER_TYPES = [
  '80gsm Offset', '100gsm Offset', '120gsm Offset', '60gsm Newsprint', 
  '100gsm Art Paper', '120gsm Art Paper', '150gsm Art Paper', 
  '250gsm Art Card', '300gsm Art Card', 'Duplex Board', 
  'Sticker Paper', 'Bond Paper', 'Tracing Paper', 'Tissue Paper'
];

const OrderManager: React.FC<OrderManagerProps> = ({ orders, setOrders, onSaveOrder, addTransaction, customers, setCustomers, inventory, settings }) => {
  const [view, setView] = useState<'LIST' | 'CREATE'>('LIST');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isNewCustomerMode, setIsNewCustomerMode] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustAddress, setNewCustAddress] = useState('');

  const [currentItems, setCurrentItems] = useState<OrderItem[]>([]);
  const [itemName, setItemName] = useState('');
  const [itemCategory, setItemCategory] = useState<string>('Flex');
  const [width, setWidth] = useState<string>('0');
  const [height, setHeight] = useState<string>('0');
  const [quantity, setQuantity] = useState<string>('1');
  const [rate, setRate] = useState<string>('0');
  const [designLink, setDesignLink] = useState('');
  const [priority, setPriority] = useState<'URGENT' | 'NORMAL' | 'LOW'>('NORMAL');

  const [paperType, setPaperType] = useState('80gsm Offset');
  const [printSide, setPrintSide] = useState<'Single' | 'Double'>('Single');
  const [colorMode, setColorMode] = useState<'Full Color' | '1 Color' | '2 Color' | '3 Color' | '4 Color' | 'B/W'>('Full Color');

  const [discount, setDiscount] = useState<string>('0');
  const [advance, setAdvance] = useState<string>('0');
  const [orderNote, setOrderNote] = useState('');

  const inputClass = "w-full p-3 border border-slate-200 rounded-2xl bg-white text-slate-800 focus:ring-4 focus:ring-cyan-500/10 outline-none placeholder:text-slate-400 transition-all text-sm shadow-sm";
  const labelClass = "block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1";

  const isItemSqFt = useMemo(() => SQFT_BASED_CATEGORIES.includes(itemCategory), [itemCategory]);

  const calculateCurrentItemTotal = () => {
    const q = parseFloat(quantity) || 0;
    const r = parseFloat(rate) || 0;
    const w = parseFloat(width) || 0;
    const h = parseFloat(height) || 0;
    if (isItemSqFt) return Math.round(w * h * r * q);
    return Math.round(r * q);
  };

  const calculateTotals = () => {
    const subTotal = currentItems.reduce((acc, item) => acc + (item.total || 0), 0);
    const disc = parseFloat(discount) || 0;
    const adv = parseFloat(advance) || 0;
    const grandTotal = Math.max(0, Math.round(subTotal - disc));
    const dueAmount = grandTotal - adv;
    return { subTotal, grandTotal, dueAmount };
  };

  const handleAddItem = () => {
    if (!itemName || parseFloat(rate) <= 0 || parseFloat(quantity) <= 0) return;
    const q = parseFloat(quantity) || 0;
    const r = parseFloat(rate) || 0;
    const w = parseFloat(width) || 0;
    const h = parseFloat(height) || 0;
    
    const newItem: OrderItem = {
      id: Date.now().toString(),
      name: itemName,
      category: itemCategory,
      quantity: q,
      width: isItemSqFt ? w : undefined,
      height: isItemSqFt ? h : undefined,
      sqFt: isItemSqFt ? (w * h) : undefined,
      rate: r,
      total: calculateCurrentItemTotal(),
      paperType: itemCategory === 'Press' ? paperType : undefined,
      printSide: itemCategory === 'Press' ? printSide : undefined,
      colorMode: itemCategory === 'Press' ? colorMode : undefined,
      designLink: designLink.trim() || undefined
    };

    setCurrentItems([...currentItems, newItem]);
    setItemName(''); setWidth('0'); setHeight('0'); setQuantity('1'); setRate('0'); setDesignLink('');
  };

  const handleCreateOrder = async () => {
    const { subTotal, grandTotal, dueAmount } = calculateTotals();
    let finalCust = selectedCustomer;
    
    if (isNewCustomerMode) {
      if (!newCustName || !newCustPhone) { alert("নাম ও ফোন দিন"); return; }
      finalCust = { id: Date.now().toString(), name: newCustName, phone: newCustPhone, address: newCustAddress };
    }
    
    if (!finalCust || currentItems.length === 0) { alert("গ্রাহক ও অন্তত একটি পণ্য যোগ করুন"); return; }

    setLoading(true);
    const orderId = Date.now().toString();
    const finalAdv = parseFloat(advance) || 0;
    
    const newOrder: Order = {
      id: orderId,
      orderNumber: `ORD-${new Date().getFullYear()}-${orders.length + 1001}`,
      customer: finalCust,
      items: currentItems,
      subTotal: Math.round(subTotal),
      discount: Math.round(parseFloat(discount) || 0),
      grandTotal: Math.round(grandTotal),
      paidAmount: Math.round(finalAdv),
      dueAmount: Math.round(dueAmount),
      status: OrderStatus.PENDING,
      orderDate: new Date().toISOString(),
      deliveryDate: new Date().toISOString(),
      paymentHistory: finalAdv > 0 ? [{ id: Date.now().toString(), date: new Date().toISOString(), amount: finalAdv, note: 'Advance' }] : [],
      priority,
      orderNote: orderNote.trim() || undefined
    };

    const success = await onSaveOrder(newOrder);
    if (success) {
      if (finalAdv > 0) addTransaction('INCOME', finalAdv, 'Order Payment', `Advance for #${newOrder.orderNumber}`, orderId);
      setView('LIST');
      resetOrderState();
    } else {
      alert("অর্ডার সেভ করতে সমস্যা হয়েছে। দয়া করে ইন্টারনেট কানেকশন চেক করুন।");
    }
    setLoading(false);
  };

  const resetOrderState = () => {
    setSelectedCustomer(null); setIsNewCustomerMode(false); setNewCustName(''); setNewCustPhone('');
    setCurrentItems([]); setDiscount('0'); setAdvance('0'); setOrderNote(''); setPriority('NORMAL');
  };

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    const order = orders.find(o => o.id === orderId);
    if (order) {
      const updatedOrder = { ...order, status: newStatus };
      await onSaveOrder(updatedOrder);
    }
  };

  const handleSendStatusWhatsApp = (order: Order) => {
    const msg = `আসসালামু আলাইকুম ${order.customer.name}, আপনার অর্ডার #${order.orderNumber.split('-').pop()} এর স্ট্যাটাস: ${order.status}। ধন্যবাদ।`;
    const phone = order.customer.phone.startsWith('0') ? '88' + order.customer.phone : order.customer.phone;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const filteredOrders = smartSearch<Order>(orders, searchTerm, ['orderNumber', 'customer.name', 'customer.phone']).filter(o => 
    (filterStatus === 'ALL' || o.status === filterStatus)
  );

  if (view === 'CREATE') {
    const { grandTotal, dueAmount } = calculateTotals();
    return (
      <div className="p-4 sm:p-6 max-w-7xl mx-auto pb-24 lg:pb-6 animate-in fade-in duration-300">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl sm:text-2xl font-black text-slate-800 flex items-center gap-2"><PlusCircle className="text-cyan-600" /> নতুন অর্ডার</h2>
          <button onClick={() => setView('LIST')} className="text-xs font-black uppercase text-slate-400 hover:text-red-500 bg-slate-100 px-4 py-2 rounded-xl">বন্ধ করুন</button>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 space-y-6">
             <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
                <label className={labelClass}>অর্ডার প্রায়োরিটি</label>
                <div className="grid grid-cols-3 gap-2 mb-6">
                   {(['LOW', 'NORMAL', 'URGENT'] as const).map(p => (
                     <button key={p} onClick={() => setPriority(p)} className={`py-3 rounded-2xl text-[10px] font-black uppercase border transition-all ${priority === p ? 'bg-cyan-600 text-white border-cyan-600 shadow-md' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>{p}</button>
                   ))}
                </div>
                <label className={labelClass}>গ্রাহক নির্বাচন</label>
                {!isNewCustomerMode ? (
                  <div className="space-y-3">
                    <select className={inputClass} onChange={e => e.target.value === 'NEW' ? setIsNewCustomerMode(true) : setSelectedCustomer(customers.find(c => c.id === e.target.value) || null)} value={selectedCustomer?.id || ""}>
                      <option value="" disabled>গ্রাহক খুঁজুন...</option>
                      <option value="NEW" className="text-cyan-600 font-bold">+ নতুন গ্রাহক</option>
                      {customers.map(c => <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>)}
                    </select>
                  </div>
                ) : (
                  <div className="space-y-3 p-4 bg-cyan-50/50 rounded-2xl border border-cyan-100 animate-in slide-in-from-top-2">
                    <input type="text" placeholder="কাস্টমার নাম" className={inputClass} value={newCustName} onChange={e => setNewCustName(e.target.value)} />
                    <input type="tel" placeholder="মোবাইল নাম্বার" className={inputClass} value={newCustPhone} onChange={e => setNewCustPhone(e.target.value)} />
                    <button onClick={() => setIsNewCustomerMode(false)} className="text-[10px] font-black uppercase text-cyan-600 w-full text-center">তালিকায় ফিরুন</button>
                  </div>
                )}
             </div>
             <div className="bg-slate-900 p-6 rounded-[2.5rem] text-white space-y-4 shadow-xl lg:sticky lg:top-6">
                <div className="flex justify-between font-black text-lg border-b border-white/10 pb-3">
                  <span className="text-[10px] uppercase text-slate-400 tracking-widest self-center">সর্বমোট বিল:</span>
                  <span className="text-cyan-400 text-2xl font-mono">৳{grandTotal}</span>
                </div>
                <div className="space-y-4">
                   <div className="grid grid-cols-2 gap-3">
                     <div>
                       <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">ডিসকাউন্ট</label>
                       <input type="number" className="w-full bg-white/5 border border-white/10 p-3 rounded-2xl text-white outline-none focus:ring-1 focus:ring-cyan-500" value={discount} onChange={e => setDiscount(e.target.value)} />
                     </div>
                     <div>
                       <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">অগ্রিম (Cash)</label>
                       <input type="number" className="w-full bg-white/5 border border-white/10 p-3 rounded-2xl text-emerald-400 font-bold outline-none focus:ring-1 focus:ring-emerald-500" value={advance} onChange={e => setAdvance(e.target.value)} />
                     </div>
                   </div>
                   <div>
                     <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">ইনভয়েস নোট</label>
                     <textarea className="w-full bg-white/5 border border-white/10 p-3 rounded-2xl text-slate-300 text-xs outline-none h-20 resize-none" value={orderNote} onChange={e => setOrderNote(e.target.value)} placeholder="বিশেষ দ্রষ্টব্য..."></textarea>
                   </div>
                </div>
                <div className="flex justify-between font-black text-rose-400 text-xl pt-3 border-t border-white/10">
                  <span className="text-[10px] uppercase tracking-widest self-center">নিট বকেয়া:</span>
                  <span className="text-3xl font-mono">৳{dueAmount}</span>
                </div>
                <button 
                  onClick={handleCreateOrder} 
                  disabled={loading}
                  className="w-full py-4 bg-cyan-600 rounded-[1.5rem] font-black text-xs uppercase tracking-widest shadow-lg hover:brightness-110 active:scale-[0.97] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? 'সেভ হচ্ছে...' : 'অর্ডার কনফার্ম করুন'} <Zap size={14} />
                </button>
             </div>
          </div>
          <div className="lg:col-span-8 space-y-6">
             <div className="bg-white p-5 sm:p-7 rounded-[2.5rem] border border-slate-100 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                   <div className="md:col-span-2">
                      <label className={labelClass}>পণ্যের বিবরণ/নাম</label>
                      <input type="text" className={inputClass} value={itemName} onChange={e => setItemName(e.target.value)} placeholder="আইটেমের নাম লিখুন" />
                   </div>
                   <div>
                      <label className={labelClass}>ক্যাটাগরি</label>
                      <select className={inputClass} value={itemCategory} onChange={e => setItemCategory(e.target.value)}>
                         <option value="Flex">Flex</option>
                         <option value="Press">Press</option>
                         <option value="Gift">Gift</option>
                         {SQFT_BASED_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                   </div>
                   <div>
                      <label className={labelClass}>পরিমাণ (Qty)</label>
                      <input type="number" className={inputClass} value={quantity} onChange={e => setQuantity(e.target.value)} />
                   </div>
                   {isItemSqFt ? (
                      <div className="md:col-span-4 grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-3xl border border-slate-100 animate-in slide-in-from-top-1">
                         <div><label className={labelClass}>প্রস্থ (Width ft)</label><input type="number" className={inputClass} value={width} onChange={e => setWidth(e.target.value)} /></div>
                         <div><label className={labelClass}>উচ্চতা (Height ft)</label><input type="number" className={inputClass} value={height} onChange={e => setHeight(e.target.value)} /></div>
                      </div>
                   ) : itemCategory === 'Press' ? (
                      <div className="md:col-span-4 grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-3xl border border-slate-100 animate-in slide-in-from-top-1">
                         <div>
                            <label className={labelClass}>কাগজের ধরন</label>
                            <input list="paper-types" className={inputClass} value={paperType} onChange={e => setPaperType(e.target.value)} />
                            <datalist id="paper-types">{COMMON_PAPER_TYPES.map(type => <option key={type} value={type} />)}</datalist>
                         </div>
                         <div><label className={labelClass}>প্রিন্ট সাইড</label><select className={inputClass} value={printSide} onChange={e => setPrintSide(e.target.value as any)}><option value="Single">Single Side</option><option value="Double">Double Side</option></select></div>
                         <div><label className={labelClass}>কালার মোড</label><select className={inputClass} value={colorMode} onChange={e => setColorMode(e.target.value as any)}><option value="Full Color">Full Color</option><option value="1 Color">1 Color</option></select></div>
                      </div>
                   ) : null}
                   <div className="md:col-span-2">
                      <label className={labelClass}>ডিজাইন লিংক / ফাইল পাথ</label>
                      <input className={inputClass} value={designLink} onChange={e => setDesignLink(e.target.value)} placeholder="ডিজাইন লিংক থাকলে দিন" />
                   </div>
                   <div className="md:col-span-1">
                      <label className={labelClass}>দর (৳)</label>
                      <input type="number" className={inputClass} value={rate} onChange={e => setRate(e.target.value)} />
                   </div>
                   <div className="md:col-span-1 flex items-end">
                      <button onClick={handleAddItem} className="w-full bg-slate-900 text-white h-[50px] rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-black transition-all"><Plus size={18}/> আইটেম যোগ</button>
                   </div>
                </div>
                <div className="border border-slate-100 rounded-3xl overflow-hidden bg-slate-50/50">
                   <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-slate-100 text-slate-400 font-black uppercase tracking-widest">
                          <tr>
                            <th className="px-5 py-4">বিবরণ</th>
                            <th className="px-5 py-4 text-center">মাপ/Qty</th>
                            <th className="px-5 py-4 text-right">দর</th>
                            <th className="px-5 py-4 text-right">মোট</th>
                            <th className="px-5 py-4 text-right"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {currentItems.map((item, idx) => (
                            <tr key={item.id} className="bg-white">
                              <td className="px-5 py-4 font-bold text-slate-800">{item.name}</td>
                              <td className="px-5 py-4 text-center font-bold text-slate-600">
                                {SQFT_BASED_CATEGORIES.includes(item.category) ? `${item.height}x${item.width}` : `${item.quantity} pcs`}
                              </td>
                              <td className="px-5 py-4 text-right">৳{item.rate}</td>
                              <td className="px-5 py-4 text-right font-black text-slate-900">৳{Math.round(item.total)}</td>
                              <td className="px-5 py-4 text-right">
                                <button onClick={() => setCurrentItems(currentItems.filter((_, i) => i !== idx))} className="text-red-300 hover:text-red-500"><Trash2 size={18}/></button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 pb-24 lg:pb-6">
       <div className="flex justify-between items-center no-print">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">অর্ডার তালিকা</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{filteredOrders.length} টি অর্ডার পাওয়া গেছে</p>
          </div>
          <button onClick={() => setView('CREATE')} className="bg-cyan-600 text-white px-5 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-cyan-900/10 flex items-center gap-2 hover:brightness-110 active:scale-95 transition-all">
            <Plus size={18}/> নতুন অর্ডার
          </button>
       </div>

       <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden no-print">
          <div className="p-4 bg-slate-50/50 flex flex-col sm:flex-row gap-4">
             <div className="relative flex-1">
                <Search className="absolute left-4 top-3.5 text-slate-400" size={18} />
                <input type="text" placeholder="অর্ডার বা কাস্টমার খুঁজুন..." className="w-full pl-12 p-3.5 bg-white border border-slate-200 rounded-[1.25rem] text-sm font-medium focus:ring-4 focus:ring-cyan-500/10 outline-none transition-all shadow-sm" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
             </div>
             <select className="bg-white border border-slate-200 px-4 py-3 rounded-2xl text-[10px] font-black uppercase text-slate-400 outline-none" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                <option value="ALL">সব স্ট্যাটাস</option>
                {Object.values(OrderStatus).map(s => <option key={s} value={s}>{s}</option>)}
             </select>
          </div>
          <div className="overflow-x-auto">
             <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-400 font-black text-[10px] uppercase tracking-widest border-b border-slate-100">
                   <tr>
                     <th className="px-6 sm:px-8 py-5">অর্ডার / গ্রাহক</th>
                     <th className="px-6 py-5 text-center hidden sm:table-cell">স্ট্যাটাস</th>
                     <th className="px-6 sm:px-8 py-5 text-right">আর্থিক (৳)</th>
                     <th className="px-6 sm:px-8 py-5 text-center">অ্যাকশন</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                   {filteredOrders.map(order => (
                     <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                       <td className="px-6 sm:px-8 py-5">
                          <p className="font-black text-slate-800 text-sm leading-tight">#{order.orderNumber.split('-').pop()} - {order.customer.name}</p>
                          <p className="text-[9px] text-slate-400 font-bold mt-0.5">{order.customer.phone}</p>
                       </td>
                       <td className="px-6 py-5 text-center hidden sm:table-cell">
                          <select 
                            value={order.status}
                            onChange={(e) => handleStatusChange(order.id, e.target.value as OrderStatus)}
                            className="text-[8px] font-black uppercase px-2 py-1 rounded-lg border outline-none cursor-pointer"
                          >
                            {Object.values(OrderStatus).map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                       </td>
                       <td className="px-6 sm:px-8 py-5 text-right">
                          <p className="font-black text-slate-800 text-sm">৳{Math.round(order.grandTotal).toLocaleString()}</p>
                          <p className={`text-[9px] font-black mt-0.5 ${order.dueAmount > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                             {order.dueAmount > 0 ? `বকেয়া: ৳${Math.round(order.dueAmount).toLocaleString()}` : 'পরিশোধিত'}
                          </p>
                       </td>
                       <td className="px-6 sm:px-8 py-5 text-center flex justify-center gap-2">
                             <button onClick={() => handleSendStatusWhatsApp(order)} className="p-2.5 text-emerald-600 bg-emerald-50 rounded-xl" title="WhatsApp Status Update"><MessageCircle size={16} /></button>
                             <button onClick={() => setSelectedOrder(order)} className="p-2.5 text-cyan-600 bg-cyan-50 rounded-xl" title="Print Invoice"><Printer size={16} /></button>
                       </td>
                     </tr>
                   ))}
                </tbody>
             </table>
          </div>
       </div>

       {selectedOrder && (
         <div className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center p-0 sm:p-4 backdrop-blur-md print-invoice-modal">
            <div className="bg-white w-full h-full sm:h-auto sm:max-w-3xl sm:rounded-[1.5rem] shadow-2xl relative flex flex-col overflow-hidden animate-in zoom-in duration-300 print-area">
               <div className="p-4 border-b border-slate-50 flex justify-between items-center bg-white shrink-0 no-print">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Globe size={14}/> Invoice View</span>
                  <div className="flex gap-2">
                     <button onClick={() => window.print()} className="bg-slate-900 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 hover:bg-black transition-all">
                        <Printer size={16} /> প্রিন্ট ইনভয়েস
                     </button>
                     <button onClick={() => setSelectedOrder(null)} className="p-2 text-slate-400 hover:text-red-500 transition-colors"><X size={24}/></button>
                  </div>
               </div>
               
               <div className="flex-1 p-6 sm:p-8 bg-white overflow-y-auto">
                  <div className="space-y-6">
                     <div className="flex justify-between items-start border-b-2 border-slate-900 pb-5">
                        <div className="flex gap-3 items-center">
                           <div className="w-12 h-12 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black text-xl">
                              {settings.logoUrl ? <img src={settings.logoUrl} className="w-full h-full object-cover"/> : settings.logoText}
                           </div>
                           <div>
                              <h2 className="text-xl font-black text-slate-900 tracking-tight leading-none mb-1">{settings.softwareName}</h2>
                              <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">{settings.invoiceHeader}</p>
                           </div>
                        </div>
                        <div className="text-right">
                           <h1 className="text-3xl font-black text-slate-900 leading-none">INVOICE</h1>
                           <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">ID: #{selectedOrder.orderNumber}</p>
                        </div>
                     </div>

                     <div className="grid grid-cols-2 gap-8 py-2">
                        <div className="space-y-1 text-left">
                           <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Customer Details</p>
                           <h4 className="font-black text-slate-800 text-base leading-tight">{selectedOrder.customer.name}</h4>
                           <p className="text-xs font-bold text-slate-600 flex items-center gap-1.5"><Phone size={12}/> {selectedOrder.customer.phone}</p>
                           {selectedOrder.customer.address && <p className="text-[10px] text-slate-500 flex items-center gap-1.5"><MapPin size={12}/> {selectedOrder.customer.address}</p>}
                        </div>
                        <div className="text-right space-y-1">
                           <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Billing Summary</p>
                           <p className="text-xs font-bold text-slate-800">Date: {new Date(selectedOrder.orderDate).toLocaleDateString('bn-BD')}</p>
                           <p className="text-[10px] font-black uppercase text-slate-500">Status: {selectedOrder.status}</p>
                        </div>
                     </div>

                     <div className="border border-slate-200 rounded-[1.25rem] overflow-hidden">
                        <table className="w-full text-xs text-left">
                           <thead className="bg-slate-900 text-white font-black uppercase text-[9px] tracking-widest">
                              <tr>
                                 <th className="px-5 py-3">Description</th>
                                 <th className="px-5 py-3 text-center">Size/Qty</th>
                                 <th className="px-5 py-3 text-right">Rate</th>
                                 <th className="px-5 py-3 text-right">Total</th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-slate-100">
                              {selectedOrder.items.map((item, idx) => (
                                 <tr key={idx}>
                                    <td className="px-5 py-3">
                                       <p className="font-black text-slate-800 text-xs mb-1">{item.name}</p>
                                       <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-1.5 py-0.5 rounded">{item.category}</span>
                                    </td>
                                    <td className="px-5 py-3 text-center font-bold text-slate-600">
                                       {SQFT_BASED_CATEGORIES.includes(item.category) ? `${item.height}x${item.width}` : `${item.quantity} pcs`}
                                    </td>
                                    <td className="px-5 py-3 text-right">৳{item.rate}</td>
                                    <td className="px-5 py-3 text-right font-black text-slate-900">৳{Math.round(item.total)}</td>
                                 </tr>
                              ))}
                           </tbody>
                        </table>
                     </div>

                     <div className="flex flex-col sm:flex-row justify-between items-start gap-6">
                        <div className="flex-1 w-full sm:max-w-[45%] text-left">
                           {selectedOrder.orderNote && (
                              <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                                 <h5 className="text-[9px] font-black text-slate-400 uppercase mb-1.5 flex items-center gap-1.5"><FileText size={12}/> Notes:</h5>
                                 <p className="text-[11px] text-slate-600 leading-snug font-medium italic">"{selectedOrder.orderNote}"</p>
                              </div>
                           )}
                        </div>

                        <div className="w-full sm:w-64 bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3">
                           <div className="space-y-2 pb-2 border-b border-slate-200">
                              <div className="flex justify-between text-slate-500 font-bold text-[10px] uppercase">
                                 <span>Sub-Total:</span>
                                 <span>৳{Math.round(selectedOrder.subTotal)}</span>
                              </div>
                              <div className="flex justify-between text-slate-500 font-bold text-[10px] uppercase">
                                 <span>Discount:</span>
                                 <span>-৳{Math.round(selectedOrder.discount)}</span>
                              </div>
                              <div className="flex justify-between text-emerald-600 font-black text-[10px] uppercase">
                                 <span>Received:</span>
                                 <span>৳{Math.round(selectedOrder.paidAmount)}</span>
                              </div>
                           </div>
                           <div className="space-y-1">
                              <div className="flex justify-between text-slate-900 font-black text-sm uppercase">
                                 <span>Grand Total:</span>
                                 <span>৳{Math.round(selectedOrder.grandTotal)}</span>
                              </div>
                              <div className={`flex justify-between p-2.5 rounded-xl font-black uppercase text-center mt-2 ${selectedOrder.dueAmount > 0 ? 'bg-rose-600 text-white shadow-lg shadow-rose-200' : 'bg-emerald-600 text-white'}`}>
                                 <span className="text-[10px] self-center">Net Due:</span>
                                 <span className="text-xl font-mono leading-none">৳{Math.round(selectedOrder.dueAmount)}</span>
                              </div>
                           </div>
                        </div>
                     </div>

                     <div className="pt-4 border-t border-slate-100 flex justify-between items-center text-slate-400 text-[9px] font-black uppercase tracking-[0.1em]">
                        <div className="flex gap-4">
                           <span className="flex items-center gap-1.5"><Phone size={12}/> {settings.contactPhone}</span>
                           <span className="flex items-center gap-1.5"><Globe size={12}/> {settings.contactWebsite}</span>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
         </div>
       )}
    </div>
  );
};

export default OrderManager;

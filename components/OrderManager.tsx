
import React, { useState, useEffect, useMemo } from 'react';
import { Order, OrderItem, OrderStatus, Customer, InventoryItem, AppSettings, WhatsAppLog } from '../types';
import { Plus, Trash2, Printer, Search, X, Phone, MapPin, Tag, Zap, Send, PlusCircle, Layers, CopyCheck, Percent, FileText, Link as LinkIcon, AlertCircle, ChevronDown } from 'lucide-react';
import { smartSearch } from '../utils/searchUtils';

interface OrderManagerProps {
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
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

const OrderManager: React.FC<OrderManagerProps> = ({ orders, setOrders, addTransaction, customers, setCustomers, inventory, settings }) => {
  const [view, setView] = useState<'LIST' | 'CREATE'>('LIST');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isNewCustomerMode, setIsNewCustomerMode] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustAddress, setNewCustAddress] = useState('');

  const [customCategories, setCustomCategories] = useState<string[]>(() => {
    const saved = localStorage.getItem('mudran_custom_categories');
    const defaults = ['Flex', 'Press', 'Gift', ...SQFT_BASED_CATEGORIES];
    return saved ? JSON.parse(saved) : Array.from(new Set(defaults));
  });
  const [isAddingNewCategory, setIsAddingNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  // Item Form
  const [currentItems, setCurrentItems] = useState<OrderItem[]>([]);
  const [itemName, setItemName] = useState('');
  const [itemCategory, setItemCategory] = useState<string>('Flex');
  const [width, setWidth] = useState<string>('0');
  const [height, setHeight] = useState<string>('0');
  const [quantity, setQuantity] = useState<string>('1');
  const [rate, setRate] = useState<string>('0');
  const [designLink, setDesignLink] = useState('');
  const [priority, setPriority] = useState<'URGENT' | 'NORMAL' | 'LOW'>('NORMAL');

  // Press Specific
  const [paperType, setPaperType] = useState('80gsm Offset');
  const [printSide, setPrintSide] = useState<'Single' | 'Double'>('Single');
  const [colorMode, setColorMode] = useState<'Full Color' | '1 Color' | '2 Color' | '3 Color' | '4 Color' | 'B/W'>('Full Color');

  // Summary
  const [discount, setDiscount] = useState<string>('0');
  const [advance, setAdvance] = useState<string>('0');
  const [orderNote, setOrderNote] = useState('');
  const [isDiscountFromProfile, setIsDiscountFromProfile] = useState(false);

  const inputClass = "w-full p-3 border border-slate-200 rounded-2xl bg-white text-slate-800 focus:ring-4 focus:ring-cyan-500/10 outline-none placeholder:text-slate-400 transition-all text-sm shadow-sm";
  const labelClass = "block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1";

  useEffect(() => {
    localStorage.setItem('mudran_custom_categories', JSON.stringify(customCategories));
  }, [customCategories]);

  const allAvailableCategories = useMemo(() => {
    const fromOrders = orders.flatMap(o => o.items.map(i => i.category));
    return Array.from(new Set([...customCategories, ...fromOrders])).sort();
  }, [orders, customCategories]);

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

  useEffect(() => {
    const subTotal = currentItems.reduce((acc, item) => acc + (item.total || 0), 0);
    if (selectedCustomer && subTotal > 0) {
      let calcDisc = 0;
      if (selectedCustomer.defaultDiscountType === 'PERCENTAGE' && selectedCustomer.defaultDiscountValue) {
        calcDisc = Math.round((subTotal * selectedCustomer.defaultDiscountValue) / 100);
      } else if (selectedCustomer.defaultDiscountType === 'FIXED' && selectedCustomer.defaultDiscountValue) {
        calcDisc = selectedCustomer.defaultDiscountValue;
      }
      setDiscount(calcDisc.toString());
      setIsDiscountFromProfile(calcDisc > 0);
    }
  }, [selectedCustomer, currentItems.length]);

  const handleAddItem = () => {
    if (!itemName || parseFloat(rate) <= 0 || parseFloat(quantity) <= 0) return;
    const q = parseFloat(quantity) || 0;
    const r = parseFloat(rate) || 0;
    const w = parseFloat(width) || 0;
    const h = parseFloat(height) || 0;
    const total = calculateCurrentItemTotal();
    
    const newItem: OrderItem = {
      id: Date.now().toString(),
      name: itemName,
      category: itemCategory,
      quantity: q,
      width: isItemSqFt ? w : undefined,
      height: isItemSqFt ? h : undefined,
      sqFt: isItemSqFt ? (w * h) : undefined,
      rate: r,
      total,
      paperType: itemCategory === 'Press' ? paperType : undefined,
      printSide: itemCategory === 'Press' ? printSide : undefined,
      colorMode: itemCategory === 'Press' ? colorMode : undefined,
      designLink: designLink.trim() || undefined
    };

    setCurrentItems([...currentItems, newItem]);
    setItemName(''); setWidth('0'); setHeight('0'); setQuantity('1'); setRate('0'); setDesignLink('');
  };

  const handleCreateOrder = () => {
    const { subTotal, grandTotal, dueAmount } = calculateTotals();
    let finalCust = selectedCustomer;
    if (isNewCustomerMode) {
      if (!newCustName || !newCustPhone) { alert("নাম ও ফোন দিন"); return; }
      finalCust = { id: Date.now().toString(), name: newCustName, phone: newCustPhone, address: newCustAddress };
      setCustomers(prev => [...prev, finalCust!]);
    }
    if (!finalCust || currentItems.length === 0) { alert("গ্রাহক ও অন্তত একটি পণ্য যোগ করুন"); return; }

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
      orderNote: orderNote.trim() || undefined,
      whatsappLogs: []
    };

    setOrders(prev => [newOrder, ...prev]);
    if (finalAdv > 0) addTransaction('INCOME', finalAdv, 'Order Payment', `Advance for #${newOrder.orderNumber}`, orderId);
    setView('LIST'); resetOrderState();
  };

  const resetOrderState = () => {
    setSelectedCustomer(null); setIsNewCustomerMode(false); setNewCustName(''); setNewCustPhone('');
    setCurrentItems([]); setDiscount('0'); setAdvance('0'); setOrderNote(''); setPriority('NORMAL');
  };

  const filteredOrders = smartSearch<Order>(orders, searchTerm, ['orderNumber', 'customer.name', 'customer.phone']).filter(o => 
    (filterStatus === 'ALL' || o.status === filterStatus) && 
    (filterCategory === 'ALL' || o.items.some(i => i.category === filterCategory))
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
             {/* Customer Selection */}
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

             {/* Order Summary Table/View for Mobile */}
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
                     <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">ইনভয়েস নোট (Invoice Note)</label>
                     <textarea className="w-full bg-white/5 border border-white/10 p-3 rounded-2xl text-slate-300 text-xs outline-none h-20 resize-none" value={orderNote} onChange={e => setOrderNote(e.target.value)} placeholder="বিশেষ দ্রষ্টব্য যেমন: জরুরি ডেলিভারি..."></textarea>
                   </div>
                </div>
                <div className="flex justify-between font-black text-rose-400 text-xl pt-3 border-t border-white/10">
                  <span className="text-[10px] uppercase tracking-widest self-center">নিট বকেয়া:</span>
                  <span className="text-3xl font-mono">৳{dueAmount}</span>
                </div>
                <button onClick={handleCreateOrder} className="w-full py-4 bg-cyan-600 rounded-[1.5rem] font-black text-xs uppercase tracking-widest shadow-lg hover:brightness-110 active:scale-[0.97] transition-all flex items-center justify-center gap-2">অর্ডার কনফার্ম করুন <Zap size={14} /></button>
             </div>
          </div>

          <div className="lg:col-span-8 space-y-6">
             {/* Add Item Form */}
             <div className="bg-white p-5 sm:p-7 rounded-[2.5rem] border border-slate-100 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                   <div className="md:col-span-2">
                      <label className={labelClass}>পণ্যের বিবরণ/নাম</label>
                      <input type="text" className={inputClass} value={itemName} onChange={e => setItemName(e.target.value)} placeholder="যেমন: ৫'x২' স্টার ফ্লেক্স প্রিন্ট" />
                   </div>
                   <div>
                      <label className={labelClass}>ক্যাটাগরি</label>
                      <select className={inputClass} value={itemCategory} onChange={e => setItemCategory(e.target.value)}>
                         {customCategories.map(c => <option key={c} value={c}>{c}</option>)}
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
                         <div><label className={labelClass}>কাগজের ধরন</label><input className={inputClass} value={paperType} onChange={e => setPaperType(e.target.value)} /></div>
                         <div><label className={labelClass}>প্রিন্ট সাইড</label><select className={inputClass} value={printSide} onChange={e => setPrintSide(e.target.value as any)}><option value="Single">Single Side</option><option value="Double">Double Side</option></select></div>
                         <div><label className={labelClass}>কালার মোড</label><select className={inputClass} value={colorMode} onChange={e => setColorMode(e.target.value as any)}><option value="Full Color">Full Color</option><option value="1 Color">1 Color</option><option value="B/W">B/W (Mono)</option></select></div>
                      </div>
                   ) : null}

                   <div className="md:col-span-2">
                      <label className={labelClass}>ডিজাইন লিংক / ফাইল পাথ (ঐচ্ছিক)</label>
                      <div className="relative">
                         <LinkIcon className="absolute left-3.5 top-3.5 text-slate-400" size={16} />
                         <input className={inputClass + " pl-11"} value={designLink} onChange={e => setDesignLink(e.target.value)} placeholder="Google Drive/File Path..." />
                      </div>
                   </div>
                   <div className="md:col-span-1">
                      <label className={labelClass}>দর (৳)</label>
                      <input type="number" className={inputClass} value={rate} onChange={e => setRate(e.target.value)} />
                   </div>
                   <div className="md:col-span-1 flex items-end">
                      <button onClick={handleAddItem} className="w-full bg-slate-900 text-white h-[50px] rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-black active:scale-[0.97] transition-all flex items-center justify-center gap-2"><Plus size={18}/> আইটেম যোগ</button>
                   </div>
                </div>

                {/* Items Preview Table */}
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
                            <tr key={item.id} className="bg-white hover:bg-slate-50/50 transition-colors">
                              <td className="px-5 py-4">
                                <p className="font-bold text-slate-800 leading-tight">{item.name}</p>
                                <div className="flex gap-2 mt-1.5 flex-wrap">
                                  <span className="text-[8px] font-black uppercase text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">[{item.category}]</span>
                                  {item.designLink && <span className="text-[8px] font-black text-cyan-600 flex items-center gap-1 border border-cyan-100 px-1.5 py-0.5 rounded"><LinkIcon size={10}/> Link</span>}
                                  {item.paperType && <span className="text-[8px] font-black text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">[{item.paperType}]</span>}
                                </div>
                              </td>
                              <td className="px-5 py-4 text-center font-bold text-slate-600">
                                {SQFT_BASED_CATEGORIES.includes(item.category) ? `${item.height}x${item.width} (${item.sqFt} sqft)` : `${item.quantity} pcs`}
                              </td>
                              <td className="px-5 py-4 text-right font-medium">৳{item.rate}</td>
                              <td className="px-5 py-4 text-right font-black text-slate-900">৳{Math.round(item.total)}</td>
                              <td className="px-5 py-4 text-right">
                                <button onClick={() => setCurrentItems(currentItems.filter((_, i) => i !== idx))} className="text-red-300 hover:text-red-500 p-2 transition-colors"><Trash2 size={18}/></button>
                              </td>
                            </tr>
                          ))}
                          {currentItems.length === 0 && <tr><td colSpan={5} className="px-6 py-14 text-center text-slate-300 italic font-medium">অর্ডারে কোনো আইটেম যোগ করা হয়নি...</td></tr>}
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
       <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">অর্ডার তালিকা</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{filteredOrders.length} টি অর্ডার পাওয়া গেছে</p>
          </div>
          <button onClick={() => setView('CREATE')} className="bg-cyan-600 text-white px-5 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-cyan-900/10 flex items-center gap-2 hover:brightness-110 active:scale-95 transition-all">
            <Plus size={18}/> নতুন অর্ডার
          </button>
       </div>

       <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 bg-slate-50/50 flex flex-col sm:flex-row gap-4">
             <div className="relative flex-1">
                <Search className="absolute left-4 top-3.5 text-slate-400" size={18} />
                <input type="text" placeholder="অর্ডার বা কাস্টমার খুঁজুন..." className="w-full pl-12 p-3.5 bg-white border border-slate-200 rounded-[1.25rem] text-sm font-medium focus:ring-4 focus:ring-cyan-500/10 outline-none transition-all shadow-sm" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
             </div>
             <div className="flex gap-2">
                <select className="bg-white border border-slate-200 px-4 py-3 rounded-2xl text-[10px] font-black uppercase text-slate-400 outline-none flex-1" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                    <option value="ALL">স্ট্যাটাস</option>
                    {Object.values(OrderStatus).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <select className="bg-white border border-slate-200 px-4 py-3 rounded-2xl text-[10px] font-black uppercase text-slate-400 outline-none flex-1" value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
                    <option value="ALL">ক্যাটাগরি</option>
                    {allAvailableCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
             </div>
          </div>

          <div className="overflow-x-auto">
             <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-400 font-black text-[10px] uppercase tracking-widest border-b border-slate-100">
                   <tr>
                     <th className="px-6 sm:px-8 py-5">অর্ডার / গ্রাহক</th>
                     <th className="px-6 py-5 text-center hidden sm:table-cell">স্ট্যাটাস</th>
                     <th className="px-6 sm:px-8 py-5 text-right">আর্থিক (৳)</th>
                     <th className="px-6 sm:px-8 py-5 text-center">ইনভয়েস</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                   {filteredOrders.map(order => (
                     <tr key={order.id} className="hover:bg-slate-50 transition-colors group">
                       <td className="px-6 sm:px-8 py-5">
                          <div className="flex items-center gap-3 sm:gap-4">
                             <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex flex-col items-center justify-center font-black transition-all ${order.priority === 'URGENT' ? 'bg-rose-500 text-white shadow-lg shadow-rose-200' : 'bg-slate-100 text-slate-500'}`}>
                                <span className="text-[7px] opacity-60">ORD</span>
                                <span className="text-xs">#{order.orderNumber.split('-').pop()}</span>
                             </div>
                             <div>
                                <p className="font-black text-slate-800 text-sm leading-tight truncate max-w-[120px] sm:max-w-none">{order.customer.name}</p>
                                <div className="flex items-center gap-1.5 mt-1 sm:hidden">
                                  <span className={`text-[7px] font-black uppercase px-1.5 py-0.5 rounded ${
                                    order.status === OrderStatus.DELIVERED ? 'bg-emerald-100 text-emerald-700' : 
                                    order.status === OrderStatus.READY ? 'bg-indigo-100 text-indigo-700' : 'bg-amber-100 text-amber-700'
                                  }`}>{order.status}</span>
                                </div>
                                <p className="hidden sm:block text-[9px] text-slate-400 font-bold mt-0.5">{order.customer.phone} • {Array.from(new Set(order.items.map(i => i.category))).join(', ')}</p>
                             </div>
                          </div>
                       </td>
                       <td className="px-6 py-5 text-center hidden sm:table-cell">
                          <span className={`text-[8px] font-black uppercase px-3 py-1 rounded-lg border transition-all ${
                            order.status === OrderStatus.DELIVERED ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 
                            order.status === OrderStatus.READY ? 'bg-indigo-100 text-indigo-700 border-indigo-200' : 'bg-amber-100 text-amber-700 border-amber-200'
                          }`}>{order.status}</span>
                       </td>
                       <td className="px-6 sm:px-8 py-5 text-right">
                          <p className="font-black text-slate-800 text-sm">৳{Math.round(order.grandTotal).toLocaleString()}</p>
                          <p className={`text-[9px] font-black mt-0.5 ${order.dueAmount > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                             {order.dueAmount > 0 ? `বকেয়া: ৳${Math.round(order.dueAmount).toLocaleString()}` : 'পরিশোধিত'}
                          </p>
                       </td>
                       <td className="px-6 sm:px-8 py-5 text-center">
                          <button onClick={() => setSelectedOrder(order)} className="p-3 text-cyan-600 bg-cyan-50 hover:bg-cyan-100 rounded-[1rem] transition-all shadow-sm"><Printer size={18} /></button>
                       </td>
                     </tr>
                   ))}
                   {filteredOrders.length === 0 && (
                     <tr><td colSpan={4} className="px-8 py-20 text-center text-slate-300 font-medium italic">কোন অর্ডার পাওয়া যায়নি</td></tr>
                   )}
                </tbody>
             </table>
          </div>
       </div>

       {/* INVOICE MODAL - MOBILE RESPONSIVE OVERLAY */}
       {selectedOrder && (
         <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-0 sm:p-4 backdrop-blur-md no-print">
            <div className="bg-white w-full h-full sm:h-auto sm:max-w-3xl sm:rounded-[2.5rem] shadow-2xl relative flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300">
               <div className="p-5 border-b border-slate-50 flex justify-between items-center bg-white shrink-0 sticky top-0 z-10 safe-top">
                  <h3 className="text-lg font-black text-slate-800">অর্ডার ইনভয়েস</h3>
                  <div className="flex gap-2">
                     <button onClick={() => window.print()} className="bg-slate-900 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 hover:bg-black transition-all shadow-md active:scale-95">
                        <Printer size={16} /> প্রিন্ট
                     </button>
                     <button onClick={() => setSelectedOrder(null)} className="p-2 text-slate-400 hover:text-red-500 transition-colors"><X size={24}/></button>
                  </div>
               </div>
               
               <div className="flex-1 p-6 sm:p-10 bg-white overflow-y-auto print-area safe-bottom">
                  <div className="space-y-8">
                     <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-b-2 border-slate-900 pb-6">
                        <div className="flex gap-4 items-center">
                           <div className="w-16 h-16 bg-slate-900 text-white rounded-2xl flex items-center justify-center font-black text-2xl overflow-hidden shadow-xl">
                              {settings.logoUrl ? <img src={settings.logoUrl} className="w-full h-full object-cover"/> : settings.logoText}
                           </div>
                           <div>
                              <h2 className="text-2xl font-black text-slate-900 tracking-tight">{settings.softwareName}</h2>
                              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none">{settings.invoiceHeader}</p>
                           </div>
                        </div>
                        <div className="text-left sm:text-right w-full sm:w-auto">
                           <h1 className="text-4xl font-black text-slate-900 mb-1 leading-none">INVOICE</h1>
                           <p className="font-bold text-slate-500 text-xs tracking-widest uppercase">Invoice No: #{selectedOrder.orderNumber}</p>
                        </div>
                     </div>

                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                        <div>
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5"><FileText size={12}/> গ্রাহকের তথ্য</p>
                           <h4 className="font-black text-slate-800 text-xl">{selectedOrder.customer.name}</h4>
                           <p className="text-sm font-bold text-slate-600 mt-1 flex items-center gap-1.5"><Phone size={14} className="text-slate-400"/> {selectedOrder.customer.phone}</p>
                           {selectedOrder.customer.address && <p className="text-sm text-slate-500 mt-1 flex items-center gap-1.5"><MapPin size={14} className="text-slate-400"/> {selectedOrder.customer.address}</p>}
                        </div>
                        <div className="sm:text-right">
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">অর্ডার তথ্য</p>
                           <p className="text-sm font-bold text-slate-800">অর্ডার তারিখ: {new Date(selectedOrder.orderDate).toLocaleDateString('bn-BD')}</p>
                           <p className={`text-[10px] font-black uppercase mt-1.5 px-3 py-1 rounded-full border inline-block ${selectedOrder.priority === 'URGENT' ? 'bg-rose-50 text-rose-500 border-rose-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                             Priority: {selectedOrder.priority}
                           </p>
                        </div>
                     </div>

                     <div className="border border-slate-200 rounded-[2rem] overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs text-left">
                             <thead className="bg-slate-900 text-white font-black uppercase text-[10px] tracking-widest">
                                <tr>
                                   <th className="px-6 py-4">বিবরণ (Description)</th>
                                   <th className="px-6 py-4 text-center">মাপ/Qty</th>
                                   <th className="px-6 py-4 text-right">দর</th>
                                   <th className="px-6 py-4 text-right">মোট</th>
                                </tr>
                             </thead>
                             <tbody className="divide-y divide-slate-100">
                                {selectedOrder.items.map((item, idx) => (
                                   <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                      <td className="px-6 py-5">
                                         <p className="font-black text-slate-800 text-sm leading-tight">{item.name}</p>
                                         <div className="flex flex-wrap gap-2 mt-2 text-[8px] font-black text-slate-400 uppercase tracking-wider">
                                            <span className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">{item.category}</span>
                                            {item.colorMode && <span>• {item.colorMode}</span>}
                                            {item.paperType && <span>• {item.paperType}</span>}
                                            {item.printSide && <span className="text-indigo-600">• {item.printSide} Side</span>}
                                         </div>
                                      </td>
                                      <td className="px-6 py-5 text-center font-black text-slate-600">
                                         {SQFT_BASED_CATEGORIES.includes(item.category) ? `${item.height}x${item.width} (${item.sqFt} sqft)` : `${item.quantity} pcs`}
                                      </td>
                                      <td className="px-6 py-5 text-right font-bold text-slate-500">৳{item.rate}</td>
                                      <td className="px-6 py-5 text-right font-black text-slate-900 text-base">৳{Math.round(item.total)}</td>
                                   </tr>
                                ))}
                             </tbody>
                          </table>
                        </div>
                     </div>

                     <div className="flex flex-col sm:flex-row justify-between items-start gap-8">
                        <div className="flex-1 w-full">
                           {selectedOrder.orderNote && (
                              <div className="p-5 bg-slate-50 border border-slate-100 rounded-3xl shadow-inner">
                                 <h5 className="text-[10px] font-black text-slate-400 uppercase mb-2 flex items-center gap-2"><FileText size={12}/> বিশেষ দ্রষ্টব্য:</h5>
                                 <p className="text-sm text-slate-600 leading-relaxed font-medium italic">"{selectedOrder.orderNote}"</p>
                              </div>
                           )}
                        </div>
                        <div className="w-full sm:w-72 space-y-4">
                           <div className="flex justify-between text-slate-500 font-bold text-[10px] uppercase tracking-widest">
                              <span>মোট বিল:</span>
                              <span className="font-mono">৳{Math.round(selectedOrder.subTotal)}</span>
                           </div>
                           <div className="flex justify-between text-slate-500 font-bold text-[10px] uppercase tracking-widest">
                              <span>ডিসকাউন্ট:</span>
                              <span className="font-mono">- ৳{Math.round(selectedOrder.discount)}</span>
                           </div>
                           <div className="flex justify-between border-t-2 border-slate-900 pt-4 text-slate-900 font-black text-2xl">
                              <span className="text-xs self-center uppercase tracking-widest">সর্বমোট:</span>
                              <span className="font-mono">৳{Math.round(selectedOrder.grandTotal)}</span>
                           </div>
                           <div className="flex justify-between text-emerald-600 font-black text-[10px] uppercase tracking-widest">
                              <span>পরিশোধিত:</span>
                              <span className="font-mono">৳{Math.round(selectedOrder.paidAmount)}</span>
                           </div>
                           <div className="flex justify-between text-rose-600 font-black uppercase bg-rose-50 p-4 rounded-3xl border border-rose-100 shadow-sm">
                              <span className="text-[10px] self-center tracking-widest">বকেয়া (Due):</span>
                              <span className="text-2xl font-mono">৳{Math.round(selectedOrder.dueAmount)}</span>
                           </div>
                        </div>
                     </div>

                     <div className="mt-12 pt-10 border-t-2 border-dashed border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-8">
                        <div className="space-y-4 w-full sm:w-auto">
                           <div className="flex gap-4 items-center">
                              <div className="w-11 h-11 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 border border-slate-100"><Phone size={22} /></div>
                              <div>
                                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">যোগাযোগ</p>
                                 <p className="text-sm font-black text-slate-800">+৮৮ ০১৭১১-২২২৩৩৩</p>
                              </div>
                           </div>
                           <div className="flex gap-4 items-center">
                              <div className="w-11 h-11 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 border border-slate-100"><MapPin size={22} /></div>
                              <div>
                                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ঠিকানা</p>
                                 <p className="text-xs font-bold text-slate-800">ঢাকা, বাংলাদেশ</p>
                              </div>
                           </div>
                        </div>
                        <div className="text-center space-y-3">
                           <div className="p-4 bg-white border-2 border-slate-50 rounded-[2rem] shadow-xl inline-block transform hover:scale-105 transition-transform">
                              <img src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(selectedOrder.orderNumber)}`} alt="QR" className="w-20 h-20 opacity-90"/>
                           </div>
                           <p className="text-[9px] font-black uppercase text-slate-400 tracking-[0.2em]">Scan to Verify</p>
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

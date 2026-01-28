
import React, { useState, useMemo } from 'react';
import { Purchase, PurchaseItem, InventoryItem } from '../types';
import { Plus, Search, ShoppingBag, Trash2, Download, X, Package, Truck, Calendar, History, AlertCircle, Info, ChevronRight, Tag, ShieldAlert } from 'lucide-react';
import { exportToCSV } from '../utils/csvExport';
import { smartSearch } from '../utils/searchUtils';

interface PurchaseManagerProps {
  purchases: Purchase[];
  setPurchases: React.Dispatch<React.SetStateAction<Purchase[]>>;
  inventory: InventoryItem[];
  setInventory: React.Dispatch<React.SetStateAction<InventoryItem[]>>;
  addTransaction: (type: 'INCOME' | 'EXPENSE', amount: number, category: string, description: string) => void;
}

const PurchaseManager: React.FC<PurchaseManagerProps> = ({ purchases, setPurchases, inventory, setInventory, addTransaction }) => {
  const [view, setView] = useState<'LIST' | 'CREATE'>('LIST');
  const [searchTerm, setSearchTerm] = useState('');
  
  // New Purchase Form State
  const [supplierName, setSupplierName] = useState('');
  const [dueDate, setDueDate] = useState<string>('');
  const [currentItems, setCurrentItems] = useState<PurchaseItem[]>([]);
  const [paidAmount, setPaidAmount] = useState<number>(0);

  // Current Item Form
  const [isAddingNewInventory, setIsAddingNewInventory] = useState(false);
  const [selectedInventoryId, setSelectedInventoryId] = useState('');
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('Raw Material');
  const [newItemUnit, setNewItemUnit] = useState('Pcs');
  const [itemQuantity, setItemQuantity] = useState<number>(0);
  const [itemUnitPrice, setItemUnitPrice] = useState<number>(0);

  // History State
  const [historyItem, setHistoryItem] = useState<InventoryItem | null>(null);

  const inputClass = "w-full p-2.5 border border-slate-300 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-cyan-500 outline-none placeholder:text-slate-400 transition-all";
  const labelClass = "block text-sm font-bold text-slate-700 mb-1.5";

  const isOverdue = (purchase: Purchase) => {
    if (purchase.dueAmount <= 0 || !purchase.dueDate) return false;
    return new Date(purchase.dueDate) < new Date();
  };

  const overdueCount = useMemo(() => purchases.filter(isOverdue).length, [purchases]);
  const totalPurchaseValue = useMemo(() => purchases.reduce((acc, p) => acc + p.totalAmount, 0), [purchases]);

  const handleAddItem = () => {
    if (isAddingNewInventory) {
      if (!newItemName || itemQuantity <= 0 || itemUnitPrice <= 0) {
        alert("পণ্যের নাম, পরিমাণ এবং দর সঠিক ভাবে দিন।");
        return;
      }
      
      const tempId = `NEW_${Date.now()}`;
      const newItem: PurchaseItem = {
        inventoryItemId: tempId,
        name: newItemName,
        quantity: itemQuantity,
        unitPrice: itemUnitPrice,
        total: itemQuantity * itemUnitPrice
      };
      
      setCurrentItems([...currentItems, { ...newItem, category: newItemCategory, unit: newItemUnit } as any]);
      setNewItemName('');
      setItemQuantity(0);
      setItemUnitPrice(0);
      setIsAddingNewInventory(false);
    } else {
      if (!selectedInventoryId || itemQuantity <= 0 || itemUnitPrice <= 0) return;
      const invItem = inventory.find(i => i.id === selectedInventoryId);
      if (!invItem) return;

      const newItem: PurchaseItem = {
        inventoryItemId: invItem.id,
        name: invItem.name,
        quantity: itemQuantity,
        unitPrice: itemUnitPrice,
        total: itemQuantity * itemUnitPrice
      };

      setCurrentItems([...currentItems, newItem]);
      setSelectedInventoryId('');
      setItemQuantity(0);
      setItemUnitPrice(0);
    }
  };

  const handleCreatePurchase = () => {
    if (!supplierName || currentItems.length === 0) {
      alert("সাপ্লায়ার নাম এবং অন্তত একটি আইটেম যুক্ত করুন");
      return;
    }

    const totalAmount = currentItems.reduce((acc, item) => acc + item.total, 0);
    const dueAmount = totalAmount - paidAmount;

    let updatedInventory = [...inventory];
    const finalItems: PurchaseItem[] = currentItems.map(item => {
      if (item.inventoryItemId.startsWith('NEW_')) {
        const newInvId = Date.now().toString() + Math.random().toString(36).substr(2, 5);
        const newItem: InventoryItem = {
          id: newInvId,
          name: item.name,
          category: (item as any).category || 'Raw Material',
          quantity: item.quantity,
          unit: (item as any).unit || 'Pcs',
          unitPrice: item.unitPrice,
          alertLevel: 5
        };
        updatedInventory.push(newItem);
        return {
          inventoryItemId: newInvId,
          name: item.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.total
        };
      } else {
        const idx = updatedInventory.findIndex(i => i.id === item.inventoryItemId);
        if (idx !== -1) {
          updatedInventory[idx] = {
            ...updatedInventory[idx],
            quantity: updatedInventory[idx].quantity + item.quantity,
            unitPrice: item.unitPrice
          };
        }
        return item;
      }
    });

    const newPurchase: Purchase = {
      id: Date.now().toString(),
      purchaseNumber: `PUR-${new Date().getFullYear()}-${purchases.length + 1001}`,
      supplierName,
      items: finalItems,
      totalAmount,
      paidAmount,
      dueAmount,
      date: new Date().toISOString(),
      dueDate: dueDate || undefined
    };

    setPurchases([newPurchase, ...purchases]);
    setInventory(updatedInventory);

    if (paidAmount > 0) {
      addTransaction('EXPENSE', paidAmount, 'Raw Materials', `${supplierName} থেকে ক্রয় (Inv: ${newPurchase.purchaseNumber})`);
    }

    setView('LIST');
    setSupplierName('');
    setDueDate('');
    setCurrentItems([]);
    setPaidAmount(0);
  };

  const filteredPurchases = smartSearch<Purchase>(purchases, searchTerm, ['purchaseNumber', 'supplierName']);

  const getHistory = (itemId: string) => {
    return purchases
      .filter(p => p.items.some(i => i.inventoryItemId === itemId))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  if (view === 'CREATE') {
    const totalAmount = currentItems.reduce((acc, item) => acc + item.total, 0);
    return (
      <div className="p-6 max-w-5xl mx-auto bg-white rounded-xl shadow-lg border border-slate-200 animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <ShoppingBag className="text-cyan-600" /> নতুন ক্রয় এন্ট্রি
          </h2>
          <button onClick={() => setView('LIST')} className="text-slate-400 hover:text-red-500 font-medium transition-colors">বাতিল</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-6">
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-500 mb-4">সাপ্লায়ার ও পেমেন্ট তথ্য</h3>
              <div className="space-y-4">
                <div>
                  <label className={labelClass}>সাপ্লায়ারের নাম</label>
                  <input type="text" className={inputClass} value={supplierName} onChange={e => setSupplierName(e.target.value)} placeholder="যেমন: মেঘনা ট্রেডার্স" />
                </div>
                <div>
                  <label className={labelClass}>পেমেন্ট ডিউ ডেট (বকেয়া থাকলে)</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 text-slate-400" size={16} />
                    <input type="date" className={inputClass + " pl-10"} value={dueDate} onChange={e => setDueDate(e.target.value)} />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 p-6 rounded-2xl text-white shadow-xl">
               <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">ক্রয় সারাংশ</h3>
               <div className="space-y-4">
                  <div className="flex justify-between border-b border-white/10 pb-2">
                    <span className="text-slate-400">সাব-টোটাল:</span>
                    <span className="font-bold">৳{totalAmount}</span>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">পরিশোধিত টাকা (Paid)</label>
                    <input 
                      type="number" 
                      className="w-full bg-white/10 border border-white/20 rounded-lg p-2 font-black text-cyan-400 outline-none focus:ring-1 focus:ring-cyan-500" 
                      value={paidAmount} 
                      onChange={e => setPaidAmount(Number(e.target.value))} 
                    />
                  </div>
                  <div className="flex justify-between text-red-400 font-black text-lg pt-2">
                    <span>বকেয়া (Due):</span>
                    <span>৳{totalAmount - paidAmount}</span>
                  </div>
                  <button 
                    onClick={handleCreatePurchase}
                    className="w-full bg-cyan-600 hover:bg-cyan-700 py-3 rounded-xl font-bold transition-all shadow-lg mt-4"
                  >
                    ক্রয় সম্পন্ন করুন
                  </button>
               </div>
            </div>
          </div>

          <div className="md:col-span-2 space-y-6">
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
               <div className="flex justify-between items-center mb-4">
                 <h3 className="text-sm font-black uppercase tracking-widest text-slate-500">আইটেম যুক্ত করুন</h3>
                 <button 
                  onClick={() => setIsAddingNewInventory(!isAddingNewInventory)}
                  className="text-xs font-black uppercase tracking-widest text-cyan-600 hover:underline"
                 >
                   {isAddingNewInventory ? "বিদ্যমান তালিকা থেকে নিন" : "+ নতুন পণ্য যোগ করুন"}
                 </button>
               </div>

               {isAddingNewInventory ? (
                 <div className="space-y-4 animate-in fade-in duration-200">
                    <div className="grid grid-cols-2 gap-4">
                       <div>
                         <label className={labelClass}>নতুন পণ্যের নাম</label>
                         <input type="text" className={inputClass} value={newItemName} onChange={e => setNewItemName(e.target.value)} placeholder="যেমন: নতুন ফ্লেক্স রল" />
                       </div>
                       <div>
                         <label className={labelClass}>ক্যাটাগরি</label>
                         <input list="cats" className={inputClass} value={newItemCategory} onChange={e => setNewItemCategory(e.target.value)} />
                         <datalist id="cats">
                           <option value="Raw Material" />
                           <option value="Product" />
                           <option value="Ink" />
                         </datalist>
                       </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                       <div>
                         <label className={labelClass}>ইউনিট</label>
                         <select className={inputClass} value={newItemUnit} onChange={e => setNewItemUnit(e.target.value)}>
                           <option value="Pcs">Pcs</option>
                           <option value="Roll">Roll</option>
                           <option value="Liter">Liter</option>
                         </select>
                       </div>
                       <div>
                         <label className={labelClass}>পরিমাণ</label>
                         <input type="number" className={inputClass} value={itemQuantity} onChange={e => setItemQuantity(Number(e.target.value))} />
                       </div>
                       <div>
                         <label className={labelClass}>ক্রয় মূল্য (৳)</label>
                         <input type="number" className={inputClass} value={itemUnitPrice} onChange={e => setItemUnitPrice(Number(e.target.value))} />
                       </div>
                    </div>
                 </div>
               ) : (
                 <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-in fade-in duration-200">
                    <div className="md:col-span-2">
                      <label className={labelClass}>পণ্য নির্বাচন করুন</label>
                      <select className={inputClass} value={selectedInventoryId} onChange={e => setSelectedInventoryId(e.target.value)}>
                        <option value="">নির্বাচন করুন</option>
                        {inventory.map(item => (
                          <option key={item.id} value={item.id}>{item.name} ({item.unit})</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>পরিমাণ</label>
                      <input type="number" className={inputClass} value={itemQuantity} onChange={e => setItemQuantity(Number(e.target.value))} />
                    </div>
                    <div>
                      <label className={labelClass}>দর (৳)</label>
                      <input type="number" className={inputClass} value={itemUnitPrice} onChange={e => setItemUnitPrice(Number(e.target.value))} />
                    </div>
                 </div>
               )}
               
               <button 
                onClick={handleAddItem}
                className="mt-4 bg-white border border-slate-300 text-slate-700 font-bold px-6 py-2 rounded-lg hover:bg-slate-100 flex items-center gap-2 transition-all active:scale-95 shadow-sm"
               >
                 <Plus size={18} /> তালিকায় যোগ করুন
               </button>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
               <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-slate-400 font-black text-[10px] uppercase tracking-widest">
                    <tr>
                      <th className="px-6 py-4">বিবরণ</th>
                      <th className="px-6 py-4 text-center">পরিমাণ</th>
                      <th className="px-6 py-4 text-right">দর</th>
                      <th className="px-6 py-4 text-right">মোট</th>
                      <th className="px-6 py-4 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {currentItems.map((item, idx) => (
                      <tr key={idx}>
                        <td className="px-6 py-4 font-bold text-slate-800">
                          {item.name}
                          {item.inventoryItemId.startsWith('NEW_') && <span className="ml-2 text-[8px] bg-yellow-100 text-yellow-600 px-1 rounded uppercase font-black">New</span>}
                        </td>
                        <td className="px-6 py-4 text-center">{item.quantity}</td>
                        <td className="px-6 py-4 text-right">৳{item.unitPrice}</td>
                        <td className="px-6 py-4 text-right font-black">৳{item.total}</td>
                        <td className="px-6 py-4 text-center">
                          <button onClick={() => setCurrentItems(currentItems.filter((_, i) => i !== idx))} className="text-red-400 hover:text-red-600 p-1"><X size={16}/></button>
                        </td>
                      </tr>
                    ))}
                    {currentItems.length === 0 && (
                      <tr><td colSpan={5} className="px-6 py-10 text-center text-slate-400 italic font-medium">আইটেম যুক্ত করুন...</td></tr>
                    )}
                  </tbody>
               </table>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Inventory History Modal */}
      {historyItem && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white p-8 rounded-3xl w-full max-w-2xl shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-cyan-50 rounded-xl flex items-center justify-center text-cyan-600">
                  <History size={20} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-800">মজুদ ইতিহাস: {historyItem.name}</h3>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">বর্তমান স্টক: {historyItem.quantity} {historyItem.unit}</p>
                </div>
              </div>
              <button onClick={() => setHistoryItem(null)} className="text-slate-400 hover:text-slate-600"><X size={24}/></button>
            </div>
            
            <div className="max-h-[400px] overflow-y-auto space-y-3">
               <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">ক্রয় ইতিহাস (Purchase History)</h4>
               {getHistory(historyItem.id).map(p => {
                 const pItem = p.items.find(i => i.inventoryItemId === historyItem.id);
                 return (
                   <div key={p.id} className="flex justify-between items-center p-4 bg-slate-50 border border-slate-100 rounded-2xl group hover:border-cyan-200 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-white rounded-xl shadow-sm text-slate-400 group-hover:text-cyan-500 transition-colors">
                          <ShoppingBag size={18} />
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">#{p.purchaseNumber}</p>
                          <p className="text-xs text-slate-500 font-medium">{p.supplierName} • {new Date(p.date).toLocaleDateString('bn-BD')}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-slate-900">+{pItem?.quantity} {historyItem.unit}</p>
                        <p className="text-[10px] text-slate-400 font-bold">@ ৳{pItem?.unitPrice}</p>
                      </div>
                   </div>
                 );
               })}
               {getHistory(historyItem.id).length === 0 && (
                 <p className="text-center py-10 text-slate-400 italic">কোন ক্রয় ইতিহাস পাওয়া যায়নি।</p>
               )}
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-black text-slate-800">ক্রয় ব্যবস্থাপনা (Purchase)</h2>
        <div className="flex gap-3">
          <button onClick={() => exportToCSV(purchases, 'Purchases')} className="bg-white border border-slate-200 text-slate-600 px-5 py-2.5 rounded-xl flex items-center gap-2 hover:bg-slate-50 transition-all shadow-sm font-medium">
            <Download size={18} /> এক্সপোর্ট CSV
          </button>
          <button onClick={() => setView('CREATE')} className="bg-cyan-600 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 hover:bg-cyan-700 transition-all shadow-lg shadow-cyan-100 font-bold">
            <Plus size={20} /> নতুন ক্রয় এন্ট্রি
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-cyan-50 text-cyan-600 rounded-2xl flex items-center justify-center">
            <ShoppingBag size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">মোট ক্রয় মূল্য</p>
            <p className="text-xl font-black text-slate-800">৳{totalPurchaseValue.toLocaleString()}</p>
          </div>
        </div>
        <div className="bg-rose-50 p-6 rounded-3xl shadow-sm border border-rose-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-rose-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-rose-200">
            <ShieldAlert size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest">ওভারডিউ (Overdue)</p>
            <p className="text-xl font-black text-rose-800">{overdueCount} টি বিল</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-100 bg-slate-50/50">
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-3.5 text-slate-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder="আইডি বা সাপ্লায়ার দিয়ে খুঁজুন..." 
              className="w-full pl-11 p-3 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-cyan-500 outline-none transition-all" 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-400 font-black text-[10px] uppercase tracking-widest">
              <tr>
                <th className="px-8 py-5">ক্রয় নং</th>
                <th className="px-8 py-5">সাপ্লায়ার</th>
                <th className="px-8 py-5">আইটেমসমূহ</th>
                <th className="px-8 py-4">তারিখ</th>
                <th className="px-8 py-4">পেমেন্ট ডিউ</th>
                <th className="px-8 py-5 text-right">মোট টাকা</th>
                <th className="px-8 py-5 text-right">বকেয়া</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPurchases.map((purchase) => {
                const overdue = isOverdue(purchase);
                return (
                  <tr key={purchase.id} className={`hover:bg-slate-50/50 transition-all group ${overdue ? 'bg-rose-50/20' : ''}`}>
                    <td className="px-8 py-5 font-black text-slate-800">
                      <div className="flex items-center gap-2">
                        #{purchase.purchaseNumber.split('-').pop()}
                        {overdue && (
                          <div className="animate-pulse" title="বকেয়া তারিখ অতিবাহিত">
                            <AlertCircle size={14} className="text-rose-500" />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="font-bold text-slate-800 flex items-center gap-2">
                        <Truck size={14} className="text-slate-400"/> {purchase.supplierName}
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex flex-wrap gap-1">
                        {purchase.items.map((i, idx) => {
                          const invItem = inventory.find(inv => inv.id === i.inventoryItemId);
                          return (
                            <button 
                              key={idx} 
                              onClick={() => invItem && setHistoryItem(invItem)}
                              className="bg-slate-100 hover:bg-cyan-100 hover:text-cyan-700 px-2 py-0.5 rounded text-[10px] font-bold text-slate-500 transition-colors flex items-center gap-1 group/item"
                            >
                              {i.name} <History size={8} className="opacity-0 group-hover/item:opacity-100 transition-opacity" />
                            </button>
                          );
                        })}
                      </div>
                    </td>
                    <td className="px-8 py-5 text-slate-500 font-medium">{new Date(purchase.date).toLocaleDateString('bn-BD')}</td>
                    <td className="px-8 py-5">
                      {purchase.dueDate ? (
                        <div className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-tighter ${overdue ? 'text-rose-600 bg-rose-50 px-2 py-1 rounded' : 'text-slate-500'}`}>
                          <Calendar size={12} /> {new Date(purchase.dueDate).toLocaleDateString('bn-BD')}
                        </div>
                      ) : (
                        <span className="text-slate-300 italic text-xs">N/A</span>
                      )}
                    </td>
                    <td className="px-8 py-5 text-right font-black text-slate-900">৳{purchase.totalAmount.toLocaleString()}</td>
                    <td className="px-8 py-5 text-right">
                      <span className={`font-black text-[10px] uppercase tracking-widest ${purchase.dueAmount > 0 ? (overdue ? 'text-rose-600 animate-pulse' : 'text-rose-400') : 'text-slate-300'}`}>
                        {purchase.dueAmount > 0 ? `৳${purchase.dueAmount.toLocaleString()}` : 'পরিশোধিত'}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {filteredPurchases.length === 0 && (
                <tr><td colSpan={7} className="px-8 py-20 text-center text-slate-400 font-medium italic">কোন ক্রয়ের তথ্য পাওয়া যায়নি</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PurchaseManager;

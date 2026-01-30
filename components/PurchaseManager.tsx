
import React, { useState, useMemo, useEffect } from 'react';
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

  // Unified Item Form State
  const [productNameInput, setProductNameInput] = useState('');
  const [itemCategory, setItemCategory] = useState('Raw Material');
  const [itemUnit, setItemUnit] = useState('Pcs');
  const [itemQuantity, setItemQuantity] = useState<number>(0);
  const [itemUnitPrice, setItemUnitPrice] = useState<number>(0);

  // History State
  const [historyItem, setHistoryItem] = useState<InventoryItem | null>(null);

  const inputClass = "w-full p-2.5 border border-slate-200 rounded-xl bg-white text-slate-800 focus:ring-4 focus:ring-cyan-500/10 outline-none placeholder:text-slate-400 transition-all text-sm shadow-sm";
  const labelClass = "block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1";

  // Check if current input matches an existing inventory item
  const existingProduct = useMemo(() => {
    return inventory.find(i => i.name.toLowerCase() === productNameInput.toLowerCase());
  }, [productNameInput, inventory]);

  const isNewProduct = productNameInput.length > 0 && !existingProduct;

  const handleAddItem = () => {
    if (!productNameInput || itemQuantity <= 0 || itemUnitPrice <= 0) {
      alert("পণ্যের নাম, পরিমাণ এবং দর সঠিক ভাবে দিন।");
      return;
    }

    const newItem: PurchaseItem = {
      inventoryItemId: existingProduct ? existingProduct.id : `NEW_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      name: productNameInput,
      quantity: itemQuantity,
      unitPrice: itemUnitPrice,
      total: itemQuantity * itemUnitPrice,
      category: isNewProduct ? itemCategory : existingProduct?.category,
      unit: isNewProduct ? itemUnit : existingProduct?.unit
    };

    setCurrentItems([...currentItems, newItem]);
    
    // Reset item form
    setProductNameInput('');
    setItemQuantity(0);
    setItemUnitPrice(0);
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

  // Helper function to check if a purchase is overdue
  const isOverdue = (purchase: Purchase) => {
    if (!purchase.dueDate || purchase.dueAmount <= 0) return false;
    return new Date(purchase.dueDate) < new Date();
  };

  // Calculated stats for the dashboard summary
  const totalPurchaseValue = purchases.reduce((acc, p) => acc + p.totalAmount, 0);
  const overdueCount = purchases.filter(isOverdue).length;

  if (view === 'CREATE') {
    const totalAmount = currentItems.reduce((acc, item) => acc + item.total, 0);
    return (
      <div className="p-4 sm:p-6 max-w-7xl mx-auto pb-24 lg:pb-6 animate-in fade-in duration-300">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl sm:text-2xl font-black text-slate-800 flex items-center gap-2">
            <ShoppingBag className="text-cyan-600" /> নতুন ক্রয় এন্ট্রি
          </h2>
          <button onClick={() => setView('LIST')} className="text-xs font-black uppercase text-slate-400 hover:text-red-500 bg-slate-100 px-4 py-2 rounded-xl transition-colors">বাতিল</button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
              <h3 className={labelClass}>সাপ্লায়ার ও পেমেন্ট তথ্য</h3>
              <div className="space-y-4">
                <div>
                  <label className={labelClass}>সাপ্লায়ারের নাম</label>
                  <input type="text" className={inputClass} value={supplierName} onChange={e => setSupplierName(e.target.value)} placeholder="যেমন: মেঘনা ট্রেডার্স" />
                </div>
                <div>
                  <label className={labelClass}>পেমেন্ট ডিউ ডেট (বকেয়া থাকলে)</label>
                  <div className="relative">
                    <Calendar className="absolute left-3.5 top-3.5 text-slate-400" size={16} />
                    <input type="date" className={inputClass + " pl-11"} value={dueDate} onChange={e => setDueDate(e.target.value)} />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 p-6 rounded-[2rem] text-white shadow-xl lg:sticky lg:top-6">
               <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">ক্রয় সারাংশ</h3>
               <div className="space-y-4">
                  <div className="flex justify-between border-b border-white/10 pb-3">
                    <span className="text-slate-400 text-xs self-center">সাব-টোটাল:</span>
                    <span className="font-black text-xl">৳{totalAmount}</span>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">পরিশোধিত টাকা (Paid)</label>
                    <input 
                      type="number" 
                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-3 font-black text-cyan-400 outline-none focus:ring-1 focus:ring-cyan-500 transition-all" 
                      value={paidAmount} 
                      onChange={e => setPaidAmount(Number(e.target.value))} 
                    />
                  </div>
                  <div className="flex justify-between text-rose-400 font-black text-lg pt-2 border-t border-white/10 mt-2">
                    <span className="text-[10px] uppercase self-center">বকেয়া (Due):</span>
                    <span className="text-2xl font-mono">৳{totalAmount - paidAmount}</span>
                  </div>
                  <button 
                    onClick={handleCreatePurchase}
                    className="w-full bg-cyan-600 hover:brightness-110 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg mt-4 active:scale-95 transition-all"
                  >
                    ক্রয় সম্পন্ন করুন
                  </button>
               </div>
            </div>
          </div>

          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
               <div className="flex justify-between items-center mb-6">
                 <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">আইটেম যুক্ত করুন</h3>
                 {isNewProduct && (
                   <span className="text-[9px] font-black uppercase bg-amber-100 text-amber-700 px-2 py-1 rounded-lg animate-pulse">নতুন পণ্য ডিটেক্ট করা হয়েছে</span>
                 )}
               </div>

               <div className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-2">
                      <label className={labelClass}>পণ্য খুঁজুন বা নাম লিখুন</label>
                      <div className="relative">
                        <Package className="absolute left-3.5 top-3.5 text-slate-400" size={16} />
                        <input 
                          list="inventory-list" 
                          className={inputClass + " pl-11"} 
                          value={productNameInput} 
                          onChange={e => setProductNameInput(e.target.value)} 
                          placeholder="পণ্যের নাম টাইপ করুন..."
                        />
                        <datalist id="inventory-list">
                          {inventory.map(item => <option key={item.id} value={item.name} />)}
                        </datalist>
                      </div>
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

                  {isNewProduct && (
                    <div className="grid grid-cols-2 gap-4 bg-amber-50/50 p-4 rounded-2xl border border-amber-100 animate-in slide-in-from-top-2">
                      <div>
                        <label className={labelClass}>ক্যাটাগরি</label>
                        <input list="purchase-cats" className={inputClass} value={itemCategory} onChange={e => setItemCategory(e.target.value)} />
                        <datalist id="purchase-cats">
                          <option value="Raw Material" /><option value="Product" /><option value="Ink" />
                        </datalist>
                      </div>
                      <div>
                        <label className={labelClass}>ইউনিট</label>
                        <select className={inputClass} value={itemUnit} onChange={e => setItemUnit(e.target.value)}>
                          <option value="Pcs">Pcs</option><option value="Roll">Roll</option><option value="Liter">Liter</option><option value="Sheet">Sheet</option>
                        </select>
                      </div>
                    </div>
                  )}
                  
                  <button 
                    onClick={handleAddItem}
                    className="bg-slate-900 text-white font-black text-[10px] uppercase tracking-widest px-6 py-3 rounded-xl hover:bg-black flex items-center gap-2 transition-all active:scale-95 shadow-sm"
                  >
                    <Plus size={18} /> তালিকায় যোগ করুন
                  </button>
               </div>
            </div>

            <div className="bg-white border border-slate-100 rounded-[2rem] overflow-hidden shadow-sm">
               <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-400 font-black text-[10px] uppercase tracking-widest">
                    <tr>
                      <th className="px-6 py-4">বিবরণ</th>
                      <th className="px-6 py-4 text-center">পরিমাণ</th>
                      <th className="px-6 py-4 text-right">দর</th>
                      <th className="px-6 py-4 text-right">মোট</th>
                      <th className="px-6 py-4 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {currentItems.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-black text-slate-800">{item.name}</span>
                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{item.category} • {item.unit}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center font-bold text-slate-600">{item.quantity}</td>
                        <td className="px-6 py-4 text-right text-slate-500">৳{item.unitPrice}</td>
                        <td className="px-6 py-4 text-right font-black text-slate-900">৳{item.total}</td>
                        <td className="px-6 py-4 text-center">
                          <button onClick={() => setCurrentItems(currentItems.filter((_, i) => i !== idx))} className="text-red-300 hover:text-red-600 p-2 transition-colors"><Trash2 size={16}/></button>
                        </td>
                      </tr>
                    ))}
                    {currentItems.length === 0 && (
                      <tr><td colSpan={5} className="px-6 py-14 text-center text-slate-300 italic font-medium">অর্ডারে কোনো আইটেম যোগ করা হয়নি...</td></tr>
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
    <div className="p-4 sm:p-6 space-y-6 pb-24 lg:pb-6 animate-in fade-in duration-500">
      {/* Inventory History Modal */}
      {historyItem && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white p-8 rounded-[2rem] w-full max-w-2xl shadow-2xl relative animate-in zoom-in duration-300">
            <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-cyan-50 rounded-xl flex items-center justify-center text-cyan-600 shadow-sm">
                  <History size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-800">মজুদ ইতিহাস: {historyItem.name}</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">বর্তমান স্টক: {historyItem.quantity} {historyItem.unit}</p>
                </div>
              </div>
              <button onClick={() => setHistoryItem(null)} className="p-2 text-slate-400 hover:text-red-500 transition-colors"><X size={24}/></button>
            </div>
            
            <div className="max-h-[400px] overflow-y-auto space-y-3 no-scrollbar pr-1">
               <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">ক্রয় ইতিহাস (Purchase History)</h4>
               {getHistory(historyItem.id).map(p => {
                 const pItem = p.items.find(i => i.inventoryItemId === historyItem.id);
                 return (
                   <div key={p.id} className="flex justify-between items-center p-4 bg-slate-50 border border-slate-100 rounded-2xl group hover:border-cyan-200 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-white rounded-xl shadow-sm text-slate-400 group-hover:text-cyan-500 transition-colors">
                          <ShoppingBag size={18} />
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">#{p.purchaseNumber.split('-').pop()}</p>
                          <p className="text-[10px] text-slate-400 font-black uppercase">{p.supplierName} • {new Date(p.date).toLocaleDateString('bn-BD')}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-emerald-600 text-sm">+{pItem?.quantity} {historyItem.unit}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Rate: ৳{pItem?.unitPrice}</p>
                      </div>
                   </div>
                 );
               })}
               {getHistory(historyItem.id).length === 0 && (
                 <p className="text-center py-10 text-slate-300 italic font-medium">কোন ক্রয় ইতিহাস পাওয়া যায়নি।</p>
               )}
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight leading-none">ক্রয় ব্যবস্থাপনা</h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2">মোট {purchases.length} টি সাপ্লাই এন্ট্রি</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => exportToCSV(purchases, 'Purchases')} className="hidden sm:flex bg-white border border-slate-200 text-slate-400 px-5 py-3 rounded-2xl items-center gap-2 hover:bg-slate-50 transition-all font-black text-[10px] uppercase tracking-widest">
            <Download size={18} /> এক্সপোর্ট
          </button>
          <button onClick={() => setView('CREATE')} className="bg-cyan-600 text-white px-5 py-3 rounded-2xl flex items-center gap-2 hover:bg-cyan-700 transition-all shadow-lg shadow-cyan-900/10 font-black text-[10px] uppercase tracking-widest">
            <Plus size={20} /> নতুন ক্রয় এন্ট্রি
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-[2rem] shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-cyan-50 text-cyan-600 rounded-2xl flex items-center justify-center">
            <ShoppingBag size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">মোট ক্রয় মূল্য</p>
            <p className="text-xl font-black text-slate-800">৳{totalPurchaseValue.toLocaleString()}</p>
          </div>
        </div>
        <div className="bg-rose-50 p-5 rounded-[2rem] shadow-sm border border-rose-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-rose-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-rose-200">
            <ShieldAlert size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest">বকেয়া বিল (Overdue)</p>
            <p className="text-xl font-black text-rose-800">{overdueCount} টি বিল</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 bg-slate-50/50 flex flex-col sm:flex-row gap-4">
           <div className="relative flex-1">
              <Search className="absolute left-4 top-3.5 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="সাপ্লায়ার বা ক্রয় নং দিয়ে খুঁজুন..." 
                className="w-full pl-12 p-3.5 bg-white border border-slate-200 rounded-2xl text-sm font-medium focus:ring-4 focus:ring-cyan-500/10 outline-none transition-all" 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
              />
           </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-400 font-black text-[10px] uppercase tracking-widest border-b border-slate-100">
              <tr>
                <th className="px-8 py-5">ক্রয় নং / সাপ্লায়ার</th>
                <th className="px-8 py-5">আইটেমসমূহ</th>
                <th className="px-8 py-5">তারিখ ও ডিউ</th>
                <th className="px-8 py-5 text-right">আর্থিক (৳)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredPurchases.map((purchase) => {
                const overdue = isOverdue(purchase);
                return (
                  <tr key={purchase.id} className={`hover:bg-slate-50 transition-all group ${overdue ? 'bg-rose-50/20' : ''}`}>
                    <td className="px-8 py-5 font-black text-slate-800">
                      <div className="flex items-center gap-3">
                         <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${overdue ? 'bg-rose-500 text-white' : 'bg-slate-900 text-white'}`}>
                            <ShoppingBag size={14} />
                         </div>
                         <div>
                            <p className="text-sm font-black">#{purchase.purchaseNumber.split('-').pop()}</p>
                            <p className="text-[9px] text-slate-400 font-bold uppercase flex items-center gap-1"><Truck size={10}/> {purchase.supplierName}</p>
                         </div>
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
                              className="bg-slate-100 hover:bg-cyan-100 hover:text-cyan-700 px-2 py-0.5 rounded text-[9px] font-black uppercase text-slate-500 transition-all flex items-center gap-1 group/item"
                            >
                              {i.name} <History size={10} className="opacity-0 group-hover/item:opacity-100 transition-opacity" />
                            </button>
                          );
                        })}
                      </div>
                    </td>
                    <td className="px-8 py-5">
                        <p className="font-bold text-slate-600">{new Date(purchase.date).toLocaleDateString('bn-BD')}</p>
                        {purchase.dueDate && (
                          <p className={`text-[9px] font-black uppercase mt-0.5 ${overdue ? 'text-rose-600 animate-pulse' : 'text-slate-400'}`}>
                            Due: {new Date(purchase.dueDate).toLocaleDateString('bn-BD')}
                          </p>
                        )}
                    </td>
                    <td className="px-8 py-5 text-right font-black">
                       <p className="text-slate-800 text-sm">৳{purchase.totalAmount.toLocaleString()}</p>
                       <p className={`text-[9px] font-black uppercase mt-0.5 ${purchase.dueAmount > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                         {purchase.dueAmount > 0 ? `বকেয়া: ৳${purchase.dueAmount.toLocaleString()}` : 'পরিশোধিত'}
                       </p>
                    </td>
                  </tr>
                );
              })}
              {filteredPurchases.length === 0 && (
                <tr><td colSpan={4} className="px-8 py-20 text-center text-slate-400 font-medium italic">কোন ক্রয়ের তথ্য পাওয়া যায়নি</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PurchaseManager;

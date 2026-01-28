
import React, { useState, useEffect } from 'react';
import { InventoryItem } from '../types';
import { Plus, Package, AlertTriangle, Edit, Trash2, Download, Coins, Search, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { exportToCSV } from '../utils/csvExport';
import { smartSearch } from '../utils/searchUtils';

interface InventoryManagerProps {
  inventory: InventoryItem[];
  setInventory: React.Dispatch<React.SetStateAction<InventoryItem[]>>;
}

const ITEMS_PER_PAGE = 10;

const InventoryManager: React.FC<InventoryManagerProps> = ({ inventory, setInventory }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Renamed 'name' to 'itemName' to avoid potential naming collisions in some browser contexts
  const [itemName, setItemName] = useState('');
  const [itemCategory, setItemCategory] = useState('Raw Material');
  const [itemQuantity, setItemQuantity] = useState('');
  const [itemUnit, setItemUnit] = useState('Pcs');
  const [itemUnitPrice, setItemUnitPrice] = useState('');
  const [itemAlertLevel, setItemAlertLevel] = useState('5');

  const inputClass = "w-full p-2.5 border border-slate-300 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-cyan-500 outline-none placeholder:text-slate-400 transition-all shadow-sm";
  const labelClass = "block text-sm font-bold text-slate-700 mb-1.5";

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newItem: InventoryItem = {
      id: editingId || Date.now().toString(),
      name: itemName,
      category: itemCategory,
      quantity: Number(itemQuantity),
      unit: itemUnit,
      unitPrice: Number(itemUnitPrice),
      alertLevel: Number(itemAlertLevel)
    };

    if (editingId) {
      setInventory(inventory.map(item => item.id === editingId ? newItem : item));
    } else {
      setInventory([...inventory, newItem]);
    }
    resetForm();
  };

  const handleEdit = (item: InventoryItem) => {
    setEditingId(item.id);
    setItemName(item.name);
    setItemCategory(item.category);
    setItemQuantity(item.quantity.toString());
    setItemUnit(item.unit);
    setItemUnitPrice(item.unitPrice.toString());
    setItemAlertLevel(item.alertLevel.toString());
    setShowModal(true);
  };

  const resetForm = () => {
    setItemName('');
    setItemCategory('Raw Material');
    setItemQuantity('');
    setItemUnit('Pcs');
    setItemUnitPrice('');
    setItemAlertLevel('5');
    setEditingId(null);
    setShowModal(false);
  };

  const filteredInventory = smartSearch<InventoryItem>(inventory, searchTerm, ['name', 'category']);
  
  const totalItems = filteredInventory.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedInventory = filteredInventory.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const totalValue = inventory.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
  const existingCategories = Array.from(new Set(inventory.map(item => item.category)));

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">স্টক / ইনভেন্টরি</h2>
        <div className="flex gap-2">
          <button onClick={() => exportToCSV(inventory, 'Inventory')} className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-slate-50 transition-all shadow-sm">
            <Download size={18} /> এক্সপোর্ট
          </button>
          <button onClick={() => setShowModal(true)} className="bg-cyan-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-cyan-700 transition-all shadow-lg shadow-cyan-100 font-bold">
            <Plus size={20} /> নতুন আইটেম
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-xl flex items-center justify-between col-span-3">
          <div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Total Stock Value</p>
            <h3 className="text-3xl font-black text-cyan-400">৳{totalValue.toLocaleString()}</h3>
          </div>
          <div className="bg-white/5 p-4 rounded-2xl">
            <Coins size={32} className="text-yellow-400 opacity-80" />
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">Alerts</p>
            <h3 className="text-3xl font-black text-red-500">{inventory.filter(i => i.quantity <= i.alertLevel).length}</h3>
          </div>
          <AlertTriangle size={32} className="text-red-100" />
        </div>
      </div>

      <div className="mb-6 relative">
        <Search className="absolute left-4 top-3.5 text-slate-400 w-5 h-5" />
        <input 
          type="text" 
          placeholder="পণ্যের নাম বা ক্যাটাগরি দিয়ে সার্চ করুন..." 
          className="w-full pl-12 p-3.5 border border-slate-200 rounded-2xl bg-white shadow-sm focus:ring-2 focus:ring-cyan-500 outline-none transition-all text-slate-900" 
          value={searchTerm} 
          onChange={(e) => setSearchTerm(e.target.value)} 
        />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-600">
            <thead className="bg-slate-50 text-slate-400 uppercase font-black text-[10px] tracking-widest border-b border-slate-100">
              <tr>
                <th className="px-8 py-5">পণ্যের নাম</th>
                <th className="px-8 py-5">ক্যাটাগরি</th>
                <th className="px-8 py-5 text-center">পরিমাণ</th>
                <th className="px-8 py-5 text-right">একক মূল্য</th>
                <th className="px-8 py-5 text-right">মোট মূল্য</th>
                <th className="px-8 py-5 text-center">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedInventory.map(item => (
                <tr key={item.id} className={`hover:bg-slate-50/50 transition-all ${item.quantity <= item.alertLevel ? 'bg-red-50/50' : ''}`}>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${item.quantity <= item.alertLevel ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-500'}`}>
                        <Package size={18} />
                      </div>
                      <div className="font-bold text-slate-800">
                        {item.name}
                        {item.quantity <= item.alertLevel && (
                          <span className="ml-2 inline-flex items-center gap-1 text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full animate-pulse">
                            <AlertTriangle size={10}/> Low
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{item.category}</span>
                  </td>
                  <td className="px-8 py-5 text-center font-black text-slate-900">
                    {item.quantity} <span className="text-xs font-bold text-slate-400">{item.unit}</span>
                  </td>
                  <td className="px-8 py-5 text-right font-bold text-cyan-600">৳{item.unitPrice}</td>
                  <td className="px-8 py-5 text-right font-black text-slate-900">৳{(item.quantity * item.unitPrice).toLocaleString()}</td>
                  <td className="px-8 py-5 text-center">
                    <div className="flex justify-center gap-2">
                      <button onClick={() => handleEdit(item)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"><Edit size={18} /></button>
                      <button onClick={() => setInventory(inventory.filter(i => i.id !== item.id))} className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={18} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredInventory.length === 0 && (
                <tr><td colSpan={6} className="px-8 py-20 text-center text-slate-400 font-medium italic">কোন তথ্য পাওয়া যায়নি</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="p-5 border-t border-slate-100 bg-slate-50/30 flex items-center justify-between">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
              Showing {startIndex + 1}-{Math.min(startIndex + ITEMS_PER_PAGE, totalItems)} of {totalItems} items
            </p>
            <div className="flex gap-2">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 border border-slate-200 rounded-lg hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-all text-slate-600"
              >
                <ChevronLeft size={18} />
              </button>
              <div className="flex items-center px-4 bg-white border border-slate-200 rounded-lg text-xs font-black text-slate-700">
                Page {currentPage} of {totalPages}
              </div>
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 border border-slate-200 rounded-lg hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-all text-slate-600"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white p-8 rounded-2xl w-full max-w-lg shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-2">
              <h3 className="text-2xl font-black text-slate-800">{editingId ? 'আইটেম আপডেট করুন' : 'নতুন আইটেম যুক্ত করুন'}</h3>
              <button onClick={resetForm} className="text-slate-400 hover:text-red-500 transition-colors"><X size={24}/></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className={labelClass}>পণ্যের নাম</label>
                <input 
                  type="text" 
                  required 
                  className={inputClass} 
                  value={itemName} 
                  onChange={(e) => setItemName(e.target.value)} 
                  placeholder="যেমন: স্টার ফ্লেক্স মিডিয়া" 
                />
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className={labelClass}>ক্যাটাগরি</label>
                  <input 
                    type="text"
                    list="category-suggestions"
                    required
                    className={inputClass} 
                    value={itemCategory} 
                    onChange={e => setItemCategory(e.target.value)} 
                    placeholder="যেমন: কাঁচামাল" 
                  />
                  <datalist id="category-suggestions">
                    <option value="Raw Material" />
                    <option value="Product" />
                    <option value="Ink" />
                    <option value="Gift Item" />
                    {existingCategories.map(cat => (
                      <option key={cat} value={cat} />
                    ))}
                  </datalist>
                </div>
                <div>
                   <label className={labelClass}>একক (Unit)</label>
                   <select className={inputClass} value={itemUnit} onChange={e => setItemUnit(e.target.value)}>
                    <option value="Pcs">Pcs</option>
                    <option value="Roll">Roll</option>
                    <option value="Liter">Liter</option>
                    <option value="SqFt">SqFt</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-5">
                <div>
                  <label className={labelClass}>পরিমাণ</label>
                  <input type="number" required className={inputClass} value={itemQuantity} onChange={e => setItemQuantity(e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>প্রতি এককের দাম</label>
                  <input type="number" required className={inputClass} value={itemUnitPrice} onChange={e => setItemUnitPrice(e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>সতর্কতা লেভেল</label>
                  <input type="number" required className={inputClass} value={itemAlertLevel} onChange={e => setItemAlertLevel(e.target.value)} />
                </div>
              </div>
              <div className="flex gap-4 pt-6">
                <button type="button" onClick={resetForm} className="flex-1 bg-white border border-slate-300 text-slate-700 py-3 rounded-xl font-bold hover:bg-slate-50 transition-all">বাতিল</button>
                <button type="submit" className="flex-1 bg-cyan-600 text-white py-3 rounded-xl font-bold hover:bg-cyan-700 shadow-lg shadow-cyan-200 transition-all">সংরক্ষণ</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryManager;
